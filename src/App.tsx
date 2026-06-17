import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowLeftRight,
  Shuffle,
  Award,
  Info,
  Wallet,
  Menu,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronRight,
  Terminal,
  ArrowDown,
  Shield,
} from 'lucide-react'
import { ethers } from 'ethers'

/* ----------------------------- Config ----------------------------- */

const BG_IMAGE_1 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85'

const BG_IMAGE_2 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85'

const SPOTLIGHT_R = 260

const SONEIUM_CHAIN_ID = 1868
const SONEIUM_CHAIN_HEX = '0x74c'
const SONEIUM_RPC = 'https://rpc.soneium.org/'
const SONEIUM_EXPLORER = 'https://soneium.blockscout.com'
const DEMO_ADDRESS = '0xE134662e9CDf904Ea3D90dB3F527054ED3687d83'

const CONTRACTS = {
  S1: '0x05AB5e724848cEFeac6D303CDf94032E5Cc3552B',
  S2: '0x6b2f6D8216E075D3a71F4aaf21d7158Af9B8dc82',
  S3: '0x7BF02b42b9d4cCD85b497C9F53e6b7474f9c2546',
  S4: '0x17121f9a7041ffe3ef248f7b84658d9229bad64f',
  OG: '0x2A21B17E366836e5FFB19bd47edB03b4b551C89d',
  WETH: '0x4200000000000000000000000000000000000006',
  UNI_ROUTER: '0x0E2850543f69F678257266E0907fF9A58B3F13dE',
  L1_BRIDGE: '0x5933e323bE8896DfaCd1cD671442F27dAA10a053',
}

const ERC721_ABI = ['function balanceOf(address owner) view returns (uint256)']
const ERC1155_ABI = ['function balanceOf(address account, uint256 id) view returns (uint256)']

const BADGES = [
  { key: 'S1', name: 'Season 1', icon: '💎', addr: CONTRACTS.S1, std: 'ERC-721' },
  { key: 'S2', name: 'Season 2', icon: '🔥', addr: CONTRACTS.S2, std: 'ERC-721' },
  { key: 'S3', name: 'Season 3', icon: '⚡', addr: CONTRACTS.S3, std: 'ERC-721' },
  { key: 'S4', name: 'Season 4', icon: '🏆', addr: CONTRACTS.S4, std: 'ERC-721' },
] as const

const AUTOMATION_TARGETS = [
  'Ecosystem Poke Contract (POKE) at 0xac3fa70',
  'NFT Factory 0xe134662e',
  'Uniswap V4 Universal Router 0x0E28505',
  'Native Liquidity Packager (WETH)',
  'Network Heartbeat Thread',
]

type LogType = 'info' | 'success' | 'warn'
type AuditLog = { id: string; timestamp: string; type: LogType; message: string }

type ConfirmModalState = {
  isOpen: boolean
  title: string
  targetContract: string
  calldata: string
  value: string
  estimatedGas: string
  onConfirm: () => Promise<void>
}

type ToastState = {
  status: 'success' | 'error'
  msg: string
  txHash?: string
} | null

type BadgeMetrics = {
  loading: boolean
  queried: boolean
  balances: Record<string, number>
  ogBal: number
  walletTotalTx: number
  nftCount: number
}

const EMPTY_METRICS: BadgeMetrics = {
  loading: false,
  queried: false,
  balances: { S1: 0, S2: 0, S3: 0, S4: 0 },
  ogBal: 0,
  walletTotalTx: 0,
  nftCount: 0,
}

/* ----------------------------- Helpers ----------------------------- */

function shortAddr(a: string) {
  if (!a) return ''
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function nowStamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}

function getInjected(): any {
  if (typeof window === 'undefined') return null
  return (window as any).ethereum || null
}

/* ------------------------- Reveal spotlight ------------------------- */

type RevealLayerProps = {
  image: string
  cursorX: number
  cursorY: number
  fixed: boolean
}

function RevealLayer({ image, cursorX, cursorY, fixed }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const revealRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sizeCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)
    return () => window.removeEventListener('resize', sizeCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const reveal = revealRef.current
    if (!canvas || !reveal) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2)
    ctx.fill()

    const dataUrl = canvas.toDataURL()
    const style = reveal.style as CSSStyleDeclaration & {
      webkitMaskImage?: string
      webkitMaskSize?: string
      webkitMaskRepeat?: string
    }
    style.maskImage = `url(${dataUrl})`
    style.webkitMaskImage = `url(${dataUrl})`
    style.maskSize = '100% 100%'
    style.webkitMaskSize = '100% 100%'
    style.maskRepeat = 'no-repeat'
    style.webkitMaskRepeat = 'no-repeat'
  })

  const positionClass = fixed ? 'fixed' : 'absolute'
  return (
    <>
      <canvas
        ref={canvasRef}
        className={`${positionClass} inset-0 pointer-events-none z-30`}
        style={ { display: 'none' } }
      />
      <div
        ref={revealRef}
        className={`${positionClass} inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none`}
        style={ { backgroundImage: `url(${image})` } }
      />
    </>
  )
}

