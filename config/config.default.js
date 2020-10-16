/* eslint valid-jsdoc: "off" */

'use strict';

const igxeKnife = 'https://www.igxe.cn/csgo/730?ctg_name=%E5%8C%95%E9%A6%96&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=5&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxeAutoGun = 'https://www.igxe.cn/csgo/730?ctg_name=%E6%AD%A5%E6%9E%AA&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=4&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxeHandGun = 'https://www.igxe.cn/csgo/730?ctg_name=%E6%89%8B%E6%9E%AA&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=1&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxeMicroGun = 'https://www.igxe.cn/csgo/730?ctg_name=%E5%BE%AE%E5%9E%8B%E5%86%B2%E9%94%8B%E6%9E%AA&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=3&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxeShotGun = 'https://www.igxe.cn/csgo/730?ctg_name=%E9%87%8D%E5%9E%8B%E6%AD%A6%E5%99%A8&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=2&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxePic = 'https://www.igxe.cn/csgo/730?ctg_name=%E5%8D%B0%E8%8A%B1&is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&sort=1&ctg_id=8&type_id=0&page_size=200&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&page_no=';
const igxeGloves = 'https://www.igxe.cn/csgo/730?%20&capsule_id=0&rarity_id=0&quality_id=0&page_size=200&exterior_id=0&sort=1&ctg_id=13&is_buying=0&ctg_name=%E6%89%8B%E5%A5%97&page_no=';
const igxeMusicBox = 'https://www.igxe.cn/csgo/730?%20&capsule_id=0&rarity_id=0&quality_id=0&page_size=200&exterior_id=0&sort=1&ctg_id=9&is_buying=0&ctg_name=%E9%9F%B3%E4%B9%90%E7%9B%92&page_no=';
const igxeGraffiti = 'https://www.igxe.cn/csgo/730?%20&capsule_id=0&rarity_id=0&quality_id=0&page_size=200&exterior_id=0&sort=1&ctg_id=11&is_buying=0&ctg_name=%E6%B6%82%E9%B8%A6&page_no=';
const igxeBox = 'https://www.igxe.cn/csgo/730?%20&capsule_id=0&rarity_id=0&quality_id=0&page_size=200&exterior_id=0&sort=1&ctg_id=6&is_buying=0&ctg_name=%E7%AE%B1%E5%AD%90&page_no='

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
  config.keys = appInfo.name + '_1553507734526_7059';

  // add your middleware config here
  config.middleware = [];

  // 请求频率
  config.frequency = 5000;
  config.igxeFrequency = 3000;
  config.igxeCheapFrequency = 3000;

  // igxe折扣价所用session
  const igxeCheapSession = 'cbnk1gth607kq6d6ywqhzx77hpf7cyvw'

  // 代理IP
  config.proxy = [
    // 'http://221.122.91.34:80',
    // 'http://218.60.8.99:3129',
    // 'http://221.182.31.54:8080',
    // 'http://58.220.95.79:10000',
    // 'http://118.24.172.37:1080',
    // 'http://221.122.91.59:80',
    // 'http://58.220.95.80:9401'
  ]
  // session列表，要有10个以上
  config.sessionList = [
  ]

  config.multipart = {
    mode: 'file'
  }
  
  config.header =
  {
    cookie: '',
    Connection: 'keep-alive',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
  };

  // config.knifeHeader =
  // {
  //   cookie: 'session='+session2+';',
  //   Connection: 'keep-alive',
  //   Accept: 'application/json, text/javascript, */*; q=0.01',
  //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
  // };

  config.igxeCheapHeader =
  {
    cookie: 'sessionid=' + igxeCheapSession + ';',
    Connection: 'keep-alive',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
  };

  config.igxeHeader =
  {
    Accept: '*/*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
  };

  config.steamHeader = {
    'Accept-Language': 'zh,zh-CN;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36',
  };

  config.urlList = {
    buffCsgo: 'https://buff.163.com/api/market/goods?game=csgo&sort_by=price.desc&page_size=80&page_num=',
    knifeAva: 'https://buff.163.com/api/market/goods/price_history/buff?game=csgo&currency=CNY&goods_id=',
    buffDota: 'https://buff.163.com/api/market/goods?game=dota2&page_size=80&sort_by=price.desc&min_price=0.1&max_price=300&page_num=',
    igxeCsgo: 'https://www.igxe.cn/csgo/730?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=0.3&price_to=2000&sort=1&ctg_id=0&type_id=0&page_size=400&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1569832685927&page_no=',
    igxeDotaBeta: 'https://www.igxe.cn/dota2/570?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=0.05&price_to=300&sort=1&ctg_id=0&type_id=0&page_size=400&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1570519278056&page_no=',
    igxeDotaPro: 'https://www.igxe.cn/dota2/570?is_buying=0&is_stattrak%5B%5D=0&is_stattrak%5B%5D=0&price_from=14.8&price_to=500&sort=1&ctg_id=0&type_id=0&page_size=400&rarity_id=0&exterior_id=0&quality_id=0&capsule_id=0&_t=1570519278056&page_no=',
    igxeCsKinds: [{
      url: igxeKnife,
      pages: 10,
      name: '匕首',
    }, {
      url: igxeAutoGun,
      pages: 11,
      name: '步枪',
    }, {
      url: igxeHandGun,
      pages: 10,
      name: '手枪',
    }, {
      url: igxeMicroGun,
      pages: 8,
      name: '微冲',
    }, {
      url: igxeShotGun,
      pages: 5,
      name: '霰弹枪',
    }, {
      url: igxePic,
      pages: 17,
      name: '贴纸',
    }, {
      url: igxeGloves,
      pages: 2,
      name: '手套',
    }, {
      url: igxeMusicBox,
      pages: 1,
      name: '音乐盒',
    },{
      url: igxeGraffiti,
      pages: 8,
      name: '涂鸦'
    },{
      url: igxeBox,
      pages: 1,
      name: '箱子'
    }]
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

  // config.httpclient = {
  //   request: {
  //     enableProxy: true,
  //     rejectUnauthorized: false,
  //     proxy: 'http://222.73.144.63:80',
  //   },
  // };

  return {
    ...config,
    ...userConfig,
  };
};
