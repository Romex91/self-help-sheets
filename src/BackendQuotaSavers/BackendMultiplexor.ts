import { BackendMap, BackendKeyMeta } from "../BackendMap";
import { ErrorHandler } from "./ErrorHandler";
import { RequestThrottler } from "./RequestThrottler";

import _ from "lodash";
import md5 from "md5";
import { Mutex } from "async-mutex";

const chunkSize = 8;

export function applyQuotaSavers(backendMap: BackendMap): BackendMultiplexor {
  return new BackendMultiplexor(
    new RequestThrottler(new ErrorHandler(backendMap))
  );
}

// Asociates several pseudo keys with each Google Drive key.
// Reduces amount of calls to _innerBackendMap methods without changing
// its interface.
//
// Prevents users of this class from accessing md5 because server cannot
// compute md5 for multiplexed sub-items.
// It replaces |md5checksum| with |outdated|=true in getAllKeys result.
// |outdated| means that the server has fresher data so the client
// should call |get| for it.
export class BackendMultiplexor implements BackendMap {
  private _changeKeysMutex = new Mutex();
  private _innerKeys?: string[];

  // Contains instances of |this._Chunk| for each key inside |this._innerKeys|.
  private _chunks = new Map();

  constructor(private _innerBackendMap: BackendMap) {}

  async createKey(): Promise<string> {
    const release = await this._changeKeysMutex.acquire();
    try {
      if (this._innerKeys == undefined) {
        throw new Error("You should call getAllKeys first");
      }

      const getLastInnerKey = () => {
        if (!this._innerKeys || this._innerKeys.length === 0) return undefined;
        return this._innerKeys[this._innerKeys.length - 1];
      };

      if (
        this._innerKeys.length === 0 ||
        this._chunks.get(getLastInnerKey()).isFull()
      ) {
        const newInnerKey = await this._innerBackendMap.createKey();

        this._innerKeys.push(newInnerKey);
        this._chunks.set(
          newInnerKey,
          new Chunk(this.createChunkConnector(newInnerKey), undefined, "")
        );
      }

      const innerKey = getLastInnerKey();
      const keyPrefix = await this._chunks.get(innerKey).createSubKey();
      return keyPrefix + "-" + innerKey;
    } finally {
      release();
    }
  }

  async delete(key: string): Promise<boolean> {
    const release = await this._changeKeysMutex.acquire();
    try {
      const { prefixKey, innerKey } = this.splitOuterKey(key);
      if (!this._chunks.has(innerKey)) return false;

      return await this._chunks.get(innerKey).delete(prefixKey);
    } finally {
      release();
    }
  }

