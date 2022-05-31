import _ from 'lodash';
import got from 'got';
import debug from 'debug';
import type {
  Method, OptionsOfJSONResponseBody, OptionsOfBufferResponseBody,
} from 'got';
import { AccessToken } from './AccessToken';
import type { RawError } from './WechatError';
import { WechatError } from './WechatError';

type ResponseType = 'json' | 'buffer' | undefined;
type APIOptions = {
  method?: Method,
  searchParams?: string[],
  responseType?: ResponseType,
  throwOnError?: boolean,
  readonly retry?: boolean,
};

const log = debug('wechat.api');

// 实现接口: api.call('/material/batchget_material', { type: 'image' })
// TODO: 上传文件
const entries: Record<string, APIOptions> = {
  '/cgi-bin/get_current_selfmenu_info': { method: 'GET' },
  '/cgi-bin/menu/delete': { method: 'GET' },
  '/cgi-bin/menu/get': { method: 'GET' },

  '/cgi-bin/customservice/getkflist': { method: 'GET' },
  '/cgi-bin/customservice/getonlinekflist': { method: 'GET' },
  '/customservice/kfaccount/uploadheadimg': { method: 'POST', searchParams: ['kf_account'] },
  '/customservice/kfaccount/del': { method: 'GET' },
  '/customservice/kfsession/getsession': { method: 'GET' },
  '/customservice/kfsession/getsessionlist': { method: 'GET' },
  '/customservice/kfsession/getwaitcase': { method: 'GET' },

  '/cgi-bin/template/get_industry': { method: 'GET' },
  '/cgi-bin/template/get_all_private_template': { method: 'GET' },

  '/cgi-bin/get_current_autoreply_info': { method: 'GET' },

  '/cgi-bin/ticket/getticket': { method: 'GET' },

  '/cgi-bin/media/get/jssdk': { method: 'GET' },
  '/cgi-bin/media/get': { method: 'GET' },
  '/cgi-bin/material/get_materialcount': { method: 'GET' },

  '/cgi-bin/tags/get': { method: 'GET' },
  '/cgi-bin/user/tag/get': { method: 'GET' },
  '/cgi-bin/user/info': { method: 'GET' },
  '/cgi-bin/user/get': { method: 'GET' },

  '/datacube/getusersummary': { method: 'GET' },
  '/datacube/getusercumulate': { method: 'GET' },
  '/datacube/getarticlesummary': { method: 'GET' },
  '/datacube/getarticletotal': { method: 'GET' },
  '/datacube/getuserread': { method: 'GET' },
  '/datacube/getuserreadhour': { method: 'GET' },
  '/datacube/getusershare': { method: 'GET' },
  '/datacube/getusersharehour': { method: 'GET' },

  '/datacube/getupstreammsg': { method: 'GET' },
  '/datacube/getupstreammsghour': { method: 'GET' },
  '/datacube/getupstreammsgmonth': { method: 'GET' },
  '/datacube/getupstreammsgdist': { method: 'GET' },
  '/datacube/getupstreammsgdistweek': { method: 'GET' },
  '/datacube/getupstreammsgdistmonth': { method: 'GET' },

  '/publisher/stat': { method: 'GET' },

  '/datacube/getinterfacesummary': { method: 'GET' },
  '/datacube/getinterfacesummaryhour': { method: 'GET' },

  '/card/getapplyprotocol': { method: 'GET' },

  '/cgi-bin/poi/getwxcategory': { method: 'GET' },
  '/cgi-bin/poi/getpoilist': { method: 'GET' },

  '/wxa/get_merchant_category': { method: 'GET' },
  '/wxa/get_merchant_audit_info': { method: 'GET' },
  '/wxa/get_district': { method: 'GET' },
  '/card/storewxa/get': { method: 'GET' },

  '/cgi-bin/material/batchget_material': { method: 'POST', searchParams: ['type'], responseType: 'buffer' },

  '/cgi-bin/media/voice/addvoicetorecofortext': { method: 'POST', searchParams: ['format', 'voice_id'] },
  '/cgi-bin/media/voice/queryrecoresultfortext': { method: 'POST', searchParams: ['voice_id'] },
};

