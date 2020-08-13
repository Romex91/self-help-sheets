// realBrowserTest(testFile, testBody)
// runs real-browser Mocha tests from Create React App projects.
//
// USAGE EXAMPLE:
//
//                     Tests will start running after this
//                   |async| function resolves all |await| tasks
//                                       |
//                                       v
// realBrowserTest("nameOfThisFile.js", async () => {
//   // This code will run in a real browser.
//   // Preffer dynamic import to avoid importing browser-only code to jest.
//   let {foo,  bar} = await import(
//     "./fooBar.js"
//   );
//
//   describe("your mocha stuff", function () {
//     it("does something", async () => {
//       // ...
//     });
//   });
// });
//
export async function realBrowserTest(testFile, testBody) {
  if (window.location.href.endsWith("realBrowserTest.html")) {
    // The function is called from a real browser.
    window.realBrowserTestBodyPromise = testBody();
    return;
  }

  // The function is called from jest. Create real browser and run
  // the test there.
  test(`Running "${testFile}" in real-browser.`, async () => {
    let puppeteer = (await import("puppeteer")).default;

    const browser = await puppeteer.launch({
      userDataDir: "testing_chrome_user_data",
      headless: false,
    });
    const page = await browser.newPage();
    page.setCacheEnabled(false);

    await new Promise((resolve, reject) => {
      page.goto(`localhost:3000/src/realBrowserTest.html`);
      page.on("load", async () => {
        const failures = await injectTestsToPage(page, testFile);
        if (failures === 0) {
          setTimeout(resolve, 3000);
        } else {
          console.log(
            `${failures} tests failed. See the browser window for more info.`
          );
        }
      });
      browser.on("disconnected", () => {
        reject("Browser was closed.");
      });
    });

    await browser.close();
  }, 999999999);
}

(() => {
  if (window.location.href.endsWith("realBrowserTest.html")) return;

  beforeAll(async () => {
    let { setup } = await import("jest-dev-server");
    await setup({
      command: `http-server . -p 3000`,
      launchTimeout: 50000,
      port: 3000,
    });
  });

  afterAll(async () => {
    let { teardown } = await import("jest-dev-server");
    await teardown();
  });
})();

// returns number of failures.
async function injectTestsToPage(page, testFile) {
  return await page.evaluate((testFile) => {
    return new Promise((resolve) => {
      var test_script = document.createElement("script");
      test_script.src = testFile;
      test_script.type = "module";
      document.body.appendChild(test_script);

      test_script.onload = async () => {
        await window.realBrowserTestBodyPromise;
        window.mocha.run((failures) => {
          resolve(failures);
        });
      };
    });
  }, testFile);
}