  async set(key: string, value: string): Promise<void> {
    const { prefixKey, innerKey } = this.splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return;
    this._chunks.get(innerKey).setValue(prefixKey, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMd5(_key: string): Promise<string> {
    throw new Error(
      "Don't call getMd5 on this class. " +
        "Server cannot compute md5 for this item because it is multiplexed." +
        "In order to sync call |getAllKeys| and see if some item has |outdated===true| and call |get| for them."
    );
  }

  async get(key: string): Promise<string | undefined> {
    const { prefixKey, innerKey } = this.splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return undefined;
    return this._chunks.get(innerKey).getValue(prefixKey);
  }

  async getAllKeys(): Promise<(BackendKeyMeta & { outdated: boolean })[]> {
    const release = await this._changeKeysMutex.acquire();
    try {
      const newInnerKeys = await this._innerBackendMap.getAllKeys();
      const outerKeys: (BackendKeyMeta & { outdated: boolean })[] = [];
      const newChunks: Map<string, Chunk> = new Map();

      newInnerKeys.forEach((innerKey) => {
        let outdated = true;

        if (this._chunks.has(innerKey.id)) {
          const chunk = this._chunks.get(innerKey.id);
          newChunks.set(innerKey.id, chunk);

          outdated = chunk.onMetadataUpdate(
            innerKey.description,
            innerKey.md5Checksum
          ).outdated;
        } else {
          newChunks.set(
            innerKey.id,
            new Chunk(
              this.createChunkConnector(innerKey.id),
              innerKey.description,
              innerKey.md5Checksum ?? ""
            )
          );
        }
        const chunk = newChunks.get(innerKey.id);
        chunk?.listSubKeys().forEach((subkey) => {
          outerKeys.push({
            id: subkey + "-" + innerKey.id,
            outdated,
            description: chunk?.getDescription(subkey),
          });
        });
      });

      this._chunks = newChunks;
      this._innerKeys = newInnerKeys.map((x) => x.id);

      return outerKeys;
    } finally {
      release();
    }
  }

  async getSettings(): Promise<string> {
    return await this._innerBackendMap.getSettings();
  }

  async setSettings(settingsContent: string): Promise<void> {
    const release = await this._changeKeysMutex.acquire();
    await this._innerBackendMap.setSettings(settingsContent);
    release();
  }

  async setDescription(key: string, description: string): Promise<void> {
    const { prefixKey, innerKey } = this.splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return;
    this._chunks.get(innerKey).setDescription(prefixKey, description);
  }

  private createChunkConnector(innerkey: string): ChunkConnector {
    return {
      setValue: (serializedValue) => {
        this._innerBackendMap.set(innerkey, serializedValue);
      },
      setDescription: (serializedDescription) => {
        this._innerBackendMap.setDescription(innerkey, serializedDescription);
      },
      getValue: async () => {
        return await this._innerBackendMap.get(innerkey);
      },
      delete: async () => {
        if (this._innerKeys == undefined) return false;
        this._innerKeys.splice(this._innerKeys.indexOf(innerkey), 1);
        this._chunks.delete(innerkey);
        return await this._innerBackendMap.delete(innerkey);
      },
    };
  }

  private splitOuterKey(
    outerKey: string
  ): { prefixKey: number; innerKey: string } {
    const separator = outerKey.indexOf("-");
    const prefixKey = Number(outerKey.substring(0, separator));
    const innerKey = outerKey.substring(separator + 1);
    return { prefixKey, innerKey };
  }
}

interface ChunkConnector {
  setValue(serializedValue: string): void;
  setDescription(serializedDescription: string): void;
  getValue(): Promise<string | undefined>;
  delete(): Promise<boolean>;
}

// Each inner key contains a chunk of outer keys.
// If innerBackendMap creates key "abcdefg", BackendMultiplexor will
// use it to store chunk of sub-keys : "0-abcdefg", "1-abcdefg", ..., "chunkSize-abcdefg"
//
// To get "4-abcdefg" description you should make the next call:
// this._chunks["abcdefg"].getDescription(4)
//
// md5Checksum is common for all subkeys.
class Chunk {
  // |values| and |descriptions| are arrays containing up-to chunkSize elements.
  private _values?: string[];
  private _descriptions: (string | undefined)[];

  // result of JSON.stringify(this.values);
  private _serializedValues?: string;

  // |isDirty| is set true when |set| for one of subkeys has been called.
  // In that case BackendMultiplexor will think that it has the most fresh data
  // and it will ignore updates in |getAllKeys| until it contains |md5Checksum|
  // equal to md5(this._serializedValues).
  private _isDirty: boolean;

  constructor(
    private _connector: ChunkConnector,
    private _serializedDescriptions: string | undefined,
    private _initialMd5Checksum: string
  ) {
    if (_serializedDescriptions == undefined) {
      this._values = Array(chunkSize).fill("");
      this._descriptions = [];
      this._isDirty = true;
    } else {
      this._isDirty = false;
      this._descriptions = _serializedDescriptions
        .split(",")
        .map((x) => (x === "null" ? undefined : x));
    }
  }

  isFull() {
    return this._descriptions.length >= chunkSize;
  }

  listSubKeys(): number[] {
    const subkeys = [];
    for (let i = 0; i < this._descriptions.length && i < chunkSize; i++)
      if (this._descriptions[i] != undefined) subkeys.push(i);
    return subkeys;
  }

  async createSubKey() {
    if (this._values == undefined) await this._fetchValuesSynchronised();
    if (this._values == undefined) return undefined;

    if (this.isFull())
      throw new Error("Do not call createSubKey for full chunks");

    const subkey = this._descriptions.length;
    this._descriptions.push("");
    // Just to set correct state;
    this.setDescription(subkey, "");

    return subkey;
  }

  async delete(subkey: number) {
    if (this._descriptions[subkey] == undefined)
      throw new Error("item is already deleted");

    if (this._descriptions.filter((x) => x != undefined).length === 1)
      await this._connector.delete();
    else this.setDescription(subkey, undefined);
  }

  async setValue(subkey: number, value: string) {
    if (this._values == undefined) await this._fetchValuesSynchronised();
    if (this._values == undefined) return;

    this._values[subkey] = value;
    this._isDirty = true;
    this._serializedValues = undefined;
    this.onValueSet();
  }

  async getValue(subkey: number) {
    if (this._descriptions[subkey] === undefined) return undefined;
    if (this._values == undefined) await this._fetchValuesSynchronised();
    if (this._values == undefined) return undefined;

    return this._values[subkey];
  }

  setDescription(subkey: number, description: string | undefined) {
    if (
      subkey >= this._descriptions.length ||
      this._descriptions[subkey] == undefined
    ) {
      throw new Error(
        "undefined description means subkey doesn't exist. Did you call createKey?"
      );
    }

    this._descriptions[subkey] = description;
    this._serializedDescriptions = undefined;
    this._isDirty = true;

    this.onDescriptionSet();
  }

  getDescription(subkey: number): string | undefined {
    return this._descriptions[subkey];
  }

  onMetadataUpdate(
    serializedDescriptions: string | undefined,
    md5Checksum: string
  ) {
    if (this._isDirty) {
      if (
        this._serializedValues != undefined &&
        this._serializedDescriptions != undefined &&
        md5(this._serializedValues) === md5Checksum &&
        this._serializedDescriptions === serializedDescriptions
      ) {
        this._isDirty = false;
        this._initialMd5Checksum = md5Checksum;
      }
      return { outdated: false };
    }

    if (
      this._serializedDescriptions !== serializedDescriptions &&
      serializedDescriptions != undefined
    ) {
      this._serializedDescriptions = serializedDescriptions;
      this._descriptions = serializedDescriptions
        .split(",")
        .map((x) => (x === "null" ? undefined : x));
    }

    if (this._initialMd5Checksum !== md5Checksum) {
      this._serializedValues = undefined;
      this._values = undefined;
      return { outdated: true };
    }

    return { outdated: false };
  }

  private onValueSet = _.debounce(() => {
    this._serializedValues = JSON.stringify(this._values);
    this._connector.setValue(this._serializedValues);
  }, 1000);

  private onDescriptionSet = _.debounce(() => {
    this._serializedDescriptions = this._descriptions
      .map((x) => (x == undefined ? "null" : x))
      .join(",");

    this._connector.setDescription(this._serializedDescriptions);
  }, 1000);

  private async _fetchValuesSynchronised() {
    if (this._fetchPromise == undefined) {
      this._fetchPromise = this.fetchValues().finally(() => {
        this._fetchPromise = undefined;
      });
    }
    await this._fetchPromise;
  }

  private _fetchPromise?: Promise<void>;

  private async fetchValues() {
    const serializedValues = await this._connector.getValue();
    try {
      if (!serializedValues)
        throw new Error("Bad server data. Not valid array");

      const values = JSON.parse(serializedValues);
      if (!Array.isArray(values)) {
        throw new Error("Bad server data. Not valid array");
      }

      while (values.length < this._descriptions.length) {
        values.push("");
      }
      this._values = values;
      this._serializedValues = serializedValues;
      this._initialMd5Checksum = md5(serializedValues);
      this._isDirty = false;
    } catch (error) {
      // In theory, server may contain arbitrary data.
      // BackendMultiplexor should be able recover in this case.
      console.error(
        "Bad response from server:" + error.message + " " + serializedValues
      );

      if (this._values == undefined) {
        this._isDirty = false;
        this._values = Array(chunkSize).fill(undefined);
        this._serializedValues = serializedValues;
        this._initialMd5Checksum = serializedValues
          ? md5(serializedValues)
          : "";
      }
    }
  }
}
