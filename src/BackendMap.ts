export type BackendKeyMeta = {
  id: string;
  description?: string;
  md5Checksum?: string;
};

export interface BackendMap {
  createKey(): Promise<string>;
  delete(key: string): Promise<boolean>;
  set(key: string, content: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  getMd5(key: string): Promise<string>;
  getAllKeys(): Promise<BackendKeyMeta[]>;
  getSettings(): Promise<string>;

  setSettings(settings: string): Promise<void>;
  setDescription(key: string, description: string): Promise<void>;
}
