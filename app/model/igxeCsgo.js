'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const IgxeCsgoSchema = new Schema({
    igxeId: { type: Number },
    goodsName: { type: String },
    steamMinPrice: { type: Number },
    igxeMinPrice: { type: Number },
    sellNum: { type: Number }
  });

  return mongoose.model('IgxeCsgo', IgxeCsgoSchema);
};
