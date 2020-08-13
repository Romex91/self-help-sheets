// These tests require a Google account with enabled 'less secure apps' option.
import { realBrowserTest } from "./realBrowserTest.js";

realBrowserTest("GDrive.test.js", async () => {
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
  let { gdriveAuthClient, GDriveStates } = await import(
    "./GDriveAuthClient.js"
  );

  describe("Google drive auth client PART 2", function () {
    this.timeout(6000000);

    it("has correct status on signIn and signOut", async () => {
      assert.equal(gdriveAuthClient.state, GDriveStates.LOADING);
      assert.notEqual(
        await gdriveAuthClient.getNextStateForTests(),
        GDriveStates.LOADING
      );
    });
  });
});
