'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.getBuffPrice.login);
  router.post('/csgo/store', controller.getBuffPrice.csgoStore);
  // router.post('/csgo/storeAavKnife', controller.getBuffPrice.storeAvaKnifePrice);
  // router.get('/csgo/buyAavKnife', controller.getBuffPrice.buyAvaKnifePrice);
  router.get('/csgo/canBuy', controller.getBuffPrice.csgoCanBuy);
  router.get('/csgo/canSell', controller.getBuffPrice.csgoCanSell);
  router.post('/dota/store', controller.getBuffPrice.dotaStore);
  router.get('/dota/canBuy', controller.getBuffPrice.dotaCanBuy);
  router.get('/dota/canSell', controller.getBuffPrice.dotaCanSell);
  router.post('/steam/getPrice', controller.getSteamPrice.steamPrice);
  router.post('/igxe/csgo/store', controller.getIGXEPrice.csgoStore);
  router.post('/igxe/csgo/cheapstore', controller.getIGXEPrice.csgoCheapStore);
  router.post('/igxe/csgo/cheaphighstore', controller.getIGXEPrice.csgoCheapHighStore);
  router.get('/igxe/csgo/canBuy', controller.getIGXEPrice.csgoCanBuy);
  router.get('/igxe/csgo/canUse', controller.getIGXEPrice.csgoCanUse);
  router.post('/igxe/dota/store', controller.getIGXEPrice.dotaStore);
  router.get('/igxe/dota/canBuy', controller.getIGXEPrice.dotaCanBuy);
  router.get('/igxe/dota/canUse', controller.getIGXEPrice.dotaCanUse);
  // router.get('/igxe/dota/canBuy', controller.getIGXEPrice.dotaSpread);
  router.get('/igxe/dota/spread', controller.getIGXEPrice.dotaSpread);
  router.post('/c5/csgo/store', controller.getC5Price.csgoStore);
  router.get('/c5/csgo/canUse', controller.getC5Price.csgoCanUse);
  router.get('/c5/csgo/canBuy', controller.getC5Price.csgoCanBuy);

  router.get('/csgo/proxy', controller.getIGXEPrice.proxy);
  router.get('/csgo/valid', controller.getIGXEPrice.validSession);
};
