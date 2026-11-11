import { RARITIES, CASES } from "../assets/data/cases.js";

const MAX_COUNT = 1_000_000_000;
const MAX_HISTORY = 30;
const VISIBLE_HISTORY = 12;

const ALL_ITEMS = CASES.flatMap((c) => c.items);
const ITEM_BY_ID = new Map(ALL_ITEMS.map((i) => [i.id, i]));
const ITEM_BY_NAME = new Map(ALL_ITEMS.map((i) => [i.name, i]));
const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));
const CASE_BY_NAME = new Map(CASES.map((c) => [c.name, c]));
const $ = (id) => document.getElementById(id);

// ---- Formatage (la date est stockée en timestamp, formatée uniquement à l'affichage)
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" });
const percentFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
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

// Ancien format : "11/11/2026 14:32:05" (toLocaleString fr-FR) -> timestamp.
function parseLegacyDate(str) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\D+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(str.trim());
    if (!m) return null;
    const [d, mo, y, h, mi, s] = m.slice(1).map((v) => Number(v ?? 0));
    const t = new Date(y, mo - 1, d, h, mi, s).getTime();
    return Number.isFinite(t) ? t : null;
}

// Nouveau format : { itemId, caseId, ts }
// Ancien format  : { name, icon, rarity, case, time } (migré automatiquement)
function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    let { itemId, caseId, ts } = entry;
    if (itemId === undefined) {
        itemId = ITEM_BY_NAME.get(entry.name)?.id;
        caseId = CASE_BY_NAME.get(entry.case)?.id;
        ts = typeof entry.time === "string" ? parseLegacyDate(entry.time) : null;
    }
    if (!CASE_BY_ID.get(caseId)?.items.some((i) => i.id === itemId)) return null;
    return { itemId, caseId, ts: Number.isFinite(ts) && ts > 0 ? ts : null };
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

function chooseWeighted(items) {
    const total = items.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        r -= item.weight;
        if (r < 0) return item;
    }
    return items[items.length - 1];
}

// ---- Rendu
function rendercases() {
    $("case-grid").innerHTML = CASES.map(
        (c) => `<div class="col-6 col-lg-3"><article class="case-card ${c.id === selectedcase.id ? "selected" : ""}" data-id="${c.id}" data-theme="${c.id}">
 <div class="case-visual"><img src="${c.image}" alt="Illustration ${c.name}" loading="lazy"></div><div class="d-flex justify-content-between align-items-center gap-2 mb-2"><span class="fw-semibold">${c.name}</span><span class="tag">${c.items.length} objets</span></div>
 <div class="small subtle">${c.description}</div></article></div>`,
    ).join("");
    document.querySelectorAll(".case-card").forEach((el) =>
        el.addEventListener("click", () => {
            if (busy) return;
            selectedcase = CASE_BY_ID.get(el.dataset.id);
            rendercases();
            renderSelected();
        }),
    );
}

function itemCard(item) {
    return `<div class="reel-item ${item.rarity}"><div class="reel-icon">${item.icon}</div><div class="reel-name">${item.name}</div><div class="rarity">${RARITIES[item.rarity].label}</div></div>`;
}

function renderSelected() {
    $("selected-title").textContent = selectedcase.name;
    $("selected-case-showcase").dataset.theme = selectedcase.id;
    const img = $("selected-case-image");
    img.src = selectedcase.image;
    img.alt = `Illustration ${selectedcase.name}`;
    $("selected-case-name").textContent = selectedcase.name;
    $("selected-case-description").textContent = selectedcase.description;
    $("result").className = "mt-4 d-none";
    $("opening-hint").textContent = "Le résultat est déterminé avant l'animation.";
    $("track").innerHTML = Array.from({ length: 11 }, (_, i) =>
        itemCard(selectedcase.items[i % selectedcase.items.length]),
    ).join("");
    $("track").style.transform = "translateX(0px)";
}

