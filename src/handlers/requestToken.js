
class RequestTokenHandler {
    constructor (uPortMgr,blockchainMgr) {
      this.uPortMgr = uPortMgr
      this.blockchainMgr = blockchainMgr
    }
  
    async handle(event,context, cb) {

      const networkId=this.blockchainMgr.getDefaultNetworkId()

      try{
        let requestToken= await this.uPortMgr.requestToken(networkId);
        let request='me.uport:me?requestToken='+requestToken
        cb(null,request)
      } catch (error){
        console.log("Error on this.uPortMgr.requestToken")
        console.log(error)
        cb({code: 500, message: error.message})
        return;
      } 
    }
  
  }
  
  module.exports = RequestTokenHandler
  