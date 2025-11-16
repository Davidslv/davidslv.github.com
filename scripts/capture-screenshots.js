const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'img', 'portfolio');

// Viewport dimensions - adjust based on your needs
// Options:
// - 1920x1080 (Full HD) - Highest quality, larger files
// - 1600x900 (HD+) - Good balance of quality and size
// - 1440x900 (Widescreen) - Common laptop resolution
// - 1280x720 (HD) - Smaller files, still good quality
// - 1024x768 (Standard) - Smallest, fastest capture
const VIEWPORT_WIDTH = 1920;  // Recommended: 1440 for good quality/size balance
const VIEWPORT_HEIGHT = 1080;   // Recommended: 900 for good quality/size balance

// Projects to capture
const projects = [
  {
    name: 'dashboard',
    url: 'https://dashboard.davidslv.uk',
    waitTime: 3000,
    fullPage: true
  },
  {
    name: 'microblog',
    url: 'https://microblog.davidslv.uk',
    waitTime: 3000,
    fullPage: true
  },
  {
    name: 'pokedex',
    url: 'https://pokedex-lemon-nine.vercel.app',
    waitTime: 3000,
    fullPage: true
  },
  {
    name: 'cashew',
    url: 'https://cashew.davidslv.uk',
    waitTime: 3000,
    fullPage: true
  },
  {
    name: 'roguelike',
    url: 'https://github.com/Davidslv/vanilla-roguelike',
    waitTime: 5000,
    fullPage: true,
    selector: '.repository-content' // Focus on the main content area
  }
];

async function captureScreenshot(browser, project) {
  console.log(`Capturing screenshot for ${project.name}...`);

  let page = null;

  try {
    page = await browser.newPage();

    // Set viewport for consistent screenshots
    await page.setViewport({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 2 // Retina quality
    });

    // Set a longer default timeout
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Navigate to the page with better error handling
    try {
      await page.goto(project.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch (error) {
      console.error(`Navigation error for ${project.name}:`, error.message);
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore
        }
      }
      return null;
    }

    // Wait for any additional content to load
    await page.waitForTimeout(project.waitTime || 2000);

    // Handle GitHub pages - scroll to hide header/footer for cleaner shot
    if (project.url.includes('github.com')) {
      await page.evaluate(() => {
        window.scrollTo(0, 100); // Scroll down a bit to show more content
      });
      await page.waitForTimeout(1000);
    }

    // Wait a bit for any animations to complete
    await page.waitForTimeout(500);

    // Capture screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${project.name}-screenshot.png`);

    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: project.fullPage || false,
        type: 'png'
      });
    } catch (error) {
      console.error(`Screenshot capture error for ${project.name}:`, error.message);
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore
        }
      }
      return null;
    }

    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    console.log(`✓ Screenshot saved: ${screenshotPath}`);

    return screenshotPath;
  } catch (error) {
    console.error(`✗ Error capturing ${project.name}:`, error.message);
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    return null;
  }
}

async function main() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Starting screenshot capture...\n');

  let browser;
  try {
    // Try to find Chrome on macOS
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];

    let executablePath;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        console.log(`Using Chrome at: ${executablePath}`);
        break;
      }
    }

    const launchOptions = {
      headless: true, // Use old headless for better compatibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security'
      ],
      ignoreHTTPSErrors: true
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    // Wait a moment for browser to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Browser launched successfully\n');
  } catch (error) {
    console.error('Failed to launch browser:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Chrome/Chromium is installed');
    console.error('2. Try running: npm install puppeteer --force');
    console.error('3. On macOS, you may need to allow Chrome in System Preferences');
    console.error('4. The bundled Chromium should work - this error suggests a system issue');
    process.exit(1);
  }

  try {
    const results = [];
    for (const project of projects) {
      try {
        const result = await captureScreenshot(browser, project);
        results.push({ project: project.name, success: result !== null });
      } catch (error) {
        console.error(`Failed to capture ${project.name}:`, error.message);
        results.push({ project: project.name, success: false });
      }
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✓ Screenshot capture completed!');
    console.log('\nResults:');
    results.forEach(r => {
      console.log(`  ${r.success ? '✓' : '✗'} ${r.project}`);
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n${successCount}/${results.length} screenshots captured successfully.`);

    if (successCount > 0) {
      console.log('\nRun "npm run process" to add modern frames to the screenshots.');
    } else {
      console.log('\nNo screenshots were captured. Please check the errors above.');
    }
  } catch (error) {
    console.error('Fatal error during capture:', error);
  } finally {
    if (browser) {
      try {
        const pages = await browser.pages();
        await Promise.all(pages.map(p => p.close().catch(() => {})));
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e.message);
      }
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

