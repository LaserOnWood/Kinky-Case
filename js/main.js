import { RARITIES, CASES, LOCKED_CASES } from "../assets/data/cases.js";
import { drawItem, formatPercent, rarityGroups, validateCases } from "./odds.js";

const MAX_COUNT = 1_000_000_000;
const MAX_HISTORY = 60;
const VISIBLE_HISTORY = 12;
const MAX_DATE_MS = 8.64e15;
const STORAGE_LOCK_NAME = "kinky-case-data";
const INVENTORY_KEY = "loot_inventory";
const HISTORY_KEY = "loot_history";

const SPIN_DURATION_MS = 9000; // durée de la roulette, à ajuster en cas de besoin (animation CSS + JS)

const ALL_ITEMS = CASES.flatMap((c) => c.items ?? []); // les lots n'ont pas d'items
const ITEM_BY_ID = new Map(ALL_ITEMS.map((i) => [i.id, i]));
const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));
const $ = (id) => document.getElementById(id);
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ---- Ambilight : couleur dominante de chaque caisse (mise en cache par id)
const autoAccent = new Map();

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d) {
        s = d / (1 - Math.abs(2 * l - 1));
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return [h, s, l];
}

const HUE_BUCKETS = 12;
const hueDistance = (a, b) => {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
};

// Histogramme des teintes d'une image (pondéré par saturation et luminosité).
function colorHistogram(img) {
    try {
        const size = 32;
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (d[i + 3] < 128) continue; // transparence
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max < 50 || max - min < 30) continue; // noir / gris / blanc
            const w = (max - min) * max;
            const k = buckets[Math.floor(rgbToHsl(r, g, b)[0] / (360 / HUE_BUCKETS)) % HUE_BUCKETS];
            k.w += w; k.r += r * w; k.g += g * w; k.b += b * w;
        }
        return buckets;
    } catch {
        return null; // canvas bloqué (ex. ouverture en file://) : on garde l'accent par défaut
    }
}

// Couleur vive à partir d'une moyenne RGB.
function boostColor(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    const sat = Math.round(Math.max(s, 0.7) * 100);
    const lig = Math.round(Math.min(Math.max(l, 0.5), 0.62) * 100);
    return { h, css: `hsl(${Math.round(h)} ${sat}% ${lig}%)` };
}

// Choisit pour chaque caisse la teinte la plus DISTINCTIVE : une teinte présente dans presque
// toutes les caisses (ex. le doré des ornements) compte peu (pondération de type TF-IDF).
// Les caisses les plus caractéristiques choisissent en premier, les suivantes évitent
// (en douceur) les teintes déjà prises.
function pickAccents(entries) {
    const list = entries.filter((e) => e.hist);
    const N = list.length;
    const shares = list.map(({ hist }) => {
        const total = hist.reduce((sum, k) => sum + k.w, 0) || 1;
        return hist.map((k) => k.w / total);
    });
    const idf = Array.from({ length: HUE_BUCKETS }, (_, k) => {
        const df = shares.filter((s) => s[k] > 0.04).length;
        return Math.log((N + 1) / (df + 1)) + 0.1;
    });
    const scored = list.map((e, i) => ({ ...e, score: shares[i].map((s, k) => s * idf[k]) }));
    scored.sort((a, b) => Math.max(...b.score) - Math.max(...a.score));

    const taken = [];
    const result = new Map();
    for (const { id, hist, score } of scored) {
        let best = null;
        let bestScore = -1;
        hist.forEach((k, i) => {
            if (!k.w) return;
            const color = boostColor(k.r / k.w, k.g / k.w, k.b / k.w);
            let s = score[i];
            for (const h of taken) s *= Math.sqrt(Math.min(1, hueDistance(color.h, h) / 25));
            if (s > bestScore) {
                bestScore = s;
                best = color;
            }
        });
        if (best) {
            result.set(id, best.css);
            taken.push(best.h);
        }
    }
    return result;
}

