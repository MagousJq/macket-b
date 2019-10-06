'use strict';

const { Controller } = require('egg');
class BaseController extends Controller {
  get user() {
    return this.ctx.session.user;
  }

  success(data = '') {
    this.status = 200;
    this.ctx.body = {
      code: 0,
      data,
      msg: 'OK',
    };
  }

  error(msg = '') {
    msg = msg || '服务端错误';
    this.status = 200;
    this.ctx.body = {
      code: -1,
      data: '',
      msg,
    };
  }

  unLogin(msg = '') {
    msg = msg || '用户未登录，无权限访问';
    this.status = 200;
    this.ctx.body = {
      code: -2,
      data: '',
      msg,
    };
  }
}
module.exports = BaseController;
