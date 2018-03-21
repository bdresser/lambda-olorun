import networks from './networks'
import Web3 from 'web3'
import Promise from 'bluebird'
import { generators, signers } from 'eth-signer'
import Transaction from 'ethereumjs-tx'
import { Client } from 'pg'
import SignerProvider from 'ethjs-provider-signer'

const HDSigner = signers.HDSigner

const DEFAULT_GAS_PRICE = 20000000000 // 20 Gwei

class EthereumMgr {

  constructor() {
    this.pgUrl=null
    this.seed=null

    this.web3s = {}
    this.gasPrices = {}

  }

  isSecretsSet(){
      return (this.pgUrl !== null || this.seed !== null);
  }

  setSecrets(secrets){
      this.pgUrl=secrets.PG_URL;
      this.seed=secrets.SEED;

      const hdPrivKey = generators.Phrase.toHDPrivateKey(this.seed)
      this.signer = new HDSigner(hdPrivKey)

      const txSigner= {
        signTransaction: (tx_params, cb) => {
          let tx = new Transaction(tx_params)
          let rawTx = tx.serialize().toString('hex')
          this.signer.signRawTx(rawTx,(err, signedRawTx) => {
            cb(err,'0x'+signedRawTx)
          })
        },
        accounts: (cb) => cb(null, [this.signer.getAddress()]),
      }

      for (const network in networks) {
        let provider = new SignerProvider(networks[network].rpcUrl,txSigner);
        let web3 = new Web3(provider)
        web3.eth = Promise.promisifyAll(web3.eth)
        this.web3s[network] = web3

        this.gasPrices[network]= DEFAULT_GAS_PRICE;
      }
  }

  getProvider(networkName) {
    if(!this.web3s[networkName]) return null;
    return this.web3s[networkName].currentProvider
  }

  getAddress(){
    return this.signer.getAddress()
  }

  getNetworkId(networkName){
    if(!networkName) throw('no networkName')
    return networks[networkName].id
  }

  getContract(abi,networkName){
    if(!abi) throw('no abi')
    if(!networkName) throw('no networkName')
    if(!this.web3s[networkName]) throw('no web3 for networkName')
    return this.web3s[networkName].eth.contract(abi)
  }

  async getTransactionReceipt(txHash,networkName){
    if(!txHash) throw('no txHash')
    if(!networkName) throw('no networkName')
    if(!this.web3s[networkName]) throw('no web3 for networkName')
    return await this.web3s[networkName].eth.getTransactionReceiptAsync(txHash)
  }


  async getBalance(address, networkName) {
    if(!address) throw('no address')
    if(!networkName) throw('no networkName')
    if(!this.web3s[networkName]) throw('no web3 for networkName')
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getGasPrice(networkName) {
    if(!networkName) throw('no networkName')
    try {
      this.gasPrices[networkName] = (await this.web3s[networkName].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrices[networkName]
  }

  async getNonce(address, networkName) {
    if(!address) throw('no address')
    if(!networkName) throw('no networkName')
    if(!this.pgUrl) throw('no pgUrl set')

    const client = new Client({
        connectionString: this.pgUrl,
    })

    try{
        await client.connect()
        const res=await client.query(
            "INSERT INTO nonces(address,network,nonce) \
             VALUES ($1,$2,0) \
        ON CONFLICT (address,network) DO UPDATE \
              SET nonce = nonces.nonce + 1 \
            WHERE nonces.address=$1 \
              AND nonces.network=$2 \
        RETURNING nonce;"
            , [address, networkName]);
        return res.rows[0].nonce;
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }




}

module.exports = EthereumMgr
