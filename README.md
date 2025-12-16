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