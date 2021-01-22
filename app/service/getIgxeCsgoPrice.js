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
    const igxeCsKindsLen = this.config.urlList.igxeCsKinds.length;
    for (let j = 0; j < igxeCsKindsLen; j++) {
      const item = this.config.urlList.igxeCsKinds[j];
      for (let i = 1; i <= item.pages; i++) {
        console.log('IGXE-CSGO-' + item.name + '-页码:' + i);
        await (this.sleep(this.config.igxeFrequency));
        try {
          const arr = [];
          const headers = this.config.igxeHeader;
          headers['User-Agent'] = fakeUa();
          const Data = await request.get(item.url + i).proxy(this.config.proxy[0]).set(headers)
            .timeout({ deadline: 5000 });
          const $ = cheerio.load(Data.text);
          const dataList = $('.dataList');
          dataList.children().each(function(dataI) {
            let name = '';
            let price = '';
            let count = 0;
            let flag = 3;
            if ($(this).children().length === 6) {
              flag = 4;
            }
            $(this).children().each(function(index) {
              if (index === flag) {
                name = $(this).attr('title');
              }
              if (index === flag + 1) {
                $(this).children().first()
                  .children()
                  .each(function(ii) {
                    if (ii !== 0) {
                      price += $(this).text();
                    }
                  });
                const txt = $(this).children().last()
                  .text();
                if (txt.indexOf('在售') > -1) {
                  count = txt.split('在售：')[1].trim();
                } else {
                  price = 0;
                }
              }
            });
            arr[dataI] = {
              // igxeId: '',
              goodsName: name,
              igxeMinPrice: parseFloat(price),
              igxeSellNum: parseInt(count),
            };
          });
          Arr = Arr.concat(arr);
        } catch (err) {
          console.log(err);
          console.log('导入失败:第' + i + '页');
          Error.push(i);
        }
      }
    }
    const len = Error.length;
    if (Arr.length > 0) {
      this.format(Arr).forEach(item => {
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
    console.log(time.getHours() + ':' + time.getMinutes() + '导入Igxe数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
  }
  async getCheapData(flag) {
    const Error = [];
    let Arr = [];
    const url = 'https://www.igxe.cn/svip/igb_sale_product?app_id=730&product_category_id=&product_type_id=&tags_exterior_id=&tags_rarity_id=&tags_quality_id=&sort_key=1&sort_rule=2&market_name=&page_no=';
    const headers = this.config.igxeCheapHeader;
    headers['User-Agent'] = fakeUa();
    const res = await request.get(url + 1).set(headers).proxy(this.config.proxy[0])
      .timeout({ deadline: 5000 });
    if (res.status !== 200 || !res.text || !JSON.parse(res.text).rows) {
      console.log('igxe的session过期');
      return;
    }
    const l = !flag ? JSON.parse(res.text).pager.page_count : 5;
    for (let i = 1; i <= l; i++) {
      console.log('IGXE-95折-页码:' + i);
      await (this.sleep(!flag ? this.config.igxeCheapFrequency : 50));
      try {
        const headers = this.config.igxeCheapHeader;
        headers['User-Agent'] = fakeUa();
        const res = await request.get(url + i).proxy(this.config.proxy[0]).set(headers)
          .timeout({ deadline: 5000 });
        Arr = Arr.concat(JSON.parse(res.text).rows.map(item => {
          return {
            goodsName: item.market_name,
            igxeCheapPrice: (parseFloat(item.unit_price) - parseFloat(item.svip_voucher_money)).toFixed(2),
          };
        }));
      } catch (err) {
        console.log('导入失败:第' + i + '页');
        Error.push(i);
      }
    }
    let errors = [];
    for (let k = 0; k < 2; k++) {
      errors = [];
      for (let i = 0; i < Error.length; i++) {
        console.log('再次导入IGXE-95折-页码:' + Error[i]);
        await (this.sleep(!flag ? this.config.igxeCheapFrequency : 50));
        try {
          const headers = this.config.igxeCheapHeader;
          headers['User-Agent'] = fakeUa();
          const res = await request.get(url + Error[i]).proxy(this.config.proxy[0]).set(headers)
            .timeout({ deadline: 5000 });
          Arr = Arr.concat(JSON.parse(res.text).rows.map(item => {
            return {
              goodsName: item.market_name,
              igxeCheapPrice: (parseFloat(item.unit_price) - parseFloat(item.svip_voucher_money)).toFixed(2),
            };
          }));
        } catch (err) {
          console.log('再次导入失败:第' + Error[i] + '页');
          console.log(err);
          errors.push(Error[i]);
        }
      }
    }
    // console.log(Arr)
    if (Arr.length > 0) {
      try {
        await this.ctx.model.Csgoex.updateMany(
          !flag ? { igxeCheapPrice: { $gt: 0.1 } } : { igxeCheapPrice: { $gt: 40 } },
          { $set: { igxeCheapPrice: 0 } }
        );
      } catch (error) {
        console.log(error);
      }
      Arr.forEach(item => {
        this.ctx.model.Csgoex.updateOne({
          goodsName: item.goodsName,
        },
        item,
        {
          upsert: false,
        }, () => {
          // console.log('写入mongo失败:', item.goodsName, item.igxeCheapPrice)
        });
      });
    }
    const time = new Date();
    console.log(time.getHours() + ':' + time.getMinutes() + '导入Igxe数据:' + Arr.length + '条');
    console.log('失败次数:' + errors.length);
  }
  async canBuy(query) {
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 10000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.igxeMinPrice > 2
    );
    list.sort((a, b) => {
      return b.steamMinPrice / b.igxeMinPrice - a.steamMinPrice / a.igxeMinPrice;
    });
    list = list.slice(0, 300);
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        igxeId: e.igxeId,
        goodsName: e.goodsName,
        c5link: e.c5link,
        c5MinPrice: e.c5MinPrice,
        steamMarketUrl: e.steamMarketUrl,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        igxeSellNum: e.igxeSellNum,
        time: e.date,
      };
    });
    return list;
  }
  async canUse(query) {
    const match = {
      steamMinPrice: { $gt: 0 },
      buffMinPrice: { $lte: 30000, $gt: 0.1 },
      goodsName: { $regex: query.name },
    };
    if (!query.flag) {
      match.igxeMinPrice = {
        $lte: parseFloat(query.maxPrice),
        $gte: parseFloat(query.minPrice),
      };
    } else {
      match.igxeCheapPrice = { $gt: 0.1 };
    }
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: match,
      },
    ]);
    // 售价直接比较
    // list = list.filter(item =>
    //   parseFloat(item.buffMinPrice) - parseFloat(item.igxeMinPrice) > 0
    //   && item.goodsName.indexOf('印花') === -1
    //   && item.sellNum > 10
    //   && item.igxeSellNum > 10
    //   && item.goodsName.indexOf('StatTrak') === -1
    //   && parseFloat(item.igxeMinPrice) > 0
    //   && parseFloat(item.buffMinPrice) - parseFloat(item.igxeMinPrice) < 800
    // );
    // list.sort((a, b) => {
    //   return (parseFloat(b.buffMinPrice) * 0.975 - parseFloat(b.igxeMinPrice)) - (parseFloat(a.buffMinPrice) * 0.975 - parseFloat(a.igxeMinPrice));
    // });
    // buff比价
    // list = list.filter(item =>
    //   parseFloat(item.igxeMinPrice) - parseFloat(item.buffMinPrice) > 0
    //   && item.goodsName.indexOf('印花') === -1
    //   && parseFloat(item.igxeMinPrice) - parseFloat(item.buffMinPrice) < 40
    //   && parseFloat(item.buffMinPrice) > 1
    //   && parseFloat(item.buffMinPrice) < 300
    //   && item.igxeSellNum > 10
    // );
    // list.sort((a, b) => {
    //   return (parseFloat(b.igxeMinPrice) * 0.975 - parseFloat(b.buffMinPrice)) - (parseFloat(a.igxeMinPrice) * 0.975 - parseFloat(a.buffMinPrice));
    // });
    // normal
    list = list.filter(item => {
      let price = 0;
      if (query.flag) {
        price = parseFloat(item.igxeCheapPrice);
        item.igxeMinPrice = parseFloat(item.igxeCheapPrice);
      } else {
        if (item.igxeCheapPrice) {
          price = item.igxeMinPrice > 0 ?
            (item.igxeMinPrice > item.igxeCheapPrice ? item.igxeCheapPrice : item.igxeMinPrice) : item.igxeCheapPrice;
        } else {
          price = parseFloat(item.igxeMinPrice);
        }
        item.igxeMinPrice = price;
      }
      if (query.isTrueData) {
        item.buffBuyPrice = item.buffBuyPrice > item.buffMinPrice ? item.buffMinPrice : item.buffBuyPrice;
      }
      return parseFloat(item.buffMinPrice) - parseFloat(price) > -50;
    });
    list.sort((a, b) => {
      return (parseFloat(b.buffBuyPrice) * 0.975 - parseFloat(b.igxeMinPrice)) - (parseFloat(a.buffBuyPrice) * 0.975 - parseFloat(a.igxeMinPrice));
    });
    list = list.slice(0, 200);
    // 查重
    // let a = await this.ctx.model.Csgoex.aggregate([
    //   {"$group" : { "_id": "$goodsName", "count": { "$sum": 1 } } },
    //   {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
    //   {"$sort": {"count" : -1} },
    //   {"$project": {"name" : "$_id", "_id" : 0} }
    // ]);
    // console.log(a)
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        c5link: e.c5link,
        c5MinPrice: e.c5MinPrice,
        igxeId: e.igxeId,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        buffBuyPrice: e.buffBuyPrice,
        steamMinPrice: e.steamMinPrice,
        igxeSellNum: e.igxeSellNum,
        time: e.date,
      };
    });
    return list;
  }
  format(data) {
    return data.map(item => {
      return {
        igxeId: item.igxeId,
        goodsName: item.goodsName,
        igxeMinPrice: item.igxeMinPrice,
        igxeSellNum: item.igxeSellNum,
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
