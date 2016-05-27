Wechat API

## Usage

1. Find api entry from wechat wiki, for example: https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140840&token=&lang=zh_CN .
2. Extra the api path, for example '/cgi-bin/user/get'.
3. Invoke apiCall with api path and request parameters. For apiCall(path, data), if request method is get, data is querystring or not set, otherwise it is post object.

```js
let Wechat = require('wechat.api');

let wechat = new Wechat(appid, secret);

wechat.apiCall('/cgi-bin/user/get', 'next_openid=').then(result => {
  console.log(result);
}).catch(error => {
  console.error('error', error);
});
```
