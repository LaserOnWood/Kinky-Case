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
        image: "./assets/img/cases/amethyste.webp",
        description: "Un assortiment de surprises.",
        rarityWeights: { common: 60, uncommon: 28, epic: 10, legendary: 2 },
        items: [
            { id: "fesses", name: "Fesses", icon: "🍑", rarity: "common" },
            { id: "cuisses", name: "Cuisses", icon: "🦵", rarity: "common" },
            { id: "dos", name: "Dos", icon: "🎭", rarity: "common" },
            { id: "torse", name: "Torse", icon: "👑", rarity: "uncommon" },
            { id: "bras", name: "Bras", icon: "💪", rarity: "uncommon" },
            { id: "pieds", name: "Pieds", icon: "🦶", rarity: "epic" },
            { id: "mains", name: "Mains", icon: "✋", rarity: "epic" },
            { id: "genitales", name: "Génitales", icon: "🌶️🌹", rarity: "legendary" },
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
            { id: "couteau", name: "Couteau", icon: "🗡️", rarity: "common" },
            { id: "martinet", name: "Martinet", icon: "🔷", rarity: "common" },
            { id: "cravache", name: "Cravache", icon: "📿", rarity: "common" },
            { id: "griffe", name: "Griffe", icon: "🔱", rarity: "uncommon" },
            { id: "plume", name: "Plume", icon: "🪶", rarity: "uncommon" },
            { id: "pince", name: "Pince", icon: "🔗", rarity: "uncommon" },
            { id: "fouet", name: "Fouet", icon: "⚜️", rarity: "uncommon" },
            { id: "roulette", name: "Roulette", icon: "⚙️", rarity: "uncommon" },
            { id: "sansaccessoire", name: "Sans accessoire", icon: "🚫", rarity: "epic" },
            { id: "auchoix", name: "Au choix", icon: "🤲", rarity: "legendary" },
        ],
    },
    {
        id: "coups",
        name: "Caisse de la Sentence",
        image: "./assets/img/cases/sentence.webp",
        description: "Une caisse qui marque l'esprit.",
        rarityWeights: { common: 58, rare: 34, epic: 6, legendary: 2 },
        items: [
            { id: "20", name: "20", icon: "2️⃣0️⃣", rarity: "common" },
            { id: "30", name: "30", icon: "3️⃣0️⃣", rarity: "common" },
            { id: "5", name: "5", icon: "5️⃣", rarity: "rare" },
            { id: "50", name: "50", icon: "5️⃣0️⃣", rarity: "rare" },
            { id: "100", name: "100", icon: "🛸", rarity: "epic" },
            { id: "150", name: "150", icon: "💥", rarity: "legendary" },
        ],
    },
    {
        id: "bonusmalus",
        name: "Caisse Légendaire",
        image: "./assets/img/cases/bonusmalus.webp",
        description: "Une sélection de chance ou de malchance.",
        rarityWeights: { common: 99, legendary: 1 },
        items: [
            { id: "diviser2", name: "Divise par 2", resultDescription: "Divise par 2 le nombre de coups à recevoir", icon: "🪨", rarity: "common" },
            { id: "multiplier2", name: "Multiplie par 2", resultDescription: "Multiplie par 2 le nombre de coups à recevoir", icon: "🪶", rarity: "common" },
            { id: "multiplier3", name: "Multiplie par 3", resultDescription: "Multiplie par 3 le nombre de coups à recevoir", icon: "🔮", rarity: "common" },
            { id: "changementZoneCorpsBot", name: "Changement corps Bot", resultDescription: "La zone du corps change au choix du Bottom", icon: "⬇️", rarity: "common" },
            { id: "changementZoneCorpsTop", name: "Changement corps Top", resultDescription: "La zone du corps change au choix du Top", icon: "⬆️", rarity: "common" },
            { id: "partage", name: "Partage", resultDescription: "Partage de la punition", icon: "🫂", rarity: "common" },
            { id: "donne", name: "Don", resultDescription: "Donne ta punition", icon: "🎁", rarity: "common" },
            { id: "changeMain", name: "Changement de mains", resultDescription: "Changement de main", icon: "🔄️", rarity: "common" },
            { id: "yeuxBande", name: "Yeux couverts", resultDescription: "Les yeux sont couverts", icon: "🙈", rarity: "common" },
            { id: "boucheBaillon", name: "Bouche couverte", resultDescription: "La bouche est couverte/bâillonnée", icon: "🙊", rarity: "common" },
            { id: "mainsMenotte", name: "Mains liées", resultDescription: "Les mains sont liées", icon: "🤲", rarity: "common" },
            { id: "inverseRoles", name: "Inversion des rôles", resultDescription: "Inversion des rôles", icon: "🔀", rarity: "common" },
            { id: "relanceBonusMalus", name: "Relance Légendaire", resultDescription: "Relance la Caisse Légendaire", icon: "🍀", rarity: "common" },
            { id: "relanceNombre", name: "Relance Sentence", resultDescription: "Ouvre une nouvelle fois la Caisse de la Sentence", icon: "💯", rarity: "common" },
            { id: "relanceAccessoire", name: "Relance Mystère", resultDescription: "Relance la Caisse Mystère", icon: "❓", rarity: "common" },
            { id: "topCompteur", name: "Dom compte", resultDescription: "Le Dom compte les coups", icon: "💬", rarity: "common" },
            { id: "botCompteur", name: "Sub compte", resultDescription: "Le Sub compte les coups", icon: "🗨️", rarity: "common" },
            { id: "impactSansToucher", name: "Toucher interdit", resultDescription: "Ne touche pas la partie du corps impactée", icon: "🚫", rarity: "common" },
            { id: "doubleCaisse", name: "Double épreuve", resultDescription: "Relance ton épreuve après avoir complété celle-ci", icon: "🔁", rarity: "common" },
            { id: "ajoute20", name: "+ 20", resultDescription: "Ajoute 20 au nombre de coups à recevoir", icon: "2️⃣0️⃣", rarity: "common" },
            { id: "ajoute50", name: "+ 50", resultDescription: "Ajoute 50 au nombre de coups à recevoir", icon: "5️⃣0️⃣", rarity: "common" },
            { id: "retire10", name: "- 10", resultDescription: "Retire 10 au nombre de coups à recevoir", icon: "1️⃣0️⃣", rarity: "common" },
            { id: "retire20", name: "- 20", resultDescription: "Retire 20 au nombre de coups à recevoir", icon: "2️⃣0️⃣", rarity: "common" },
            { id: "joker", name: "Joker", resultDescription: "Tu peux soit garder la caisse sans malus, soit relancer la caisse", icon: "🃏", rarity: "legendary" },
        ],
    },
    {
        id: "enfer",
        name: "Caisse de l'Enfer",
        description: "Lot qui contient les quatre caisses précédentes, tirées en même temps.",
        image: "./assets/img/cases/enfer.webp",
        bundle: ["zonecorp", "accessoires", "coups", "bonusmalus"], // pas de `items`
    },
    {
        id: "mobilier",
        name: "Caisse de Mobilier",
        image: "./assets/img/cases/mobilier.webp",
        description: "Une caisse au contenu unique.",
        rarityWeights: { common: 100 },
        items: [
            { id: "piloriDebout", name: "Pilori debout", icon: "🅿️", rarity: "common" },
            { id: "piloriGenoux", name: "Pilori à genoux", icon: "🅿️", rarity: "common" },
            { id: "piloriQuatrePattes", name: "Pilori à quatre pattes", icon: "🅿️", rarity: "common" },
            { id: "bancAContrainte", name: "Banc à contrainte", icon: "🅱️🔗", rarity: "common" },
            { id: "carcan", name: "Carcan", icon: "🪢", rarity: "common" },
            { id: "chaise", name: "Chaise", icon: "🪑", rarity: "common" },
            { id: "croixStAndre", name: "Croix de Saint-André", icon: "❌", rarity: "common" },
            { id: "sling", name: "Balançoire / Sling", icon: "🪢", rarity: "common" },
        ],
    },
    {
        id: "chatiment",
        name: "Caisse du Châtiment",
        description: "Lot : Caisse de l'Enfer + Caisse de Mobilier, tirées en même temps.",
        image: "./assets/img/cases/angelique.webp",
        bundle: ["zonecorp", "accessoires", "coups", "bonusmalus", "mobilier"], // pas de `items`
    },
    {
        hidden: true,
        id: "biohazard",
        name: "Caisse Biohazard",
        image: "./assets/img/cases/biohazard.webp",
        description: "Une caisse contenant des objets dangereux.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        hidden: true,
        id: "laveNain",
        name: "Caisse Lave Nain",
        image: "./assets/img/cases/laveNain.webp",
        description: "Une caisse contenant des objets en lave.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        hidden: true,
        id: "pierreMaudite",
        name: "Caisse Pierre Maudite",
        image: "./assets/img/cases/pierreMaudite.webp",
        description: "Une caisse contenant des objets en pierre maudite.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "courage",
        name: "Caisse de Courage",
        image: "./assets/img/cases/rainbow.webp",
        locked: true,
        description: "Une caisse contenant des objets inspirants.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
            { id: "epaule", name: "Épaule", icon: "🛡️", rarity: "common" },
            { id: "coeur", name: "Cœur", icon: "❤️", rarity: "uncommon" },
            { id: "main", name: "Main", icon: "✋", rarity: "rare" },
            { id: "esprit", name: "Esprit", icon: "🧠", rarity: "epic" },
            { id: "ame", name: "Âme", icon: "👻", rarity: "legendary" },
        ],
    },
    {
        id: "position",
        name: "Caisse Spéciale",
        hidden: true,
        image: "./assets/img/cases/boisclassique.webp",
        description: "Une caisse contenant des objets uniques.",
        rarityWeights: { common: 35, uncommon: 40, rare: 13, epic: 6 },
        items: [
            { id: "debout", name: "Debout", icon: "🏹", rarity: "common" },
            { id: "croix", name: "Croix", icon: "⚔️", rarity: "uncommon" },
            { id: "surchaise", name: "Chaise", icon: "🪑", rarity: "uncommon" },
            { id: "genoux", name: "À genoux", icon: "🛡️", rarity: "rare" },
            { id: "quatrepattes", name: "À quatre pattes", icon: "💍", rarity: "epic" },
        ],
    },
    {
        id: "ocean",
        name: "Caisse Océanique",
        locked: true,
        image: "./assets/img/cases/ocean.webp",
        description: "Une caisse contenant des objets océaniques.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "egypte",
        name: "Caisse Égyptienne",
        hidden: true,
        image: "./assets/img/cases/egypte.webp",
        description: "Une caisse contenant des objets égyptiens.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "mythique",
        name: "Caisse Mythique",
        hidden: true,
        image: "./assets/img/cases/mythique.webp",
        description: "Une caisse contenant des objets mythiques.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "parchemin",
        name: "Caisse du Parchemin",
        hidden: true,
        image: "./assets/img/cases/parchemin.webp",
        description: "Une caisse contenant des objets anciens.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "legendaire",
        name: "Caisse Légendaire",
        hidden: true,
        image: "./assets/img/cases/legendaire.webp",
        description: "Une caisse contenant des objets légendaires.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "vampire",
        name: "Caisse Vampire",
        hidden: true,
        image: "./assets/img/cases/vampire.webp",
        description: "Une caisse contenant des objets vampiriques.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
        ]
    },
    {
        id: "stellaire",
        name: "Caisse Stellaire",
        hidden: true,
        image: "./assets/img/cases/stellaire.webp",
        description: "Une caisse contenant des objets stellaires.",
        rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
        items: [
            { id: "etoile", name: "Étoile", icon: "⭐", rarity: "common" },
            { id: "planete", name: "Planète", icon: "🪐", rarity: "uncommon" },
            { id: "galaxie", name: "Galaxie", icon: "🌌", rarity: "rare" },
            { id: "univers", name: "Univers", icon: "🌍", rarity: "epic" },
            { id: "cosmos", name: "Cosmos", icon: "🌠", rarity: "legendary" },
        ]
    }
];

export const CASES = ALL_CASES.filter((c) => !c.locked);
export const LOCKED_CASES = ALL_CASES.filter((c) => c.locked);