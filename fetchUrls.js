const searchTerms = ['shapewear', 'deal', 'beauty', 'gadget', 'pets', 'fitness']
const globalShopList = 'https://www.globalshoplist.com/'
const pageLimit = 3

const fs = require('fs')

const scrapeShops = require('./findShopUrls.js');

(async () => {
    console.log('start')
    let urls = []

    for (let i = 0; i < searchTerms.length; i++) {
        let results = await scrape(globalShopList + searchTerms[i], pageLimit, false)
        console.log('urls found >', results.length)

        if (results) {
            console.log('adding urls...')
            urls = urls.concat(results)
        } else {
            console.log('scrape failed')
        }
    }

    console.log(urls)
    console.log(urls.length, 'urls found.')
    fs.writeFileSync('./shopUrlList.json', JSON.stringify(urls))
    console.log('finished')
})()
