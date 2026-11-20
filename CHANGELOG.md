# 更新日志 (Changelog)

## [0.2.0-beta.1+20261120] - 2026-11-20

### 🚀 核心架构重构
- **全面重命名**：插件包名由 `koishi-plugin-onebot-recall-report` 重构升级为 `koishi-plugin-recall-report`，运行时命名为 `recall-report`。
- **解锁全平台**：解除对 OneBot 的单一生态依赖，彻底移除 `session.subtype !== 'group'` 硬编码判定，改用 Satori 标准公域通道判定（`!session.isDirect || Boolean(session.guildId) || session.subtype === 'group'`）。
- **自适应渲染引擎**：新增 `RecallRenderer` 模块，针对 OneBot/QQ 优先下发合并转发卡片，针对 Discord、KOOK、Matrix 等公域平台自适应降级为富文本图文引用，杜绝发送失败。
- **头像标准化解析**：废除死锁在 `qlogo.cn` 的硬编码头像，优先消费 Satori Universal 标准规范的 `session.event.user.avatar`，并保留 OneBot 平台的平滑回退逻辑。
- **复合命名空间存储**：采用 `${platform}:${channelId}:${messageId}` 复合 Key，解决多平台、多 Bot 混跑时的消息 ID 与群号碰撞隐患。

### 📝 控制台与文档
- **控制台 Usage 美化**：新增模块化 `usage.ts` 控制台概览页与可折叠信息卡片。
- **徽章优化**：按规范仅保留 GitHub 与 Gitee 专属开源徽章。
- **双仓联动**：建立 GitHub (`VincentZyu233/koishi-plugin-recall-report`) 与 Gitee (`vincent-zyu/koishi-plugin-recall-report`) 双远端同步保障。

---

## [0.0.1-beta.2+20260126] - 2026-01-26
- 初始版本：OneBot QQ 群聊撤回消息转发与主人私聊上报。
