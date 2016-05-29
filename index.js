const debug = require('debug')('wechat:api');
const TransformError = require('request-promise/errors').TransformError;
const rp = require('request-promise').defaults({
  json: true,
  transform(body) {
    if (body && body.errcode) {
      const error = new Error(body.errmsg);
      error.code = body.errcode;
      error.raw = body;
      throw error;
    }

    return body;
  },
});

class Wechat {
  constructor({
    appid,
    secret,
    defaultOptions,
    getToken = () => Promise.resolve(this.token),
    setToken = (token) => {
      this.token = token;
      return Promise.resolve(token);
    },
  }) {
    this.appid = appid;
    this.secret = secret;
    this.defaultOptions = defaultOptions;
    this.getToken = getToken;
    this.setToken = setToken;
    this.origin = 'https://api.weixin.qq.com';
    this.token = {};
  }

  api(entry, data, rpOptions, retry) {
    const options = Object.assign({}, this.defaultOptions, {
      method: 'GET',
      uri: this.origin + entry,
    }, rpOptions);

    return this.getToken().then(token => {
      if (retry || !token || !token.access || token.expire > Date.now()) {
        return this.getAccessToken();
      }

      return token;
    }).then(token => {
      options.uri = `${options.uri}?access_token=${token.access}`;

      if (data && typeof data === 'object') {
        options.method = 'POST';
        options.body = data;
      } else if (data) {
        options.uri += `&${data}`;
      }

      debug(`${options.method} ${options.uri}`);
      return this.request(options).catch(error => {
        if (!retry && error instanceof TransformError && error.cause.code === 40001) {
          debug(`${error.message}, retry...`);
          return this.api(entry, data, rpOptions, true);
        }

        return Promise.reject(error);
      });
    });
  }

  request(options) {
    return rp(options);
  }

  getAccessToken() {
    const uri = `${this.origin}/cgi-bin/token?grant_type=client_credential` +
      `&appid=${this.appid}&secret=${this.secret}`;

    debug(`GET ${uri}`);
    return this.request({
      method: 'GET',
      uri,
    }).then(result => {
      this.token.access = result.access_token;
      this.token.expire = Date.now() + (result.expires_in - 10) * 1000;
      this.setToken(this.token);
      return this.token;
    });
  }
}

module.exports = Wechat;
