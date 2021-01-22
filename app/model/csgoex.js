'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CsgoexSchema = new Schema({
    buffId: { type: Number },
    igxeId: { type: Number },
    goodsName: { type: String },
    c5link: { type: String },
    steamMarketUrl: { type: String },
    steamMinPrice: { type: Number },
    igxeMinPrice: { type: Number },
    c5MinPrice: { type: Number },
    igxeCheapPrice: { type: Number },
    buffBuyPrice: { type: Number },
    buffMinPrice: { type: Number },
    sellNum: { type: Number },
    igxeSellNum: { type: Number },
    date: { type: Date },
  });

  return mongoose.model('Csgoex', CsgoexSchema);
};
