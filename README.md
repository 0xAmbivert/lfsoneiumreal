# LfSoneium — Layers hold modular truth

A dark, cinematic, glassmorphism dApp for the **Soneium Mainnet**. It keeps the original
Lithos cinematic theme — Playfair Display heading, real artwork backgrounds, and a
cursor-following **canvas spotlight reveal** — and layers on a full production dApp:
a Features tour, Swap, Bridge, an **Airdrop Farming quest board**, a **Soneium Score Season
system + eligibility checker**, a view-only Badge Explorer, and an automation engine with a
live audit terminal.

Built with React 18 + TypeScript + Vite + Tailwind CSS + lucide-react + ethers v5.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

> Requires Node 18+. Install dependencies before building — `ethers` and `lucide-react`
> are declared in `package.json`.

## Architecture

- **Landing vs dApp** — a single `isConnected` flag swaps between the full-screen cinematic
  landing (`h-screen overflow-hidden`) and the scrollable dApp (`min-h-screen overflow-y-auto
  scroll-smooth`). The background image layers switch from `absolute` to `fixed` once connected.
- **Spotlight reveal** — a canvas renders a radial gradient mask that is converted to a data URL
  and applied as a CSS mask over `BG_IMAGE_2`, revealing it over `BG_IMAGE_1` under the cursor
  (radius 260px, 0.1 lerp smoothing).
- **Center pill nav** appears only when connected (Features / Swap / Bridge / Farm / Season /
  Badge / Engine), with a mobile drawer (Esc / backdrop / X to close) for parity on small screens.

## Airdrop Farming & Season System

- **Features tour** (`features-section`) — a grid that depicts every module in the dApp with a
  Live / Sim tag, so reviewers can see the full surface at a glance.
- **Airdrop Farming** (`farm-section`) — 17 on-chain & social quests grouped into Swap, Liquidity,
  Bridge, NFT, Daily and Ecosystem. On-chain quests route through the confirm-modal + audit
  terminal; each completion adds to your Soneium Score. Progress is persisted in `localStorage`
  (`_lfsoneium_quests`). Includes an ecosystem strip (Sake, Kyo, WaveX, Uniswap, Superboard,
  Emerald, Nomis, Astar).
- **Season System** (`season-section`) — Season 11 "Game On" banner with a live countdown, an SVG
  score gauge, the 80 / 100 qualification threshold, and a soulbound (SBT) badge claim that
  unlocks at the threshold.
- **Eligibility checker** — enter any wallet to estimate its season score from **live Soneium RPC**
  reads (transaction count + ERC-721/1155 badge holdings), broken down into Tx activity, Active
  days, NFT score and Quests, with a graceful demo-data fallback.

### Soneium Score facts used

Soneium is the Sony Block Solutions Labs + Startale L2 on the OP Stack / Superchain. **Soneium
Score** runs in **28-day seasons**; a wallet scoring **≥ 80 / 100** in a season earns one
**soulbound badge**. Season 11 "Game On" began **3 Jun 2026**. Quests are surfaced through the
Soneium portal, Startale and Galxe campaigns (Conquest weekly themes, Spotlight projects).

## Network configuration

| Item | Value |
| --- | --- |
| Target L2 | Soneium Mainnet |
| Chain ID | `1868` (`0x74c`) |
| RPC | `https://rpc.soneium.org/` |
| Explorer | `https://soneium.blockscout.com` |
| Source L1 | Ethereum Mainnet (`chainId: 1`) |
| Canonical L1 bridge | `0x5933e323bE8896DfaCd1cD671442F27dAA10a053` |

Optional partner RPC keys can be wired through a root `.env` file:

```
VITE_SONEIUM_MAINNET_RPC=https://rpc.soneium.org/
VITE_ETHEREUM_MAINNET_RPC=https://eth.llamarpc.com
VITE_PARTNER_INFURA_KEY=
VITE_PARTNER_ALCHEMY_KEY=
```

## Live vs simulated — feature matrix

This build favors **real reads** and a **real wallet connection** where the browser allows it,
with a graceful demo fallback so the UI is always demoable. **Writes are intentionally
simulated** so the app never moves real funds.

### ✅ Live (real on-chain / real browser APIs)

- **Wallet connection** — uses the injected provider (`window.ethereum`) via ethers v5:
  `eth_requestAccounts`, `eth_chainId`, and `accountsChanged` / `chainChanged` listeners.
  Includes a **wrong-network banner** and one-click `wallet_switchEthereumChain` /
  `wallet_addEthereumChain` to Soneium (`0x74c`). Session persists via `localStorage`.
- **Badge Explorer (view-only)** — reads ownership directly from Soneium RPC:
  `balanceOf(address)` on the S1–S4 ERC-721 badges, `balanceOf(address, 0)` on the OG
  ERC-1155 badge, and `getTransactionCount` for the nonce. If the RPC is unreachable
  (e.g. CORS in a static preview), it falls back to a demo snapshot.
- **Spotlight / cursor reveal, form validation, address checksum validation** — all real,
  client-side.

### 🟡 Demo fallback

- **Wallet** — when no injected provider is present, the app boots **Demo Mode** with the
  mock address `0xE134662e9CDf904Ea3D90dB3F527054ED3687d83`, persisted across reloads.
  A `demo` tag is shown next to the address.

### 🟠 Simulated (gated, never broadcasts real transactions)

Every state-changing action (Swap, Wrap/Unwrap, Bridge) is trapped behind the
**Transactional Gateway** confirm modal, which decodes the calldata, shows the target
contract, value, and an estimated gas figure before you sign. After confirmation the
broadcast is **simulated** (a pending overlay, then a success toast with an explorer-style
tx link). No real fund-moving transaction is constructed or sent. To go fully live, replace
the simulated `onConfirm` bodies with real `signer.sendTransaction(...)` calls.

- **Automation engine** — the Smart Mix Loop streams randomized audit-terminal logs on a
  **2–7 second** fluid-jitter cadence. These are illustrative, not real transactions.

## Contract registry

| Key | Address | Standard |
| --- | --- | --- |
| S1 | `0x05AB5e724848cEFeac6D303CDf94032E5Cc3552B` | ERC-721 |
| S2 | `0x6b2f6D8216E075D3a71F4aaf21d7158Af9B8dc82` | ERC-721 |
| S3 | `0x7BF02b42b9d4cCD85b497C9F53e6b7474f9c2546` | ERC-721 |
| S4 | `0x17121f9a7041ffe3ef248f7b84658d9229bad64f` | ERC-721 |
| OG | `0x2A21B17E366836e5FFB19bd47edB03b4b551C89d` | ERC-1155 (id 0) |
| WETH | `0x4200000000000000000000000000000000000006` | — |
| Uniswap Router | `0x0E2850543f69F678257266E0907fF9A58B3F13dE` | — |
| L1 Bridge | `0x5933e323bE8896DfaCd1cD671442F27dAA10a053` | — |

## Safety note

This interface is for demonstration. Do not paste private keys anywhere, and review the
simulated write paths before connecting a wallet with real funds.
