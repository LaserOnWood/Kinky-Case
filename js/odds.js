// Probabilités par rareté : calcul, tirage et affichage.
// Ce module est la seule source de vérité : le tirage (drawItem) et la modale des
// probabilités (rarityGroups) s'appuient sur le même calcul, donc les pourcentages
// affichés sont toujours ceux du tirage réel.
//
// Modèle de données (voir assets/data/cases.js) :
//   - box.rarityWeights : poids relatif de chaque rareté, par caisse ;
//   - chaque objet appartient à une rareté et peut avoir un `share` optionnel (1 par défaut)
//     qui règle sa part à l'intérieur de sa rareté.
import { RARITIES } from "../assets/data/cases.js";

// Ordre d'affichage : celui de RARITIES (de la plus commune à la plus rare).
const RARITY_ORDER = Object.keys(RARITIES);

const itemShare = (item) => (Number.isFinite(item.share) && item.share > 0 ? item.share : 1);

// Raretés réellement tirables dans la caisse (poids > 0 ET au moins un objet),
// avec leurs objets et leurs pourcentages. Les raretés sans objet sont ignorées :
// les autres sont renormalisées pour que le total fasse toujours 100 %.
export function rarityGroups(box) {
    const weights = box.rarityWeights ?? {};
    const present = RARITY_ORDER.filter(
        (r) => weights[r] > 0 && box.items.some((i) => i.rarity === r),
    );
    const totalWeight = present.reduce((s, r) => s + weights[r], 0);
    return present.map((rarity) => {
        const items = box.items.filter((i) => i.rarity === rarity);
        const totalShare = items.reduce((s, i) => s + itemShare(i), 0);
        const percent = (weights[rarity] / totalWeight) * 100;
        return {
            rarity,
            weight: weights[rarity],
            percent,
            items: items.map((item) => ({
                item,
                share: itemShare(item),
                percent: percent * (itemShare(item) / totalShare),
            })),
        };
    });
}

function pickWeighted(list, getWeight) {
    const total = list.reduce((s, x) => s + getWeight(x), 0);
    let r = Math.random() * total;
    for (const entry of list) {
        r -= getWeight(entry);
        if (r < 0) return entry;
    }
    return list[list.length - 1]; // sécurité contre les arrondis flottants
}

// Tirage en deux temps : d'abord la rareté, puis l'objet dans cette rareté.
export function drawItem(box) {
    const groups = rarityGroups(box);
    if (!groups.length) throw new Error(`Caisse « ${box.id} » : aucune rareté tirable (voir rarityWeights).`);
    const group = pickWeighted(groups, (g) => g.weight);
    return pickWeighted(group.items, (e) => e.share).item;
}

// Affichage uniquement (le tirage garde sa précision complète) :
// 1 décimale au plus, masquée quand le chiffre tombe juste (5 % et non 5,0 %) ;
// 2 décimales sous 1 % pour ne pas arrondir un petit taux en une valeur trompeuse.
const formatOne = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const formatTwo = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
export function formatPercent(value) {
    return `${(value < 1 ? formatTwo : formatOne).format(value)} %`;
}

// Contrôle de cohérence du catalogue : n'écrit que dans la console.
export function validateCases(cases) {
    for (const box of cases) {
        if (!box.items) continue; // les lots (bundle) n'ont pas d'items
        const weights = box.rarityWeights;
        if (!weights) {
            console.warn(`[odds] « ${box.id} » : rarityWeights manquant, la caisse ne pourra pas être ouverte.`);
            continue;
        }
        for (const rarity of Object.keys(weights)) {
            if (!(rarity in RARITIES)) console.warn(`[odds] « ${box.id} » : rareté inconnue « ${rarity} ».`);
            else if (!box.items.some((i) => i.rarity === rarity))
                console.warn(`[odds] « ${box.id} » : la rareté « ${rarity} » n'a aucun objet, son taux est redistribué.`);
        }
        for (const item of box.items) {
            if (!(weights[item.rarity] > 0))
                console.warn(`[odds] « ${box.id} » : « ${item.name} » (${item.rarity}) n'a pas de poids de rareté, il ne sortira jamais.`);
        }
    }
}