# ⚠️ 此包已废弃 | This package is deprecated

> **请迁移到新包：[@weixin-sdk/mp](https://www.npmjs.com/package/@weixin-sdk/mp)**

## 迁移指南

```bash
# 卸载旧包
npm uninstall wechat.api

# 安装新包
npm install @weixin-sdk/mp
```

## 新包特性

新的 `@weixin-sdk/mp` 包是**完全重写**的版本，具有以下改进：

- ✅ **链式 API** - `mp.user.get()`, `mp.menu.create()` 等
- ✅ **零外部依赖** - 移除 got/lodash，基于原生 fetch
- ✅ **完整 TypeScript 支持** - 全类型定义，IDE 自动补全
- ✅ **ESM + CJS** - 同时支持两种模块格式
- ✅ **Node.js 22+** - 使用最新 Node.js 特性

## 新 API 示例

```typescript
import { WechatMP } from '@weixin-sdk/mp';

const mp = new WechatMP({ appid, secret });

// 用户管理
const user = await mp.user.get('openid');

// 菜单管理
await mp.menu.create([...]);

// 模板消息
await mp.template.send({ touser, template_id, data });

// JS-SDK
const config = await mp.jssdk.getConfig(url);
```

## 相关新包

| 旧包 | 新包 |
|-----|-----|
| `wechat-component` | [`@weixin-sdk/open`](https://www.npmjs.com/package/@weixin-sdk/open) |
| `wechat-component-service` | [`@weixin-sdk/open-service`](https://www.npmjs.com/package/@weixin-sdk/open-service) |
| `wechat.api` | [`@weixin-sdk/mp`](https://www.npmjs.com/package/@weixin-sdk/mp) |

## 新 Monorepo

所有包已迁移到统一的 monorepo：

**https://github.com/loulin/wechat**

---

**This package is deprecated.** Please migrate to [@weixin-sdk/mp](https://www.npmjs.com/package/@weixin-sdk/mp).
