Wechat API

## Usage

1. Find the api entry from wechat wiki, for example: https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140840&token=&lang=zh_CN .
2. Extract the api path, for example '/cgi-bin/user/get'.
3. Call api method with api path and request parameters. For api(path, data), if request method is get, data should be querystring or not set, otherwise it should be post object.

```js
const Wechat = require('./');
const wechat = new Wechat({
  appid: 'xxx',
  secret: 'xxx',
});

wechat.api('/cgi-bin/user/info', 'openid=xxx&lang=en').then(result => {
  console.log(result);
}).catch(error => {
  console.error('error', error);
});

```