type Options = {
  appid?: string,
  secret?: string,
  getToken?: () => Promise<AccessToken | undefined>,
  refreshToken?: () => Promise<AccessToken | undefined>,
};

export * from './AccessToken';
export class API {
  private readonly appid?: string;

  private readonly secret?: string;

  private accessToken: AccessToken | undefined;

  getToken: () => Promise<AccessToken | undefined>;

  refreshToken: () => Promise<AccessToken | undefined>;

  constructor(options?: Options) {
    this.appid = options?.appid;
    this.secret = options?.secret;
    this.getToken = options?.getToken || this.defaultGetToken;
    this.refreshToken = options?.refreshToken || this.defaultRefreshToken;
  }

  static async getAccessToken(appid: string, secret: string) {
    const url = 'https://api.weixin.qq.com/cgi-bin/token';
    const searchParams = { grant_type: 'client_credential', appid, secret };
    const result = await got<RawError & { access_token: string, expires_in: number }>(url, { searchParams, responseType: 'json' });

    log('getAccessToken: %O', result.body);

    if (result.body.errcode) throw new WechatError(result.body);

    return new AccessToken(
      result.body.access_token,
      new Date(Date.now() + (result.body.expires_in - 10) * 1000),
    );
  }

  private async defaultGetToken() {
    return this.accessToken;
  }

  private async defaultRefreshToken() {
    if (!this.appid) throw new Error('appid is missing');
    if (!this.secret) throw new Error('secret is missing');

    const accessToken = await API.getAccessToken(this.appid, this.secret);

    this.accessToken = accessToken;

    return accessToken;
  }

  async call<T>(
    apiPath: string,
    payload: Record<string, any> & { access_token?: string },
    options?: APIOptions,
  ): Promise<RawError & T> {
    const data = { ...payload };
    let accessToken = data?.access_token;

    if (accessToken) {
      delete data.access_token;
    } else {
      let token = await this.getToken();

      if (!token || !token.isValid()) {
        log('token is invalid, refreshing: %O', token);
        token = await this.refreshToken();
      }

      if (!token) throw new WechatError({ errcode: -2, errmsg: '获取token失败' });

      accessToken = token.get();
    }

    const entry = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const apiOpts = _.assign(entries[entry], options);
    const method: Method = apiOpts.method || 'POST';
    const responseType: ResponseType = apiOpts.responseType || 'json';
    let searchParams;
    let json;

    if (method === 'GET') searchParams = data;
    else if (method === 'POST') json = data;

    if (apiOpts.searchParams) {
      searchParams = _.pick(data, apiOpts.searchParams);
      json = _.omit(data, apiOpts.searchParams);
    }

    const gotOpts: OptionsOfJSONResponseBody | OptionsOfBufferResponseBody = {
      method, searchParams: { access_token: accessToken, ...searchParams }, responseType,
    };

    if (data && (data.buffer || data.stream)) {
      gotOpts.body = data.buffer || data.stream;
    } else if (method === 'POST') {
      gotOpts.json = json;
    }

    const url = `https://api.weixin.qq.com${entry}`;
    const result = await got(url, gotOpts);
    const body = result.body as RawError & T;

    // 直接指定access_token时不重试
    if (!options?.retry && !payload.access_token && [40001, 40014, 42001].includes(body.errcode)) {
      log('retry due to accessToken invalid: %O', body);
      const token = await this.refreshToken();

      if (!token) throw new WechatError({ errcode: -2, errmsg: '获取token失败' });

      return this.call(
        apiPath,
        { ...payload, access_token: token.get() },
        { ...options, retry: true },
      );
    }

    if (options?.throwOnError && body.errcode) {
      throw new WechatError(body);
    }

    return body;
  }
}
