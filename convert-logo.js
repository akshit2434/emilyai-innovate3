const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public/logo.png');
const outputDir = path.join(__dirname, 'public');
const appDir = path.join(__dirname, 'src/app');

async function convert() {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            console.error(`Error: Logo file not found at ${inputPath}`);
            return;
        }

        console.log('Starting logo conversion...\n');

        // WebP version (compressed)
        await sharp(inputPath)
            .webp({ quality: 85, effort: 6 })
            .toFile(path.join(outputDir, 'logo.webp'));
        console.log('✓ Created logo.webp');

        // SVG version (if needed, create optimized PNG as SVG alternative)
        // For now, we'll create a high-quality PNG optimized for SVG-like scaling
        await sharp(inputPath)
            .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 95 })
            .toFile(path.join(outputDir, 'logo-large.png'));
        console.log('✓ Created logo-large.png');

        // Apple touch icon (180x180)
        await sharp(inputPath)
            .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 90 })
            .toFile(path.join(outputDir, 'apple-touch-icon.png'));
        console.log('✓ Created apple-touch-icon.png');

        // Favicon for Next.js App Router (icon.png - 32x32)
        await sharp(inputPath)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 90 })
            .toFile(path.join(appDir, 'icon.png'));
        console.log('✓ Created src/app/icon.png');

        // Favicon.ico (16x16 and 32x32 sizes)
        const ico16 = await sharp(inputPath)
            .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toBuffer();
        
        const ico32 = await sharp(inputPath)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toBuffer();

        // For .ico, we'll create a single 32x32 PNG that browsers will use
        // Note: True .ico format requires a special library, but modern browsers accept PNG
        await sharp(ico32)
            .png()
            .toFile(path.join(appDir, 'favicon.ico'));
        console.log('✓ Created src/app/favicon.ico');

        // Favicon 192x192 for PWA
        await sharp(inputPath)
            .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 90 })
            .toFile(path.join(outputDir, 'icon-192.png'));
        console.log('✓ Created icon-192.png');

        // Favicon 512x512 for PWA
        await sharp(inputPath)
            .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 90 })
            .toFile(path.join(outputDir, 'icon-512.png'));
        console.log('✓ Created icon-512.png');

        console.log('\n✨ All logo formats created successfully!');
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

convert();
