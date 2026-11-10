// flood-preparedness-bd -- headless-Chrome smoke test via raw CDP (no puppeteer).
// Usage: node tests/smoke.js
// Exits non-zero on any failed assertion; fails on page console errors.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9356;
const BASE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const CHROME_BIN = process.env.CHROME_BIN ||
    require('os').homedir() + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/fpbd-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push('exception: ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push('console.error: ' + JSON.stringify(msg.params.args).slice(0, 300));
    }
  };
  function send(method, params) {
    return new Promise((res) => {
      const id = ++seq;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const nav = async (url) => { await send('Page.navigate', { url }); await wait(1400); };
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };
  const clickTab = async (name) => ev(`document.querySelector('[data-tab="${name}"]').click()`);
  const BN_TITLE = '\u09ac\u09a8\u09cd\u09af\u09be \u09aa\u09cd\u09b0\u09b8\u09cd\u09a4\u09c1\u09a4\u09bf \u09ac\u09bf\u09a1\u09bf';

  // ---- Load: defaults ----
  await nav(BASE);
  check('page title mentions Flood Preparedness', (await ev('document.title'))?.includes('Flood Preparedness'));
  check('subtitle present', (await ev(`document.querySelector('.subtitle').textContent`)).length > 40);
  check('people defaults to 4', (await ev(`document.getElementById('peopleInput').value`)) === '4');
  check('days default to 3', (await ev(`document.getElementById('daysInput').value`)) === '3');
  check('results hidden before calculate', (await ev(`document.getElementById('calcResults').hidden`)) === true);
  check('6 tabs present', (await ev(`document.querySelectorAll('.tab-btn').length`)) === 6);

  // ---- Calculate: 4 people x 3 days ----
  await ev(`document.getElementById('calcBtn').click()`);
  check('results shown after calculate', (await ev(`document.getElementById('calcResults').hidden`)) === false);
  check('drinking water is 36 L', (await ev(`document.getElementById('waterDrinking').textContent`)) === '36 L');
  check('hygiene water is 12 L', (await ev(`document.getElementById('waterHygiene').textContent`)) === '12 L');
  check('total water is 48 L', (await ev(`document.getElementById('waterTotal').textContent`)) === '48 L');
  check('6 food rows', (await ev(`document.querySelectorAll('#foodBody tr').length`)) === 6);
  check('rice row is 6 kg', (await ev(`document.querySelector('#foodBody tr').textContent`)).includes('6 kg'));
  check('ORS row is 12 packets', (await ev(`document.querySelectorAll('#foodBody tr')[5].textContent`)).includes('12 packets'));

  // ---- Validation: people 0 rejected ----
  await ev(`document.getElementById('peopleInput').value='0'; document.getElementById('calcBtn').click()`);
  check('people 0 shows inline error', (await ev(`document.querySelectorAll('#calcErrors .error').length`)) === 1);
  check('people 0 hides results', (await ev(`document.getElementById('calcResults').hidden`)) === true);
  await ev(`document.getElementById('peopleInput').value='1'; document.getElementById('daysInput').value='1'; document.getElementById('calcBtn').click()`);
  check('1 person x 1 day = 3 L drinking', (await ev(`document.getElementById('waterDrinking').textContent`)) === '3 L');
  check('1x1 rice is 0.5 kg', (await ev(`document.querySelector('#foodBody tr').textContent`)).includes('0.5 kg'));
  await ev(`document.getElementById('peopleInput').value='4'; document.getElementById('daysInput').value='3'; document.getElementById('calcBtn').click()`);

  // ---- Save plan + persistence ----
  await ev(`document.getElementById('savePlanBtn').click()`);
  check('save success message shows', (await ev(`document.getElementById('planMsg').textContent`)).length > 0);
  check('saved plans list has 1 item', (await ev(`document.querySelectorAll('#plansList .plan-row').length`)) === 1);
  await nav(BASE);
  check('saved plan persists after reload', (await ev(`document.querySelectorAll('#plansList .plan-row').length`)) === 1);
  await ev(`document.querySelector('#plansList .plan-row .btn').click()`);
  check('load plan restores 4 people', (await ev(`document.getElementById('peopleInput').value`)) === '4');

  // ---- Go-bag: 24 items, check 12 -> 50% ----
  await clickTab('bag');
  check('go-bag has 24 checkboxes', (await ev(`document.querySelectorAll('#bagWrap input[type="checkbox"]').length`)) === 24);
  await ev(`[...document.querySelectorAll('#bagWrap input[type="checkbox"]')].slice(0,12).forEach(cb => cb.click())`);
  check('12/24 packed = 50%', (await ev(`document.getElementById('bagPct').textContent`)).includes('12/24') && (await ev(`document.getElementById('bagPct').textContent`)).includes('50%'));
  check('bag progress bar at 50%', (await ev(`document.getElementById('bagBar').style.width`)) === '50%');
  await nav(BASE);
  await clickTab('bag');
  check('go-bag progress persists after reload', (await ev(`document.getElementById('bagPct').textContent`)).includes('12/24'));

  // ---- Quiz: answer all yes -> 100/100 Ready ----
  await clickTab('quiz');
  check('quiz has 10 questions', (await ev(`document.querySelectorAll('#quizWrap .quiz-row').length`)) === 10);
  await ev(`for (let i=0;i<10;i++){ document.querySelectorAll('#quizWrap .quiz-row')[i].querySelector('.quiz-btns .btn').click(); }`);
  await ev(`document.getElementById('quizBtn').click()`);
  check('quiz score is 100 / 100', (await ev(`document.getElementById('quizScore').textContent`)) === '100 / 100');
  check('quiz level is Ready', (await ev(`document.getElementById('quizLevel').textContent`)).includes('Ready'));
  check('best score is 100', (await ev(`document.getElementById('quizBest').textContent`)) === '100');
  check('no fix list when all yes', (await ev(`document.getElementById('quizFixWrap').hidden`)) === true);
  await nav(BASE);
  await clickTab('quiz');
  check('best score persists after reload', (await ev(`document.getElementById('quizBest').textContent`)) === '100');

  // ---- Quiz: one no -> 90 + recommendation shown ----
  await ev(`document.querySelectorAll('#quizWrap .quiz-row')[0].querySelectorAll('.quiz-btns .btn')[1].click()`);
  await ev(`document.getElementById('quizBtn').click()`);
  check('9 yes = 90 / 100', (await ev(`document.getElementById('quizScore').textContent`)) === '90 / 100');
  check('fix list shows shelter recommendation', (await ev(`document.getElementById('quizFixWrap').hidden`)) === false && (await ev(`document.getElementById('quizRecs').textContent`)).includes('shelter'));

  // ---- Guides: complete Before phase -> 7/21 = 33% ----
  await clickTab('guides');
  check('guides have 21 checkboxes', (await ev(`document.querySelectorAll('#guidesWrap input[type="checkbox"]').length`)) === 21);
  await ev(`[...document.querySelectorAll('#guidesWrap .guide-phase')[0].querySelectorAll('input[type="checkbox"]')].forEach(cb => cb.click())`);
  check('guides overall 7/21 · 33%', (await ev(`document.getElementById('guidesPct').textContent`)).includes('7/21') && (await ev(`document.getElementById('guidesPct').textContent`)).includes('33%'));

  // ---- Contacts & warning levels ----
  await clickTab('contacts');
  check('4 contact cards', (await ev(`document.querySelectorAll('#contactsWrap .contact-card').length`)) === 4);
  check('1090 card links tel:1090', (await ev(`document.querySelector('#contactsWrap .contact-card').href`)).includes('tel:1090'));
  check('999 card present', (await ev(`document.getElementById('contactsWrap').textContent`)).includes('999'));
  check('16263 caution shown', (await ev(`document.getElementById('contactsWrap').textContent`)).includes('Caution'));
  check('4 warning level rows', (await ev(`document.querySelectorAll('#levelsBody tr').length`)) === 4);
  check('severe level is >1 m above danger level', (await ev(`document.querySelectorAll('#levelsBody tr')[3].textContent`)).includes('1 m above danger level'));
  check('FFWC link present', (await ev(`document.querySelector('a[href*="ffwc.gov.bd"]').href`)).includes('ffwc.gov.bd'));

  // ---- Districts: 19 chips, search filters ----
  await clickTab('districts');
  check('19 district chips', (await ev(`document.querySelectorAll('#distWrap .chip').length`)) === 19);
  await ev(`document.getElementById('distSearch').value='pur'; document.getElementById('distSearch').dispatchEvent(new Event('input',{bubbles:true}))`);
  check('search pur shows 3 districts', (await ev(`document.querySelectorAll('#distWrap .chip').length`)) === 3);
  check('search pur includes Sherpur', (await ev(`document.getElementById('distWrap').textContent`)).includes('Sherpur'));
  await ev(`document.getElementById('distSearch').value='xyz'; document.getElementById('distSearch').dispatchEvent(new Event('input',{bubbles:true}))`);
  check('search xyz shows 0 districts', (await ev(`document.querySelectorAll('#distWrap .chip').length`)) === 0);

  // ---- Export / erase / import round-trip via test hooks ----
  const payload = await ev(`window.__fpbd.exportPayload()`);
  check('export payload is flood-preparedness-bd v1', payload.includes('"app":"flood-preparedness-bd"') && payload.includes('"version":1'), payload.slice(0, 120));
  check('export carries saved plan + bag progress', payload.includes('"plans":') && payload.includes('nid-copies'));
  await ev(`window.__fpbd.eraseAll()`);
  check('eraseAll empties plans and bag', (await ev(`window.__fpbd.exportPayload()`)).includes('"plans":[]') && (await ev(`window.__fpbd.exportPayload()`)).includes('"bag":[]'));
  const imp = await ev(`JSON.stringify(window.__fpbd.importPayload(${JSON.stringify(payload)}))`);
  check('import valid payload ok', imp.includes('"ok":true'), imp);
  check('import restores saved plan', (await ev(`window.__fpbd.exportPayload()`)).includes('"plans":[{'));
  const badImp = await ev(`JSON.stringify(window.__fpbd.importPayload('{"app":"land-tax-bd","version":1,"data":{}}'))`);
  check('import wrong app rejected', badImp.includes('"ok":false'));
  check('invalid import leaves data intact', (await ev(`window.__fpbd.exportPayload()`)).includes('"plans":[{'));
  const badJson = await ev(`JSON.stringify(window.__fpbd.importPayload('{not json'))`);
  check('import malformed JSON rejected', badJson.includes('"ok":false'));

  // ---- Typed-DELETE erase via UI prompt override; wrong word rejected ----
  await ev(`window.prompt = () => 'delete'; document.getElementById('eraseBtn').click();`);
  check('wrong erase word rejected', (await ev(`document.getElementById('dataMsg').textContent`)).includes('Wrong word'));
  check('wrong erase keeps data', (await ev(`window.__fpbd.exportPayload()`)).includes('"plans":[{'));
  await ev(`window.prompt = () => 'DELETE'; document.getElementById('eraseBtn').click();`);
  check('DELETE erases data', (await ev(`window.__fpbd.exportPayload()`)).includes('"plans":[]'));
  check('erase success message shows', (await ev(`document.getElementById('dataMsg').textContent`)).includes('erased'));

  // ---- BN toggle ----
  await clickTab('calc');
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('langBtn').click()`);
  check('BN toggle: title in Bengali', (await ev(`document.querySelector('h1').textContent`)) === BN_TITLE);
  check('BN toggle: total water in Bengali digits', (await ev(`document.getElementById('waterTotal').textContent`)) === '৪৮ L');
  await nav(BASE);
  check('BN toggle persists after reload', (await ev(`window.__fpbd.state.lang`)) === 'bn');
  await ev(`document.getElementById('langBtn').click()`);
  check('back to EN', (await ev(`window.__fpbd.state.lang`)) === 'en');

  // ---- Mobile 390px: no horizontal overflow on any tab ----
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await nav(BASE);
  await ev(`document.getElementById('calcBtn').click()`);
  for (const tab of ['calc', 'bag', 'quiz', 'guides', 'contacts', 'districts']) {
    await clickTab(tab);
    await wait(300);
    const overflow = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    check('390px no overflow on ' + tab + ' tab', overflow <= 0, 'overflow=' + overflow);
  }

  // ---- Zero network requests: app is fully offline (only file:// loads) ----
  const reqs = await ev(`performance.getEntriesByType('resource').map(r => r.name).filter(n => !n.startsWith('file://')).length`);
  check('zero non-file network requests', reqs === 0, 'non-file=' + reqs);

  check('no console/page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  chrome.kill();
  console.log('\n' + count + ' checks, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); try { chrome.kill(); } catch (_) {} process.exit(2); });
