// process-screenshots-adaptive.js
// This script processes screenshots by adapting the frame to the image dimensions
// instead of scaling the image to fit a fixed frame size.
// The frame wraps around the actual image size, maintaining the original quality.
// It uses the sharp library to add a modern frame with gradient background.
// It also adds a macOS-style window controls bar.
// It then saves the processed screenshots as webp files in the img/portfolio directory.

// USAGE:
// npm run process:adaptive

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'img', 'portfolio');
const FRAME_PADDING = 60;
const FRAME_RADIUS = 16;
const WINDOW_CONTROLS_HEIGHT = 40;
const GRADIENT_COLORS = ['#667eea', '#764ba2']; // Purple gradient

// Optional: Maximum dimensions to prevent extremely large images
// Set to null or very high values to disable
const MAX_WIDTH = null;  // Set to null for no limit, or e.g. 2400
const MAX_HEIGHT = null; // Set to null for no limit, or e.g. 1600

async function createAdaptiveFrame(inputPath, outputPath) {
  try {
    // Read the original screenshot
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Get original dimensions
    let originalWidth = metadata.width;
    let originalHeight = metadata.height;

    // Apply max dimensions if specified (only downscale if needed)
    let scale = 1;
    if (MAX_WIDTH && originalWidth > MAX_WIDTH) {
      scale = Math.min(scale, MAX_WIDTH / originalWidth);
    }
    if (MAX_HEIGHT && originalHeight > MAX_HEIGHT) {
      scale = Math.min(scale, MAX_HEIGHT / originalHeight);
    }

    let imageWidth = originalWidth;
    let imageHeight = originalHeight;

    // Resize only if we need to apply max dimensions
    let processedImage;
    if (scale < 1) {
      imageWidth = Math.round(originalWidth * scale);
      imageHeight = Math.round(originalHeight * scale);
      processedImage = await image
        .resize(imageWidth, imageHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();
    } else {
      // Use original image without scaling
      processedImage = await image.png().toBuffer();
    }

    // Frame dimensions adapt to image size
    // Frame width = image width (no scaling)
    // Frame height = image height + window controls bar
    const FRAME_WIDTH = imageWidth;
    const FRAME_HEIGHT = imageHeight + WINDOW_CONTROLS_HEIGHT;

    // Create the final canvas size (gradient background + frame)
    const canvasWidth = FRAME_WIDTH + (FRAME_PADDING * 2);
    const canvasHeight = FRAME_HEIGHT + (FRAME_PADDING * 2);

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
          height="${WINDOW_CONTROLS_HEIGHT}"
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

    // Calculate position for screenshot (centered horizontally, below controls)
    const screenshotX = FRAME_PADDING;
    const screenshotY = FRAME_PADDING + WINDOW_CONTROLS_HEIGHT;

    // Composite: gradient background + frame + screenshot
    await sharp(gradientSvg)
      .composite([
        {
          input: frameSvg,
          top: 0,
          left: 0
        },
        {
          input: processedImage,
          top: screenshotY,
          left: screenshotX
        }
      ])
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`✓ Processed: ${path.basename(outputPath)} (${imageWidth}x${imageHeight} → ${canvasWidth}x${canvasHeight})`);
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

  console.log(`Processing ${files.length} screenshots with adaptive frames...\n`);

  for (const file of files) {
    const inputPath = path.join(SCREENSHOT_DIR, file);
    const outputPath = path.join(SCREENSHOT_DIR, file.replace('.png', '-adaptive.webp'));
    await createAdaptiveFrame(inputPath, outputPath);
  }

  console.log('\n✓ All screenshots processed with adaptive frames!');
  console.log('\nThe frame adapts to each image\'s dimensions.');
  console.log('Output files use the suffix "-adaptive.webp"');
}

main();

