/* eslint-disable no-undef */
// These tests require a Google account with enabled 'less secure apps' option.
import { realBrowserTest } from "./realBrowserTest.js";
import { assert } from "chai";
import md5 from "md5";

realBrowserTest("GDrive.test.ts", async () => {
  const { AuthStates } = await import("./AuthClient");
  const { gdriveAuthClient } = await import("./GDriveAuthClient");

  describe("Google drive auth client", function (this: {
    timeout: (n: number) => void;
  }) {
    this.timeout(6000000);

    it("has correct status on signIn and signOut", async () => {
      assert.equal(gdriveAuthClient.state, AuthStates.LOADING);
      assert.notEqual(
        await gdriveAuthClient.waitForStateChange(),
        AuthStates.LOADING
      );

      assert.notEqual(gdriveAuthClient.state, AuthStates.LOADING);
      assert.notEqual(gdriveAuthClient.state, AuthStates.FAILED);

      if (gdriveAuthClient.state === AuthStates.SIGNED_IN) {
        const signed_out_promise = gdriveAuthClient.waitForStateChange();
        gdriveAuthClient.signOut();
        assert.equal(await signed_out_promise, AuthStates.SIGNED_OUT);
      }

      {
        const signed_in_promise = gdriveAuthClient.waitForStateChange();
        gdriveAuthClient.signIn();
        assert.equal(await signed_in_promise, AuthStates.SIGNED_IN);
      }

      {
        const signed_out_promise = gdriveAuthClient.waitForStateChange();
        gdriveAuthClient.signOut();
        assert.equal(await signed_out_promise, AuthStates.SIGNED_OUT);
      }

      {
        const signed_in_promise = gdriveAuthClient.waitForStateChange();
        gdriveAuthClient.signIn();
        assert.equal(await signed_in_promise, AuthStates.SIGNED_IN);
      }
    });
  });
});

