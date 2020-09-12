require('dotenv').config()
const { TELEGRAM_TOKEN, TELEGRAM_CHATID } = process.env

const rp = require('request-promise')
const cheerio = require('cheerio')
const TelegramBot = require('node-telegram-bot-api')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ count: 0 }).write()

;(async function() {
  const result = await rp({
    method: 'GET',
    uri: 'http://prod.danawa.com/info/?pcode=4922242&keyword=%EC%BB%AC%EC%B3%90%EB%9E%9C%EB%93%9C%205%EB%A7%8C%EC%9B%90%20%EB%AC%B8%ED%99%94%EC%83%81%ED%92%88%EA%B6%8C&cate=19231551',
    // uri: 'http://prod.danawa.com/info/?pcode=4921912&keyword=%EC%BB%AC%EC%B3%90%EB%9E%9C%EB%93%9C%2010%EB%A7%8C%EC%9B%90%20%EB%AC%B8%ED%99%94%EC%83%81%ED%92%88%EA%B6%8C&cate=19231551',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
    },
    simple: false
  })

  const $ = cheerio.load(result)
  const price = parseInt($('#blog_content > div.summary_info > div.detail_summary > div.summary_left > div.lowest_area > div.lowest_top > div > span.lwst_prc > a > em').text().replace(/,/g,''), 10)
  
  if (isNaN(price)) {
    return
  }

  const before = db.get('count').value()
  if (price === before) {
    return
  }

  db.set('count', price).write()

  const text = `[다나와 문상 최저가]
${before} (${((1 - (before / 50000)) * 100).toFixed(2)}%) -> ${price} (${((1 - (price / 50000)) * 100).toFixed(2)}%)`
  const bot = new TelegramBot(TELEGRAM_TOKEN, {polling: true})
  bot.sendMessage(TELEGRAM_CHATID, text).then(v => {
    process.exit(0)
  })
})();
