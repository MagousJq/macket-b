'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CsgoKnifeSchema = new Schema({
    buffId: { type: Number },
    goodsName: { type: String },
    date: { type: String },
    avaPrice: { type: Number },
  });

  return mongoose.model('CsgoKnife', CsgoKnifeSchema);
};
