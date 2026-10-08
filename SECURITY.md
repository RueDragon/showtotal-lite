# Security

请勿在公开 issue、PR、日志或截图中粘贴 API key、个人团队路径或账单数据。疑似泄漏时先撤销或轮换 key，再私下联系维护者或使用 GitHub private vulnerability reporting（如可用）。

本软件只向用户指定的 HTTPS 统计接口发送 API key，不包含后端中转服务。请只填写信任的接口地址。配置 `.env` 是明文，不加密；不得共享，也不要放在多人可读目录。Git ignore 不是加密或访问控制。Windows 便携版在 exe 同目录读取配置。

页面禁用 Node integration，启用 context isolation 与 sandbox，使用严格 CSP。主进程限定 IPC 方法、校验来源，禁用外部导航和弹窗。网络响应只按文本渲染，不执行服务端代码。

发布二进制尚无代码签名。请从官方 Release 下载并核验 SHA-256。不要把别人的已配置目录当作可信软件包。
