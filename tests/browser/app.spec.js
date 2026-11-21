import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function openApplication(page) {
  await page.goto("/");
  await expect(page.locator("#case-grid .case-select").first()).toBeVisible();
  await expect(page.locator("#selected-title")).toBeVisible();
}

test("les caisses sont sélectionnables au clavier et annoncent leur état", async ({ page }) => {
  await openApplication(page);
  const mystery = page.locator('#case-grid .case-select[data-id="zonecorp"]');
  const royale = page.locator('#case-grid .case-select[data-id="accessoires"]');
  await expect(mystery).toHaveAccessibleName(/Sélectionner la caisse Caisse Mystère/);
  await expect(royale).toHaveAccessibleName(/Sélectionner la caisse Caisse Royale/);

  await page.locator("#nav .nav-link").last().focus();
  await page.keyboard.press("Tab");
  await expect(mystery).toBeFocused();
  expect(await mystery.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");

  await page.keyboard.press("Tab"); // bouton des probabilités de la première caisse
  await page.keyboard.press("Tab"); // sélection de la caisse suivante
  await expect(royale).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#selected-title")).toHaveText("Caisse Royale");
  await expect(page.locator('#case-grid .case-select[data-id="accessoires"]')).toHaveAttribute("aria-pressed", "true");
  await expect(mystery).toHaveAttribute("aria-pressed", "false");

  const currentMystery = page.locator('#case-grid .case-select[data-id="zonecorp"]');
  await currentMystery.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#selected-title")).toHaveText("Caisse Mystère");
  await expect(page.locator('#case-grid .case-select[data-id="zonecorp"]')).toHaveAttribute("aria-pressed", "true");
});

test("la sélection fait défiler jusqu'à la roulette sans la lancer, même avec les animations réduites", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openApplication(page);
    await page.locator('#case-grid .case-select[data-id="accessoires"]').click();
    await expect(page.locator("#selected-title")).toHaveText("Caisse Royale");
    await expect(page.getByRole("button", { name: /Ouvrir la caisse/ })).toBeEnabled();
    await expect.poll(() => page.evaluate(() => {
      const navBottom = document.querySelector(".navbar").getBoundingClientRect().bottom;
      const reelsTop = document.querySelector("#reels").getBoundingClientRect().top;
      return window.scrollY > 0 && reelsTop >= navBottom && reelsTop <= navBottom + 32;
    })).toBe(true);
    await expect(page.locator("#result-list .result-card")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("le bouton des probabilités reste ancré au coin supérieur droit du cadre image", async ({ page }) => {
  await openApplication(page);
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.locator('#case-grid [data-theme="zonecorp"] .case-visual').evaluate((frame) => {
      const frameRect = frame.getBoundingClientRect();
      const oddsRect = frame.querySelector(".case-odds-btn").getBoundingClientRect();
      const countRect = frame.querySelector(".case-count").getBoundingClientRect();
      return {
        oddsRightInset: frameRect.right - oddsRect.right,
        countRightInset: frameRect.right - countRect.right,
        oddsTopInset: oddsRect.top - frameRect.top,
        rightEdgeDifference: Math.abs(oddsRect.right - countRect.right),
      };
    });
    expect(geometry.oddsRightInset).toBeCloseTo(2, 0);
    expect(geometry.countRightInset).toBeCloseTo(2, 0);
    expect(geometry.oddsTopInset).toBeCloseTo(2, 0);
    expect(geometry.rightEdgeDifference).toBeLessThanOrEqual(1);
  }
  await page.locator('#case-grid [data-theme="zonecorp"] .case-odds-btn').click();
  await expect(page.locator("#odds-modal")).toHaveClass(/show/);
  await expect(page.locator("#odds-title")).toHaveText("Caisse Mystère");
});

test("les commandes et la page ne présentent pas de violation WCAG A/AA détectée par axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApplication(page);
  await expect(page.getByRole("button", { name: "Basculer le menu de navigation" })).toHaveAttribute("aria-controls", "nav");
  await expect(page.locator("#result")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#result")).toHaveAttribute("role", "status");

  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("le gain est sauvegardé avant la fin de l’animation et survit au rechargement", async ({ page }) => {
  await openApplication(page);
  await page.getByRole("button", { name: /Ouvrir la caisse/ }).click();
  await page.waitForFunction(() => {
    const inventory = JSON.parse(localStorage.getItem("loot_inventory") || "{}");
    const history = JSON.parse(localStorage.getItem("loot_history") || "[]");
    return Object.values(inventory).reduce((sum, count) => sum + count, 0) === 1 && history.length === 1;
  }, null, { timeout: 2_000 });

  await page.reload();
  await expect(page.locator("#collection-summary")).toContainText("1 exemplaire(s)");
  await expect(page.locator("#history-list .history-row")).toHaveCount(1);
});

test("un échec temporaire de stockage est annulé puis retenté avec le gain suivant", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    let failOnce = true;
    Storage.prototype.setItem = function (key, value) {
      if (failOnce && key === "loot_history") {
        failOnce = false;
        throw new DOMException("quota simulé", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  });
  try {
    await openApplication(page);
    await page.getByRole("button", { name: /Ouvrir la caisse/ }).click();
    await expect(page.locator("#opening-hint")).toContainText("sauvegarde impossible");
    expect(await page.evaluate(() => localStorage.getItem("loot_inventory"))).toBeNull();

    await page.getByRole("button", { name: /Ouvrir la caisse/ }).click();
    await page.waitForFunction(() => {
      const inventory = JSON.parse(localStorage.getItem("loot_inventory") || "{}");
      const history = JSON.parse(localStorage.getItem("loot_history") || "[]");
      return Object.values(inventory).reduce((sum, count) => sum + count, 0) === 2 && history.length === 2;
    }, null, { timeout: 2_000 });
  } finally {
    await context.close();
  }
});

test("la préférence de réduction des animations évite la roulette longue", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  try {
    await openApplication(page);
    await page.getByRole("button", { name: /Ouvrir la caisse/ }).click();
    await expect(page.locator("#result")).not.toHaveClass(/d-none/, { timeout: 2_000 });
    await expect(page.locator("#result-list .result-card").first()).toBeVisible();
    await expect(page.locator("#reels .track").first()).toHaveCSS("transition-property", "none");
  } finally {
    await context.close();
  }
});

test("deux onglets utilisent Web Locks pour préserver leurs ouvertures", async ({ browser }) => {
  const context = await browser.newContext();
  const first = await context.newPage();
  const second = await context.newPage();
  try {
    await Promise.all([openApplication(first), openApplication(second)]);
    await Promise.all([
      first.getByRole("button", { name: /Ouvrir la caisse/ }).click(),
      second.getByRole("button", { name: /Ouvrir la caisse/ }).click(),
    ]);
    await first.waitForFunction(() => {
      const inventory = JSON.parse(localStorage.getItem("loot_inventory") || "{}");
      const history = JSON.parse(localStorage.getItem("loot_history") || "[]");
      return Object.values(inventory).reduce((sum, count) => sum + count, 0) === 2 && history.length === 2;
    }, null, { timeout: 10_000 });
    await second.waitForFunction(() => document.querySelector("#collection-summary")?.textContent.includes("2 exemplaire(s)"), null, { timeout: 10_000 });
  } finally {
    await context.close();
  }
});

test("une date locale hors plage n’interrompt pas l’historique et un compteur reste plafonné", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("loot_inventory", JSON.stringify({ fesses: 1_000_000_000 }));
    localStorage.setItem("loot_history", JSON.stringify([
      { itemId: "fesses", caseId: "zonecorp", ts: 1e300 },
    ]));
    Math.random = () => 0;
  });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await openApplication(page);
  await expect(page.locator("#history-list")).toContainText("Date inconnue");
  await page.getByRole("button", { name: /Ouvrir la caisse/ }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("loot_inventory") || "{}").fesses === 1_000_000_000, null, { timeout: 2_000 });
  expect(pageErrors).toEqual([]);
});

test("le service worker précache le shell et permet un rechargement hors ligne", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // le client devient contrôlé par le service worker
    await expect(page.locator("#selected-title")).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#selected-title")).toBeVisible();
    await expect(page.locator("#case-grid .case-select")).toHaveCount(7);
  } finally {
    await context.close();
  }
});
