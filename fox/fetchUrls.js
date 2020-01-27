const searchTerms = ['cool', 'yoga', 'viral', 'girl', 'lady', 'good', 'bohemian', 'style', 'shapewear', { search: 'deals', pageLimit: 10 }, 'beauty', 'cosmetic', 'makeup', 'gadget', 'pets', 'fitness', 'kitchen', 'women', { search: 'home', pageLimit: 6 }, { search: 'amazing', pageLimit: 6 }]
const globalShopList = 'https://www.globalshoplist.com/'
const config = {
    pageLimit: 3
}

const fs = require('fs')

const scrapeShops = require('./scrapeShopUrls.js');

(async () => {
    console.log('start')
    let urls = []

    for (let i = 0; i < searchTerms.length; i++) {
        let s = searchTerms[i]
        if (typeof s === 'string') s = { search: s, pageLimit: config.pageLimit }
        let results = await scrape(globalShopList + s.search, s.pageLimit, false)
        console.log('urls found >', results.length)

        if (results) {
            console.log('adding urls...')
            urls = urls.concat(results)
        } else {
            console.log('scrape failed')
        }
    }

    // remove duplicates
    urls = urls.filter((u, i) => {
        return urls.indexOf(u) >= i
    })

    console.log(urls)
    console.log(urls.length, 'urls found.')
    fs.writeFileSync('./shopUrls.json', JSON.stringify(urls))
    console.log('finished')
})()
