# Screenshot Capture Instructions

## Automated Method (Recommended)

Run the automated screenshot capture script:

```bash
npm run screenshots
```

Then process them with modern frames:

```bash
npm run process
```

## Manual Method (If automated fails)

If the automated script has issues, you can use **Picyard** (https://picyard.in) to create modern screenshots:

1. Visit https://picyard.in
2. Upload your screenshot
3. Choose a modern template (similar to the code editor example)
4. Download the enhanced screenshot
5. Save as WebP format in `img/portfolio/` with the naming convention:
   - `dashboard-screenshot.webp`
   - `microblog-screenshot.webp`
   - `pokedex-screenshot.webp`
   - `roguelike-screenshot.webp`
   - `cashew-screenshot.webp`

## Screenshot Requirements

- **Format**: WebP (preferred) or PNG
- **Dimensions**: 1920x1080 or similar (16:9 aspect ratio)
- **Quality**: High quality, optimized for web (< 500KB per image)
- **Style**: Modern frame with rounded corners, gradient background, window controls

## Troubleshooting Automated Script

If `npm run screenshots` fails:

1. **Check Chrome installation**: Puppeteer should bundle Chromium, but you can also install Chrome
2. **Try reinstalling Puppeteer**: `npm install puppeteer --force`
3. **Check permissions**: On macOS, you may need to allow Chrome in System Preferences > Security & Privacy
4. **Use manual method**: If all else fails, use Picyard or similar tools

## Current Status

The automated script captures screenshots and then processes them with:
- Purple gradient background (similar to Picyard style)
- Rounded white frame (16px radius)
- macOS-style window controls (red, yellow, green circles)
- Professional shadows and styling

