# RAFF Wallet — Web3 Gaming Dashboard

> Dashboard Web3 gaming premium untuk token RaffToken (RFK) di Ethereum Sepolia.
> Dibangun dengan HTML5, CSS3, Vanilla JavaScript ES6, dan Ethers.js v6.

---

## Tampilan & Fitur

- **Futuristic Cyberpunk UI** — Glassmorphism biru gelap, neon glow, particle animation
- **Connect MetaMask** — Auto-detect, switch jaringan otomatis ke Sepolia
- **Dashboard Utama** — Saldo ETH & RFK, info contract, status owner
- **Transfer Token RFK** — Form kirim dengan validasi lengkap + konfirmasi MetaMask
- **Riwayat Transaksi** — Ambil dari event ERC20 Transfer on-chain
- **Profil Token** — Detail lengkap token dan contract
- **Statistik** — Supply, kepemilikan, total transaksi
- **Panel Admin** — Mint & Burn token, hanya muncul jika wallet = owner contract
- **Toast Notification** — Feedback real-time untuk semua aksi
- **Responsive** — Desktop & mobile-ready
- **Keamanan** — Validasi alamat, jumlah, error handling, no console errors

---

## Struktur Project

```
RAFF-Wallet/
├── index.html          # Entri utama aplikasi
├── css/
│   └── style.css       # Seluruh styling (dark mode, glassmorphism, animations)
├── js/
│   ├── config.js       # Konfigurasi network, contract address, ABI
│   ├── contract.js     # Semua interaksi blockchain (ContractService class)
│   └── app.js          # Logika UI & event handling (App class)
├── assets/             # (opsional) Aset gambar/ikon tambahan
└── README.md           # Dokumentasi ini
```

---

## Cara Menjalankan Project

### Persyaratan
- Browser modern (Chrome / Brave / Firefox)
- [MetaMask](https://metamask.io) terinstall dan dikonfigurasi ke **Ethereum Sepolia**
- SepoliaETH untuk gas (dapatkan gratis di [https://sepoliafaucet.com](https://sepoliafaucet.com))

### Langkah Menjalankan

**Opsi 1 — Buka Langsung (Lokal)**
```
Buka file index.html langsung di browser.
(Gunakan Live Server di VS Code untuk hasil terbaik)
```

**Opsi 2 — Live Server (VS Code)**
1. Install ekstensi `Live Server` di VS Code
2. Klik kanan `index.html` → **Open with Live Server**
3. Browser akan terbuka otomatis di `http://127.0.0.1:5500`

**Opsi 3 — Python HTTP Server**
```bash
cd RAFF-Wallet
python3 -m http.server 8080
# Buka browser: http://localhost:8080
```

**Opsi 4 — Node.js HTTP Server**
```bash
npx serve RAFF-Wallet
```

---

## Cara Mengubah Contract Address

Buka file `js/config.js` dan ubah nilai berikut:

```javascript
const CONFIG = {
  CONTRACT_ADDRESS: '0xB0718D8dF9DDd302634D9b0E35F750Fb7Ff7ce59', // ← Ubah ini

  // ... pastikan ABI juga sesuai dengan contract baru
};
```

---

## Cara Mengganti Owner Wallet

Owner wallet diambil secara dinamis dari fungsi `owner()` di smart contract.
Namun jika ingin mengoverride secara manual (untuk display/validasi), ubah di `js/config.js`:

```javascript
const CONFIG = {
  OWNER_WALLET: '0x12ac9a47f88c8f5cf52e0761a9d24cf856557cdd', // ← Ubah ini
};
```

> **Catatan:** Nilai OWNER_WALLET di config hanya digunakan sebagai referensi tampilan.
> Pengecekan owner sesungguhnya dilakukan langsung dari blockchain via `contract.owner()`.

---

## Cara Mengganti Network

Untuk menggunakan jaringan lain (misal Ethereum Mainnet atau Polygon):

```javascript
const CONFIG = {
  CHAIN_ID: 1,              // Mainnet = 1, Sepolia = 11155111, Polygon = 137
  CHAIN_ID_HEX: '0x1',     // Hex dari Chain ID
  NETWORK_NAME: 'Ethereum Mainnet',
  RPC_URL: 'https://mainnet.infura.io/v3/YOUR_KEY',
  BLOCK_EXPLORER: 'https://etherscan.io',
};
```

---

## Cara Deploy ke Hosting

### Deploy ke Vercel (Gratis)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd RAFF-Wallet
vercel

# Ikuti instruksi di terminal
```

### Deploy ke Netlify (Gratis)
1. Buat akun di [netlify.com](https://netlify.com)
2. Drag & drop folder `RAFF-Wallet` ke dashboard Netlify
3. Website langsung live dengan URL random

### Deploy ke GitHub Pages (Gratis)
1. Push project ke GitHub repository
2. Buka **Settings → Pages**
3. Source: pilih branch `main`, folder `/ (root)`
4. Save → website akan live di `https://username.github.io/repo-name`

### Deploy ke VPS / cPanel
Upload seluruh isi folder `RAFF-Wallet/` ke direktori `public_html` atau `www`.

---

## Teknologi yang Digunakan

| Teknologi       | Versi  | Keterangan                              |
|----------------|--------|----------------------------------------|
| HTML5          | —      | Struktur & semantik                     |
| CSS3           | —      | Glassmorphism, animasi, responsive      |
| JavaScript     | ES6+   | Logika aplikasi (class, async/await)    |
| Ethers.js      | v6.7.1 | Interaksi dengan blockchain & MetaMask  |

---

## Smart Contract Info

| Field            | Value                                        |
|-----------------|----------------------------------------------|
| Token Name      | RaffToken                                    |
| Symbol          | RFK                                          |
| Decimals        | 18                                           |
| Network         | Ethereum Sepolia (Chain ID: 11155111)        |
| Contract        | 0xB0718D8dF9DDd302634D9b0E35F750Fb7Ff7ce59  |
| Owner           | 0x12ac9a47f88c8f5cf52e0761a9d24cf856557cdd  |
| Standard        | ERC-20 + Ownable                             |
| Functions       | transfer, mint (owner), burn (owner)        |

---

## Troubleshooting

**MetaMask tidak terdeteksi**
→ Install [MetaMask](https://metamask.io) dan refresh browser.

**Jaringan salah**
→ Klik Connect Wallet, aplikasi akan otomatis meminta switch ke Sepolia.

**Riwayat transaksi kosong**
→ Normal jika belum ada transaksi di 10.000 blok terakhir. Lihat riwayat lengkap di Etherscan.

**Gas tidak cukup**
→ Dapatkan SepoliaETH gratis di [sepoliafaucet.com](https://sepoliafaucet.com).

---

## Lisensi

Project ini dibuat untuk keperluan demonstrasi Web3 dan pendidikan blockchain.

---

*Built with ❤ — RAFF Wallet v1.0 | Powered by Ethers.js v6 & MetaMask*
"# web3" 
