'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CsgoSchema = new Schema({
    buffId: { type: Number },
    goodsName: { type: String },
    steamMinPrice: { type: Number },
    buffMinPrice: { type: Number },
    sellNum: { type: Number },
    dateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  });

  return mongoose.model('Csgo', CsgoSchema);
};
