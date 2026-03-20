import { useState, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import ABI from './abi.json'
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID, EXPECTED_NETWORK_NAME } from './config'
import './index.css'
import './styles.css'
import imgLeonBlum   from '../img/Léon_Blum.jpg'
import imgChirac     from '../img/jacques chirac.jpg'
import imgMitterrand from '../img/francois mitterrabd.jpg'

const CANDIDATE_NAMES  = ['Léon Blum', 'Jacques Chirac', 'François Mitterrand']
const CANDIDATE_COLORS = ['blue', 'red', 'amber']
const CANDIDATE_IMGS   = [imgLeonBlum, imgChirac, imgMitterrand]

function Spinner() {
  return <span className="spinner" />
}

function BlockModal({ data, loading, onClose, onNavigate, voteBlocks }) {
  const [showExtra, setShowExtra] = useState(false)
  const [slideDir, setSlideDir]   = useState(null)
  if (!data) return null

  const { event, block } = data
  const fmt    = (ts) => ts != null ? new Date(ts * 1000).toLocaleString('fr-FR') : '—'
  const fmtNum = (n)  => n != null ? Number(n).toLocaleString('fr-FR') : '—'

  const sorted     = [...voteBlocks].sort((a, b) => b - a)
  const currentIdx = block?.number != null ? sorted.indexOf(block.number) : -1
  const canPrev    = currentIdx > 0
  const canNext    = currentIdx !== -1 && currentIdx < sorted.length - 1

  const handleNav = (target, dir) => { setSlideDir(dir); onNavigate(target) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Bloc #{block?.number ?? '...'}</div>
          <div className="modal-actions">
            {block?.number != null && (
              <a href={`https://sepolia.etherscan.io/block/${block.number}`}
                target="_blank" rel="noopener noreferrer" className="modal-btn modal-btn--accent">
                Etherscan
              </a>
            )}
            <button className="modal-btn" onClick={onClose}>Fermer</button>
          </div>
        </div>

        <div className="modal-body" style={loading ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
          <div className={slideDir ? `block-slide-${slideDir}` : ''} key={block?.number}>
            {event ? (
              <>
                <Row label="Transaction Hash" value={event.hash ?? '—'}
                  link={event.hash ? `https://sepolia.etherscan.io/tx/${event.hash}` : null} />
                <Row label="Votant"        value={event.voter ?? '—'} />
                <Row label="Candidat voté" value={event.candidateName ?? '—'} highlight />
                <Row label="Gas (tx)"      value={event.gasUsed != null ? `${fmtNum(event.gasUsed)} unités` : '—'} />
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', marginBottom: 12 }}>
                Aucun vote dans ce bloc.
              </p>
            )}

            <Row label="Numéro de bloc" value={block?.number != null ? `#${block.number}` : '—'} />
            <Row label="Timestamp"      value={fmt(block?.timestamp)} />
            <Row label="parentHash"     value={block?.parentHash ?? '—'} />

            <button className="modal-toggle-extra" onClick={() => setShowExtra(s => !s)}>
              {showExtra ? '▴ Masquer les détails' : '▾ Plus d\'infos'}
            </button>

            {showExtra && (
              <>
                <Row label="gasLimit (bloc)"    value={block?.gasLimit != null ? `${fmtNum(block.gasLimit)} unités` : '—'} />
                <Row label="gasUsed (bloc)"     value={block?.gasUsedBlock != null ? `${fmtNum(block.gasUsedBlock)} unités` : '—'} />
                <Row label="Validateur (miner)" value={block?.miner ?? '—'} />
              </>
            )}

            <div className="modal-pedagogy">
              Le parentHash est le hash du bloc précédent. Ce lien cryptographique rend la blockchain
              immuable : modifier ce bloc changerait son hash, invalidant toute la chaîne.
            </div>
          </div>
        </div>

        <div className="modal-nav">
          <button className="modal-nav-btn" disabled={!canPrev}
            onClick={() => canPrev && handleNav(sorted[currentIdx - 1], 'left')}>
            ← Bloc précédent
          </button>
          <button className="modal-nav-btn" disabled={!canNext}
            onClick={() => canNext && handleNav(sorted[currentIdx + 1], 'right')}>
            Bloc suivant →
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, link, highlight }) {
  return (
    <div className="modal-row">
      <div className="modal-row-label">{label}</div>
      {link ? (
        <div className="modal-row-value"><a href={link} target="_blank" rel="noopener noreferrer">{value}</a></div>
      ) : (
        <div className={`modal-row-value${highlight ? ' modal-row-value--highlight' : ''}`}>{value}</div>
      )}
    </div>
  )
}

function CandidateModal({ candidate, totalVotes, explorerEvents, onClose, provider }) {
  if (!candidate) return null

  const color  = CANDIDATE_COLORS[candidate.id] || 'blue'
  const pct    = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0.0'
  const votes  = explorerEvents.filter(e => e.candidateIndex === candidate.id)
  const fmt    = (ts) => ts != null ? new Date(ts * 1000).toLocaleString('fr-FR') : '—'
  const unique = new Set(votes.map(v => v.voter)).size

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box cmodal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{candidate.name}</div>
          <button className="modal-btn" onClick={onClose}>Fermer</button>
        </div>

        <div className="modal-body">
          <div className="cmodal-top">
            <img src={CANDIDATE_IMGS[candidate.id]} alt={candidate.name}
              className={`cmodal-img cmodal-img--${color}`} />
            <div className="cmodal-stats">
              <div className="cmodal-stat">
                <span className="cmodal-stat-value">{candidate.votes}</span>
                <span className="cmodal-stat-label">votes</span>
              </div>
              <div className="cmodal-stat">
                <span className={`cmodal-stat-value cmodal-stat-value--${color}`}>{pct}%</span>
                <span className="cmodal-stat-label">du total</span>
              </div>
              <div className="cmodal-stat">
                <span className="cmodal-stat-value">{unique}</span>
                <span className="cmodal-stat-label">votant{unique !== 1 ? 's' : ''} unique{unique !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="cmodal-bar-wrap">
              <div className={`cmodal-bar cmodal-bar--${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="cmodal-section-title">
            Historique des votes ({votes.length})
          </div>

          {votes.length === 0 ? (
            <p className="cmodal-empty">Aucun vote enregistré pour ce candidat.</p>
          ) : (
            <div className="cmodal-table-wrap">
              <table className="explorer-table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Bloc</th>
                    <th>Votant</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((v, i) => (
                    <tr key={i}>
                      <td className="td-hash">
                        <a href={`https://sepolia.etherscan.io/tx/${v.hash}`}
                          target="_blank" rel="noopener noreferrer">
                          {v.hash.slice(0, 10)}...{v.hash.slice(-6)}
                        </a>
                      </td>
                      <td>{v.blockNumber}</td>
                      <td>{v.voter.slice(0, 8)}...{v.voter.slice(-4)}</td>
                      <td className="td-muted">{fmt(v.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [account, setAccount]                 = useState(null)
  const [provider, setProvider]               = useState(null)
  const [candidates, setCandidates]           = useState([])
  const [isVoting, setIsVoting]               = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [error, setError]                     = useState(null)
  const [lastEvent, setLastEvent]             = useState(null)
  const [txStatus, setTxStatus]               = useState(null)
  const [txHash, setTxHash]                   = useState(null)
  const [explorerOpen, setExplorerOpen]       = useState(false)
  const [explorerEvents, setExplorerEvents]   = useState([])
  const [explorerLoading, setExplorerLoading] = useState(false)
  const [modalData, setModalData]             = useState(null)
  const [modalLoading, setModalLoading]       = useState(false)
  const [candidateModal, setCandidateModal]   = useState(null)
  const [allEvents, setAllEvents]             = useState([])

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return
      try {
        const p = new BrowserProvider(window.ethereum)
        setProvider(p)
        await loadCandidates(p)
      } catch { /* silent */ }
    }
    init()
  }, [])

  const loadCandidates = async (_provider) => {
    const c = new Contract(CONTRACT_ADDRESS, ABI, _provider)
    const count = await c.getCandidatesCount()
    const list = []
    for (let i = 0; i < Number(count); i++) {
      const [name, voteCount] = await c.getCandidate(i)
      list.push({ id: i, name, votes: Number(voteCount) })
    }
    setCandidates(list)
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) { setError("MetaMask n'est pas installé."); return }
      const _provider = new BrowserProvider(window.ethereum)
      await _provider.send("eth_requestAccounts", [])
      const network = await _provider.getNetwork()
      if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
        setError(`Mauvais réseau — connectez MetaMask sur ${EXPECTED_NETWORK_NAME}.`)
        return
      }
      const signer = await _provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)
      setProvider(_provider)
      setError(null)
      await loadCandidates(_provider)
    } catch { setError("Connexion refusée.") }
  }

  const vote = async (candidateId) => {
    try {
      setIsVoting(true)
      setError(null)
      setTxStatus({ step: 1 })
      const signer = await provider.getSigner()
      const voteContract = new Contract(CONTRACT_ADDRESS, ABI, signer)
      const secondsLeft = Number(await voteContract.getTimeUntilNextVote(account))
      if (secondsLeft > 0) {
        setCooldownSeconds(secondsLeft)
        setIsVoting(false)
        setTxStatus(null)
        return
      }
      const tx = await voteContract.vote(candidateId)
      setTxHash(tx.hash)
      setTxStatus({ step: 2, hash: tx.hash })
      setTxStatus({ step: 3, hash: tx.hash })
      const receipt = await tx.wait()
      setTxStatus({ step: 4, hash: tx.hash, blockNumber: receipt.blockNumber })
      await loadCandidates(provider)
      if (explorerOpen) loadExplorerEvents()
      setCooldownSeconds(3 * 60)
    } catch (err) {
      setTxStatus(null)
      setError(err.code === 4001 ? "Transaction annulée." : "Erreur : " + err.message)
    } finally {
      setIsVoting(false)
    }
  }

  useEffect(() => {
    if (!provider) return
    let listenContract
    try {
      listenContract = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const handler = (voter, candidateIndex) => {
        const idx = Number(candidateIndex)
        setLastEvent({
          voter: voter.slice(0, 6) + '...' + voter.slice(-4),
          candidateName: CANDIDATE_NAMES[idx] ?? `Candidat #${idx}`,
        })
        loadCandidates(provider)
      }
      listenContract.on("Voted", handler)
      return () => { listenContract.off("Voted", handler) }
    } catch (err) {
      console.warn("Events listener error:", err.message)
    }
  }, [provider])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const loadExplorerEvents = async (_provider) => {
    const p = _provider || provider
    if (!p) return
    setExplorerLoading(true)
    try {
      const ec  = new Contract(CONTRACT_ADDRESS, ABI, p)
      const raw = await ec.queryFilter(ec.filters.Voted(), 0)
      const all = raw.slice().reverse()
      const enriched = await Promise.all(all.map(async (e) => {
        const idx = Number(e.args.candidateIndex)
        let timestamp = null, parentHash = null, gasUsed = null
        let gasLimit = null, miner = null, gasUsedBlock = null
        try {
          const block  = await p.getBlock(e.blockNumber)
          timestamp    = block?.timestamp  ?? null
          parentHash   = block?.parentHash ?? null
          gasLimit     = block?.gasLimit   != null ? Number(block.gasLimit) : null
          miner        = block?.miner      ?? null
          gasUsedBlock = block?.gasUsed    != null ? Number(block.gasUsed)  : null
        } catch { /* silent */ }
        try {
          const receipt = await p.getTransactionReceipt(e.transactionHash)
          gasUsed = receipt?.gasUsed != null ? Number(receipt.gasUsed) : null
        } catch { /* silent */ }
        return {
          hash: e.transactionHash, blockNumber: e.blockNumber,
          voter: e.args.voter, candidateIndex: idx,
          candidateName: CANDIDATE_NAMES[idx] ?? `Candidat #${idx}`,
          timestamp, parentHash, gasUsed, gasLimit, miner, gasUsedBlock,
        }
      }))
      setExplorerEvents(enriched)
    } catch { setExplorerEvents([]) }
    finally { setExplorerLoading(false) }
  }

  useEffect(() => {
    if (explorerOpen && provider) loadExplorerEvents()
  }, [explorerOpen])

  const openModal = (event) => {
    setModalData({
      event,
      block: {
        number: event.blockNumber, parentHash: event.parentHash,
        timestamp: event.timestamp, gasLimit: event.gasLimit,
        miner: event.miner, gasUsedBlock: event.gasUsedBlock,
      },
    })
  }

  const navigateModal = async (targetNum) => {
    setModalLoading(true)
    try {
      const block = await provider.getBlock(targetNum)
      const match = explorerEvents.find(e => e.blockNumber === targetNum) || null
      setModalData({
        event: match,
        block: {
          number: block.number, parentHash: block.parentHash,
          timestamp: block.timestamp,
          gasLimit: block.gasLimit != null ? Number(block.gasLimit) : null,
          miner: block.miner ?? null,
          gasUsedBlock: block.gasUsed != null ? Number(block.gasUsed) : null,
        },
      })
    } catch { /* silent */ }
    finally { setModalLoading(false) }
  }

  const openCandidateModal = async (candidate) => {
    setCandidateModal(candidate)
    if (allEvents.length === 0 && provider) {
      try {
        const ec  = new Contract(CONTRACT_ADDRESS, ABI, provider)
        const raw = await ec.queryFilter(ec.filters.Voted(), 0)
        const enriched = await Promise.all(raw.slice().reverse().map(async (e) => {
          const idx = Number(e.args.candidateIndex)
          let timestamp = null
          try {
            const block = await provider.getBlock(e.blockNumber)
            timestamp = block?.timestamp ?? null
          } catch { /* silent */ }
          return {
            hash: e.transactionHash, blockNumber: e.blockNumber,
            voter: e.args.voter, candidateIndex: idx,
            candidateName: CANDIDATE_NAMES[idx] ?? `Candidat #${idx}`,
            timestamp,
          }
        }))
        setAllEvents(enriched)
      } catch { /* silent */ }
    }
  }

  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0)
  const fmt        = (ts) => ts != null ? new Date(ts * 1000).toLocaleString('fr-FR') : '—'
  const voteBlocks = explorerEvents.map(e => e.blockNumber)
  const shortAddr  = (a) => a ? a.slice(0, 6) + '...' + a.slice(-4) : ''

  return (
    <div className="page">

      <header className="header">
        <div className="header-left">
          <h1>Election Présidentielle TD3</h1>
          <p>BELLONET Mattéo, CLAMY--COURTIAL Enzo, KHAIR Souhail, MORIN Ugo</p>
        </div>
        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            🦊 Connecter MetaMask
          </button>
        ) : (
          <div className="wallet-pill">
            <div className="wallet-dot" />
            <span className="wallet-addr">{shortAddr(account)}</span>
            <span className="wallet-network">{EXPECTED_NETWORK_NAME}</span>
          </div>
        )}
      </header>

      {error && <div className="banner banner--error">⚠ {error}</div>}

      {lastEvent && (
        <div className="banner banner--event">
          <span>
            Nouveau vote — <strong>{lastEvent.voter}</strong> a voté pour{' '}
            <strong>{lastEvent.candidateName}</strong>
          </span>
        </div>
      )}

      {txStatus?.step === 4 && (
        <div className="banner banner--success">
          <span>Vote confirmé !</span>
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank" rel="noopener noreferrer">
            Voir sur Etherscan — Bloc #{txStatus.blockNumber}
          </a>
        </div>
      )}

      {txStatus && txStatus.step < 4 && (
        <div className="banner banner--event">
          {txStatus.step === 1 && <><Spinner /><span>Signature dans MetaMask...</span></>}
          {txStatus.step === 2 && <><Spinner /><span>Transaction envoyée...</span></>}
          {txStatus.step === 3 && <><Spinner /><span>En attente de confirmation (~12s)...</span></>}
        </div>
      )}

      {cooldownSeconds > 0 && (
        <div className="cooldown">
          <div className="cooldown-label">Prochain vote disponible dans</div>
          <div className="cooldown-timer">
            {String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}
            :
            {String(cooldownSeconds % 60).padStart(2, '0')}
          </div>
          <div className="cooldown-sub">
            La blockchain enregistre l'heure de votre dernier vote via block.timestamp
          </div>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="candidates-grid">
          {candidates.map((c) => {
            const pct   = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
            const color = CANDIDATE_COLORS[c.id] || 'blue'
            return (
              <div key={c.id} className={`candidate-card candidate-card--${color}`}>
                <img src={CANDIDATE_IMGS[c.id]} alt={c.name} className="candidate-img"
                  onClick={() => openCandidateModal(c)}
                  title={`Voir les détails de ${c.name}`} />
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-votes">{c.votes} vote{c.votes !== 1 ? 's' : ''}</div>
                <div className="progress-track">
                  <div className={`progress-fill progress-fill--${color}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="candidate-pct">{pct}%</div>
                {account && cooldownSeconds === 0 && (
                  <button className="vote-btn" onClick={() => vote(c.id)} disabled={isVoting}>
                    {isVoting ? 'En cours...' : 'Voter'}
                  </button>
                )}
                {!account && (
                  <button className="vote-btn" onClick={connectWallet}>
                    Connectez-vous pour voter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="explorer-section">
        <button className="explorer-toggle" onClick={() => setExplorerOpen(o => !o)}>
          {explorerOpen ? "Masquer l'explorateur" : "Afficher l'explorateur"}
        </button>

        {explorerOpen && (
          <div className="explorer-table-wrap">
            {explorerLoading ? (
              <div className="explorer-loading"><Spinner />Chargement...</div>
            ) : explorerEvents.length === 0 ? (
              <div className="explorer-empty">Aucun vote enregistré.</div>
            ) : (
              <table className="explorer-table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Bloc</th>
                    <th>Votant</th>
                    <th>Candidat</th>
                    <th>Heure</th>
                    <th>Gas</th>
                  </tr>
                </thead>
                <tbody>
                  {explorerEvents.map((e, i) => (
                    <tr key={i} onClick={() => openModal(e)}>
                      <td className="td-hash">
                        <a href={`https://sepolia.etherscan.io/tx/${e.hash}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={ev => ev.stopPropagation()}>
                          {e.hash.slice(0, 10)}...{e.hash.slice(-6)}
                        </a>
                      </td>
                      <td>{e.blockNumber}</td>
                      <td>{e.voter.slice(0, 8)}...{e.voter.slice(-4)}</td>
                      <td>{e.candidateName}</td>
                      <td className="td-muted">{fmt(e.timestamp)}</td>
                      <td>{e.gasUsed ? e.gasUsed.toLocaleString('fr-FR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <footer className="footer">
        Contrat :{' '}
        <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#transactions`}
          target="_blank" rel="noopener noreferrer" className="footer-link">
          {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}
        </a>
        {' '}· Réseau {EXPECTED_NETWORK_NAME}
      </footer>

      <BlockModal
        data={modalData}
        loading={modalLoading}
        onClose={() => { setModalData(null); setModalLoading(false) }}
        onNavigate={navigateModal}
        voteBlocks={voteBlocks}
      />

      <CandidateModal
        candidate={candidateModal}
        totalVotes={totalVotes}
        explorerEvents={allEvents.length > 0 ? allEvents : explorerEvents}
        onClose={() => setCandidateModal(null)}
        provider={provider}
      />
    </div>
  )
}

export default App
