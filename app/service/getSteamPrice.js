'use strict';

const Service = require('egg').Service;
const Header = {
  Connection: 'keep-alive',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
};
class GoodsService extends Service {
  async getSteamCsgo() {
    const url = 'https://steamcommunity.com/market/listings/570/Inscribed Floodmask';
    try {
      const Data = await this.ctx.curl(url, {
        dataType: 'json',
        headers: Header,
      });
      return Data;
    } catch (err) {
      return err;
    }
  }
}

module.exports = GoodsService;
