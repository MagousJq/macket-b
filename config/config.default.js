/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1553507734596_7059';

  // add your middleware config here
  config.middleware = [];

  // 请求频率
  config.frequency = 300;

  config.header = 
  {
    cookie: 'csrf_token=821f5bd4bf0d3b615b1b6b749c5abe8f6f599a59; session=1-VX49LPsLWxGglWLnjt5wUEt2TVRJsdgZknvyVcPC25ka2043302330; _ga=GA1.2.1845526731.1553570207; _gid=GA1.2.54596602.1553570207; _gat_gtag_UA_109989484_1=1',
    Connection: 'keep-alive',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
  }

  config.urlList = {
    buffCsgo: 'https://buff.163.com/api/market/goods?game=csgo&sort_by=price.desc&page_num=',
    buffDota: 'https://buff.163.com/api/market/goods?game=dota2&sort_by=price.desc&page_num=',
    igxeCsgo: 'https://www.igxe.cn/csgo/730?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=0.3&price_to=300&sort=1&ctg_id=0&type_id=0&page_size=50&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1569832685927&page_no=',
    igxeDota: 'https://www.igxe.cn/dota2/570?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=0.2&price_to=60&sort=1&ctg_id=0&type_id=0&page_size=50&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1570504967919&page_no=',
    igxeDotaBeta: 'https://www.igxe.cn/dota2/570?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=0.2&price_to=300&sort=1&ctg_id=0&type_id=0&page_size=50&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1570519278056&page_no='
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.mongoose = {
    url: 'mongodb://127.0.0.1:27017/buff',
    options: {},
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.session = {
    key: 'session',
    maxAge: 7 * 24 * 3600 * 1000, // 7 天
    httpOnly: true,
    renew: true,
    encrypt: true,
  };

  config.onerror = {
    json(err, ctx) {
      // json hander
      ctx.body = {
        code: -1,
        data: '',
        msg: '服务端出错，请稍后重试',
      };
      ctx.status = 500;
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