// La lueur de fond de la page suit la couleur de la caisse sélectionnée.
function syncPageAccent() {
    const showcase = $("selected-case-showcase");
    if (!showcase) return;
    const col = getComputedStyle(showcase).getPropertyValue("--case-accent").trim();
    if (col) document.documentElement.style.setProperty("--page-accent", col);
}

// Pose --auto-accent sur chaque élément [data-theme] dont la couleur est connue.
function applyAutoAccents() {
    document.querySelectorAll("[data-theme]").forEach((el) => {
        const col = autoAccent.get(el.dataset.theme);
        if (col) el.style.setProperty("--auto-accent", col);
    });
    syncPageAccent();
}

// Une caisse normale = 1 roulette ; un lot = 1 roulette par sous-caisse.
const subCases = (c) => (c.bundle ? c.bundle.map((id) => CASE_BY_ID.get(id)).filter(Boolean) : [c]);
const caseSize = (c) => subCases(c).reduce((s, b) => s + b.items.length, 0);

// ---- Formatage (la date est stockée en timestamp, formatée uniquement à l'affichage)
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" });
const formatDate = (ts) => (ts ? dateFormat.format(ts) : "Date inconnue");
const isSupportedTimestamp = (ts) =>
    Number.isFinite(ts) && ts > 0 && ts <= MAX_DATE_MS && Number.isFinite(new Date(ts).getTime());

// ---- Chargement / nettoyage des données locales
function loadStoredJSON(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored === null ? fallback : JSON.parse(stored);
    } catch (error) {
        console.error(`Impossible de lire ${key} depuis le stockage local.`, error);
        return fallback;
    }
}

function sanitizeInventory(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const clean = {};
    for (const [id, count] of Object.entries(raw)) {
        if (ITEM_BY_ID.has(id) && Number.isSafeInteger(count) && count > 0 && count <= MAX_COUNT) {
            const combined = (clean[id] || 0) + count;
            clean[id] = Math.min(MAX_COUNT, combined);
        }
    }
    return clean;
}

// Format : { itemId, caseId, ts }
function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const { itemId, caseId, bundleId, ts } = entry;
    if (!CASE_BY_ID.get(caseId)?.items?.some((i) => i.id === itemId)) return null;
    return {
        itemId,
        caseId,
        bundleId: CASE_BY_ID.get(bundleId)?.bundle ? bundleId : undefined,
        ts: isSupportedTimestamp(ts) ? ts : null,
    };
}

function sanitizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEntry).filter(Boolean).slice(0, MAX_HISTORY);
}

let inventory = sanitizeInventory(loadStoredJSON(INVENTORY_KEY, {}));
let history = sanitizeHistory(loadStoredJSON(HISTORY_KEY, []));
let pendingOpenings = [];

// ---- Caisses cachées (hidden) : absentes de l'affichage tant qu'elles ne sont pas débloquées.
const UNLOCKED_KEY = "loot_unlocked";
const unlocked = new Set(
    [].concat(loadStoredJSON(UNLOCKED_KEY, [])).filter((id) => {
        const box = CASE_BY_ID.get(id);
        return box?.hidden && Array.isArray(box.items) && box.items.length > 0;
    }),
);
const isVisible = (c) => !c.hidden || unlocked.has(c.id);
const visibleCases = () => CASES.filter(isVisible);
const visibleItemCount = () => visibleCases().reduce((s, c) => s + (c.items?.length ?? 0), 0);

function unlockCase(id) {
    const c = CASE_BY_ID.get(id);
    if (!c?.hidden || !Array.isArray(c.items) || c.items.length === 0 || unlocked.has(id)) return false;
    unlocked.add(id);
    try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...unlocked]));
    } catch (error) {
        console.error("Impossible de sauvegarder les caisses débloquées.", error);
    }
    return true;
}

// Déblocage via ?unlock=<id> ; l'URL est nettoyée ensuite.
const wanted = new URLSearchParams(location.search).get("unlock");
if (wanted) {
    if (unlockCase(wanted)) showToast("Une caisse secrète a été débloquée !");
    window.history.replaceState(null, "", location.pathname + location.hash);
}
let selectedcase = visibleCases()[0];
let busy = false;

