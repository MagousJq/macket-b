'use strict';

const Service = require('egg').Service;

class GoodsService extends Service {
  async getTotalPage() {
    const url = 'https://buff.163.com/api/market/goods?game=csgo&page_num=';
    try {
      const Data = await this.ctx.curl(url + 22, {
        dataType: 'json',
        headers: Header,
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
    const url = 'https://buff.163.com/api/market/goods?game=csgo&sort_by=price.desc&page_num=';
    const now = new Date();
    let Arr = [];
    const Error = [];
    let error = 0;
    console.log('starting...');
    for (let i = 1; i < total - 20; i++) {
      console.log('页数:' + i);
      await (this.sleep(this.config.frequency));
      try {
        const Data = await this.ctx.curl(url + i, {
          dataType: 'json',
          headers: Header,
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
        const Data = await this.ctx.curl(url + Error[i], {
          dataType: 'json',
          headers: Header,
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
      this.ctx.model.Csgoex.create(item);
    });
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + error);
  }
  async canBuy() {
    const Time = await this.ctx.model.Time.find({ type: 'CSGO' });
    let list = await this.ctx.model.Csgoex.find({ dateId: Time.length ? Time[Time.length - 1]._id : null });
    list = list.filter(item =>
      item.steamMinPrice < 200
      && item.steamMinPrice > 0
      && item.steamMinPrice / item.buffMinPrice > 2
      && item.steamMinPrice / item.buffMinPrice < 6
      && item.buffMinPrice > 0.4
      && item.buffMinPrice < 40
      && item.goodsName.indexOf('印花') === -1
      && item.goodsName.indexOf('涂鸦') === -1
    );
    list.sort((a, b) => {
      return b.steamMinPrice / b.buffMinPrice - a.steamMinPrice / a.buffMinPrice;
    });
    list = list.slice(0, 300);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list = list.slice(0, 80).map(e => {
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
    let list = await this.ctx.model.Csgoex.find({ dateId: Time.length ? Time[Time.length - 1]._id : null });
    list = list.filter(item =>
      item.steamMinPrice < 100
      && item.steamMinPrice > 0
      && item.buffMinPrice / item.steamMinPrice <= 1.1
      && item.buffMinPrice / item.steamMinPrice > 0.9
      && item.buffMinPrice >= 0.5
      && item.goodsName.indexOf('印花') === -1
    );
    list.sort((a, b) => {
      return a.steamMinPrice / a.buffMinPrice - b.steamMinPrice / b.buffMinPrice;
    });
    list = list.slice(0, 300);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list = list.slice(0, 20).map(e => {
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
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
