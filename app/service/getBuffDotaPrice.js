'use strict';

const Service = require('egg').Service;
const request = require('superagent');
require('superagent-proxy')(request);
const fakeUa = require('fake-useragent');
class GoodsService extends Service {
  async getTotalPage() {
    try {
      const headers = this.config.header;
      headers['User-Agent'] = fakeUa();
      headers.cookie = 'session=' + this.config.sessionList[0] + ';';
      const Data = await request.get(this.config.urlList.buffDota + 254).proxy(this.config.proxy[0]).set(headers)
        .timeout({ deadline: 6000 });
      if (Data.status === 200 && Data.text && JSON.parse(Data.text).code === 'OK') {
        return JSON.parse(Data.text).data.total_page;
      }
      console.log(Data.text);
      console.log('这个session过期:' + this.config.sessionList[0]);
      return 0;
    } catch (err) {
      console.log('可能这个session过期:' + this.config.sessionList[0] + ',或者这个代理IP有问题:' + this.config.proxy[0] + ',当然也可能都没问题的,报错原因是：');
      console.log(err);
      return 0;
    }
  }
  async store(total) {
    let Arr = [];
    let errors = [];
    const pages = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    pages.sort(function() {
      return Math.random() - 0.5;
    });
    pages.sort(function() {
      return Math.random() - 0.5;
    });
    const slen = this.config.sessionList.length;
    const pieces = Math.ceil(pages.length / slen);
    for (let i = 1; i <= pieces; i++) {
      const Obj = await this.getBuffOnePage(pages.slice((i - 1) * slen, i * slen));
      errors = errors.concat(Obj.errors);
      Arr = Arr.concat(Obj.data);
      await (this.sleep(this.config.frequency));
    }
    const errorPieces = Math.ceil(errors.length / slen);
    let errorNum = [];
    for (let i = 1; i <= errorPieces; i++) {
      const Obj = await this.getBuffOnePage(errors.slice((i - 1) * slen, i * slen), false);
      errorNum = errorNum.concat(Obj.errors);
      Arr = Arr.concat(Obj.data);
      await (this.sleep(this.config.frequency));
    }
    try {
      await this.ctx.model.Dota.deleteMany();
    } catch (error) {
      console.log(error);
    }
    const now = new Date();
    this.format(Arr).forEach(item => {
      item.date = now;
      this.ctx.model.Dota.create(item);
    });
    console.log('导入Buff-dota数据：' + Arr.length + '条');
    console.log('失败总页数：' + errorNum.length + '页');
  }
  async getBuffOnePage(page) {
    let Arr = [];
    const errors = [];
    for (let i = 0; i < page.length; i++) {
      const index = i % this.config.proxy.length;
      try {
        console.log('导入buff-dota，页码为:', page[i]);
        const headers = this.config.header;
        headers['User-Agent'] = fakeUa();
        headers.cookie = 'session=' + this.config.sessionList[i] + ';';
        const Data = await request.get(this.config.urlList.buffDota + page[i]).proxy(this.config.proxy[index]).set(headers)
          .timeout({ deadline: 6000 });
        if (Data.status === 200 && Data.text && JSON.parse(Data.text).code === 'OK') {
          Arr = Arr.concat(JSON.parse(Data.text).data.items);
        } else {
          errors.push(page[i]);
          console.log('失败:第' + page[i] + '页', 'session为: ' + this.config.sessionList[i], '代理IP为:' + this.config.proxy[index]);
        }
      } catch (err) {
        errors.push(page[i]);
        console.log('失败:第' + page[i] + '页', 'session为: ' + this.config.sessionList[i], '代理IP为:' + this.config.proxy[index]);
        console.log('错误原因:', err);
      }
    }
    return {
      data: Arr,
      errors,
    };
  }
  async canBuy(query) {
    let list = await this.ctx.model.Dota.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 8000, $gte: 0 },
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter(item =>
      // 修改筛选条件处
      item.steamMinPrice / item.buffMinPrice >= 2
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
        time: e.date,
      };
    });
    return list;
  }
  async canSell() {
    let list = await this.ctx.model.Dota.find({ });
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
        time: e.date,
      };
    });
    return list;
  }
  format(data) {
    return data.map(item => {
      return {
        buffId: item.id,
        goodsName: item.name,
        steamMarketUrl: item.steam_market_url,
        steamMinPrice: item.goods_info.steam_price_cny,
        buffBuyPrice: item.buy_max_price,
        buffMinPrice: item.sell_min_price,
        sellNum: item.sell_num,
        igxeSellNum: 0,
        igxeMinPrice: 0,
        igxeId: null,
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GoodsService;
