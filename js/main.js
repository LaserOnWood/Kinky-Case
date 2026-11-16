import { RARITIES, CASES, LOCKED_CASES } from "../assets/data/cases.js";
import { drawItem, formatPercent, rarityGroups, validateCases } from "./odds.js";

const MAX_COUNT = 1_000_000_000;
const MAX_HISTORY = 60;
const VISIBLE_HISTORY = 12;

const SPIN_DURATION_MS = 9000; // durée de la roulette, à ajuster en cas de besoin (animation CSS + JS)

const ALL_ITEMS = CASES.flatMap((c) => c.items ?? []); // les lots n'ont pas d'items
const ITEM_BY_ID = new Map(ALL_ITEMS.map((i) => [i.id, i]));
const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));
const $ = (id) => document.getElementById(id);

// Une caisse normale = 1 roulette ; un lot = 1 roulette par sous-caisse.
const subCases = (c) => (c.bundle ? c.bundle.map((id) => CASE_BY_ID.get(id)).filter(Boolean) : [c]);
const caseSize = (c) => subCases(c).reduce((s, b) => s + b.items.length, 0);

// ---- Formatage (la date est stockée en timestamp, formatée uniquement à l'affichage)
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" });
const formatDate = (ts) => (ts ? dateFormat.format(ts) : "Date inconnue");

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
    for (const [storedId, count] of Object.entries(raw)) {
        // Collections sauvegardées avant la correction de l'identifiant "sceptre".
        const id = storedId === " sceptre" ? "sceptre" : storedId;
        if (ITEM_BY_ID.has(id) && Number.isSafeInteger(count) && count > 0 && count <= MAX_COUNT) {
            const combined = (clean[id] || 0) + count;
            if (combined <= MAX_COUNT) clean[id] = combined;
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
        ts: Number.isFinite(ts) && ts > 0 ? ts : null,
    };
}

function sanitizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEntry).filter(Boolean).slice(0, MAX_HISTORY);
}

let inventory = sanitizeInventory(loadStoredJSON("loot_inventory", {}));
let history = sanitizeHistory(loadStoredJSON("loot_history", []));
let selectedcase = CASES[0];
let busy = false;

function save() {
    let previousInventory;
    let previousHistory;
    let snapshotComplete = false;
    try {
        previousInventory = localStorage.getItem("loot_inventory");
        previousHistory = localStorage.getItem("loot_history");
        snapshotComplete = true;

        localStorage.setItem("loot_inventory", JSON.stringify(inventory));
        localStorage.setItem("loot_history", JSON.stringify(history));
        return true;
    } catch (error) {
        // Si la seconde écriture échoue, on tente de restaurer la paire précédente.
        if (snapshotComplete) {
            try {
                if (previousInventory === null) localStorage.removeItem("loot_inventory");
                else localStorage.setItem("loot_inventory", previousInventory);
                if (previousHistory === null) localStorage.removeItem("loot_history");
                else localStorage.setItem("loot_history", previousHistory);
            } catch (rollbackError) {
                console.error("Impossible de restaurer les anciennes données locales.", rollbackError);
            }
        }
        console.error("La collection et l'historique n'ont pas pu être sauvegardés.", error);
        return false;
    }
}

function showToast(message) {
    const el = $("toast-message");
    if (el) el.textContent = message;
    if (window.bootstrap?.Toast) window.bootstrap.Toast.getOrCreateInstance($("toast")).show();
}

// ---- Rendu
function rendercases() {
    const lockedCards = LOCKED_CASES.map(
        (c) => `<div class="col-6 col-md-4"><article class="case-card locked" aria-disabled="true" data-theme="${c.id}">
 <div class="case-visual"><img src="${c.image}" alt="" loading="lazy"><span class="case-lock" aria-hidden="true">🔒</span></div>
 <div class="fw-semibold mb-2">Caisse secrète</div>
 <div class="small subtle">Bientôt disponible. Son contenu reste secret.</div></article></div>`,
    ).join("");

    $("case-grid").innerHTML = CASES.map(
        (c) => `<div class="col-6 col-md-4"><article class="case-card ${c.id === selectedcase.id ? "selected" : ""}" data-id="${c.id}" data-theme="${c.id}">
 <div class="case-visual">
  <img src="${c.image}" alt="Illustration ${c.name}" loading="lazy">
  <button type="button" class="odds-btn" data-bs-toggle="modal" data-bs-target="#odds-modal" data-case-id="${c.id}" aria-label="Probabilités : ${c.name}" title="Probabilités">%</button>
  <span class="case-count" title="${caseSize(c)} objets" aria-label="${caseSize(c)} objets">${caseSize(c)}</span>
 </div>
 <div class="fw-semibold mb-2">${c.name}</div>
 <div class="small subtle">${c.description}</div></article></div>`,
    ).join("") + lockedCards;
    document.querySelector(".opening-header").dataset.theme = selectedcase.id;
    document.querySelectorAll(".case-card:not(.locked)").forEach((el) =>
        el.addEventListener("click", (event) => {
            if (busy || event.target.closest(".odds-btn")) return;
            selectedcase = CASE_BY_ID.get(el.dataset.id);
            rendercases();
            renderSelected();
        }),
    );
    $("case-count-label").textContent = `${CASES.length} disponibles`;
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
    $("selected-case-name").textContent = selectedcase.name;
    $("selected-case-description").textContent = selectedcase.description;
    $("result").className = "mt-4 d-none";
    $("opening-hint").textContent =
        boxes.length > 1
            ? "Les résultats sont déterminés avant l'animation."
            : "Le résultat est déterminé avant l'animation.";
    $("reels").innerHTML = boxes.map(reelMarkup).join("");
    $("reels").classList.toggle("is-bundle", boxes.length > 1);
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
}

