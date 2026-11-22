# Kinky-Case

**Ouvre des caisses. Découvre des récompenses. Construis ta collection.**

Kinky-Case est un mini-jeu web gratuit d'ouverture de caisses virtuelles. Il fonctionne dans le navigateur, sans compte ni achat intégré. Les récompenses sont virtuelles et n'ont aucune valeur réelle ou échangeable.

## Fonctionnalités disponibles

- **Sept entrées visibles par défaut** : cinq caisses simples et deux lots. La Caisse de l'Enfer ouvre quatre caisses simples ; la Caisse du Châtiment en ouvre cinq.
- **39 récompenses disponibles au départ**, réparties sur cinq niveaux de rareté.
- **Probabilités consultables** pour les caisses ouvrables. Les pourcentages sont calculés à partir des mêmes poids que le tirage ; les récompenses d'une même rareté se partagent son taux selon leurs parts.
- **Résultat décidé avant la roulette** : le tirage est effectué et sauvegardé avant la fin de l'animation ; celle-ci ne détermine pas le gain.
- **Collection et historique locaux** : les ouvertures et déblocages sont enregistrés dans le `LocalStorage` de l'appareil utilisé, sans synchronisation ni sauvegarde serveur. Jusqu'à 60 entrées d'historique sont conservées et les 12 plus récentes sont affichées.
- **PWA installable** avec précache des ressources essentielles pour un usage hors ligne après une installation initiale réussie.

### Caisses cachées et verrouillées

Sept caisses cachées sont définies dans le catalogue. Une caisse cachée peut être rendue visible en ajoutant son identifiant à l'URL, sous la forme `?unlock=<id>` ; le déblocage est conservé localement dans le navigateur. La Caisse Spéciale (`position`) et la Caisse Stellaire (`stellaire`) disposent chacune de cinq récompenses définies. Les cinq autres entrées cachées n'ont pas encore d'objets renseignés et ne sont pas prêtes à être ouvertes.

La Caisse de Courage et la Caisse Océanique sont, elles, explicitement verrouillées et ne peuvent pas être ouvertes depuis l'interface actuelle.

Le catalogue et les définitions des caisses sont dans `assets/data/cases.js`. Les calculs de probabilités et le tirage sont dans `js/odds.js` ; l'interface, les ouvertures et la persistance sont gérées par `js/main.js`.

## Données et limites

- La collection, l'historique et les caisses débloquées sont propres au navigateur et à l'appareil utilisés ; aucune donnée n'est synchronisée ni sauvegardée sur un serveur.
- Les navigateurs qui prennent en charge Web Locks sérialisent les écritures entre onglets du même site. Sans cette API, l'application affiche un avertissement et il vaut mieux éviter les modifications simultanées depuis plusieurs onglets.
- Effacer les données du navigateur peut supprimer la collection, l'historique et les déblocages. Le bouton « Réinitialiser les données locales » efface la collection et l'historique après confirmation.
- Le mode hors ligne dépend de l'installation initiale réussie du service worker et de son cache local. Les mises à jour de l'application remplacent le cache précédent.
- Les tirages sont effectués côté navigateur et ne conviennent pas à des récompenses ayant une valeur réelle ou échangeable.

## Lancer localement

Le site est statique. Depuis la racine du dépôt, lancer un serveur HTTP local, par exemple :

```sh
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Un serveur local est nécessaire pour les modules JavaScript et le service worker.

## Tests

Les tests unitaires couvrent le catalogue, les lots, les probabilités et le précache PWA. Les tests navigateur couvrent notamment la navigation au clavier, l'accessibilité, les ouvertures et leur persistance, la réduction des animations, la synchronisation entre onglets et le fonctionnement hors ligne. Le workflow GitHub Actions lance la suite sur Node.js 22 avec Chromium.

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

HTML5, CSS3, JavaScript natif (modules ES), Bootstrap 5.3.3 auto-hébergé, `LocalStorage`, service worker, Playwright et GitHub Actions.

## À propos

Projet personnel indépendant, conçu pour le divertissement autour de récompenses virtuelles. Kinky-Case n'est affilié ni à Valve, ni à Counter-Strike, ni à CS2.
