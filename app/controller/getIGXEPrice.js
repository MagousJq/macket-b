'use strict';

const Controller = require('./base_controller');

class GoodsController extends Controller {
  async login() {
    this.success();
  }
  async csgoStore() {
    const { ctx } = this;
    ctx.service.getIgxeCsgoPrice.getTotalData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成'
    });
  }
  async csgoCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 600;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeCsgoPrice.canBuy(query);
    this.success(res);
  }
  async dotaStore() {
    const { ctx } = this;
    ctx.service.getIgxeDotaPrice.getTotalData();
    this.success({
      data: '请查看后台日志，看页数是否全部完成'
    });
  }
  async dotaCanBuy() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 60;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeDotaPrice.canBuy(query);
    this.success(res);
  }
  async dotaSpread() {
    const { ctx } = this;
    const query = this.ctx.query;
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 60;
    query.name = query.name || '';
    query.sellNum = query.sellNum || 1;
    const res = await ctx.service.getIgxeDotaPrice.spread(query);
    this.success(res);
  }
}

module.exports = GoodsController;