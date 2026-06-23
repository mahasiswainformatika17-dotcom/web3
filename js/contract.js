// RAFF Wallet - Contract Interactions
// Handles all blockchain & smart contract operations via Ethers.js v6

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.readContract = null;
    this.connectedAddress = null;
    this.isOwner = false;
  }

  // ─── MetaMask Detection ──────────────────────────────────────────────
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  }

  // ─── Connect Wallet ──────────────────────────────────────────────────
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask tidak terdeteksi. Silakan install MetaMask terlebih dahulu.');
    }

    try {
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Tidak ada akun yang dipilih.');
      }

      // Setup provider & signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.connectedAddress = await this.signer.getAddress();

      // Check network
      await this.checkAndSwitchNetwork();

      // Init contract
      this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, this.signer);
      this.readContract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, this.provider);

      // Check if owner
      const contractOwner = await this.readContract.owner();
      this.isOwner = contractOwner.toLowerCase() === this.connectedAddress.toLowerCase();

      return {
        address: this.connectedAddress,
        isOwner: this.isOwner
      };
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Koneksi ditolak pengguna.');
      }
      throw err;
    }
  }

  // ─── Network Check & Switch ──────────────────────────────────────────
  async checkAndSwitchNetwork() {
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== CONFIG.CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CONFIG.CHAIN_ID_HEX }]
        });
        // Re-init provider after switch
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CONFIG.CHAIN_ID_HEX,
              chainName: CONFIG.NETWORK_NAME,
              nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [CONFIG.BLOCK_EXPLORER]
            }]
          });
        } else {
          throw switchErr;
        }
      }
    }
  }

  // ─── Disconnect ──────────────────────────────────────────────────────
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.readContract = null;
    this.connectedAddress = null;
    this.isOwner = false;
  }

  // ─── Get ETH Balance ─────────────────────────────────────────────────
  async getEthBalance(address) {
    if (!this.provider) throw new Error('Wallet belum terhubung.');
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // ─── Get RFK Balance ─────────────────────────────────────────────────
  async getRfkBalance(address) {
    if (!this.readContract) throw new Error('Contract belum diinisialisasi.');
    const balance = await this.readContract.balanceOf(address);
    return ethers.formatUnits(balance, CONFIG.TOKEN_DECIMALS);
  }

  // ─── Get Total Supply ────────────────────────────────────────────────
  async getTotalSupply() {
    if (!this.readContract) throw new Error('Contract belum diinisialisasi.');
    const supply = await this.readContract.totalSupply();
    return ethers.formatUnits(supply, CONFIG.TOKEN_DECIMALS);
  }

  // ─── Get Token Info ──────────────────────────────────────────────────
  async getTokenInfo() {
    if (!this.readContract) throw new Error('Contract belum diinisialisasi.');
    const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
      this.readContract.name(),
      this.readContract.symbol(),
      this.readContract.decimals(),
      this.readContract.totalSupply(),
      this.readContract.owner()
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, CONFIG.TOKEN_DECIMALS),
      owner,
      contractAddress: CONFIG.CONTRACT_ADDRESS
    };
  }

  // ─── Get Network Info ────────────────────────────────────────────────
  async getNetworkInfo() {
    if (!this.provider) throw new Error('Wallet belum terhubung.');
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: CONFIG.NETWORK_NAME
    };
  }

  // ─── Transfer RFK ────────────────────────────────────────────────────
  async transferToken(toAddress, amount) {
    if (!this.contract) throw new Error('Contract belum diinisialisasi.');
    if (!ethers.isAddress(toAddress)) throw new Error('Alamat tujuan tidak valid.');

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) throw new Error('Jumlah token tidak valid.');

    const amountWei = ethers.parseUnits(amount.toString(), CONFIG.TOKEN_DECIMALS);
    const userBalance = await this.readContract.balanceOf(this.connectedAddress);

    if (amountWei > userBalance) throw new Error('Saldo RFK tidak mencukupi.');

    const tx = await this.contract.transfer(toAddress, amountWei);
    return tx;
  }

  // ─── Mint Token (Owner only) ──────────────────────────────────────────
  async mintToken(toAddress, amount) {
    if (!this.contract) throw new Error('Contract belum diinisialisasi.');
    if (!this.isOwner) throw new Error('Hanya owner yang dapat mint token.');
    if (!ethers.isAddress(toAddress)) throw new Error('Alamat tujuan tidak valid.');

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) throw new Error('Jumlah token tidak valid.');

    const amountWei = ethers.parseUnits(amount.toString(), CONFIG.TOKEN_DECIMALS);
    const tx = await this.contract.mint(toAddress, amountWei);
    return tx;
  }

  // ─── Burn Token ──────────────────────────────────────────────────────
  async burnToken(amount) {
    if (!this.contract) throw new Error('Contract belum diinisialisasi.');
    if (!this.isOwner) throw new Error('Hanya owner yang dapat burn token.');

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) throw new Error('Jumlah token tidak valid.');

    const amountWei = ethers.parseUnits(amount.toString(), CONFIG.TOKEN_DECIMALS);
    const ownerBalance = await this.readContract.balanceOf(this.connectedAddress);

    if (amountWei > ownerBalance) throw new Error('Saldo RFK tidak mencukupi untuk dibakar.');

    const tx = await this.contract.burn(amountWei);
    return tx;
  }

  // ─── Get Transfer History ─────────────────────────────────────────────
  async getTransferHistory() {
    if (!this.readContract || !this.provider) throw new Error('Contract belum diinisialisasi.');

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      const transferEvent = this.readContract.filters.Transfer();
      const events = await this.readContract.queryFilter(transferEvent, fromBlock, currentBlock);

      const history = await Promise.all(
        events.slice(-50).reverse().map(async (event) => {
          let timestamp = '';
          let blockNumber = event.blockNumber;
          try {
            const block = await this.provider.getBlock(blockNumber);
            if (block && block.timestamp) {
              const date = new Date(Number(block.timestamp) * 1000);
              timestamp = date.toLocaleString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              });
            }
          } catch (_) {
            timestamp = 'N/A';
          }

          return {
            txHash: event.transactionHash,
            blockNumber: blockNumber,
            from: event.args[0],
            to: event.args[1],
            amount: ethers.formatUnits(event.args[2], CONFIG.TOKEN_DECIMALS),
            timestamp
          };
        })
      );

      return history;
    } catch (err) {
      console.warn('Gagal memuat riwayat transaksi:', err.message);
      return [];
    }
  }

  // ─── Format Address ───────────────────────────────────────────────────
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // ─── Format Number ───────────────────────────────────────────────────
  formatNumber(value, decimals = 4) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
  }
}

const contractService = new ContractService();
