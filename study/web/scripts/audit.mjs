import { chromium } from "playwright";

const base = process.env.AUDIT_URL || "http://127.0.0.1:8732";
const widths = [1280, 390];
const colored = new Set(["cpp", "java", "sql"]);

function overlaps(boxes) {
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
    const hint = page.getByRole("button", { name: /Show hint|Next hint/ });
    if ((await hint.count()) === 0) break;
    await hint.first().click();
  }
  for (let guard = 0; guard < 80; guard++) {
    const solutions = page.getByRole("button", { name: "Show solution" });
    if ((await solutions.count()) === 0) break;
    await solutions.first().click();
  }
}

async function checkPage(page, path, width, failures, seenSvg) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  const parts = Math.max(await page.locator("nav.parts button").count(), 1);
  for (let part = 0; part < parts; part++) {
    if (parts > 1) await page.locator("nav.parts button").nth(part).evaluate((button) => button.click());
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
        const panel = figure.querySelector(".figure-panel");
        // A diagram that scrolls inside its panel on a phone fills it edge to edge by design.
        if (panel && panel.scrollWidth > panel.clientWidth + 1) continue;
        const drawn = figure.querySelector("svg, img");
        if (!drawn) continue;
        const image = drawn.getBoundingClientRect();
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
    align(".gh-row-num", "home chapter numbers");
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
    const diagrams = [...document.querySelectorAll("figure.figure[data-figure]")].map((figure) => {
      const name = figure.getAttribute("data-figure");
      const svg = figure.querySelector("svg");
      const panel = figure.querySelector(".figure-panel");
      if (!svg) return { name, issues: ["has no inlined svg"], boxes: [] };
      const issues = [];
      if (!svg.getAttribute("aria-label")) issues.push("has no accessible name");
      const view = svg.viewBox.baseVal;
      const shown = svg.getBoundingClientRect();
      if (!view.width || !shown.width || !shown.height) issues.push("renders with no size");
      const scale = shown.width / view.width;
      if (panel.scrollWidth > panel.clientWidth + 1 && (panel.getAttribute("tabindex") !== "0" || panel.getAttribute("role") !== "region")) {
        issues.push("scrolls in a box that is not focusable");
      }
      // Fills that are black here mean a --fig-* variable did not resolve, or a color was hard-coded.
      for (const shape of svg.querySelectorAll("rect, circle, polygon, path, line, text")) {
        const style = getComputedStyle(shape);
        for (const paint of [style.fill, style.stroke]) {
          if (paint === "rgb(0, 0, 0)" && shape.getAttribute("fill") !== "none" && (shape.getAttribute("fill") || shape.getAttribute("stroke"))) {
            if (paint === style.fill ? shape.hasAttribute("fill") : shape.hasAttribute("stroke")) {
              issues.push(`<${shape.tagName}> paints an unresolved color`);
            }
          }
        }
        if (Number(style.opacity) === 0) issues.push(`<${shape.tagName}> starts hidden`);
      }
      const boxes = [];
      for (const node of svg.querySelectorAll("text")) {
        const text = node.textContent.replace(/[‎‏‪-‮⁦-⁩]/g, "").trim();
        if (!text) continue;
        const size = parseFloat(getComputedStyle(node).fontSize);
        // Phones scroll a figure rather than shrink it past 11px. Wider screens fit the column, but never down to unreadable.
        const floor = innerWidth <= 640 ? 10.95 : 8;
        if (size * scale < floor) issues.push(`text “${text}” renders at ${(size * scale).toFixed(1)}px`);
        const bounds = node.getBBox();
        const y = Number(node.getAttribute("y") || 0);
        if (bounds.x < view.x - 0.5 || bounds.x + bounds.width > view.x + view.width + 0.5) issues.push(`text “${text}” runs off the canvas`);
        const top = y - size * 0.82;
        boxes.push({ text, left: bounds.x, right: bounds.x + bounds.width, top, bottom: top + size * 1.15 });
      }
      return { name, issues, boxes };
    });
    const langs = [...document.querySelectorAll(".code-panel")].map((panel) => ({
      lang: panel.getAttribute("data-lang"),
      colors: panel.querySelectorAll("span[style*='color']").length,
    }));
    return { problems, images, diagrams, langs };
  });

  for (const problem of layout.problems) failures.push(`${where}: ${problem}`);
  for (const diagram of layout.diagrams) {
    for (const issue of diagram.issues) failures.push(`${where}: diagram ${diagram.name} ${issue}`);
    const key = `${diagram.name}`;
    if (!seenSvg.has(key)) {
      seenSvg.add(key);
      for (const hit of overlaps(diagram.boxes)) failures.push(`diagram ${diagram.name}: ${hit}`);
    }
  }
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
  }
  for (const panel of layout.langs) {
    if (colored.has(panel.lang) && panel.colors < 2) {
      failures.push(`${where}: ${panel.lang} code has no colored tokens`);
    }
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
// Every chapter is open, so the audit sees each one's reading rather than its lock.
await page.addInitScript(() => {
  if (!localStorage.getItem("study:systems-programming")) localStorage.setItem("study:systems-programming", JSON.stringify({ solved: [], read: ["run-time-environment", "memory-model", "pointers", "classes-and-objects", "rule-of-three", "rule-of-five", "inheritance", "concurrency", "design-by-contract", "synchronization", "waiting-and-liveness", "networking", "reactor", "serialization", "persistence", "course-review"] }));
});
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
  await page.locator(".search input:visible").fill("stack");
  const hits = page.locator(".search-results:visible a");
  await hits.first().waitFor({ timeout: 3000 }).catch(() => {});
  if ((await hits.count()) === 0) failures.push("search for stack returned nothing");
  const reducedContext = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  });
  const reduced = await reducedContext.newPage();
  await reduced.goto(base + "/", { waitUntil: "networkidle" });
  const link = reduced.locator(".gh-bed-row").first();
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
