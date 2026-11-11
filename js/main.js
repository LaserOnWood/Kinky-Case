const crates = [
    {
        id: "mystere",
        name: "Caisse Mystère",
        icon: "◈",
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
                id: " sceptre",
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
let inventory = JSON.parse(
    localStorage.getItem("loot_inventory") || "{}",
);
let history = JSON.parse(localStorage.getItem("loot_history") || "[]");
const $ = (id) => document.getElementById(id);
const save = () => {
    localStorage.setItem("loot_inventory", JSON.stringify(inventory));
    localStorage.setItem("loot_history", JSON.stringify(history));
};
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
            ) => `<div class="col-6 col-lg-3"><article class="crate-card ${c.id === selectedCrate.id ? "selected" : ""}" data-id="${c.id}">
 <div class="crate-art">${c.icon}</div><div class="d-flex justify-content-between align-items-center gap-2 mb-2"><span class="fw-semibold">${c.name}</span><span class="tag">5 objets</span></div>
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
    $("result").classList.add("d-none");
    $("opening-hint").textContent =
        "Le résultat est déterminé avant l'animation.";
    $("track").innerHTML = Array.from({ length: 11 }, (_, i) =>
        itemCard(selectedCrate.items[i % selectedCrate.items.length]),
    ).join("");
    $("track").style.transform = "translateX(0px)";
}
function itemCard(item) {
    return `<div class="reel-item"><div class="reel-icon">${item.icon}</div><div class="reel-name">${item.name}</div><div class="rarity ${rarityClass[item.rarity]}">${item.rarity}</div></div>`;
}
function openCrate() {
    if (busy) return;
    busy = true;
    $("open-btn").disabled = true;
    $("result").classList.add("d-none");
    // Le gain est tiré avant l'animation : l'animation ne fait que révéler ce résultat.
    const win = chooseWeighted(selectedCrate.items);
    const track = $("track"),
        windowEl = document.querySelector(".roulette-window");
    const sequence = Array.from(
        { length: 35 },
        (_, i) =>
            selectedCrate.items[
            Math.floor(Math.random() * selectedCrate.items.length)
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
                "transform 5.2s cubic-bezier(.08,.72,.12,1)";
            track.style.transform = `translateX(${finalX}px)`;
        }),
    );
    const finish = () => {
        track.removeEventListener("transitionend", finish);
        inventory[win.id] = (inventory[win.id] || 0) + 1;
        history.unshift({
            name: win.name,
            icon: win.icon,
            rarity: win.rarity,
            crate: selectedCrate.name,
            time: new Date().toLocaleString("fr-FR"),
        });
        history = history.slice(0, 30);
        save();
        renderCollection();
        renderHistory();
        $("result-icon").textContent = win.icon;
        $("result-name").textContent = win.name;
        $("result-rarity").textContent = win.rarity;
        $("result-rarity").className = "rarity " + rarityClass[win.rarity];
        $("result").classList.remove("d-none");
        $("opening-hint").textContent =
            "Récompense ajoutée à la collection commune.";
        $("open-btn").disabled = false;
        busy = false;
        $("toast-message").textContent =
            `${win.name} ajouté à la collection.`;
        bootstrap.Toast.getOrCreateInstance($("toast")).show();
    };
    track.addEventListener("transitionend", finish, { once: true });
    // Fallback if transitionend is not fired (e.g. reduced motion or browser edge case).
    setTimeout(() => {
        if (busy) finish();
    }, 5600);
}
function renderCollection() {
    const entries = Object.entries(inventory).filter(
        ([, count]) => count > 0,
    );
    const allItems = crates.flatMap((c) => c.items);
    $("nav-count").textContent = `(${entries.length})`;
    $("collection-summary").textContent =
        `${entries.reduce((s, [, n]) => s + n, 0)} exemplaire(s)`;
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
    $("history-list").innerHTML = history.length
        ? history
            .slice(0, 12)
            .map(
                (h) =>
                    `<div class="history-row"><div class="history-icon">${h.icon}</div><div class="flex-grow-1"><div class="small fw-semibold">${h.name}</div><div class="small subtle">${h.crate} · ${h.time}</div></div><span class="rarity ${rarityClass[h.rarity]}">${h.rarity}</span></div>`,
            )
            .join("")
        : '<div class="empty">Aucune ouverture enregistrée.</div>';
}
$("open-btn").addEventListener("click", openCrate);
$("reset-btn").addEventListener("click", () => {
    if (!confirm("Effacer la collection et l'historique de cette session ?"))
        return;
    inventory = {};
    history = [];
    save();
    renderCollection();
    renderHistory();
    renderSelected();
});
renderCrates();
renderSelected();
renderCollection();
renderHistory();