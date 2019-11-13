'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');
class SteamService extends Service {
  async steamGetPrice(query) {
    let arr = [];
    await Promise.all(query.map(async (item,index) => {
        await (this.sleep(50));
        try {
          let Data = await this.ctx.curl(item.url, { headers: this.config.steamHeader });
          let data = JSON.stringify(Data.data);
          let html = Buffer.from(JSON.parse(data).data).toString();
          let $ = cheerio.load(html);
          let script = $('script');
          let len = script.length;
          let str = script.get()[len - 1].children[0].data;
          let id = str.split('Market_LoadOrderSpread')[1].trim().split(')')[0].split('(')[1].trim();
          let priceUrl = 'https://steamcommunity.com/market/itemordershistogram?country=CN&currency=23&two_factor=0&language=schinese&item_nameid=' + id
          let priceInfo = await this.ctx.curl(priceUrl, { dataType: 'json' });
          if (priceInfo.status === 200 && priceInfo.data) {
            arr.push({
              name: item.name,
              index: item.index,
              steamBuyPrice: priceInfo.data.buy_order_graph[0][0]
            });
          } else {
            console.log(item.name + ' 获取steam求购价格失败');
          }
        } catch (error) {
          console.log(item.name + ' 获取steam求购价格失败');
        }
    }))
    return arr;
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SteamService;
