const fs = require('fs')
const http = require('http')

module.exports = download = async (url, path) => {
    return new Promise((resolve, reject) => {
        let file = fs.createWriteStream(path)
        console.log(`Downloading ${url}`)

        http.get(url, res => {
            res.pipe(file)
            file.on('finish', () => {
                file.close()
                console.log('done')
                resolve('done')
            })
        }).on('error', (e) => reject(e))
    })
}

/*
(async () => {
    let url = 'http://cdn.shopify.com/s/files/1/0029/3666/8272/files/pexels-photo-697059_300x.jpeg?v=1536209352'
    let path = 'image.jpg'
    await download(url, path).then((res) => console.log(`app: ${res}`))
})()
*/
