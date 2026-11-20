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
  基于标准 Satori 协议开发的全平台消息撤回审计插件，原生支持 <b>OneBot (QQ)</b>、<b>Discord</b>、<b>KOOK (开黑啦)</b>、<b>Matrix</b>、<b>飞书 (Lark)</b> 等主流平台。<br>
  集成 <b>Takumi WASM</b> 毫秒级免浏览器极速出图引擎，支持自由组合三种独立报告交付形式。
</p>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">✨ 核心特性</summary>
  <div style="${detailsBodyStyle}">
    <ul>
      <li><b>🦀 Takumi WASM 极速出图</b>：内置 Rust 驱动的 WASM 引擎，毫秒级直接输出精美现代卡片图，无需安装 Chromium 或任何外部依赖。</li>
      <li><b>📢 三重报告形式自由勾选</b>：
        <ul>
          <li><b>图文模式 (text-and-image)</b>：群头像 + 用户头像 + 结构化文字概要；</li>
          <li><b>合并转发 (forward)</b>：QQ 合并转发记录卡片（其它平台自适应图文引用）；</li>
          <li><b>Takumi 卡片 (takumi)</b>：完整美化渲染大图。</li>
        </ul>
        <i>（勾选几项就发送几条独立消息，最多 3 条）</i>
      </li>
      <li><b>🛡️ 安全低调默认设置</b>：原群/频道提醒默认关闭（<code>sendToGroup: false</code>），仅私聊上报主人，避免打扰群内。</li>
      <li><b>🌐 Satori 原生全平台支持</b>：依赖通用 Satori 协议，原生提取各平台 CDN 头像，复合 Key 隔离多平台混跑。</li>
    </ul>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}">📝 快速配置指南</summary>
  <div style="${detailsBodyStyle}">
    <ol>
      <li><b>👑 主人账号配置</b>：在「主人通知配置」中添加接收报告的主人账号，指定平台（如 <code>onebot</code>、<code>discord</code>、<code>kook</code>）和对应的 <code>userId</code>。</li>
      <li><b>📋 监听目标配置</b>：填入需要防撤回审计的群号或频道 ID，平台字段留空可自动匹配所有接入平台。</li>
      <li><b>⚙️ 交付形式设置</b>：通过「报告消息形式」多选框自由勾选需要下发的消息形式（text-and-image / forward / takumi）。</li>
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
    <p><b>v0.3.0-beta.1+20261120</b></p>
    <ul>
      <li>🦀 <b>新增 Takumi WASM 出图模式</b>：毫秒级生成结构化撤回报告大图，支持暗色主题与自定义字体。</li>
      <li>🎛️ <b>交付模式多选解耦</b>：废除旧 <code>preferForward</code> 属性，引入 <code>reportModes</code> 多选框（<code>text-and-image</code> / <code>forward</code> / <code>takumi</code>），选几项发几条独立消息。</li>
      <li>🔕 <b>默认静音更安全</b>：<code>groupConfigs.sendToGroup</code> 默认值改为 <code>false</code>，仅发送主人，杜绝群内刷屏。</li>
      <li>✏️ <b>文案细节规范</b>：主人账号平台名称统一增加全角括号说明。</li>
    </ul>
  </div>
</details>
`
