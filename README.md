# Estiam E5 – React Native App

## Prerequisites

- Node.js
- npm
- Expo CLI
- Git

## Project Setup

### 1. Environment variables

Create the local environment file:

```sh
cp .env.example .env
````

### 2. Install dependencies

Install all required packages:

```sh
npm install
```

## Mock API Setup

The application relies on a mock backend that must be running locally.

### 1. Clone the API repository

```sh
git clone https://github.com/odi94/estiam-e5-react-native.git
mv estiam-e5-react-native mock_api
cd mock_api
```

### 2. Switch to the correct branch

```sh
git switch mock-backend-nodejs-clean
```

### 3. Install API dependencies

```sh
npm install
```

### 4. Start the API

```sh
npm run start
```

The API will now be available locally.

## Run the Application

In the root project directory, start the Expo application:

```sh
npx expo start
```

## Notes
* Make sure the API is running **before** launching the app.
---

## Ce qui est demandé pour la remise du devoir:

### Améliorations réalisées

* **Documentation du code**
* **Centralisation des modèles**
* **Gestion des favoris**
* **Carte interactive**
* **Navigation améliorée**

### Décisions

- **Favoris**  
  J'ai créé un service dédié (`favoritesService`) basé sur `AsyncStorage` afin de permettre au user de mettre des voyages en favoris et de les retrouver après avoir redémarrer l’application.

- **useFocusEffect**  
  J'ai remplacé certains `useEffect` par `useFocusEffect` pour mettre à jour les données après être retourné sur un écran (je l'ai fait sur: trips, map, home).

- **Gestion du retour entre écrans**  
  J'ai ajouté un paramètre `from` dans la retour pour adapter le comportement du bouton selon l'endroit où on fait l'action (Home, Trips, Map) ce qui rend l'experience utilisateur plus agréable.

- **Vue carte mondiale des voyages**  
  J'ai implémenté un écran Map qui affiche les voyages sur une map monde via `react-native-maps`, en cliquant sur un trip on pour acceder à son détail rapidement.

### Limites connues

- **Authentification simulée**  
  L'api renvoie un JWT valide peut importe l’email/mot de passe ce qui est une limite.

- **Notifications push**  
  Le bouton `initialiser les notifications` ne marche pas (je ne sais pas si ça vient du fait que je lance expo Go en local et que je récupère le projet héberger depuis mon iPhone mais peut être). De plus la page des notifications est une page de developpement, c'est donc une limite que de l'avoir encore en prod.

- **Map Monde**  
  Dépend de l’API OpenStreetMap ce qui fait que sans connexion ça peut ne pas marcher.

- **API mock**  
  L'api est très simplifié ce qui est pratique pour le devoir mais ce qui est une limite, on aurait pu avoir les favoris directement en db dans un tableau de User.