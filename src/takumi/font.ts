import { createHash } from 'crypto'
import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { Context, Logger } from 'koishi'

const logger = new Logger('recall-report:font')

export const LXGW_WENKAI_FILE_NAME = 'LXGWWenKaiMono-Regular.ttf'

const GITEE_URL = `https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`
const GITHUB_URL = `https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`
const DOWNLOAD_SOURCES = [
  { name: 'Gitee', url: GITEE_URL },
  { name: 'GitHub', url: GITHUB_URL },
]

const EXPECTED = {
  size: 24755236,
  md5: '90e75a25cca0e8868977b880352c6a53',
  sha1: '7f018ad4a181e4d2df4f972f357e612885d6c24a',
  sha256: 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61',
  sha512: '793dc4357d311dba539c50b0ae38ff247af066f141ffea54ff0cc51e274453671e736989cee4998fd89211035ecfe52ad38aa828ba7f1739bcf107b94a023be5',
}

let cachedFontBuffer: Buffer | null = null
let cachedFontPath: string | null = null
const pendingChecks = new Map<string, Promise<Buffer>>()

export function getLxgwFontPath(ctx: Context): string {
  return path.join(ctx.baseDir, 'data', 'fonts', LXGW_WENKAI_FILE_NAME)
}

function verifyBuffer(buffer: Buffer): boolean {
  if (buffer.length !== EXPECTED.size) return false
  return createHash('md5').update(buffer).digest('hex') === EXPECTED.md5
    && createHash('sha1').update(buffer).digest('hex') === EXPECTED.sha1
    && createHash('sha256').update(buffer).digest('hex') === EXPECTED.sha256
    && createHash('sha512').update(buffer).digest('hex') === EXPECTED.sha512
}

async function verifyFile(filePath: string): Promise<Buffer | null> {
  if (!existsSync(filePath)) return null
  try {
    const buf = await readFile(filePath)
    if (verifyBuffer(buf)) return buf
    return null
  } catch {
    return null
  }
}

async function downloadLxgwFont(ctx: Context, filePath: string): Promise<Buffer> {
  let lastError: unknown
  for (const source of DOWNLOAD_SOURCES) {
    try {
      logger.info(`[字体] 开始从 ${source.name} 下载 ${LXGW_WENKAI_FILE_NAME}...`)
      const response = await ctx.http.get(source.url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      })
      const buffer = Buffer.from(response)
      if (!verifyBuffer(buffer)) {
        throw new Error('下载内容大小或哈希校验不匹配')
      }
      await writeFile(filePath, buffer)
      logger.info(`[字体] ${LXGW_WENKAI_FILE_NAME} 已成功从 ${source.name} 下载并通过校验。`)
      return buffer
    } catch (error) {
      lastError = error
      logger.warn(`[字体] ${source.name} 下载失败，尝试下一个源: ${error instanceof Error ? error.message : error}`)
    }
  }
  throw new Error(`LXGW 字体下载失败，Gitee 和 GitHub 源均不可用: ${lastError instanceof Error ? lastError.message : lastError}`)
}

/**
 * 确保 LXGW 文楷字体存在并返回字体二进制数据
 */
export async function ensureLxgwFont(ctx: Context): Promise<Buffer> {
  const filePath = getLxgwFontPath(ctx)

  if (cachedFontBuffer && cachedFontPath === filePath) {
    return cachedFontBuffer
  }

  const pending = pendingChecks.get(filePath)
  if (pending) return pending

  const check = (async () => {
    // 1. 检查是否存在且有效
    const existing = await verifyFile(filePath)
    if (existing) {
      logger.info(`[字体] 检测到 ${LXGW_WENKAI_FILE_NAME} 存在且校验通过: ${filePath}`)
      cachedFontBuffer = existing
      cachedFontPath = filePath
      return existing
    }

    if (existsSync(filePath)) {
      logger.warn(`[字体] 字体文件 ${filePath} 校验不匹配，准备重新下载...`)
    }

    // 2. 下载并保存
    await mkdir(path.dirname(filePath), { recursive: true })
    const downloaded = await downloadLxgwFont(ctx, filePath)
    cachedFontBuffer = downloaded
    cachedFontPath = filePath
    return downloaded
  })().finally(() => pendingChecks.delete(filePath))

  pendingChecks.set(filePath, check)
  return check
}

/**
 * 获取并解析可用的中文字体 Buffer
 * 注意：Takumi WASM 仅支持单个 .ttf / .otf，严禁使用 .ttc (TrueType Collection)
 */
export async function resolveFontData(ctx: Context, configuredPath?: string): Promise<Buffer> {
  // 1. 优先使用用户自定义路径 (若是有效绝对或相对路径)
  if (configuredPath && configuredPath.trim().length > 0) {
    const raw = configuredPath.trim()
    const target = path.isAbsolute(raw) ? raw : path.resolve(ctx.baseDir, raw)
    if (existsSync(target)) {
      try {
        const buf = await readFile(target)
        if (buf.length > 0) {
          logger.info(`[字体] 使用自定义字体: ${target}`)
          return buf
        }
      } catch (err) {
        logger.warn(`[字体] 读取自定义字体文件失败 (${target}):`, err)
      }
    } else {
      logger.warn(`[字体] 自定义字体路径不存在 (${target})，回退到标准 LXGW 文楷`)
    }
  }

  // 2. 检查 ctx.baseDir 下是否有已就绪的标准 LXGW 字体或本地候选
  try {
    return await ensureLxgwFont(ctx)
  } catch (err) {
    logger.warn('[字体] 自动下载/校验 LXGW 字体失败，尝试查找备选字体...', err)
  }

  // 3. 备选只读候选列表 (.ttf / .otf，坚决不包含 .ttc)
  const candidateFallbacks = [
    path.join(ctx.baseDir, 'data', 'fonts', 'LXGWWenKaiMono-Medium.ttf'),
    path.join(ctx.baseDir, 'external', 'test-image-gen', 'assets', 'fonts', 'LXGWWenKaiMono-Regular.ttf'),
    'C:/Windows/Fonts/simhei.ttf',
  ]

  for (const cand of candidateFallbacks) {
    if (existsSync(cand)) {
      try {
        const buf = await readFile(cand)
        if (buf.length > 0) {
          logger.info(`[字体] 启用备选字体: ${cand}`)
          return buf
        }
      } catch {
        // ignore
      }
    }
  }

  throw new Error('未找到可用的中文字体 (.ttf/.otf)，且自动下载失败，请手动放置中文字体到 data/fonts/LXGWWenKaiMono-Regular.ttf')
}
