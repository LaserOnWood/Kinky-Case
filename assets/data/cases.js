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
export const CASES = [
    {
        id: "mystere",
        name: "Caisse Mystère",
        image: "./assets/img/cases/mystere.webp",
        description: "Un assortiment de surprises.",
        items: [
            { id: "bois", name: "Paddle", icon: "🪵", rarity: "common", weight: 48 },
            { id: "jeton", name: "Jeton ancien", icon: "🪙", rarity: "uncommon", weight: 28 },
            { id: "cristal", name: "Cristal brumeux", icon: "💎", rarity: "rare", weight: 16 },
            { id: "masque", name: "Masque astral", icon: "🎭", rarity: "epic", weight: 6 },
            { id: "couronne", name: "Couronne oubliée", icon: "👑", rarity: "legendary", weight: 2 },
            { id: "couronne", name: "Couronne oubliée", icon: "👑", rarity: "legendary", weight: 2 },
            { id: "couronne", name: "Couronne oubliée", icon: "👑", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "royale",
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
        id: "tech",
        name: "Caisse Tech",
        image: "./assets/img/cases/tech.webp",
        description: "Artefacts et curiosités futuristes.",
        items: [
            { id: "circuit", name: "Circuit imprimé", icon: "▦", rarity: "common", weight: 48 },
            { id: "puce", name: "Puce quantique", icon: "💠", rarity: "uncommon", weight: 27 },
            { id: "noyau", name: "Noyau plasma", icon: "🔋", rarity: "rare", weight: 17 },
            { id: "drone", name: "Drone fantôme", icon: "🛸", rarity: "epic", weight: 6 },
            { id: "ia", name: "Intelligence originelle", icon: "✧", rarity: "legendary", weight: 2 },
        ],
    },
    {
        id: "legendaire",
        name: "Caisse Légendaire",
        image: "./assets/img/cases/legendaire.webp",
        description: "Une sélection aux chances très rares.",
        items: [
            { id: "pierre", name: "Pierre runique", icon: "🪨", rarity: "common", weight: 42 },
            { id: "plume", name: "Plume céleste", icon: "🪶", rarity: "uncommon", weight: 30 },
            { id: "orbe", name: "Orbe lunaire", icon: "🔮", rarity: "rare", weight: 19 },
            { id: "phoenix", name: "Flamme du phénix", icon: "🔥", rarity: "epic", weight: 7 },
            { id: "relique", name: "Relique éternelle", icon: "🏺", rarity: "legendary", weight: 2 },
        ],
    },
    //{
    //  id: "special",
    //  name: "Caisse Spéciale",
    //  image: "../assets/img/cases/special.png",
    //  description: "Une caisse contenant des objets uniques.",
    //  items: [
    //      { id: "arc", name: "Arc divin", icon: "🏹", rarity: "common", weight: 45 },
    //      { id: "epee", name: "Épée sacrée", icon: "⚔️", rarity: "uncommon", weight: 30 },
    //      { id: "bouclier", name: "Bouclier mythique", icon: "🛡️", rarity: "rare", weight: 17 },
    //      { id: "anneau", name: "Anneau de puissance", icon: "💍", rarity: "epic", weight: 6 },
    //      { id: "amulette", name: "Amulette de sagesse", icon: "📿", rarity: "legendary", weight: 2 },
    //  ],
    //},
];