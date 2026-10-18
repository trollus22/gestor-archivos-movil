import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181a20" />
      <stop offset="100%" stop-color="#0f1014" />
    </linearGradient>
    <linearGradient id="folderBack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0078d4" />
      <stop offset="100%" stop-color="#005a9e" />
    </linearGradient>
    <linearGradient id="folderFront" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2886de" />
      <stop offset="100%" stop-color="#0067c0" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="fileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e0e0e0" />
    </linearGradient>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="110" fill="url(#bg)" />

  <!-- Folder Group -->
  <g filter="url(#shadow)" transform="translate(64, 96)">
    <!-- Back Tab -->
    <path d="M 32 40 L 140 40 L 175 75 L 352 75 C 365 75 376 86 376 99 L 376 130 L 8 130 L 8 64 C 8 50 19 40 32 40 Z" fill="url(#folderBack)" opacity="0.95"/>
    
    <!-- Paper sheet peeking -->
    <rect x="70" y="55" width="244" height="150" rx="12" fill="url(#fileGrad)" opacity="0.9"/>
    <line x1="100" y1="85" x2="200" y2="85" stroke="#999" stroke-width="8" stroke-linecap="round"/>
    <line x1="100" y1="110" x2="250" y2="110" stroke="#bbb" stroke-width="8" stroke-linecap="round"/>

    <!-- Front Folder -->
    <path d="M 0 115 C 0 102 10 92 24 92 L 360 92 C 374 92 384 102 384 115 L 384 250 C 384 266 371 280 355 280 L 29 280 C 13 280 0 266 0 250 Z" fill="url(#folderFront)"/>
    
    <!-- Subtle shine on top edge -->
    <path d="M 0 115 C 0 102 10 92 24 92 L 360 92 C 374 92 384 102 384 115 L 384 122 L 0 122 Z" fill="#ffffff" opacity="0.15"/>
  </g>
</svg>
`;

async function generate() {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg.trim());

  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;">${iconSvg}</body></html>`);

  // 512x512
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  const buf512 = await page.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), buf512);

  // 192x192
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="192" height="192">${iconSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg></body></html>`);
  const buf192 = await page.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), buf192);

  await browser.close();
  console.log('Icons generated successfully: icon-192.png, icon-512.png, icon.svg');
}

generate().catch(console.error);
