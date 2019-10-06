'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const TimeSchema = new Schema({
    // 导入时刻
    date: { type: Date },
    // 导入了多少数据
    num: { type: Number },
    type: { type: String },
  });

  return mongoose.model('Time', TimeSchema);
};
