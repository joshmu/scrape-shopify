const axios = require('axios')

module.exports = productsJson = async (url = 'http://coolcalmculture.com', limitDays = 14) => {
    let res

    try {
        res = await axios.get(url + '/products.json')
    } catch (e) {
        //console.error(e)
        console.error('FETCH RECENT FAILED...')
        return []
    }

    return (res.data && res.data.products) ? res.data.products : []
}

