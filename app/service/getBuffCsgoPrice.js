'use strict';

const Service = require('egg').Service;
class GoodsService extends Service {
  async getTotalPage() {
    try {
      const Data = await this.ctx.curl(this.config.urlList.buffCsgo + 22, {
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
    for (let i = 1; i < total - 20; i++) {
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
        Error.push(i);
      }
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
      type: 'CSGO',
    });
    this.format(Arr, theDate._id).forEach(item => {
      this.ctx.model.Csgo.create(item);
    });
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + error);
  }
  async canBuy(query = {
    minPrice: 0.07,
    maxPrice: 2000,
    name: '',
    sellNum: 1,
  }) {
    const Time = await this.ctx.model.Time.find({ type: 'CSGO' });
    let list = await this.ctx.model.Csgo.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) }
        }
      }
    ]);
    list = list.filter(item =>
      item.steamMinPrice / item.buffMinPrice >= 2
      && item.goodsName.indexOf(query.name) > -1
    );
    list = list.slice(0, 200);
    // list = list.filter((item, index) => {
    //   return !list.slice(index + 1).some(e => {
    //     return e.goodsName === item.goodsName;
    //   });
    // });
    list.sort((a, b) => {
      return b.steamMinPrice / b.buffMinPrice - a.steamMinPrice / a.buffMinPrice;
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        goodsName: e.goodsName,
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: Time[Time.length - 1].date,
      };
    });
    return list;
  }
  async canSell() {
    const Time = await this.ctx.model.Time.find({ type: 'CSGO' });
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match:{ 
          dateId: Time.length ? Time[Time.length - 1]._id : null,
          steamMinPrice: { $lte: 8000, $gte: 0 },
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) }
        }
      }
    ]);
    list = list.filter(item =>
      item.steamMinPrice < 5000
      && item.steamMinPrice > 0
      && item.buffMinPrice / item.steamMinPrice <= 40
      && item.buffMinPrice / item.steamMinPrice >= 0.8
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
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: Time[Time.length - 1].date,
      };
    });
    return list;
  }
  format(data, id) {
    return data.map(item => {
      return {
        buffId: item.id,
        goodsName: item.name,
        steamMinPrice: item.goods_info.steam_price_cny,
        buffMinPrice: item.sell_min_price,
        sellNum: item.sell_num,
        dateId: id,
        igxeSellNum: 0,
        igxeMinPrice: 0,
        igxeId: null
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
