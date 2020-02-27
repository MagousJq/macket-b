'use strict';

const Service = require('egg').Service;
const cheerio = require('cheerio');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let Arr = [];
    const igxeCsKindsLen = this.config.urlList.igxeCsKinds.length;
    for (let j = 0; j < igxeCsKindsLen; j++) {
      const item = this.config.urlList.igxeCsKinds[j];
      for (let i = 1; i <= item.pages; i++) {
        console.log('IGXE-CSGO-' + item.name + '-页码:' + i);
        await (this.sleep(this.config.igxeFrequency));
        try {
          const arr = [];
          const Data = await this.ctx.curl(item.url + i);
          let data = JSON.stringify(Data.data);
          let html = Buffer.from(JSON.parse(data).data).toString();
          let kinds = ['崭新出场','略有磨损','久经沙场','战痕累累','破损不堪','无涂装'];
          let $ = cheerio.load(html);
          let dataList=$('.dataList');
          dataList.children().each(function(index) {
            let str = $(this).text().replace(/\n/g, '')
              .trim();
            if (kinds.some(item => str.indexOf(str) !== -1)) {
              const len = str.length;
              if (str.indexOf('音乐盒') === -1) {
                str = str.slice(5, len);
              }
            }
            const name = str.split(' ￥ ')[0].trim();
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
          // console.log(err)
          Error.push(i);
        }
      }
    }
    const len = Error.length;
    if (Arr.length > 0) {
      this.format(Arr).forEach(item => {
        this.ctx.model.Csgoex.updateOne({
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          goodsName: item.goodsName,
        },
        item,
        {
          upsert: false,
        }, err => {});
      });
    }
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
    console.log('需等待3-10分钟，依据你电脑性能处理速度不一样');
  }
  async canBuy(query) {
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.igxeMinPrice >= 2
    );
    list = list.slice(0, 300);
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
        time: Time[Time.length - 1].date,
      };
    });
    return list;
  }
  async canUse(query) {
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $gt: 0 },
          buffMinPrice: { $lte: 3000, $gt: 0.3 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    // list = list.filter(item =>
    //   parseFloat(item.buffBuyPrice) * 0.975 - parseFloat(item.igxeMinPrice) > 0.2
    // );
    list = list.filter(item =>
      parseFloat(item.buffBuyPrice) - parseFloat(item.igxeMinPrice) > 0
      // && item.goodsName.indexOf('AK') >= 0
      // && item.goodsName.indexOf('久经') >= 0
      && item.igxeMinPrice >= 0.4
    );
    list.sort((a, b) => {
      return (parseFloat(b.buffBuyPrice) * 0.975 - parseFloat(b.igxeMinPrice)) - (parseFloat(a.buffBuyPrice) * 0.975 - parseFloat(a.igxeMinPrice));
    });
    list = list.slice(0, 300);
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
        igxeId: e.igxeId,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        buffBuyPrice: e.buffBuyPrice,
        steamMinPrice: e.steamMinPrice,
        igxeSellNum: e.igxeSellNum,
        time: Time[Time.length - 1].date,
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
