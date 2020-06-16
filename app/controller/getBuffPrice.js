'use strict';

const Controller = require('./base_controller');
const moment = require('moment');

class GoodsController extends Controller {
  async login() {
    this.success();
  }
  async csgoStore() {
    const { ctx } = this;
    const total = await ctx.service.getBuffCsgoPrice.getTotalPage();
    if (total) {
      ctx.service.getBuffCsgoPrice.store(total);
      this.success({
      // 返回需要多少秒
        time: total / 1000 * this.config.frequency * 1.1,
      });
    } else {
      this.error('服务端出错，检查日志去');
    }
  }
  async csgoCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 400;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getBuffCsgoPrice.canBuy(query);
    this.success(res);
  }
  async csgoCanSell() {
    const { ctx } = this;
    const res = await ctx.service.getBuffCsgoPrice.canSell();
    this.success(res);
  }
  async storeAvaKnifePrice(){
    const { ctx } = this;
    let res = '';
    const now = moment().format('YYYY-MM-DD');
    let arr = await ctx.model.CsgoKnife.find();
    if(arr.length && arr[0].date === now){
      res = '今日数据已载入过，无须再次载入'
    }else{
      ctx.service.getBuffCsgoPrice.storeAvaKnifePrice();
      res = '后台录入中...';
    }
    this.success({
      data: res
    });
  }
  async buyAvaKnifePrice(){
    const { ctx } = this;
    const res = await ctx.service.getBuffCsgoPrice.getAvaKnifePrice();
    this.success({
      data: res
    });
  }
  async dotaStore() {
    const { ctx } = this;
    const total = await ctx.service.getBuffDotaPrice.getTotalPage();
    if (total) {
      ctx.service.getBuffDotaPrice.store(total);
      this.success({
      // 返回需要多少秒
        time: total / 1000 * this.config.frequency * 1.1,
      });
    } else {
      this.error('服务端出错，检查日志去');
    }
  }
  async dotaCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 400;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getBuffDotaPrice.canBuy(query);
    this.success(res);
  }
  async dotaCanSell() {
    const { ctx } = this;
    const res = await ctx.service.getBuffDotaPrice.canSell();
    this.success(res);
  }
}

module.exports = GoodsController;
