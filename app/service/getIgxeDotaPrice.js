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
    const list = [{
      total: 26,
      url: this.config.urlList.igxeDotaBeta,
    },
    {
      total: 10,
      url: this.config.urlList.igxeDotaPro,
    },
    ];
    for (let j = 0; j < 2; j++) {
      for (let i = 1; i < list[j].total; i++) {
        console.log('IGXE-DOTA页数:' + i);
        await (this.sleep(this.config.igxeFrequency));
        try {
          const arr = [];
          const headers = this.config.igxeHeader;
          headers['User-Agent'] = fakeUa();
          const Data = await request.get(list[j].url + i).proxy(this.config.proxy[0]).set(headers)
            .timeout({ deadline: 5000 });
          const $ = cheerio.load(Data.text);
          const dataList = $('.dataList');
          dataList.children().each(function(index) {
            const str = $(this).text().replace(/\n/g, '')
              .trim();
            let name = str.split(' ￥ ')[0];
            name = name.slice(2, name.length).trim();
            const price = parseFloat(str.split(' ￥ ')[1].split(' 在售：')[0].replace(/\s/g, '').trim());
            const count = parseFloat(str.split(' ￥ ')[1].split(' 在售：')[1].replace(/\s/g, '').trim());
            arr[index] = {
              // igxeId: '',
              goodsName: name,
              igxeMinPrice: price,
              igxeSellNum: count,
            };
          });
          Arr = Arr.concat(arr);
        } catch (err) {
          console.log(err);
          console.log('导入失败:' + i);
          Error.push(i);
        }
      }
    }
    const len = Error.length;
    if (Arr.length > 0) {
      this.format(Arr).forEach(item => {
        this.ctx.model.Dota.updateOne({
          goodsName: item.goodsName,
        },
        item,
        {
          upsert: false,
        }, () => {});
      });
    }
    const time = new Date();
    console.log(time.getHours() + ':' + time.getMinutes() + '导入Igxe-dota数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
  }
  async canBuy(query) {
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.igxeMinPrice >= 2
      && item.goodsName.indexOf('传世') === -1
      && item.goodsName.indexOf('冥灵') === -1
      && item.goodsName.indexOf('签名') === -1
    );
    list = list.slice(0, 200);
    list.sort((a, b) => {
      return b.steamMinPrice / b.igxeMinPrice - a.steamMinPrice / a.igxeMinPrice;
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        igxeId: e.igxeId,
        goodsName: e.goodsName,
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
  async spread(query) {
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
        },
      },
    ]);
    list = list.filter(item =>
      item.buffMinPrice / item.igxeMinPrice >= 1.5
      && item.goodsName.indexOf(query.name) > -1
    );
    list = list.slice(0, 300);
    list.sort((a, b) => {
      return b.buffMinPrice / b.igxeMinPrice - a.buffMinPrice / a.igxeMinPrice;
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        igxeId: e.igxeId,
        goodsName: e.goodsName,
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
  async canUse() {
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 3000, $gt: 0 },
          igxeMinPrice: { $gt: 0.3 },
          buffMinPrice: { $gt: 0.3 },
        },
      },
    ]);
    list = list.filter(item =>
      parseFloat(item.buffBuyPrice) * 0.98 - parseFloat(item.igxeMinPrice) > 0.3
    );
    list.sort((a, b) => {
      return (parseFloat(b.buffBuyPrice) * 0.98 - parseFloat(b.igxeMinPrice)) - (parseFloat(a.buffBuyPrice) * 0.98 - parseFloat(a.igxeMinPrice));
    });
    list = list.slice(0, 300);
    // let a = await this.ctx.model.Dota.aggregate([
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
