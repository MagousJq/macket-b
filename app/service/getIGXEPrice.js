'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    const Time = await this.ctx.model.Time.find({ type: 'CSGO' });
    let Arr = [];
    for (let i = 1; i < 120; i++) {
      console.log('IGXE-CSGO页数:' + i);
      await (this.sleep(this.config.frequency));
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
            // steamMinPrice: '',
            igxeSellNum: count,
          }
        })
        Arr = Arr.concat(arr)
      } catch (err) {
        console.log(err)
        Error.push(i);
      }
    }
    const len = Error.length;
    // if (len) {
    //   await (this.sleep(1000));
    // }
    if(Arr.length > 0){
      this.format(Arr).forEach(item => {
        this.ctx.model.Csgo.updateOne({
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
  }
  async canBuy(query = {
    minPrice: 0.2,
    maxPrice: 600,
    name: '',
    sellNum: 1,
  }) {
    const Time = await this.ctx.model.Time.find({ type: 'CSGO' });
    let list = await this.ctx.model.Csgo.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          igxeMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          igxeSellNum: { $gte: parseInt(query.sellNum) }
        }
      }
    ]);
    // let list = await this.ctx.model.IgxeCsgo.find({ dateId: Time.length ? Time[Time.length - 1]._id : null });
    // let list = await this.ctx.model.Csgo.aggregate([
    //   {
    //     $match:{
    //       dateId: BuffTime.length ? BuffTime[BuffTime.length - 1]._id : null,
    //       buffMinPrice: { $lte: query.maxPrice, $gte: query.minPrice },
    //       sellNum: { $gte: query.sellNum }
    //     }
    //   },
    //   {
    //     $lookup:{
    //       from:"igxecsgos",
    //       let: { name: "$goodsName" },
    //       pipeline: [
    //         { $match:
    //           { $expr:
    //             { $and:
    //               [
    //                 { $eq: [ "$goodsName",  "$$name" ] }
    //               ]
    //             }
    //           }
    //         }
    //       ],
    //       as:"buffCsgo"
    //     }
    //   }
    // ]);
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