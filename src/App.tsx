import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, Check, ChevronDown, CircleHelp, Clipboard, Database, ExternalLink, Fingerprint, HeartPulse, KeyRound, LockKeyhole, Menu, Network, RotateCcw, ShieldCheck, Sparkles, Trash2, WalletCards, X, Zap } from 'lucide-react'
import { classifyWalletError, connectWallet, discoverWallets, type Network as MidnightNetwork, type WalletSession, type WalletState } from './lib/wallet'
import { loadCredential, rotateCredential, type LocalCredential } from './lib/privateState'
import { fetchPublicMetrics, type PublicMetrics } from './lib/api'
import { deployEligibilityContract } from './lib/deployment'
import { clearPublicReceipt, isPublicReceipt, loadPublicReceipt, PUBLIC_RECEIPT_EVENT, shortenIdentifier, transactionExplorerUrl, type PublicReceipt } from './lib/receipt'

type ProofState = 'ready' | 'proving' | 'awaiting' | 'finalized' | 'failed'
const stages = ['Review requirement', 'Select local key', 'Review privacy', 'Deploy contract']
const sections = [
  { id: 'proof-station', label: 'Proof station', icon: Activity },
  { id: 'receipts', label: 'Public receipts', icon: Database },
  { id: 'privacy', label: 'How privacy works', icon: CircleHelp },
]

