'use strict';

const Controller = require('./base_controller');

class SteamGoodsController extends Controller {
  async steamPrice() {
    const { ctx } = this;
    const query = this.ctx.request.body;
    const Data = await ctx.service.getSteamPrice.steamGetPrice(query);
    this.success(Data);
  }
}

module.exports = SteamGoodsController;
