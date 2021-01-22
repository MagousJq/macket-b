'use strict';

const Service = require('egg').Service;
const cheerio = require('cheerio');
const request = require('superagent');
require('superagent-proxy')(request);
const fakeUa = require('fake-useragent');
class SteamService extends Service {
  async steamGetPrice(query) {
    let error = 0;
    const arr = [];
    await Promise.all(query.map(async item => {
      try {
        const headers = this.config.steamHeader;
        headers['User-Agent'] = fakeUa();
        const Data = await request.get(item.url).set(headers).timeout(10000);
        const html = Buffer.from(Data.text).toString();
        const $ = cheerio.load(html);
        const script = $('script');
        const len = script.length;
        const str = script.get()[len - 1].children[0].data;
        const id = str.split('Market_LoadOrderSpread')[1].trim().split(')')[0].split('(')[1].trim();
        if (id) {
          const priceUrl = 'https://steamcommunity.com/market/itemordershistogram?country=CN&currency=23&two_factor=0&language=schinese&item_nameid=' + id;
          const priceInfo = await request.get(priceUrl).set(headers).timeout(10000);
          if (priceInfo.status === 200 && priceInfo.text) {
            arr.push({
              name: item.name,
              index: item.index,
              steamBuyPrice: JSON.parse(priceInfo.text).buy_order_graph[0][0],
            });
          } else {
            // console.log('teshu11111');
            error++;
          }
        } else {
          // console.log('teshu222222');
          error++;
        }
      } catch (err) {
        // console.log(index, err);
        error++;
      }
    }));
    return {
      arr,
      error,
    };
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SteamService;