export default function App() {
  const reduced = useReducedMotion()
  const [network, setNetwork] = useState<MidnightNetwork>('preview')
  const [wallet, setWallet] = useState<WalletState>('idle')
  const [walletName, setWalletName] = useState('')
  const [proof, setProof] = useState<ProofState>('ready')
  const [message, setMessage] = useState('No transaction has been created.')
  const [credential, setCredential] = useState<LocalCredential>(() => loadCredential())
  const [drawer, setDrawer] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null)
  const [metricsError, setMetricsError] = useState('')
  const [policyOpen, setPolicyOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('proof-station')
  const [receipt, setReceipt] = useState<PublicReceipt | null>(() => loadPublicReceipt())
  const [copied, setCopied] = useState('')
  const walletSession = useRef<WalletSession | null>(null)
  useEffect(() => {
    if (!discoverWallets().length) setWallet('unsupported')
    fetchPublicMetrics().then(setMetrics).catch((error: unknown) => setMetricsError(error instanceof Error ? error.message : 'Metrics unavailable.'))
  }, [])
  useEffect(() => {
    const receiveReceipt = (event: Event) => {
      const nextReceipt = (event as CustomEvent<unknown>).detail
      if (isPublicReceipt(nextReceipt)) setReceipt(nextReceipt)
    }
    window.addEventListener(PUBLIC_RECEIPT_EVENT, receiveReceipt)
    return () => window.removeEventListener(PUBLIC_RECEIPT_EVENT, receiveReceipt)
  }, [])
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting)
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-25% 0px -60% 0px' })
    sections.forEach(({ id }) => { const element = document.getElementById(id); if (element) observer.observe(element) })
    return () => observer.disconnect()
  }, [])

  const connect = async () => {
    setWallet('connecting'); setMessage('Waiting for 1AM approval…')
    try { const result = await connectWallet(network); walletSession.current = result.session; setWallet('connected'); setWalletName(result.wallet.name); setMessage(`Connected to ${result.wallet.name} on ${network}.`) }
    catch (error) { setWallet(discoverWallets().length ? 'rejected' : 'unsupported'); setMessage(classifyWalletError(error)) }
  }
  const disconnect = () => { walletSession.current = null; setWallet('idle'); setWalletName(''); setProof('ready'); setMessage('Session disconnected on this device.') }
  const switchNetwork = (next: MidnightNetwork) => { walletSession.current = null; setNetwork(next); setWallet('idle'); setWalletName(''); setProof('ready'); setMessage(`Network changed to ${next}. Reconnect your wallet before deploying.`) }
  const prove = async () => {
    if (wallet !== 'connected') { setMessage('Connect 1AM before deploying the Midnight contract.'); return }
    if (!walletSession.current) { setWallet('idle'); setMessage('The wallet session expired. Reconnect 1AM and try again.'); return }
    setProof('proving'); setMessage('Preparing the wallet-approved deployment. No personal data is transmitted to TriageKey.')
    try {
      const result = await deployEligibilityContract({ wallet: walletSession.current, network, credential })
      setReceipt(result.receipt)
      setProof('finalized')
      setMessage(result.registered ? 'Finalized on Midnight and registered in the public receipt service.' : 'Finalized on Midnight. The public registry is unavailable, so this device retained the public receipt.')
      document.getElementById('receipts')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    } catch (error) {
      setProof('failed')
      setMessage(error instanceof Error ? error.message : 'The deployment did not complete. No receipt was created.')
    }
  }
  const copy = async (label: string, value: string) => {
    try {
      await window.navigator.clipboard.writeText(value)
      setCopied(label)
    } catch {
      setCopied(`${label}:error`)
    }
    window.setTimeout(() => setCopied(''), 1800)
  }
  const activeStage = proof === 'ready' ? (wallet === 'connected' ? 3 : 2) : 3
  return <div className="app-shell">
    <aside className="rail"><div className="mark"><HeartPulse size={20}/><span>TRIAGE<br/>KEY</span></div><nav>{sections.map(({ id, label, icon: Icon }) => <a className={activeSection === id ? 'active' : ''} href={`#${id}`} key={id}><Icon/> {label}</a>)}</nav><div className="rail-bottom"><span className="live-dot"/> {network.toUpperCase()}<button onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu/></button></div></aside>
    <main>
      <header className="topbar"><div><span className="eyebrow">CARE ACCESS / PRIVATE ELIGIBILITY</span><h1>Prove what matters.<br/><em>Keep the rest private.</em></h1></div><div className="top-actions"><div className="network-switch" role="group" aria-label="Midnight network"><button className={network === 'preview' ? 'selected' : ''} onClick={() => switchNetwork('preview')}>Preview</button><button className={network === 'preprod' ? 'selected' : ''} onClick={() => switchNetwork('preprod')}>Preprod</button></div><button className={wallet === 'connected' ? 'wallet connected' : 'wallet'} onClick={wallet === 'connected' ? disconnect : connect}><WalletCards size={17}/>{wallet === 'connected' ? `${walletName} · connected` : wallet === 'connecting' ? 'Connecting…' : 'Connect 1AM'}</button></div></header>
      <section className={`requirement panel ${policyOpen ? 'expanded' : ''}`} id="proof-station"><div className="section-label"><span>01 / PUBLIC REQUIREMENT</span><span className="chip"><span/>Verifier policy</span></div><div className="requirement-copy"><div><h2>Northside Care Mobility Program</h2><p>Prove you meet the program’s public rule. The clinic does not receive your diagnosis, birth date, document, or wallet address.</p></div><button className="icon-button" onClick={() => setPolicyOpen(!policyOpen)} aria-expanded={policyOpen} aria-label="See requirement details"><ChevronDown/></button></div><div className="requirement-rule"><span>REQUESTED FACT</span><strong>Resident age 18+ <i>and</i> qualifying care pathway</strong></div><AnimatePresence>{policyOpen && <motion.div className="policy-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div><span>VERIFIER</span><strong>Northside Care Office</strong></div><div><span>DISCLOSES</span><strong>Eligibility outcome only</strong></div><div><span>REPLAY CONTROL</span><strong>One-time nullifier</strong></div></motion.div>}</AnimatePresence></section>
      <section className="steps" aria-label="Contract deployment workflow">{stages.map((stage, index) => <div className={`step ${index < activeStage ? 'complete' : ''} ${index === activeStage ? 'current' : ''}`} key={stage}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong>{index < activeStage ? <Check size={15}/> : index === activeStage ? <Zap size={15}/> : <ArrowRight size={15}/>}</div>)}</section>
      <div className="task-grid"><section className="credential panel"><div className="section-label"><span>02 / PRIVATE INPUT</span><span className="private"><LockKeyhole size={13}/>Stays in this browser</span></div><h2>Your local contract key</h2><p className="muted">A random holder secret authorizes future contract administration. TriageKey does not send it to its API, Gemini, or the public chain.</p><div className="record"><div className="record-head"><KeyRound size={19}/><div><strong>{credential.label}</strong><small>{credential.issuedAt}</small></div><span className="chip">ACTIVE</span></div><div className="field-grid"><Field label="LOCAL KEY ID" value={credential.keyId}/><Field label="HOLDER SECRET" value="••••••••••••"/><Field label="STORAGE" value="BROWSER PROFILE"/><Field label="NETWORK" value={network.toUpperCase()}/></div></div><div className="inline-actions"><button onClick={() => setCredential(rotateCredential())}><RotateCcw size={15}/> Replace local key</button><span>No files are sent</span></div></section>
        <section className="boundary panel"><div className="section-label"><span>03 / PRIVACY REVIEW</span><Fingerprint size={18}/></div><h2>Only deployment data becomes public.</h2><div className="boundary-graphic"><div className="private-side"><LockKeyhole/><span>PRIVATE</span><small>Holder secret and future signed patient attestations</small></div><div className="boundary-line"><i/></div><div className="public-side"><Network/><span>PUBLIC</span><strong>Contract receipt</strong><small>Policy commitment + finalized identifiers</small></div></div><p className="notice"><ShieldCheck size={17}/> Eligibility is not claimed during deployment. It requires a trusted issuer attestation later.</p></section></div>
      <section className="proof-row"><div className="proof panel"><div className="section-label"><span>04 / MIDNIGHT DEPLOYMENT</span><span className={`status ${proof}`}>{proof === 'ready' ? 'READY' : proof.toUpperCase()}</span></div><div className="proof-body"><div><h2>{proof === 'proving' ? 'Preparing the private contract…' : proof === 'awaiting' ? 'Confirm in your wallet' : proof === 'finalized' ? 'Finalized on Midnight.' : proof === 'failed' ? 'Deployment stopped safely.' : 'Ready when you are.'}</h2><p>{message}</p></div><button className="primary" disabled={proof === 'proving' || proof === 'finalized'} onClick={prove}>{proof === 'proving' ? <><span className="spinner"/> Deploying</> : proof === 'finalized' ? <><Check size={17}/> Finalized</> : <>Deploy contract <ArrowRight size={17}/></>}</button></div>{proof === 'proving' && <motion.div className="scan" initial={{ x: '-100%' }} animate={reduced ? {} : { x: '400%' }} transition={{ repeat: Infinity, duration: 1.2 }}/>}</div>
        <div className="metrics panel"><span className="section-label">PUBLIC NETWORK METRICS</span><div><strong>{metrics ? metrics.finalized_proofs.toLocaleString() : '—'}</strong><small>{metricsError || 'program proofs finalized'}</small></div><div><strong>{metrics ? metrics.private_attributes_stored : '—'}</strong><small>private attributes stored</small></div></div></section>
      <section className="assistant-card"><Sparkles size={18}/><div><strong>Policy helper</strong><p>Ask how the public rule is worded. Gemini receives only this public requirement and approved labels—not your local credential or wallet data.</p></div><button onClick={() => setAssistantOpen(!assistantOpen)}>{assistantOpen ? 'Close' : 'Ask a question'}</button>{assistantOpen && <div className="assistant-answer">The clinic learns only whether the policy evaluates to eligible. “Qualifying pathway” stays as a private check inside your proof.</div>}</section>
      <section className="receipt-section" id="receipts"><div className="section-label"><span>PUBLIC RECEIPTS / FINALIZED ONLY</span><span>NO PRIVATE ATTRIBUTES</span></div><div className={`receipt-grid ${receipt ? 'has-receipt' : ''}`}>{receipt ? <article className="receipt-card"><div className="receipt-heading"><div><span className="receipt-status"><span/> FINALIZED ON {receipt.network.toUpperCase()}</span><h2>Contract deployment receipt</h2><p>These identifiers came from the finalized Midnight deployment and are safe to share.</p></div><span className="block-stamp">BLOCK<br/><strong>#{receipt.block_height?.toLocaleString() ?? '—'}</strong></span></div><div className="identifier-list"><Identifier label="DEPLOYED CONTRACT ADDRESS" value={receipt.contract_address} copied={copied} onCopy={copy}/><Identifier label="TRANSACTION HASH" value={receipt.transaction_hash} copied={copied} onCopy={copy}/><Identifier label="TRANSACTION ID" value={receipt.transaction_id} copied={copied} onCopy={copy}/></div><div className="receipt-actions"><a href={transactionExplorerUrl(receipt)} target="_blank" rel="noreferrer">View transaction on explorer <ExternalLink size={14}/></a><button onClick={() => { clearPublicReceipt(); setReceipt(null) }}><Trash2 size={14}/> Remove from this device</button></div><small className="finalized-at">Finalized {new Date(receipt.finalized_at).toLocaleString()}</small></article> : <article><span className="receipt-status waiting">WAITING FOR A REAL TRANSACTION</span><h2>Your finalized identifiers will appear here.</h2><p>TriageKey never invents a transaction. After 1AM and Midnight finalize the deployment, this card shows the exact deployed contract address, transaction hash, transaction ID, network, block, and finalization time.</p></article>}<article className="receipt-checklist"><h3>Receipt checklist</h3><p><Check/> Deployed contract address</p><p><Check/> Finalized transaction hash</p><p><Check/> Network and block height</p><p><X/> Never: diagnosis, record, wallet address</p></article></div></section>
      <section className="privacy-section" id="privacy"><div><span className="eyebrow">PRIVACY, IN PLAIN LANGUAGE</span><h2>Care access should not demand your whole story.</h2></div><div className="privacy-list"><article><strong>01</strong><h3>You choose the credential</h3><p>Your protected care credential remains on your device. Replacing it changes the local record, not a central profile.</p></article><article><strong>02</strong><h3>The proof checks the rule</h3><p>Midnight compares your private facts with the clinic’s public requirement without publishing either fact.</p></article><article><strong>03</strong><h3>The clinic gets one answer</h3><p>They receive an eligibility result and replay-safe proof receipt—nothing that could expose your care history.</p></article></div></section>
      <footer><div className="mark"><HeartPulse/> TRIAGEKEY</div><p>Private eligibility infrastructure for patient-first programs.</p><div><a href="#proof-station">Proof station</a><a href="#receipts">Receipts</a><a href="#privacy">Privacy</a></div></footer>
    </main>
    <AnimatePresence>{drawer && <motion.div className="mobile-drawer" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}><button onClick={() => setDrawer(false)} aria-label="Close navigation"><X/></button><div className="mark"><HeartPulse/> TRIAGEKEY</div><nav>{sections.map(({ id, label }) => <a className={activeSection === id ? 'active' : ''} href={`#${id}`} onClick={() => setDrawer(false)} key={id}>{label}</a>)}</nav></motion.div>}</AnimatePresence>
  </div>
}
function Field({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div> }
function Identifier({ label, value, copied, onCopy }: { label: string; value: string; copied: string; onCopy: (label: string, value: string) => Promise<void> }) { return <div className="identifier"><span>{label}</span><code title={value}>{shortenIdentifier(value)}</code><button onClick={() => void onCopy(label, value)} aria-label={`Copy ${label.toLowerCase()}`}><Clipboard size={14}/>{copied === label ? 'Copied' : copied === `${label}:error` ? 'Copy failed' : 'Copy'}</button></div> }
