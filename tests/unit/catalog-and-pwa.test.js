import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CASES, LOCKED_CASES } from "../../assets/data/cases.js";
import { rarityGroups, validateCases } from "../../js/odds.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const serviceWorker = readFileSync(resolve(projectRoot, "service-worker.js"), "utf8");
const html = readFileSync(resolve(projectRoot, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(projectRoot, "manifest.webmanifest"), "utf8"));
const shellMatch = serviceWorker.match(/const APP_SHELL_PATHS = \[([\s\S]*?)\];/);
assert.ok(shellMatch, "le service worker doit déclarer APP_SHELL_PATHS");
const shellPaths = [...shellMatch[1].matchAll(/"([^\"]+)"/g)].map((match) => match[1]);

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

test("les caisses du catalogue et leurs objets ont des identifiants uniques", () => {
  const allCases = CASES.concat(LOCKED_CASES);
  const visibleCases = CASES.filter((box) => !box.hidden);
  assert.equal(CASES.length, 17);
  assert.equal(visibleCases.length, 7);
  assert.equal(visibleCases.reduce((count, box) => count + (box.items?.length ?? 0), 0), 58);
  const caseIds = allCases.map((box) => box.id);
  assert.equal(new Set(caseIds).size, caseIds.length);

  const items = allCases.flatMap((box) => box.items ?? []);
  assert.equal(items.length, 73);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.equal(LOCKED_CASES.length, 2);
  assert.ok(LOCKED_CASES.every((box) => box.locked));
});

test("chaque caisse à objets tire et affiche une distribution totale de 100 %", () => {
  const itemCases = CASES.filter((box) => Array.isArray(box.items) && box.items.length > 0);
  assert.equal(itemCases.length, 7);

  for (const box of itemCases) {
    const groups = rarityGroups(box);
    assert.ok(groups.length > 0, `${box.id} doit avoir au moins une rareté tirable`);
    assert.ok(Math.abs(sum(groups.map((group) => group.percent)) - 100) < 1e-9, `${box.id}: poids de rareté`);
    assert.ok(
      Math.abs(sum(groups.flatMap((group) => group.items.map((item) => item.percent))) - 100) < 1e-9,
      `${box.id}: probabilités affichées par objet`,
    );
    assert.ok(groups.every((group) => group.items.length > 0));
  }
});

test("la relance de la Caisse Mystère reste hors du tirage tant qu'elle n'a pas de rareté", () => {
  const bonusmalus = CASES.find((box) => box.id === "bonusmalus");
  const mysteryReroll = bonusmalus.items.find((item) => item.id === "relanceAccessoire");
  assert.equal(mysteryReroll.rarity, "");
  assert.ok(!rarityGroups(bonusmalus).some((group) => group.items.some(({ item }) => item.id === mysteryReroll.id)));
});

test("resultDescription est facultatif sur les récompenses", () => {
  const bonusmalus = CASES.find((box) => box.id === "bonusmalus");
  const describedReward = bonusmalus.items.find((item) => item.id === "relanceNombre");
  const regularReward = bonusmalus.items.find((item) => item.id === "changeMain");
  assert.equal(describedReward.resultDescription, "Ouvre une nouvelle fois la Caisse de la Sentence.");
  assert.equal(regularReward.resultDescription, undefined);
});

test("les lots ne référencent que des caisses simples existantes", () => {
  const caseById = new Map(CASES.map((box) => [box.id, box]));
  const bundles = CASES.filter((box) => Array.isArray(box.bundle));
  assert.equal(bundles.length, 2);
  for (const bundle of bundles) {
    assert.ok(bundle.bundle.length > 0, `${bundle.id} ne doit pas être vide`);
    for (const id of bundle.bundle) {
      assert.ok(caseById.has(id), `${bundle.id} référence ${id}, qui n'existe pas`);
      assert.ok(Array.isArray(caseById.get(id).items), `${bundle.id} ne doit pas contenir un autre lot`);
    }
  }
});

test("la validation du catalogue ne signale que la récompense Bonus/Malus sans rareté", () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    validateCases(CASES.filter((box) => Array.isArray(box.items) && box.items.length > 0));
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /« bonusmalus » : « Relance la Caisse Mystère » \(\) n'a pas de poids de rareté, il ne sortira jamais\./);
});

test("le précache ne contient que des fichiers locaux existants, sans URL de dossier", () => {
  const localPaths = shellPaths.filter((path) => !/^https?:/i.test(path));
  assert.ok(!shellPaths.some((path) => /^https?:/i.test(path)), "les URL externes ne doivent pas bloquer l'installation");
  assert.ok(localPaths.includes("./js/pwa.js"));
  assert.ok(localPaths.includes("./manifest.webmanifest"));
  for (const required of [
    "./index.html",
    "./css/style.css",
    "./js/main.js",
    "./js/odds.js",
    "./assets/icons/favicon-192.png",
  ]) {
    assert.ok(localPaths.includes(required), `ressource du shell non précachée : ${required}`);
  }
  assert.ok(!html.includes("cdn.jsdelivr.net"), "le chargement de Bootstrap ne doit pas dépendre du CDN");
  assert.ok(localPaths.includes("./vendor/bootstrap-5.3.3/bootstrap.min.css"));
  assert.ok(localPaths.includes("./vendor/bootstrap-5.3.3/bootstrap.bundle.min.js"));

  for (const path of localPaths) {
    if (path === "./") continue; // URL de navigation vers l'index à la racine du scope.
    const filePath = resolve(projectRoot, path.replace(/^\.\//, ""));
    assert.ok(existsSync(filePath) && statSync(filePath).isFile(), `ressource absente ou dossier précaché : ${path}`);
  }

  for (const box of CASES.concat(LOCKED_CASES)) {
    if (!box.image) continue;
    const filePath = resolve(projectRoot, box.image);
    assert.ok(existsSync(filePath), `illustration manquante : ${box.image}`);
    const cachePath = `./${box.image.replace(/^\.\//, "")}`;
    assert.ok(localPaths.includes(cachePath), `illustration non précachée : ${box.image}`);
  }
});

test("les icônes du manifeste existent, ont des dimensions déclarées et restent légères", () => {
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    const filePath = resolve(projectRoot, icon.src.replace(/^\.\//, ""));
    assert.ok(existsSync(filePath), `icône manquante : ${icon.src}`);
    assert.equal(icon.purpose, "any", "les icônes transparentes ne sont pas marquées maskable");
    const header = readFileSync(filePath);
    assert.deepEqual([...header.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const dimensions = `${header.readUInt32BE(16)}x${header.readUInt32BE(20)}`;
    assert.equal(icon.sizes, dimensions, `taille annoncée incorrecte : ${icon.src}`);
    assert.ok(statSync(filePath).size < 500_000, `icône trop lourde : ${icon.src}`);
  }
  for (const screenshot of manifest.screenshots ?? []) {
    assert.ok(existsSync(resolve(projectRoot, screenshot.src)), `capture manifest manquante : ${screenshot.src}`);
  }
});
