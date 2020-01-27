const moment = require("moment");
const fetchRecentProducts = require("./fetchRecentProducts.js");
const fetchBestSellers = require("./fetchBestSellers.js");
const gold = require("../gold.json"); // gold is the specified stores in gsheet
const stores = require("./shopUrls.json");
//let urls = gold.concat(stores)
let urls = gold;
const dbPath = "/Users/joshmu/Google Drive/scout/fox/db-fox.json";
const fs = require("fs");

const black = require("../blacklist.json");
const tempBlacklistPath = "./tempBlacklist.json";
let tempBlacklist = require(tempBlacklistPath);
let blacklist = black.concat(tempBlacklist);

const config = {
  limitDays: 30,
  limitBestSellers: 30,
  lastUpdatedRange: 6 // hours
};

(async () => {
  let appStartTime = moment();
  let completedCount = 1;
  let db = require(dbPath);

  // remove any url duplicates
  urls = urls.filter((u, i) => {
    return urls.indexOf(u) >= i;
  });

  // if user provides url/s then overwrite
  if (process.argv[2]) urls = process.argv[2].split(",");

  let dbLen = Object.keys(db).length;
  Object.keys(db).forEach(k => {
    // remove any items in db which are on the blacklist
    if (blacklist.some(b => k.toLowerCase().indexOf(b.toLowerCase()) > -1)) {
      delete db[k];
    } else if (!urls.includes(k)) {
      // remove any items in db not listed to search
      delete db[k];
    }
  });

  // if there has been a change, save db
  if (dbLen > Object.keys(db).length) {
    fs.writeFileSync(dbPath, JSON.stringify(db));
  }

  // let's go!
  console.log("");
  console.log(
    `SEARCH FOR BESTSELLERS RELEASED WITHIN ${config.limitDays} DAYS`
  );

  let results = [];

  for (let i = 0; i < urls.length; i++) {
    let url = urls[i];

    // if this is the first time then initiate the db with the url
    if (!db[url])
      db[url] = { gems: [], lastUpdated: moment().subtract(1, "years") };

    let urlCheck = blacklist.every(x => url.indexOf(x) === -1);
    let updateCheck =
      moment.duration(moment().diff(moment(db[url].lastUpdated))).asHours() >
      config.lastUpdatedRange;

    let remainingStores = urls.length - i;
    let remaingTime = await eta(completedCount, appStartTime, remainingStores);
    // console.log(`-- eta: ${remaingTime}${remaingTime <= 1 ? 'min' : 'mins'} --`)

    console.log("");
    console.log(
      `-- ${i + 1}/${urls.length} -- ${remaingTime}${
        remaingTime <= 1 ? "min" : "mins"
      }`
    );
    console.log(url.toUpperCase());
    console.log(`---`);

    // only continue url is not on blacklist and hasn't been updated recently
    if (urlCheck && updateCheck) {
      console.log(`CHECKING RECENT PRODUCTS...`);
      console.log("");

      let recentProds = await fetchRecentProducts(url);

      // add amount of days
      for (let x = 0; x < recentProds.length; x++) {
        let time = moment.duration(
          moment().diff(moment(recentProds[x].published_at))
        );
        recentProds[x].days = time.asDays();
      }

      //let mostRecent = await filterDayLimit(recentProds, config.limitDays)
      let mostRecent = recentProds.filter(p => p.days < config.limitDays);

      // remove body_html for space
      mostRecent.forEach(p => {
        console.log(`${p.handle} (ID:${p.id})`);
        delete p.body_html;
      });

      console.log("");
      console.log(
        `${mostRecent.length} PRODUCTS ADDED IN LAST ${config.limitDays} DAYS`
      );

      console.log(`---`);
      console.log(`CHECKING BESTSELLERS...`);

      if (mostRecent.length) {
        let bestSellers;
        try {
          bestSellers = await fetchBestSellers(url);
        } catch (e) {
          console.error(e);
          bestSellers = [];
          console.log(`setting bestsellers to empty array...${bestSellers}`);
        }
        bestSellers = bestSellers.slice(0, config.limitBestSellers);

        for (let y = 0; y < bestSellers.length; y++) {
          bestSellers[y] = {
            hostname: url,
            url: bestSellers[y],
            rank: y + 1
          };
        }

        // find matches
        // console.log(bestSellers)
        console.log(`FOUND ${bestSellers.length} BESTSELLERS`);
        // let found = bestSellers.filter(b => mostRecent.some(r => b.indexOf(r.handle) > -1))
        let found = await findGems(mostRecent, bestSellers);

        // result
        if (found.length) {
          results = results.concat(found);
          found.forEach(f => console.log(f.handle));

          console.log("");
          console.log(`FOUND ${found.length} GEMS!`);
        } else {
          console.log("NO GEMS FOUND...");
        }
        await addToDb(url, found);
        completedCount++;
      } else {
        console.log(">>>>>> BLACKLIST >>>>>>", url);
        let tempBlacklist = require(tempBlacklistPath);
        tempBlacklist.push(url);
        fs.writeFileSync(tempBlacklistPath, JSON.stringify(tempBlacklist));
      }
    } else {
      console.log(`SKIP!`);
    }
  }

  console.log("--------");
  console.log("");
  let txt = "";
  if (results.length) {
    console.log(`--- ${results.length} GEMS ---`);
    results.forEach(r =>
      console.log(
        `${r.handle} - ${Math.round(r.days)} days old - ranked ${r.rank} in ${
          r.hostname
        }`
      )
    );
    console.log("--------");

    // txt output
    txt += `--- ${results.length} GEMS ---\n`;
    txt += `--------------------\n\n`;

    results.forEach(r => {
      txt += `${r.handle} - rank:${r.rank} - days:${Math.round(r.days)}\n`;
      txt += `${r.hostname + "/products/" + r.handle}\n\n`;
    });
  } else {
    console.log("NO GEMS FOUND.");

    txt += "NO GEMS FOUND.\n";
  }
  fs.writeFileSync("/Users/joshmu/Desktop/fox.txt", txt);

  let appDuration = appStartTime.toNow(moment());
  console.log("");
  console.log(`completed in ${appDuration}`);

  process.exit(0);
})();