function readStoredState() {
    return {
        inventory: sanitizeInventory(loadStoredJSON(INVENTORY_KEY, {})),
        history: sanitizeHistory(loadStoredJSON(HISTORY_KEY, [])),
    };
}

function saveState(nextInventory, nextHistory) {
    let previousInventory;
    let previousHistory;
    let snapshotComplete = false;
    try {
        previousInventory = localStorage.getItem(INVENTORY_KEY);
        previousHistory = localStorage.getItem(HISTORY_KEY);
        snapshotComplete = true;

        localStorage.setItem(INVENTORY_KEY, JSON.stringify(nextInventory));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        return true;
    } catch (error) {
        // Si la seconde écriture échoue, on tente de restaurer la paire précédente.
        if (snapshotComplete) {
            try {
                if (previousInventory === null) localStorage.removeItem(INVENTORY_KEY);
                else localStorage.setItem(INVENTORY_KEY, previousInventory);
                if (previousHistory === null) localStorage.removeItem(HISTORY_KEY);
                else localStorage.setItem(HISTORY_KEY, previousHistory);
            } catch (rollbackError) {
                console.error("Impossible de restaurer les anciennes données locales.", rollbackError);
            }
        }
        console.error("La collection et l'historique n'ont pas pu être sauvegardés.", error);
        return false;
    }
}

async function withStorageLock(callback) {
    if (typeof navigator.locks?.request === "function") {
        return navigator.locks.request(STORAGE_LOCK_NAME, { mode: "exclusive" }, callback);
    }
    // Le repli garde les opérations synchrones, mais ne peut pas sérialiser plusieurs onglets.
    return callback();
}

async function mutateStoredState(mutator, { keepChangesOnFailure = true } = {}) {
    return withStorageLock(() => {
        const current = readStoredState();
        const next = mutator(current);
        const saved = saveState(next.inventory, next.history);
        const shown = saved || keepChangesOnFailure ? next : current;
        inventory = shown.inventory;
        history = shown.history;
        return saved;
    });
}

function showToast(message) {
    const el = $("toast-message");
    if (el) el.textContent = message;
    if (window.bootstrap?.Toast) window.bootstrap.Toast.getOrCreateInstance($("toast")).show();
}

// ---- Rendu
function imageBackgroundValue(imagePath) {
    return `url('${new URL(imagePath, document.baseURI).href}')`;
}

function rendercases() {
    const lockedCards = LOCKED_CASES.map(
        (c) => `<div class="col-6 col-md-3"><article class="case-card locked" aria-disabled="true" data-theme="${c.id}">
 <div class="case-visual"><img src="${c.image}" alt="" loading="lazy"><span class="case-lock" aria-hidden="true">🔒</span></div>
 <div class="fw-semibold mb-2">Caisse secrète</div>
 <div class="small subtle">Bientôt disponible. Son contenu reste secret.</div></article></div>`,
    ).join("");

    const cases = visibleCases();
    $("case-grid").innerHTML = cases.map(
        (c) => `<div class="col-6 col-md-3"><article class="case-card ${c.id === selectedcase.id ? "selected" : ""}" data-theme="${c.id}">
 <span class="case-visual" style="--img:${imageBackgroundValue(c.image)}">
  <button type="button" class="case-select case-visual-select" data-id="${c.id}" aria-pressed="${c.id === selectedcase.id}"><span class="visually-hidden">Sélectionner la caisse ${c.name}</span><img src="${c.image}" alt="" loading="lazy"></button>
  <span class="case-count" aria-hidden="true">${caseSize(c)}</span>
  <button type="button" class="odds-btn" data-bs-toggle="modal" data-bs-target="#odds-modal" data-case-id="${c.id}" aria-label="Probabilités : ${c.name}" title="Probabilités">%</button>
 </span>
 <div class="fw-semibold mb-2">${c.name}</div>
 <div class="small subtle">${c.description}</div>
 </article></div>`,
    ).join("") + lockedCards;
    document.querySelector(".opening-header").dataset.theme = selectedcase.id;
    $("case-count-label").textContent = `${cases.length} disponibles`;
    applyAutoAccents();
}

