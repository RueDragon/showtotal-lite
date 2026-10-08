# Contributing

欢迎 fork 并适配其他收费 API 平台。目前仅支持 README 中列出的统计接口；OpenAI-compatible 推理接口不代表余额、日志或团队榜单接口兼容。

## 适配入口

1. 修改 `adapter.js`：集中处理平台端点、参数和返回值映射，不要把平台凭据写进代码。
2. `usage` 返回 README 的用量字段；`logs` 返回日志数组或 `{data: [...]}`；`models` 返回 `[{id, price}]`；`rank` 返回 `{date, items, total}`。
3. 没有团队榜单的站点应返回明确的“不支持榜单”提示，不要伪造数据。
4. `core.js` 提供 HTTPS 请求、最小折扣计算和北京时间日期。若新平台不使用 Bearer 认证，可在主进程适配请求层；不要把 key 暴露给 renderer。
5. 添加无真实账户数据的测试，再运行 `npm test` 和 `npm run dist`。

## 本地开发

使用 Node.js 22 或更新的 LTS，运行 `npm ci`。复制 `.env.example` 为 `.env`，使用自己的账号。不要提交个人路径、团队名、密钥、账单响应、日志、截图或填好的配置。贡献前执行 `git diff --check`，检查暂存区和 Release 附件。

不要把 UI 的纯展示字段视为精确账单；阶梯、时段优惠和供应商折扣应由平台账单确认。新增适配时在 README 写明所支持的平台、能力和限制。

## Pull Requests

说明改了什么、支持哪个接口契约、如何验证。可提交不包含个人信息的模拟响应。提交代码即表示你同意按 MIT 许可证发布这些贡献。
