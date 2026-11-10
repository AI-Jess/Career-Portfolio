// Renders each mockups/*.html (#shot element) to public/case-studies/<slug>/<name>.webp
// Mockups use SAMPLE DATA ONLY. Requires Python 3 + Pillow for the WebP step.
// Usage: node mockups/render.cjs ip-staffing-updates
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const slug = process.argv[2] || 'ip-staffing-updates';
  const outDir = path.join(__dirname, '..', 'public', 'case-studies', slug);
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.html'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  for (const f of files) {
    await page.goto('file://' + path.join(__dirname, f));
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(outDir, f.replace('.html', '.png'));
    await page.locator('#shot').screenshot({ path: out });
    // Convert to WebP (much smaller) and drop the PNG
    execFileSync('python3', ['-I', '-c', 'import sys,os;from PIL import Image;p=sys.argv[1];Image.open(p).convert("RGB").save(p[:-4]+".webp","WEBP",quality=88,method=6);os.remove(p)', out]);
    console.log('wrote', path.relative(process.cwd(), out.replace('.png', '.webp')));
  }
  await browser.close();
})();
