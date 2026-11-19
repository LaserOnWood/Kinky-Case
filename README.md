# Kinky-Case

**Ouvre des caisses. Découvre des récompenses. Construis ta collection.**

Kinky-Case est un mini-jeu privé et gratuit d'ouverture de caisses virtuelles. Les ouvertures sont gratuites et illimitées; il n'y a ni compte joueur ni achat intégré.

## Fonctionnalités

- **Sept caisses ouvrables** : cinq caisses à contenu individuel et deux lots qui ouvrent plusieurs caisses en une fois.
- **39 récompenses distinctes** réparties sur cinq niveaux de rareté.
- **Probabilités visibles** : les pourcentages affichés sont calculés à partir des mêmes poids que le tirage.
- **Collection et historique** conservés localement sur l'appareil utilisé.
- **Application web installable** avec précache des ressources essentielles pour un usage hors ligne après une première installation réussie.
- **Coffres verrouillés** : Courage, Spéciale et Test sont des emplacements de contenu futur, et ne peuvent pas encore être ouverts.

Les lots disponibles sont la **Caisse de l'Enfer** (quatre caisses) et la **Caisse du Châtiment** (cinq caisses). Le catalogue de référence est `assets/data/cases.js`; le calcul des probabilités et le tirage sont dans `js/odds.js`.

## Données et limites

- La collection et l'historique sont stockés dans le `LocalStorage` du navigateur. Ils ne sont ni synchronisés entre appareils ni sauvegardés sur un serveur.
- Les données sont enregistrées avant l'animation de révélation; celle-ci ne détermine pas le résultat.
- Les navigateurs qui proposent Web Locks sérialisent les écritures entre onglets du même site. Sans cette API, l'application affiche un avertissement et il vaut mieux éviter les modifications simultanées depuis plusieurs onglets.
- Effacer les données du navigateur peut supprimer la collection et l'historique. Le bouton « Réinitialiser les données locales » efface ces deux éléments après confirmation.
- Le mode hors ligne dépend du cache du navigateur et de l'installation initiale du service worker. Les mises à jour de l'application remplacent le cache précédent.
- Les tirages ont lieu côté navigateur; ils ne conviennent pas à des récompenses ayant une valeur réelle ou échangeable.

## Lancer localement

Le site est statique. Depuis la racine du dépôt, lancer un serveur HTTP local, par exemple :

```sh
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Un serveur local est nécessaire pour les modules JavaScript et le service worker.

## Tests

Les tests unitaires vérifient le catalogue, les probabilités et le précache PWA. Les tests navigateur couvrent le clavier, l'accessibilité, la persistance avant animation, la réduction des animations, la synchronisation entre onglets et les données locales aux limites.

Prérequis : Node.js 22 ou plus récent, Python 3 et Chromium (ou installer Chromium via Playwright).

```sh
npm ci
npx playwright install chromium
npm test
```

Pour utiliser un binaire Chromium déjà installé à un autre emplacement :

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

## Technologies

HTML5, CSS3, JavaScript natif (modules ES), Bootstrap 5.3.3 auto-hébergé, LocalStorage, Service Worker et Playwright pour les tests navigateur.

## À propos

Projet personnel et privé, développé pour le divertissement et la collection de récompenses virtuelles. Kinky-Case est un projet indépendant, non affilié à Valve, Counter-Strike ou CS2.
