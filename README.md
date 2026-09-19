# Voir la Lune 🌙

Une application pédagogique en français pour explorer les phases lunaires depuis un lieu, une date et une heure choisis.

Le parcours relie trois notions : **votre point de vue**, **la lumière du Soleil** et **la phase visible**. Une scène Terre–Lune–Soleil accompagne une vue du disque lunaire orientée pour l’observateur et une frise permettant de parcourir le mois lunaire.

## Fonctionnalités

- Choix du lieu par recherche de ville, clic sur le globe ou saisie de coordonnées.
- Sélection de la date et de l’heure dans le fuseau du lieu choisi.
- Calcul de la phase, de la fraction éclairée, de l’altitude, de l’azimut et du prochain lever de Lune recherché dans les trois jours suivants.
- Éclairage continu du disque lunaire et orientation selon le point de vue de l’observateur.
- Navigation dans la lunaison, repères de phases et lecture animée.
- Interface adaptée aux ordinateurs, tablettes et mobiles.

Les calculs astronomiques s’effectuent dans le navigateur. L’application ne nécessite ni compte, ni base de données, ni clé d’API.

## Lancer le projet

Prérequis : **Node.js 22.12 ou supérieur**, npm et un navigateur récent compatible WebGL.

Depuis le dossier du projet :

```sh
npm ci
npm run dev
```

Ouvrir l’adresse indiquée par Vite dans le terminal, généralement `http://localhost:5173`. Si ce port est occupé, Vite en utilise un autre.

Aucun fichier `.env` n’est nécessaire pour la configuration actuelle.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev` | Démarrer le serveur de développement. |
| `npm run check` | Vérifier les types TypeScript. |
| `npm test` | Exécuter les tests Vitest des calculs et des composants. |
| `npm run build` | Produire l’application et les fichiers de compatibilité Sites dans `dist/`. |
| `npm run preview` | Prévisualiser localement la dernière compilation. |
| `npm run test:sites` | Vérifier l’adaptateur de fichiers statiques et les artefacts compilés. |

Pour valider une modification :

```sh
npm run check
npm test
npm run build
npm run test:sites
```

La compilation doit précéder `test:sites`, qui vérifie aussi les fichiers générés.

Pour une vérification visuelle reproductible, ajouter `?qa=1` à l’URL locale : l’application s’ouvre à la troisième étape, à Paris le **18 août 2026 à 21 h**, avec des valeurs astronomiques calculées.

## Architecture

Le projet utilise **React**, **TypeScript** et **Vite**. La scène 3D repose sur **Three.js**, **React Three Fiber** et **Drei**. **Astronomy Engine** fournit les calculs astronomiques ; **date-fns-tz** et **tz-lookup** assurent la gestion des fuseaux horaires.

```text
src/
  App.tsx                 État de l’observation et navigation
  components/             Scène 3D, disque lunaire, frise et sélecteurs
  lib/                    Astronomie, coordonnées, dates et géocodage
  test/                   Configuration des tests
  styles.css              Styles et adaptation aux écrans
public/assets/            Textures et ressources visuelles
tests/                    Tests de compatibilité Sites
worker/index.js           Adaptateur de distribution des fichiers statiques
scripts/                  Préparation des artefacts de compilation
.openai/hosting.json       Configuration de compatibilité Sites
```

Les tests unitaires et les tests de composants sont placés à côté des fichiers concernés dans `src/`.

L’application reste un prototype frontend. Le worker sert les fichiers statiques et gère le repli vers la page de l’application ; il ne contient pas de backend métier. La compilation prépare :

```text
dist/client/index.html
dist/server/index.js
dist/.openai/hosting.json
```

## Déploiement sur Vercel

Le fichier [`vercel.json`](vercel.json) définit les réglages de compilation et de publication :

| Réglage | Valeur |
| --- | --- |
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist/client` |
| Root Directory | Le dossier contenant `package.json` et `vercel.json` ; racine du dépôt dans cette structure. |

Vercel doit publier **`dist/client`**, qui contient `index.html`, les scripts, les styles et les textures. Publier `dist` ne place pas la page d’accueil à la racine du site et peut provoquer une erreur 404 malgré une compilation réussie. Les fichiers de `dist/server` et `dist/.openai` restent destinés à Sites.

Après avoir envoyé la configuration sur GitHub, vérifier que le nouveau déploiement Vercel utilise bien ce commit. Si le dépôt est connecté à Vercel, l’envoi sur une branche déclenche normalement un déploiement selon les réglages du projet. Relancer un ancien déploiement ne récupère pas nécessairement le nouveau commit.

En cas de 404 persistante, vérifier le **Root Directory**, le commit déployé et la présence de `index.html` à la racine du dossier publié. Voir le [guide de diagnostic Vercel](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404).

## Services externes et ressources

La recherche de lieux et l’identification d’un lieu à partir de coordonnées utilisent **Photon**, à l’adresse `https://photon.komoot.io`, avec des données OpenStreetMap. Les recherches et les coordonnées à identifier sont donc transmises à ce service. En cas d’indisponibilité, les calculs locaux et la saisie manuelle de coordonnées restent utilisables.

Les crédits affichés dans le prototype mentionnent **NASA Earth Observatory** et **NASA SVS** pour les textures, et **Astronomy Engine** pour les calculs.

## Limites du modèle

- Les dimensions, distances et positions de la scène 3D sont adaptées à l’explication visuelle ; la scène n’est pas à l’échelle.
- Le disque lunaire représente l’éclairage et son orientation, avec un relief de référence. Les librations et les éclipses ne sont pas simulées dans cette vue.
- Une Lune au-dessus de l’horizon n’est pas nécessairement visible à l’œil nu : météo, relief local et luminosité du ciel ne sont pas modélisés.
- Le lieu et la date sélectionnés ne sont pas conservés après un rechargement de la page.

## Versionnement

Le fichier [`.gitignore`](.gitignore) exclut les dépendances installées, les compilations, la couverture de tests, les journaux et les configurations locales susceptibles de contenir des secrets.

Conserver dans Git **`package-lock.json`**, les ressources de **`public/assets/`** et les fichiers de compatibilité Sites : **`.openai/hosting.json`**, **`worker/index.js`**, **`scripts/prepare-sites-build.mjs`** et **`tests/sites-worker.test.mjs`**.

Le dépôt contient les réglages de publication Vercel. Le déclenchement automatique dépend de la connexion Git configurée dans Vercel ; aucune publication sur GitHub Pages n’est configurée.
