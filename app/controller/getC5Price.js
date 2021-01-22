'use strict';

const Controller = require('./base_controller');

class GoodsController extends Controller {
  async csgoStore() {
    const { ctx } = this;
    ctx.service.getC5CsgoPrice.getTotalData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成',
    });
  }
  async csgoCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.15;
    query.maxPrice = query.maxPrice || 1000;
    query.name = query.name || '';
    const res = await ctx.service.getC5CsgoPrice.canBuy(query);
    this.success(res);
  }
  async csgoCanUse() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.15;
    query.maxPrice = query.maxPrice || 20000;
    query.name = query.name || '';
    const res = await ctx.service.getC5CsgoPrice.canUse(query);
    this.success(res);
  }
}

module.exports = GoodsController;
