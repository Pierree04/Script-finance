# Script Finance — Suivi de patrimoine personnel

Application web de suivi de patrimoine personnel dans l'esprit de Finary, mais
**100 % en saisie manuelle** : aucune connexion bancaire, aucune API externe,
aucun agrégateur. **Vos données ne quittent jamais votre machine** : tout est
stocké localement dans le navigateur (IndexedDB).

Interface en français, devise par défaut **euro (€)**, formats de nombres et
dates à la française.

## Fonctionnalités

- **Catégories d'actifs** (contexte français) : Liquidités (Livret A, LDDS,
  LEP…), Bourse (PEA, PEA-PME, CTO), Crypto, Assurance-vie, Épargne retraite
  (PER), Immobilier (avec crédit restant dû pour la valeur nette), Autres
  actifs, et Passifs / Dettes.
- **Tableau de bord** : patrimoine net total, répartition des actifs en
  graphique anneau (donut) + tableau avec montants et pourcentages, top des
  lignes, carte par catégorie, plus/moins-value latente sur la partie investie.
- **Suivi dans le temps** : bouton « Figer la valeur du jour » (snapshot) et
  courbe d'évolution du patrimoine net. Chaque snapshot archive aussi le détail
  par catégorie. Suppression possible d'un snapshot erroné.
- **Gestion des données** : formulaires avec validation, **export / import
  JSON** (avec contrôle du format), chargement d'un **jeu de données d'exemple**,
  et **réinitialisation** complète (avec confirmation).
- **Design** : interface moderne et sobre, **mode clair / sombre** (préférence
  mémorisée), responsive, couleurs vert/rouge cohérentes pour les plus/moins-values.

## Stack technique

- **React + TypeScript** (mode `strict`) avec **Vite**
- **Tailwind CSS** pour le style
- **Recharts** pour les graphiques
- **IndexedDB** via la librairie **idb** (stockage 100 % local)
- **Zustand** pour la gestion d'état
- **lucide-react** pour les icônes
- **react-router-dom** pour la navigation
- **Vitest** pour les tests, **ESLint + Prettier** pour la qualité du code

## Prérequis

- Node.js 18 ou supérieur (recommandé : 20+)
- npm

## Installation et lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement (http://localhost:5173)
npm run dev
```

## Scripts disponibles

| Commande            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Démarre le serveur de développement (Vite).          |
| `npm run build`     | Vérifie les types (`tsc`) puis build de production.  |
| `npm run preview`   | Prévisualise le build de production.                 |
| `npm run lint`      | Lance ESLint (zéro warning toléré).                  |
| `npm run format`    | Formate le code avec Prettier.                       |
| `npm run typecheck` | Vérifie les types sans émettre de fichiers.          |
| `npm run test`      | Lance les tests unitaires (Vitest).                  |

## Premier démarrage

Au premier lancement, l'application est vide. Deux options :

1. Saisir vos lignes manuellement via la navigation latérale (Bourse, Crypto,
   Immobilier, etc.).
2. Aller dans **Réglages → Données d'exemple → « Charger les données
   d'exemple »** pour explorer l'app avec un jeu de démonstration (effaçable via
   la réinitialisation).

## Sauvegarder et restaurer vos données

Comme tout est stocké **uniquement dans votre navigateur**, pensez à exporter
régulièrement une sauvegarde, surtout avant de vider le cache du navigateur ou
de changer d'appareil.

- **Exporter** : `Réglages → Sauvegarde et restauration → « Exporter (JSON) »`.
  Un fichier `script-finance-sauvegarde-AAAA-MM-JJ.json` est téléchargé.
- **Importer / restaurer** : `Réglages → « Importer (JSON) »`, sélectionnez un
  fichier de sauvegarde. Le format est validé avant import ; un message d'erreur
  explicite s'affiche si le fichier est invalide. **L'import remplace
  l'intégralité des données actuelles** (une confirmation est demandée).
- **Réinitialiser** : `Réglages → Réinitialisation → « Tout réinitialiser »`
  efface définitivement toutes les données locales (confirmation requise).

## Où sont stockées les données ?

Dans la base **IndexedDB** `script-finance` de votre navigateur, sur votre
machine. Aucune donnée n'est envoyée sur un serveur. Conséquence : les données
sont propres à un navigateur et un appareil donnés. Utilisez l'export/import
JSON pour les transférer ou les sauvegarder.

## Structure du projet

```
src/
├── types/            # Modèle de données (types TypeScript)
├── lib/              # Logique pure : calculs, formatage, parsing,
│                     #   IndexedDB (db.ts), backup JSON, constantes, données d'exemple
├── store/            # Store Zustand (état + actions, synchro IndexedDB)
├── components/
│   ├── layout/       # Sidebar, barre supérieure, bascule de thème
│   ├── ui/           # Composants réutilisables (modale, champs, etc.)
│   ├── charts/       # Donut d'allocation, courbe d'évolution
│   └── assets/       # Tableau, formulaire et page générique de catégorie
├── pages/            # Une page par écran (tableau de bord, catégories, etc.)
└── __tests__/        # Tests unitaires (calculs, parsing, sérialisation)
```

Les **calculs financiers** (valeur d'une ligne, plus-value latente, patrimoine
net, pourcentages d'allocation) sont centralisés dans `src/lib/calculations.ts`,
implémentés une seule fois et couverts par des tests unitaires.

## Tests

```bash
npm run test
```

Les tests couvrent les fonctions de calcul financier (valeurs, plus/moins-values,
patrimoine net, cas limites comme les listes vides, `NaN` et division par zéro),
le parsing des saisies numériques à la française, ainsi que l'aller-retour
export / import JSON sans perte de données.

## Limites connues

- Les données sont **locales au navigateur** : vider les données du navigateur
  les supprime. Faites des exports réguliers.
- Les cours (actions, ETF, crypto) sont **saisis manuellement** : aucune mise à
  jour automatique (c'est volontaire).
- Le bundle de production inclut Recharts, ce qui génère un avertissement de
  taille de chunk au build ; cela n'affecte pas le fonctionnement.
