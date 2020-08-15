import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient.js";
import { LongStorageMap } from "./LongStorageMap.js";

class GDriveMap extends LongStorageMap {
  #settings_key = null;
  async _getSettingsKey() {
    if (this.#settings_key !== null) {
      return this.#settings_key;
    }

    let keys = await find('name = "settings.json"');
    if (keys.length === 0) {
      return await createEmptyFile("settings.json");
    }
    if (keys.length === 1) {
      return keys[0];
    }

    console.error("Illegal state. Multiple settings.json. ");
    let [firstKey, ...restKeys] = keys;

    restKeys.map((x) => deleteFile(x));
    return firstKey;
  }

  async createKey() {
    throwIfNotSignedIn();
    return await createEmptyFile("item.json");
  }

  async delete(key) {
    throwIfNotSignedIn();
    return await deleteFile(key);
  }

  async set(key, value) {
    throwIfNotSignedIn();
    await upload(key, value);
  }

  async get(key) {
    throwIfNotSignedIn();
    return await download(key);
  }

  // returns array of string keys in order of creation
  async getAllKeys() {
    throwIfNotSignedIn();
    return await find('name = "item.json"');
  }

  async getSettings() {
    throwIfNotSignedIn();
    return await download(await this._getSettingsKey());
  }

  async setSettings(settingsContent) {
    throwIfNotSignedIn();
    await upload(await this._getSettingsKey(), settingsContent);
  }
}

export const gdriveMap = new GDriveMap();
Object.seal(gdriveMap);

// PRIVATE SECTION
// Borrowed from here: https://habr.com/ru/post/440844/

function throwIfNotSignedIn() {
  if (gdriveAuthClient.state !== GDriveStates.SIGNED_IN)
    throw new Error("Incorrect state. Sign in to continue.");
}

function prom(gapiCall, argObj) {
  let stack = new Error().stack;
  return new Promise((resolve, reject) => {
    gapiCall(argObj).then(
      (resp) => {
        if (resp && (resp.status < 200 || resp.status > 299)) {
          console.log("GAPI call returned bad status", stack, resp);
          reject(resp);
        } else {
          resolve(resp);
        }
      },
      (err) => {
        console.log("GAPI call failed ", stack, err);
        reject(err);
      }
    );
  });
}

// returns fileId
async function createEmptyFile(name, mimeType) {
  const resp = await prom(window.gapi.client.drive.files.create, {
    resource: {
      name: name,
      mimeType: mimeType || "text/plain",
      parents: ["appDataFolder"],
    },
    fields: "id",
  });
  return resp.result.id;
}

async function upload(fileId, content) {
  console.assert(typeof content === "string");
  return prom(window.gapi.client.request, {
    path: `/upload/drive/v3/files/${fileId}`,
    method: "PATCH",
    params: { uploadType: "media" },
    body: content,
  });
}

async function download(fileId) {
  try {
    const resp = await prom(window.gapi.client.drive.files.get, {
      fileId: fileId,
      alt: "media",
    });

    return resp.body;
  } catch {
    return undefined;
  }
}

// returns file ids sorted by creation time
async function find(query) {
  try {
    let ret = [];
    let token;
    do {
      const resp = await prom(window.gapi.client.drive.files.list, {
        spaces: "appDataFolder",
        fields: "files(id), nextPageToken",
        pageSize: 1000,
        pageToken: token,
        orderBy: "createdTime",
        q: query,
      });
      ret = ret.concat(resp.result.files);
      token = resp.result.nextPageToken;
    } while (token);
    return ret.map((x) => x.id);
  } catch {
    return [];
  }
}

async function deleteFile(fileId) {
  try {
    await prom(window.gapi.client.drive.files.delete, {
      fileId: fileId,
    });
    return true;
  } catch (err) {
    if (err.status === 404) {
      return false;
    }
    throw err;
  }
}
