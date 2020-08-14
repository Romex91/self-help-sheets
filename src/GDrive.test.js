/* eslint-disable no-undef */
// These tests require a Google account with enabled 'less secure apps' option.
import {
  realBrowserTest,
  realBrowserTest_DISABLED,
} from "./realBrowserTest.js";
import { getDefaultNormalizer } from "@testing-library/react";

realBrowserTest_DISABLED("GDrive.test.js", async () => {
  let assert = window.chai.assert;
  let { gdriveAuthClient, GDriveStates } = await import(
    "./GDriveAuthClient.js"
  );

  describe("Google drive auth client", function () {
    this.timeout(6000000);

    it("has correct status on signIn and signOut", async () => {
      assert.equal(gdriveAuthClient.state, GDriveStates.LOADING);
      assert.notEqual(
        await gdriveAuthClient.getNextStateForTests(),
        GDriveStates.LOADING
      );

      assert.notEqual(gdriveAuthClient.state, GDriveStates.LOADING);
      assert.notEqual(gdriveAuthClient.state, GDriveStates.FAILED);

      if (gdriveAuthClient.state === GDriveStates.SIGNED_IN) {
        let signed_out_promise = gdriveAuthClient.getNextStateForTests();
        gdriveAuthClient.signOut();
        assert.equal(await signed_out_promise, GDriveStates.SIGNED_OUT);
      }

      {
        let signed_in_promise = gdriveAuthClient.getNextStateForTests();
        gdriveAuthClient.signIn();
        assert.equal(await signed_in_promise, GDriveStates.SIGNED_IN);
      }

      {
        let signed_out_promise = gdriveAuthClient.getNextStateForTests();
        gdriveAuthClient.signOut();
        assert.equal(await signed_out_promise, GDriveStates.SIGNED_OUT);
      }

      {
        let signed_in_promise = gdriveAuthClient.getNextStateForTests();
        gdriveAuthClient.signIn();
        assert.equal(await signed_in_promise, GDriveStates.SIGNED_IN);
      }
    });
  });
});

realBrowserTest("GDrive.test.js", async () => {
  let assert = window.chai.assert;
  let before = window.before;
  let after = window.after;
  let { gdriveAuthClient, GDriveStates } = await import(
    "./GDriveAuthClient.js"
  );
  let { gdriveMap } = await import("./GDriveMap.js");

  describe("Google drive map PART1", function () {
    this.timeout(6000000);

    before(async () => {
      await gdriveAuthClient.getNextStateForTests();
      if (gdriveAuthClient.state !== GDriveStates.SIGNED_IN) {
        gdriveAuthClient.signIn();
        assert.equal(
          await gdriveAuthClient.getNextStateForTests(),
          GDriveStates.SIGNED_IN
        );
      }
    });
    after(async () => {
      assert.equal(gdriveAuthClient.state, GDriveStates.SIGNED_IN);
      gdriveAuthClient.signOut();
      assert.equal(
        await gdriveAuthClient.getNextStateForTests(),
        GDriveStates.SIGNED_OUT
      );
    });

    it("creates new items", async () => {
      await gdriveMap.set(0, "foo");
      await gdriveMap.set(1, "bar");
      assert.equal(await gdriveMap.get(0), "foo");
      assert.equal(await gdriveMap.get(1), "bar");
    });

    it("overrides created items", async () => {
      // should remain the same from previous test.
      assert.equal(await gdriveMap.get(0), "foo");
      assert.equal(await gdriveMap.get(1), "bar");

      await gdriveMap.set(0, "bar");
      await gdriveMap.set(1, "bar");
      assert.equal(await gdriveMap.get(0), "bar");
      assert.equal(await gdriveMap.get(1), "bar");
    });

    it("returns undefined for not existing elements", async () => {
      assert.equal(await gdriveMap.get(666, undefined));
    });

    it("deletes keys", async () => {
      const map = await gdriveMap.getAll();
      assert.isAtLeast(map.size, 2);
      let delete_promises = [];
      for (let [key, value] of Object.entries(map)) {
        assert(typeof key === Number);
        assert(!!value && typeof value === "string");
        delete_promises.push(gdriveMap.delete(key));
      }
      await Promise.all(delete_promises);

      const updated_map = await gdriveMap.getAll();
      assert.equal(Object.entries(updated_map).length, 0);
    });

    it("set can be called in parallel", async () => {
      await Promise.all(
        gdriveMap.set(0, "foo".repeat(100)),
        gdriveMap.set(1, "bar".repeat(100)),
        gdriveMap.set(3, "bar1".repeat(100)),
        gdriveMap.set(11, "bar2".repeat(100)),
        gdriveMap.set(4, "bar3".repeat(100)),
        gdriveMap.set(2, "bar4".repeat(100)),
        gdriveMap.set(7, "bar5".repeat(100)),
        gdriveMap.set(9, "bar6".repeat(100)),
        gdriveMap.set(8, "bar7".repeat(100)),
        gdriveMap.set(88, "bar8".repeat(100))
      );

      const map = await gdriveMap.getAll();
      assert(
        _.isEqual(
          {
            0: "foo".repeat(100),
            1: "bar".repeat(100),
            3: "bar1".repeat(100),
            11: "bar2".repeat(100),
            4: "bar3".repeat(100),
            2: "bar4".repeat(100),
            7: "bar5".repeat(100),
            9: "bar6".repeat(100),
            8: "bar7".repeat(100),
            88: "bar8".repeat(100),
          },
          map
        )
      );
    });

    it("provides map with keys sorted numerically", async () => {
      const map = await gdriveMap.getAll();
      assert.equal(Object.entries(map).length === 10);
      let last_number = -1;
      for (let key in map) {
        assert(typeof key === "number");
        assert(key > last_number);
        last_number = key;
      }
    });

    it("has separate method for settings", async () => {
      await gdriveMap.setSettings("settings");
      assert.equal(await gdriveMap.getSettings(), "settings");
    });

    async function throwsError(promise) {
      let rejected = false;
      try {
        await promise;
      } catch {
        rejected = true;
      }
      return rejected;
    }

    it("throws error when signed out work after sign in", async () => {
      gdriveAuthClient.signOut();
      assert(
        GDriveStates.SIGNED_OUT,
        await gdriveAuthClient.getNextStateForTests()
      );

      assert(await throwsError(gdriveMap.get(0)));
      assert(await throwsError(gdriveMap.set(0, "1")));
      assert(await throwsError(gdriveMap.getAll()));
      assert(await throwsError(gdriveMap.delete(0)));
      assert(await throwsError(gdriveMap.getSettings()));
      assert(await throwsError(gdriveMap.setSettings("options")));

      gdriveAuthClient.signIn();
      assert(
        GDriveStates.SIGNED_IN,
        await gdriveAuthClient.getNextStateForTests()
      );

      assert.equal(await gdriveMap.getSettings(), "settings");
      await gdriveMap.delete(4);
      const map = await gdriveMap.getAll();
      assert(
        _.isEqual(
          {
            0: "foo".repeat(100),
            1: "bar".repeat(100),
            3: "bar1".repeat(100),
            11: "bar2".repeat(100),
            2: "bar4".repeat(100),
            7: "bar5".repeat(100),
            9: "bar6".repeat(100),
            8: "bar7".repeat(100),
            88: "bar8".repeat(100),
          },
          map
        )
      );
    });
  });
});

