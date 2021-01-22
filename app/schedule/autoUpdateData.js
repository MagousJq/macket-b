'use strict';
const Subscription = require('egg').Subscription;

class UpdateData extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '999999h',
      type: 'worker', // 只要一个worker执行
      immediate: true,
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const data1 = await this.ctx.service.getBuffCsgoPrice.proxy();
    if (!data1) {
      const data2 = await this.ctx.service.getBuffCsgoPrice.validSession();
      if (!data2) {
        // await this.ctx.service.getBuffCsgoPrice.store(csgoTotal);
        // await this.ctx.service.getIgxeCsgoPrice.getTotalData();

        // await this.ctx.service.getBuffDotaPrice.store(dotaTotal);
        // await this.ctx.service.getIgxeDotaPrice.getTotalData();
      } else {
        console.log('部分session有错');
      }
    } else {
      console.log('部分代理IP有错');
    }
  }
}

module.exports = UpdateData;
