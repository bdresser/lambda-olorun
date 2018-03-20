import Web3 from 'web3'
import Promise from 'bluebird'
import { generators, signers } from 'eth-signer'
import Transaction from 'ethereumjs-tx'
import { Client } from 'pg'
import SignerProvider from 'ethjs-provider-signer'

const HDSigner = signers.HDSigner

class EthereumMgr {

  constructor(blockchainMgr) {
    this.blockchainMgr=blockchainMgr
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

      const supportedNetworkIds = this.blockchainMgr.getSupportedNetworkIds()

      for (const networkId in supportedNetworkIds) {
        let rpcUrl = this.blockchainMgr.getRpcUrl(networkId);

        let provider = new SignerProvider(rpcUrl,txSigner);
        let web3 = new Web3(provider)
        web3.eth = Promise.promisifyAll(web3.eth)
        this.web3s[networkId] = web3

        this.gasPrices[networkId]= this.blockchainMgr.getDefaultGasPrice(networkId);
      }
  }

  getProvider(networkId) {
    if(!this.web3s[networkId]) return null;
    return this.web3s[networkId].currentProvider
  }

  getAddress(){
    return this.signer.getAddress()
  }

  getContract(abi,networkId){
    if(!abi) throw('no abi')
    if(!networkId) throw('no networkId')
    if(!this.web3s[networkId]) throw('no web3 for networkId')
    return this.web3s[networkId].eth.contract(abi)
  }

  async getTransactionReceipt(txHash,networkId){
    if(!txHash) throw('no txHash')
    if(!networkId) throw('no networkId')
    if(!this.web3s[networkId]) throw('no web3 for networkId')
    return await this.web3s[networkId].eth.getTransactionReceiptAsync(txHash)
  }


  async getBalance(address, networkId) {
    if(!address) throw('no address')
    if(!networkId) throw('no networkId')
    if(!this.web3s[networkId]) throw('no web3 for networkId')
    return await this.web3s[networkId].eth.getBalanceAsync(address)
  }

  async getGasPrice(networkId) {
    if(!networkId) throw('no networkId')
    try {
      this.gasPrices[networkId] = (await this.web3s[networkId].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrices[networkId]
  }

  async getNonce(address, networkId) {
    if(!address) throw('no address')
    if(!networkId) throw('no networkId')
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
            , [address, networkId]);
        return res.rows[0].nonce;
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }




}

module.exports = EthereumMgr
