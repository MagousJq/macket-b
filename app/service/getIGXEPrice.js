'use strict';

const Service = require('egg').Service;
const cheerio=require('cheerio');

class GoodsService extends Service {
  async getTotalData() {
    const Error = [];
    let Arr = [];
    for (let i = 1; i < 120; i++) {
      console.log('IGXE-CSGO页数:' + i);
      await (this.sleep(this.config.frequency));
      try {
        let arr = []
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
            igxeId: '',
            goodsName: name,
            igxeMinPrice: price,
            steamMinPrice: '',
            sellNum: count,
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
        this.ctx.model.IgxeCsgo.updateOne({
          goodsName: item.goodsName
        },
        item,
        {
          upsert: true
        }, (err) => {});
      });
    }
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + len);
  }
  async canBuy(query = {
    minPrice: 0.4,
    maxPrice: 60,
    name: '',
    sellNum: 1,
  }) {
    const Time = await this.ctx.model.Time.find({ type: 'IGXECSGO' });
    const BuffTime = await this.ctx.model.Time.find({ type: 'CSGO' });
    // let list = await this.ctx.model.IgxeCsgo.find({ dateId: Time.length ? Time[Time.length - 1]._id : null });
    let list = await this.ctx.model.Csgo.aggregate([
      {
        $match:{
          dateId: BuffTime.length ? BuffTime[BuffTime.length - 1]._id : null,
          buffMinPrice: { $lte: query.maxPrice, $gte: query.minPrice },
          sellNum: { $gte: query.sellNum }
        }
      },
      {
        $lookup:{
          from:"igxecsgos",
          let: { name: "$goodsName" },
          pipeline: [
            { $match:
              { $expr:
                { $and:
                  [
                    { $eq: [ "$goodsName",  "$$name" ] }
                  ]
                }
              }
            }
          ],
          as:"buffCsgo"
        }
      }
    ]);
    list = list.filter(item => {
      let len = item.buffCsgo.length
      if(len){
        let buffCsgo = item.buffCsgo[0]
        return item.steamMinPrice <= 8000
        && item.steamMinPrice > 0
        // && item.steamMinPrice / buffCsgo.igxeMinPrice >= 2
        && item.goodsName.indexOf(query.name) >= 0
      }else{
        return false
      }
    });
    list = list.slice(0, 200);
    list.sort((a, b) => {
      return b.steamMinPrice / b.buffCsgo[0].igxeMinPrice - a.steamMinPrice / a.buffCsgo[0].igxeMinPrice;
    });
    console.log(list)
    // list = list.filter((item, index) => {
    //   return !list.slice(index + 1).some(e => {
    //     return e.goodsName === item.goodsName;
    //   });
    // });
    list = list.map(e => {
      return {
        id: e._id,
        igxeId: e.buffCsgo[0] ? e.buffCsgo[0].igxeId : '-',
        goodsName: e.buffCsgo[0] ? e.buffCsgo[0].goodsName : '-',
        buffMinPrice: e.buffMinPrice,
        buffId: e.buffId,
        igxeMinPrice: e.buffCsgo[0] ? e.buffCsgo[0].igxeMinPrice : '-',
        steamMinPrice: e.steamMinPrice,
        sellNum: e.buffCsgo[0] ? e.buffCsgo[0].sellNum : '-',
        time: Time[Time.length - 1].date,
        buffCsgo: e.buffCsgo
      };
    });
    return list;
  }
  format(data) {
    return data.map(item => {
      return {
        igxeId: item.igxeId,
        goodsName: item.goodsName,
        steamMinPrice: item.steamMinPrice,
        igxeMinPrice: item.igxeMinPrice,
        sellNum: item.sellNum
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;