# 更新日志 (Changelog)

## [0.3.0-beta.1+20261120] - 2026-11-20

### 🦀 新增特性
- **新增 Takumi WASM 极速出图引擎**：基于 Rust WASM 与 Flexbox 组件树渲染卡片大图，毫秒级生成撤回报告，支持暗黑模式 (`takumiDarkMode`)、卡片宽度 (`takumiWidth`) 与自定义中文字体探测。
- **报告交付形式解耦为多选框 (`reportModes`)**：
  - 彻底废除旧版单一 `preferForward` 布尔配置；
  - 引入多选模式：`text_avatar`（图文）、`forward`（合并转发卡片）、`takumi`（WASM 出图），勾选几项就发送几条独立消息（最多 3 条）。
- **默认策略优化**：`groupConfigs[].sendToGroup`（是否在原群/频道提醒）默认值调整为 `false`，默认仅发送主人私聊，避免打扰群内。
- **文案规范微调**：主人账号平台名称统一增加全角括号说明 `平台名称（如 onebot、discord、kook）`。

---

## [0.2.0-beta.1+20261120] - 2026-11-20

### 🚀 核心架构重构
- **全面重命名**：插件包名由 `koishi-plugin-onebot-recall-report` 重构升级为 `koishi-plugin-recall-report`，运行时命名为 `recall-report`。
- **解锁全平台**：彻底移除 `session.subtype !== 'group'` 硬编码判定，改用 Satori 标准公域通道判定。
- **自适应渲染分流**：根据接收端平台类型智能分发 QQ 转发卡片或富文本引用。
- **头像标准化**：消费 Satori Universal 标准规范头像，保留 OneBot 历史平滑回退。
- **复合存储键**：采用 `${platform}:${channelId}:${messageId}` 复合隔离。
- **双仓联动**：建立 GitHub (`VincentZyu233/koishi-plugin-recall-report`) 与 Gitee (`vincent-zyu/koishi-plugin-recall-report`) 双远端同步。

---

## [0.0.1-beta.2+20260126] - 2026-01-26
- 初始版本：OneBot QQ 群聊撤回消息转发与主人私聊上报。