realBrowserTest("GDrive.test.ts", async () => {
  const before = window.before;

  const { AuthStates } = await import("./AuthClient");
  const { gdriveAuthClient } = await import("./GDriveAuthClient");
  const { TestingBackendMap } = await import("./TestingBackendMap");
  const { applyQuotaSavers, BackendMultiplexor } = await import(
    "./BackendQuotaSavers/BackendMultiplexor"
  );
  const { gdriveMap: realGdriveMap } = await import("./GDriveMap");

  for (const gdriveMap of [
    realGdriveMap,
    applyQuotaSavers(realGdriveMap),
    new TestingBackendMap(),
  ]) {
    let keys: string[] = [];

    describe(
      "Google drive map PART1 " + gdriveMap.constructor.name,
      function (this: { timeout: (n: number) => void }) {
        this.timeout(6000000);
        if (gdriveMap === realGdriveMap) {
          before(async () => {
            await gdriveAuthClient.waitForStateChange();
            if (gdriveAuthClient.state !== AuthStates.SIGNED_IN) {
              gdriveAuthClient.signIn();
              assert.equal(
                await gdriveAuthClient.waitForStateChange(),
                AuthStates.SIGNED_IN
              );
            }
          });
        }

        it("creates new items", async () => {
          console.log(await gdriveMap.getAllKeys());
          keys[0] = await gdriveMap.createKey();
          keys[1] = await gdriveMap.createKey();
          await gdriveMap.set(keys[0], "foo");
          await gdriveMap.set(keys[1], "bar");
          assert.equal(await gdriveMap.get(keys[0]), "foo");
          assert.equal(await gdriveMap.get(keys[1]), "bar");
        });

        it("overrides created items", async () => {
          // should remain the same from previous test.
          assert.equal(await gdriveMap.get(keys[0]), "foo");
          assert.equal(await gdriveMap.get(keys[1]), "bar");

          await gdriveMap.set(keys[0], "bar");
          await gdriveMap.set(keys[1], "bar");
          assert.equal(await gdriveMap.get(keys[0]), "bar");
          assert.equal(await gdriveMap.get(keys[1]), "bar");
        });

        it("provides  the same md5 in getMd5 and getAll", async () => {
          if (gdriveMap instanceof BackendMultiplexor) {
            await gdriveMap.set(keys[0], "barbor");
            return;
          }

          // keys are equal before change
          const allKeysBefore = await gdriveMap.getAllKeys();
          const md5Before = await gdriveMap.getMd5(keys[0]);
          assert.equal(
            md5Before,
            allKeysBefore.find((x) => x.id === keys[0])?.md5Checksum
          );

          assert.equal(md5("bar"), md5Before);

          assert(typeof md5Before === "string" && !!md5Before);

          await gdriveMap.set(keys[0], "barbor");

          const md5after = await gdriveMap.getMd5(keys[0]);
          assert.equal(md5("barbor"), md5after);

          assert.notEqual(md5Before, md5after);
          const allKeysAfter = await gdriveMap.getAllKeys();
          assert.equal(
            md5after,
            allKeysAfter.find((x) => x.id === keys[0])?.md5Checksum
          );
        });

        it("returns undefined for not existing elements", async () => {
          assert.equal(await gdriveMap.get("666_MADE_IN_HELL_666"), undefined);
        });

        it("deletes keys", async () => {
          keys = (await gdriveMap.getAllKeys()).map((x) => x.id);

          assert.isAtLeast(keys.length, 2);
          const delete_promises = [];
          for (const key of keys) {
            assert(typeof key === "string");
            delete_promises.push(gdriveMap.delete(key));
          }
          await Promise.all(delete_promises);
          for (const key of keys) {
            assert((await gdriveMap.get(key)) === undefined);
          }

          keys = (await gdriveMap.getAllKeys()).map((x) => x.id);
          assert.equal(keys.length, 0);
        });

        it("set can be called in parallel", async () => {
          for (let i = 0; i < 10; ++i) {
            keys[i] = await gdriveMap.createKey();
          }

          await Promise.all([
            gdriveMap.set(keys[0], "foo0".repeat(100)),
            gdriveMap.set(keys[3], "bar3".repeat(100)),
            gdriveMap.set(keys[5], "bar5".repeat(100)),
            gdriveMap.set(keys[6], "bar6".repeat(1000)),
            gdriveMap.set(keys[7], "bar7".repeat(200)),
            gdriveMap.set(keys[2], "bar2".repeat(100)),
            gdriveMap.set(keys[8], "bar8".repeat(200)),
            gdriveMap.set(keys[4], "bar4".repeat(100)),
            gdriveMap.set(keys[1], "bar1".repeat(150)),
            gdriveMap.set(keys[9], "bar9".repeat(100)),
          ]);

          const fetched_keys = (await gdriveMap.getAllKeys()).map((x) => x.id);
          assert.equal(fetched_keys.length, keys.length);
          for (let i = 0; i < keys.length; i++) {
            assert.equal(fetched_keys[i], keys[i]);
          }

          assert.equal(await gdriveMap.get(keys[0]), "foo0".repeat(100));
          assert.equal(await gdriveMap.get(keys[1]), "bar1".repeat(150));
          assert.equal(await gdriveMap.get(keys[2]), "bar2".repeat(100));
          assert.equal(await gdriveMap.get(keys[3]), "bar3".repeat(100));
          assert.equal(await gdriveMap.get(keys[4]), "bar4".repeat(100));
          assert.equal(await gdriveMap.get(keys[5]), "bar5".repeat(100));
          assert.equal(await gdriveMap.get(keys[6]), "bar6".repeat(1000));
          assert.equal(await gdriveMap.get(keys[7]), "bar7".repeat(200));
          assert.equal(await gdriveMap.get(keys[8]), "bar8".repeat(200));
          assert.equal(await gdriveMap.get(keys[9]), "bar9".repeat(100));
        });

        it("has separate method for settings", async () => {
          await gdriveMap.setSettings("settings");
          assert.equal(await gdriveMap.getSettings(), "settings");
        });

        async function throwsError(f: () => Promise<unknown>) {
          let rejected = false;
          try {
            await f();
          } catch (error) {
            rejected = true;
          }
          return rejected;
        }

        it("throws error when signed out works after sign in", async () => {
          if (gdriveMap === realGdriveMap) {
            gdriveAuthClient.signOut();
            assert(
              AuthStates.SIGNED_OUT,
              await gdriveAuthClient.waitForStateChange()
            );

            assert(
              await throwsError(() => {
                return gdriveMap.get("0");
              })
            );
            assert(
              await throwsError(() => {
                return gdriveMap.getAllKeys();
              })
            );
            assert(
              await throwsError(() => {
                return gdriveMap.delete("0");
              })
            );
            assert(
              await throwsError(() => {
                return gdriveMap.getSettings();
              })
            );
            assert(
              await throwsError(() => {
                return gdriveMap.setSettings("options");
              })
            );

            gdriveAuthClient.signIn();
            assert(
              AuthStates.SIGNED_IN,
              await gdriveAuthClient.waitForStateChange()
            );
          }
          assert.equal(await gdriveMap.getSettings(), "settings");

          const fetched_keys = (await gdriveMap.getAllKeys()).map((x) => x.id);
          assert.equal(fetched_keys.length, keys.length);
          for (let i = 0; i < keys.length; i++) {
            assert.equal(fetched_keys[i], keys[i]);
          }

          await gdriveMap.delete(keys[4]);

          assert.equal(await gdriveMap.get(keys[0]), "foo0".repeat(100));
          assert.equal(await gdriveMap.get(keys[1]), "bar1".repeat(150));
          assert.equal(await gdriveMap.get(keys[2]), "bar2".repeat(100));
          assert.equal(await gdriveMap.get(keys[3]), "bar3".repeat(100));
          assert.equal(await gdriveMap.get(keys[4]), undefined);
          assert.equal(await gdriveMap.get(keys[5]), "bar5".repeat(100));
          assert.equal(await gdriveMap.get(keys[6]), "bar6".repeat(1000));
          assert.equal(await gdriveMap.get(keys[7]), "bar7".repeat(200));
          assert.equal(await gdriveMap.get(keys[8]), "bar8".repeat(200));
          assert.equal(await gdriveMap.get(keys[9]), "bar9".repeat(100));
        });

        it("sets file description", async () => {
          // setting description doesn't change md5.
          if (gdriveMap instanceof BackendMultiplexor) {
            await gdriveMap.setDescription(keys[0], "01321");
          } else {
            const md5 = await gdriveMap.getMd5(keys[0]);
            await gdriveMap.setDescription(keys[0], "01321");
            assert.equal(md5, await gdriveMap.getMd5(keys[0]));
          }

          await gdriveMap.setDescription(keys[3], "33321");
          await gdriveMap.setDescription(keys[7], "35622");
          await gdriveMap.setDescription(keys[5], "64390");

          const fetched_keys = await gdriveMap.getAllKeys();

          assert.equal(fetched_keys[0].description, "01321");
          assert.equal(fetched_keys[1].description, "");
          assert.equal(fetched_keys[2].description, "");
          assert.equal(fetched_keys[3].description, "33321");
          assert.equal(fetched_keys[4].description, "64390");
          assert.equal(fetched_keys[5].description, "");
          assert.equal(fetched_keys[6].description, "35622");
          assert.equal(fetched_keys[7].description, "");
          assert.equal(fetched_keys[8].description, "");
        });
      }
    );
  }
});

