const crates = [
    {
        id: "mystere",
        name: "Caisse Mystère",
        icon: "◈",
        image: "assets/crates/mystere.webp",
        description: "Un assortiment de surprises.",
        items: [
            {
                id: "bois",
                name: "Relique de bois",
                icon: "🪵",
                rarity: "Commun",
                weight: 48,
            },
            {
                id: "jeton",
                name: "Jeton ancien",
                icon: "🪙",
                rarity: "Inhabituel",
                weight: 28,
            },
            {
                id: "cristal",
                name: "Cristal brumeux",
                icon: "💎",
                rarity: "Rare",
                weight: 16,
            },
            {
                id: "masque",
                name: "Masque astral",
                icon: "🎭",
                rarity: "Épique",
                weight: 6,
            },
            {
                id: "couronne",
                name: "Couronne oubliée",
                icon: "👑",
                rarity: "Légendaire",
                weight: 2,
            },
        ],
    },
    {
        id: "royale",
        name: "Caisse Royale",
        icon: "♛",
        image: "assets/crates/royale.webp",
        description: "Des objets précieux et raffinés.",
        items: [
            {
                id: "sceau",
                name: "Sceau royal",
                icon: "🔰",
                rarity: "Commun",
                weight: 45,
            },
            {
                id: "broche",
                name: "Broche dorée",
                icon: "📿",
                rarity: "Inhabituel",
                weight: 30,
            },
            {
                id: "saphir",
                name: "Saphir taillé",
                icon: "🔷",
                rarity: "Rare",
                weight: 17,
            },
            {
                id: "sceptre",
                name: "Sceptre solaire",
                icon: "⚜️",
                rarity: "Épique",
                weight: 6,
            },
            {
                id: "diademe",
                name: "Diadème impérial",
                icon: "👑",
                rarity: "Légendaire",
                weight: 2,
            },
        ],
    },
    {
        id: "tech",
        name: "Caisse Tech",
        icon: "⌘",
        image: "assets/crates/tech.webp",
        description: "Artefacts et curiosités futuristes.",
        items: [
            {
                id: "circuit",
                name: "Circuit imprimé",
                icon: "▦",
                rarity: "Commun",
                weight: 48,
            },
            {
                id: "puce",
                name: "Puce quantique",
                icon: "💠",
                rarity: "Inhabituel",
                weight: 27,
            },
            {
                id: "noyau",
                name: "Noyau plasma",
                icon: "🔋",
                rarity: "Rare",
                weight: 17,
            },
            {
                id: "drone",
                name: "Drone fantôme",
                icon: "🛸",
                rarity: "Épique",
                weight: 6,
            },
            {
                id: "ia",
                name: "Intelligence originelle",
                icon: "✧",
                rarity: "Légendaire",
                weight: 2,
            },
        ],
    },
    {
        id: "legendaire",
        name: "Caisse Légendaire",
        icon: "✦",
        image: "assets/crates/legendaire.webp",
        description: "Une sélection aux chances très rares.",
        items: [
            {
                id: "pierre",
                name: "Pierre runique",
                icon: "🪨",
                rarity: "Commun",
                weight: 42,
            },
            {
                id: "plume",
                name: "Plume céleste",
                icon: "🪶",
                rarity: "Inhabituel",
                weight: 30,
            },
            {
                id: "orbe",
                name: "Orbe lunaire",
                icon: "🔮",
                rarity: "Rare",
                weight: 19,
            },
            {
                id: "phoenix",
                name: "Flamme du phénix",
                icon: "🔥",
                rarity: "Épique",
                weight: 7,
            },
            {
                id: "relique",
                name: "Relique éternelle",
                icon: "🏺",
                rarity: "Légendaire",
                weight: 2,
            },
        ],
    },
];
const rarityClass = {
    Commun: "common",
    Inhabituel: "uncommon",
    Rare: "rare",
    Épique: "epic",
    Légendaire: "legendary",
};
let selectedCrate = crates[0],
    busy = false;
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
    const validIds = new Set(crates.flatMap((crate) => crate.items.map((item) => item.id)));
    const clean = {};
    for (const [storedId, count] of Object.entries(raw)) {
        // Preserve collections saved before the "sceptre" identifier was corrected.
        const id = storedId === " sceptre" ? "sceptre" : storedId;
        if (
            validIds.has(id) &&
            Number.isSafeInteger(count) &&
            count > 0 &&
            count <= 1000000000
        ) {
            const combined = (clean[id] || 0) + count;
            if (Number.isSafeInteger(combined) && combined <= 1000000000) {
                clean[id] = combined;
            }
        }
    }
    return clean;
}

function sanitizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    const itemByName = new Map(
        crates.flatMap((crate) => crate.items.map((item) => [item.name, item])),
    );
    const crateNames = new Set(crates.map((crate) => crate.name));
    return raw
        .filter((entry) =>
            entry &&
            typeof entry === "object" &&
            !Array.isArray(entry) &&
            typeof entry.name === "string" &&
            typeof entry.icon === "string" &&
            typeof entry.rarity === "string" &&
            typeof entry.crate === "string" &&
            typeof entry.time === "string" &&
            entry.time.length <= 100
        )
        .filter((entry) => {
            const item = itemByName.get(entry.name);
            return item &&
                crateNames.has(entry.crate) &&
                item.icon === entry.icon &&
                item.rarity === entry.rarity;
        })
        .slice(0, 30)
        .map((entry) => ({
            name: entry.name,
            icon: entry.icon,
            rarity: entry.rarity,
            crate: entry.crate,
            time: entry.time,
        }));
}

let inventory = sanitizeInventory(loadStoredJSON("loot_inventory", {}));
let history = sanitizeHistory(loadStoredJSON("loot_history", []));
const $ = (id) => document.getElementById(id);

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
        // If the second write fails, try to restore the previous pair of values.
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
    const messageElement = $("toast-message");
    if (messageElement) messageElement.textContent = message;

    if (window.bootstrap?.Toast) {
        window.bootstrap.Toast.getOrCreateInstance($("toast")).show();
    }
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
function renderCrates() {
    $("crate-grid").innerHTML = crates
        .map(
            (
                c,
            ) => `<div class="col-6 col-lg-3"><article class="crate-card ${c.id === selectedCrate.id ? "selected" : ""}" data-id="${c.id}" data-theme="${c.id}">
 <div class="crate-visual"><img src="${c.image}" alt="Illustration ${c.name}" loading="lazy"></div><div class="d-flex justify-content-between align-items-center gap-2 mb-2"><span class="fw-semibold">${c.name}</span><span class="tag">5 objets</span></div>
 <div class="small subtle">${c.description}</div></article></div>`,
        )
        .join("");
    document.querySelectorAll(".crate-card").forEach((el) =>
        el.addEventListener("click", () => {
            if (busy) return;
            selectedCrate = crates.find((c) => c.id === el.dataset.id);
            renderCrates();
            renderSelected();
        }),
    );
}
function renderSelected() {
    $("selected-title").textContent = selectedCrate.name;
    $("selected-crate-showcase").dataset.theme = selectedCrate.id;
    const selectedImage = $("selected-crate-image");
    selectedImage.src = selectedCrate.image;
    selectedImage.alt = `Illustration ${selectedCrate.name}`;
    $("selected-crate-name").textContent = selectedCrate.name;
    $("selected-crate-description").textContent = selectedCrate.description;
    $("result").classList.add("d-none");
    $("result").className = "mt-4 d-none";
    $("opening-hint").textContent =
        "Le résultat est déterminé avant l'animation.";
    $("track").innerHTML = Array.from({ length: 11 }, (_, i) =>
        itemCard(selectedCrate.items[i % selectedCrate.items.length]),
    ).join("");
    $("track").style.transform = "translateX(0px)";
}
function itemCard(item) {
    return `<div class="reel-item ${rarityClass[item.rarity]}"><div class="reel-icon">${item.icon}</div><div class="reel-name">${item.name}</div><div class="rarity ${rarityClass[item.rarity]}">${item.rarity}</div></div>`;
}
function openCrate() {
    if (busy) return;
    busy = true;
    $("open-btn").disabled = true;
    $("reset-btn").disabled = true;
    $("result").classList.add("d-none");
    // Le gain est tiré avant l'animation : l'animation ne fait que révéler ce résultat.
    const crateAtOpening = selectedCrate;
    const win = chooseWeighted(crateAtOpening.items);
    const track = $("track"),
        windowEl = document.querySelector(".roulette-window");
    const sequence = Array.from(
        { length: 35 },
        (_, i) =>
            crateAtOpening.items[
            Math.floor(Math.random() * crateAtOpening.items.length)
            ],
    );
    sequence[29] = win;
    track.innerHTML = sequence.map(itemCard).join("");
    const targetIndex = 29;
    track.style.transition = "none";
    track.style.transform = "translateX(0px)";

    // Mesure la vraie carte après son insertion : sa largeur peut varier
    // selon le breakpoint CSS (notamment sur les écrans mobiles).
    const targetCard = track.children[targetIndex];
    const windowRect = windowEl.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const center = windowRect.left + windowEl.clientWidth / 2;
    const cardCenter = cardRect.left + cardRect.width / 2;
    const finalX = center - cardCenter;
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            track.style.transition =
                "transform 6.1s cubic-bezier(.055,.72,.12,1)";
            track.style.transform = `translateX(${finalX}px)`;
        }),
    );
    let finished = false;
    const finish = () => {
        // transitionend and the timeout fallback can race; award this opening once only.
        if (finished) return;
        finished = true;
        track.removeEventListener("transitionend", onTransitionEnd);

        try {
            const winningCard = track.children[targetIndex];
            if (winningCard) winningCard.classList.add("winner", rarityClass[win.rarity]);

            inventory[win.id] = (inventory[win.id] || 0) + 1;
            history.unshift({
                name: win.name,
                icon: win.icon,
                rarity: win.rarity,
                crate: crateAtOpening.name,
                time: new Date().toLocaleString("fr-FR"),
            });
            history = history.slice(0, 30);

            const saved = save();
            renderCollection();
            renderHistory();

            $("result-icon").textContent = win.icon;
            $("result-name").textContent = win.name;
            $("result-rarity").textContent = win.rarity;
            $("result-rarity").className = "rarity " + rarityClass[win.rarity];
            $("result").className = "mt-4 rarity-" + rarityClass[win.rarity];
            $("result").classList.remove("d-none");
            $("result").querySelector(".text-center").classList.add("result-reveal");

            $("opening-hint").textContent = saved
                ? "Récompense ajoutée à votre collection sur cet appareil."
                : "Gain obtenu, mais sauvegarde impossible. Ne fermez pas cette page avant d'avoir réessayé.";
            showToast(saved
                ? `${win.name} ajouté à votre collection.`
                : `${win.name} obtenu, mais non sauvegardé.`);
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
    // Fallback if transitionend is not fired (e.g. reduced motion or browser edge case).
    setTimeout(finish, 6500);
}
function renderCollection() {
    const entries = Object.entries(inventory).filter(
        ([, count]) => count > 0,
    );
    const allItems = crates.flatMap((c) => c.items);
    const totalCopies = entries.reduce((sum, [, count]) => sum + count, 0);
    $("nav-count").textContent = `(${entries.length}/${allItems.length})`;
    $("collection-summary").textContent =
        `${entries.length} objet(s) découvert(s) · ${totalCopies} exemplaire(s)`;
    if (!entries.length) {
        $("collection-grid").innerHTML =
            '<div class="col-12"><div class="panel empty">Aucune récompense pour le moment. À vous de faire la première ouverture.</div></div>';
        return;
    }
    $("collection-grid").innerHTML = entries
        .map(([id, count]) => {
            const item = allItems.find((x) => x.id === id);
            if (!item) return "";
            return `<div class="col-6 col-md-4 col-lg-3"><div class="reward-card"><div class="reward-icon">${item.icon}</div><div class="fw-semibold small">${item.name}</div><div class="rarity ${rarityClass[item.rarity]}">${item.rarity}</div><div class="small subtle mt-2">Quantité : ×${count}</div></div></div>`;
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

    history.slice(0, 12).forEach((entry) => {
        const row = document.createElement("div");
        row.className = "history-row";

        const icon = document.createElement("div");
        icon.className = "history-icon";
        icon.textContent = entry.icon;

        const details = document.createElement("div");
        details.className = "flex-grow-1";

        const name = document.createElement("div");
        name.className = "small fw-semibold";
        name.textContent = entry.name;

        const metadata = document.createElement("div");
        metadata.className = "small subtle";
        metadata.textContent = `${entry.crate} · ${entry.time}`;

        const rarity = document.createElement("span");
        rarity.className = `rarity ${rarityClass[entry.rarity]}`;
        rarity.textContent = entry.rarity;

        details.append(name, metadata);
        row.append(icon, details, rarity);
        container.appendChild(row);
    });
}
$("open-btn").addEventListener("click", openCrate);
$("reset-btn").addEventListener("click", () => {
    // Also guard the handler itself: a disabled button is not the only protection.
    if (busy) return;
    if (!confirm("Effacer la collection et l'historique enregistrés sur cet appareil ?"))
        return;

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
renderCrates();
renderSelected();
renderCollection();
renderHistory();