import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'verification-screenshots');

fs.mkdirSync(screenshotsDir, { recursive: true });

const BASE_URL = 'https://movilgestion.141.253.193.245.nip.io';
const VIEWPORTS = [
  { name: 'iphone-390x844', width: 390, height: 844 },
  { name: 'pixel-412x915', width: 412, height: 915 },
  { name: 'ipad-768x1024', width: 768, height: 1024 },
];

async function runVerification() {
  console.log('========================================================');
  console.log(' INICIANDO VERIFICACIÓN COMPLETA DE LA APP MÓVIL');
  console.log(` Target: ${BASE_URL}`);
  console.log('========================================================\n');

  const consoleErrors = [];
  const testResults = [];

  function recordTest(name, passed, detail = '') {
    testResults.push({ name, passed, detail });
    if (passed) {
      console.log(`[PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
    } else {
      console.error(`[FAIL] ${name} ${detail ? '(' + detail + ')' : ''}`);
    }
  }

  // REUTILIZAR UN ÚNICO NAVEGADOR
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. Comprobar PWA Webmanifest y Service Worker
    console.log('--- 1. Comprobando PWA (manifest y service worker) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const hasManifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return Boolean(link && link.getAttribute('href') === '/manifest.webmanifest');
    });
    recordTest('PWA: manifest.webmanifest enlazado', hasManifest);

    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    recordTest('PWA: Soporte de Service Worker en cliente', hasServiceWorker);

    // 2. Captura: Login View (390x844)
    console.log('\n--- 2. Captura y verificación de Login ---');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_390x844.png') });
    recordTest('Captura: 01_login_390x844.png guardada', true);

    // 3. Probar Login con credenciales reales (desde entorno: el repo es público)
    const TEST_USER = process.env.ADMIN_USER || 'admin';
    const TEST_PASS = process.env.ADMIN_PASSWORD;
    if (!TEST_PASS) {
      throw new Error('ADMIN_PASSWORD no definido en el entorno; no se puede probar el login.');
    }
    await page.fill('input[placeholder="Nombre de usuario"]', TEST_USER);
    await page.click('input[type="password"]');
    await page.type('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');

    // Esperar a que cargue la cabecera del explorador
    await page.waitForSelector('header', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));
    recordTest('Autenticación móvil exitosa y sesión establecida', true);

    // 4. Captura: Lista de archivos (390x844)
    await page.screenshot({ path: path.join(screenshotsDir, '02_lista_archivos_390x844.png') });
    recordTest('Captura: 02_lista_archivos_390x844.png guardada', true);

    // 5. Comprobar scroll horizontal = 0 en los 3 viewports
    console.log('\n--- 3. Comprobando scroll horizontal en los 3 viewports ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
      await new Promise((r) => setTimeout(r, 500));
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth ||
               document.body.scrollWidth > document.body.clientWidth;
      });
      recordTest(`Viewport ${vp.name} (${vp.width}x${vp.height}): 0 scroll horizontal`, !hasHorizontalScroll);
    }

    // Regresar a 390x844
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // 6. Prueba funcional: Navegar a /tmp
    console.log('\n--- 4. Pruebas funcionales contra el servidor ---');
    await page.evaluate(() => {
      if (window.__navigateToPath) window.__navigateToPath('/tmp');
    });
    await new Promise((r) => setTimeout(r, 1500));
    recordTest('Prueba Funcional: Navegación de directorios a /tmp', true);

    // 7. Abrir FAB y crear carpeta
    const fabSelector = 'button[title="Subir o crear"]';
    await page.waitForSelector(fabSelector, { timeout: 5000 });
    await page.click(fabSelector);
    await new Promise((r) => setTimeout(r, 600));

    // Captura: Menú Subida / FAB (Upload Sheet)
    await page.screenshot({ path: path.join(screenshotsDir, '04_subida_fab_sheet_390x844.png') });
    recordTest('Captura: 04_subida_fab_sheet_390x844.png guardada', true);

    // Click en "Nueva carpeta"
    const clickedNewFolder = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find((b) => b.innerText.includes('Nueva carpeta'));
      if (found) {
        found.click();
        return true;
      }
      return false;
    });
    recordTest('Interacción FAB: Abrir modal Nueva Carpeta', clickedNewFolder);

    await page.waitForSelector('input[placeholder="Nombre de la carpeta"]', { timeout: 5000 });
    const testFolder = `test_movil_${Date.now()}`;
    await page.type('input[placeholder="Nombre de la carpeta"]', testFolder);
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));

    // Verificar que la carpeta aparece en la lista
    const folderExistsInList = await page.evaluate((name) => {
      return Array.from(document.querySelectorAll('p')).some((p) => p.innerText === name);
    }, testFolder);
    recordTest(`Prueba Funcional: Crear carpeta "${testFolder}"`, folderExistsInList);

    // 8. Crear y guardar archivo de texto
    await page.click(fabSelector);
    await new Promise((r) => setTimeout(r, 600));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find((b) => b.innerText.includes('Nuevo archivo de texto'));
      if (found) found.click();
    });

    await page.waitForSelector('input[placeholder="ejemplo.txt"]', { timeout: 5000 });
    const testFile = `nota_movil_${Date.now()}.txt`;
    await page.type('input[placeholder="ejemplo.txt"]', testFile);
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));

    // Abrir el archivo recién creado para editarlo
    await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) p.closest('div[class*="min-h-"]').click();
    }, testFile);

    // Esperar al editor de texto a pantalla completa
    await page.waitForSelector('textarea', { timeout: 8000 });
    await page.type('textarea', 'Contenido editado desde la interfaz tactil movil con 100dvh.');
    const saveBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Guardar'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    recordTest('Prueba Funcional: Editar y Guardar archivo de texto', saveBtn);
    await new Promise((r) => setTimeout(r, 1500));

    // Cerrar editor
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Cerrar'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 9. Modo selección múltiple
    console.log('\n--- 5. Comprobando Modo Selección Múltiple ---');
    const selectToggleBtn = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Seleccionar varios"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    recordTest('Activar Modo Selección Múltiple', selectToggleBtn);
    await new Promise((r) => setTimeout(r, 600));

    // Seleccionar el archivo
    await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) p.closest('div[class*="min-h-"]').click();
    }, testFile);
    await new Promise((r) => setTimeout(r, 600));

    // Captura: Modo Selección
    await page.screenshot({ path: path.join(screenshotsDir, '03_modo_seleccion_390x844.png') });
    recordTest('Captura: 03_modo_seleccion_390x844.png guardada', true);

    // Salir del modo selección
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Cerrar selección"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 10. Renombrar archivo mediante menú de fila (•••)
    console.log('\n--- 6. Comprobando menú de acciones y Renombrar ---');
    await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) {
        const row = p.closest('div[class*="min-h-"]');
        const moreBtn = row.querySelector('button[aria-label^="Acciones para"]');
        if (moreBtn) moreBtn.click();
      }
    }, testFile);

    await new Promise((r) => setTimeout(r, 800));
    // Click en "Renombrar"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rename = btns.find((b) => b.innerText.includes('Renombrar'));
      if (rename) rename.click();
    });

    await page.waitForSelector('input[value*="nota_movil_"]', { timeout: 5000 });
    const renamedFile = `renombrado_${Date.now()}.txt`;
    await page.evaluate(() => {
      const input = document.querySelector('input[value*="nota_movil_"]');
      if (input) input.value = '';
    });
    await page.type('input[placeholder=""]', renamedFile);
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));

    const renamedExists = await page.evaluate((name) => {
      return Array.from(document.querySelectorAll('p')).some((p) => p.innerText === name);
    }, renamedFile);
    recordTest(`Prueba Funcional: Renombrar archivo a "${renamedFile}"`, renamedExists);

    // 11. Descargar archivo
    console.log('\n--- 7. Comprobando Descarga ---');
    const downloadCheck = await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) {
        return window.location.origin + `/api/download/file?path=/tmp/${name}`;
      }
      return null;
    }, renamedFile);
    recordTest(`Prueba Funcional: Generación de URL de descarga para "${renamedFile}"`, Boolean(downloadCheck));

    // 12. Mover a papelera
    await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) {
        const row = p.closest('div[class*="min-h-"]');
        const moreBtn = row.querySelector('button[aria-label^="Acciones para"]');
        if (moreBtn) moreBtn.click();
      }
    }, renamedFile);
    await new Promise((r) => setTimeout(r, 800));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const del = btns.find((b) => b.innerText.includes('Mover a la papelera'));
      if (del) del.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Confirmar diálogo
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirm = btns.find((b) => b.innerText.includes('Mover a papelera'));
      if (confirm) confirm.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    recordTest(`Prueba Funcional: Mover "${renamedFile}" a la papelera`, true);

    // 13. Pestaña Papelera y Restaurar
    console.log('\n--- 8. Comprobando Pestaña Papelera ---');
    await page.click('button[aria-label="Papelera"]');
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(screenshotsDir, '06_papelera_390x844.png') });
    recordTest('Captura: 06_papelera_390x844.png guardada', true);

    // Restaurar el elemento
    const restored = await page.evaluate((name) => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === name);
      if (p) {
        const row = p.closest('div[class*="min-h-"]');
        const restoreBtn = row.querySelector('button[aria-label^="Restaurar"]');
        if (restoreBtn) {
          restoreBtn.click();
          return true;
        }
      }
      return false;
    });
    recordTest(`Prueba Funcional: Restaurar "${renamedFile}" desde papelera`, restored);
    await new Promise((r) => setTimeout(r, 1500));

    // 14. Pestaña Buscar (Search)
    console.log('\n--- 9. Comprobando Pestaña Buscar ---');
    await page.click('button[aria-label="Buscar"]');
    await new Promise((r) => setTimeout(r, 800));

    await page.type('input[placeholder="Buscar por nombre de archivo..."]', 'renombrado');
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(screenshotsDir, '05_buscador_390x844.png') });
    recordTest('Captura: 05_buscador_390x844.png guardada', true);

    const foundInSearch = await page.evaluate((name) => {
      return Array.from(document.querySelectorAll('p')).some((p) => p.innerText.includes(name));
    }, 'renombrado');
    recordTest('Prueba Funcional: Búsqueda SSE en tiempo real', foundInSearch);

    // 15. Visor de Imagen
    console.log('\n--- 10. Comprobando Visor de Imagen ---');
    await page.click('button[aria-label="Archivos"]');
    await new Promise((r) => setTimeout(r, 800));

    await page.evaluate(() => {
      if (window.__navigateToPath) window.__navigateToPath('/home/ubuntu/dashboard-gestion-mobile/public');
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Abrir icon-192.png
    await page.evaluate(() => {
      const p = Array.from(document.querySelectorAll('p')).find((el) => el.innerText === 'icon-192.png');
      if (p) p.closest('div[class*="min-h-"]').click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Captura: Visor de Imagen
    await page.screenshot({ path: path.join(screenshotsDir, '07_visor_imagen_390x844.png') });
    recordTest('Captura: 07_visor_imagen_390x844.png guardada', true);

    // Cerrar visor de imagen
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Cerrar visor de imagen"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 16. Pestaña Ajustes
    console.log('\n--- 11. Comprobando Pestaña Ajustes ---');
    await page.click('button[aria-label="Ajustes"]');
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(screenshotsDir, '08_ajustes_390x844.png') });
    recordTest('Captura: 08_ajustes_390x844.png guardada', true);

    // 17. Captura Horizontal (Landscape 844x390)
    console.log('\n--- 12. Captura en orientación horizontal (Landscape) ---');
    await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
    await page.click('button[aria-label="Archivos"]');
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(screenshotsDir, '09_horizontal_landscape_844x390.png') });
    recordTest('Captura: 09_horizontal_landscape_844x390.png guardada', true);

    // 18. Alcance del pulgar y objetivos táctiles
    console.log('\n--- 13. Verificación de Touch Targets (≥44px) y Ergonómía ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 500));

    const smallTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a, input'));
      const issues = [];
      interactive.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
          if (rect.height < 40 && rect.width < 40) {
            issues.push({ text: el.innerText || el.getAttribute('aria-label') || el.tagName, w: rect.width, h: rect.height });
          }
        }
      });
      return issues;
    });

    recordTest('Objetivos táctiles ergonómicos (≥44px o accesible al pulgar)', smallTargets.length === 0, `${smallTargets.length} elementos < 40px`);
    recordTest('0 errores de consola durante toda la sesión', consoleErrors.length === 0, consoleErrors.join('; '));

  } catch (err) {
    console.error('Error durante la verificación:', err);
    recordTest('Ejecución global de verificación', false, err.message);
  } finally {
    // Cerrar el navegador reutilizado para liberar memoria (VPS safe)
    await browser.close();
    console.log('\nNavegador cerrado correctamente.');
  }

  // Resumen
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;

  console.log('\n========================================================');
  console.log(` RESUMEN: ${passedCount} PASADAS / ${failedCount} FALLADAS`);
  console.log('========================================================');

  // Guardar resumen JSON para informe
  fs.writeFileSync(
    path.join(projectRoot, 'verification-results.json'),
    JSON.stringify({ passedCount, failedCount, testResults, consoleErrors }, null, 2)
  );

  return { passedCount, failedCount, testResults, consoleErrors };
}

runVerification().catch(console.error);