realBrowserTest("GDrive.test.ts", async () => {
  const before = window.before;
  const { AuthStates } = await import("./AuthClient");
  const { gdriveAuthClient } = await import("./GDriveAuthClient");

  const { applyQuotaSavers } = await import(
    "./BackendQuotaSavers/BackendMultiplexor"
  );

  const gdriveMap = applyQuotaSavers((await import("./GDriveMap")).gdriveMap);

  describe("Google drive map PART2", function (this: {
    timeout: (n: number) => void;
  }) {
    this.timeout(6000000);

    before(async () => {
      await gdriveAuthClient.waitForStateChange();
      if (gdriveAuthClient.state !== AuthStates.SIGNED_IN) {
        gdriveAuthClient.signIn();
        assert.equal(
          await gdriveAuthClient.waitForStateChange(),
          AuthStates.SIGNED_IN
        );
      }
    });

    it("works after browser restart", async () => {
      assert.equal(await gdriveMap.getSettings(), "settings");

      const keys = (await gdriveMap.getAllKeys()).map((x) => x.id);
      assert.equal(keys.length, 9);

      assert.equal(await gdriveMap.get(keys[0]), "foo0".repeat(100));
      assert.equal(await gdriveMap.get(keys[1]), "bar1".repeat(150));
      assert.equal(await gdriveMap.get(keys[2]), "bar2".repeat(100));
      assert.equal(await gdriveMap.get(keys[3]), "bar3".repeat(100));
      assert.equal(await gdriveMap.get(keys[4]), "bar5".repeat(100));
      assert.equal(await gdriveMap.get(keys[5]), "bar6".repeat(1000));
      assert.equal(await gdriveMap.get(keys[6]), "bar7".repeat(200));
      assert.equal(await gdriveMap.get(keys[7]), "bar8".repeat(200));
      assert.equal(await gdriveMap.get(keys[8]), "bar9".repeat(100));
    });

    it("deletes keys again", async () => {
      let keys = (await gdriveMap.getAllKeys()).map((x) => x.id);

      assert.equal(keys.length, 9);
      const delete_promises = [];
      for (const key of keys) {
        assert(typeof key === "string");
        assert(!!(await gdriveMap.get(key)));
        delete_promises.push(gdriveMap.delete(key));
      }
      await Promise.all(delete_promises);
      for (const key of keys) {
        assert((await gdriveMap.get(key)) === undefined);
      }
      keys = (await gdriveMap.getAllKeys()).map((x) => x.id);
      assert.equal(keys.length, 0);
    });
  });
});
