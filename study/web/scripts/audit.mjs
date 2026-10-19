import { chromium } from "playwright";

const base = process.env.AUDIT_URL || "http://127.0.0.1:8732";
const widths = [1280, 390];
const colored = new Set(["cpp", "java", "sql"]);

function textBoxes(svg) {
  const boxes = [];
  const pattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = pattern.exec(svg))) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim();
    if (!text) continue;
    const attr = (name, fallback) => {
      const found = attrs.match(new RegExp(`${name}="([^"]*)"`));
      return found ? found[1] : fallback;
    };
    const size = Number(attr("font-size", "16"));
    const x = Number(attr("x", "0"));
    const y = Number(attr("y", "0"));
    const anchor = attr("text-anchor", "start");
    const width = text.length * size * 0.62;
    const height = size * 1.15;
    const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
    const top = y - size * 0.82;
    boxes.push({ text, left, top, right: left + width, bottom: top + height });
  }
  return boxes;
}

function overlaps(svg) {
  const boxes = textBoxes(svg);
  const hits = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const apart = a.right + 2 < b.left || b.right + 2 < a.left || a.bottom + 2 < b.top || b.bottom + 2 < a.top;
      if (!apart) hits.push(`${a.text} overlaps ${b.text}`);
    }
  }
  return hits;
}

async function routesOf(page) {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const hrefs = await page.locator("a[href]").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")).filter(Boolean),
  );
  const paths = new Set(["/", "/glossary"]);
  for (const href of hrefs) {
    if (href.startsWith("/topics/")) paths.add(href.split("#")[0]);
  }
  return [...paths];
}

async function openHidden(page) {
  for (let guard = 0; guard < 40; guard++) {
    const closed = page.locator('.fold-toggle[aria-expanded="false"]');
    if ((await closed.count()) === 0) break;
    await closed.first().click();
  }
  for (let guard = 0; guard < 80; guard++) {
    const folded = page.locator("button.fold-row");
    if ((await folded.count()) === 0) break;
    await folded.first().click();
  }
  for (let guard = 0; guard < 200; guard++) {
    const hint = page.getByRole("button", { name: /הצג רמז|הרמז הבא/ });
    if ((await hint.count()) === 0) break;
    await hint.first().click();
  }
  for (let guard = 0; guard < 80; guard++) {
    const solutions = page.getByRole("button", { name: "הצג פתרון" });
    if ((await solutions.count()) === 0) break;
    await solutions.first().click();
  }
}

async function checkPage(page, path, width, failures, seenSvg) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  const parts = Math.max(await page.locator("nav.parts button").count(), 1);
  for (let part = 0; part < parts; part++) {
    if (parts > 1) await page.locator("nav.parts button").nth(part).click();
    await openHidden(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await checkView(page, `${width}px ${path} §${part + 1}`, failures, seenSvg);
  }
}

