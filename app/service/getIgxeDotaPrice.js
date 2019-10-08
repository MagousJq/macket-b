'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let Arr = [];
    for (let i = 1; i < 121; i++) {
      console.log('IGXE-DOTA2页数:' + i);
      await (this.sleep(this.config.frequency));
      try {
        let arr = []; 
        const Data = await this.ctx.curl(this.config.urlList.igxeDotaBeta + i);
        let data = JSON.stringify(Data.data);
        let html = Buffer.from(JSON.parse(data).data).toString();
        let $ = cheerio.load(html);
        let dataList=$('.dataList');
        dataList.children().each(function(index) {
          let str = $(this).text().replace(/\n/g, '').trim();
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
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
    console.log('需等待3-10分钟，依据你电脑性能处理速度不一样');
  }
  async canBuy(query) {
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
      item.steamMinPrice / item.igxeMinPrice >= 2
      && item.goodsName.indexOf(query.name) > -1
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