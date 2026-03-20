# TD Jour 2 — Réponses aux questions de compréhension

**Auteurs** : BELLONET Mattéo, CLAMY--COURTIAL Enzo, KHAIR Souhail, MORIN Ugo  
**Cours** : 3WEB3 · Bloc 4 · B3

---

## Étape 1 — Lire les résultats sans se connecter

**Pourquoi les scores s'affichent sans MetaMask ? Quelle propriété de la blockchain ?**

Les scores s'affichent parce que la blockchain est publique. Les fonctions `view` du contrat (comme `getCandidate()` ou `getCandidatesCount()`) sont en lecture seule, elles coûtent pas de gas et on a pas besoin de wallet pour les appeler. Le frontend utilise juste un provider pour lire les données sur Sepolia, c'est tout.

---

## Étape 2 — Connexion MetaMask

**Si vous transmettez votre adresse à votre voisin, pourrait-il voter à votre place ?**

Non. L'adresse publique c'est juste un identifiant, ça suffit pas pour voter. Pour envoyer une transaction il faut la signer avec la clé privée, et ça c'est MetaMask qui le fait. Sans la clé privée on peut rien faire à part regarder le solde et l'historique de l'adresse.

---

## Étape 3 — Voter

**Qui vérifie le cooldown — frontend ou smart contract ? Que se passe-t-il si on contourne le frontend ?**

C'est le smart contract qui vérifie. Il y a un `require()` dans la fonction `vote()` qui compare `block.timestamp` avec le timestamp du dernier vote. Le frontend affiche juste un compteur pour prévenir l'utilisateur, mais même si on enlève ce compteur ou qu'on appelle `vote()` directement via Etherscan, le contrat refuserait la transaction.

---

## Étape 4 — Le cooldown

**Pourquoi `block.timestamp` et pas `Date.now()` côté JavaScript ?**

Parce que `Date.now()` c'est l'heure de la machine de l'utilisateur, il peut la changer comme il veut. `block.timestamp` c'est l'heure du bloc sur la blockchain, c'est le validateur qui la fixe et personne peut la truquer côté client. Si on utilisait `Date.now()` n'importe qui pourrait avancer l'horloge de son PC et contourner le cooldown.

---

## Étape 5 — Écouter les votes en temps réel

**Pourquoi `listenContract.off()` dans le cleanup du useEffect ? Que se passe-t-il après 10 reconnexions sans cleanup ?**

Le `off()` sert à supprimer le listener quand le composant se démonte ou quand le `useEffect` se relance. Sans ça, à chaque reconnexion on rajoute un nouveau listener sans enlever l'ancien. Après 10 reconnexions on aurait 10 listeners actifs en même temps, donc chaque vote déclencherait 10 fois le rafraichissement des données. Ça ferait des appels en double et ça pourrait ralentir l'app.

---

## Étape 6 — Explorer l'historique on-chain

**Pourquoi le parentHash rend la blockchain immuable ? Que se passe-t-il si on modifie le bloc #104 606 440 ?**

Chaque bloc contient le hash du bloc précédent (le parentHash). Si on modifie une transaction dans le bloc #104 606 440, son hash change. Du coup le parentHash du bloc #104 606 441 ne correspond plus, et pareil pour tous les blocs après. Il faudrait recalculer tous les blocs suivants pour que la chaîne soit cohérente, et c'est impossible vu le nombre de blocs et la puissance de calcul que ça demanderait. C'est pour ça qu'on peut pas falsifier la blockchain.

