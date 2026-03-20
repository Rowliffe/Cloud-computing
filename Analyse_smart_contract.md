# Analyse d'un Outil de Smart Contract
**Cours 3WEB3 · Jour 2 · Bloc 4 – Ingénierie logicielle · B3**

- **Format :** Individuel ou binôme
- **Durée totale :** 45 min d'investigation + 10 min de restitution

---

## Phase 1 — Observation de l'interface (15 min)

### 1.1 — Ce que vous voyez sans wallet

**Les résultats du vote s'affichent-ils avant que vous ayez connecté MetaMask ?**

Oui, on peut apercevoir les candiats le résulat des votes et leurs noms.

**Si oui : comment est-ce possible ? Quelle propriété de la blockchain explique cela ?**

Oui parce que les données du contrat sont stockées sur la blockchain et la blockchain est publique, donc tout le monde peut lire ce qui est dessus sans avoir besoin de se connecter. Le frontend utilise un provider pour aller chercher les infos directement sur Sepolia, et comme c'est de la lecture ça ne coûte pas de gas et ça ne demande pas de wallet.

**Éléments identifiés dans l'interface :**

| ÉLÉMENT | PRÉSENT ? | LOCALISATION DANS L'INTERFACE |
|---|---|---|
| Adresse du contrat déployé |  Oui | En bas de page  |
| Lien vers Etherscan |  Oui | À côté de l'adresse du contrat |
| Nombre de votes par candidat |  Oui | Section centrale — résultats du vote en temps réel |
| Historique des transactions |  Oui | Blockchain Explorer intégré à l'application |
| Explication du fonctionnement |  Oui | documentation intégrée |

---

### 1.2 — Connexion MetaMaskttttt

**Quelle information nouvelle s'affiche après connexion ?**

On voit notre adresse de wallet qui s'affiche en haut à droite (`0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`) et le bouton "Voter" apparaît sous chaque candidat. Avant la connexion on pouvait juste voir les résultats, maintenant on peut aussi voter.

**MetaMask a-t-il demandé un mot de passe ou un login ?**

 Non (uniquement une confirmation de connexion via la popup MetaMask)

**Qu'est-ce que cela vous dit sur le modèle d'authentification Web3 par rapport au Web2 ?**

En Web2 on a un login et un mot de passe qu'on envoie à un serveur pour prouver qui on est. En Web3 c'est pas pareil, il n'y a pas de mot de passe ni de compte à créer quelque part. C'est MetaMask qui gère tout, on prouve notre identité avec notre clé privée sans jamais l'envoyer à personne. Du coup le wallet c'est notre identité.

---

## Phase 2 — Voter et observer la transaction (15 min)

### 2.1 — Envoyer un vote

**Quelle adresse de contrat est indiquée dans la popup MetaMask ?**
`0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`

**Quel est le coût en gas estimé affiché ?**

Environ 53,161, soit approximativement 0.000079741500691093 ETH.

**Pourquoi votre vote coûte-t-il du gas ? Reliez à ce que vous avez vu en cours sur l'EVM.**

Quand on vote on envoie une transaction qui modifie des données dans le contrat (le compteur de votes, le timestamp du dernier vote). Vu que ça modifie l'état de la blockchain, ça demande du calcul aux validateurs pour l'inclure dans un bloc, et c'est le gas qui sert à les payer pour ce travail.

---

### 2.2 — Analyser la transaction confirmée

**Hash de votre transaction :**
`0x1baea39336507586b6214c227a4958ef080aa90ee6038f3edb710d318b797aeb`

| DONNÉE | VALEUR |
|---|---|
| Numéro du bloc | 10462917 |
| Timestamp du bloc | ~12 secondes après confirmation |
| Gas utilisé (gasUsed) | 53,161 |
| Gas limit fixé | 53,955  |
| Statut | ✅ Success |
| Fonction appelée | `vote(uint256 candidateId)`  0x0121b93f |

**Qu'est-ce que `gasUsed` représente concrètement ? Pourquoi est-il inférieur au `gasLimit` ?**

`gasUsed` c'est le gas qui a vraiment été consommé pour exécuter la transaction. Le `gasLimit` c'est le maximum qu'on accepte de payer, c'est une sécurité. Du coup gasUsed est toujours en dessous du gasLimit, et ce qui n'est pas utilisé est remboursé. Si jamais le gas limit est trop bas et que la transaction a besoin de plus, elle échoue et on perd le gas quand même.

---

### 2.3 — Le cooldown de 3 minutes

**Que se passe-t-il ? Décrivez l'interface.**

Un compteur s'affiche sur l'interface avec le temps restant avant de pouvoir revoter (format MM:SS). Le bouton de vote disparaît tant que le cooldown est actif. Si on essaie quand même d'appeler la fonction directement, la transaction serait rejetée par le contrat.

**Cette restriction est-elle dans le frontend ou dans le smart contract ? Comment le savez-vous ?**