function itemCard(item) {
    return `<div class="reel-item ${item.rarity}"><div class="reel-icon">${item.icon}</div><div class="reel-name">${item.name}</div><div class="rarity">${RARITIES[item.rarity].label}</div></div>`;
}

function reelMarkup(box) {
    const cards = Array.from({ length: 11 }, (_, i) => itemCard(box.items[i % box.items.length])).join("");
    return `<div class="roulette-window" data-theme="${box.id}"><div class="marker"></div><div class="track">${cards}</div></div>`;
}

function renderSelected() {
    const boxes = subCases(selectedcase);
    $("selected-title").textContent = selectedcase.name;
    $("selected-case-showcase").dataset.theme = selectedcase.id;
    const img = $("selected-case-image");
    img.src = selectedcase.image;
    img.alt = `Illustration ${selectedcase.name}`;
    img.closest(".case-visual").style.setProperty("--img", imageBackgroundValue(selectedcase.image));
    $("selected-case-name").textContent = selectedcase.name;
    $("selected-case-description").textContent = selectedcase.description;
    $("result").className = "mt-4 d-none";
    $("opening-hint").textContent =
        boxes.length > 1
            ? "Les résultats sont déterminés avant l'animation."
            : "Le résultat est déterminé avant l'animation.";
    $("reels").innerHTML = boxes.map(reelMarkup).join("");
    $("reels").classList.toggle("is-bundle", boxes.length > 1);
    applyAutoAccents();
}

// Toujours le même format, même pour un objet seul dans sa rareté :
// une ligne d'en-tête (taux de la rareté), puis la part de chaque objet.
function oddsRows(group) {
    const header = `<tr class="odds-group-row ${group.rarity}"><th><span class="rarity m-0">${RARITIES[group.rarity].label}</span></th><th class="text-end">${formatPercent(group.percent)}</th></tr>`;
    const rows = group.items
        .map(({ item, percent }) => `<tr class="odds-item-row ${group.rarity}"><td>${item.icon} ${item.name}</td><td class="text-end">${formatPercent(percent)}</td></tr>`)
        .join("");
    return header + rows;
}

function renderOdds(box) {
    $("odds-title").textContent = box.name;
    $("odds-content").innerHTML = subCases(box)
        .map(
            (sub) => `<div class="mb-3" data-theme="${sub.id}">
  ${box.bundle ? `<div class="eyebrow mb-2">${sub.name}</div>` : ""}
  <table class="table table-sm align-middle mb-0 odds-table">
    <thead><tr><th>Objet</th><th class="text-end">Chance</th></tr></thead>
    <tbody>${rarityGroups(sub).map(oddsRows).join("")}</tbody>
  </table></div>`,
        )
        .join("");
    applyAutoAccents();
}

function renderCollection() {
    const entries = Object.entries(inventory).filter(([id, count]) => count > 0 && ITEM_BY_ID.has(id));
    const totalCopies = entries.reduce((sum, [, count]) => sum + count, 0);
    $("nav-count").textContent = `(${entries.length}/${visibleItemCount()})`;
    $("collection-summary").textContent = `${entries.length} objet(s) découvert(s) · ${totalCopies} exemplaire(s)`;
    if (!entries.length) {
        $("collection-grid").innerHTML =
            '<div class="col-12"><div class="panel empty">Aucune récompense pour le moment. À vous de faire la première ouverture.</div></div>';
        return;
    }
    $("collection-grid").innerHTML = entries
        .map(([id, count]) => {
            const item = ITEM_BY_ID.get(id);
            return `<div class="col-6 col-md-4 col-lg-3"><div class="reward-card ${item.rarity}"><div class="reward-icon">${item.icon}</div><div class="fw-semibold small">${item.name}</div><div class="rarity">${RARITIES[item.rarity].label}</div><div class="small subtle mt-2">Quantité : ×${count}</div></div></div>`;
        })
        .join("");
}

