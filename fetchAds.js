
// const fbPages = ['https://www.facebook.com/pg/sugarcottonshop/ads/?country=1', 'https://www.facebook.com/pg/bohopeak/ads/?country=1']
const fbPages = require('./fbstores.json')
let oldDB = require('./dbAds.json')

//const blacklist = ['view=quickview', 'cdn', 'facebook.com', 'twitter.com', 'linkedin', 'pinterest', 'whatsapp']

const puppeteer = require('puppeteer')
const fs = require('fs')
const sleep = async t => new Promise(resolve => setTimeout(resolve, t));

(async () => {
    try {

    console.log('start')
    const browser = await puppeteer.launch({headless: true, slowMo: 0})
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
    await page.setViewport({ width: 1024, height: 768 })

    // don't load images
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort()
        } else {
            request.continue()
        }
    })

    ////////////////////
    // FB LOGIN
    ////////////////////

    console.log('login')
    await page.goto('https://www.facebook.com', {waitUntil: 'networkidle2'})

    await page.waitForSelector('#email')
    await page.type('#login_form #email', 'joshmuis@hotmail.com')

    await page.waitForSelector('#login_form #pass')
    await page.type('#login_form #pass', 'iampro4Kf!')

    await page.click('#loginbutton')

    await page.waitForSelector('#bluebarRoot')
    // await page.waitForNavigation()


    ////////////////////
    // FB PAGES
    ////////////////////
    console.log('fb pages')
    let currentAds = []

    for (let i = 0; i < fbPages.length; i++) {
        let url = fbPages[i]
        console.log(`${i + 1}/${fbPages.length} > ${url}`)

        await page.goto(url, {waitUntil: 'networkidle2'})
        // await page.screenshot({path: 'screenshot-full.png', fullPage: true})

        // get ads
        let data = await page.evaluate(() => {
            let id = location.href.split('/')[4]
            return Array.from(document.querySelectorAll('.userContent')).map((val, i) => {
                return {id: id, content: val.innerText}
            })
            // return Array.from(document.querySelectorAll('div[data-report-meta]')).map((val,i) => JSON.parse(val.attributes['data-report-meta'].nodeValue))
        })

        if (data) {
            // add fb url and count
            data.forEach(d => {
                d.count = 1
                d.url = url
            })
            console.log(`${data.length} ads`)
            currentAds = currentAds.concat(data)
        }
    }

    await browser.close()

    console.log('---')
    console.log(`${currentAds.length} ads found`)

    ////////////////////
    // TALLY
    ////////////////////
    console.log('tally')
    let newDB = []

    // only create the database on what is found plus any count from the previous
    // iterate through current ads, if found then count otherwise add to new db
    currentAds.forEach(c => {
        let found = oldDB.find(o => o.content === c.content)
        if (found) c.count += found.count
        newDB.push(c)
    })

    // sort
    newDB = newDB.sort((p, c) => c.count - p.count)

    ////////////////////
    // SAVE
    ////////////////////
    console.log('saving')
    fs.writeFileSync('./dbAds.json', JSON.stringify(newDB))

    ////////////////////
    // OUTPUT
    ////////////////////
    newDB.forEach(x => {
        console.log(`${x.count} >>> ${x.id.toUpperCase()}`)
        console.log(x.content.trim())
        console.log('')
    })

    ////////////////////
    // FINISHED
    ////////////////////
    console.log('finished')

    } catch (e) {
        console.log('OUR ERROR:', e)
        process.exit(1)
    }

    return
})()
