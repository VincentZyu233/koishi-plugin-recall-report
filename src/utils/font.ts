import path from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { createHash } from 'crypto'
import { Context, Logger } from 'koishi'

const logger = new Logger('recall-report:font')

export const LXGW_WENKAI_FILE_NAME = 'LXGWWenKaiMono-Regular.ttf'

const GITEE_RELEASE_BASE = 'https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts'
const GITHUB_RELEASE_BASE = 'https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts'

export const LXGW_WENKAI_URL = `${GITEE_RELEASE_BASE}/${LXGW_WENKAI_FILE_NAME}`

export interface FontIntegrity {
  size: number
  md5: string
  sha1: string
  sha256: string
  sha512: string
}

export const LXGW_FONT_INTEGRITY: FontIntegrity = {
  size: 24755236,
  md5: '90e75a25cca0e8868977b880352c6a53',
  sha1: '7f018ad4a181e4d2df4f972f357e612885d6c24a',
  sha256: 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61',
  sha512: '793dc4357d311dba539c50b0ae38ff247af066f141ffea54ff0cc51e274453671e736989cee4998fd89211035ecfe52ad38aa828ba7f1739bcf107b94a023be5',
}

export const FONT_DOWNLOAD_URLS = [
  { source: 'Gitee', url: `${GITEE_RELEASE_BASE}/${LXGW_WENKAI_FILE_NAME}` },
  { source: 'GitHub', url: `${GITHUB_RELEASE_BASE}/${LXGW_WENKAI_FILE_NAME}` },
]

export function getFontDirByBaseDir(baseDir: string): string {
  return path.join(baseDir, 'data', 'fonts')
}

export function getLxgwWenKaiPathByBaseDir(baseDir: string): string {
  return path.join(getFontDirByBaseDir(baseDir), LXGW_WENKAI_FILE_NAME)
}

function calculateFontHashes(buffer: Buffer) {
  return {
    md5: createHash('md5').update(buffer).digest('hex'),
    sha1: createHash('sha1').update(buffer).digest('hex'),
    sha256: createHash('sha256').update(buffer).digest('hex'),
    sha512: createHash('sha512').update(buffer).digest('hex'),
  }
}

export async function verifyFontIntegrity(filePath: string, expected: FontIntegrity): Promise<boolean> {
  if (!existsSync(filePath)) return false
  try {
    const buffer = await readFile(filePath)
    if (buffer.length !== expected.size) return false
    const hashes = calculateFontHashes(buffer)
    return hashes.md5 === expected.md5
      && hashes.sha1 === expected.sha1
      && hashes.sha256 === expected.sha256
      && hashes.sha512 === expected.sha512
  } catch {
    return false
  }
}

export function verifyFontBuffer(buffer: Buffer, expected: FontIntegrity): boolean {
  if (buffer.length !== expected.size) return false
  const hashes = calculateFontHashes(buffer)
  return hashes.md5 === expected.md5
    && hashes.sha1 === expected.sha1
    && hashes.sha256 === expected.sha256
    && hashes.sha512 === expected.sha512
}

let cachedFontBuffer: Buffer | null = null
let cachedFontPath: string | null = null
const pendingChecks = new Map<string, Promise<Buffer>>()

/**
 * 校验并下载 LXGW 霞鹜文楷字体（双源支持：Gitee 优先，失败自动切 GitHub）
 */
export async function downloadLxgwFont(ctx: Context, filePath: string): Promise<Buffer> {
  const fileName = path.basename(filePath)
  let lastError: unknown = null

  for (const candidate of FONT_DOWNLOAD_URLS) {
    try {
      logger.info(`📥 开始从 ${candidate.source} 下载字体文件: ${fileName}`)
      const response = await ctx.http.get(candidate.url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      })
      const buffer = Buffer.from(response)
      if (!verifyFontBuffer(buffer, LXGW_FONT_INTEGRITY)) {
        throw new Error(`字体 hash 校验失败: ${fileName}`)
      }
      await writeFile(filePath, buffer)
      if (!(await verifyFontIntegrity(filePath, LXGW_FONT_INTEGRITY))) {
        throw new Error(`字体写入磁盘后 hash 校验失败: ${fileName}`)
      }
      logger.info(`✅ 字体文件从 ${candidate.source} 下载成功且校验通过: ${fileName}`)
      return buffer
    } catch (error) {
      lastError = error
      logger.warn(`⚠️ ${candidate.source} 下载字体失败 ${fileName}: ${error instanceof Error ? error.message : error}`)
    }
  }

  throw new Error(`字体文件下载失败 ${fileName}，Gitee / GitHub 均不可用: ${lastError instanceof Error ? lastError.message : lastError}`)
}

/**
 * 确保 LXGW 字体就绪并返回二进制数据
 */
export async function ensureLxgwFontBuffer(ctx: Context): Promise<Buffer> {
  const filePath = getLxgwWenKaiPathByBaseDir(ctx.baseDir)

  if (cachedFontBuffer && cachedFontPath === filePath) {
    return cachedFontBuffer
  }

  const pending = pendingChecks.get(filePath)
  if (pending) return pending

  const check = (async () => {
    // 1. 若本地存在且校验通过
    if (await verifyFontIntegrity(filePath, LXGW_FONT_INTEGRITY)) {
      logger.info(`✅ 字体 ${LXGW_WENKAI_FILE_NAME} 已就绪并通过哈希校验: ${filePath}`)
      const buf = await readFile(filePath)
      cachedFontBuffer = buf
      cachedFontPath = filePath
      return buf
    }

    if (existsSync(filePath)) {
      logger.warn(`⚠️ 字体文件 ${filePath} 哈希校验不匹配，准备重新下载...`)
    }

    // 2. 自动下载
    const fontDir = getFontDirByBaseDir(ctx.baseDir)
    await mkdir(fontDir, { recursive: true })
    const buf = await downloadLxgwFont(ctx, filePath)
    cachedFontBuffer = buf
    cachedFontPath = filePath
    return buf
  })().finally(() => pendingChecks.delete(filePath))

  pendingChecks.set(filePath, check)
  return check
}

/**
 * 解析并返回用于 Takumi 渲染的字体二进制数据
 * 若用户配置了有效自定义路径则使用自定义路径；否则使用自动管理的 LXGW 文楷
 */
export async function resolveRenderFontBuffer(ctx: Context, customFontPath?: string): Promise<Buffer> {
  if (customFontPath && customFontPath.trim().length > 0) {
    const raw = customFontPath.trim()
    const target = path.isAbsolute(raw) ? raw : path.resolve(ctx.baseDir, raw)
    if (existsSync(target)) {
      try {
        const buf = await readFile(target)
        if (buf.length > 0) {
          logger.info(`[字体] 使用自定义字体路径: ${target}`)
          return buf
        }
      } catch (err) {
        logger.warn(`[字体] 读取自定义字体文件失败 (${target}):`, err)
      }
    } else {
      logger.warn(`[字体] 自定义字体文件不存在 (${target})，回退到自动管理的 LXGW 文楷`)
    }
  }

  return ensureLxgwFontBuffer(ctx)
}
