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

// Probabilités : chaque caisse définit un poids par RARETÉ (rarityWeights). Ils sont relatifs :
// la chance d'une rareté vaut son poids / somme des poids des raretés présentes dans la caisse
// (une rareté sans objet est ignorée et les autres sont renormalisées).
// Les objets d'une même rareté se partagent à parts égales le taux de leur rareté ;
// un champ optionnel `share` (1 par défaut) permet une répartition inégale à l'intérieur d'une rareté.
// Voir js/odds.js pour le calcul, le tirage et le formatage.
const ALL_CASES = [
    {
        id: "zonecorp",
        name: "Caisse Mystère",
        image: "./assets/img/cases/mystere.webp",
        description: "Un assortiment de surprises.",
        rarityWeights: { common: 60, uncommon: 28, epic: 10, legendary: 2 },
        items: [
            { id: "fesses", name: "Fesses", icon: "💎", rarity: "common" },
            { id: "cuisses", name: "Cuisses", icon: "🪙", rarity: "common" },
            { id: "dos", name: "Dos", icon: "🎭", rarity: "common" },
            { id: "torse", name: "Torse", icon: "👑", rarity: "uncommon" },
            { id: "bras", name: "Bras", icon: "👑", rarity: "uncommon" },
            { id: "pieds", name: "Pieds", icon: "🪵", rarity: "epic" },
            { id: "mains", name: "Mains", icon: "👑", rarity: "epic" },
            { id: "genitales", name: "Genitales", icon: "👑", rarity: "legendary" },
        ],
    },
    {
        id: "accessoires",
        name: "Caisse Royale",
        image: "./assets/img/cases/royale.webp",
        description: "Des objets précieux et raffinés.",
        rarityWeights: { common: 70, uncommon: 25, epic: 3.5, legendary: 1.5 },
        items: [
            { id: "paddle", name: "Paddle", icon: "🔰", rarity: "common" },
            { id: "cane", name: "Cane", icon: "📿", rarity: "common" },
            { id: "couteau", name: "Couteau", icon: "🔪", rarity: "common" },
            { id: "martinet", name: "Martinet", icon: "🔷", rarity: "common" },
            { id: "cravache", name: "Cravache", icon: "📿", rarity: "common" },
            { id: "griffe", name: "Griffe", icon: "🔪", rarity: "uncommon" },
            { id: "plume", name: "Plume", icon: "🪶", rarity: "uncommon" },
            { id: "pince", name: "Pince", icon: "🔗", rarity: "uncommon" },
            { id: "fouet", name: "Fouet", icon: "⚜️", rarity: "uncommon" },
            { id: "roulette", name: "Roulette", icon: "👑", rarity: "uncommon" },
            { id: "sansaccessoire", name: "Sans accessoire", icon: "🪞", rarity: "epic" },
            { id: "auchoix", name: "Au choix", icon: "🤲", rarity: "legendary" },
        ],
    },
    {
        id: "coups",
        name: "Caisse Tech",
        image: "./assets/img/cases/tech.webp",
        description: "Artefacts et curiosités futuristes.",
        rarityWeights: { common: 58, rare: 34, epic: 6, legendary: 2 },
        items: [
            { id: "20", name: "20", icon: "💠", rarity: "common" },
            { id: "30", name: "30", icon: "💎", rarity: "common" },
            { id: "5", name: "5", icon: "▦", rarity: "rare" },
            { id: "50", name: "50", icon: "🔋", rarity: "rare" },
            { id: "100", name: "100", icon: "🛸", rarity: "epic" },
            { id: "150", name: "150", icon: "💥", rarity: "legendary" },
        ],
    },
    {
        id: "bonusmalus",
        name: "Caisse Légendaire",
        image: "./assets/img/cases/bonusmalus.webp",
        description: "Une sélection de chance ou de malchance.",
        rarityWeights: { common: 42, uncommon: 30, rare: 19, epic: 7, legendary: 1 },
        items: [
            { id: "pierrerunique", name: "Pierre runique", icon: "🪨", rarity: "common" },
            { id: "plumeceleste", name: "Plume céleste", icon: "🪶", rarity: "uncommon" },
            { id: "orbe", name: "Orbe lunaire", icon: "🔮", rarity: "rare" },
            { id: "phoenix", name: "Flamme du phénix", icon: "🔥", rarity: "epic" },
            { id: "relique", name: "Relique éternelle", icon: "🏺", rarity: "legendary" },
        ],
    },
    {
        id: "enfer",
        name: "Caisse de L'Enfer",
        description: "Lot qui contient les caisses Mystere + Royale + Tech + Légendaire, le tout tirées en même temps.",
        image: "assets/img/cases/enfer.webp",
        bundle: ["zonecorp", "accessoires", "coups", "bonusmalus"], // pas de `items`
    },
    {
        locked: true,
        id: "test",
        name: "Caisse Test",
        image: "./assets/img/cases/mathematique.webp",
        description: "Une caisse pour tester les probabilités.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "mobilier",
        name: "Caisse de Mobilier",
        image: "./assets/img/cases/mobilier.png",
        description: "Une caisse au contenu unique.",
        rarityWeights: { common: 100 },
        items: [
            { id: "balançoire", name: "Balançoire", icon: "🪢", rarity: "common" },
            { id: "bancAFessée", name: "Banc à fessée", icon: "🛋️", rarity: "common" },
            { id: "bancAContrainte", name: "Banc à contrainte", icon: "🅱️🔗", rarity: "common" },
            { id: "carcan", name: "Carcan", icon: "🪢", rarity: "common" },
            { id: "croixStAndre", name: "Croix de Saint-André", icon: "❌", rarity: "common" },
            { id: "chaise", name: "Chaise", icon: "🪑", rarity: "common" },
            { id: "pilori", name: "Pilori", icon: "🅿️", rarity: "common" },
            { id: "table", name: "Table", icon: "🍽️", rarity: "common" },
        ],
    },
    {
        id: "chatiment",
        name: "Caisse du châtiment",
        description: "Lot Caisse de l'Enfer + Caisse de Mobilier, tirées en meme temps",
        image: "assets/img/cases/angelique.webp",
        bundle: ["zonecorp", "accessoires", "coups", "bonusmalus", "mobilier"], // pas de `items`
    },
    {
        id: "position",
        name: "Caisse Spéciale",
        locked: true,
        image: "./assets/img/cases/mythique.webp",
        description: "Une caisse contenant des objets uniques.",
        rarityWeights: { common: 35, uncommon: 40, rare: 13, epic: 6 },
        items: [
            { id: "debout", name: "Debout", icon: "🏹", rarity: "common" },
            { id: "croix", name: "Croix", icon: "⚔️", rarity: "uncommon" },
            { id: "surchaise", name: "Chaise", icon: "🪑", rarity: "uncommon" },
            { id: "genoux", name: "A genoux", icon: "🛡️", rarity: "rare" },
            { id: "quatrepattes", name: "A quatre pattes", icon: "💍", rarity: "epic" },
        ],
    }
];

export const CASES = ALL_CASES.filter((c) => !c.locked);
export const LOCKED_CASES = ALL_CASES.filter((c) => c.locked);