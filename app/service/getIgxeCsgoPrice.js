'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let Arr = [];
    for (let i = 1; i < 26; i++) {
      console.log('IGXE-CSGO页数:' + i);
      await (this.sleep(this.config.igxeFrequency));
      try {
        let arr = []; 
        const Data = await this.ctx.curl(this.config.urlList.igxeCsgo + i);
        let data = JSON.stringify(Data.data);
        let html = Buffer.from(JSON.parse(data).data).toString();
        let kinds = ['崭新出场','略有磨损','久经沙场','站痕累累','破损不堪'];
        let $ = cheerio.load(html);
        let dataList=$('.dataList');
        dataList.children().each(function(index) {
          let str = $(this).text().replace(/\n/g, '').trim();
          if(kinds.some(item => str.indexOf(str) !== -1)){
            let len = str.length;
            str = str.slice(5, len);
          }
          let name = str.split(' ￥ ')[0].trim();
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
        // console.log(err)
        Error.push(i);
      }
    }
    const len = Error.length;
    if(Arr.length > 0){
      this.format(Arr).forEach(item => {
        this.ctx.model.Csgoex.updateOne({
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          goodsName: item.goodsName
        },
        item,
        {
          upsert: false
        }, (err) => {});
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
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) }
        }
      }
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.igxeMinPrice >= 2
      && item.goodsName.indexOf(query.name) > -1
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
        time: Time[Time.length - 1].date
      };
    });
    return list;
  }
  async canUse() {
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 2000, $gt: 0 },
          igxeMinPrice: { $gt: 0.5 },
          buffMinPrice: { $gt: 0.5 }
        }
      }
    ]);
    list = list.filter(item =>
      item.buffBuyPrice > item.igxeMinPrice 
      // item.igxeMinPrice < item.buffMinPrice && 
      // item.buffMinPrice / item.igxeMinPrice <= 2 && 
      // item.igxeMinPrice / item.buffBuyPrice <= 1.5 && 
      // item.sellNum > 5 
    );
    list.sort((a, b) => {
      return (b.buffBuyPrice * 0.975 - b.igxeMinPrice) - (a.buffBuyPrice * 0.975 - a.igxeMinPrice);
    });
    // list.sort((a, b) => {
    //   return (b.buffMinPrice - b.igxeMinPrice) - (a.buffMinPrice - a.igxeMinPrice);
    // });
    list = list.slice(0, 300);
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