# Pour démarrer

`npm install`

`npm start`
# Mettre à jour les commandes

Transpiler les fichiers TypeScript en fichiers JavaScript

`npx tsc`

Exécuter deploy-commands.js

`node ./dist/deploy-commands.js`
# Informations importantes

Le bot doit **avoir la permission de lire les logs, gérer les channels et de gérer les rôles**.

Le serveur doit contenir un channel nommé **whitelist** (configurable dans `bot-constants.ts`)