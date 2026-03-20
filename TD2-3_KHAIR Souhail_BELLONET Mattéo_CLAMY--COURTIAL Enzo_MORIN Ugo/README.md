# dApp Vote — Élection Présidentielle On-Chain

**Auteurs** : BELLONET Mattéo, CLAMY--COURTIAL Enzo, KHAIR Souhail, MORIN Ugo  
**Cours** : 3WEB3 · Bloc 4 · B3  
**Stack** : React + Vite · Ethers.js v6 · Solidity · Hardhat · MetaMask · Sepolia

---

## Présentation du projet

On a suivi les TD 2 et 3 afin de créer une application décentralisée (dApp) de vote présidentiel déployée sur le réseau Ethereum Sepolia. Le projet se compose de deux parties distinctes :

- **TD2** — Le frontend React qui interagit avec le smart contract via Ethers.js et MetaMask
- **TD3** — Le smart contract Solidity écrit, compilé et déployé via Hardhat


---

## Structure du projet

```
.
├── src/                    # Frontend React (TD2)
│   ├── App.jsx             # Composant principal
│   ├── main.jsx            # Point d'entrée React
│   ├── config.js           # Adresse du contrat + réseau
│   ├── abi.json            # ABI du smart contract
│   ├── styles.css          # Styles principaux
│   └── index.css           # Reset + base
├── img/                    # Photos des candidats
├── mon-contrat/            # Smart contract Hardhat (TD3)
│   ├── contracts/
│   │   └── Vote.sol        # Contrat Solidity
│   ├── scripts/
│   │   └── deploy.js       # Script de déploiement
│   ├── hardhat.config.js   # Config Ganache + Sepolia
│   ├── .env                # Clés privées (non versionné)
│   └── abi.json            # ABI extraite
├── index.html
├── vite.config.js
└── package.json
```

---

## Documentation technique

### 1. Smart Contract — `Vote.sol`

Le contrat est écrit en Solidity 0.8.20 et gère l'intégralité de la logique de vote on-chain.

#### Variables d'état

| Variable | Type | Rôle |
|---|---|---|
| `owner` | `address public` | Adresse du déployeur du contrat |
| `candidates` | `Candidate[] private` | Tableau des candidats (nom + compteur de votes) |
| `lastVoteTime` | `mapping(address => uint256)` | Timestamp du dernier vote de chaque adresse |
| `COOLDOWN` | `uint256 constant` | Durée du cooldown entre deux votes (3 minutes = 180 secondes) |

#### Fonctions view (lecture gratuite)

- **`getCandidatesCount()`** — Retourne le nombre total de candidats. Utilisée au chargement pour itérer et afficher chaque candidat.
- **`getCandidate(index)`** — Retourne le nom et le nombre de votes d'un candidat. Inclut un `require` pour vérifier que l'index est valide.
- **`getTimeUntilNextVote(voter)`** — Retourne le nombre de secondes restantes avant qu'une adresse puisse revoter. Retourne 0 si le cooldown est écoulé ou si l'adresse n'a jamais voté.
- **`lastVoteTime(voter)`** — Retourne le timestamp Unix du dernier vote d'une adresse (getter automatique du mapping public).

#### Fonction d'écriture

- **`vote(candidateIndex)`** — Enregistre un vote on-chain. Deux `require` protègent la logique :
  - L'index du candidat doit être valide
  - Le cooldown de 3 minutes doit être respecté (`block.timestamp >= lastVoteTime[msg.sender] + COOLDOWN`)
  
  Après validation, le compteur du candidat est incrémenté, le timestamp du votant mis à jour, et l'event `Voted` émis.

#### Event

- **`Voted(address indexed voter, uint256 candidateIndex)`** — Émis à chaque vote. Le mot-clé `indexed` sur `voter` permet de filtrer les events par adresse dans l'explorateur. Le frontend s'y abonne en temps réel via `contract.on("Voted", handler)`.

#### Mécanisme de cooldown

Le cooldown est vérifié **on-chain** via `block.timestamp`, pas côté JavaScript. Cela garantit que même si quelqu'un contourne le frontend et appelle `vote()` directement (via Etherscan ou un script), la règle métier est respectée. Le frontend affiche un compte à rebours mais c'est la blockchain qui fait autorité.

---

### 2. Frontend — Ethers.js v6

Le frontend utilise la bibliothèque **Ethers.js v6** pour communiquer avec le smart contract via MetaMask.

#### Provider vs Signer

La distinction fondamentale dans Ethers.js :

- **Provider** (`BrowserProvider`) — Connexion en lecture seule au réseau. Permet d'appeler les fonctions `view` sans signature ni gas. Instancié via `new BrowserProvider(window.ethereum)`.
- **Signer** — Obtenu via `provider.getSigner()`. Représente l'identité on-chain de l'utilisateur. Nécessaire pour les fonctions d'écriture qui modifient l'état du contrat et coûtent du gas.

```javascript
// Lecture — provider suffit, gratuit
const contrat = new Contract(CONTRACT_ADDRESS, ABI, provider)
const count = await contrat.getCandidatesCount()

// Écriture — signer requis, coûte du gas
const signer = await provider.getSigner()
const voteContract = new Contract(CONTRACT_ADDRESS, ABI, signer)
const tx = await voteContract.vote(candidateIndex)
```

#### Connexion MetaMask