function renderCollection() {
    const entries = Object.entries(inventory).filter(([id, count]) => count > 0 && ITEM_BY_ID.has(id));
    const totalCopies = entries.reduce((sum, [, count]) => sum + count, 0);
    $("nav-count").textContent = `(${entries.length}/${ALL_ITEMS.length})`;
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
  <div class="rarity">${RARITIES[win.rarity].label}</div></div></div>`,
        )
        .join("");
    $("result").className = "mt-4";
}

// ---- Ouverture
// Fait tourner UNE roulette ; la promesse se résout quand elle est arrêtée.
function spinReel(windowEl, box, win, duration) {
    return new Promise((resolve) => {
        const track = windowEl.querySelector(".track");
        const targetIndex = 29;
        const sequence = Array.from(
            { length: 35 },
            () => box.items[Math.floor(Math.random() * box.items.length)],
        );
        sequence[targetIndex] = win;
        track.innerHTML = sequence.map(itemCard).join("");
        track.style.transition = "none";
        track.style.transform = "translateX(0px)";

        // Mesure après insertion : la largeur des cartes varie selon le breakpoint.
        const windowRect = windowEl.getBoundingClientRect();
        const cardRect = track.children[targetIndex].getBoundingClientRect();
        const finalX = windowRect.left + windowEl.clientWidth / 2 - (cardRect.left + cardRect.width / 2);
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
            track.children[targetIndex]?.classList.add("winner");
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
    const durations = boxes.map((_, i) => SPIN_DURATION_MS + i * 1000);

    try {
        await Promise.all(windows.map((w, i) => spinReel(w, boxes[i], wins[i], durations[i])));

        const now = Date.now();
        wins.forEach((win) => (inventory[win.id] = (inventory[win.id] || 0) + 1));
        history.unshift(
            ...wins.map((win, i) => ({
                itemId: win.id,
                caseId: boxes[i].id,
                bundleId: caseAtOpening.bundle ? caseAtOpening.id : undefined,
                ts: now,
            })),
        );
        history = history.slice(0, MAX_HISTORY);

        const saved = save(); // une seule sauvegarde pour tout le lot
        renderCollection();
        renderHistory();
        renderResult(wins);

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
            "Les gains ont été attribués en mémoire, mais leur affichage ou sauvegarde a rencontré une erreur.";
    } finally {
        $("open-btn").disabled = false;
        $("reset-btn").disabled = false;
        busy = false;
    }
}

// ---- Événements
$("open-btn").addEventListener("click", opencase);
$("odds-modal").addEventListener("show.bs.modal", (event) => {
    const box = CASE_BY_ID.get(event.relatedTarget?.dataset.caseId) ?? selectedcase;
    renderOdds(box);
});
$("reset-btn").addEventListener("click", () => {
    if (busy) return;
    if (!confirm("Effacer la collection et l'historique enregistrés sur cet appareil ?")) return;

    const previousInventory = inventory;
    const previousHistory = history;
    inventory = {};
    history = [];

    const saved = save();
    if (!saved) {
        inventory = previousInventory;
        history = previousHistory;
    }
    renderCollection();
    renderHistory();
    renderSelected();

    $("opening-hint").textContent = saved
        ? "Collection et historique réinitialisés."
        : "Réinitialisation annulée : impossible de sauvegarder la modification.";
    if (!saved) showToast("Réinitialisation impossible : vos données ont été conservées.");
});

validateCases([...CASES, ...LOCKED_CASES]);
rendercases();
renderSelected();
renderCollection();
renderHistory();    