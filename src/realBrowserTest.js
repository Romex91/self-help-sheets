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
//     it("does something with foo and bar", async () => {
//       foo(bar);
//     });
//   });
// });
//
export async function realBrowserTest(testFile, testBody) {
  // A script can contain several realBrowserTest sections.
  // They should be independant.
  let id = generateTestId(testFile);

  if (window.location.href.endsWith("realBrowserTest.html")) {
    // The function is called from a real browser.
    if (id === window.realBrowserTest_TestId) {
      window.realBrowserTest_TestBodyPromise = testBody();
    }

    return;
  }

  // The function is called from jest. Create real browser and run
  // the test there.
  test(`Running "${testFile}" #${id} in real-browser.`, async () => {
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
        const { total, failures } = await injectTestsToPage(page, testFile, id);
        if (failures === 0 && total > 0) {
          setTimeout(resolve, 500);
        } else if (total === 0) {
          console.log(
            "the page has 0 tests total. Tests contain syntax errors?"
          );
        } else {
          console.log(
            `${failures}/${total} tests failed. See the browser window for more info.`
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

export function realBrowserTest_DISABLED(testFile) {
  if (!window.location.href.endsWith("realBrowserTest.html")) {
    test(`${testFile} has disabled tests.`, () => {
      throw new Error("ENABLE ME PLEASE!");
    });
  }
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
async function injectTestsToPage(page, testFile, id) {
  return await page.evaluate(
    ({ testFile, id }) => {
      return new Promise((resolve) => {
        window.addEventListener("beforeunload", resolve);
        window.realBrowserTest_TestId = id;

        var test_script = document.createElement("script");
        test_script.src = testFile;
        test_script.type = "module";
        document.body.appendChild(test_script);

        test_script.onload = async () => {
          // We shouldn't start tests until they are loaded.
          await window.realBrowserTest_TestBodyPromise;
          let runner;

          let failures = await new Promise((resolve) => {
            runner = window.mocha.run((failures) => {
              resolve(failures);
            });
          });

          resolve({ total: runner.total, failures });
        };
      });
    },
    { testFile, id }
  );
}

function generateTestId(testFile) {
  if (generateTestId.idMap === undefined) generateTestId.idMap = new Map();
  if (!Number.isFinite(generateTestId.idMap[testFile]))
    generateTestId.idMap[testFile] = 0;
  return generateTestId.idMap[testFile]++;
}
