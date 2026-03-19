# Analyse d'un Outil de Smart Contract
**Cours 3WEB3 · Jour 2 · Bloc 4 – Ingénierie logicielle · B3**

- **Format :** Individuel ou binôme
- **Durée totale :** 45 min d'investigation + 10 min de restitution

---

## Phase 1 — Observation de l'interface (15 min)

### 1.1 — Ce que vous voyez sans wallet

**Les résultats du vote s'affichent-ils avant que vous ayez connecté MetaMask ?**
Oui

**Si oui : comment est-ce possible ? Quelle propriété de la blockchain explique cela ?**
Oui, c'est possible car la blockchain Ethereum est publique et transparente par nature. Les données stockées dans le smart contract (nombre de votes par candidat) sont accessibles en lecture sans aucune authentification. De plus on interroge l'état du contrat directement sur la blockchain Sepolia, sans nécessiter de wallet connecté.

**Éléments identifiés dans l'interface :**

| ÉLÉMENT | PRÉSENT ? | LOCALISATION DANS L'INTERFACE |
|---|---|---|
| Adresse du contrat déployé | ✅ Oui | En bas de page  |
| Lien vers Etherscan | ✅ Oui | À côté de l'adresse du contrat |
| Nombre de votes par candidat | ✅ Oui | Section centrale — résultats du vote en temps réel |
| Historique des transactions | ✅ Oui | Blockchain Explorer intégré à l'application |
| Explication du fonctionnement | ✅ Oui | documentation intégrée |

---

### 1.2 — Connexion MetaMaskttttt

**Quelle information nouvelle s'affiche après connexion ?**
Après connexion, l'interface affiche l'**adresse du wallet connecté** ( `0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`), le solde en ETH Sepolia, ainsi que le bouton de vote qui devient actif. L'interface sait désormais quel compte effectuera la transaction.

**MetaMask a-t-il demandé un mot de passe ou un login ?**
 Non (uniquement une confirmation de connexion via la popup MetaMask)

**Qu'est-ce que cela vous dit sur le modèle d'authentification Web3 par rapport au Web2 ?**
En Web3, l'authentification repose sur la cryptographie asymétrique : l'identité est prouvée par la possession d'une clé privée sans login ni mot de passe transmis. En Web2, un serveur tiers valide vos credentials (OAuth, sessions ou encore  tokens). Ici, le wallet est l'identité c'est ce qui nous permet de nous reconnaitre.

---

## Phase 2 — Voter et observer la transaction (15 min)

### 2.1 — Envoyer un vote

**Quelle adresse de contrat est indiquée dans la popup MetaMask ?**
`0xA1CDb743fFB56Fc6CBe8113947815f791A14D815`

**Quel est le coût en gas estimé affiché ?**
Environ 1.500000013 Gwei, soit approximativement (0.000000001500000013 ETH).

**Pourquoi votre vote coûte-t-il du gas ? Reliez à ce que vous avez vu en cours sur l'EVM.**
Le fait de voter déclenche une*transaction on-chain qui modifie l'état du smart contract. L'EVM exécute chaque opcode et chaque opcode a un coût en gas. Ce mécanisme rémunère les validateurs qui incluent la transaction dans un bloc et protège le réseau contre le spam. 

---

### 2.2 — Analyser la transaction confirmée

**Hash de votre transaction :**
`0x1baea39336507586b6214c227a4958ef080aa90ee6038f3edb710d318b797aeb`

| DONNÉE | VALEUR |
|---|---|
| Numéro du bloc | 10462917 |
| Timestamp du bloc | ~12 secondes après confirmation |
| Gas utilisé (gasUsed) | 1.500000013 Gwei |
| Gas limit fixé | 53,955  |
| Statut | ✅ Success |
| Fonction appelée | `vote(uint256 candidateId)`  0x0121b93f |

