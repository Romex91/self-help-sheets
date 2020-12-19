import { BackendKeyMeta, BackendMap } from "../BackendMap";

import Bottleneck from "bottleneck";

export class RequestThrottler implements BackendMap {
  private _limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 50,
  });

  constructor(private _innerBackendMap: BackendMap) {}

  async createKey(): Promise<string> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.createKey()
    );
  }

  async delete(key: string): Promise<boolean> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.delete(key)
    );
  }

  async set(key: string, value: string): Promise<void> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.set(key, value)
    );
  }

  async get(key: string): Promise<string| undefined> {
    return await this._limiter.schedule(() => this._innerBackendMap.get(key));
  }

  async getMd5(key: string): Promise<string> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getMd5(key)
    );
  }

  async getAllKeys(): Promise<BackendKeyMeta[]> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getAllKeys()
    );
  }

  async getSettings(): Promise<string> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.getSettings()
    );
  }

  async setSettings(settingsContent: string): Promise<void> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.setSettings(settingsContent)
    );
  }

  async setDescription(key: string, description: string) : Promise<void> {
    return await this._limiter.schedule(() =>
      this._innerBackendMap.setDescription(key, description)
    );
  }
}
