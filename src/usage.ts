const pkg = require('../package.json')

const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));transition:var(--color-transition, border-color .2s ease, background-color .2s ease)'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit)'

export const usage = `
<h1>Koishi 插件：全平台消息撤回审计报告 recall-report</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<p>
  <a href="https://github.com/VincentZyu233/koishi-plugin-recall-report" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-recall-report" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
</p>

<p>
  基于标准 Satori 协议开发的全平台消息撤回审计插件，彻底摆脱单一 OneBot 生态绑定。<br>
  原生支持 <b>OneBot (QQ)</b>、<b>Discord</b>、<b>KOOK (开黑啦)</b>、<b>Matrix</b>、<b>飞书 (Lark)</b> 等主流通信平台的消息撤回捕获与自适应图文/合并转发上报。
</p>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">✨ 核心特性</summary>
  <div style="${detailsBodyStyle}">
    <ul>
      <li><b>🌐 Satori 原生全平台支持</b>：依赖 Satori 标准 <code>message</code> 与 <code>message-deleted</code> 事件，无需专有适配器。</li>
      <li><b>🧩 自适应下发渲染 (Adaptive Rendering)</b>：在 QQ/OneBot 优先使用精美的“合并转发卡片”，在 Discord/KOOK 等平台自适应降级为“富文本引用”，杜绝发送失败报错。</li>
      <li><b>🖼️ 原生头像提取与平滑回退</b>：优先消费各平台 Satori Universal 头像规范，无感兼容 OneBot/QQ 历史接口。</li>
      <li><b>🛡️ 复合命名空间存储</b>：按 <code>platform:channelId:messageId</code> 复合隔离，跨平台多 Bot 混跑零冲突，自带内存 LRU 淘汰与 TTL 自动清理。</li>
    </ul>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">📝 快速配置指南</summary>
  <div style="${detailsBodyStyle}">
    <ol>
      <li><b>👑 主人账号配置</b>：在「主人通知配置」中添加接收报告的主人账号，指定平台（如 <code>onebot</code> 或 <code>discord</code>）和对应的 <code>userId</code>。</li>
      <li><b>📋 群组/频道配置</b>：在「监听目标配置」中填入需要防撤回审计的群号或频道 ID，平台字段留空可自动监听全平台同名 ID。</li>
      <li><b>⚙️ 缓存与渲染设置</b>：可自由调整消息在内存中的保留时长（默认 3600 秒）与最大缓存数量上限。</li>
    </ol>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">🔧 可用指令</summary>
  <div style="${detailsBodyStyle}">
    <ul>
      <li><code>recall-status</code> - 📊 查看当前全平台撤回监听状态、缓存占用量与群组清单</li>
      <li><code>recall-test</code> - 🧪 在当前群组或频道测试监听规则是否命中</li>
      <li><code>recall-clear</code> - 🧹 一键清空当前的内存消息缓存</li>
    </ul>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">📋 更新日志 (Changelog)</summary>
  <div style="${detailsBodyStyle}">
    <p><b>v0.2.0-beta.1+20261120</b></p>
    <ul>
      <li>🌟 <b>架构重塑</b>：插件正式由 <code>onebot-recall-report</code> 重命名跃迁为 <code>recall-report</code>。</li>
      <li>🔓 <b>解锁全平台</b>：彻底移除 <code>session.subtype !== 'group'</code> 门禁，改用 Satori 标准公域判定。</li>
      <li>🎨 <b>自适应渲染引擎</b>：新增 <code>RecallRenderer</code>，按接收端平台智能分流（QQ 合并转发 / 其它平台图文引用）。</li>
      <li>👤 <b>头像标准化</b>：废除硬编码的 <code>qlogo.cn</code>，优先消费 Satori 标准协议的 CDN 头像，兼顾 OneBot 平滑兜底。</li>
      <li>💾 <b>多维存储隔离</b>：引入 <code>platform:channelId:messageId</code> 复合存储键，保障多平台混跑稳定性。</li>
    </ul>
  </div>
</details>
`
