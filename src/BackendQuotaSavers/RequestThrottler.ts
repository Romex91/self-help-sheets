import { BackendMap } from "../BackendMap";

import Bottleneck from "bottleneck";

export class RequestThrottler implements BackendMap {
  private _limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 50,
  });

  constructor(private _innerBackendMap: BackendMap) {}

  async createKey() {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.createKey()
    );
  }

  async delete(key: string) {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.delete(key)
    );
  }

  async set(key: string, value: string) {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.set(key, value)
    );
  }

  async get(key: string) {
    return await this._limiter.schedule(() => this._innerBackendMap.get(key));
  }

  async getMd5(key: string) {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getMd5(key)
    );
  }

  async getAllKeys() {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getAllKeys()
    );
  }

  async getSettings() {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getSettings()
    );
  }

  async setSettings(settingsContent: string) {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.setSettings(settingsContent)
    );
  }

  async setDescription(key: string, description: string) {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.setDescription(key, description)
    );
  }
}
