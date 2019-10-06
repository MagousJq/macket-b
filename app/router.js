'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.getBuffPrice.login);
  router.post('/csgo/store', controller.getBuffPrice.csgoStore);
  router.get('/csgo/canBuy', controller.getBuffPrice.csgoCanBuy);
  router.get('/csgo/canSell', controller.getBuffPrice.csgoCanSell);
  router.post('/dota/store', controller.getBuffPrice.dotaStore);
  router.get('/dota/canBuy', controller.getBuffPrice.dotaCanBuy);
  router.get('/dota/canSell', controller.getBuffPrice.dotaCanSell);
  router.get('/steam', controller.getSteamPrice.steamPrice);
  router.post('/igxe/csgo/store', controller.getIGXEPrice.csgoStore);
  router.get('/igxe/csgo/canBuy', controller.getIGXEPrice.csgoCanBuy);
};