function renderHistory() {
    const container = $("history-list");
    container.replaceChildren();
    // Résumé visible même quand la section est repliée.
    $("history-summary").textContent = `${history.length} résultat${history.length > 1 ? "s" : ""}`;
    if (!history.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Aucune ouverture enregistrée.";
        container.appendChild(empty);
        return;
    }
    history.slice(0, VISIBLE_HISTORY).forEach((entry) => {
        const item = ITEM_BY_ID.get(entry.itemId);
        const box = CASE_BY_ID.get(entry.caseId);

        const row = document.createElement("div");
        row.className = "history-row";

        const icon = document.createElement("div");
        icon.className = "history-icon";
        icon.textContent = item.icon;

        const details = document.createElement("div");
        details.className = "flex-grow-1";
        const name = document.createElement("div");
        name.className = "small fw-semibold";
        name.textContent = item.name;
        const meta = document.createElement("div");
        meta.className = "small subtle";
        const bundle = entry.bundleId ? CASE_BY_ID.get(entry.bundleId) : null;
        meta.textContent = `${bundle ? `${bundle.name} · ` : ""}${box.name} · ${formatDate(entry.ts)}`;
        details.append(name, meta);

        const rarity = document.createElement("span");
        rarity.className = `rarity ${item.rarity} `;
        rarity.textContent = RARITIES[item.rarity].label;

        row.append(icon, details, rarity);
        container.appendChild(row);
    });
}

function renderResult(wins) {
    $("result-list").innerHTML = wins
        .map(
            (win, i) => `<div class="col-12 col-sm"><div class="result-card ${win.rarity} result-reveal" style="animation-delay:${i * 0.15}s">
  <div class="reward-icon-lg">${win.icon}</div>
  <div class="fw-semibold mt-1">${win.name}</div>
  ${typeof win.resultDescription === "string" && win.resultDescription.trim() ? `<p class="result-description small subtle mt-2 mb-0">${win.resultDescription.trim()}</p>` : ""}
  <div class="rarity">${RARITIES[win.rarity].label}</div></div></div>`,
        )
        .join("");
    $("result").className = "mt-4";
}

// ---- Ouverture
// Met en valeur l'objet gagnant et colore la lueur de la roulette selon sa rareté.
function markWinner(windowEl, track, index, rarity) {
    const winnerEl = track.children[index];
    if (!winnerEl) return;
    winnerEl.classList.add("winner");
    windowEl.dataset.rarity = rarity; // la lueur est plus forte pour les raretés élevées
    const rarityColor = getComputedStyle(winnerEl).getPropertyValue("--rarity").trim();
    if (rarityColor) windowEl.style.setProperty("--glow", rarityColor);
    windowEl.classList.add("glow");
}