Le processus de connexion suit ces étapes :

1. **`eth_requestAccounts`** — Déclenche la popup MetaMask demandant l'autorisation de partager l'adresse publique. La clé privée ne quitte jamais MetaMask.
2. **Vérification du réseau** — `provider.getNetwork()` retourne le `chainId` (BigInt en Ethers v6). On vérifie qu'il correspond à Sepolia (11155111).
3. **Récupération de l'adresse** — `signer.getAddress()` retourne l'adresse Ethereum de l'utilisateur connecté.

#### Cycle de vie d'une transaction

Quand l'utilisateur vote, la transaction passe par 4 étapes visibles dans l'interface :

1. **Signature** — MetaMask calcule le hash de la transaction et la signe avec la clé privée (algorithme ECDSA)
2. **Envoi** — La transaction signée est diffusée sur le réseau. `tx.hash` est l'identifiant unique
3. **Attente** — La transaction entre dans le mempool. Un validateur l'inclut dans un bloc (~12 secondes sur Sepolia)
4. **Confirmation** — `tx.wait()` résout quand le bloc est validé. `receipt.blockNumber` identifie le bloc, `receipt.gasUsed` le coût réel

#### Écoute des events en temps réel

```javascript
const listenContract = new Contract(CONTRACT_ADDRESS, ABI, provider)
listenContract.on("Voted", (voter, candidateIndex) => {
    // Rafraîchir les résultats automatiquement
    loadCandidates(provider)
})
// Cleanup obligatoire pour éviter les memory leaks
return () => { listenContract.off("Voted", handler) }
```

Le `useEffect` React gère l'abonnement/désabonnement. Sans le `off()` dans le cleanup, chaque reconnexion ajouterait un listener supplémentaire, causant des appels dupliqués.

#### Blockchain Explorer embarqué

L'explorateur utilise `queryFilter` pour récupérer l'historique des events passés :

```javascript
const events = await contract.queryFilter(contract.filters.Voted(), 0)
```

Pour chaque event, on enrichit les données avec :
- `provider.getBlock(blockNumber)` — timestamp, parentHash, gasLimit, miner
- `provider.getTransactionReceipt(txHash)` — gasUsed de la transaction

Le `parentHash` illustre le mécanisme d'immuabilité : chaque bloc contient le hash du bloc précédent. Modifier un bloc changerait son hash, invalidant le parentHash du bloc suivant et toute la chaîne.

---

### 3. Déploiement — Hardhat

#### Configuration

Le fichier `hardhat.config.js` définit deux réseaux :

- **Ganache** (`http://127.0.0.1:8545`, chainId 1337) — Réseau local pour le développement. Instantané, gratuit, 10 comptes avec 1000 ETH chacun.
- **Sepolia** (via Alchemy, chainId 11155111) — Réseau de test Ethereum public. Les transactions sont réelles mais les ETH n'ont pas de valeur.

Les clés sensibles (URL Alchemy, clé privée) sont stockées dans `.env` via `dotenv`, jamais dans le code source.

#### Processus de déploiement

```javascript
const Factory = await ethers.getContractFactory("Vote")
const contrat = await Factory.deploy()
await contrat.waitForDeployment()
```

1. `getContractFactory` charge le bytecode compilé et l'ABI depuis `artifacts/`
2. `deploy()` envoie une transaction de création de contrat. Le bytecode est exécuté une seule fois (constructor)
3. `waitForDeployment()` attend la confirmation on-chain
4. L'adresse du contrat est déterministe (dérivée de l'adresse du déployeur + nonce)

#### ABI

L'ABI est le fichier JSON qui décrit les fonctions du contrat. C'est le pont entre le frontend JavaScript et le bytecode EVM. Sans elle, Ethers.js ne sait pas comment encoder les appels de fonction ni décoder les retours.

Elle est générée automatiquement par `npx hardhat compile` dans `artifacts/` et extraite dans `abi.json` pour être utilisée par le frontend.

---

### 4. Concepts blockchain clés

| Concept | Utilisation dans le projet |
|---|---|
| **Transaction** | Chaque vote est une transaction signée, identifiée par un hash unique |
| **Gas** | Coût computationnel d'exécution de `vote()` sur l'EVM (~53 000 unités) |
| **Block** | Conteneur de transactions. Un vote est inclus dans un bloc après ~12 secondes |
| **Event / Log** | `Voted` est enregistré de façon permanente dans les logs de la transaction |
| **require()** | Validation on-chain. Si la condition échoue, la transaction est annulée (revert) et le gas est remboursé |
| **block.timestamp** | Variable Solidity retournant l'heure de validation du bloc. Utilisée pour le cooldown car elle ne peut pas être manipulée côté client |
| **msg.sender** | Adresse de l'appelant. Fournie automatiquement par la signature ECDSA, impossible à falsifier |
| **mapping** | Structure de données clé-valeur stockée on-chain. `lastVoteTime` associe chaque adresse à son dernier timestamp de vote |

---

## Lancer le projet

### Frontend

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173 avec MetaMask sur Sepolia.

### Smart Contract (mon-contrat/)

```bash
cd mon-contrat
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Prérequis

- Node.js v18+
- MetaMask configuré sur Sepolia
- ETH Sepolia (faucet : https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- Compte Alchemy (https://alchemy.com) pour le déploiement Sepolia
