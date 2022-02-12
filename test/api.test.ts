import * as chai from 'chai';
import { API } from '../src';

const { expect } = chai;

describe('token test', () => {
  let api: API;

  before(() => {
    api = new API({
      appid: process.env.APPID,
      secret: process.env.SECRET,
      // getToken: async () => new AccessToken('abc', new Date(Date.now() + 1000 * 10)),
    });
  });

  it('get the access token', async () => {
    const token = await api.refreshToken();

    // console.log(token.get());

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(token.isValid()).to.be.true;
  });

  it('get the user info', async () => {
    const openid = process.env.OPEN_ID;
    const accessToken = process.env.ACCESS_TOKEN;
    // 在刷新过程中，中控服务器可对外继续输出的老access_token，
    // 此时公众平台后台会保证在5分钟内，新老access_token都可用

    const user = await api.call<{ openid: string }>(
      '/cgi-bin/user/info',
      { openid, access_token: accessToken },
      { throwOnError: true },
    );

    // console.log(user);
    expect(user.openid).to.be.equal(openid);
  });
});
