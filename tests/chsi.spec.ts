import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('capture page and network', async ({ page }) => {
  const outDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const responses: any[] = [];

  page.on('response', async (resp) => {
    const req = resp.request();
    const type = req.resourceType();
    if (!['xhr', 'fetch', 'document'].includes(type)) return;

    const url = resp.url();
    const status = resp.status();
    const headers = await resp.allHeaders();

    let body = '';
    try {
      const ct = headers['content-type'] || '';
      if (ct.includes('application/json') || ct.includes('text')) {
        body = await resp.text();
        body = body.slice(0, 5000);
      }
    } catch {}

    responses.push({
      url,
      status,
      type,
      contentType: headers['content-type'] || '',
      bodyPreview: body
    });
  });

  await page.goto('https://gaokao.chsi.com.cn/zyk/zybk/detail/73381059', {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  await page.waitForTimeout(8000);

  const html = await page.content();
  fs.writeFileSync(path.join(outDir, 'page.html'), html, 'utf-8');
  fs.writeFileSync(
    path.join(outDir, 'network.json'),
    JSON.stringify(responses, null, 2),
    'utf-8'
  );

  await page.screenshot({ path: path.join(outDir, 'page.png'), fullPage: true });

  expect(html.length).toBeGreaterThan(1000);
});
