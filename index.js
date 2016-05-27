let debug = require('debug');
let rp = require('request-promise');

class Wechat {
	constructor(appid, secret) {
		this.appid = appid;
		this.secret = secret;
		this.origin = 'https://api.weixin.qq.com';
		this.defaultOptions = {};
		this.token = {};
		this.getToken = function() {
			return Promise.resolve(this.token);
		};
		this.setToken = function(token) {
			this.token = token;
			return Promise.resolve(token);
		};
	}

	apiCall(entry, data) {
		let options = Object.assign({}, this.defaultOptions, {
			method: 'GET',
			uri: this.origin + entry,
			json: true,
			simple: true,
			resolveWithFullResponse: false,
			transform: function(body) {
				var error;

				if (body && body.errcode) {
					error = new Error(body.errmsg);
					error.code = body.errcode;
					error.raw = body;
					throw error;
				}

				return body;
			}
		});

		return this.getToken().then(token => {
			if (!token || !token.access || new Date(token.expire) > new Date()) {
				return this.getAccessToken();
			}

			return token;
		}).then(token => {
			options.uri = options.uri + '?access_token=' + token.access;

			if (typeof data === 'object') {
				options.method = 'POST';
				options.body = data;
			} else if (data) {
				options.uri += '&' + data;
			}

			return rp(options);
		}).catch(error => Promise.reject(error.cause));

	}

	getAccessToken() {
		let url = this.origin + '/cgi-bin/token?grant_type=client_credential&appid=' + this.appid + '&secret=' + this.secret;

		return rp.get(url, {
			json: true
		}).then(result => {
			this.token.access = result.access_token;
			this.token.expire = (result.expires_in - 10) * 1000;
			this.setToken(this.token);
			return this.token;
		});
	};
}

module.exports = Wechat;