function renderOdds() {
    const selected = selectedcase;
    const total = selected.items.reduce((s, i) => s + i.weight, 0);
    $("odds-title").textContent = selected.name;
    $("odds-body").innerHTML = selected.items
        .map((i) => `<tr class="${i.rarity}"><td>${i.icon} ${i.name}</td><td><span class="rarity m-0">${RARITIES[i.rarity].label}</span></td><td class="text-end">${percentFormat.format((i.weight / total) * 100)} %</td></tr>`)
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
        meta.textContent = `${box.name} · ${formatDate(entry.ts)}`;
        details.append(name, meta);

        const rarity = document.createElement("span");
        rarity.className = `rarity ${item.rarity} `;
        rarity.textContent = RARITIES[item.rarity].label;

        row.append(icon, details, rarity);
        container.appendChild(row);
    });
}

// ---- Ouverture
function opencase() {
    if (busy) return;
    busy = true;
    $("open-btn").disabled = true;
    $("reset-btn").disabled = true;
    $("result").classList.add("d-none");
    // Retire l'animation précédente pour qu'elle puisse se rejouer à chaque gain.
    $("result").querySelector(".text-center").classList.remove("result-reveal");

    // Le gain est tiré avant l'animation : elle ne fait que le révéler.
    const caseAtOpening = selectedcase;
    const win = chooseWeighted(caseAtOpening.items);
    const track = $("track");
    const windowEl = document.querySelector(".roulette-window");
    const targetIndex = 29;
    const sequence = Array.from(
        { length: 35 },
        () => caseAtOpening.items[Math.floor(Math.random() * caseAtOpening.items.length)],
    );
    sequence[targetIndex] = win;
    track.innerHTML = sequence.map(itemCard).join("");
    track.style.transition = "none";
    track.style.transform = "translateX(0px)";

    // Mesure la vraie carte après insertion : sa largeur varie selon le breakpoint CSS.
    const windowRect = windowEl.getBoundingClientRect();
    const cardRect = track.children[targetIndex].getBoundingClientRect();
    const finalX = windowRect.left + windowEl.clientWidth / 2 - (cardRect.left + cardRect.width / 2);
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            track.style.transition = "transform 6.1s cubic-bezier(.055,.72,.12,1)";
            track.style.transform = `translateX(${finalX}px)`;
        }),
    );

    let finished = false;
    const finish = () => {
        // transitionend et le timeout de secours peuvent se doubler : on n'attribue le gain qu'une fois.
        if (finished) return;
        finished = true;
        track.removeEventListener("transitionend", onTransitionEnd);
        try {
            track.children[targetIndex]?.classList.add("winner");

            inventory[win.id] = (inventory[win.id] || 0) + 1;
            history.unshift({ itemId: win.id, caseId: caseAtOpening.id, ts: Date.now() });
            history = history.slice(0, MAX_HISTORY);

            const saved = save();
            renderCollection();
            renderHistory();

            const label = RARITIES[win.rarity].label;
            $("result-icon").textContent = win.icon;
            $("result-name").textContent = win.name;
            $("result-rarity").textContent = label;
            $("result-rarity").className = "rarity";
            $("result").className = `mt-4 ${win.rarity}`;
            $("result").querySelector(".text-center").classList.add("result-reveal");

            $("opening-hint").textContent = saved
                ? "Récompense ajoutée à votre collection sur cet appareil."
                : "Gain obtenu, mais sauvegarde impossible. Ne fermez pas cette page avant d'avoir réessayé.";
            showToast(saved ? `${win.name} ajouté à votre collection.` : `${win.name} obtenu, mais non sauvegardé.`);
        } catch (error) {
            console.error("Une erreur est survenue à la fin de l'ouverture.", error);
            $("opening-hint").textContent =
                "Le gain a été attribué en mémoire, mais son affichage ou sa sauvegarde a rencontré une erreur.";
        } finally {
            $("open-btn").disabled = false;
            $("reset-btn").disabled = false;
            busy = false;
        }
    };
    const onTransitionEnd = (event) => {
        if (event.target === track && event.propertyName === "transform") finish();
    };
    track.addEventListener("transitionend", onTransitionEnd);
    setTimeout(finish, 6500); // secours si transitionend ne se déclenche pas
}

// ---- Événements
$("open-btn").addEventListener("click", opencase);
$("odds-modal").addEventListener("show.bs.modal", renderOdds);
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

rendercases();
renderSelected();
renderCollection();
renderHistory();