// Fait tourner UNE roulette ; la promesse se résout quand elle est arrêtée.
function spinReel(windowEl, box, win, duration) {
    return new Promise((resolve) => {
        windowEl.classList.remove("glow");
        delete windowEl.dataset.rarity;
        const track = windowEl.querySelector(".track");
        const reelItems = rarityGroups(box).flatMap((group) => group.items.map(({ item }) => item));
        // L'animation présente chaque autre gain; le vrai gagnant a déjà été tiré.
        const sequence = reelItems.filter((item) => item.id !== win.id);
        for (let i = sequence.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }
        const targetIndex = Math.max(29, sequence.length + 7);
        while (sequence.length < targetIndex) {
            sequence.push(reelItems[Math.floor(Math.random() * reelItems.length)]);
        }
        sequence[targetIndex] = win;
        while (sequence.length < targetIndex + 6) {
            sequence.push(reelItems[Math.floor(Math.random() * reelItems.length)]);
        }
        track.innerHTML = sequence.map(itemCard).join("");
        track.style.transition = "none";
        track.style.transform = "translateX(0px)";

        // Mesure après insertion : la largeur des cartes varie selon le breakpoint.
        const windowRect = windowEl.getBoundingClientRect();
        const cardRect = track.children[targetIndex].getBoundingClientRect();
        const finalX = windowRect.left + windowEl.clientWidth / 2 - (cardRect.left + cardRect.width / 2);
        if (duration <= 0) { // mouvement réduit : opencase passe une durée nulle
            track.style.transition = "none";
            track.style.transform = `translateX(${finalX}px)`;
            markWinner(windowEl, track, targetIndex, win.rarity);
            resolve();
            return;
        }
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                track.style.transition = `transform ${duration}ms cubic-bezier(.055,.72,.12,1)`;
                track.style.transform = `translateX(${finalX}px)`;
            }),
        );

        let finished = false;
        const end = () => {
            if (finished) return;
            finished = true;
            track.removeEventListener("transitionend", onTransitionEnd);
            markWinner(windowEl, track, targetIndex, win.rarity);
            resolve();
        };
        const onTransitionEnd = (event) => {
            if (event.target === track && event.propertyName === "transform") end();
        };
        track.addEventListener("transitionend", onTransitionEnd);
        setTimeout(end, duration + 400); // secours
    });
}

async function opencase() {
    if (busy) return;
    busy = true;
    $("open-btn").disabled = true;
    $("reset-btn").disabled = true;
    $("result").classList.add("d-none");

    // Tous les gains sont tirés avant l'animation : elle ne fait que les révéler.
    const caseAtOpening = selectedcase;
    const boxes = subCases(caseAtOpening);
    const wins = boxes.map(drawItem);
    const windows = [...document.querySelectorAll("#reels .roulette-window")];
    // Durées échelonnées pour un effet de révélation une par une.
    const reduceMotion = prefersReducedMotion();
    const durations = boxes.map((_, i) => (reduceMotion ? 0 : SPIN_DURATION_MS + i * 1000));

    try {
        const now = Date.now();
        pendingOpenings.push({
            wins,
            boxes,
            bundleId: caseAtOpening.bundle ? caseAtOpening.id : undefined,
            ts: isSupportedTimestamp(now) ? now : null,
        });
        const openingsToPersist = [...pendingOpenings];
        const saved = await mutateStoredState(({ inventory: currentInventory, history: currentHistory }) => {
            const nextInventory = { ...currentInventory };
            let nextHistory = currentHistory;
            for (const opening of openingsToPersist) {
                opening.wins.forEach((win) => {
                    nextInventory[win.id] = Math.min(MAX_COUNT, (nextInventory[win.id] || 0) + 1);
                });
                const entries = opening.wins.map((win, i) => ({
                    itemId: win.id,
                    caseId: opening.boxes[i].id,
                    bundleId: opening.bundleId,
                    ts: opening.ts,
                }));
                nextHistory = [...entries, ...nextHistory].slice(0, MAX_HISTORY);
            }
            return { inventory: nextInventory, history: nextHistory };
        });
        if (saved) pendingOpenings = [];

        await Promise.all(windows.map((w, i) => spinReel(w, boxes[i], wins[i], durations[i])));

        renderResult(wins);
        renderCollection();
        renderHistory();

        const plural = wins.length > 1;
        $("opening-hint").textContent = saved
            ? `${plural ? "Récompenses ajoutées" : "Récompense ajoutée"} à votre collection sur cet appareil.`
            : "Gains obtenus, mais sauvegarde impossible. Ne fermez pas cette page avant d'avoir réessayé.";
        showToast(
            saved
                ? plural ? `${wins.length} récompenses ajoutées à votre collection.` : `${wins[0].name} ajouté à votre collection.`
                : "Gains obtenus, mais non sauvegardés.",
        );
    } catch (error) {
        console.error("Une erreur est survenue à la fin de l'ouverture.", error);
        $("opening-hint").textContent =
            "L'ouverture n'a pas pu être finalisée. Vérifiez l'historique et la collection avant de réessayer.";
    } finally {
        $("open-btn").disabled = false;
        $("reset-btn").disabled = false;
        busy = false;
    }
}

