import { BackendKeyMeta, BackendMap } from "./BackendMap";
import md5 from "md5";

import { EntryModel, EntryStatus } from "./EntryModel";

export async function addEntry(
  backendMap: BackendMap,
  left: string,
  right: string
): Promise<void> {
  const key = await backendMap.createKey();
  await backendMap.set(
    key,
    JSON.stringify(
      new EntryModel(key, EntryStatus.DELETED, "")
        .clear()
        .setLeft(left)
        .setRight(right).data
    )
  );
}

export class TestingBackendMap implements BackendMap {
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  _nextKeyCounter = 0;
  _map = new Map();
  _descriptions = new Map();
  _settings = "";

  async createKey(): Promise<string> {
    await this.sleep(20);
    const newKey = (this._nextKeyCounter++).toString();
    this._map.set(newKey, "");
    return newKey;
  }

  async delete(key: string): Promise<boolean> {
    await this.sleep(20);
    this._map.delete(key);
    this._descriptions.delete(key);
    return true;
  }

  async set(key: string, value: string): Promise<void> {
    await this.sleep(20);
    if (!this._map.has(key)) {
      throw new Error("Key should be registered");
    }
    this._map.set(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    await this.sleep(20);
    return this._map.get(key);
  }

  async getMd5(key: string): Promise<string> {
    await this.sleep(20);
    return md5(this._map.get(key));
  }

  private getDescription = (key: string): string => {
    if (this._descriptions.has(key)) return this._descriptions.get(key);
    else return "";
  };

  public print(): void {
    console.log(
      Array.from(this._map).map((x) => ({
        description: this.getDescription(x[0]),
        id: x[0],
        md5Checksum: md5(x[1]),
        value: this._map.get(x[0]),
      }))
    );
  }

  async getAllKeys(): Promise<BackendKeyMeta[]> {
    await this.sleep(20);

    return Array.from(this._map).map((x) => ({
      description: this.getDescription(x[0]),
      id: x[0],
      md5Checksum: md5(x[1]),
    }));
  }

  async getSettings(): Promise<string> {
    await this.sleep(20);
    return this._settings;
  }

  async setSettings(settings: string): Promise<void> {
    await this.sleep(20);
    this._settings = settings;
  }

  async setDescription(key: string, description: string): Promise<void> {
    await this.sleep(20);
    this._descriptions.set(key, description);
  }
}
