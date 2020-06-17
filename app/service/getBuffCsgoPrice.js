'use strict';

const moment = require('moment');
const Service = require('egg').Service;
class GoodsService extends Service {
  async getTotalPage() {
    try {
      const Data = await this.ctx.curl(this.config.urlList.buffCsgo + 2, {
        dataType: 'json',
        headers: this.config.header,
      });
      if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
        return Data.data.data.total_page;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }
  async store(total) {
    const now = new Date();
    let Arr = [];
    const Error = [];
    let error = 0;
    for (let i = 1; i < total - 1; i++) {
      console.log('BUFF-CSGO页数:' + i);
      await (this.sleep(this.config.frequency));
      try {
        const Data = await this.ctx.curl(this.config.urlList.buffCsgo + i, {
          dataType: 'json',
          headers: this.config.header,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Arr = Arr.concat(Data.data.data.items);
        } else {
          error++;
        }
      } catch (err) {
        console.log('初次失败:第' + i + '页');
        await (this.sleep(this.config.frequency));
        Error.push(i);
      }
    }
    try {
      await this.ctx.model.Csgoex.deleteMany();
    } catch (error) { 
      console.log(error);
    }
    const len = Error.length;
    if (len) {
      await (this.sleep(1000));
    }
    for (let i = 0; i < len; i++) {
      await (this.sleep(this.config.frequency));
      try {
        const Data = await this.ctx.curl(this.config.urlList.buffCsgo + Error[i], {
          dataType: 'json',
          headers: this.config.header,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Arr = Arr.concat(Data.data.data.items);
        } else {
          error++;
        }
      } catch (err) {
        error++;
        console.log('失败页数：' + Error[i]);
      }
    }
    const theDate = await this.ctx.model.Time.create({
      date: now,
      num: Arr.length,
      type: 'Csgoex',
    });
    this.format(Arr, theDate._id).forEach(item => {
      this.ctx.model.Csgoex.create(item);
    });
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + error);
  }
  async canBuy(query) {
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = []
    if(query.name.indexOf('sp') === -1){
      list = await this.ctx.model.Csgoex.aggregate([
        {
          $match:{ 
            dateId: Time.length ? Time[Time.length - 1]._id : null,
            steamMinPrice: { $lte: 8000, $gte: 0 },
            buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
            sellNum: { $gte: parseInt(query.sellNum) },
            goodsName: { $regex : query.name }
          }
        }
      ]);
      list = list.filter(item =>
        parseFloat(item.steamMinPrice) / parseFloat(item.buffMinPrice) >= 2
      );
      list.sort((a, b) => {
        return b.steamMinPrice / b.buffMinPrice - a.steamMinPrice / a.buffMinPrice;
      });
      list = list.slice(0, 200);
    }else{
      list = await this.ctx.model.Csgoex.aggregate([
        {
          $match:{ 
            dateId: Time.length ? Time[Time.length - 1]._id : null,
            steamMinPrice: { $lte: 5000, $gte: 10 },
            buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
            sellNum: { $gte: parseInt(query.sellNum) },
            buffBuyPrice: { $gte: 10 },
            goodsName: { $regex : query.name.split('sp')[0] }
          }
        }
      ]);
      list = list.filter(item =>
        parseFloat(item.steamMinPrice) / parseFloat(item.buffMinPrice) >= 1.2
        && item.goodsName.indexOf('印花') === -1
      );
      list.sort((a, b) => {
        return (a.buffMinPrice - a.buffBuyPrice) - (b.buffMinPrice - b.buffBuyPrice);
      });
      // list.sort((a, b) => {
      //   return b.buffMinPrice - a.buffMinPrice;
      // });
      list = list.slice(0, 200);
    }
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        buffBuyPrice: e.buffBuyPrice,
        igxeMinPrice: e.igxeMinPrice || '-',
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: Time[Time.length - 1].date,
      };
    });
    return list;
  }
  async canSell() {
    const query = {
      maxPrice: 300,
      minPrice: 0.3,
      sellNum: 10
    }
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 800, $gte: 0 },
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) }
        }
      }
    ]);
    list = list.filter(item =>
      item.buffMinPrice / item.steamMinPrice <= 300
      && item.buffMinPrice / item.steamMinPrice >= 0.8
      && item.goodsName.indexOf('印花') === -1
      && item.goodsName.indexOf('涂鸦') === -1
      && item.goodsName.indexOf('破损不堪') === -1
      && item.goodsName.indexOf('战痕累累') === -1
      // && (item.goodsName.indexOf('AK') > -1 ||
      // item.goodsName.indexOf('M4') > -1||
      // item.goodsName.indexOf('AWP') > -1||
      // item.goodsName.indexOf('沙漠之鹰') > -1)
    );
    list = list.slice(0, 1000);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list.sort((a, b) => {
      return a.steamMinPrice / a.buffMinPrice - b.steamMinPrice / b.buffMinPrice;
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        buffBuyPrice: e.buffBuyPrice,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: Time[Time.length - 1].date,
      };
    });
    return list;
  }
  async storeAvaKnifePrice() { 
    const now = moment().format('YYYY-MM-DD');
    const query = {
      name: '刀|剑|匕|手套 |裹手',
      maxPrice: 4000,
      minPrice: 300,
      sellNum: 20
    }
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        }
      }
    ]);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    let Error = [];
    // console.log(list.length)
    // list = list.slice(0, 1);
    let listLen = list.length;
    for (let i = 0; i < listLen; i++) {
      console.log('导入-' + list[i].goodsName);
      await (this.sleep(this.config.frequency));
      try {
        let avaPrice = 0, len = 0;
        const ava = this.formatAvaPrice(list[i].buffMinPrice);
        const Data = await this.ctx.curl(this.config.urlList.knifeAva + list[i].buffId, {
          dataType: 'json',
          headers: this.config.knifeHeader,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Data.data.data.price_history.forEach(item => {
            if(item[1] >= list[i].buffMinPrice - ava && item[1] <= list[i].buffMinPrice + ava){
              avaPrice += parseFloat(item[1]);
              len++;
            }
          })
          avaPrice = parseFloat((avaPrice/len).toFixed(2));
          this.ctx.model.CsgoKnife.updateOne({
            buffId: list[i].buffId,
          },
          {
            date: now,
            goodsName: list[i].goodsName,
            buffId: list[i].buffId,
            avaPrice: avaPrice
          },
          {
            upsert: true,
          }, err => {});
        } else {
          console.log(Data);
          return;
        }
      } catch (err) {
        console.log(err);
        Error.push(list[i]);
      }
      if(i === listLen - 1){
        console.log('初次导入完成')
      }
    }
    for (let i = 0; i < Error.length; i++) {
      console.log('再次导入-' + Error[i].goodsName);
      await (this.sleep(this.config.frequency));
      try {
        let avaPrice = 0, len = 0;
        const ava = this.formatAvaPrice(Error[i].buffMinPrice);
        const Data = await this.ctx.curl(this.config.urlList.knifeAva + Error[i].buffId, {
          dataType: 'json',
          headers: this.config.knifeHeader,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Data.data.data.price_history.forEach(item => {
            if(item[1] >= Error[i].buffMinPrice - ava && item[1] <= Error[i].buffMinPrice + ava){
              avaPrice += parseFloat(item[1]);
              len++;
            }
          })
          avaPrice = parseFloat((avaPrice/len).toFixed(2));
          this.ctx.model.CsgoKnife.updateOne({
            buffId: Error[i].buffId,
          },
          {
            date: now,
            goodsName: Error[i].goodsName,
            buffId: Error[i].buffId,
            avaPrice: avaPrice
          },
          {
            upsert: true,
          }, err => {});
        }
      } catch (err) {
        console.log(Error[i].goodsName + ' 导入失败')
        console.log(err);
      }
    }
  }
  async getAvaKnifePrice(){
    const Time = await this.ctx.model.Time.find({ type: 'Csgoex' });
    let list = await this.ctx.model.CsgoKnife.aggregate([
      {
        $lookup:{ 
          from: 'csgoexes',
          localField: 'goodsName',
          foreignField: 'goodsName',
          as: 'newGoods'
        }
      }
    ]);
    list = list.map(item => {
      let node = item.newGoods[0]
      return {
        time: Time[Time.length - 1].date,
        buffId: item.buffId,
        avaPrice: item.avaPrice,
        goodsName: item.goodsName,
        steamMinPrice: node.steamMinPrice,
        steamMarketUrl: node.steamMarketUrl,
        buffMinPrice: node.buffMinPrice,
        buffBuyPrice: node.buffBuyPrice,
        sellNum: node.sellNum,
        igxeSellNum: node.igxeSellNum,
        igxeMinPrice: node.igxeMinPrice
      };
    })
    list = list.filter(item =>
      parseFloat(item.buffMinPrice) < parseFloat(item.avaPrice)
    );
    list.sort((a, b) => {
      return (parseFloat(a.buffMinPrice) - parseFloat(a.avaPrice) * 0.975) - (parseFloat(b.buffMinPrice) - parseFloat(b.avaPrice) * 0.975);
    });
    return list.slice(0, 100);
  }
  format(data, id) {
    return data.map(item => {
      return {
        buffId: item.id,
        goodsName: item.name,
        steamMinPrice: item.goods_info.steam_price_cny,
        steamMarketUrl: item.steam_market_url,
        buffMinPrice: item.sell_min_price,
        buffBuyPrice: item.buy_max_price,
        sellNum: item.sell_num,
        dateId: id,
        igxeSellNum: 0,
        igxeMinPrice: 0,
        igxeId: null
      };
    });
  }
  formatAvaPrice(val){
    return (parseInt(val / 1000) + 1) * 100
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
