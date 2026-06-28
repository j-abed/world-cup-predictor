import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, ".visual-check");

const SELECTORS = [
  ".predictor-command-center",
  ".cockpit-shell",
  ".cockpit-main",
  ".cockpit-workspace",
  ".cockpit-center",
  ".cockpit-rail-right",
  ".pitch-background",
  ".pitch-background__grid",
  ".command-footer",
  ".title-odds-board",
  ".champion-odds-board",
  ".command-sidebar",
];

const STYLE_PROPS = [
  "width",
  "maxWidth",
  "display",
  "gridTemplateColumns",
  "flex",
  "flexDirection",
  "position",
];

function rectSummary(rect) {
  if (!rect) return null;
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    right: Math.round(rect.x + rect.width),
    bottom: Math.round(rect.y + rect.height),
  };
}

async function measure(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const results = await page.evaluate(
    ({ selectors, styleProps }) => {
      const out = { viewport: { width: window.innerWidth, height: window.innerHeight }, elements: {} };
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) {
          out.elements[sel] = { found: false };
          continue;
        }
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const styles = {};
        for (const prop of styleProps) {
          styles[prop] = cs[prop];
        }
        out.elements[sel] = {
          found: true,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.x + rect.width,
            bottom: rect.y + rect.height,
          },
          styles,
          classes: el.className,
        };
      }
      const workspace = document.querySelector(".cockpit-workspace");
      out.hasWithRailClass = workspace?.classList.contains("cockpit-workspace--with-rail") ?? false;
      out.hasCommandCenterRailClass = document
        .querySelector(".predictor-command-center")
        ?.classList.contains("predictor-command-center--with-rail") ?? false;
      return out;
    },
    { selectors: SELECTORS, styleProps: STYLE_PROPS },
  );

  return results;
}

async function main() {
  const viewportArg = process.argv.find((a) => a.startsWith("--viewport="));
  const viewport = viewportArg
    ? (() => {
        const [w, h] = viewportArg.split("=")[1].split("x").map(Number);
        return { width: w, height: h };
      })()
    : { width: 1440, height: 900 };

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const results = await measure(page, viewport);
    const label = `${viewport.width}x${viewport.height}`;
    const screenshotPath = path.join(OUT_DIR, `inspect-${viewport.width}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const report = {
      label,
      timestamp: new Date().toISOString(),
      ...results,
    };

    for (const [sel, data] of Object.entries(report.elements)) {
      if (data.found && data.rect) {
        data.rect = {
          x: Math.round(data.rect.x),
          y: Math.round(data.rect.y),
          width: Math.round(data.rect.width),
          height: Math.round(data.rect.height),
          right: Math.round(data.rect.right),
          bottom: Math.round(data.rect.bottom),
        };
      }
    }

    const jsonPath = path.join(OUT_DIR, `inspect-${viewport.width}.json`);
    await writeFile(jsonPath, JSON.stringify(report, null, 2));

    console.log(`\n=== Layout inspection @ ${label} ===\n`);
    console.log(`with-rail classes: workspace=${results.hasWithRailClass}, command-center=${results.hasCommandCenterRailClass}`);
    console.log(`viewport inner: ${results.viewport.width}x${results.viewport.height}\n`);

    for (const sel of SELECTORS) {
      const data = report.elements[sel];
      if (!data?.found) {
        console.log(`${sel}: NOT FOUND`);
        continue;
      }
      console.log(`${sel}:`);
      console.log(`  rect: x=${data.rect.x} w=${data.rect.width} right=${data.rect.right}`);
      console.log(`  styles: display=${data.styles.display} width=${data.styles.width} maxWidth=${data.styles.maxWidth}`);
      if (data.styles.gridTemplateColumns && data.styles.gridTemplateColumns !== "none") {
        console.log(`  grid-template-columns: ${data.styles.gridTemplateColumns}`);
      }
      if (data.styles.flexDirection && data.styles.flexDirection !== "row") {
        console.log(`  flex-direction: ${data.styles.flexDirection}`);
      }
    }

    const main = report.elements[".cockpit-main"];
    const rail = report.elements[".cockpit-rail-right"];
    const gap = main?.found ? viewport.width - main.rect.right : null;
    console.log(`\ngap viewport right - cockpit-main right: ${gap}px`);
    if (rail?.found) {
      console.log(`gap viewport right - rail right: ${viewport.width - rail.rect.right}px`);
    }

    console.log(`\nScreenshot: ${screenshotPath}`);
    console.log(`JSON: ${jsonPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
