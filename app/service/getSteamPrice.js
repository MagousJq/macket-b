'use strict';

const Service = require('egg').Service;
const cheerio = require('cheerio');
class SteamService extends Service {
  async steamGetPrice(query) {
    let err = 0;
    const arr = [];
    await Promise.all(query.map(async (item, index) => {
      await (this.sleep(50));
      try {
        const Data = await this.ctx.curl(item.url, { headers: this.config.steamHeader });
        const data = JSON.stringify(Data.data);
        const html = Buffer.from(JSON.parse(data).data).toString();
        const $ = cheerio.load(html);
        const script = $('script');
        const len = script.length;
        const str = script.get()[len - 1].children[0].data;
        const id = str.split('Market_LoadOrderSpread')[1].trim().split(')')[0].split('(')[1].trim();
        const priceUrl = 'https://steamcommunity.com/market/itemordershistogram?country=CN&currency=23&two_factor=0&language=schinese&item_nameid=' + id;
        const priceInfo = await this.ctx.curl(priceUrl, { dataType: 'json' });
        if (priceInfo.status === 200 && priceInfo.data) {
          arr.push({
            name: item.name,
            index: item.index,
            steamBuyPrice: priceInfo.data.buy_order_graph[0][0],
          });
        } else {
          err++;
        }
      } catch (error) {
        err++;
      }
    }));
    if (err) {
      console.log(err + '条steam商品求购价获取失败');
    }
    return arr;
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SteamService;
