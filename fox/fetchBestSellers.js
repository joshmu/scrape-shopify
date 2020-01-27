const bestSellingPath = '/collections/all?sort_by=best-selling'

const blacklist = ['view=quickview', 'cdn', 'facebook.com', 'twitter.com', 'linkedin', 'pinterest', 'whatsapp']

// const puppeteer = require('puppeteer')
// const fs = require('fs')
const sleep = async t => new Promise(resolve => setTimeout(resolve, t));

const axios = require('axios');
const cheerio = require('cheerio');
// const getUrls = require('get-urls');

module.exports = fetchBestSellers = async url => {
    return new Promise((resolve, reject) => {

    axios.get(url + bestSellingPath)
        .then(response => {
            if (response.status = 200) {
                let html = response.data
                let $ = cheerio.load(html)
                let urls = $('a')
                let result = []
                for (let i = 0; i < urls.length; i++) {
                    let url = urls[i]
                    result.push($(urls[i]).attr('href'))
                }
//                console.log(result.length)
                // only urls with 'product' keyword
                urls = result.filter(a => typeof a === 'string' && a.match(/\/products\//gi))
 //               console.log(urls)
  //              console.log(urls.length)
   //             console.log('')

                // remove duplicates
                urls = urls.filter((p, i) => {
                    return urls.indexOf(p) >= i
                })
    //            console.log(urls)
     //           console.log(urls.length)
     //           console.log('')

                // blacklist words
                urls = urls.filter(p => {
                    return blacklist.every(word => p.indexOf(word) === -1)
                })

                resolve(urls)
            } else {
                reject()
            }

        })
    })

};


/*
    let url = 'https://www.voguegadget.com';
(async () => {
    let answers = await fetchBestSellers(url)
    console.log('ANSWERS')
    console.log(answers)
})()

let blah = async () => {
    return
    console.log('init')


    axios.get(url)
        .then(response => {
            if (response.status = 200) {
                let html = response.data

                let urls = getUrls(html)
                urls = Array.from(urls)
                console.log(urls)
                console.log(urls.length)
                console.log('')

                // only urls with 'product' keyword
                urls = urls.filter(a => typeof a === 'string' && a.match(/\/products\//gi))
                console.log(urls)
                console.log(urls.length)
                console.log('')

                // remove duplicates
                urls = urls.filter((p, i) => {
                    return urls.indexOf(p) >= i
                })
                console.log(urls)
                console.log(urls.length)
                console.log('')

                // blacklist words
                urls = urls.filter(p => {
                    return blacklist.every(word => p.indexOf(word) === -1)
                })
                console.log(urls)
                console.log(urls.length)
                console.log('')


            }
        })

}

module.exports = fetchBestSellers1 = async (url, headless = true) => {
    const browser = await puppeteer.launch({headless: headless, slowMo: 0})
    const page = await browser.newPage()

    // console.log('SCRAPER:', url)

    try {
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
        await page.goto(url + bestSellingPath, {waitUntil: 'networkidle2'})
    } catch (e) {
        console.log('SCRAPER: page load failed')
        browser.close()
        return []
    }

    let hostname = await page.evaluate(() => location.hostname)

    // selectors based on brooklyn theme
    let products
    // await page.waitFor(4000) ? potential resolves protocol error?
    products = await page.evaluate(() => {
        var hrefs = Array.from(document.getElementsByTagName('a'))
            .filter(a => a.attributes.href).map(x => x.href)
        return hrefs ? hrefs : []
    })

    browser.close()

    // trim
    products = products.filter(a => typeof a === 'string' && a.indexOf('products') > -1 && a.length > 5)

    // remove duplicates
    products = products.filter((p, i) => {
        return products.indexOf(p) >= i
    })

    // remove any urls which are complicated
    // products = products.filter(p => p.indexOf('/products') === 0)

    // blacklist words
    products = products.filter(p => {
        return blacklist.every(word => p.indexOf(word) === -1)
    })

    // add hostname
    // products = products.map(p => hostname + p)

    // console.log(`SCRAPER: ${products.length} products`)
    //console.log(products)

    return products

}
*/
