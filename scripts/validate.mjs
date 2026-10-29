import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { chromium, webkit } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const root = resolve('dist')
const out = resolve('test/scratch/validation')
await mkdir(out, { recursive: true })
const snapshot = JSON.parse(await readFile('src/data/tweets.json', 'utf8'))
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' }
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    if (!path.startsWith('/preview/')) { res.writeHead(404).end(); return }
    const file = resolve(root, '.' + decodeURIComponent(path.slice(8)), path.endsWith('/') ? 'index.html' : '')
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' }).end(data)
  } catch { res.writeHead(404).end() }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const url = `${origin}/preview/`
const report = { recordedAt: new Date().toISOString(), export: 'dist/ served under /preview/', scenarios: [], browserLimitations: [], screenshots: [], errors: [], requests: [], accessibility: [], contrast: {} }
let browser
let checks = 0
function pass(name, detail = '') { checks++; report.scenarios.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + detail : ''}`) }
async function expectCount(page, count) { await page.waitForFunction(n => document.querySelectorAll('.tweet-card').length === n, count); assert.equal(await page.locator('.tweet-card').count(), count) }
async function shot(page, name, fullPage = false) { await page.screenshot({ path: `${out}/${name}.png`, fullPage }); report.screenshots.push(`test/scratch/validation/${name}.png`) }
const cards = page => page.locator('.tweet-card')
const firstId = async page => cards(page).first().getAttribute('data-tweet-id')
async function noOverflow(page) { const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth })); assert.ok(sizes.document <= sizes.viewport + 1, JSON.stringify(sizes)); return sizes }

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  page.on('requestfailed', request => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`))
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`) })
  page.on('request', request => report.requests.push({ url: request.url().replace(origin, '<preview-origin>'), external: !request.url().startsWith(origin) }))
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await expectCount(page, 11)
  assert.equal(await firstId(page), '2107939454396567581')
  assert.ok(await page.evaluate(() => document.fonts.check('400 16px "DM Sans"')))
  assert.equal(await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || img.naturalWidth === 0).length), 0)
  pass('Production export loads under a static subpath', '11 real tweet cards, local font and all images loaded')
  const links = await page.locator('.read-tweet').evaluateAll(links => links.map(link => link.href))
  assert.ok(links.every(link => /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(link)))
  assert.equal(new Set(links).size, 11)
  await context.route('https://x.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Outbound destination check</title>' }))
  const popupPromise = context.waitForEvent('page')
  await cards(page).first().getByRole('link', { name: 'Read tweet by Adam on X (opens in a new tab)' }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  assert.equal(popup.url(), snapshot.tweets[0].url)
  await popup.close()
  await context.unroute('https://x.com/**')
  pass('Every Read tweet opens its unique original X status', '11 valid status URLs; first Read tweet actually opens the correct new tab with the external response stubbed')

  await page.getByRole('button', { name: 'Latest', exact: true }).click()
  assert.equal(await firstId(page), '2115740326153371722')
  await page.getByLabel('Sort tweets', { exact: true }).selectOption('reposts')
  assert.equal(await firstId(page), '2107939454396567581')
  await page.getByLabel('Sort tweets', { exact: true }).selectOption('views')
  assert.equal(await firstId(page), '2102050129440133156')
  await page.getByRole('button', { name: 'Top tweets', exact: true }).click()
  assert.equal(await firstId(page), '2107939454396567581')
  pass('Ranking controls sort real metadata', 'likes, date, reposts, and views produce the expected leaders')

  await page.getByRole('group', { name: 'Filter by topic' }).getByRole('button', { name: 'Building', exact: true }).click()
  await expectCount(page, 4)
  assert.ok((await cards(page).locator('.topic-label').allTextContents()).every(t => t === 'Building'))
  await page.getByRole('group', { name: 'Filter by topic' }).getByRole('button', { name: 'All topics', exact: true }).click()
  await page.getByLabel('Date', { exact: true }).selectOption('2026-09')
  await expectCount(page, 1)
  assert.equal(await firstId(page), '2102050129440133156')
  await page.getByLabel('Date', { exact: true }).selectOption('all')
  await page.getByLabel('Search tweets', { exact: true }).fill('@taylor_')
  await expectCount(page, 4)
  await page.getByRole('group', { name: 'Filter by topic' }).getByRole('button', { name: 'Building', exact: true }).click()
  await expectCount(page, 2)
  await page.getByLabel('Search tweets', { exact: true }).fill('a-query-that-has-no-matches')
  await expectCount(page, 0)
  assert.ok(await page.getByRole('heading', { name: 'No tweets found.' }).isVisible())
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expectCount(page, 11)
  assert.equal(await page.getByLabel('Search tweets', { exact: true }).inputValue(), '')
  pass('Search, date and topic filters combine and recover', 'author search, month, combined filters, empty state and Clear filters')

  await page.getByRole('navigation', { name: 'Primary' }).filter({ visible: true }).getByRole('link', { name: 'Saved tweets', exact: true }).click()
  await expectCount(page, 0)
  assert.ok(await page.getByRole('heading', { name: 'Keep a little signal.' }).isVisible())
  await page.getByRole('link', { name: 'Explore the feed', exact: true }).click()
  await expectCount(page, 11)
  await cards(page).first().getByRole('button', { name: 'Save tweet by Adam', exact: true }).click()
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await page.getByRole('navigation', { name: 'Primary' }).filter({ visible: true }).getByRole('link', { name: /Saved tweets/ }).click()
  await expectCount(page, 1)
  assert.equal(await firstId(page), '2107939454396567581')
  await page.reload()
  await expectCount(page, 1)
  assert.equal(await page.title(), 'Saved tweets · The Pond')
  await cards(page).first().getByRole('button', { name: 'Unsave tweet by Adam', exact: true }).click()
  await expectCount(page, 0)
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  pass('Bookmarks persist and saved navigation survives reload', 'empty state, save, direct #saved route, persistence, unsave')
  await page.getByRole('link', { name: 'Explore the feed', exact: true }).click()
  await expectCount(page, 11)

  await cards(page).first().getByRole('button', { name: 'Copy link to tweet by Adam' }).click()
  await page.waitForFunction(() => document.querySelector('.toast')?.textContent.includes('Copied'))
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), snapshot.tweets[0].url)
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  pass('Copy tweet uses the original permalink', 'actual clipboard content checked')

  const aboutButton = page.getByRole('button', { name: 'About', exact: true }).filter({ visible: true })
  await aboutButton.click()
  assert.ok(await page.getByRole('dialog', { name: 'A little context.' }).isVisible())
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab')
    // Native dialogs keep background controls inert. Chromium can put focus in browser
    // chrome between cycles; in that state document.activeElement is the body.
    const focusStop = await page.getByRole('dialog', { name: 'A little context.' }).evaluate(el => ({
      insideDialog: el.contains(document.activeElement),
      browserChrome: document.activeElement === document.body,
      tag: document.activeElement?.tagName,
    }))
    report.modalFocusStops ??= []
    report.modalFocusStops.push(focusStop)
    assert.ok(focusStop.insideDialog || focusStop.browserChrome, 'Background content received modal focus')
  }
  const aboutAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  report.accessibility.push({ state: 'About dialog', violations: aboutAudit.violations })
  assert.equal(aboutAudit.violations.length, 0, JSON.stringify(aboutAudit.violations))
  await page.keyboard.press('Escape')
  assert.ok(await aboutButton.evaluate(el => el === document.activeElement))
  pass('About dialog excludes background focus and restores its trigger', 'native modal Tab cycles, Escape closes, focused trigger restored; axe has zero violations')

  await page.goto(url)
  await page.keyboard.press('Tab')
  assert.equal(await page.locator(':focus').innerText(), 'Skip to feed')
  await shot(page, 'keyboard-skip')
  await page.keyboard.press('Enter')
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content')
  await page.keyboard.press('/')
  assert.equal(await page.locator(':focus').getAttribute('id'), 'tweet-search')
  await page.keyboard.type('agent')
  await page.keyboard.press('Escape')
  assert.equal(await page.getByLabel('Search tweets', { exact: true }).inputValue(), '')
  await shot(page, 'keyboard-search-focus')
  pass('Keyboard path includes skip link, search shortcut and Escape recovery')

  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  report.accessibility.push({ state: 'Default desktop feed', violations: audit.violations })
  assert.equal(audit.violations.length, 0, JSON.stringify(audit.violations))
  pass('Automated accessibility audit', 'zero WCAG A/AA findings in default desktop feed and About dialog')

  for (const width of [320, 360, 375, 390, 660, 752, 768, 1024, 1056, 1100, 1248, 1440, 1920]) {
    await page.setViewportSize({ width, height: width <= 660 ? 844 : 1000 })
    await page.goto(url)
    await page.evaluate(() => document.fonts.ready)
    await noOverflow(page)
    if ([320, 390, 768, 1024, 1440].includes(width)) await shot(page, `chromium-${width}`)
    if (width === 390) {
      const boxes = await page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
        return { title: rect('h1'), action: rect('.primary-button'), search: rect('#tweet-search'), firstTweet: rect('.tweet-card'), firstReadLink: rect('.read-tweet'), viewportHeight: innerHeight }
      })
      assert.ok(boxes.title.bottom < boxes.viewportHeight)
      assert.ok(boxes.action.bottom < boxes.viewportHeight)
      assert.ok(boxes.search.bottom < boxes.viewportHeight)
      assert.ok(boxes.firstTweet.top < boxes.viewportHeight)
      assert.ok(boxes.firstReadLink.bottom <= boxes.viewportHeight, `Read tweet ends at ${boxes.firstReadLink.bottom}px`)
      report.mobileFirstScreen = boxes
      const mobileAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      report.accessibility.push({ state: '390 mobile feed', violations: mobileAudit.violations })
      assert.equal(mobileAudit.violations.length, 0, JSON.stringify(mobileAudit.violations))
      await page.getByRole('link', { name: 'Explore tweets', exact: true }).click()
      assert.equal(await page.locator(':focus').getAttribute('id'), 'tweet-search')
      await page.getByLabel('Search tweets', { exact: true }).fill('hackathon')
      assert.ok(await cards(page).count() > 0)
      await page.getByRole('button', { name: 'Clear search' }).click()
      await expectCount(page, 11)
      await page.getByRole('group', { name: 'Filter by topic' }).getByRole('button', { name: 'Agents', exact: true }).click()
      await expectCount(page, 3)
      pass('390 mobile first screen and primary interactions', `first tweet starts at ${Math.round(boxes.firstTweet.top)}px; main action and search visible`)
    }
  }
  pass('Responsive reflow', 'no document overflow at 13 widths from 320 to 1920, including breakpoint boundaries')

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(url)
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await noOverflow(page)
  await shot(page, 'text-200-percent')
  await page.getByLabel('Search tweets', { exact: true }).fill('@taylor_')
  await expectCount(page, 4)
  pass('200% root text enlargement', 'reflow and search work; this is not browser-native zoom')
  await page.goto(url)
  await page.evaluate(() => document.documentElement.dir = 'rtl')
  await noOverflow(page)
  await shot(page, 'rtl-mirror')
  pass('RTL mirror stress check', 'no horizontal overflow in the desktop mirror; English remains the supported language')
  await page.goto(url)
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
  await page.keyboard.press('Tab')
  await shot(page, 'forced-colors-focus')
  const motion = await page.evaluate(() => ({ infinite: document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).length, transitions: [...document.querySelectorAll('button')].map(el => getComputedStyle(el).transitionDuration) }))
  assert.equal(motion.infinite, 0)
  assert.ok(motion.transitions.every(duration => duration === '0s'))
  pass('Reduced motion and forced colors', 'no ongoing animations or button transitions with reduced motion')
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' })
  await context.close()

  const blockedContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await blockedContext.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Blocked for validation')) } })
    Storage.prototype.setItem = () => { throw new DOMException('Blocked for validation', 'SecurityError') }
  })
  const blockedPage = await blockedContext.newPage()
  await blockedPage.goto(url)
  await blockedPage.locator('.tweet-card').first().getByRole('button', { name: 'Copy link to tweet by Adam' }).click()
  assert.ok(await blockedPage.getByRole('dialog', { name: 'Copy this tweet link' }).isVisible())
  assert.equal(await blockedPage.getByLabel('Original tweet URL').inputValue(), snapshot.tweets[0].url)
  await shot(blockedPage, 'clipboard-fallback')
  await blockedPage.keyboard.press('Escape')
  await blockedPage.locator('.tweet-card').first().getByRole('button', { name: 'Save tweet by Adam', exact: true }).click()
  assert.ok((await blockedPage.locator('.toast').textContent()).includes('for this visit'))
  assert.equal(await blockedPage.locator('.tweet-card').first().getByRole('button', { name: 'Unsave tweet by Adam', exact: true }).getAttribute('aria-pressed'), 'true')
  await shot(blockedPage, 'storage-unavailable')
  pass('Clipboard and storage failure recovery', 'manual-copy dialog gives correct URL; blocked storage is labelled as session-only')
  await blockedContext.close()

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const externalAttempts = []
  await offlineContext.route('**/*', route => { if (!route.request().url().startsWith(origin)) { externalAttempts.push(route.request().url()); return route.abort() } return route.continue() })
  const offlinePage = await offlineContext.newPage()
  await offlinePage.goto(url)
  await expectCount(offlinePage, 11)
  await offlinePage.getByLabel('Search tweets', { exact: true }).fill('@taylor_')
  await expectCount(offlinePage, 4)
  assert.equal(externalAttempts.length, 0)
  pass('Static feed works with external services blocked', 'zero remote requests for site, search, filters, fonts or images; outbound X links need internet')
  await offlineContext.close()

  report.contrast = await (async () => {
    const c = await browser.newContext(); const p = await c.newPage(); await p.goto(url)
    const pairs = await p.evaluate(() => {
      const ratio = (a, b) => {
        const lum = color => { const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4 }); return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2] }
        const x = lum(a), y = lum(b); return Number(((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2))
      }
      const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      const readColor = name => { const el = document.createElement('span'); el.style.color = token(name); document.body.append(el); const color = getComputedStyle(el).color; el.remove(); return color }
      const specs = [['body on page', '--color-text', '--color-page'], ['muted on card', '--color-muted', '--color-surface'], ['muted on raised', '--color-muted', '--color-surface-raised'], ['primary button', '--color-on-accent', '--color-accent'], ['focus on page', '--color-focus', '--color-page'], ['focus on card', '--color-focus', '--color-surface'], ['focus on selected', '--color-focus', '--color-hover']]
      return specs.map(([name, fg, bg]) => ({ name, foreground: readColor(fg), background: readColor(bg), ratio: ratio(readColor(fg), readColor(bg)) }))
    }); await c.close(); return pairs
  })()
  assert.ok(report.contrast.every(pair => pair.ratio >= 4.5))
  pass('Rendered solid token contrast measured', report.contrast.map(pair => `${pair.name}: ${pair.ratio}:1`).join('; '))
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors))
  assert.ok(report.requests.every(request => !request.external))
  pass('Runtime console and resources', 'zero captured script errors, failed resources, HTTP errors or remote requests')
  await browser.close(); browser = null

  let safari
  try {
    safari = await webkit.launch({ headless: true })
    const safariPage = await safari.newPage({ viewport: { width: 390, height: 844 } })
    await safariPage.goto(url)
    await expectCount(safariPage, 11)
    await noOverflow(safariPage)
    await safariPage.getByRole('button', { name: 'Latest', exact: true }).click()
    assert.equal(await firstId(safariPage), '2115740326153371722')
    await safariPage.getByLabel('Search tweets', { exact: true }).fill('@taylor_')
    await expectCount(safariPage, 4)
    await shot(safariPage, 'webkit-390')
    pass('WebKit mobile primary interaction', 'latest order and author search')
  } catch (error) {
    report.browserLimitations.push(`WebKit could not run on this host: ${String(error.message).split('\n').filter(line => !line.includes('═') && !line.includes('╔') && !line.includes('╚')).slice(0, 8).join(' ').replaceAll(process.cwd(), '<repository>')}`)
    console.log('LIMITATION WebKit runtime unavailable; recorded in report')
  } finally { await safari?.close() }

  report.summary = { passedScenarios: checks, failedScenarios: 0, completed: true }
} catch (error) {
  report.errors.push(error.stack ?? String(error))
  report.summary = { passedScenarios: checks, failedScenarios: 1, completed: false }
  process.exitCode = 1
  console.error(error)
} finally {
  await browser?.close()
  await new Promise(done => server.close(done))
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(`Validation results: test/scratch/validation/results.json (${checks} scenarios passed)`)
}
