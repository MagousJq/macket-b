'use strict';

const Service = require('egg').Service;
const cheerio = require('cheerio');
const request = require('superagent');
require('superagent-proxy')(request);
const fakeUa = require('fake-useragent');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    let Arr = [];
    const C5CsKindsLen = this.config.urlList.c5CsKinds.length;
    for (let j = 0; j < C5CsKindsLen; j++) {
      if (j > 0) { await (this.sleep(30000)); }
      const item = this.config.urlList.c5CsKinds[j];
      const pages = [];
      for (let i = 1; i <= item.pages; i++) {
        pages.push(i);
      }
      pages.sort(function() {
        return Math.random() - 0.5;
      });
      pages.sort(function() {
        return Math.random() - 0.5;
      });
      for (let i = 0; i < item.pages; i++) {
        console.log('C5-CSGO-' + item.name + '-页码:' + pages[i]);
        await (this.sleep(this.config.c5Frequency));
        try {
          const arr = [];
          const headers = this.config.igxeHeader;
          headers['User-Agent'] = fakeUa();
          const Data = await request.get(item.url + pages[i]).proxy(this.config.proxy[0]).set(headers)
            .timeout({ deadline: 5000 });
          const $ = cheerio.load(Data.text);
          const dataList = $('.list-item4');
          dataList.children().each(function(i) {
            let name = '';
            let price = '';
            let c5link = '';
            $(this).children().each(function(ii) {
              if (ii === 0) {
                c5link = 'https://www.c5game.com/' + $(this).attr('href');
                $(this).children().each(function(iii) {
                  if (iii === 1) {
                    name = $(this).attr('alt');
                  }
                });
              } else if (ii === 2) {
                $(this).children().each(() => {
                  price = ($(this).text() + '').split('Price￥')[1].split('from')[0].trim();
                });
              }
            });
            arr[i] = {
              goodsName: name,
              c5MinPrice: parseFloat(price),
              c5link,
            };
          });
          Arr = Arr.concat(arr);
        } catch (err) {
          console.log('导入失败:第' + i + '页');
          Error.push(i);
        }
      }
    }
    const len = Error.length;
    if (Arr.length > 0) {
      Arr.forEach(item => {
        this.ctx.model.Csgoex.updateOne({
          goodsName: item.goodsName,
        },
        item,
        {
          upsert: false,
        }, () => {});
      });
    }
    const time = new Date();
    console.log(time.getHours() + ':' + time.getMinutes(), '导入C5数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
  }
  async canBuy(query) {
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 10000, $gte: 0 },
          c5MinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.c5MinPrice > 2
    );
    list.sort((a, b) => {
      return b.steamMinPrice / b.c5MinPrice - a.steamMinPrice / a.c5MinPrice;
    });
    list = list.slice(0, 300);
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        igxeId: e.igxeId,
        c5link: e.c5link,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        igxeMinPrice: e.igxeMinPrice,
        c5MinPrice: e.c5MinPrice,
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        time: e.date,
      };
    });
    return list;
  }
  async canUse(query) {
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          steamMinPrice: { $gt: 0 },
          buffMinPrice: { $lte: 20000, $gt: 0.1 },
          c5MinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item => {
      if (query.isTrueData) {
        item.buffBuyPrice = item.buffBuyPrice > item.buffMinPrice ? item.buffMinPrice : item.buffBuyPrice;
      }
      return parseFloat(item.buffMinPrice) - parseFloat(item.c5MinPrice) >= 0;
    });
    list.sort((a, b) => {
      return (parseFloat(b.buffBuyPrice) * 0.975 - parseFloat(b.c5MinPrice)) - (parseFloat(a.buffBuyPrice) * 0.975 - parseFloat(a.c5MinPrice));
    });
    list = list.slice(0, 200);
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        igxeId: e.igxeId,
        c5link: e.c5link,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        c5MinPrice: e.c5MinPrice,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        buffBuyPrice: e.buffBuyPrice,
        steamMinPrice: e.steamMinPrice,
        time: e.date,
      };
    });
    return list;
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
