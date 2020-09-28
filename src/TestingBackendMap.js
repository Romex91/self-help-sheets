import { BackendMap } from "./BackendMap.js";

export class TestingBackendMap extends BackendMap {
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  #nextKeyCounter = 0;
  #map = new Map();
  #descriptions = new Map();
  #settings = "";

  async createKey() {
    await this._sleep(20);
    const newKey = (this.#nextKeyCounter++).toString();
    this.#map.set(newKey, "");
    return newKey;
  }

  async delete(key) {
    await this._sleep(20);
    this.#map.delete(key);
    this.#descriptions.delete(key);
  }

  async set(key, value) {
    await this._sleep(20);
    if (!this.#map.has(key)) {
      throw new Error("Key should be registered");
    }
    this.#map.set(key, value);

    return value;
  }

  async get(key) {
    await this._sleep(20);
    return this.#map.get(key);
  }

  #getDescription = (key) => {
    if (this.#descriptions.has(key)) return this.#descriptions.get(key);
    else return undefined;
  };

  async getAllKeys() {
    await this._sleep(20);
    return Array.from(this.#map).map((x) => ({
      description: this.#getDescription(x[0]),
      id: x[0],
      md5Checksum: x[1],
    }));
  }

  async getSettings() {
    await this._sleep(20);
    return this.#settings;
  }

  async setSettings(settingsContent) {
    await this._sleep(20);
    this.#settings = settingsContent;
  }

  async setDescription(key, description) {
    await this._sleep(20);
    this.#descriptions.set(key, description);
  }
}
