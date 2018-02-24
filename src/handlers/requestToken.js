
class RequestTokenHandler {
    constructor (uPortMgr) {
      this.uPortMgr = uPortMgr
    }
  
    async handle(event,context, cb) {

      const networkId='0x3039' //This can be read from the url? Hardcoded for now

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
  