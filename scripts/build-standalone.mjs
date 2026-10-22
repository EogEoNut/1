import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Keep the normal Vite output, and additionally produce a server-free HTML file.
const outputDir = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
let html = await readFile(path.join(outputDir, 'index.html'), 'utf8')
const scriptTag = /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g
const styleTag = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g
const scripts = [...html.matchAll(scriptTag)]
const styles = [...html.matchAll(styleTag)]
if (scripts.length !== 1 || styles.length !== 1) {
  throw new Error('단일 JS/CSS 번들을 예상했습니다. Vite 빌드 구조를 확인하세요.')
}

function resolveAsset(relativePath) {
  const resolved = path.resolve(outputDir, relativePath)
  if (!resolved.startsWith(outputDir + path.sep) || !relativePath.startsWith('./assets/')) {
    throw new Error('예상하지 못한 빌드 리소스 경로입니다.')
  }
  return resolved
}

const javascript = await readFile(resolveAsset(scripts[0][1]), 'utf8')
const css = await readFile(resolveAsset(styles[0][1]), 'utf8')
html = html.replace(scripts[0][0], '')
html = html.replace(styles[0][0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
html = html.replace('</body>', () => `<script type="module">${javascript.replace(/<\/script/gi, '<\\/script')}</script>\n</body>`)
await writeFile(path.join(outputDir, 'delta-lab.html'), html)
console.log('서버 없이 실행 가능한 파일 생성: dist/delta-lab.html')
