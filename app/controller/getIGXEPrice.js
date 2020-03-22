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
    query.minPrice = query.minPrice || 0.2;
    query.maxPrice = query.maxPrice || 4000;
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
    query.maxPrice = query.maxPrice || 100;
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
}

module.exports = GoodsController;
