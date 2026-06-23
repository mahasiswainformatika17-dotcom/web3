// RAFF Wallet - Main Application Controller
// Manages UI state, event listeners, and all user interactions

class App {
  constructor() {
    this.isConnected = false;
    this.walletData = null;
    this.tokenInfo = null;
    this.txCount = 0;
    this.activeSection = 'dashboard';
    this.toastQueue = [];
    this.isShowingToast = false;

    this._init();
  }

  // ─── Initialization ──────────────────────────────────────────────────
  _init() {
    document.addEventListener('DOMContentLoaded', () => {
      this._bindEvents();
      this._initParticles();
      this._checkMetaMask();
      this._listenMetaMaskEvents();
    });
  }

  _bindEvents() {
    // Wallet connect / disconnect
    document.getElementById('connectBtn').addEventListener('click', () => this.connectWallet());
    document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectWallet());
    document.getElementById('heroConnectBtn').addEventListener('click', () => this.connectWallet());

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        if (section) this._navigateTo(section);
      });
    });

    // Transfer form
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
      transferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTransfer();
      });
    }

    // Mint form
    const mintForm = document.getElementById('mintForm');
    if (mintForm) {
      mintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMint();
      });
    }

    // Burn form
    const burnForm = document.getElementById('burnForm');
    if (burnForm) {
      burnForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBurn();
      });
    }

    // Refresh buttons
    const refreshHistory = document.getElementById('refreshHistory');
    if (refreshHistory) {
      refreshHistory.addEventListener('click', () => this.loadTransactionHistory());
    }

    const refreshDashboard = document.getElementById('refreshDashboard');
    if (refreshDashboard) {
      refreshDashboard.addEventListener('click', () => this.loadDashboardData());
    }

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => this._toggleMobileSidebar(true));
    if (sidebarClose) sidebarClose.addEventListener('click', () => this._toggleMobileSidebar(false));
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => this._toggleMobileSidebar(false));

    // Copy address
    const copyAddrBtn = document.getElementById('copyAddress');
    if (copyAddrBtn) {
      copyAddrBtn.addEventListener('click', () => {
        const addr = document.getElementById('walletAddressFull').textContent;
        if (addr) {
          navigator.clipboard.writeText(addr).then(() => this.showToast('Alamat disalin!', 'success'));
        }
      });
    }
  }

  _listenMetaMaskEvents() {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.showToast('Akun berubah, menyambungkan ulang...', 'info');
        this.connectWallet();
      }
    });

    window.ethereum.on('chainChanged', () => {
      this.showToast('Jaringan berubah, memuat ulang...', 'info');
      setTimeout(() => window.location.reload(), 1200);
    });
  }

  _checkMetaMask() {
    if (!contractService.isMetaMaskInstalled()) {
      document.getElementById('metamaskWarning').classList.remove('hidden');
    }
  }

  // ─── Wallet Connect / Disconnect ──────────────────────────────────────
  async connectWallet() {
    const btn = document.getElementById('connectBtn');
    this._setButtonLoading(btn, true, 'Menghubungkan...');

    try {
      this.walletData = await contractService.connectWallet();
      this.isConnected = true;
      this._onConnected();
      this.showToast(`Wallet terhubung: ${contractService.formatAddress(this.walletData.address)}`, 'success');
    } catch (err) {
      this.showToast(err.message || 'Gagal menghubungkan wallet.', 'error');
    } finally {
      this._setButtonLoading(btn, false, '<span class="btn-icon">⟐</span> Connect Wallet');
    }
  }

  disconnectWallet() {
    contractService.disconnect();
    this.isConnected = false;
    this.walletData = null;
    this.tokenInfo = null;
    this.txCount = 0;
    this._onDisconnected();
    this.showToast('Wallet terputus.', 'info');
  }

  _onConnected() {
    document.getElementById('connectBtn').classList.add('hidden');
    document.getElementById('disconnectBtn').classList.remove('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('walletStatus').classList.remove('hidden');
    document.getElementById('walletStatusDot').classList.add('active');

    // Show/hide admin nav
    if (this.walletData.isOwner) {
      document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
      document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }

    this._navigateTo('dashboard');
    this.loadDashboardData();
  }

  _onDisconnected() {
    document.getElementById('connectBtn').classList.remove('hidden');
    document.getElementById('disconnectBtn').classList.add('hidden');
    document.getElementById('heroSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('walletStatus').classList.add('hidden');
    document.getElementById('walletStatusDot').classList.remove('active');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
  }

  // ─── Navigation ───────────────────────────────────────────────────────
  _navigateTo(section) {
    this.activeSection = section;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.section-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `section-${section}`);
    });

    // Load section data
    if (section === 'history') this.loadTransactionHistory();
    if (section === 'profile') this.loadTokenProfile();
    if (section === 'stats') this.loadStats();

    // Close mobile sidebar
    this._toggleMobileSidebar(false);
  }

  _toggleMobileSidebar(open) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('mobile-open', open);
    if (overlay) overlay.classList.toggle('visible', open);
  }

  // ─── Load Dashboard Data ──────────────────────────────────────────────
  async loadDashboardData() {
    if (!this.isConnected) return;

    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    try {
      const [ethBalance, rfkBalance, tokenInfo, networkInfo] = await Promise.all([
        contractService.getEthBalance(contractService.connectedAddress),
        contractService.getRfkBalance(contractService.connectedAddress),
        contractService.getTokenInfo(),
        contractService.getNetworkInfo()
      ]);

      this.tokenInfo = tokenInfo;

      // Wallet card
      this._setText('walletAddressFull', contractService.connectedAddress);
      this._setText('walletAddressShort', contractService.formatAddress(contractService.connectedAddress));
      this._setText('ethBalance', parseFloat(ethBalance).toFixed(6) + ' ETH');
      this._setText('rfkBalance', contractService.formatNumber(rfkBalance) + ' RFK');
      this._setText('networkBadge', networkInfo.name);

      // Stats cards
      this._setText('dashRfkBalance', contractService.formatNumber(rfkBalance));
      this._setText('dashTotalSupply', contractService.formatNumber(tokenInfo.totalSupply));
      this._setText('dashNetwork', networkInfo.name);
      this._setText('dashOwner', contractService.formatAddress(tokenInfo.owner));
      this._setText('dashOwnerFull', tokenInfo.owner);

      // Owner badge
      const ownerBadge = document.getElementById('ownerBadge');
      if (ownerBadge) {
        ownerBadge.classList.toggle('hidden', !contractService.isOwner);
      }

      // Pre-fill burn form address
      const burnToField = document.getElementById('burnOwnerAddr');
      if (burnToField) burnToField.value = contractService.connectedAddress;

    } catch (err) {
      this.showToast('Gagal memuat data dashboard: ' + err.message, 'error');
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('spinning');
    }
  }

  // ─── Transfer Token ───────────────────────────────────────────────────
  async handleTransfer() {
    const toAddress = document.getElementById('transferTo').value.trim();
    const amount = document.getElementById('transferAmount').value.trim();
    const btn = document.getElementById('transferBtn');

    if (!toAddress || !amount) {
      this.showToast('Isi semua field transfer.', 'warning');
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      this.showToast('Alamat tujuan tidak valid.', 'error');
      return;
    }

    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      this.showToast('Jumlah token tidak valid.', 'error');
      return;
    }

    this._setButtonLoading(btn, true, 'Mengirim...');

    try {
      const tx = await contractService.transferToken(toAddress, amount);
      this.showToast('Transaksi dikirim! Menunggu konfirmasi...', 'info');

      const txLink = document.getElementById('transferTxLink');
      if (txLink) {
        txLink.href = `${CONFIG.BLOCK_EXPLORER}/tx/${tx.hash}`;
        txLink.textContent = contractService.formatAddress(tx.hash);
        document.getElementById('transferTxInfo').classList.remove('hidden');
      }

      await tx.wait();
      this.showToast(`Transfer ${amount} RFK berhasil!`, 'success');
      document.getElementById('transferForm').reset();
      this.loadDashboardData();
    } catch (err) {
      const msg = this._parseError(err);
      this.showToast('Transfer gagal: ' + msg, 'error');
    } finally {
      this._setButtonLoading(btn, false, '<span class="btn-icon">⟶</span> Kirim Token');
    }
  }

  // ─── Mint Token ───────────────────────────────────────────────────────
  async handleMint() {
    const toAddress = document.getElementById('mintTo').value.trim();
    const amount = document.getElementById('mintAmount').value.trim();
    const btn = document.getElementById('mintBtn');

    if (!toAddress || !amount) {
      this.showToast('Isi semua field mint.', 'warning');
      return;
    }

    if (!ethers.isAddress(toAddress)) {
      this.showToast('Alamat tujuan tidak valid.', 'error');
      return;
    }

    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      this.showToast('Jumlah token tidak valid.', 'error');
      return;
    }

    this._setButtonLoading(btn, true, 'Minting...');

    try {
      const tx = await contractService.mintToken(toAddress, amount);
      this.showToast('Transaksi mint dikirim! Menunggu konfirmasi...', 'info');

      const txLink = document.getElementById('mintTxLink');
      if (txLink) {
        txLink.href = `${CONFIG.BLOCK_EXPLORER}/tx/${tx.hash}`;
        txLink.textContent = contractService.formatAddress(tx.hash);
        document.getElementById('mintTxInfo').classList.remove('hidden');
      }

      await tx.wait();
      this.showToast(`Mint ${amount} RFK berhasil!`, 'success');
      document.getElementById('mintForm').reset();
      this.loadDashboardData();
    } catch (err) {
      const msg = this._parseError(err);
      this.showToast('Mint gagal: ' + msg, 'error');
    } finally {
      this._setButtonLoading(btn, false, '<span class="btn-icon">⬡</span> Mint Token');
    }
  }

  // ─── Burn Token ───────────────────────────────────────────────────────
  async handleBurn() {
    const amount = document.getElementById('burnAmount').value.trim();
    const btn = document.getElementById('burnBtn');

    if (!amount) {
      this.showToast('Masukkan jumlah token yang akan dibakar.', 'warning');
      return;
    }

    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      this.showToast('Jumlah token tidak valid.', 'error');
      return;
    }

    this._setButtonLoading(btn, true, 'Membakar...');

    try {
      const tx = await contractService.burnToken(amount);
      this.showToast('Transaksi burn dikirim! Menunggu konfirmasi...', 'info');

      const txLink = document.getElementById('burnTxLink');
      if (txLink) {
        txLink.href = `${CONFIG.BLOCK_EXPLORER}/tx/${tx.hash}`;
        txLink.textContent = contractService.formatAddress(tx.hash);
        document.getElementById('burnTxInfo').classList.remove('hidden');
      }

      await tx.wait();
      this.showToast(`Burn ${amount} RFK berhasil!`, 'success');
      document.getElementById('burnForm').reset();
      this.loadDashboardData();
    } catch (err) {
      const msg = this._parseError(err);
      this.showToast('Burn gagal: ' + msg, 'error');
    } finally {
      this._setButtonLoading(btn, false, '<span class="btn-icon">🔥</span> Burn Token');
    }
  }

  // ─── Load Transaction History ─────────────────────────────────────────
  async loadTransactionHistory() {
    const container = document.getElementById('txHistoryList');
    const refreshBtn = document.getElementById('refreshHistory');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Memuat riwayat...</p></div>';
    if (refreshBtn) refreshBtn.classList.add('spinning');

    try {
      const history = await contractService.getTransferHistory();
      this.txCount = history.length;

      if (history.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi yang ditemukan dalam 10.000 blok terakhir.</p></div>';
        return;
      }

      container.innerHTML = history.map(tx => `
        <div class="tx-row ${tx.from.toLowerCase() === contractService.connectedAddress.toLowerCase() ? 'tx-out' : 'tx-in'}">
          <div class="tx-badge ${tx.from.toLowerCase() === contractService.connectedAddress.toLowerCase() ? 'out' : 'in'}">
            ${tx.from.toLowerCase() === contractService.connectedAddress.toLowerCase() ? '↑ OUT' : '↓ IN'}
          </div>
          <div class="tx-info">
            <div class="tx-addresses">
              <span class="tx-label">From:</span>
              <a href="${CONFIG.BLOCK_EXPLORER}/address/${tx.from}" target="_blank" class="tx-addr">${contractService.formatAddress(tx.from)}</a>
              <span class="tx-arrow">→</span>
              <span class="tx-label">To:</span>
              <a href="${CONFIG.BLOCK_EXPLORER}/address/${tx.to}" target="_blank" class="tx-addr">${contractService.formatAddress(tx.to)}</a>
            </div>
            <div class="tx-meta">
              <span class="tx-time">${tx.timestamp}</span>
              <a href="${CONFIG.BLOCK_EXPLORER}/tx/${tx.txHash}" target="_blank" class="tx-hash-link">${contractService.formatAddress(tx.txHash)}</a>
            </div>
          </div>
          <div class="tx-amount">
            <span class="amount-value">${contractService.formatNumber(tx.amount)}</span>
            <span class="amount-symbol">RFK</span>
          </div>
        </div>
      `).join('');

      this._setText('txCount', history.length);
    } catch (err) {
      container.innerHTML = `<div class="empty-state error-state"><div class="empty-icon">⚠</div><p>Gagal memuat riwayat: ${err.message}</p></div>`;
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('spinning');
    }
  }

  // ─── Load Token Profile ───────────────────────────────────────────────
  async loadTokenProfile() {
    try {
      const info = this.tokenInfo || await contractService.getTokenInfo();

      this._setText('profileName', info.name);
      this._setText('profileSymbol', info.symbol);
      this._setText('profileDecimals', info.decimals);
      this._setText('profileContract', info.contractAddress);
      this._setText('profileOwner', info.owner);
      this._setText('profileSupply', contractService.formatNumber(info.totalSupply) + ' RFK');
      this._setText('profileNetwork', CONFIG.NETWORK_NAME);
      this._setText('profileExplorer', `${CONFIG.BLOCK_EXPLORER}/address/${info.contractAddress}`);

      const explorerLink = document.getElementById('profileExplorerLink');
      if (explorerLink) {
        explorerLink.href = `${CONFIG.BLOCK_EXPLORER}/address/${info.contractAddress}`;
      }
    } catch (err) {
      this.showToast('Gagal memuat profil token: ' + err.message, 'error');
    }
  }

  // ─── Load Stats ───────────────────────────────────────────────────────
  async loadStats() {
    try {
      const [totalSupply, rfkBalance] = await Promise.all([
        contractService.getTotalSupply(),
        contractService.getRfkBalance(contractService.connectedAddress)
      ]);

      this._setText('statsTotalSupply', contractService.formatNumber(totalSupply) + ' RFK');
      this._setText('statsUserBalance', contractService.formatNumber(rfkBalance) + ' RFK');
      this._setText('statsTxCount', this.txCount || '—');
      this._setText('statsContract', CONFIG.CONTRACT_ADDRESS);
      this._setText('statsOwner', CONFIG.OWNER_WALLET);

      // Supply chart bar
      const userPercent = totalSupply > 0 ? (parseFloat(rfkBalance) / parseFloat(totalSupply)) * 100 : 0;
      const bar = document.getElementById('supplyBar');
      if (bar) bar.style.width = Math.min(userPercent, 100) + '%';

      this._setText('supplyPercent', userPercent.toFixed(4) + '%');
    } catch (err) {
      this.showToast('Gagal memuat statistik: ' + err.message, 'error');
    }
  }

  // ─── Toast Notification ───────────────────────────────────────────────
  showToast(message, type = 'info') {
    this.toastQueue.push({ message, type });
    if (!this.isShowingToast) this._processToastQueue();
  }

  _processToastQueue() {
    if (this.toastQueue.length === 0) {
      this.isShowingToast = false;
      return;
    }

    this.isShowingToast = true;
    const { message, type } = this.toastQueue.shift();

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.remove();
        this._processToastQueue();
      }, 350);
    }, 4000);
  }

  // ─── Particles Animation ──────────────────────────────────────────────
  _initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '59, 130, 246' : '96, 165, 250'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  _setButtonLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="spinner-sm"></span> ${label}` : label;
  }

  _parseError(err) {
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') return 'Ditolak pengguna.';
    if (err.code === -32603) return 'Error internal jaringan.';
    if (err.reason) return err.reason;
    if (err.message) {
      const match = err.message.match(/reason="([^"]+)"/);
      if (match) return match[1];
      if (err.message.length < 120) return err.message;
      return 'Error tidak dikenal.';
    }
    return 'Error tidak dikenal.';
  }
}

const app = new App();
