import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync(new URL('../public/pwa-icon.svg', import.meta.url))

const sizes = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [file, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(file)
  console.log(`Generated ${file}`)
}
