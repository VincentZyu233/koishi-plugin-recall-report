import { Context, Logger } from 'koishi'
import { Config } from './types'
import { Utils, ensureLxgwFontBuffer } from './utils'
import { MessageStorage } from './storage'
import { RecallRenderer } from './render'
import { registerEvents } from './events'
import { registerCommands } from './commands'
import { usage } from './usage'

export const name = 'recall-report'

export { Config, usage }

const logger = new Logger('recall-report')

export function apply(ctx: Context, config: Config) {
  logger.info('recall-report 插件正在初始化...')

  // 1. 初始化工具类
  const utils = new Utils(ctx, config)

  // 2. 初始化带复合键的存储器
  const storage = new MessageStorage(config.messageSaveDuration, config.maxStoredMessages)

  // 3. 初始化跨平台自适应渲染引擎
  const renderer = new RecallRenderer(ctx, config, utils)

  // 4. 注册通用事件监听器
  registerEvents(ctx, config, utils, storage, renderer)

  // 5. 注册用户指令
  registerCommands(ctx, config, utils, storage)

  // 6. 异步预热/预下载 Takumi 中文字体（后台静默进行，不阻塞启动）
  ensureLxgwFontBuffer(ctx).catch(err => {
    logger.warn('预热加载 LXGW 文楷字体遇到异常，将在出图时重试:', err)
  })

  logger.info(`recall-report 插件加载就绪，当前共监听 ${utils.getEnabledGroupCount()} 个群组/频道`)
}