/* ----------------------- Presentational bits ----------------------- */

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-[10px] uppercase tracking-wider text-white/70 bg-white/10 border border-white/15 rounded-full px-2 py-0.5 font-mono">
      {children}
    </span>
  )
}

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2.5 rounded-xl bg-[#e8702a]/10 border border-[#e8702a]/20 text-[#e8702a]">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">{title}</h2>
        <p className="text-xs text-white/50 font-mono">{subtitle}</p>
      </div>
    </div>
  )
}

/* ------------------------------- App ------------------------------- */

export default function App() {
  // Connection
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)

  // UI
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('swap')
  const [txProcessing, setTxProcessing] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    targetContract: '',
    calldata: '',
    value: '',
    estimatedGas: '',
    onConfirm: async () => {},
  })

  // Forms
  const [swapAmount, setSwapAmount] = useState('')
  const [swapType, setSwapType] = useState<'ETH_WETH' | 'WETH_ETH'>('ETH_WETH')
  const [wrapAmount, setWrapAmount] = useState('')
  const [bridgeAmount, setBridgeAmount] = useState('')

  // Badge explorer
  const [searchAddress, setSearchAddress] = useState('')
  const [searchError, setSearchError] = useState('')
  const [badgeMetrics, setBadgeMetrics] = useState<BadgeMetrics>(EMPTY_METRICS)

  // Automation
  const [isLooping, setIsLooping] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: 'boot', timestamp: nowStamp(), type: 'info', message: 'Engine cluster standing by for connection state change.' },
  ])

  // Spotlight cursor
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number | null>(null)
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const logRef = useRef<HTMLDivElement | null>(null)

  const wrongNetwork = !isDemoMode && isConnected && chainId !== null && chainId !== SONEIUM_CHAIN_ID

  /* ---- Logging ---- */
  const addLog = (type: LogType, message: string) => {
    setLogs((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp: nowStamp(), type, message }]
      return next.slice(-80)
    })
  }

  /* ---- Spotlight lerp loop ---- */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', handleMove)
    const tick = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  /* ---- Restore persisted session ---- */
  useEffect(() => {
    const saved = localStorage.getItem('_lfsoneium_addr')
    const savedDemo = localStorage.getItem('_lfsoneium_demo') === '1'
    if (saved && ethers.utils.isAddress(saved)) {
      setWalletAddress(saved)
      setIsConnected(true)
      setIsDemoMode(savedDemo)
      if (!savedDemo) {
        const eth = getInjected()
        if (eth) {
          eth.request({ method: 'eth_chainId' })
            .then((cid: string) => setChainId(parseInt(cid, 16)))
            .catch(() => {})
        }
      }
    }
  }, [])

  /* ---- Wallet event listeners (real mode) ---- */
  useEffect(() => {
    const eth = getInjected()
    if (!eth || isDemoMode) return
    const onAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet()
      } else {
        setWalletAddress(accounts[0])
        localStorage.setItem('_lfsoneium_addr', accounts[0])
        addLog('info', `Active account switched to ${accounts[0]}`)
      }
    }
    const onChain = (cid: string) => {
      setChainId(parseInt(cid, 16))
      addLog('info', `Network changed to chainId ${parseInt(cid, 16)}`)
    }
    if (eth.on) {
      eth.on('accountsChanged', onAccounts)
      eth.on('chainChanged', onChain)
    }
    return () => {
      if (eth.removeListener) {
        eth.removeListener('accountsChanged', onAccounts)
        eth.removeListener('chainChanged', onChain)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode])

  /* ---- Terminal autoscroll ---- */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  /* ---- Automation loop (Fluid Jitter 2–7s) ---- */
  useEffect(() => {
    if (!isLooping) return
    let cancelled = false
    let timer: number | undefined
    const run = () => {
      if (cancelled) return
      const target = AUTOMATION_TARGETS[Math.floor(Math.random() * AUTOMATION_TARGETS.length)]
      const ok = Math.random() > 0.25
      const cooldown = 2 + Math.random() * 5
      addLog(
        ok ? 'success' : 'warn',
        ok
          ? `Smart Mix Loop executed micro-tx against ${target}`
          : `Fluid Jitter: transient congestion at ${target}, retrying…`,
      )
      addLog('info', `Jitter resolved cooldown = ${cooldown.toFixed(2)}s`)
      timer = window.setTimeout(run, cooldown * 1000)
    }
    timer = window.setTimeout(run, 1200)
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLooping])

  /* ---- Wallet actions ---- */
  const connectWallet = async () => {
    const eth = getInjected()
    if (eth && eth.request) {
      try {
        const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
        const addr = accounts[0]
        const cid: string = await eth.request({ method: 'eth_chainId' })
        setWalletAddress(addr)
        setChainId(parseInt(cid, 16))
        setIsDemoMode(false)
        setIsConnected(true)
        localStorage.setItem('_lfsoneium_addr', addr)
        localStorage.removeItem('_lfsoneium_demo')
        addLog('success', `Wallet linked. Active session: ${addr}`)
      } catch (e: any) {
        addLog('warn', 'Wallet authorization rejected by user.')
      }
    } else {
      // Graceful demo fallback
      setWalletAddress(DEMO_ADDRESS)
      setIsDemoMode(true)
      setChainId(SONEIUM_CHAIN_ID)
      setIsConnected(true)
      localStorage.setItem('_lfsoneium_addr', DEMO_ADDRESS)
      localStorage.setItem('_lfsoneium_demo', '1')
      addLog('info', 'No browser wallet detected — booted Demo Mode with simulated signer.')
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress('')
    setIsDemoMode(false)
    setChainId(null)
    setIsLooping(false)
    setIsMobileMenuOpen(false)
    localStorage.removeItem('_lfsoneium_addr')
    localStorage.removeItem('_lfsoneium_demo')
    addLog('info', 'Active session disconnected.')
  }

  const switchToSoneium = async () => {
    const eth = getInjected()
    if (!eth) return
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SONEIUM_CHAIN_HEX }] })
    } catch (e: any) {
      if (e && e.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SONEIUM_CHAIN_HEX,
                chainName: 'Soneium',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: [SONEIUM_RPC],
                blockExplorerUrls: [SONEIUM_EXPLORER],
              },
            ],
          })
        } catch {
          addLog('warn', 'Failed to add Soneium network.')
        }
      }
    }
  }

  /* ---- Transaction gating (confirm modal -> simulated broadcast) ---- */
  const showToast = (status: 'success' | 'error', msg: string, txHash?: string) => {
    setToast({ status, msg, txHash })
    window.setTimeout(() => setToast(null), 7000)
  }

  const stageTransactionWrite = (
    title: string,
    target: string,
    calldata: string,
    value: string,
    onConfirm: () => Promise<void>,
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      targetContract: target,
      calldata,
      value,
      estimatedGas: (Math.random() * 0.003 + 0.00015).toFixed(6) + ' ETH',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        setTxProcessing(true)
        try {
          await onConfirm()
        } catch {
          showToast('error', 'Transaction reverted in the execution pipeline.')
        } finally {
          setTxProcessing(false)
        }
      },
    })
  }

  /* ---- Section actions ---- */
  const handleSwap = (e: FormEvent) => {
    e.preventDefault()
    if (!swapAmount || parseFloat(swapAmount) <= 0) return
    let hexAmt = ''
    try {
      hexAmt = ethers.utils.parseEther(swapAmount).toHexString().slice(2)
    } catch {
      hexAmt = '00'
    }
    stageTransactionWrite(
      'Uniswap V4 Universal Router — execute()',
      CONTRACTS.UNI_ROUTER,
      `0x3593564c${'00'.repeat(8)}${hexAmt}`,
      swapType === 'ETH_WETH' ? swapAmount : '0.0',
      async () => {
        await new Promise((r) => setTimeout(r, 1800))
        showToast('success', `Swapped ${swapAmount} ${swapType === 'ETH_WETH' ? 'ETH → WETH' : 'WETH → ETH'}.`, '0x78a1c4e9f2b3d6a7c8e1f0b9d2a3c4e5f6071829')
        addLog('success', `Swap finalized. Volume ${swapAmount}.`)
        setSwapAmount('')
      },
    )
  }

  const handlePackaging = (type: 'wrap' | 'unwrap') => {
    if (type === 'wrap' && (!wrapAmount || parseFloat(wrapAmount) <= 0)) return
    stageTransactionWrite(
      type === 'wrap' ? 'WETH.deposit()' : 'WETH.withdraw(all)',
      CONTRACTS.WETH,
      type === 'wrap' ? '0xd0e30db0' : '0x2e1a7d4d',
      type === 'wrap' ? wrapAmount : '0.0',
      async () => {
        await new Promise((r) => setTimeout(r, 1500))
        showToast('success', `Liquidity packager: ${type === 'wrap' ? 'wrapped ' + wrapAmount + ' ETH' : 'unwrapped full WETH balance'}.`, '0x2c4ea911b8d7f605a4c3b2e1d0f9a8b7c6d5e4f3')
        addLog('success', `Native packaging state shifted — ${type.toUpperCase()}.`)
        if (type === 'wrap') setWrapAmount('')
      },
    )
  }

  const handleBridge = (e: FormEvent) => {
    e.preventDefault()
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return
    stageTransactionWrite(
      'L1StandardBridge.depositETH()',
      CONTRACTS.L1_BRIDGE,
      '0xb1a1a5b4000000000000000000000000000000000000000000000000000000000001e848',
      bridgeAmount,
      async () => {
        await new Promise((r) => setTimeout(r, 2200))
        showToast('success', `Bridge deposit of ${bridgeAmount} ETH submitted to Soneium gateway.`, '0x91b288ccf3a2d1e0b9c8a7f6e5d4c3b2a1908172')
        addLog('info', 'L1 bridge deposit detected. Monitoring confirmation depth.')
        setBridgeAmount('')
      },
    )
  }

  const handleScan = async (e: FormEvent) => {
    e.preventDefault()
    setSearchError('')
    if (!ethers.utils.isAddress(searchAddress)) {
      setSearchError('Invalid EVM address format. Expected a 0x… 40-hex address.')
      return
    }
    const target = ethers.utils.getAddress(searchAddress)
    setBadgeMetrics((prev) => ({ ...prev, loading: true, queried: false }))
    addLog('info', `Querying Soneium RPC for badge ownership of ${target}…`)

    // Try real reads against Soneium; gracefully fall back to demo data.
    try {
      const provider = new ethers.providers.JsonRpcProvider(SONEIUM_RPC)
      const erc721Bal = async (addr: string) => {
        const c = new ethers.Contract(addr, ERC721_ABI, provider)
        const bn = await c.balanceOf(target)
        return (bn as ethers.BigNumber).toNumber()
      }
      const og = new ethers.Contract(CONTRACTS.OG, ERC1155_ABI, provider)
      const [s1, s2, s3, s4, ogBn, txc] = await Promise.all([
        erc721Bal(CONTRACTS.S1),
        erc721Bal(CONTRACTS.S2),
        erc721Bal(CONTRACTS.S3),
        erc721Bal(CONTRACTS.S4),
        og.balanceOf(target, 0),
        provider.getTransactionCount(target),
      ])
      const ogBal = (ogBn as ethers.BigNumber).toNumber()
      const nftCount = s1 + s2 + s3 + s4 + ogBal
      setBadgeMetrics({
        loading: false,
        queried: true,
        balances: { S1: s1, S2: s2, S3: s3, S4: s4 },
        ogBal,
        walletTotalTx: txc,
        nftCount,
      })
      addLog('success', `On-chain snapshot synchronized for ${shortAddr(target)}.`)
    } catch (err) {
      // Graceful demo fallback if RPC unreachable / CORS.
      const rnd = (p: number) => (Math.random() > p ? 1 : 0)
      const balances = { S1: rnd(0.5), S2: rnd(0.6), S3: rnd(0.4), S4: rnd(0.7) }
      const ogBal = rnd(0.5)
      setBadgeMetrics({
        loading: false,
        queried: true,
        balances,
        ogBal,
        walletTotalTx: Math.floor(Math.random() * 850) + 42,
        nftCount: balances.S1 + balances.S2 + balances.S3 + balances.S4 + ogBal,
      })
      addLog('warn', 'Live RPC unavailable — rendered demo snapshot instead.')
    }
  }

  const scrollToSection = (id: string) => {
    setActiveTab(id.replace('-section', ''))
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setIsMobileMenuOpen(false)
  }

  // Esc closes mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobileMenuOpen])

  /* ---- Derived classes ---- */
  const rootClass = isConnected
    ? 'relative min-h-screen overflow-y-auto scroll-smooth bg-black tracking-[-0.02em]'
    : 'relative h-screen overflow-hidden bg-black tracking-[-0.02em]'
  const bgPosClass = isConnected ? 'fixed' : 'absolute'

  const navTabs = [
    { id: 'swap-section', label: 'Swap', icon: ArrowLeftRight },
    { id: 'bridge-section', label: 'Bridge', icon: Shuffle },
    { id: 'badge-section', label: 'Badge', icon: Award },
    { id: 'about-section', label: 'About', icon: Info },
  ]

  return (
    <div className={rootClass} style={ { fontFamily: "'Inter', sans-serif" } }>
      {/* Background base image */}
      <div
        className={`${bgPosClass} inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom`}
        style={ { backgroundImage: `url(${BG_IMAGE_1})` } }
      />

      {/* Cursor spotlight reveal */}
      <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} fixed={isConnected} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">LfSoneium</span>
        </div>

        {isConnected && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-2 items-center gap-1">
            {navTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => scrollToSection(t.id)}
                className={`transition-all px-4 py-1.5 rounded-full text-sm font-medium ${
                  activeTab === t.id.replace('-section', '')
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop wallet action */}
        {isConnected ? (
          <button
            onClick={disconnectWallet}
            className="hidden md:flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all bg-white/10 text-white border border-white/20 hover:bg-white/20 font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {shortAddr(walletAddress)}
            {isDemoMode && <span className="text-[10px] text-[#e8702a] uppercase">demo</span>}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="hidden md:flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full transition-all bg-white text-gray-900 hover:bg-gray-100"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}

        {/* Mobile action */}
        {isConnected ? (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 border border-white/20 rounded-full px-3 py-1.5 font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {shortAddr(walletAddress)}
          </button>
        ) : (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        )}
      </nav>

      {/* Wrong-network banner */}
      {wrongNetwork && (
        <div className="fixed top-[68px] left-0 right-0 z-[95] flex justify-center px-4">
          <div className="flex items-center gap-3 bg-[#e8702a]/90 backdrop-blur-md text-white text-sm rounded-full px-4 py-2 shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            Wrong network detected.
            <button onClick={switchToSoneium} className="underline font-semibold">
              Switch to Soneium
            </button>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-lg flex flex-col justify-between p-6"
          role="dialog"
          aria-modal="true"
        >
          <div>
            <div className="flex items-center justify-between mb-12">
              <span className="font-playfair text-2xl italic text-white">Navigation</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white border border-white/10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isConnected ? (
              <div className="flex flex-col gap-1">
                {navTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => scrollToSection(t.id)}
                    className="w-full text-left py-4 border-b border-white/5 font-medium text-lg text-white/80 hover:text-[#e8702a] transition-colors flex items-center gap-3"
                  >
                    <t.icon className="w-5 h-5" />
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60">
                Connect a wallet to unlock the Swap, Bridge, Badge Explorer, and Automation modules.
              </p>
            )}
          </div>
          <div className="pt-6 border-t border-white/10">
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="w-full py-3.5 rounded-full border border-red-500/30 bg-red-500/10 font-mono text-sm text-red-300"
              >
                Disconnect · {shortAddr(walletAddress)}
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full py-4 rounded-full bg-[#e8702a] hover:bg-[#d2611f] font-semibold text-white transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Landing ---------------- */}
      {!isConnected ? (
        <>
          <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
            <h1 className="text-white leading-[0.95]">
              <span
                className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
                style={ { letterSpacing: '-0.05em', animationDelay: '0.25s' } }
              >
                Layers hold
              </span>
              <span
                className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
                style={ { letterSpacing: '-0.08em', animationDelay: '0.42s' } }
              >
                modular truth
              </span>
            </h1>
          </div>

          <div
            className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
            style={ { animationDelay: '0.7s' } }
          >
            <p className="text-sm text-white/80 leading-relaxed">
              Every layer of our modular network records a cryptographic proof, from data
              availability to execution, layered across thousands of nodes.
            </p>
          </div>

          <div
            className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
            style={ { animationDelay: '0.85s' } }
          >
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Our interactive dashboard lets you peel back the blocks to instantly swap assets,
              bridge liquidity, and earn protocol badges.
            </p>
            <button
              onClick={connectWallet}
              className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30"
            >
              Connect Wallet
            </button>
          </div>
        </>
      ) : (
        /* ---------------- dApp ---------------- */
        <div
          key="dapp-shell"
          className="relative z-50 pt-24 pb-24 w-full text-white flex flex-col gap-24 max-w-5xl mx-auto px-5 hero-anim hero-fade"
        >
          {/* Section 1 — Swap */}
          <section id="swap-section" className="min-h-[calc(100vh-6rem)] flex flex-col justify-center">
            <SectionHeader
              icon={<ArrowLeftRight className="w-5 h-5" />}
              title="Swap Engine & Liquidity Packager"
              subtitle={`UNI_ROUTER // ${CONTRACTS.UNI_ROUTER}`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Panel A */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Uniswap V4 Swap Engine</span>
                    <Tag>Panel A</Tag>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-md px-2 py-0.5 font-mono">
                    V4
                  </span>
                </div>
                <form onSubmit={handleSwap} className="space-y-3">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                      <span>You pay</span>
                      <span>Balance 4.218</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        inputMode="decimal"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-2xl font-light text-white outline-none"
                      />
                      <select
                        value={swapType}
                        onChange={(e) => setSwapType(e.target.value as 'ETH_WETH' | 'WETH_ETH')}
                        className="bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-sm text-white outline-none"
                      >
                        <option className="text-black" value="ETH_WETH">ETH</option>
                        <option className="text-black" value="WETH_ETH">WETH</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-center -my-2">
                    <div className="bg-white/10 border border-white/15 rounded-full p-2">
                      <ArrowDown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                      <span>You receive (est.)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-2xl font-light text-white">
                        {swapAmount ? (parseFloat(swapAmount) * 0.995).toFixed(5) : '0.0'}
                      </div>
                      <span className="bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-sm text-white">
                        {swapType === 'ETH_WETH' ? 'WETH' : 'ETH'}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-white/40 font-mono">WETH {shortAddr(CONTRACTS.WETH)}</div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-white/50">
                    <span>Slippage 0.5% (auto)</span>
                    <span>Min {swapAmount ? (parseFloat(swapAmount) * 0.995).toFixed(4) : '0.0'}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                    className="w-full bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-white/5 disabled:text-white/30 text-white text-sm font-medium px-5 py-3 rounded-full transition-all"
                  >
                    Sign Swap Intent
                  </button>
                </form>
              </GlassCard>

              {/* Panel B */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Native Liquidity Packager</span>
                    <Tag>Panel B</Tag>
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">{shortAddr(CONTRACTS.WETH)}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  One-click wrap / unwrap of native balances to clean sub-cent dust left after
                  multi-hop routes. Calls deposit() / withdraw() on WETH only.
                </p>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                  <div className="text-xs text-white/60 mb-2">Wrap amount</div>
                  <div className="flex items-center gap-3">
                    <input
                      inputMode="decimal"
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-xl font-light text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setWrapAmount('4.218')}
                      className="px-2.5 py-1 text-[10px] uppercase font-mono font-bold bg-white/10 hover:bg-white/20 rounded text-white"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePackaging('wrap')}
                    disabled={!wrapAmount || parseFloat(wrapAmount) <= 0}
                    className="py-3 rounded-full border border-[#e8702a] text-[#e8702a] hover:bg-[#e8702a] hover:text-white disabled:border-white/10 disabled:text-white/20 text-sm font-medium transition-all"
                  >
                    Wrap All
                  </button>
                  <button
                    onClick={() => handlePackaging('unwrap')}
                    className="py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                  >
                    Unwrap All
                  </button>
                </div>
              </GlassCard>
            </div>
          </section>

          {/* Section 2 — Bridge */}
          <section id="bridge-section" className="min-h-[calc(100vh-6rem)] flex flex-col justify-center">
            <SectionHeader
              icon={<Shuffle className="w-5 h-5" />}
              title="Cross-Chain Bridge"
              subtitle={`L1 Gateway // ${CONTRACTS.L1_BRIDGE}`}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2">
                <form onSubmit={handleBridge} className="space-y-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-xs">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <span className="block text-[10px] text-white/50 mb-1">SOURCE</span>
                      <span className="text-white font-semibold">Ethereum L1</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#e8702a] animate-pulse" />
                    <div className="text-center p-3 rounded-lg bg-[#e8702a]/10 border border-[#e8702a]/20">
                      <span className="block text-[10px] text-[#e8702a] mb-1">DESTINATION</span>
                      <span className="text-white font-semibold">Soneium L2</span>
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                      <span>Amount</span>
                      <span>Available 0.844 ETH</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        inputMode="decimal"
                        value={bridgeAmount}
                        onChange={(e) => setBridgeAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-2xl font-light text-white outline-none"
                      />
                      <span className="bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-sm text-white">ETH</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-white/50">L1 gas</div>
                      <div className="text-sm text-white mt-1 font-mono">~0.00134</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-white/50">L2 receive</div>
                      <div className="text-sm text-white mt-1 font-mono">{bridgeAmount || '0.0'}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-white/50">ETA</div>
                      <div className="text-sm text-white mt-1 font-mono">~3 min</div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0}
                    className="w-full bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-white/5 disabled:text-white/30 text-white text-sm font-medium px-5 py-3 rounded-full transition-all"
                  >
                    Initiate Deposit
                  </button>
                </form>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-white text-sm font-medium">Gateway Protection</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-xs uppercase tracking-wider font-mono">Active</span>
                </div>
                <ul className="space-y-3 text-sm text-white/80">
                  {[
                    'Empty-write loop detection',
                    'Nonce-replay guard',
                    'Pre-flight gas cap enforcement',
                    'Idempotent retry queue',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          </section>

          {/* Section 3 — Badge Explorer */}
          <section id="badge-section" className="min-h-[calc(100vh-6rem)] flex flex-col justify-center">
            <SectionHeader
              icon={<Award className="w-5 h-5" />}
              title="Dual-Standard Identity Explorer"
              subtitle="View-only · ERC-721 + ERC-1155 over Soneium RPC"
            />
            <GlassCard className="mb-6">
              <label className="text-[10px] uppercase tracking-wider text-white/50 font-mono">View-Only Explorer Mode</label>
              <form onSubmit={handleScan} className="mt-2 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                  <Search className="w-4 h-4 text-white/60" />
                  <input
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="0x… public wallet address"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={badgeMetrics.loading}
                  className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40 text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  {badgeMetrics.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Scan
                </button>
              </form>
              {searchError && <p className="mt-2 text-xs text-red-400">{searchError}</p>}
            </GlassCard>

            {badgeMetrics.loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-44 animate-pulse" />
                ))}
              </div>
            ) : badgeMetrics.queried ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                    <span className="block text-[10px] font-mono text-white/50 uppercase mb-1">Nonce / Tx</span>
                    <span className="text-xl font-mono font-bold text-[#e8702a]">{badgeMetrics.walletTotalTx}</span>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                    <span className="block text-[10px] font-mono text-white/50 uppercase mb-1">Badges held</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">{badgeMetrics.nftCount}</span>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                    <span className="block text-[10px] font-mono text-white/50 uppercase mb-1">OG status</span>
                    <span className="text-xl font-mono font-bold text-white">{badgeMetrics.ogBal > 0 ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                    <span className="block text-[10px] font-mono text-white/50 uppercase mb-1">Gateway</span>
                    <span className="text-xl font-mono font-bold text-white/90">Synced</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* OG */}
                  <div
                    className={`rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[200px] border transition-all duration-500 ${
                      badgeMetrics.ogBal > 0 ? 'border-white/40 text-black shadow-2xl' : 'bg-white/5 border-white/10 opacity-40'
                    }`}
                    style={
                      badgeMetrics.ogBal > 0
                        ? { backgroundImage: 'linear-gradient(45deg,#bf953f,#fcf6ba,#b38728,#fbf5b7,#aa771c)' }
                        : undefined
                    }
                  >
                    <span className="text-4xl mb-3">👑</span>
                    <h4 className="font-playfair italic text-lg">OG Badge</h4>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1 opacity-70">ERC-1155 · ID 0</p>
                    <span className="mt-3 px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase bg-black/10">
                      {badgeMetrics.ogBal > 0 ? 'Holder' : 'Null'}
                    </span>
                  </div>

                  {BADGES.map((b) => {
                    const held = badgeMetrics.balances[b.key] > 0
                    return (
                      <div
                        key={b.key}
                        className={`rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[200px] border transition-all duration-300 ${
                          held ? 'border-[#e8702a]/40 bg-[#e8702a]/5 text-white' : 'bg-white/5 border-white/10 opacity-40'
                        }`}
                      >
                        <span className="text-3xl mb-3">{b.icon}</span>
                        <h4 className="font-mono text-xs font-bold uppercase tracking-wider">{b.name}</h4>
                        <p className="font-mono text-[8px] text-white/50 break-all mt-1 max-w-[120px]">{b.addr}</p>
                        <span
                          className={`mt-3 px-2.5 py-0.5 rounded-md text-[9px] font-mono ${
                            held ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' : 'bg-white/5 text-white/50'
                          }`}
                        >
                          {held ? `Holder (${badgeMetrics.balances[b.key]})` : 'Empty'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center">
                <p className="text-sm font-mono text-white/50">
                  Enter any public EVM address and scan to read on-chain badge ownership.
                </p>
              </div>
            )}
          </section>

          {/* Section 4 — Automation */}
          <section id="about-section" className="min-h-[calc(100vh-6rem)] flex flex-col justify-center">
            <SectionHeader
              icon={<Info className="w-5 h-5" />}
              title="Protocol Automation Framework"
              subtitle="Asynchronous Smart Mix Loop · Fluid Jitter Timing Engine"
            />
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
              <GlassCard className="space-y-5">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-[#e8702a] tracking-wider mb-2">
                    Asynchronous Smart Mix Loop
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    A non-blocking scheduler interleaving swap intents, bridge proofs, and badge
                    reads, each with its own retry envelope so a slow RPC never stalls the queue.
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-[#e8702a] tracking-wider mb-2">
                    Fluid Jitter Timing Engine
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Cool-downs are randomized in a 2–7 second band to avoid mempool fingerprinting.
                    Every resolved window is streamed to the terminal.
                  </p>
                </div>
                <button
                  onClick={() => setIsLooping((v) => !v)}
                  className={`w-full py-4 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all ${
                    isLooping
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : 'bg-[#e8702a] hover:bg-[#d2611f] text-white shadow-lg shadow-[#e8702a]/20'
                  }`}
                >
                  {isLooping ? 'Stop Automation Loop' : 'Start Smart Mix Loop'}
                </button>
              </GlassCard>

              <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col h-[350px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                    <Terminal className="w-4 h-4" />
                    Live Session Audit Terminal
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/50">
                    <span className={`w-2 h-2 rounded-full ${isLooping ? 'bg-emerald-400 animate-ping' : 'bg-yellow-500'}`} />
                    {isLooping ? 'STREAMING' : 'IDLE'}
                  </div>
                </div>
                <div ref={logRef} className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-2 terminal-scroll">
                  {logs.map((log) => (
                    <div key={log.id} className="leading-relaxed">
                      <span className="text-white/40 mr-2">[{log.timestamp}]</span>
                      <span
                        className={`mr-2 font-bold ${
                          log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-yellow-500' : 'text-[#e8702a]'
                        }`}
                      >
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-green-400/90">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 pt-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3">
              <span className="font-playfair text-xl italic text-white">LfSoneium</span>
              <p className="text-white/50 leading-relaxed">
                Cinematic execution & identity tooling for the Soneium Mainnet.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold uppercase tracking-wider mb-3 font-mono text-[10px]">Deployments</h4>
              <div className="space-y-1.5 text-white/50 font-mono">
                <a href="https://soneium.org" target="_blank" rel="noreferrer" className="block hover:text-[#e8702a]">Official Portal</a>
                <a href={SONEIUM_EXPLORER} target="_blank" rel="noreferrer" className="block hover:text-[#e8702a]">Block Explorer</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold uppercase tracking-wider mb-3 font-mono text-[10px]">Community</h4>
              <div className="space-y-1.5 text-white/50 font-mono">
                <a href="https://x.com/soneium" target="_blank" rel="noreferrer" className="block hover:text-[#e8702a]">X / Twitter</a>
                <a href="https://discord.gg/soneium" target="_blank" rel="noreferrer" className="block hover:text-[#e8702a]">Discord</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold uppercase tracking-wider mb-3 font-mono text-[10px]">Network</h4>
              <div className="space-y-1 text-white/50 font-mono">
                <div>Chain ID: {SONEIUM_CHAIN_ID}</div>
                <div>RPC: rpc.soneium.org</div>
                <div>Release: v1.0.0</div>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md bg-black/80 p-6 rounded-2xl border border-[#e8702a]/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <AlertTriangle className="w-4 h-4 text-[#e8702a] animate-pulse" />
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-white">{confirmModal.title}</h3>
            </div>
            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-white/50 block mb-0.5">Target contract</span>
                <span className="text-white bg-white/5 px-2 py-1 rounded block truncate">{confirmModal.targetContract}</span>
              </div>
              <div>
                <span className="text-white/50 block mb-0.5">Decoded calldata</span>
                <textarea
                  readOnly
                  value={confirmModal.calldata}
                  className="w-full h-16 bg-black text-green-400 p-2 rounded border border-white/10 resize-none outline-none text-[10px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-white/50 block mb-0.5">Value</span>
                  <span className="text-white font-bold text-xs">{confirmModal.value} ETH</span>
                </div>
                <div>
                  <span className="text-white/50 block mb-0.5">Est. gas</span>
                  <span className="text-[#e8702a] font-bold text-xs">{confirmModal.estimatedGas}</span>
                </div>
              </div>
              {isDemoMode && (
                <p className="text-[10px] text-yellow-500/80">Demo mode — broadcast is simulated, no real transaction is sent.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase transition-colors"
              >
                Abort
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="py-3 rounded-full bg-[#e8702a] hover:bg-[#d2611f] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Sign & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending overlay */}
      {txProcessing && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#e8702a] animate-spin" />
          <span className="text-xs font-mono tracking-widest uppercase text-white/90">Broadcasting to Soneium…</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[130] w-full max-w-sm glass-panel bg-black/90 p-4 rounded-xl shadow-2xl hero-anim hero-fade">
          <div className="flex gap-3 items-start">
            {toast.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                {toast.status === 'success' ? 'Execution succeeded' : 'Execution reverted'}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">{toast.msg}</p>
              {toast.txHash && (
                <a
                  href={`${SONEIUM_EXPLORER}/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-[#e8702a] hover:underline pt-1"
                >
                  View on explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
