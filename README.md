# Que fait le bot ?
## En bref...
### Inscription
Le but du bot est de permettre aux membres d'un serveur Discord de faire une demande pour être ajouté sur la whitelist d'un serveur Minecraft.<br>
Les membres cliquent sur un bouton, puis le bot lui envoie un message pour compléter l'inscription.
<img width="865" alt="Capture d’écran, le 2023-11-15 à 08 53 18" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/5152a8ed-f3bc-4a99-a7e5-5171c9e5f011">

Plus spécifiquement, le membre fourni son nom d'utilisateur Minecraft et confirme qu'il accepte les règles.
<img width="809" alt="Capture d’écran, le 2023-11-15 à 09 15 53" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/00c7893c-edec-43a3-a5aa-25fb5430a016"><br>
Le nom d'utilisateur est validé avec l'API de Mojang.<br>
### L'administrateur est en contrôle
Permet à l'administrateur d'accepter la demande (et indiquer que le membre est ajouté à la whitelist).
<img width="429" alt="Capture d’écran, le 2023-11-15 à 09 14 08" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/72938e82-d5fe-4657-a7b0-39bba7ffab04">

# Commandes

`/afficher-bouton-inscription` <sub><sup>(permission requise : administrateur)</sup></sub><br>
Envoie dans le channel ou l'utilisateur envoie la commande un message permettant aux membres de s'inscrire.

`/approuver` <sub><sup>(permission requise : bannir des membres)</sup></sub><br>
Approuver une demande sans passer par le message automatisé. La commande suggère en autocomplétion des membres.

`/rejeter` <sub><sup>(permission requise : bannir des membres)</sup></sub><br>
Rejeter une demande sans passer par le message automatisé. La commande suggère en autocomplétion des membres.

`/reinitialiser-statut` <sub><sup>(permission requise : bannir des membres)</sup></sub><br>
Remettre le statut en attente. La commande suggère en autocomplétion des membres.

`/afficher` <sub><sup>(permission requise : administrateur)</sup></sub><br>
Affiche les éléments de la base de données, soit au format d'une page web HTML téléchargable, soit au format JSON, soit sous forme de message.

`/supprimer-entree` <sub><sup>(permission requise : bannir des membres)</sup></sub><br>
Supprime un membre de la base de données. Prends en paramètre le UUID Discord du membre, ainsi il est possible de supprimer des membres qui ne sont plus sur le serveur.

`/modifier-username` <sub><sup>(permission requise : bannir des membres)</sup></sub><br>
L'administrateur peut manuellement modifier le username Minecraft d'un joueur. Valide avec l'API de Mojang que le nom d'utilisateur existe bel et bien.

`/terminer-saison` <sub><sup>(permission requise : administrateur)</sup></sub><br>
Efface la base de données et supprime le channel du bot.

# Pourquoi ai-je créé ce bot ?
Pour faire les inscriptions, j'avais l'habitude de faire remplir un formulaire Google Doc aux membres du serveur. Certains mettaient des nom d'utilisateurs qui n'existaient pas ou se trompaient dans leur nom d'utilisateur, et c'étais toujours désagréable de gérer ces changements à faire. Aussi, j'aurais apprécié avoir des alertes sur Discord lorsqu'un utilisateur complète le formulaire au lieu de devoir aller consulter les résultats moi-même manuellement.

# Pour démarrer

Installer les dépendances : `npm install`

Démarrer le projet : `npm debug`

Mettre à jour les commandes : `ts-node ./deploy-commands.ts`
## Informations importantes

Le bot doit avoir les permissions pour **lire les logs, gérer les channels et gérer les rôles**.
