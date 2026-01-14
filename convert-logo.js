const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public/logo.png');
const outputDir = path.join(__dirname, 'public');
const appDir = path.join(__dirname, 'src/app');

async function convert() {
    // WebP version (compressed)
    await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(path.join(outputDir, 'logo.webp'));
    console.log('Created logo.webp');

    // Apple touch icon (180x180)
    await sharp(inputPath)
        .resize(180, 180)
        .png()
        .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');

    // Favicon for Next.js App Router (32x32)
    await sharp(inputPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(appDir, 'icon.png'));
    console.log('Created icon.png');

    // Favicon 192x192 for PWA
    await sharp(inputPath)
        .resize(192, 192)
        .png()
        .toFile(path.join(outputDir, 'icon-192.png'));
    console.log('Created icon-192.png');

    // Favicon 512x512 for PWA
    await sharp(inputPath)
        .resize(512, 512)
        .png()
        .toFile(path.join(outputDir, 'icon-512.png'));
    console.log('Created icon-512.png');

    console.log('Done!');
}

convert().catch(console.error);
