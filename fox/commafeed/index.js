const puppeteer = require("puppeteer");
const fs = require("fs");
const sleep = async t => new Promise(resolve => setTimeout(resolve, t));
let stores = require("../../gold.json");
let addedStores = require("./addedStores.json");

(async () => {
  console.log("start");
  const browser = await puppeteer.launch({ headless: false, slowMo: 0 });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
    );
    await page.setViewport({ width: 1024, height: 768 });

    // don't load images
    await page.setRequestInterception(true);
    page.on("request", request => {
      if (request.resourceType() === "image") {
        request.abort();
      } else {
        request.continue();
      }
    });

    // remove any urls which have already been added
    stores = stores.filter(s => {
      return !addedStores.includes(s);
    });

    ////////////////////
    // FB LOGIN
    ////////////////////

    console.log("login");
    await page.goto("https://www.commafeed.com", { waitUntil: "networkidle2" });

    // await page.waitForSelector('#email')
    await page.type("input[name=username]", "mu@joshmu.com");

    // await page.waitForSelector('#login_form #pass')
    await page.type("input[name=password]", "iampro4Dc!");

    await page.click("input[type=submit]");

    for (let i = 0; i < stores.length; i++) {
      let hostname = stores[i];
      console.log(`${i + 1}/${stores.length}`);
      console.log(`${hostname}`);

      ////////////////////
      // SUBSCRIBE
      ////////////////////
      await page.waitForSelector("div.left-menu");
      await page.click('button[ui-sref="feeds.subscribe"]');

      // await page.focus('input[name=url]')
      // await page.keyboard.press(hostname + '/collections/all.atom')
      await page.type("input[name=url]", hostname + "/collections/all.atom");
      await page.keyboard.press("Enter");
      await sleep(2000);
      //TODO: DETECT WHETHER 'FAILED'
      // await page.click('button[type=submit]')
      await page.click(
        "#main > div > div > div.main-content > div.entryList > div > div > form > div:nth-child(4) > div > button.btn.btn-primary.ok.ng-binding"
      );
      await sleep(5000);

      await addStore(hostname);
    }

    ////////////////////
    // FINISHED
    ////////////////////
    console.log("finished");
  } catch (e) {
    console.log("OUR ERROR:", e);
    process.exit(1);
  }
  // early finish
  browser.close();
  process.exit(0);
  return;
})();

async function addStore(hostname) {
  let added = require("./addedStores.json");
  added.push(hostname);
  fs.writeFileSync("./addedStores.json", JSON.stringify(added));
}
