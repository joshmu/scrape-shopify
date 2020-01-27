const goldUrls = require('./gold.json')
let fetchedUrls = require('./shopUrlList.json')
// const urls = ['http://www.pixibeauty.com']
let blacklist = require('./blacklist.json')
const fs = require('fs')
const moment= require('moment')
let DB = require('./db.json')
const appStartTime = moment()
let updateDB = false
const scrape = require('./scrape.js');

(async () => {
    try {

    console.log('SCOUT: start')

    let GEMS = []

    // either just gold urls or all
    let urls = process.argv[2] === 'gold' ?  goldUrls : fetchedUrls.concat(goldUrls)

    for (let i = 0; i < urls.length; i++) {
        console.log('\n')
        let url = urls[i]
        console.log(`SCOUT: ${i+1}/${urls.length}`)

        // check if on stop list
        let urlCheck = (blacklist.every(x => url.indexOf(x) === -1) && process.argv[2] !== 'gold')
        if (urlCheck) {

            // scrape
            let output = await scrape(url)
            if (output && output.length > 0) {
                await findGems(url, output)
            } else {
                console.log('SCOUT: skip >', url)

                console.log('SCOUT: adding url to stop list')
                blacklist.push(url)
                fs.writeFileSync('./blacklist.json', JSON.stringify(blacklist))

            }
        } else {
            console.log('SCOUT: skip >', url)
        }
    }

    // find new items in array
    async function findGems(shop, urls) {
        if (!DB[shop]) {
            DB[shop] = urls
            updateDB = true
            return
        }
        let found = urls.filter(c => {
            return DB[shop].every(o => o !== c)
        })
        if (!found.length) return
        console.log('')
        console.log(`SCOUT: ${found.length} gems!`)
        console.log(found)
        GEMS.push({shop: shop, products: found})
        console.log('SCOUT: updating db')
        DB[shop] = urls
    }

    // save the gems
    if (GEMS.length > 0) {
        updateDB = true
        console.log(GEMS)
        console.log(`SCOUT: saving ${GEMS.length} gems!`)
        const txt = await gemTxt(GEMS)
        fs.writeFileSync('./gems.txt', txt)
        fs.writeFileSync('./archive/gems - ' + moment().toString() + '.txt', txt)
        fs.writeFileSync('./GEMS.json', JSON.stringify(GEMS))
        fs.writeFileSync('./archive/GEMS - ' + moment().toString() + '.json', JSON.stringify(GEMS))
    } else {
        console.log('SCOUT: no gems found...')
        console.log('SCOUT: finished.')
    }

    if (updateDB) {
        // update the db
        fs.writeFile('./db.json', JSON.stringify(DB), err => {
            if (err) console.error(err)
            console.log('SCOUT: db updated')
            console.log('SCOUT: finished.')
        })
    }

    let appDuration = appStartTime.toNow(moment())
    console.log('')
    console.log('SCOUT: done in', appDuration)

    // other
    async function gemTxt(gems) {
        let txt = ''
        gems.forEach(gem => {
            txt += '----- store -----\n'
            txt += gem.shop.toUpperCase() + '\n'
            txt += '----- fb ads  -----\n'
            txt += `https://www.facebook.com/search/str/${gem.shop.split('//').pop()}/stories-keyword/intersect \n`
            txt += '----- new products  -----\n'
            gem.products.forEach(url => {
                // get the last element after '/' then remove any query then replace '-' with spaces
                let prodTitle = url.split('/').pop().split('?')[0].replace(/-/gi,' ')
                txt += prodTitle + '\n'
                txt += url + '\n'
            })
            txt += '\n'
        })
        return txt
    }

    } catch (e) {
        console.log('OUR ERROR:', e)
    }
})()
