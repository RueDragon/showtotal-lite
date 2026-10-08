# showTotal Lite

Windows API 用量浮窗，只保留 **用量、日志、榜单**。不包含基金、第三方中转登录、个人账户或预置密钥。

[下载 Windows 便携版](https://github.com/RueDragon/showtotal-lite/releases/latest) · [二次开发](CONTRIBUTING.md) · [安全说明](SECURITY.md)

其他收费 API 网站可通过 fork `adapter.js` 自行适配。当前版本不承诺跨平台统计接口兼容，详细契约见下表。

## 使用

1. 从 GitHub Releases 下载 `showTotal-Lite-1.0.0-Windows-x64.exe`，无需安装 Node.js。
2. 把 `.env.example` 放在 exe 同目录，复制并重命名为 `.env`。
3. 填写自己的接口地址、API key 和团队路径，双击 exe 启动。也可以首次启动后通过设置页面填写。
4. 使用 Windows 10/11 x64，并确保能连接所填接口。榜单需要相应的团队权限。

```dotenv
SHOWTOTAL_BASE_URL="https://your-api.example.com/api"
SHOWTOTAL_API_KEY="your-own-key"
SHOWTOTAL_ORG_PATH="your-team-path"
```

接口地址填 API 前缀（例如以 `/api` 结尾），不是 OpenAI 的 `/v1` 推理地址。此软件需要下述用量平台接口，并非通用 OpenAI 客户端。程序不提供或转发任何 API 服务。

**不要把你的 `.env` 发给别人。** 分享时只发送 exe 和空白模板。`.env` 是明文文件，保存在你控制的目录；Git 忽略它，打包文件白名单也排除它。程序不把 API key 返回给页面，不记录请求正文或用户数据。设置页留空 key 会保留已有值；“清除本机配置”删除 `.env`。便携版在 exe 同目录读写配置，放到有写权限的目录。

## 功能

- 用量：今日花费、请求数、分档剩余额度、Token 和缓存命中率。自动刷新当前页，默认 5 分钟，可选 5/10/15 分钟；请求最长 20 秒，刷新中禁用按钮。总剩余额度低于 20% 时每天最多提醒一次，悬停额度可看近期消耗速度。
- <img width="297" height="310" alt="image" src="https://github.com/user-attachments/assets/e5e0a9dc-58cd-4c02-ae95-b6f8a9912153" />

- 日志：最近 100 条，模型、时间、实际花费、输入输出 Token；三项单价乘以 `standard_discount.min_vendor_discount_rate`。费率不含阶梯或时段优惠，实际花费直接取服务端账单。
- <img width="286" height="307" alt="image" src="https://github.com/user-attachments/assets/73d59177-6832-4811-9651-e96ecc2c7fd5" />

- 榜单：北京时间昨日团队用量，每页 10 人，费用或请求排序、加载更多。
- <img width="300" height="313" alt="image" src="https://github.com/user-attachments/assets/73dcc35f-5bbf-44e2-ad9b-144d09ee7168" />

- 日志增加紧凑的最近/高费用/慢首词排序，悬停条数查看已加载日志合计，非全天统计。首词耗时缺失的日志不参与慢首词排序。
- 置顶开关、窗口位置记忆、刷新、设置、应用专用图标。关闭隐藏到托盘，双击托盘恢复；右键托盘可退出或选择开机启动（默认不开启）。
- 刷新偏好、置顶状态和窗口位置存储在本机 Electron userData；账户配置仍按上述规则保存在 .env。公共计算模块为 usage-core.js，不包含投资或个人账号池扩展。

## 接口约定

所有请求使用 `Authorization: Bearer <key>`，只允许 HTTPS。接口在主进程调用，页面不直接访问网络。

| 相对路径 | 返回字段 |
| --- | --- |
| `user/usage/today` | `quota_cost`, `request_count`, `categories`, `total_tokens`, `total_cache_tokens`, `total_input_tokens`, `total_output_tokens`，可包在 `data` 内 |
| `user/logs/recent?limit=100` | 日志数组或 `data`/`items`/`logs` 数组；条目含 `model`, `created_at`, `quota_cost`, Token 字段 |
| `user/models` | `data` 数组；条目含 `id`, `pricing`, `standard_discount` |
| `team/usage/members` | `data.items`, `data.total`；参数 `org_path`, `start_date`, `end_date`, `scope`, `page`, `page_size`, `sort_by` |

## 开发与构建

```shell
npm ci
npm test
npm start
npm run dist
```

开发模式从项目根目录读取 `.env`。只修改程序文件，不提交 `.env`。构建输出在 `dist/`。打包后的 exe 不包含本机配置。Windows 便携版未购买代码签名证书，SmartScreen 可能提示未知发布者；发布包提供 SHA-256 文件，可核验下载完整性。

## License

MIT
