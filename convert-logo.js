const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const toIco = require("to-ico");

const outputDir = path.join(__dirname, "public");
const appDir = path.join(__dirname, "src/app");

function pickInputPath() {
  // Prefer an explicit CLI path: `node convert-logo.js public/logo1.png`
  const cliArg = process.argv[2];
  if (cliArg) return path.isAbsolute(cliArg) ? cliArg : path.join(__dirname, cliArg);

  // Prefer the user-provided source if present
  const candidate1 = path.join(outputDir, "logo1.png");
  const candidate2 = path.join(outputDir, "logo.png");
  if (fs.existsSync(candidate1)) return candidate1;
  return candidate2;
}

async function removeNearWhiteBackgroundToPngBuffer(inputPath, { threshold = 248, softness = 18 } = {}) {
  // Converts near-white pixels to transparent with a soft falloff to preserve anti-aliased edges.
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  // Raw is RGBA
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;

    const avg = (r + g + b) / 3;

    if (avg >= threshold) {
      data[i + 3] = 0;
      continue;
    }

    const edgeStart = threshold - softness;
    if (avg >= edgeStart) {
      // fade alpha from 255 -> 0 as avg goes from edgeStart -> threshold
      const t = (threshold - avg) / softness; // 0..1
      data[i + 3] = Math.max(0, Math.min(255, Math.round(a * t)));
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function convert() {
  try {
    const inputPath = pickInputPath();

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Logo file not found at ${inputPath}`);
      return;
    }

    console.log(`Starting logo conversion from: ${inputPath}\n`);

    const transparentBg = { r: 255, g: 255, b: 255, alpha: 0 };
    const iconBg = { r: 255, g: 255, b: 255, alpha: 0 };

    // Helpers
    const makeUiLogo = (p) =>
      sharp(p).png({ compressionLevel: 9, adaptiveFiltering: true, palette: true });

    // For icons, we want the mark to "fill the box" more naturally:
    // 1) Trim surrounding whitespace
    // 2) Resize with `cover` into a square
    const makeIconBase = (p) =>
      sharp(p)
        .trim({ threshold: 8 })
        .resize({ width: 512, height: 512, fit: "cover", position: "centre", background: iconBg });

    // Create a transparent version of the logo (remove white background).
    const transparentLogoBuf = await removeNearWhiteBackgroundToPngBuffer(inputPath, {
      threshold: 248,
      softness: 22,
    });
    console.log("✓ Removed background (transparent master)");

    // Optional: write the transparent master for inspection/debugging
    fs.writeFileSync(path.join(outputDir, "logo-transparent.png"), transparentLogoBuf);
    console.log("✓ Created public/logo-transparent.png");

    // Canonical app logo (PNG) used by the UI (`/logo.png`)
    await makeUiLogo(transparentLogoBuf).toFile(path.join(outputDir, "logo.png"));
    console.log("✓ Created public/logo.png");

    // WebP version (compressed)
    await sharp(transparentLogoBuf).webp({ quality: 84, effort: 6 }).toFile(path.join(outputDir, "logo.webp"));
    console.log("✓ Created public/logo.webp");

    // Versioned WebP to avoid sticky browser caches (Next/Image disallows query strings)
    await sharp(transparentLogoBuf).webp({ quality: 84, effort: 6 }).toFile(path.join(outputDir, "logo-v2.webp"));
    console.log("✓ Created public/logo-v2.webp");

    // Large logo for marketing / high-DPI uses
    await sharp(transparentLogoBuf)
      .resize(512, 512, { fit: "contain", background: transparentBg })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, "logo-large.png"));
    console.log("✓ Created public/logo-large.png");

    // Apple touch icon (180x180)
    await makeIconBase(transparentLogoBuf)
      .resize(180, 180, { fit: "cover", position: "centre", background: iconBg })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, "apple-touch-icon.png"));
    console.log("✓ Created public/apple-touch-icon.png");

    // Next.js App Router icon (32x32) — `src/app/icon.png`
    await makeIconBase(transparentLogoBuf)
      .resize(32, 32, { fit: "cover", position: "centre", background: iconBg })
      .png({ compressionLevel: 9 })
      .toFile(path.join(appDir, "icon.png"));
    console.log("✓ Created src/app/icon.png");

    // Real favicon.ico (multi-size)
    const ico16 = await makeIconBase(transparentLogoBuf)
      .resize(16, 16, { fit: "cover", position: "centre", background: iconBg })
      .png()
      .toBuffer();
    const ico32 = await makeIconBase(transparentLogoBuf)
      .resize(32, 32, { fit: "cover", position: "centre", background: iconBg })
      .png()
      .toBuffer();
    const ico48 = await makeIconBase(transparentLogoBuf)
      .resize(48, 48, { fit: "cover", position: "centre", background: iconBg })
      .png()
      .toBuffer();

    const icoBuf = await toIco([ico16, ico32, ico48]);
    fs.writeFileSync(path.join(appDir, "favicon.ico"), icoBuf);
    console.log("✓ Created src/app/favicon.ico");

    // PWA icons
    await makeIconBase(transparentLogoBuf)
      .resize(192, 192, { fit: "cover", position: "centre", background: iconBg })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, "icon-192.png"));
    console.log("✓ Created public/icon-192.png");

    await makeIconBase(transparentLogoBuf)
      .resize(512, 512, { fit: "cover", position: "centre", background: iconBg })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, "icon-512.png"));
    console.log("✓ Created public/icon-512.png");

    console.log("\n✨ All logo formats created successfully!");
  } catch (error) {
    console.error("Error during conversion:", error);
    process.exit(1);
  }
}

convert();
