'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const DotaSchema = new Schema({
    buffId: { type: Number },
    igxeId: { type: Number },
    goodsName: { type: String },
    steamMarketUrl: { type: String },
    steamMinPrice: { type: Number },
    igxeCheapPrice: { type: Number },
    buffMinPrice: { type: Number },
    buffBuyPrice: { type: Number },
    igxeMinPrice: { type: Number },
    sellNum: { type: Number },
    igxeSellNum: { type: Number },
    date: { type: Date },
  });

  return mongoose.model('Dota', DotaSchema);
};
