const fs = require('fs')
const sendmail = require('sendmail')({ silent: true })
const moment = require('moment')
const db = require('../../db.json')
const dbPath = '/Users/joshmu/Google\ Drive/onyx/db.json'
const tvDbPath = '/Users/joshmu/Google\ Drive/onyx/apps/tv/tv-db.json'

module.exports.diffLastUpdated = diffLastUpdated = (app, timeframe) => {
    return moment().diff(moment(db[app].lastUpdated), timeframe)
}

module.exports.updateDB = updateDB = async (data) => {
    let db = fs.readFileSync(tvDbPath)
    db = JSON.parse(db)
    db.push({ timestamp: new Date(), data})
    fs.writeFileSync(tvDbPath, JSON.stringify(db))
}

module.exports.setLastUpdated = setLastUpdated = (app) => {
    db[app].lastUpdated = new Date()
    fs.writeFileSync(dbPath, JSON.stringify(db))
}

module.exports.email = email = async (subject, bodyHtml = '', bodyTxt = '',  to = 'joshmu.crypto@gmail.com') => {
    return new Promise((resolve, reject) => {
        sendmail({
            from: 'cryptonotify@mu.com',
            to: to,
            subject: subject,
            html: bodyHtml,    // or we could of had 'text: body'
            text: bodyTxt
        }, function (err, reply) {
            if (err) reject(err)
            // console.log(err && err.stack)
            // console.dir(reply)
            resolve()
        })
    })
}

module.exports.removeDuplicates = removeDuplicates = async (arr) => {
    return arr.filter((x, i) => {
        return arr.indexOf(x) >= i
    })
}

module.exports.formatResults = formatResults = async (data) => {
    return data.map(d => {
        return {
            ticker: d.ticker,
            price: d.price,
            summary: d.summary.daily
        }
    })
}
