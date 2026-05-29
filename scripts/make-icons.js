/**
 * Genera icon.png desde icon.svg usando sharp (si está disponible).
 * Ejecutar: node scripts/make-icons.js
 * Si sharp no está, instalar: npm install sharp --save-dev
 */
const path = require('path')
const fs   = require('fs')

const svgPath = path.join(__dirname, '..', 'build', 'icon.svg')
const pngPath = path.join(__dirname, '..', 'build', 'icon.png')

async function run() {
  try {
    const sharp = require('sharp')
    await sharp(svgPath).resize(256, 256).png().toFile(pngPath)
    console.log('✓ icon.png generado en build/')
  } catch (e) {
    console.log('sharp no disponible, usando icon.svg directamente.')
    // electron-builder puede usar SVG en algunos casos, pero copiamos como PNG
    fs.copyFileSync(svgPath, pngPath)
    console.log('icon.svg copiado como icon.png (puede necesitar conversión manual)')
  }
}

run()