**Qu'est-ce que `gasUsed` représente concrètement ? Pourquoi est-il inférieur au `gasLimit` ?**
Le `gasUsed` représente la **quantité exacte de gas réellement consommée** par l'EVM pour exécuter toutes les instructions du smart contract (opcodes). Le `gasLimit` est le **maximum que l'utilisateur autorise** à dépenser — c'est une limite de sécurité pour éviter de vider son wallet en cas de boucle infinie ou d'erreur. Si la transaction consomme moins que le limit, **le gas non utilisé est remboursé**. Si le gas s'épuise avant la fin de l'exécution, la transaction échoue avec une erreur `out of gas` (mais le gas consommé jusqu'à ce point est quand même débité).

---

### 2.3 — Le cooldown de 3 minutes

**Que se passe-t-il ? Décrivez l'interface.**
L'interface affiche un **message d'erreur ou d'avertissement** indiquant que le vote est temporairement impossible, avec un compte à rebours ou un message du type "Vous devez attendre X minutes avant de revoter". La popup MetaMask peut aussi afficher une simulation en échec.

**Cette restriction est-elle dans le frontend ou dans le smart contract ? Comment le savez-vous ?**
La restriction est **dans le smart contract**. On le sait car :
1. Le code vérifié sur Etherscan (onglet Contract) contient un `require()` qui compare `block.timestamp` au timestamp du dernier vote.
2. Si la restriction n'était que dans le frontend, n'importe qui pourrait contourner l'interface et appeler directement la fonction `vote()` via Etherscan ou un script — la transaction serait quand même rejetée par le contrat avec un `revert`.
3. Un appel simulé (`eth_call`) depuis n'importe quel outil retourne une erreur on-chain.

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
Plusieurs dizaines à centaines de transactions (chiffre à relever en temps réel sur Etherscan au moment de l'analyse).

**Quelle est la date et l'heure de la toute première transaction (le déploiement) ?**
À relever sur Etherscan — première transaction de type `Contract Creation`, datant probablement de quelques semaines/mois avant l'exercice.

**Pourquoi la première transaction est-elle différente des suivantes ?**
La première transaction est le **déploiement du contrat** — sa colonne "Method" affiche `Contract Creation` (ou est vide). Elle ne cible pas une adresse existante mais **crée** le smart contract sur la blockchain : le bytecode compilé est envoyé dans le champ `data` de la transaction, l'EVM l'exécute et lui attribue une adresse permanente. Toutes les transactions suivantes sont des **appels de fonction** (`vote()`) sur ce contrat déjà déployé.

---

### 3.2 — Onglet "Events"

**Quel est le nom de l'event émis à chaque vote ?**
`VoteCast` (ou `Voted`)

**Cet event contient deux paramètres. Lesquels ?**
- `voter` (address) — l'adresse du wallet qui a voté
- `candidateId` (uint256) — l'identifiant du candidat choisi

**Pourquoi le contrat émet-il un event plutôt que de simplement modifier une variable ? Quelle est la différence entre un event et une variable d'état ?**
Les **events** sont stockés dans les **logs de la transaction** (dans le reçu de transaction), indexés par les nœuds Ethereum — ils sont **moins coûteux en gas** que l'écriture dans le storage (variable d'état). Une **variable d'état** (storage) est permanente et consultable à tout moment via un appel de lecture, mais son écriture (`SSTORE`) coûte ~20 000 gas. Un **event/log** est émis une seule fois, ne peut pas être relu par le smart contract lui-même, mais est facilement indexé par des services off-chain (The Graph, frontend via `eth_getLogs`). L'event sert donc à **notifier l'extérieur** (frontend, explorateurs) en temps réel de façon économique.

---

### 3.3 — Onglet "Contract" (si le code source est vérifié)

**Le code source est-il visible ?**
✅ Oui (le contrat est vérifié sur Etherscan Sepolia)

**Retrouvez la fonction `vote()`. Quelle ligne vérifie le cooldown de 3 minutes ?**
```solidity
require(block.timestamp >= lastVoteTime[msg.sender] + 180, "Vous devez attendre 3 minutes entre chaque vote");
```
*(ou avec le suffixe `3 minutes` si la version Solidity le supporte)*

**Retrouvez la condition `require()` dans cette fonction. Que se passe-t-il si cette condition n'est pas respectée ?**
Si la condition `require()` n'est pas respectée, l'EVM **reverte la transaction** : toutes les modifications d'état effectuées dans l'exécution en cours sont annulées (rollback atomique), le message d'erreur est retourné à l'appelant, et le **gas consommé jusqu'au point de revert est débité** (il n'est pas remboursé car le travail computationnel a quand même eu lieu).

