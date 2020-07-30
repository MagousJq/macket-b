'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');
const request = require('superagent');
require('superagent-proxy')(request);
const fakeUa = require('fake-useragent');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let Arr = [];
    let list = [{
        total: 26,
        url: this.config.urlList.igxeDotaBeta
      },
      {
        total: 10,
        url: this.config.urlList.igxeDotaPro
      },
    ]
    for (let j = 0; j < 2; j++) {
      for(let i = 1; i < list[j].total; i++){
        console.log('IGXE-DOTA页数:' + i);
        await (this.sleep(this.config.igxeFrequency));
        try {
          let arr = []; 
          let headers = this.config.igxeHeader
          headers['User-Agent'] = fakeUa()
          let headers = this.config.igxeHeader
          const Data = await this.ctx.curl(list[j].url + i,{
            headers
          });
          const Data = await request.get(item.url + i).proxy(this.config.proxy[0]).set(headers).timeout({ deadline: 5000 });
          let html = Buffer.from(Data.text).toString();
          let $ = cheerio.load(html);
          let dataList=$('.dataList');
          dataList.children().each(function(index) {
            let str = $(this).text().replace(/\n/g, '').trim();
            let name = str.split(' ￥ ')[0];
            name = name.slice(2, name.length).trim()
            let price = parseFloat(str.split(' ￥ ')[1].split(' 在售：')[0].replace(/\s/g, '').trim());
            let count = parseFloat(str.split(' ￥ ')[1].split(' 在售：')[1].replace(/\s/g, '').trim());
            arr[index] = {
              // igxeId: '',
              goodsName: name,
              igxeMinPrice: price,
              igxeSellNum: count,
            }
          })
          Arr = Arr.concat(arr);
        } catch (err) {
          console.log(err)
          console.log('导入失败:' + i)
          Error.push(i);
        }
      }        
    }
    const len = Error.length;
    if(Arr.length > 0){
      this.format(Arr).forEach(item => {
        this.ctx.model.Dota.updateOne({
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          goodsName: item.goodsName
        },
        item,
        {
          upsert: false
        }, (err) => {});
      });
    }
    let time = new Date()
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
    console.log('需等待3-10分钟，依据你电脑性能处理速度不一样');
    console.log(time.getHours() + ':' + time.getMinutes());
  }
  async canBuy(query) {
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex : query.name }
        }
      }
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
        time: Time[Time.length - 1].date
      };
    });
    return list;
  }
  async spread(query) {
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) }
        }
      }
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
        time: Time[Time.length - 1].date
      };
    });
    return list;
  }
  async canUse() {
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 3000, $gt: 0 },
          igxeMinPrice: { $gt: 0.3 },
          buffMinPrice: { $gt: 0.3 }
        }
      }
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
        time: Time[Time.length - 1].date
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
        igxeSellNum: item.igxeSellNum
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;