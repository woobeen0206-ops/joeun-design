const { chromium } = require('/Users/jungwoobin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:4});
    await page.goto('file://' + path.resolve('design-preview/joeun-design-business-card.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.card img').evaluateAll(async imgs => {
      await Promise.all(imgs.map(img => img.decode()));
      if (imgs.some(img => !img.naturalWidth)) throw new Error('Image missing');
    });
    if(await page.locator('.contact-row .site').count()) throw new Error('Duplicate domain');
    for (const side of ['front', 'back']) {
      const dest = path.resolve(`output/png/joeun-design-business-card-${side}-final.png`);
      fs.mkdirSync(path.dirname(dest), {recursive:true});
      await page.locator(`.${side}`).screenshot({path:dest,animations:'disabled'});
      console.log(dest);
    }
  } finally {await browser.close();}
})();