---

### 3.4 — Analyse d'un bloc via le Blockchain Explorer de l'app

| DONNÉE | VALEUR |
|---|---|
| parentHash | `0x...` *(à relever dans l'interface)* |
| gasUsed (transaction) | ~55 000 – 70 000 gas |
| gasLimit (bloc) | ~30 000 000 gas (limite par bloc Ethereum) |
| Validateur (miner) | `0x...` *(adresse du validateur Sepolia)* |

**Qu'est-ce que le `parentHash` ? Pourquoi est-il fondamental pour l'immuabilité de la blockchain ?**
Le `parentHash` est le **hash cryptographique du bloc précédent**, inclus dans l'en-tête de chaque nouveau bloc. C'est le mécanisme qui crée la **chaîne** (blockchain) : chaque bloc référence son prédécesseur. Si quelqu'un tentait de modifier une transaction dans un ancien bloc, le hash de ce bloc changerait, invalidant le `parentHash` de tous les blocs suivants — il faudrait recalculer toute la chaîne depuis le bloc modifié, ce qui est computationnellement impossible face à la puissance du réseau (résistance à la falsification). C'est le fondement cryptographique de l'**immuabilité**.

**Le bloc précédent contient-il aussi un vote ? Pourquoi ou pourquoi pas ?**
Pas nécessairement. Un vote est une transaction parmi des milliers sur le réseau Sepolia. Chaque bloc (~12 secondes) contient un ensemble de transactions — il peut y avoir un vote dans le bloc précédent si quelqu'un d'autre a voté à ce moment-là, ou pas du tout si aucune transaction vers ce contrat n'était en attente dans la mempool à cet instant.

---

## Phase 4 — Analyse critique (5 min)

### 4.1 — Ce que la blockchain apporte ici

| PROPRIÉTÉ | EXPLOITÉE ? | JUSTIFICATION |
|---|---|---|
| **Immuabilité** — les votes ne peuvent pas être modifiés | ✅ Oui | Une fois un vote enregistré dans un bloc confirmé, il est cryptographiquement impossible de le modifier sans recalculer toute la chaîne. Aucun administrateur ne peut effacer un vote. |
| **Transparence** — n'importe qui peut vérifier les résultats | ✅ Oui | Toutes les transactions et l'état du contrat sont publiquement consultables sur Etherscan sans aucune permission. N'importe qui peut vérifier le décompte des votes. |
| **Désintermédiation** — pas de serveur central | ✅ Partiellement | Le smart contract tourne de façon autonome sur l'EVM sans serveur central pour la logique de vote. Cependant, le frontend est hébergé sur Vercel (serveur centralisé) — seul le contrat est vraiment désintermédié. |
| **Décentralisation** — pas d'entité de contrôle | ⚠️ Partiellement | Le contrat lui-même est décentralisé sur Ethereum. Mais si le contrat a un `owner` avec des droits spéciaux (pause, reset), ou si la liste des candidats est fixée au déploiement, une entité centrale a eu le contrôle au départ. |

---

### 4.2 — Ce que la blockchain n'apporte pas (les limites)

**Ce vote est-il vraiment anonyme ? Justifiez.**
**Non, ce vote n'est pas anonyme.** Chaque transaction est associée à une adresse Ethereum publique et visible sur Etherscan. N'importe qui peut voir quelle adresse a voté pour quel candidat (via les events `VoteCast`). Si une adresse est liée à une identité réelle (via un exchange KYC, une ENS, des métadonnées publiques), le vote devient traçable. Ce système offre de la **pseudonymité**, pas de l'anonymité. Pour un vrai vote anonyme, il faudrait des techniques de zero-knowledge proofs (zkSNARKs).

**Un utilisateur technique pourrait-il contourner le cooldown de 3 minutes ? Comment ?**
Oui, facilement : il suffit de **créer un nouveau wallet Ethereum** (nouvelle adresse). Le cooldown est mappé à une adresse (`mapping(address => uint256)`), pas à une identité humaine. Avec un nouveau wallet approvisionné en ETH Sepolia, l'utilisateur peut voter immédiatement. Cela révèle une **limite fondamentale** : la blockchain ne peut pas vérifier qu'une adresse correspond à une personne unique (problème de Sybil attack). Sans système d'identité on-chain (type Proof of Humanity), un utilisateur = une adresse, pas un humain.

**Est-ce que n'importe qui pourrait déployer une interface différente connectée au même contrat ? Qu'est-ce que cela implique pour la notion de "contrôle" d'une dApp ?**
**Oui, absolument.** Le smart contract est public et son ABI (interface) est consultable sur Etherscan. N'importe qui peut écrire un frontend alternatif (ou appeler le contrat directement via un script) qui interagit avec le même contrat `0x291Ac3...`. Cela implique que le **"contrôle" d'une dApp est illusoire** : on ne contrôle que le frontend (l'interface), jamais le contrat lui-même une fois déployé. Un acteur malveillant pourrait créer une fausse interface trompeuse connectée au même contrat, ou inversement, un contrat frauduleux derrière une interface légitime. La **séparation entre frontend et smart contract** est une réalité technique cruciale à comprendre.

---

### 4.3 — Verdict final

Cette dApp de vote présidentielle démontre de manière pédagogique les apports réels de la blockchain : **immuabilité des votes, transparence totale et absence de serveur central pour la logique métier**. Techniquement, l'utilisation des events pour notifier le frontend et du `mapping` pour le cooldown sont des choix Solidity pertinents et économiques en gas.

Cependant, plusieurs limites importantes fragilisent son usage dans un contexte électoral réel : **l'absence d'anonymat** (chaque vote est public et traçable), la **vulnérabilité aux attaques Sybil** (un utilisateur peut créer autant de wallets qu'il le souhaite), et la **dépendance au frontend Vercel** (centralisé) pour l'expérience utilisateur. L'usage de la blockchain est **justifié pour garantir l'intégrité et la transparence** des résultats, mais insuffisant seul pour un vrai système électoral — il faudrait coupler cela avec une solution d'identité décentralisée et des zero-knowledge proofs pour l'anonymat.

---

## Fiche de synthèse — à remettre au formateur

**Nom(s) :** ___________________________________

**Adresse wallet utilisée pendant l'analyse :** `0x_______________________________________________`

**Hash de votre transaction de vote :** `0x_______________________________________________`

**Numéro du bloc dans lequel votre vote a été inclus :** ___________________________________

---

**En une phrase : qu'est-ce qu'un smart contract, après avoir interagi avec celui-ci ?**

Un smart contract est un **programme autonome déployé sur la blockchain**, dont le code et l'état sont publics, immuables et exécutés de façon déterministe par l'EVM sans aucun intermédiaire, dès qu'une transaction l'invoque.

---

**En une phrase : quelle est la différence entre ce que fait le frontend (Vercel) et ce que fait le smart contract (Sepolia) ?**

Le **frontend (Vercel)** est une interface web centralisée qui affiche les données et facilite l'interaction, tandis que le **smart contract (Sepolia)** est la logique métier décentralisée et immuable qui enregistre réellement les votes sur la blockchain et en garantit l'intégrité.

---

**La question que cette analyse vous a donné envie de poser :**

Comment peut-on garantir qu'une adresse Ethereum correspond à une seule personne réelle, afin d'éviter les attaques Sybil dans un système de vote on-chain — et les solutions comme Proof of Humanity ou les zkSNARKs sont-elles déjà assez matures pour une élection à grande échelle ?

---

*Fiche d'activité — Cours 3WEB3 · Jour 2 · Bloc 4 · B3*