// ---- Événements
function scrollToReels() {
    requestAnimationFrame(() => alignAnchorBelowNavbar($("reels")));
}

$("open-btn").addEventListener("click", opencase);
// Toute la carte est cliquable à la souris ; le bouton reste l'élément accessible (clavier, lecteur d'écran).
$("case-grid").addEventListener("click", (event) => {
    if (busy || event.target.closest(".odds-btn")) return;
    const button = event.target.closest(".case-card:not(.locked)")?.querySelector("button.case-select");
    if (!button) return;
    const nextCase = CASE_BY_ID.get(button.dataset.id);
    if (!nextCase) return;
    const keepFocus = document.activeElement === button;
    selectedcase = nextCase;
    rendercases();
    renderSelected();
    if (keepFocus) {
        [...document.querySelectorAll("button.case-select")]
            .find((candidate) => candidate.dataset.id === nextCase.id)
            ?.focus({ preventScroll: true });
    }
    scrollToReels();
});
$("odds-modal").addEventListener("show.bs.modal", (event) => {
    const box = CASE_BY_ID.get(event.relatedTarget?.dataset.caseId) ?? selectedcase;
    renderOdds(box);
});
$("reset-btn").addEventListener("click", async () => {
    if (busy) return;
    if (!confirm("Effacer la collection et l'historique enregistrés sur cet appareil ?")) return;

    busy = true;
    $("open-btn").disabled = true;
    $("reset-btn").disabled = true;
    try {
        const saved = await mutateStoredState(() => ({ inventory: {}, history: [] }), { keepChangesOnFailure: false });
        if (saved) pendingOpenings = [];
        renderCollection();
        renderHistory();
        renderSelected();

        $("opening-hint").textContent = saved
            ? "Collection et historique réinitialisés."
            : "Réinitialisation annulée : impossible de sauvegarder la modification.";
        if (!saved) showToast("Réinitialisation impossible : vos données ont été conservées.");
    } catch (error) {
        console.error("La réinitialisation n'a pas pu être effectuée.", error);
        $("opening-hint").textContent = "Réinitialisation impossible : vos données ont été conservées.";
    } finally {
        $("open-btn").disabled = false;
        $("reset-btn").disabled = false;
        busy = false;
    }
});

window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== INVENTORY_KEY && event.key !== HISTORY_KEY) return;
    ({ inventory, history } = readStoredState());
    renderCollection();
    renderHistory();
});

if (typeof navigator.locks?.request !== "function") {
    $("storage-sync-note").hidden = false;
}

// ---- Navigation par ancres
// La barre est sticky : on mesure sa hauteur (menu mobile fermé) pour que les ancres s'arrêtent
// SOUS elle. Le CSS s'en sert : html { scroll-padding-top: var(--nav-offset) }.
function updateNavOffset() {
    const menu = $("nav");
    if (menu.classList.contains("show") || menu.classList.contains("collapsing")) return; // menu mobile ouvert : on garde la mesure « fermée »
    document.documentElement.style.setProperty("--nav-offset", `${document.querySelector(".navbar").offsetHeight}px`);
}

// Les sections Historique et Collection sont repliées par défaut : un lien de navigation (ou une URL
// avec #historique / #collection) la déplie, sinon on arriverait sur un titre sans contenu.
function expandSection(hash) {
    if (!/^#[\w-]+$/.test(hash)) return;
    const body = document.querySelector(`${hash} > .collapse`);
    if (body) window.bootstrap?.Collapse.getOrCreateInstance(body, { toggle: false }).show();
}

// Lien actif : la dernière section dont le haut est passé sous la barre. En bas de page, une section
// courte (la collection repliée) ne peut pas atteindre la barre : c'est alors la dernière qui est active.
const navLinks = [...document.querySelectorAll('#nav a.nav-link[href^="#"]')];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));
let clickedLink = null; // lien cliqué : reste actif jusqu'à ce que la personne fasse défiler elle-même
let navOpening = false;

