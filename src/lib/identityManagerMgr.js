import { IdentityManager, MetaIdentityManager} from 'uport-identity'
import Promise from 'bluebird'
import { Client } from 'pg'
import abi from 'ethjs-abi'

class IdentityManagerMgr {

  constructor(ethereumMgr,blockchainMgr) {
    this.identityManagers = {}
    this.metaIdentityManagers = {}
    this.ethereumMgr=ethereumMgr;
    this.blockchainMgr=blockchainMgr;
    this.pgUrl=null
  }

  isSecretsSet(){
    return (this.pgUrl !== null);
  }

  setSecrets(secrets){
    this.pgUrl=secrets.PG_URL;
  }

  async initIdentityManager(managerType,networkId) {
    if(!managerType) throw('no managerType')
    if(!networkId) throw('no networkId')

    let idMgrs,idMgrArtifact;
    switch(managerType){
      case 'IdentityManager':
        idMgrs = this.identityManagers
        idMgrArtifact = IdentityManager.v2
        break;
      case 'MetaIdentityManager':
        idMgrs = this.metaIdentityManagers
        idMgrArtifact = MetaIdentityManager.v2
        break;
      default:
        throw('invalid managerType')
    }

    if (!idMgrs[networkId]) {
      let abi = idMgrArtifact.abi

      let imAddr=blockchainMgr.getIdentityManagerAddress(networkId,managerType);
      let IdMgrContract = this.ethereumMgr.getContract(abi,networkId)
      idMgrs[networkId] = IdMgrContract.at(imAddr)
      idMgrs[networkId] = Promise.promisifyAll(idMgrs[networkId])
    }
  }

  async createIdentity({deviceKey, recoveryKey, networkId, managerType, payload}) {
    if(!deviceKey) throw('no deviceKey')
    if(!managerType) throw('no managerType')
    if (payload && !payload.destination) throw('payload but no payload.destination')
    if (payload && !payload.data) throw('payload but no payload.data')
    let recoveryKeyFix

    let zeroHexString = /^0x[^1-9]+$/
    if (recoveryKey && !recoveryKey.match(zeroHexString)) {
        recoveryKeyFix = recoveryKey
      } else {
        recoveryKeyFix = deviceKey
      }

    let idMgrs;
    switch(managerType){
      case 'IdentityManager':
        idMgrs = this.identityManagers
        break;
      case 'MetaIdentityManager':
        idMgrs = this.metaIdentityManagers
        break;
      default:
        throw('invalid managerType')
    }


    await this.initIdentityManager(managerType,networkId)
    let from = this.ethereumMgr.getAddress() 
    let txOptions = {
      from: from,
      gas: 3000000,
      gasPrice: await this.ethereumMgr.getGasPrice(networkId),
      nonce: await this.ethereumMgr.getNonce(from,networkId)
    }

    //Return object
    let ret={
      managerAddress: idMgrs[networkId].address
    }

    if (payload) {
      ret.txHash=await idMgrs[networkId].createIdentityWithCallAsync(deviceKey, recoveryKeyFix, payload.destination, payload.data, txOptions)
    } else {
      ret.txHash= await idMgrs[networkId].createIdentityAsync(deviceKey, recoveryKeyFix, txOptions)
    }

    await this.storeIdentityCreation(deviceKey, ret.txHash, networkId, managerType, ret.managerAddress)
    return ret;
  }

  async storeIdentityCreation(deviceKey, txHash, networkId, managerType, managerAddress) {
    if(!deviceKey) throw('no deviceKey')
    if(!txHash) throw('no txHash')
    if(!networkName) throw('no networkId')
    if(!managerType) throw('no managerType')
    if(!managerAddress) throw('no managerAddress')
    if(!this.pgUrl) throw('no pgUrl set')

    const client = new Client({
        connectionString: this.pgUrl,
    })

    try{
        await client.connect()
        const res=await client.query(
            "INSERT INTO identities(device_key,tx_hash, network,manager_type,manager_address) \
             VALUES ($1,$2,$3,$4,$5) "
            , [deviceKey, txHash, networkId, managerType, managerAddress]);
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }

  async getIdentityCreation(deviceKey){
    if(!deviceKey) throw('no deviceKey')
    if(!this.pgUrl) throw('no pgUrl set')

    const client = new Client({
        connectionString: this.pgUrl,
    })

    try{
        await client.connect()
        const res=await client.query(
            "SELECT tx_hash, manager_type, manager_address, identity, network \
               FROM identities \
              WHERE device_key = $1 \
           ORDER BY created \
              LIMIT 1"
            , [deviceKey]);
        return res.rows[0];
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }

  async getIdentityFromTxHash(txHash,networkId){
    if(!txHash) throw('no txHash')
    if(!networkId) throw('no networkId')
    if(!this.pgUrl) throw('no pgUrl set')

    const txReceipt=await this.ethereumMgr.getTransactionReceipt(txHash,networkId);
    if(!txReceipt) return null;

    const decodedLogs = await this.decodeLogs(txReceipt)
    const identity = decodedLogs.identity

    const client = new Client({
      connectionString: this.pgUrl,
    })

    try{
        await client.connect()
        const res=await client.query(
            "UPDATE identities \
                SET identity = $2 \
              WHERE tx_hash = $1"
            , [txHash, identity]);
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }

    return identity;
  }

  async decodeLogs(txReceipt){
    if(!txReceipt) throw('no txReceipt')
    const idMgrArtifact =  MetaIdentityManager.v2 //TODO: need to fix this

    let eventAbi = idMgrArtifact.abi.filter((o) => { return o.name === 'LogIdentityCreated' })[0]
    let log = txReceipt.logs[0] //I hope is always the first one
    return abi.decodeEvent(eventAbi, log.data, log.topics)

  }


  async getTxData(txHash,networkId){
    await this.ethereumMgr.getTransaction(txHash,networkId);
  }




}
module.exports = IdentityManagerMgr
