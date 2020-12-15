import { BackendMap } from "../BackendMap";

export class ErrorHandler implements BackendMap {
  constructor(private _innerBackendMap: BackendMap) {}

  async _exponentialRetry<T>(callback: (this: void) => T) {
    let retriesCount = 1;
    while (retriesCount < 10) {
      try {
        return await callback();
      } catch (error) {
        let secondsToNextRetry = 1 * 2 ** retriesCount++;
        console.error(
          `Failed running ${callback.name} : ${error.message}. Will try again after ${secondsToNextRetry} seconds.`
        );
        await this.sleep(secondsToNextRetry * 1000);
      }
    }

    throw new Error(`Failed running ${callback.name} after 10 attemts.`);
  }

  async createKey() {
    return await this._exponentialRetry(
      this._innerBackendMap.createKey.bind(this._innerBackendMap)
    );
  }

  async delete(key: string) {
    return await this._exponentialRetry(
      this._innerBackendMap.delete.bind(this._innerBackendMap, key)
    );
  }

  async set(key: string, value: string) {
    return await this._exponentialRetry(
      this._innerBackendMap.set.bind(this._innerBackendMap, key, value)
    );
  }

  async get(key: string) {
    return await this._exponentialRetry(
      this._innerBackendMap.get.bind(this._innerBackendMap, key)
    );
  }

  async getMd5(key: string) {
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

  async setSettings(settingsContent: string) {
    return await this._exponentialRetry(
      this._innerBackendMap.setSettings.bind(
        this._innerBackendMap,
        settingsContent
      )
    );
  }

  async setDescription(key: string, description: string) {
    return await this._exponentialRetry(
      this._innerBackendMap.setDescription.bind(
        this._innerBackendMap,
        key,
        description
      )
    );
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
