import { gdriveAuthClient } from "./GDriveAuthClient";
import { BackendMap, BackendKeyMeta } from "./BackendMap";
import { AuthStates } from "./AuthClient";
import assert from "assert";

class GDriveMap implements BackendMap {
  private settings_key: string | null = null;

  async _getSettingsKey(): Promise<string> {
    if (this.settings_key !== null) {
      return this.settings_key;
    }

    const keys: BackendKeyMeta[] = await find('name = "settings.json"');
    if (keys.length === 0) {
      return await createEmptyFile("settings.json");
    }
    if (keys.length === 1) {
      return keys[0].id;
    }

    console.error("Invalid state. Multiple settings.json. ");
    const [firstKey, ...restKeys] = keys;

    restKeys.map((x) => deleteFile(x.id));

    return firstKey.id;
  }

  async createKey(): Promise<string> {
    throwIfNotSignedIn();
    return await createEmptyFile("item.json");
  }

  async delete(key: string): Promise<boolean> {
    throwIfNotSignedIn();
    return await deleteFile(key);
  }

  async set(key: string, value: string): Promise<void> {
    throwIfNotSignedIn();
    return await upload(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    throwIfNotSignedIn();
    const result = await download(key);
    return result;
  }

  async getMd5(key: string): Promise<string> {
    throwIfNotSignedIn();
    return await getMd5(key);
  }

  async getAllKeys() {
    throwIfNotSignedIn();
    const result = await find('name = "item.json"');
    result.forEach((element) => {
      if (!element.description) element.description = "";
    });
    return result;
  }

  async getSettings() {
    throwIfNotSignedIn();
    const settingsContent = await download(await this._getSettingsKey());
    assert(settingsContent != undefined);
    return settingsContent;
  }

  async setSettings(settingsContent: string) {
    throwIfNotSignedIn();
    await upload(await this._getSettingsKey(), settingsContent);
  }

  async setDescription(key: string, description: string) {
    throwIfNotSignedIn();
    return patchDescription(key, description);
  }
}

export const gdriveMap = new GDriveMap();
Object.seal(gdriveMap);

// PRIVATE SECTION
// Borrowed from here: https://habr.com/ru/post/440844/

function throwIfNotSignedIn() {
  if (gdriveAuthClient.state !== AuthStates.SIGNED_IN)
    throw new Error("Incorrect state. Sign in to continue.");
}

function checkHttpStatus<Response extends { status?: number }>(
  arg: Promise<Response>
): Promise<Response> {
  return arg.then((resp) => {
    if (resp && resp.status && (resp.status < 200 || resp.status > 299))
      throw resp;
    return resp;
  });
}

// returns fileId
async function createEmptyFile(name: string) {
  const result = await checkHttpStatus(
    window.gapi.client.drive.files.create({
      resource: {
        name: name,
        mimeType: "text/plain",
        parents: ["appDataFolder"],
      },
      fields: "id",
    })
  );

  if (!result.result.id)
    throw new Error(
      "GDrive created an empty file but didn't return |id| field. This shouldn't happen."
    );

  return result.result.id;
}

async function patchDescription(fileId: string, description: string) {
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify({ description }) +
    close_delim;

  await checkHttpStatus(
    window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: "PATCH",
      params: { uploadType: "multipart" },
      body: multipartRequestBody,
      headers: {
        "Content-Type": 'multipart/mixed; boundary="' + boundary + '"',
      },
    })
  );
}

async function upload(fileId: string, content: string) {
  await checkHttpStatus(
    window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: "PATCH",
      params: { uploadType: "media" },
      body: content,
    })
  );
}

async function getMd5(fileId: string) {
  const result = await checkHttpStatus(
    window.gapi.client.request({
      path: `/drive/v3/files/${fileId}`,
      method: "GET",
      params: { fields: "md5Checksum" },
    })
  );

  return result.result.md5Checksum;
}

async function download(fileId: string) {
  try {
    const resp = await checkHttpStatus(
      window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media",
      })
    );

    return resp.body;
  } catch (e) {
    if (e.status !== 404) throw e;
    return undefined;
  }
}

// returns file ids sorted by creation time
async function find(query: string): Promise<BackendKeyMeta[]> {
  let ret: BackendKeyMeta[] = [];
  let token: string | undefined;
  do {
    const resp = await checkHttpStatus(
      window.gapi.client.drive.files.list({
        spaces: "appDataFolder",
        fields: "files(id, description, md5Checksum), nextPageToken",
        pageSize: 1000,
        pageToken: token,
        orderBy: "createdTime",
        q: query,
      })
    );
    if (!resp.result.files) {
      throw new Error(
        "|gapi.client.drive.files.list| request is successful but doesn't contain |files| field."
      );
    }
    ret = ret.concat(
      resp.result.files.map(
        (x): BackendKeyMeta => {
          if (x.id && x.md5Checksum) {
            return {
              id: x.id,
              md5Checksum: x.md5Checksum,
              description: x.description,
            };
          }

          throw new Error(
            "|gapi.client.drive.files.list| request is successful but some |files| miss |id| or |md5Checksum| fields."
          );
        }
      )
    );
    token = resp.result.nextPageToken;
  } while (token);
  return ret;
}

async function deleteFile(fileId: string) {
  try {
    await checkHttpStatus(
      window.gapi.client.drive.files.delete({
        fileId: fileId,
      })
    );
    return true;
  } catch (err) {
    if (err.status === 404) {
      return false;
    }
    throw err;
  }
}
