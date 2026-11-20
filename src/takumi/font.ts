import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const CANDIDATE_FONTS = [
  'data/fonts/LXGWWenKaiMono-Regular.ttf',
  'data/fonts/LXGWWenKaiMono-Medium.ttf',
  'data/fonts/SourceHanSerifSC-Medium.otf',
  'external/test-image-gen/assets/fonts/LXGWWenKaiMono-Regular.ttf',
  'C:/Windows/Fonts/msyh.ttc',
  'C:/Windows/Fonts/simhei.ttf',
]

/**
 * 探测并读取可用中文字体二进制数据
 */
export function resolveFontData(configuredPath?: string): Buffer | null {
  if (configuredPath && configuredPath.trim().length > 0) {
    const direct = resolve(process.cwd(), configuredPath.trim())
    if (existsSync(direct)) return readFileSync(direct)
    if (existsSync(configuredPath.trim())) return readFileSync(configuredPath.trim())
  }

  for (const cand of CANDIDATE_FONTS) {
    const abs = resolve(process.cwd(), cand)
    if (existsSync(abs)) return readFileSync(abs)
    if (existsSync(cand)) return readFileSync(cand)
  }

  return null
}
