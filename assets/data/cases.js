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
            { id: "fesses", name: "Fesses", icon: "💎", rarity: "common", weight: 20 },
            { id: "cuisses", name: "Cuisses", icon: "🪙", rarity: "common", weight: 20 },
            { id: "dos", name: "Dos", icon: "🎭", rarity: "common", weight: 20 },
            { id: "torse", name: "Torse", icon: "👑", rarity: "uncommon", weight: 14 },
            { id: "bras", name: "Bras", icon: "👑", rarity: "uncommon", weight: 14 },
            { id: "pieds", name: "Pieds", icon: "🪵", rarity: "epic", weight: 5 },
            { id: "mains", name: "Mains", icon: "👑", rarity: "epic", weight: 5 },
            { id: "genitales", name: "Genitales", icon: "👑", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "accessoires",
        name: "Caisse Royale",
        image: "./assets/img/cases/royale.webp",
        description: "Des objets précieux et raffinés.",
        items: [
            { id: "paddle", name: "Paddle", icon: "🔰", rarity: "common", weight: 14 },
            { id: "cane", name: "Cane", icon: "📿", rarity: "common", weight: 14 },
            { id: "couteau", name: "Couteau", icon: "🔪", rarity: "common", weight: 14 },
            { id: "martinet", name: "Martinet", icon: "🔷", rarity: "common", weight: 14 },
            { id: "cravache", name: "Cravache", icon: "📿", rarity: "common", weight: 14 },
            { id: "griffe", name: "Griffe", icon: "🔪", rarity: "uncommon", weight: 5 },
            { id: "plume", name: "Plume", icon: "🪶", rarity: "uncommon", weight: 5 },
            { id: "pince", name: "Pince", icon: "🔗", rarity: "uncommon", weight: 5 },
            { id: "fouet", name: "Fouet", icon: "⚜️", rarity: "uncommon", weight: 5 },
            { id: "roulette", name: "Roulette", icon: "👑", rarity: "uncommon", weight: 5 },
            { id: "sansaccessoire", name: "Sans accessoire", icon: "🪞", rarity: "epic", weight: 3.5 },
            { id: "auchoix", name: "Au choix", icon: "🤲", rarity: "legendary", weight: 1.5 },
        ],
    },
    {
        id: "coups",
        name: "Caisse Tech",
        image: "./assets/img/cases/tech.webp",
        description: "Artefacts et curiosités futuristes.",
        items: [
            { id: "20", name: "20", icon: "💠", rarity: "common", weight: 29 },
            { id: "30", name: "30", icon: "💎", rarity: "common", weight: 29 },
            { id: "5", name: "5", icon: "▦", rarity: "rare", weight: 17 },
            { id: "50", name: "50", icon: "🔋", rarity: "rare", weight: 17 },
            { id: "100", name: "100", icon: "🛸", rarity: "epic", weight: 6 },
            { id: "150", name: "150", icon: "💥", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "mobilier",
        name: "Caisse Angelique",
        locked: true,
        image: "./assets/img/cases/angelique.webp",
        description: "Une caisse au contenu unique.",
        items: [
            { id: "pilori", name: "Pilori", icon: "🪑", rarity: "common", weight: 20 },
            { id: "banc", name: "Banc", icon: "🛋️", rarity: "common", weight: 20 },
            { id: "chaise", name: "Chaise", icon: "🪑", rarity: "common", weight: 20 },
            { id: "table", name: "Table", icon: "🛋️", rarity: "common", weight: 20 },
        ],
    },
    {
        id: "bonusmalus",
        name: "Caisse Légendaire",
        locked: true,
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
        image: "./assets/img/cases/mythique.webp",
        description: "Une caisse contenant des objets uniques.",
        items: [
            { id: "debout", name: "Debout", icon: "🏹", rarity: "common", weight: 35 },
            { id: "croix", name: "Croix", icon: "⚔️", rarity: "uncommon", weight: 20 },
            { id: "chaise", name: "Chaise", icon: "🪑", rarity: "uncommon", weight: 20 },
            { id: "genoux", name: "A genoux", icon: "🛡️", rarity: "rare", weight: 13 },
            { id: "quatrepattes", name: "A quatre pattes", icon: "💍", rarity: "epic", weight: 6 },
        ],
    },
];

export const CASES = ALL_CASES.filter((c) => !c.locked);
export const LOCKED_CASES = ALL_CASES.filter((c) => c.locked);