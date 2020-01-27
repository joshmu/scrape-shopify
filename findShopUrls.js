
const puppeteer = require('puppeteer')
const sleep = async t => new Promise(resolve => setTimeout(resolve, t));

module.exports = scrape = async (url, pageLimit, headless = true) => {
    let urls = []

    const browser = await puppeteer.launch({headless: headless, slowMo: 0})
    const page = await browser.newPage()

    // don't load images
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort()
        } else {
            request.continue()
        }
    })

    await page.setViewport({ width: 1024, height: 768 })

    console.log(url)


    let stop = false
    let pageCount = 1
    urlExtra = '?searchFields=domain,title,description&page='
    while(!stop) {

        try {
            await page.goto(url + urlExtra + pageCount, {waitUntil: 'networkidle2'})
        } catch (e) {
            console.error(e)
            stop = true
            return false
        }

        // selectors based on brooklyn theme
        let found = await page.evaluate(() => {
            return Array.from(document.getElementsByTagName('a'))
                .filter(a => a.attributes.href).map(x => x.href)
        })

        found = found.filter(f => f.indexOf('collections/all?sort_by=best-selling') > -1)
                .map(url => {
                    let x = url.split('link=')
                    return x[x.length - 1]
                })

        // trim
        found = found.map(f => f.replace('/collections/all?sort_by=best-selling', ''))

        if (found.length) {
            console.log('SCRAPER: found')
            console.log(found)
            urls = urls.concat(found)

            pageCount++
            // if page limit reached don't continue scraping
            if (pageCount > pageLimit) stop = true

        } else {
            console.log('no shop urls found, ending scrape')
            stop = true
        }

    }

    browser.close()

    return urls

}


/*
    // don't load images
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort()
        } else {
            request.continue()
        }
    })

    await page.setViewport({ width: 1024, height: 768 })
    await page.goto(url, {waitUntil: 'networkidle2'})

// screenshot to check
// await page.screenshot({path: 'example.png', fullPage: true})

// show any console.logs in from browser in terminal
// page.on('console', msg => console.log('PAGE LOG:', msg.text()));
// await page.evaluate(() => console.log(`url is ${location.href}`));

    await page.waitForSelector('#PromoteSignUpPopUp')
    await sleep(2000)
// remove pop up element
    await page.evaluate(sel => {
        $(sel).remove()
        // var elem = document.getElementById(sel)
        // elem.parentNode.removeChild(elem)
    }, '#PromoteSignUpPopUp')

// click on customize
    const toggleBtn = '#filterStateAnchor'
    await page.waitForSelector(toggleBtn)
    await page.click(toggleBtn);

// close other assets
    await page.evaluate(sel => {
        $(sel).click()
    }, '.customTechSummary .bugCloseIcon')


// Type into search box.
    const searchInput = '#searchText_techSearch'
    await page.waitForSelector(searchInput)
    const elementHandle = await page.$(searchInput)
    for (let i = 0; i < tickers.length; i++) {
        let ticker = tickers[i]
        await elementHandle.type(ticker, {delay: 150})
        await elementHandle.press('Enter')
    }

// close last unwanted asset
    await page.evaluate((sel) => {
        $(sel).click()
    }, '#techInstrumentsContainer > li:nth-child(2) > i')

// change signal timeframes
// 5 hourly
    await page.click('div#select_interval_1 > select')
    await page.keyboard.type('h')
    await page.keyboard.press('Enter')
// await page.click('#select_interval_1 > select > option:nth-child(6)')

// daily
    await page.click('#select_interval_2 > select')
    await page.keyboard.type('d')
    await page.keyboard.press('Enter')
// await page.click('#select_interval_2 > select > option:nth-child(7)')

// weekly
    await page.click('#select_interval_3 > select')
    await page.keyboard.type('w')
    await page.keyboard.press('Enter')
// await page.click('#select_interval_3 > select > option:nth-child(8)')

// monthly
    await page.click('#select_interval_4 > select')
    await page.keyboard.type('m')
    await page.keyboard.press('Enter')
// await page.click('#select_interval_4 > select > option:nth-child(9)')

// apply
    const applyBtn = '.submitBox > a'
    await page.click(applyBtn)

    await sleep(3000)

//  await page.type(searchInput, 'btcusd')
//  await page.type(searchInput, 'btcusd')

// results
// const resultsTable= '#technical_summary_container'
    const resultsRows = '#technical_summary_container tr'
    const tickerResults = await page.evaluate(resultsTable => {
        console.log('grabbing data...')
        return Array.from(document.querySelectorAll(resultsTable)).map(function (tr) {
            return Array.from(tr.children).map(function (td) { return td.textContent.trim()})
        })
    }, resultsRows)
// console.log('ticker results', tickerResults)
//
// Wait for suggest overlay to appear and click "show all results".
/*
    const allResultsSelector = '.devsite-suggest-all-results';
    await page.waitForSelector(allResultsSelector);
    await page.click(allResultsSelector);

        // Wait for the results page to load and display the results.
    const resultsSelector = '.gsc-results .gsc-thumbnail-inside a.gs-title';
    await page.waitForSelector(resultsSelector);

        // Extract the results from the page.
    const links = await page.evaluate(resultsSelector => {
        const anchors = Array.from(document.querySelectorAll(resultsSelector));
        return anchors.map(anchor => {
            const title = anchor.textContent.split('|')[0].trim();
            return `${title} - ${anchor.href}`;
        });
    }, resultsSelector);
    console.log(links.join('\n'));
    */
        /*

    let data = []
    for (let i = 1; i < tickerResults.length; i += 3) {
        let o = {}
        let tickerAndPrice = tickerResults[i][0].split('\n\t\t\t\t\t')
        o.ticker = tickerAndPrice[0]
        o.price = +tickerAndPrice[1].replace(',','')
        o.movingAverages = arrToSignalObj(tickerResults[i].slice(2))
        o.indicators = arrToSignalObj(tickerResults[i+1].slice(1))
        o.summary = arrToSignalObj(tickerResults[i+2].slice(1))
        data.push(o)
    }

    await browser.close()

    return data
}

function arrToSignalObj (arr) {
    return {
        hourly: arr[0],
        daily: arr[1],
        weekly: arr[2],
        monthly: arr[3]
    }
}
*/

