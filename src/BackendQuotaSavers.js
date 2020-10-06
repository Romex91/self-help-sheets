import { BackendMap } from "./BackendMap";
import _ from "lodash";
import md5 from "md5";
import { Mutex } from "async-mutex";

const chunkSize = 8;

export function applyQuotaSavers(backendMap) {
  return new BackendMultiplexor(new GetThrottler(new ErrorHandler(backendMap)));
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
export class BackendMultiplexor extends BackendMap {
  constructor(innerMap) {
    super();
    if (!innerMap instanceof BackendMap)
      throw new Error(
        "CachingBackendMap have to accepts instance of BackendMap"
      );
    this._innerBackendMap = innerMap;
  }

  async createKey() {
    let release = await this._changeKeysMutex.acquire();
    try {
      if (this._innerKeys === null) {
        throw new Error("You should call getAllKeys first");
      }

      let getLastInnerKey = () => {
        if (this._innerKeys.length === 0) return undefined;
        return this._innerKeys[this._innerKeys.length - 1];
      };

      if (
        this._innerKeys.length === 0 ||
        this._chunks.get(getLastInnerKey()).isFull()
      ) {
        let newInnerKey = await this._innerBackendMap.createKey();
        this._innerKeys.push(newInnerKey);
        this._chunks.set(
          newInnerKey,
          new this._Chunk({
            connector: this._createChunkConnector(newInnerKey),
          })
        );
      }

      let innerKey = getLastInnerKey();
      let keyPrefix = await this._chunks.get(innerKey).createSubKey();
      return keyPrefix + "-" + innerKey;
    } finally {
      release();
    }
  }

  async delete(key) {
    let release = await this._changeKeysMutex.acquire();
    try {
      const { prefixKey, innerKey } = this._splitOuterKey(key);
      if (!this._chunks.has(innerKey)) return;

      await this._chunks.get(innerKey).delete(prefixKey);
    } finally {
      release();
    }
  }

  async set(key, value) {
    const { prefixKey, innerKey } = this._splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return;
    this._chunks.get(innerKey).setValue(prefixKey, value);
  }

  async getMd5(key) {
    throw new Error(
      "Don't call getMd5 on this class. " +
        "Server cannot compute md5 for this item because it is multiplexed." +
        "In order to sync call |getAllKeys| and if some item has |outdated===true| call |get|."
    );
  }

  async get(key) {
    const { prefixKey, innerKey } = this._splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return undefined;
    return this._chunks.get(innerKey).getValue(prefixKey);
  }

  async getAllKeys() {
    let release = await this._changeKeysMutex.acquire();
    try {
      let newInnerKeys = await this._innerBackendMap.getAllKeys();
      let outerKeys = [];
      let newChunks = new Map();
      let counter = 0;

      newInnerKeys.forEach((innerKey) => {
        let outdated = true;
        let isFirstChunk = counter++ === 0;

        if (this._chunks.has(innerKey.id)) {
          let chunk = this._chunks.get(innerKey.id);
          newChunks.set(innerKey.id, chunk);

          outdated = chunk.onMetadataUpdate(
            innerKey.description,
            innerKey.md5Checksum
          ).outdated;
        } else {
          newChunks.set(
            innerKey.id,
            new this._Chunk({
              connector: this._createChunkConnector(innerKey.id),
              serializedDescriptions: innerKey.description,
              isFirstChunk,
            })
          );
        }
        let chunk = newChunks.get(innerKey.id);
        chunk.listSubKeys().forEach((subkey) => {
          outerKeys.push({
            id: subkey + "-" + innerKey.id,
            outdated,
            description: chunk.getDescription(subkey),
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

  async getSettings() {
    return await this._innerBackendMap.getSettings();
  }

  async setSettings(settingsContent) {
    return await this._innerBackendMap.setSettings(settingsContent);
  }

  async setDescription(key, description) {
    const { prefixKey, innerKey } = this._splitOuterKey(key);
    if (!this._chunks.has(innerKey)) return;
    this._chunks.get(innerKey).setDescription(prefixKey, description);
  }

  // PRIVATE SECTION
  _changeKeysMutex = new Mutex();

  _innerKeys = null;
  _innerBackendMap = null;

  _createChunkConnector = (innerkey) => {
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
        this._innerKeys.splice(this._innerKeys.indexOf(innerkey), 1);
        this._chunks.delete(innerkey);
        await this._innerBackendMap.delete(innerkey);
      },
    };
  };

  // Contains instances of |this._Chunk| for each key inside |this._innerKeys|.
  _chunks = new Map();

  // Each inner key contains a chunk of outer keys.
  // If innerBackendMap creates key "abcdefg", BackendMultiplexor will
  // use it to store chunk of sub-keys : "0-abcdefg", "1-abcdefg", ..., "chunkSize-abcdefg"
  //
  // To get "4-abcdefg" description you should make the next call:
  // this._chunks["abcdefg"].getDescription(4)
  //
  // md5Checksum is common for all subkeys.
  _Chunk = class {
    constructor({ connector, serializedDescriptions }) {
      this._connector = connector;
      if (serializedDescriptions === undefined) {
        this._values = Array(chunkSize).fill("");
        this._descriptions = [];
        this._isDirty = true;
      } else {
        this._serializedDescriptions = serializedDescriptions;
        this._isDirty = false;
        this._descriptions = serializedDescriptions
          .split(",")
          .map((x) => (x === "null" ? null : x));
      }
    }

    isFull() {
      return this._descriptions.length >= chunkSize;
    }

    listSubKeys() {
      let subkeys = [];
      for (let i = 0; i < this._descriptions.length && i < chunkSize; i++)
        if (this._descriptions[i] != null) subkeys.push(i);
      return subkeys;
    }

    async createSubKey() {
      this._shouldKeepOnFormatError = true;

      try {
        if (this._values == null) await this._fetchValuesSynchronised();
        if (this._values == null) return null;

        if (this.isFull())
          throw new Error("Do not call createSubKey for full chunks");

        let subkey = this._descriptions.length;
        this._descriptions.push("");
        // Just to set correct state;
        this.setDescription(subkey, "");

        return subkey;
      } finally {
        this._shouldKeepOnFormatError = false;
      }
    }

    async delete(subkey) {
      if (this._descriptions[subkey] == null)
        throw new Error("item is already deleted");
      if (this._descriptions.filter((x) => x != null).length === 1)
        await this._connector.delete();
      else this.setDescription(subkey, null);
    }

    async setValue(subkey, value) {
      if (this._values == null) await this._fetchValuesSynchronised();
      if (this._values == null) return;

      this._values[subkey] = value;
      this._isDirty = true;
      this._serializedValues = null;
      this._onValueSet();
    }

    async getValue(subkey) {
      if (this._descriptions[subkey] === null) return undefined;
      if (this._values == null) await this._fetchValuesSynchronised();
      if (this._values == null) return undefined;

      return this._values[subkey];
    }

    setDescription(subkey, description) {
      if (
        subkey >= this._descriptions.length ||
        this._descriptions[subkey] == null
      ) {
        throw new Error(
          "null description means subkey doesn't exist. Did you call createKey?"
        );
      }

      this._descriptions[subkey] = description;
      this._serializedDescriptions = null;
      this._isDirty = true;

      this._onDescriptionSet();
    }

    getDescription(subkey) {
      return this._descriptions[subkey];
    }

    onMetadataUpdate(serializedDescriptions, md5Checksum) {
      if (this._isDirty) {
        if (
          this._serializedValues != null &&
          this._serializedDescriptions != null &&
          md5(this._serializedValues) === md5Checksum &&
          this._serializedDescriptions === serializedDescriptions
        ) {
          this._isDirty = false;
          this._initialMd5Checksum = md5Checksum;
        }
        return { outdated: false };
      }

      if (this._serializedDescriptions !== serializedDescriptions) {
        this._serializedDescriptions = serializedDescriptions;

        this._descriptions = serializedDescriptions
          .split(",")
          .map((x) => (x === "null" ? null : x));
      }

      if (this._initialMd5Checksum !== md5Checksum) {
        this._serializedValues = null;
        this._values = null;
        return { outdated: true };
      }

      return { outdated: false };
    }

    // PRIVATE SECTION

    // |values| and |descriptions| are arrays containing up-to chunkSize elements.
    _values;
    _descriptions;

    // result of JSON.stringify(this.values);
    _serializedValues;
    _serializedDescriptions;

    _connector;

    // |isDirty| is set true when |set| for one of subkeys has been called.
    // In that case BackendMultiplexor will think that it has the most fresh data
    // and it will ignore updates in |getAllKeys| until it contains |md5Checksum|
    // equal to md5(this.serializedValues).
    _isDirty;

    // This is md5 checksum for values acquired from server.
    // It is used only when |isDirty| === false.
    _initialMd5Checksum;

    _onValueSet = _.debounce(() => {
      this._serializedValues = JSON.stringify(this._values);
      this._connector.setValue(this._serializedValues);
    }, 1000);

    _onDescriptionSet = _.debounce(() => {
      this._serializedDescriptions = this._descriptions
        .map((x) => (x === null ? "null" : x))
        .join(",");

      this._connector.setDescription(this._serializedDescriptions);
    }, 1000);

    _fetchValuesSynchronised = async () => {
      if (this._fetchPromise == null) {
        this._fetchPromise = this._fetchValues();
      }
      await this._fetchPromise;
      this._fetchPromise = null;
    };
    _fetchPromise = null;
    _fetchValues = async () => {
      let serializedValues = await this._connector.getValue();
      try {
        let values = JSON.parse(serializedValues);
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
        if (this._shouldKeepOnFormatError) {
          this._values = Array(chunkSize).fill("");
          this._isDirty = true;
          this._serializedValues = null;
          this._onValueSet();
        } else {
          this._connector.delete();
        }
      }
    };
  };

  _splitOuterKey = (outerKey) => {
    let separator = outerKey.indexOf("-");
    let prefixKey = Number(outerKey.substring(0, separator));
    let innerKey = outerKey.substring(separator + 1);
    return { prefixKey, innerKey };
  };
}

export class ErrorHandler extends BackendMap {
  constructor(innerMap) {
    super();
    if (!innerMap instanceof BackendMap)
      throw new Error(
        "CachingBackendMap have to accepts instance of BackendMap"
      );
    this._innerBackendMap = innerMap;
  }

  async _exponentialRetry(callback) {
    let retriesCount = 1;
    while (retriesCount < 6) {
      try {
        return await callback();
      } catch (error) {
        let secondsToNextRetry = 1 * 2 ** retriesCount++;
        console.error(
          `Failed running ${callback.name} : ${error.message}. Will try again after ${secondsToNextRetry} seconds.`
        );
        await this._sleep(secondsToNextRetry * 1000);
      }
    }

    console.error("finish retry attempts");
  }

  async createKey() {
    return await this._exponentialRetry(
      this._innerBackendMap.createKey.bind(this._innerBackendMap)
    );
  }

  async delete(key) {
    return await this._exponentialRetry(
      this._innerBackendMap.delete.bind(this._innerBackendMap, key)
    );
  }

  async set(key, value) {
    return await this._exponentialRetry(
      this._innerBackendMap.set.bind(this._innerBackendMap, key, value)
    );
  }

  async get(key) {
    return await this._exponentialRetry(
      this._innerBackendMap.get.bind(this._innerBackendMap, key)
    );
  }

  async getMd5(key) {
    return await this._exponentialRetry(
      this._innerBackendMap.getMd5.bind(this._innerBackendMap, key)
    );
  }

  async getAllKeys() {
    return await this._exponentialRetry(
      this._innerBackendMap.getAllKeys.bind(this._innerBackendMap)
    );
  }

  async getSettings() {
    return await this._exponentialRetry(
      this._innerBackendMap.getSettings.bind(this._innerBackendMap)
    );
  }

  async setSettings(settingsContent) {
    return await this._exponentialRetry(
      this._innerBackendMap.setSettings.bind(
        this._innerBackendMap,
        settingsContent
      )
    );
  }

  async setDescription(key, description) {
    return await this._exponentialRetry(
      this._innerBackendMap.setDescription.bind(
        this._innerBackendMap,
        key,
        description
      )
    );
  }

  _innerBackendMap = null;
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class GetThrottler extends BackendMap {
  _innerBackendMap = null;
  constructor(innerMap) {
    super();
    if (!innerMap instanceof BackendMap)
      throw new Error(
        "CachingBackendMap have to accepts instance of BackendMap"
      );
    this._innerBackendMap = innerMap;
  }

  createKey() {
    return this._innerBackendMap.createKey();
  }

  delete(key) {
    return this._innerBackendMap.delete(key);
  }

  set(key, value) {
    return this._innerBackendMap.set(key, value);
  }

  async get(key) {
    return await new Promise((resolve) => {
      this._pendingGetRequests.set(key, resolve);

      if (this._handlePendingRequests === null) {
        this._handlePendingRequests = async () => {
          while (true) {
            if (this._pendingGetRequests.size === 0) {
              this._handlePendingRequests = null;
              return;
            }

            let [
              key,
              callback,
            ] = this._pendingGetRequests.entries().next().value;
            this._pendingGetRequests.delete(key);
            callback(await this._innerBackendMap.get(key));
          }
        };
        this._handlePendingRequests();
      }
    });
  }

  getMd5(key) {
    return this._innerBackendMap.getMd5(key);
  }

  getAllKeys() {
    return this._innerBackendMap.getAllKeys();
  }

  getSettings() {
    return this._innerBackendMap.getSettings();
  }

  setSettings(settingsContent) {
    return this._innerBackendMap.setSettings(settingsContent);
  }

  setDescription(key, description) {
    return this._innerBackendMap.setDescription(key, description);
  }

  _pendingGetRequests = new Map();

  _handlePendingRequests = null;
}
