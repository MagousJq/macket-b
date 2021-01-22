'use strict';

const moment = require('moment');
const request = require('superagent');
require('superagent-proxy')(request);
const Service = require('egg').Service;
const fakeUa = require('fake-useragent');
class GoodsService extends Service {
  async getTotalPage() {
    try {
      const headers = this.config.header;
      headers['User-Agent'] = fakeUa();
      headers.cookie = 'session=' + this.config.sessionList[0] + ';';
      const Data = await request.get(this.config.urlList.buffCsgo + 2).proxy(this.config.proxy[0]).set(headers)
        .timeout({ deadline: 5000 });
      if (Data.status === 200 && Data.text && JSON.parse(Data.text).code === 'OK') {
        return JSON.parse(Data.text).data.total_page;
      }
      console.log(Data.text);
      console.log('这个session过期:' + this.config.sessionList[0]);
      return 0;
    } catch (err) {
      console.log('可能这个session过期:' + this.config.sessionList[0] + ',或者这个代理IP有问题:' + this.config.proxy[0]);
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
    let errorNum = [];
    for (let i = 0; i < 4; i++) {
      errorNum = [];
      const errorPieces = Math.ceil(errors.length / slen);
      for (let i = 1; i <= errorPieces; i++) {
        const Obj = await this.getBuffOnePage(errors.slice((i - 1) * slen, i * slen), true);
        errorNum = errorNum.concat(Obj.errors);
        Arr = Arr.concat(Obj.data);
        errors = errorNum;
        await (this.sleep(this.config.frequency));
      }
    }
    const now = new Date();
    this.format(Arr).forEach(item => {
      item.date = now;
      this.ctx.model.Csgoex.updateOne({
        goodsName: item.goodsName,
      },
      item,
      {
        upsert: true,
      }, () => {
        // console.log('写入mongo失败:', item.goodsName, item.igxeCheapPrice)
      });
    });
    const time = new Date();
    console.log(time.getHours() + ':' + time.getMinutes() + '导入Buff数据：' + Arr.length + '条');
    console.log('失败总页数：' + errorNum.length + '页');
  }
  async getBuffOnePage(page, flag) {
    let Arr = [];
    const errors = [];
    for (let i = 0; i < page.length; i++) {
      await (this.sleep(200));
      let index = i % this.config.proxy.length;
      if (flag) {
        index = 0;
      }
      try {
        const str = flag ? '再次导入buff-csgo，页码为:' : '导入buff-csgo，页码为:';
        console.log(str, page[i]);
        const headers = this.config.header;
        headers['User-Agent'] = fakeUa();
        headers.cookie = 'session=' + this.config.sessionList[i] + ';';
        const Data = await request.get(this.config.urlList.buffCsgo + page[i]).proxy(this.config.proxy[index]).set(headers)
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
      }
    }
    return {
      data: Arr,
      errors,
    };
  }
  async canBuy(query) {
    let list = [];
    if (query.name.indexOf('sp') === -1) {
      list = await this.ctx.model.Csgoex.aggregate([
        {
          $match: {
            steamMinPrice: { $lte: 10000, $gte: 0 },
            buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
            sellNum: { $gte: parseInt(query.sellNum) },
            goodsName: { $regex: query.name },
          },
        },
      ]);
      list = list.filter(item =>
        parseFloat(item.steamMinPrice) / parseFloat(item.buffMinPrice) > 2
        // && item.goodsName.indexOf('刀') === -1
        // && item.goodsName.indexOf('印花') === -1
        // && item.goodsName.indexOf('匕') === -1
        // && item.goodsName.indexOf('剑') === -1
        // && item.goodsName.indexOf('战痕累累') === -1
        // && item.goodsName.indexOf('破损不堪') === -1
        // && item.goodsName.indexOf('剑') === -1
        // && item.goodsName.indexOf('涂鸦') === -1
        // && item.goodsName.indexOf('纪念品') === -1
      );
      list.sort((a, b) => {
        return b.steamMinPrice / b.buffMinPrice - a.steamMinPrice / a.buffMinPrice;
      });
      list = list.slice(0, 200);
    } else {
      list = await this.ctx.model.Csgoex.aggregate([
        {
          $match: {
            steamMinPrice: { $lte: 5000, $gte: 10 },
            buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
            sellNum: { $gte: parseInt(query.sellNum) },
            buffBuyPrice: { $gte: 10 },
            goodsName: { $regex: query.name.split('sp')[0] },
          },
        },
      ]);
      list = list.filter(item =>
        parseFloat(item.steamMinPrice) / parseFloat(item.buffMinPrice) >= 1.2
        && item.goodsName.indexOf('印花') === -1
      );
      list.sort((a, b) => {
        return (a.buffMinPrice - a.buffBuyPrice) - (b.buffMinPrice - b.buffBuyPrice);
      });
      list = list.slice(0, 200);
    }
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        c5link: e.c5link,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        buffBuyPrice: e.buffBuyPrice,
        igxeMinPrice: e.igxeMinPrice || '-',
        buffMinPrice: e.buffMinPrice,
        c5MinPrice: e.c5MinPrice,
        steamMinPrice: e.steamMinPrice,
        sellNum: e.sellNum,
        time: e.date,
      };
    });
    return list;
  }
  async canSell() {
    const query = {
      maxPrice: 300,
      minPrice: 0.3,
      sellNum: 10,
    };
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          steamMinPrice: { $lte: 1000, $gte: 0 },
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) },
        },
      },
    ]);
    list = list.filter(item =>
      item.buffMinPrice / item.steamMinPrice <= 300
      && item.steamMinPrice - item.buffBuyPrice > -5
      && item.goodsName.indexOf('印花') === -1
      && item.goodsName.indexOf('涂鸦') === -1
      && item.goodsName.indexOf('破损不堪') === -1
      && item.goodsName.indexOf('战痕累累') === -1
      // && item.buffBuyPrice >= 2
      // && item.buffBuyPrice <= 5
      // && (item.goodsName.indexOf('AK') > -1 ||
      // item.goodsName.indexOf('M4') > -1||
      // item.goodsName.indexOf('AWP') > -1||
      // item.goodsName.indexOf('沙漠之鹰') > -1)
    );
    list.sort((a, b) => {
      return a.steamMinPrice / a.buffBuyPrice - b.steamMinPrice / b.buffBuyPrice;
    });
    list = list.slice(0, 1000);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    list = list.map(e => {
      return {
        id: e._id,
        buffId: e.buffId,
        c5link: e.c5link,
        goodsName: e.goodsName,
        steamMarketUrl: e.steamMarketUrl,
        buffBuyPrice: e.buffBuyPrice,
        igxeMinPrice: e.igxeMinPrice,
        buffMinPrice: e.buffMinPrice,
        c5MinPrice: e.c5MinPrice,
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
        steamMinPrice: item.goods_info.steam_price_cny,
        steamMarketUrl: item.steam_market_url,
        buffMinPrice: item.sell_min_price,
        buffBuyPrice: item.buy_max_price,
        sellNum: item.sell_num,
        date: item.date,
        igxeSellNum: 0,
        igxeMinPrice: 0,
        c5MinPrice: 0,
        igxeCheapPrice: 0,
        c5link: null,
        igxeId: null,
      };
    });
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async proxy() {
    let error = 0;
    for (let i = 0; i < this.config.proxy.length; i++) {
      const headers = this.config.igxeHeader;
      headers['User-Agent'] = fakeUa();
      try {
        const data = await request.get('https://www.igxe.cn/csgo/730?ctg_name=%E6%89%8B%E6%9E%AA&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=1&type_id=0&page_size=20&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=1').proxy(this.config.proxy[i]).set('header', headers)
          .timeout({ deadline: 4000 });
        const data2 = await request.get('https://buff.163.com/api/market/goods?game=csgo&page_size=20&page_num=1').proxy(this.config.proxy[i]).set('header', headers)
          .timeout({ deadline: 4000 });
        if (data.status !== 200 || data2.status !== 200) {
          error++;
          console.log(this.config.proxy[i] + ',这个代理IP失效,你再去找一个吧');
        } else {
          console.log(this.config.proxy[i] + ',校验通过');
        }
      } catch (err) {
        error++;
        console.log(this.config.proxy[i] + ',这个代理IP失效,你再去找一个吧');
      }
    }
    console.log('全部校验结束');
    return error;
  }
  async validSession() {
    let error = 0;
    for (let i = 0; i < this.config.sessionList.length; i++) {
      let index = i;
      if (i >= this.config.proxy.length - 1) {
        index = this.config.proxy.length - 1;
      }
      try {
        const headers = this.config.header;
        headers['User-Agent'] = fakeUa();
        headers.cookie = 'session=' + this.config.sessionList[i] + ';';
        const Data = await request.get('https://buff.163.com/api/market/goods?game=csgo&page_size=20&page_num=2').proxy(this.config.proxy[index]).set(headers)
          .timeout({ deadline: 4000 });
        if (Data.status === 200 && Data.text && JSON.parse(Data.text).code === 'OK') {
          console.log(this.config.sessionList[i] + ',这个session没问题');
        } else {
          error++;
          console.log('这个session过期:' + this.config.sessionList[i] + ',或者这个代理IP有问题:' + this.config.proxy[index]);
        }
      } catch (err) {
        error++;
        console.log('可能这个session过期:' + this.config.sessionList[i] + ',或者这个代理IP有问题:' + this.config.proxy[index] + ',当然也可能都没问题的,报错原因是：');
        console.log(err);
      }
    }
    console.log('全部校验结束');
    return error;
  }
  formatAvaPrice(val) {
    return (parseInt(val / 1000) + 1) * 100;
  }
  async storeAvaKnifePrice() {
    const now = moment().format('YYYY-MM-DD');
    const query = {
      name: '刀|剑|匕|手套|裹手',
      maxPrice: 4000,
      minPrice: 300,
      sellNum: 20,
    };
    let list = await this.ctx.model.Csgoex.aggregate([
      {
        $match: {
          buffMinPrice: { $lte: parseFloat(query.maxPrice), $gte: parseFloat(query.minPrice) },
          sellNum: { $gte: parseInt(query.sellNum) },
          goodsName: { $regex: query.name },
        },
      },
    ]);
    list = list.filter((item, index) => {
      return !list.slice(index + 1).some(e => {
        return e.goodsName === item.goodsName;
      });
    });
    const Error = [];
    const listLen = list.length;
    for (let i = 0; i < listLen; i++) {
      console.log('导入-' + list[i].goodsName);
      await (this.sleep(this.config.frequency));
      try {
        let avaPrice = 0,
          len = 0;
        const ava = this.formatAvaPrice(list[i].buffMinPrice);
        const Data = await this.ctx.curl(this.config.urlList.knifeAva + list[i].buffId, {
          dataType: 'json',
          headers: this.config.knifeHeader,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Data.data.data.price_history.forEach(item => {
            if (item[1] >= list[i].buffMinPrice - ava && item[1] <= list[i].buffMinPrice + ava) {
              avaPrice += parseFloat(item[1]);
              len++;
            }
          });
          avaPrice = parseFloat((avaPrice / len).toFixed(2));
          this.ctx.model.CsgoKnife.updateOne({
            buffId: list[i].buffId,
          },
          {
            date: now,
            goodsName: list[i].goodsName,
            buffId: list[i].buffId,
            avaPrice,
          },
          {
            upsert: true,
          }, () => {});
        } else {
          console.log(Data);
          return;
        }
      } catch (err) {
        console.log(err);
        Error.push(list[i]);
      }
      if (i === listLen - 1) {
        console.log('初次导入完成');
      }
    }
    for (let i = 0; i < Error.length; i++) {
      console.log('再次导入-' + Error[i].goodsName);
      await (this.sleep(this.config.frequency));
      try {
        let avaPrice = 0,
          len = 0;
        const ava = this.formatAvaPrice(Error[i].buffMinPrice);
        const Data = await this.ctx.curl(this.config.urlList.knifeAva + Error[i].buffId, {
          dataType: 'json',
          headers: this.config.knifeHeader,
        });
        if (Data.status === 200 && Data.data && Data.data.code === 'OK') {
          Data.data.data.price_history.forEach(item => {
            if (item[1] >= Error[i].buffMinPrice - ava && item[1] <= Error[i].buffMinPrice + ava) {
              avaPrice += parseFloat(item[1]);
              len++;
            }
          });
          avaPrice = parseFloat((avaPrice / len).toFixed(2));
          this.ctx.model.CsgoKnife.updateOne({
            buffId: Error[i].buffId,
          },
          {
            date: now,
            goodsName: Error[i].goodsName,
            buffId: Error[i].buffId,
            avaPrice,
          },
          {
            upsert: true,
          }, () => {});
        }
      } catch (err) {
        console.log(Error[i].goodsName + ' 导入失败');
        console.log(err);
      }
    }
  }
  async getAvaKnifePrice() {
    let list = await this.ctx.model.CsgoKnife.aggregate([
      {
        $lookup: {
          from: 'csgoexes',
          localField: 'goodsName',
          foreignField: 'goodsName',
          as: 'newGoods',
        },
      },
    ]);
    list = list.map(item => {
      const node = item.newGoods[0];
      return {
        time: item.date,
        buffId: item.buffId,
        avaPrice: item.avaPrice,
        goodsName: item.goodsName,
        steamMinPrice: node.steamMinPrice,
        steamMarketUrl: node.steamMarketUrl,
        c5MinPrice: node.c5MinPrice,
        buffMinPrice: node.buffMinPrice,
        buffBuyPrice: node.buffBuyPrice,
        sellNum: node.sellNum,
        igxeSellNum: node.igxeSellNum,
        igxeMinPrice: node.igxeMinPrice,
      };
    });
    list = list.filter(item =>
      parseFloat(item.buffMinPrice) < parseFloat(item.avaPrice)
    );
    list.sort((a, b) => {
      return (parseFloat(a.buffMinPrice) - parseFloat(a.avaPrice) * 0.975) - (parseFloat(b.buffMinPrice) - parseFloat(b.avaPrice) * 0.975);
    });
    return list.slice(0, 100);
  }
}

module.exports = GoodsService;