C'est dans le smart contract. On le voit parce que le code sur Etherscan contient un `require()` qui vérifie le timestamp du dernier vote. Même si on enlève le compteur côté frontend ça changerait rien, le contrat refuserait quand même la transaction. Le frontend affiche juste le cooldown pour prévenir l'utilisateur mais c'est la blockchain qui fait la vraie vérification.

**Quelle variable Solidity et quelle fonction permettent ce mécanisme ?**
- **Variable :** `mapping(address => uint256) public lastVoteTime` — stocke le timestamp du dernier vote pour chaque adresse.
- **Fonction :** `vote(uint256 candidateId)` — contient la condition :
```solidity
require(block.timestamp >= lastVoteTime[msg.sender] + 3 minutes, "Cooldown actif");
lastVoteTime[msg.sender] = block.timestamp;
```

---

## Phase 3 — Investigation on-chain via Etherscan (15 min)

### 3.1 — Onglet "Transactions"

**Combien de transactions ce contrat a-t-il reçues au total ?**

Au moment de l'analyse on voyait une vingtaine de transactions sur Etherscan.

**Quelle est la date et l'heure de la toute première transaction (le déploiement) ?**

La première transaction est le `Contract Creation`, on la voit tout en bas de la liste des transactions sur Etherscan.

**Pourquoi la première transaction est-elle différente des suivantes ?**

Parce que la première c'est le déploiement du contrat, c'est marqué `Contract Creation` dans la colonne Method. C'est la transaction qui envoie le bytecode du contrat sur la blockchain et qui lui donne son adresse. Toutes les transactions après c'est des appels à `vote()` sur le contrat qui existe déjà.

---

### 3.2 — Onglet "Events"

**Quel est le nom de l'event émis à chaque vote ?**

`Voted`

**Cet event contient deux paramètres. Lesquels ?**
- `voter` (address) — l'adresse du wallet qui a voté
- `candidateId` (uint256) — l'identifiant du candidat choisi

**Pourquoi le contrat émet-il un event plutôt que de simplement modifier une variable ? Quelle est la différence entre un event et une variable d'état ?**

Un event c'est pas la même chose qu'une variable d'état. Une variable d'état ça reste stocké dans le contrat et on peut la relire quand on veut, mais ça coûte cher en gas à écrire. Un event c'est moins cher, ça va dans les logs de la transaction et le frontend peut l'écouter en temps réel pour se mettre à jour. Par contre le contrat lui-même ne peut pas relire ses propres events. Ici le contrat émet `Voted` pour que le frontend sache qu'un vote vient d'arriver et rafraichisse l'affichage.

---

### 3.3 — Onglet "Contract" (si le code source est vérifié)

**Le code source est-il visible ?**

 Oui (le contrat est vérifié sur Etherscan Sepolia)

**Retrouvez la fonction `vote()`. Quelle ligne vérifie le cooldown de 3 minutes ?**

```solidity
require(block.timestamp >= lastVoteTime[msg.sender] + 180, "Vous devez attendre 3 minutes entre chaque vote");
```
*(ou avec le suffixe `3 minutes` si la version Solidity le supporte)*

**Retrouvez la condition `require()` dans cette fonction. Que se passe-t-il si cette condition n'est pas respectée ?**

Si le `require()` n'est pas respecté la transaction est annulée, tout ce qui a été modifié dans l'exécution est remis comme avant. Le message d'erreur est renvoyé (par exemple "Cooldown actif") et le gas est quand même consommé parce que l'EVM a quand même fait le calcul avant de rejeter.

---

### 3.4 — Analyse d'un bloc via le Blockchain Explorer de l'app

| DONNÉE | VALEUR |
|---|---|
| parentHash | `0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`  |
| gasUsed (transaction) | 53,161 |
| gasLimit (bloc) | 53,955  |
| Validateur (miner) | `0x07dc061bf3C8e7F5dB6d908B4E86eB9F0ab5fa35`  |

**Qu'est-ce que le `parentHash` ? Pourquoi est-il fondamental pour l'immuabilité de la blockchain ?**

Le `parentHash` c'est le hash du bloc d'avant. Chaque bloc contient le hash du bloc précédent, c'est ça qui fait la "chaîne" dans blockchain. Si quelqu'un modifie une transaction dans un vieux bloc, le hash de ce bloc change et du coup le parentHash du bloc suivant ne correspond plus. Il faudrait refaire tous les blocs après et c'est impossible vu la puissance de calcul que ça demande. C'est pour ça que la blockchain est immuable.

**Le bloc précédent contient-il aussi un vote ? Pourquoi ou pourquoi pas ?**

Pas forcément. Il y a plein de transactions sur Sepolia à part les nôtres, un bloc contient toutes les transactions qui ont été envoyées pendant ~12 secondes. Donc le bloc d'avant peut contenir un vote si quelqu'un d'autre a voté en même temps, mais c'est pas garanti du tout.

