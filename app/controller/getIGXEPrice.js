'use strict';

const Controller = require('./base_controller');
const sharp = require('sharp');
const fakeUa = require('fake-useragent');
const request = require('superagent');
require('superagent-proxy')(request);

class GoodsController extends Controller {
  async login() {
    this.success();
  }
  async csgoStore() {
    const { ctx } = this;
    ctx.service.getIgxeCsgoPrice.getTotalData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成',
    });
  }
  async csgoCheapStore() {
    const { ctx } = this;
    ctx.service.getIgxeCsgoPrice.getCheapData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成',
    });
  }
  async csgoCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 1000;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeCsgoPrice.canBuy(query);
    this.success(res);
  }
  async csgoCanUse() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.15;
    query.maxPrice = query.maxPrice || 20000;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeCsgoPrice.canUse(query);
    this.success(res);
  }
  async dotaStore() {
    const { ctx } = this;
    ctx.service.getIgxeDotaPrice.getTotalData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成',
    });
  }
  async dotaCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 1000;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeDotaPrice.canBuy(query);
    this.success(res);
  }
  async dotaSpread() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 1000;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeDotaPrice.spread(query);
    this.success(res);
  }
  async dotaCanUse() {
    const { ctx } = this;
    const res = await ctx.service.getIgxeDotaPrice.canUse();
    this.success(res);
  }
  async test() {
    const { ctx } = this;
    let file = ctx.request.files[0];
    let name = file.filename
    let buff = await sharp(file.filepath)
    .metadata()
    .then(({ width }) => sharp(file.filepath)
      .resize(Math.round(width * 0.5))
      .toBuffer().then(data => {
      return data;
    }))
    this.status = 200;
    this.success({data: buff, name})
  }
  async proxy(){
    let error = 0
    for(let i =0;i<this.config.proxy.length;i++){
      let headers = this.config.igxeHeader
      headers['User-Agent'] = fakeUa()
      try {
        let data = await request.get('https://www.igxe.cn/csgo/730?ctg_name=%E6%89%8B%E6%9E%AA&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=1&type_id=0&page_size=20&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=1').proxy(this.config.proxy[i]).set('header',headers).timeout({ deadline: 4000 })
        let data2 = await request.get('https://buff.163.com/api/market/goods?game=csgo&page_size=20&page_num=1').proxy(this.config.proxy[i]).set('header',headers).timeout({ deadline: 4000 })
        if(data.status !== 200 || data2.status !== 200){
          error++
          console.log(this.config.proxy[i] + ',这个代理IP失效,你再去找一个吧')
        }else{
          console.log(this.config.proxy[i] + ',校验通过')
        }
      }catch(err) {
        error++
        console.log(this.config.proxy[i] + ',这个代理IP失效,你再去找一个吧')
      }
    }
    console.log('全部校验结束')
    this.success(!error ? '代理IP都没问题' : '部分代理IP失效，去后台自己看看吧')
  }
  async validSession() {
    let error = 0
    for(let i =0;i<this.config.sessionList.length;i++){
      let index = i
      if(i >= this.config.proxy.length - 1){
        index = this.config.proxy.length - 1
      }
      try {
        let headers = this.config.header
        headers['User-Agent'] = fakeUa()
        headers['cookie'] = 'session=' + this.config.sessionList[i] + ';'
        const Data = await request.get('https://buff.163.com/api/market/goods?game=csgo&page_size=20&page_num=2').proxy(this.config.proxy[index]).set(headers).timeout({ deadline: 5000 });
        if (Data.status === 200 && Data.text && JSON.parse(Data.text).code === 'OK' ){
          console.log( this.config.sessionList[i] + ',这个session没问题')
        }else{
          error++
          console.log('这个session过期:' + this.config.sessionList[i] + ',或者这个代理IP有问题:' + this.config.proxy[index])
        }
      } catch (err) {
        error++
        console.log('可能这个session过期:' + this.config.sessionList[i] + ',或者这个代理IP有问题:' + this.config.proxy[index] + ',当然也可能都没问题的,报错原因是：')
        console.log(err)
      }
    }
    console.log('全部校验结束')
    this.success(!error ? 'session都没问题' : '部分session失效，去后台自己看看吧')
  }
}

module.exports = GoodsController;
