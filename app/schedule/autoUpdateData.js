const Subscription = require('egg').Subscription;

class UpdateData extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '180m', // 1 小时间隔
      type: 'worker', // 只要一个worker执行
      immediate: true
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const csgoTotal = await this.ctx.service.getBuffCsgoPrice.getTotalPage();
    const dotaTotal = await this.ctx.service.getBuffDotaPrice.getTotalPage();
    if (csgoTotal) {
      await this.ctx.service.getBuffCsgoPrice.store(csgoTotal);
      await this.ctx.service.getIgxeCsgoPrice.getTotalData();

      await this.ctx.service.getBuffDotaPrice.store(dotaTotal);
      await this.ctx.service.getIgxeDotaPrice.getTotalData();
    } else {
      console.log('你的session过期了');
    }
  }
}

module.exports = UpdateData;