---

## Phase 4 — Analyse critique (5 min)

### 4.1 — Ce que la blockchain apporte ici

| PROPRIÉTÉ | EXPLOITÉE ? | JUSTIFICATION |
|---|---|---|
| **Immuabilité** — les votes ne peuvent pas être modifiés |  Oui | Quand un vote est dans un bloc confirmé on ne peut plus le changer ni le supprimer, personne ne peut modifier ça même pas le créateur du contrat. |
| **Transparence** — n'importe qui peut vérifier les résultats |  Oui | Tout est visible sur Etherscan, n'importe qui peut aller voir les transactions et les résultats du vote sans demander la permission. |
| **Désintermédiation** — pas de serveur central |  Partiellement | La logique de vote tourne sur le contrat sans serveur, mais le frontend est quand même sur Vercel qui est centralisé. Donc c'est un mix des deux. |
| **Décentralisation** — pas d'entité de contrôle |  Partiellement | Le contrat est décentralisé mais les candidats sont codés en dur dans le constructor, donc c'est le créateur qui a décidé de la liste au départ. |

---

### 4.2 — Ce que la blockchain n'apporte pas (les limites)

**Ce vote est-il vraiment anonyme ? Justifiez.**

Non c'est pas anonyme. Sur Etherscan on voit quelle adresse a voté pour quel candidat. C'est vrai que les adresses sont des suites de caractères et qu'on sait pas directement qui est derrière, mais si l'adresse est liée à un compte sur un exchange par exemple, on peut remonter à la personne. Donc c'est plutôt pseudonyme qu'anonyme.

**Un utilisateur technique pourrait-il contourner le cooldown de 3 minutes ? Comment ?**

Oui, il suffit de créer un autre wallet sur MetaMask. Le cooldown est lié à l'adresse du wallet (c'est un mapping), donc avec une nouvelle adresse on peut revoter tout de suite. Le contrat ne peut pas savoir si c'est la même personne derrière deux wallets différents. C'est une grosse limite, la blockchain sait pas distinguer une personne d'une autre.

**Est-ce que n'importe qui pourrait déployer une interface différente connectée au même contrat ? Qu'est-ce que cela implique pour la notion de "contrôle" d'une dApp ?**

Oui carrément. Le contrat est public sur Etherscan avec son code et son ABI, donc n'importe qui peut coder un autre site web qui appelle les mêmes fonctions sur le même contrat. Ça veut dire qu'on contrôle pas vraiment la dApp une fois le contrat déployé, on contrôle juste notre frontend. Quelqu'un pourrait faire un site avec une interface trompeuse connecté au même contrat, ou l'inverse.

---

### 4.3 — Verdict final

La dApp fonctionne bien pour montrer ce que la blockchain apporte : les votes sont enregistrés de façon permanente, les résultats sont visibles par tout le monde sur Etherscan, et la logique de vote tourne sans serveur. Les events permettent au frontend de se mettre à jour en temps réel et le mapping gère bien le cooldown.

Après c'est pas parfait non plus. Le vote est pas anonyme du tout vu que tout est visible on-chain. Le cooldown de 3 minutes c'est facile à contourner en créant un autre wallet. Et le frontend est quand même hébergé sur un serveur classique. Pour un vrai vote sérieux il faudrait trouver un moyen de vérifier l'identité des votants et de garder le vote secret, mais pour un TD ça montre bien le principe.

---

## Fiche de synthèse — à remettre au formateur

**Nom(s) :**  Clamy--courtial Enzo

**Adresse wallet utilisée pendant l'analyse :** `0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`

**Hash de votre transaction de vote :** `0x1baea39336507586b6214c227a4958ef080aa90ee6038f3edb710d318b797aeb`

**Numéro du bloc dans lequel votre vote a été inclus :** 10462917
---

**En une phrase : qu'est-ce qu'un smart contract, après avoir interagi avec celui-ci ?**

C'est un programme qui tourne sur la blockchain, une fois qu'il est déployé personne ne peut le modifier et il s'exécute tout seul quand quelqu'un lui envoie une transaction.

---

**En une phrase : quelle est la différence entre ce que fait le frontend (Vercel) et ce que fait le smart contract (Sepolia) ?**

Le frontend sur Vercel c'est juste l'interface, les boutons et l'affichage. Le smart contract sur Sepolia c'est lui qui gère vraiment les votes et qui les stocke sur la blockchain. Le frontend pourrait disparaître, les votes seraient toujours là sur la blockchain.

---

**La question que cette analyse vous a donné envie de poser :**

Est-ce qu'il existe un moyen sur Ethereum de vérifier qu'un wallet appartient bien à une vraie personne et pas juste un bot ou un doublon ?

---

*Fiche d'activité — Cours 3WEB3 · Jour 2 · Bloc 4 · B3*
