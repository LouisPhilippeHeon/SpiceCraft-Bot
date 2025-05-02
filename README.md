# Que fait le bot ?
## En bref...
### Inscription
Le but du bot est de permettre aux membres d'un serveur Discord de faire une demande pour être ajouté sur la whitelist d'un serveur Minecraft.<br>
Les membres cliquent sur un bouton, puis le bot lui envoie un message pour compléter l'inscription.<br>
<img width="865" alt="Capture d’écran, le 2023-11-15 à 08 53 18" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/5152a8ed-f3bc-4a99-a7e5-5171c9e5f011"><br>
Plus spécifiquement, le membre fourni son nom d'utilisateur Minecraft et confirme qu'il accepte les règles.
<img width="809" alt="Capture d’écran, le 2023-11-15 à 09 15 53" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/00c7893c-edec-43a3-a5aa-25fb5430a016"><br>
Le nom d'utilisateur est validé avec l'API de Mojang.<br>
### L'administrateur est en contrôle
Permet à l'administrateur d'accepter la demande (et indiquer que le membre est ajouté à la whitelist).<br>
<img width="429" alt="Capture d’écran, le 2023-11-15 à 09 14 08" src="https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/72938e82-d5fe-4657-a7b0-39bba7ffab04">
### Communication avec le serveur Minecraft
Il est possible de gérer la whitelist d'un ou plusieurs serveurs Minecraft avec RCON. Il suffit d'ajouter leurs adresses IP, port et mot de passe à config.ts. Ainsi, lorsque l'on accepte la demande d'un joueur, l'ajout dans la whitelist est automatique.

![image](https://github.com/LouisPhilippeHeon/SpiceCraft-Bot/assets/83369199/ccfeb5be-19c3-4533-9cba-2689e9ba977e)
# Commandes
## Administrateur <sub><sup>(permission requise : administrateur)</sup></sub>
`/afficher-bouton-inscription`<br>
Envoie dans le channel ou l'utilisateur envoie la commande un message permettant aux membres de s'inscrire.

`/terminer-saison`<br>
Efface la base de données et supprime le channel du bot.

## Modérateur <sub><sup>(permission requise : bannir des membres)</sup></sub>
`/approuver`<br>
Approuver une joueur. Le joueur sera ajouté à la whitelist.

`/ajouter-membre`<br>
Ajouter manuellement un membre sans qu'il doive s'inscrire par lui-même.

`/rejeter`<br>
Rejeter un joueur. Le joueur sera retiré du serveur Minecraft.

`/reinitialiser-statut`<br>
Remettre le statut en attente pour un membre inscrit.

`/afficher-membres`<br>
Affiche les éléments de la base de données. Choix entre le format HTML (page téléchargable), soit au format JSON, soit sous forme de message(s).

`/supprimer-entree`<br>
Supprime un membre de la base de données. Prends en paramètre le UUID Discord du membre, ainsi il est possible de supprimer des membres qui ne sont plus sur le serveur.

`/modifier-username`<br>
L'administrateur peut manuellement modifier le username Minecraft d'un joueur. Valide avec l'API de Mojang que le nom d'utilisateur existe bel et bien. Le nom sera aussi changé dans la whitelist du serveur Minecraft.

## Public <sub><sup>(permission requise : aucune)</sup></sub>
`/afficher-username`<br>
Permet de connaitre quel est le nom d'utilisateur d'un joueur membre du serveur Discord.

# Pourquoi ai-je créé ce bot ?
Pour faire les inscriptions, j'avais l'habitude de faire remplir un formulaire Google Forms aux membres du serveur. Certains mettaient des nom d'utilisateurs qui n'existaient pas ou se trompaient de nom d'utilisateur, et c'étais toujours désagréable de gérer ces changements à faire. Aussi, j'aurais apprécié avoir des alertes sur Discord lorsqu'un utilisateur complète le formulaire au lieu de devoir aller consulter les résultats moi-même manuellement. En plus, je n'ai pas besoin de manuellement ajouter le joueur à la whitelist ou d'ajouter son rôle sur le serveur Discord.

# Pour démarrer

Installer les dépendances : `npm install`<br>
Démarrer le projet : `npm debug`<br>
Mettre à jour les commandes : `npm deploy-commands`<br>
Transpiler : `npm build`
## Informations importantes

Le bot doit avoir les permissions pour **lire les logs, gérer les channels et gérer les rôles**.