async function addToDb(url, found = []) {
  let currDb = require(dbPath);
  if (!currDb[url]) currDb[url] = {};
  // console.log(db[url].gems)
  // console.log('DIFF')
  // console.log(found)
  // db[url].gems = found;
  currDb[url].gems = await updateGems(currDb[url].gems, found);
  currDb[url].lastUpdated = moment();
  fs.writeFileSync(dbPath, JSON.stringify(currDb));
  console.log("db updated.");
  return;
}

async function updateGems(prevGems, currGems) {
  let gems = currGems;

  // check rank and flag if it has improved
  for (let i = 0; i < gems.length; i++) {
    let curr = gems[i];
    // initialize trend rank on gem
    gems[i].rankTrend = 0;
    // check if we can match to a prev gem
    for (let y = 0; y < prevGems.length; y++) {
      let prev = prevGems[y];
      if (curr.handle === prev.handle) {
        // replace trend rank if gem already existed
        if (prev.rankTrend) gems[i].rankTrend = prev.rankTrend;
        // accumulate trend if still improving
        let diff = prev.rank - curr.rank;
        if (diff > 0) gems[i].rankTrend += diff;
      }
    }
  }

  return gems;
}

// async function filterDayLimit (products, limitDays) {
//     return products.filter(p => {
//         let time = moment.duration(moment().diff(moment(p.published_at)))
//         return time.asDays() < limitDays
//     })
// }

async function scoreDaysCreated(products) {
  return products.filter(p => {
    let time = moment.duration(moment().diff(moment(p.published_at)));
    return time.asDays() < limitDays;
  });
}

async function eta(completed, startTime, remaining) {
  // calc duration
  let duration = moment.duration(moment().diff(startTime)).asMinutes();
  // divide by completed
  let singleScrapeDuration = duration / completed;
  // multiply by remaining
  return Math.round(singleScrapeDuration * remaining);
}

async function findGems(recent, best) {
  let found = [];

  for (let i = 0; i < best.length; i++) {
    let b = best[i];

    for (let x = 0; x < recent.length; x++) {
      let r = recent[x];
      if (b.url.indexOf(r.handle) > -1) {
        found.push({
          hostname: b.hostname,
          handle: r.handle,
          url: b.url,
          price: r.variants[0].price,
          compare_at_price: r.variants[0].compare_at_price,
          rank: b.rank,
          days: r.days
        });
      }
    }
  }

  return found;
}
