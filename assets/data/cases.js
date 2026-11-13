// Catalogue du jeu : raretés et caisses.
// Les raretés sont identifiées par un id stable (utilisé aussi comme classe CSS) ;
// le libellé affiché peut changer sans casser les données sauvegardées.
export const RARITIES = {
    common: { label: "Commun" },
    uncommon: { label: "Inhabituel" },
    rare: { label: "Rare" },
    epic: { label: "Épique" },
    legendary: { label: "Légendaire" },
};

// weight = poids relatif. La probabilité affichée vaut weight / somme des poids de la caisse.
const ALL_CASES = [
    {
        id: "zonecorp",
        name: "Caisse Mystère",
        image: "./assets/img/cases/mystere.webp",
        description: "Un assortiment de surprises.",
        items: [
            { id: "fesses", name: "Fesses", icon: "💎", rarity: "common", weight: 15 },
            { id: "cuisses", name: "Cuisses", icon: "🪙", rarity: "common", weight: 15 },
            { id: "dos", name: "Dos", icon: "🎭", rarity: "common", weight: 15 },
            { id: "pieds", name: "Pieds", icon: "🪵", rarity: "uncommon", weight: 10 },
            { id: "bras", name: "Bras", icon: "👑", rarity: "legendary", weight: 2 },
            { id: "mains", name: "Mains", icon: "👑", rarity: "legendary", weight: 2 },
            { id: "torse", name: "Torse", icon: "👑", rarity: "legendary", weight: 2 },
            { id: "genitales", name: "Genitales", icon: "👑", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "accessoires",
        name: "Caisse Royale",
        image: "./assets/img/cases/royale.webp",
        description: "Des objets précieux et raffinés.",
        items: [
            { id: "sceau", name: "Sceau royal", icon: "🔰", rarity: "common", weight: 45 },
            { id: "broche", name: "Broche dorée", icon: "📿", rarity: "uncommon", weight: 30 },
            { id: "saphir", name: "Saphir taillé", icon: "🔷", rarity: "rare", weight: 17 },
            { id: "sceptre", name: "Sceptre solaire", icon: "⚜️", rarity: "epic", weight: 6 },
            { id: "diademe", name: "Diadème impérial", icon: "👑", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "coups",
        name: "Caisse Tech",
        image: "./assets/img/cases/tech.webp",
        description: "Artefacts et curiosités futuristes.",
        items: [
            { id: "5", name: "Circuit imprimé", icon: "▦", rarity: "common", weight: 2 },
            { id: "20", name: "Puce quantique", icon: "💠", rarity: "uncommon", weight: 27 },
            { id: "50", name: "Noyau plasma", icon: "🔋", rarity: "rare", weight: 17 },
            { id: "100", name: "Drone fantôme", icon: "🛸", rarity: "epic", weight: 6 },
            { id: "150", name: "Intelligence originelle", icon: "✧", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "bonusmalus",
        name: "Caisse Légendaire",
        image: "./assets/img/cases/legendaire.webp",
        description: "Une sélection aux chances très rares.",
        items: [
            { id: "pierre", name: "Pierre runique", icon: "🪨", rarity: "common", weight: 42 },
            { id: "plume", name: "Plume céleste", icon: "🪶", rarity: "uncommon", weight: 30 },
            { id: "orbe", name: "Orbe lunaire", icon: "🔮", rarity: "rare", weight: 19 },
            { id: "phoenix", name: "Flamme du phénix", icon: "🔥", rarity: "epic", weight: 7 },
            { id: "relique", name: "Relique éternelle", icon: "🏺", rarity: "legendary", weight: 1 },
        ],
    },
    {
        id: "position",
        name: "Caisse Spéciale",
        locked: true,
        image: "../assets/img/cases/mythique.webp",
        description: "Une caisse contenant des objets uniques.",
        items: [
            { id: "debout", name: "Debout", icon: "🏹", rarity: "common", weight: 45 },
            { id: "croix", name: "Croix", icon: "⚔️", rarity: "uncommon", weight: 30 },
            { id: "genoux", name: "A genoux", icon: "🛡️", rarity: "rare", weight: 17 },
            { id: "quatrepattes", name: "A quatre pattes", icon: "💍", rarity: "epic", weight: 6 },
        ],
    },
];

export const CASES = ALL_CASES.filter((c) => !c.locked);