realBrowserTest("GDrive.test.js", async () => {
  let assert = window.chai.assert;
  let before = window.before;
  let after = window.after;
  let { gdriveAuthClient, GDriveStates } = await import(
    "./GDriveAuthClient.js"
  );
  let { gdriveMap } = await import("./GDriveMap.js");

  describe("Google drive map PART2", function () {
    this.timeout(6000000);

    before(async () => {
      await gdriveAuthClient.getNextStateForTests();
      if (gdriveAuthClient.state !== GDriveStates.SIGNED_IN) {
        gdriveAuthClient.signIn();
        assert.equal(
          await gdriveAuthClient.getNextStateForTests(),
          GDriveStates.SIGNED_IN
        );
      }
    });
    after(async () => {
      assert.equal(gdriveAuthClient.state, GDriveStates.SIGNED_IN);
      gdriveAuthClient.signOut();
      assert.equal(
        await gdriveAuthClient.getNextStateForTests(),
        GDriveStates.SIGNED_OUT
      );
    });

    it("works after browser restart", async () => {
      assert.equal(await gdriveMap.getSettings(), "settings");
      await gdriveMap.delete(4);
      const map = await gdriveMap.getAll();
      assert(
        _.isEqual(
          {
            0: "foo".repeat(100),
            1: "bar".repeat(100),
            3: "bar1".repeat(100),
            11: "bar2".repeat(100),
            2: "bar4".repeat(100),
            7: "bar5".repeat(100),
            9: "bar6".repeat(100),
            8: "bar7".repeat(100),
            88: "bar8".repeat(100),
          },
          map
        )
      );
    });

    it("deletes keys again", async () => {
      const map = await gdriveMap.getAll();
      assert.isAtLeast(map.size, 2);
      let delete_promises = [];
      for (let [key, value] of Object.entries(map)) {
        assert(typeof key === Number);
        assert(!!value && typeof value === "string");
        delete_promises.push(gdriveMap.delete(key));
      }
      await Promise.all(delete_promises);

      const updated_map = await gdriveMap.getAll();
      assert.equal(Object.entries(updated_map).length, 0);
    });
  });
});
