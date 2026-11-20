# koishi-plugin-recall-report

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VincentZyu233/koishi-plugin-recall-report)
[![Gitee](https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white)](https://gitee.com/vincent-zyu/koishi-plugin-recall-report)

基于 Satori 协议的标准全平台消息撤回监听与自适应审计报告插件，内置 Takumi WASM 毫秒级极速出图引擎。

<p align="center">
  <img src="docs/images/preview.text-and-image.forward.png" alt="撤回监听与报告预览" width="420" />
</p>

---

## ✨ 核心特性

- **🦀 Takumi WASM 极速出图**：基于 Rust WASM 极速生成精美现代卡片大图，免安装 Chromium 无头浏览器，毫秒级冷启动。
- **📢 三重消息形式自由勾选**：
  - **图文模式 (`text-and-image`)**：双头像 + 结构化文字信息；
  - **合并转发 (`forward`)**：QQ 原生合并转发卡片（其它平台自适应图文引用）；
  - **Takumi 出图 (`takumi`)**：WASM 卡片渲染大图。
  - *(勾选几项就发送几条独立消息，最多 3 条)*
- **🌐 全平台原生兼容**：基于 Satori 标准 `message` 与 `message-deleted` 事件驱动，原生支持 OneBot (QQ)、Discord、KOOK (开黑啦)、Matrix、飞书 (Lark) 等接入平台。
- **🔕 安全静音默认策略**：原群/频道提醒默认关闭（`sendToGroup: false`），默认仅向主人私聊推送，低调防撤回。
- **🛡️ 复合命名空间存储**：基于 `${platform}:${channelId}:${messageId}` 严格隔离，多平台多 Bot 并行绝不撞车，内置 LRU 队列与 TTL 自动释放机制。

---

## 📦 安装与启用

在 Koishi 控制台插件市场搜索 `recall-report` 并安装启用。

---

## ⚙️ 配置说明

1. **👑 主人账号配置 (`masterAccounts`)**：设置接收审计报告的私聊主人账号（包含平台名称与用户 ID）。
2. **📋 监听目标配置 (`groupConfigs`)**：设置开启撤回监听的群号或频道 ID，平台字段留空即通配所有平台（原群提醒默认关闭）。
3. **⚙️ 交付形式与渲染引擎设置 (`reportModes`)**：通过多选框自由勾选需要交付的消息形式（`text-and-image` / `forward` / `takumi`），并可调节 Takumi 宽度与暗黑模式。

---

## 🔧 指令列表

| 指令 | 说明 |
| :--- | :--- |
| `recall-status` | 📊 查看全平台撤回监听状态与已缓存消息统计 |
| `recall-test` | 🧪 在当前群组或频道快速测试配置是否生效 |
| `recall-clear` | 🧹 手动清空当前内存中的所有消息缓存 |

