'use strict';

const Service = require('egg').Service;
class GoodsService extends Service {
  async getTotalPage() {
    try {
      const Data = await this.ctx.curl(this.config.urlList.buffDota + 2, {
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
      console.log('BUFF-DOTA2页数:' + i);
      await (this.sleep(this.config.frequency));
      try {
        const Data = await this.ctx.curl(this.config.urlList.buffDota + i, {
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
    try {
      await this.ctx.model.Dota.deleteMany();
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
        const Data = await this.ctx.curl(this.config.urlList.buffDota + Error[i], {
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
      type: 'DOTA2',
    });
    this.format(Arr, theDate._id).forEach(item => {
      this.ctx.model.Dota.create(item);
    });
    console.log('导入数据：' + Arr.length + '条');
    console.log('失败次数:' + error);
  }
  async canBuy(query) {
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let list = await this.ctx.model.Dota.aggregate([
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
      // 修改筛选条件处
      item.steamMinPrice / item.buffMinPrice >= 2
      // && item.goodsName.indexOf('签名') === -1
      // && item.goodsName.indexOf('传世') === -1
      // && item.goodsName.indexOf('铭刻') === -1
      // && item.goodsName.indexOf('吉祥') === -1
      // && item.goodsName.indexOf('冥灵') === -1
    );
    list.sort((a, b) => {
      return b.steamMinPrice / b.buffMinPrice - a.steamMinPrice / a.buffMinPrice;
    });
    list = list.slice(0, 200);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        igxeMinPrice: e.igxeMinPrice || '-',
        buffMinPrice: e.buffMinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: Time[Time.length - 1].date
      };
    });
    return list;
  }
  async canSell() {
    const Time = await this.ctx.model.Time.find({ type: 'DOTA2' });
    let list = await this.ctx.model.Dota.find({ dateId: Time.length ? Time[Time.length - 1]._id : null });
    list = list.filter(item =>
      item.steamMinPrice < 1000
      // && item.steamMinPrice >= 50
      // item.steamMinPrice >= 20
      && item.buffMinPrice / item.steamMinPrice <= 1.2
      && item.buffMinPrice / item.steamMinPrice > 0.8
      && item.buffMinPrice >= 0.9
      && item.sellNum >= 30
    );
    list.sort((a, b) => {
      return a.steamMinPrice / a.buffMinPrice - b.steamMinPrice / b.buffMinPrice;
    });
    list = list.slice(0, 200);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list = list.slice(0, 40).map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        goodsName: e.goodsName,
        igxeMinPrice: e.igxeMinPrice,
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
        steamMarketUrl: item.steam_market_url,
        steamMinPrice: item.goods_info.steam_price_cny,
        buffBuyPrice: item.buy_max_price,
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
