'use strict';

const Controller = require('./base_controller');

class SteamGoodsController extends Controller {
  async steamPrice() {
    const { ctx } = this;
    const Data = await ctx.service.getSteamPrice.getSteamCsgo();
    this.success(Data);
  }
}

module.exports = SteamGoodsController;
