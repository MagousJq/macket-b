'use strict';

const Controller = require('./base_controller');

class GoodsController extends Controller {
  async login() {
    this.success();
  }
  async csgoStore() {
    const { ctx } = this;
    if (this.config.sessionList.length < 10) {
      this.error('你必须要搞10个以上session');
      return;
    }
    const total = await ctx.service.getBuffCsgoPrice.getTotalPage();
    if (total) {
      ctx.service.getBuffCsgoPrice.store(total);
      this.success('导入开始，自行查看后台导入情况');
    } else {
      this.error('估计是你的session过期，看后台去');
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
  // async storeAvaKnifePrice(){
  //   const { ctx } = this;
  //   let res = '';
  //   const now = moment().format('YYYY-MM-DD');
  //   let arr = await ctx.model.CsgoKnife.find();
  //   if(arr.length && arr[0].date === now){
  //     res = '今日数据已载入过，无须再次载入'
  //   }else{
  //     ctx.service.getBuffCsgoPrice.storeAvaKnifePrice();
  //     res = '后台录入中...';
  //   }
  //   this.success({
  //     data: res
  //   });
  // }
  // async buyAvaKnifePrice(){
  //   const { ctx } = this;
  //   const res = await ctx.service.getBuffCsgoPrice.getAvaKnifePrice();
  //   this.success({
  //     data: res
  //   });
  // }
  async dotaStore() {
    const { ctx } = this;
    if (this.config.sessionList.length < 10) {
      this.error('你必须要搞10个以上session');
      return;
    }
    const total = await ctx.service.getBuffDotaPrice.getTotalPage();
    if (total) {
      ctx.service.getBuffDotaPrice.store(total);
      this.success('导入开始，自行查看后台导入情况');
    } else {
      this.error('估计是你的session过期，看后台去');
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