async function checkView(page, where, failures, seenSvg) {
    const layout = await page.evaluate(() => {
    const problems = [];
    const sameRow = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4;
    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      problems.push(`page scrolls sideways (${doc.scrollWidth} > ${doc.clientWidth})`);
    }
    const article = document.querySelector("article.page");
    if (article) {
      const column = article.getBoundingClientRect();
      for (const figure of document.querySelectorAll("figure.figure")) {
        const box = figure.getBoundingClientRect();
        const left = box.left - column.left;
        const right = column.right - box.right;
        if (Math.abs(left - right) > 3) problems.push(`figure is off center by ${Math.abs(left - right).toFixed(1)}px`);
        const img = figure.querySelector("img");
        if (!img) continue;
        const image = img.getBoundingClientRect();
        const imageLeft = image.left - box.left;
        const imageRight = box.right - image.right;
        if (Math.abs(imageLeft - imageRight) > 8) {
          problems.push(`diagram is off center in its panel by ${Math.abs(imageLeft - imageRight).toFixed(1)}px`);
        }
      }
    }
    const align = (selector, label) => {
      const lefts = [...document.querySelectorAll(selector)].map((node) => node.getBoundingClientRect().left);
      if (lefts.length < 2) return;
      const drift = Math.max(...lefts) - Math.min(...lefts);
      if (drift > 1.5) problems.push(`${label} drift by ${drift.toFixed(1)}px`);
    };
    align(".chapters-nav .dot", "chapter numbers");
    align(".chapter-list .num", "home chapter numbers");
    for (const row of document.querySelectorAll(".actions, .card-head")) {
      const buttons = [...row.querySelectorAll("button")].map((button) => ({
        box: button.getBoundingClientRect(),
        label: button.textContent.trim(),
      }));
      const card = row.closest(".card, .check");
      if (card) {
        const bounds = card.getBoundingClientRect();
        for (const button of buttons) {
          if (button.box.left < bounds.left - 1 || button.box.right > bounds.right + 1) {
            problems.push(`button “${button.label}” sticks out of its card`);
          }
        }
      }
      for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
          const a = buttons[i];
          const b = buttons[j];
          if (sameRow(a.box, b.box)) {
            if (Math.abs(a.box.top - b.box.top) > 2 || Math.abs(a.box.height - b.box.height) > 2) {
              problems.push(`“${a.label}” and “${b.label}” are not aligned`);
            }
          } else if (Math.abs(a.box.left - b.box.left) > 2) {
            problems.push(`“${a.label}” and “${b.label}” do not share an edge`);
          }
        }
      }
    }
    const images = [...document.querySelectorAll("figure img")].map((img) => ({
      src: img.getAttribute("src"),
      complete: img.complete,
      width: img.naturalWidth,
    }));
    const langs = [...document.querySelectorAll(".code-panel")].map((panel) => ({
      lang: panel.getAttribute("data-lang"),
      colors: panel.querySelectorAll("span[style*='color']").length,
    }));
    return { problems, images, langs };
  });

  for (const problem of layout.problems) failures.push(`${where}: ${problem}`);
  for (const image of layout.images) {
    if (!image.complete || image.width === 0) {
      failures.push(`${where}: broken image ${image.src}`);
      continue;
    }
    const flat = await page.evaluate(async (src) => {
      const img = [...document.querySelectorAll("figure img")].find((node) => node.getAttribute("src") === src);
      if (!img) return "missing";
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(img, 0, 0, 48, 48);
      const data = context.getImageData(0, 0, 48, 48).data;
      const counts = new Map();
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 16) continue;
        const key = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`;
        counts.set(key, (counts.get(key) || 0) + 1);
        total += 1;
      }
      if (total < 20) return "empty";
      return "";
    }, image.src);
    if (flat) failures.push(`${where}: image ${image.src} looks ${flat}`);
    if (image.src?.endsWith(".svg") && !seenSvg.has(image.src)) {
      seenSvg.add(image.src);
      const svg = await (await fetch(new URL(image.src, base))).text();
      for (const hit of overlaps(svg)) failures.push(`diagram ${image.src}: ${hit}`);
    }
  }
  for (const panel of layout.langs) {
    if (colored.has(panel.lang) && panel.colors < 2) {
      failures.push(`${where}: ${panel.lang} code has no colored tokens`);
    }
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console: ${message.text()}`);
});
try {
  const paths = await routesOf(page);
  console.log(`Crawling ${paths.length} pages at ${widths.join(" and ")}px`);
  const seenSvg = new Set();
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const path of paths) {
      await checkPage(page, path, width, failures, seenSvg);
      process.stdout.write(".");
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator("#q").fill("מחסנית");
  const hits = page.locator(".search-results a");
  await hits.first().waitFor({ timeout: 3000 }).catch(() => {});
  if ((await hits.count()) === 0) failures.push("search for מחסנית returned nothing");
  const reducedContext = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  });
  const reduced = await reducedContext.newPage();
  await reduced.goto(base + "/", { waitUntil: "networkidle" });
  const link = reduced.locator(".chapter-list a").first();
  await link.hover();
  const transform = await link.evaluate((node) => getComputedStyle(node).transform);
  if (transform !== "none") failures.push(`reduced motion still translates chapter links (${transform})`);
  await reduced.close();
  console.log("");
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.map((line) => `- ${line}`).join("\n"));
  process.exit(1);
}
console.log("Audit passed.");
