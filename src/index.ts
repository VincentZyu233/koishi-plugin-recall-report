import { Context, Logger } from 'koishi'
import { Config } from './types'
import { Utils } from './utils'
import { MessageStorage } from './storage'
import { RecallRenderer } from './renderer'
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

  logger.info(`recall-report 插件加载就绪，当前共监听 ${utils.getEnabledGroupCount()} 个群组/频道`)
}
