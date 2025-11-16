// process-screenshots.js
// This script processes the screenshots in the
// img/portfolio directory and adds a modern frame to them.
// It uses the sharp library to resize the screenshots and add the frame.
// It also adds a gradient background and a macOS-style window controls bar.
// It then saves the processed screenshots as webp files in the img/portfolio directory.

// USAGE:
// npm run process

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'img', 'portfolio');
const FRAME_PADDING = 60;
const FRAME_RADIUS = 16;

// Frame dimensions - optimized for multi-column layouts
// Options:
// - Single column (1 image): 1600x900 (Full width, landscape)
// - Two columns (2 images side by side): 800x900 (Half width each)
// - Three columns (3 images side by side): 533x900 (Third width each)
//
// Recommended for portfolio: 800x900 (2 columns) or 533x900 (3 columns)
// This allows screenshots to be displayed side by side nicely
const FRAME_WIDTH = 1600;   // Optimized for 2-column layout (2 x 800 = 1600px total)
const FRAME_HEIGHT = 900;  // Maintains good aspect ratio
const GRADIENT_COLORS = ['#667eea', '#764ba2']; // Purple gradient

async function createModernFrame(inputPath, outputPath) {
  try {
    // Read the original screenshot
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Calculate dimensions
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Calculate scale to fit within frame (accounting for window controls)
    const scaleX = (FRAME_WIDTH - 40) / originalWidth;
    const scaleY = (FRAME_HEIGHT - 40) / originalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);

    // Create the final canvas size (gradient background + frame)
    const canvasWidth = FRAME_WIDTH + (FRAME_PADDING * 2);
    const canvasHeight = FRAME_HEIGHT + (FRAME_PADDING * 2);

    // Resize the screenshot
    const resizedImage = await image
      .resize(scaledWidth, scaledHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    // Create gradient background using SVG
    const gradientSvg = Buffer.from(`
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${GRADIENT_COLORS[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${GRADIENT_COLORS[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#grad)"/>
      </svg>
    `);

    // Create window frame with controls
    const frameSvg = Buffer.from(`
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- White rounded frame -->
        <rect
          x="${FRAME_PADDING}"
          y="${FRAME_PADDING}"
          width="${FRAME_WIDTH}"
          height="${FRAME_HEIGHT}"
          rx="${FRAME_RADIUS}"
          ry="${FRAME_RADIUS}"
          fill="#ffffff"
        />
        <!-- Window controls bar -->
        <rect
          x="${FRAME_PADDING}"
          y="${FRAME_PADDING}"
          width="${FRAME_WIDTH}"
          height="40"
          rx="${FRAME_RADIUS}"
          ry="${FRAME_RADIUS}"
          fill="#f5f5f5"
        />
        <!-- Window control buttons (macOS style) -->
        <circle cx="${FRAME_PADDING + 16}" cy="${FRAME_PADDING + 20}" r="6" fill="#ff5f57"/>
        <circle cx="${FRAME_PADDING + 36}" cy="${FRAME_PADDING + 20}" r="6" fill="#ffbd2e"/>
        <circle cx="${FRAME_PADDING + 56}" cy="${FRAME_PADDING + 20}" r="6" fill="#28ca42"/>
      </svg>
    `);

    // Calculate position for screenshot (centered in frame, below controls)
    const screenshotX = FRAME_PADDING + Math.floor((FRAME_WIDTH - scaledWidth) / 2);
    const screenshotY = FRAME_PADDING + 40 + Math.floor((FRAME_HEIGHT - 40 - scaledHeight) / 2);

    // Composite: gradient background + frame + screenshot
    await sharp(gradientSvg)
      .composite([
        {
          input: frameSvg,
          top: 0,
          left: 0
        },
        {
          input: resizedImage,
          top: screenshotY,
          left: screenshotX
        }
      ])
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`✓ Processed: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  const files = fs.readdirSync(SCREENSHOT_DIR)
    .filter(file => file.endsWith('.png') && file.includes('screenshot'));

  if (files.length === 0) {
    console.log('No PNG screenshots found. Run npm run screenshots first.');
    return;
  }

  console.log(`Processing ${files.length} screenshots...\n`);

  for (const file of files) {
    const inputPath = path.join(SCREENSHOT_DIR, file);
    const outputPath = path.join(SCREENSHOT_DIR, file.replace('.png', '.webp'));
    await createModernFrame(inputPath, outputPath);
  }

  console.log('\n✓ All screenshots processed!');
  console.log(`\nFrame dimensions: ${FRAME_WIDTH}x${FRAME_HEIGHT}`);
  console.log('Images are scaled to fit the frame.');
  console.log('\nFor adaptive frames (frame adapts to image size), use: npm run process:adaptive');
}

main();