function updateActiveLink() {
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-offset")) || 72;
    let current = 0;
    navSections.forEach((section, i) => {
        if (section && section.getBoundingClientRect().top <= offset + 24) current = i;
    });
    if (clickedLink !== null) current = clickedLink;
    else if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = navLinks.length - 1;
    }
    navLinks.forEach((link, i) => {
        link.classList.toggle("active", i === current);
        if (i === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}

function alignAnchorBelowNavbar(target) {
    if (!target) return;
    const navbar = document.querySelector(".navbar");
    const offset = target.getBoundingClientRect().top - navbar.getBoundingClientRect().bottom - 16;
    window.scrollBy({ top: offset, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

let activeUpdateQueued = false;
function queueActiveUpdate() {
    if (activeUpdateQueued) return;
    activeUpdateQueued = true;
    requestAnimationFrame(() => {
        activeUpdateQueued = false;
        updateActiveLink();
    });
}

navLinks.forEach((link, i) =>
    link.addEventListener("click", () => {
        const hash = link.getAttribute("href");
        const target = document.querySelector(hash);
        expandSection(hash);
        clickedLink = i;
        updateActiveLink();
        // Menu mobile : le lien peut être cliqué avant la fin de sa transition d'ouverture.
        const menu = $("nav");
        const collapse = window.bootstrap?.Collapse.getOrCreateInstance(menu, { toggle: false });
        const alignAfterClose = () => {
            updateNavOffset();
            requestAnimationFrame(() => alignAnchorBelowNavbar(target));
        };
        if (menu.classList.contains("show")) {
            menu.addEventListener("hidden.bs.collapse", alignAfterClose, { once: true });
            collapse?.hide();
        } else if (menu.classList.contains("collapsing") && navOpening) {
            menu.addEventListener("hidden.bs.collapse", alignAfterClose, { once: true });
            menu.addEventListener("shown.bs.collapse", () => collapse?.hide(), { once: true });
        } else {
            requestAnimationFrame(() => alignAnchorBelowNavbar(target));
        }
    }),
);
["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) =>
    window.addEventListener(type, () => { clickedLink = null; }, { passive: true }),
);
window.addEventListener("scroll", queueActiveUpdate, { passive: true });
window.addEventListener("resize", () => {
    updateNavOffset();
    queueActiveUpdate();
});
window.addEventListener("load", () => {
    updateNavOffset();
    updateActiveLink();
});
expandSection(location.hash);

$("nav").addEventListener("show.bs.collapse", () => { navOpening = true; });
$("nav").addEventListener("hide.bs.collapse", () => { navOpening = false; });
$("nav").addEventListener("shown.bs.collapse", () => {
    navOpening = false;
    $("nav-toggle").setAttribute("aria-expanded", "true");
});
$("nav").addEventListener("hidden.bs.collapse", () => {
    $("nav-toggle").setAttribute("aria-expanded", "false");
    updateNavOffset();
});

validateCases([...CASES, ...LOCKED_CASES]);
rendercases();
renderSelected();
renderCollection();
renderHistory();
updateNavOffset();
updateActiveLink();

// Extraction des couleurs une fois TOUTES les images chargées (le choix compare les caisses entre elles).
// Pour forcer une couleur, ajoute `accent: "#3b82f6"` à la caisse dans cases.js.
Promise.all(
    CASES.map(
        (c) =>
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ id: c.id, hist: colorHistogram(img) });
                img.onerror = () => resolve({ id: c.id, hist: null });
                img.src = c.image;
            }),
    ),
).then((entries) => {
    pickAccents(entries).forEach((col, id) => autoAccent.set(id, col));
    CASES.forEach((c) => {
        if (c.accent) autoAccent.set(c.id, c.accent);
    });
    applyAutoAccents();
});
