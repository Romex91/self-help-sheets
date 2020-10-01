import { BackendMap } from "./BackendMap";
import _ from "lodash";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const chunkSize = 4;

// Asociates several pseudo keys with each Google Drive key.
// Reduces amount of calls to #innerBackendMap methods without changing
// its interface.
export class BackendMultiplexor extends BackendMap {
  #innerKeys = null;
  #innerBackendMap = null;

  // Each inner key contains a chunk of outer keys.
  // If innerBackendMap creates key "abcdefg", BackendMultiplexor will
  // use it to store chunk of sub-keys : "0-abcdefg", "1-abcdefg", ..., "chunkSize-abcdefg"
  //
  // Each chunk contains items {values, descriptions, md5Checksum }
  //
  // values and descriptions are arrays containing up-to chunkSize elements.
  // To get "4-abcdefg" description you should make the next call:
  // this.#chunks["abcdefg"].descriptions[4]
  //
  // md5Checksum is common for all subkeys.
  #chunks = new Map();

  constructor(innerMap) {
    super();
    if (!innerMap instanceof BackendMap)
      throw new Error(
        "CachingBackendMap have to accepts instance of BackendMap"
      );
    this.#innerBackendMap = innerMap;
  }

  async createKey() {
    if (this.#innerKeys === null) {
      throw new Error("You should call getAllKeys first");
    }

    let getLastInnerKey = () => {
      if (this.#innerKeys.length === 0) return undefined;
      return this.#innerKeys[this.#innerKeys.length - 1];
    };

    if (
      this.#innerKeys.length === 0 ||
      this.#chunks.get(getLastInnerKey()).descriptions.length >= chunkSize
    ) {
      let newInnerKey = await this.#innerBackendMap.createKey();
      this.#innerKeys.push(newInnerKey);
      this.#chunks.set(newInnerKey, {
        values: [],
        descriptions: [],
      });
    }

    let innerKey = getLastInnerKey();
    let keyPrefix = this.#chunks.get(innerKey).values.length;

    this.#chunks.get(innerKey).values.push("");
    this.#chunks.get(innerKey).descriptions[keyPrefix] = "";

    await Promise.all(
      this.#onValueChanged(innerKey),
      this.#onDescriptionChanged(innerKey)
    );

    return keyPrefix + "-" + innerKey;
  }

  async delete(key) {
    const { prefixKey, innerKey } = this.#splitOuterKey(key);
    if (!this.#chunks.has(innerKey)) return;

    this.#chunks.get(innerKey).values[prefixKey] = null;
    this.#chunks.get(innerKey).descriptions[prefixKey] = null;

    if (this.#chunks.get(innerKey).descriptions.every((x) => x === null)) {
      this.#chunks.delete(innerKey);
      this.keys.splice(this.keys.indexOf(innerKey), 1);
      await this.#innerBackendMap.delete(innerKey);
    } else {
      await Promise.all(
        this.#onValueChanged(innerKey),
        this.#onDescriptionChanged(innerKey)
      );
    }
  }

  async set(key, value) {
    const { prefixKey, innerKey } = this.#splitOuterKey(key);
    if (this.#chunks.get(innerKey).descriptions[prefixKey] === null)
      throw new Error("trying to set deleted key");

    this.#chunks.get(innerKey)[prefixKey] = value;
    await this.#onValueChanged(innerKey);
  }

  async getMd5(key) {
    const { innerKey } = this.#splitOuterKey(key);
    if (!this.#chunks.has(innerKey)) return undefined;
    return this.#chunks.get(innerKey).md5Checksum;
  }

  async get(key) {
    const { prefixKey, innerKey } = this.#splitOuterKey(key);
    if (!this.#chunks.has(innerKey)) return undefined;

    // null values means that key wasn't fetched yet.
    if (this.#chunks.get(innerKey).values == null) {
      if (this.#chunks.get(innerKey).fetchPromise == null) {
        // If there are several cuncurrent get calls. Only the first one
        // will call |#fetchChunk|.
        this.#chunks.get(innerKey).fetchPromise = this.#fetchChunk();
      }
      // All subsequent calls will wait on fetchPromise
      await this.#chunks.get(innerKey).fetchPromise;
      this.#chunks.get(innerKey).fetchPromise = null;
    }

    // Chunk may have been deleted due to format error.
    if (!this.#chunks.has(innerKey)) return undefined;

    return this.#chunks.get(innerKey)[prefixKey];
  }

  async getAllKeys() {
    let innerKeys = await this.#innerBackendMap.getAllKeys();

    let outerKeys = [];

    let newInnerKeys = [];
    let newChunks = new Map();
    innerKeys.forEach((innerKey) => {
      newInnerKeys.push(innerKey.id);
      let newChunk = { md5Checksum: innerKey.md5Checksum };
      if (
        this.#chunks.has(innerKey) &&
        this.#chunks.get(innerKey).md5Checksum === innerKey.md5Checksum
      ) {
        newChunk.values = this.#chunks.get(innerKey).values;
      }

      newChunks.set(innerKey, newChunk);
    });

    return outerKeys;
  }

  async getSettings() {}

  async setSettings(settingsContent) {}

  async setDescription(key, description) {}

  #fetchChunk = async (innerKey) => {
    try {
      let values = JSON.parse(await this.#innerBackendMap.get(innerKey));
      if (!Array.isArray(values)) {
        throw new Error("Not array");
      }
      while (values.length < this.#chunks(innerKey).descriptions.length) {
        values.push("");
      }
      this.#chunks.get(innerKey).values = values;
    } catch (error) {
      // In theory, server may contain arbitrary data.
      // BackendMultiplexor should be able recover in this case.
      console.log(error.message);
      this.#innerKeys.splice(this.#innerKeys.indexOf(innerKey), 1);
      this.#chunks.delete(innerKey);
      await this.#innerBackendMap.delete(innerKey);
    }
  };

  #onValueChanged = async (innerKey) => {
    await this.#innerBackendMap.set(
      innerKey,
      JSON.stringify(this.#chunks.get(innerKey).values)
    );

    this.#chunks.get(
      innerKey
    ).md5Checksum = await this.#innerBackendMap.getMd5();
  };

  #onDescriptionChanged = async (innerKey) => {
    await this.#innerBackendMap.setDescription(
      innerKey,
      this.#chunks
        .get(innerKey)
        .descriptions.map((x) => (x === null ? "null" : x))
        .join(",")
    );
  };

  #splitOuterKey = (outerKey) => {
    let separator = outerKey.indexOf("-");
    let prefixKey = Number(outerKey.substring(0, separator));
    let innerKey = outerKey.substring(separator + 1);
    return { prefixKey, innerKey };
  };
}

// Handle errors and reduces frequency of calls to #innerBackendMap ;
export class ErrorHandlingDebouncer extends BackendMap {
  #innerBackendMap = null;
  constructor(innerMap) {
    super();
    if (!innerMap instanceof BackendMap)
      throw new Error(
        "CachingBackendMap have to accepts instance of BackendMap"
      );
    this.#innerBackendMap = innerMap;
  }

  #onResponceCallbacks = [];

  #pendingGetRequests = new Set();
  #pendingSetRequests = new Set();

  #handlePendingSetRequests = async () => {};

  #waitForNextResponse = async () => {
    await new Promise((resolve) => {
      this.#onResponceCallbacks.push(resolve);
    });
  };

  #onResponse = () => {
    let prevCallbacks = this.#onResponceCallbacks;
    this.#onResponceCallbacks = [];
    prevCallbacks.forEach((callbalck) => callbalck());
  };
}
