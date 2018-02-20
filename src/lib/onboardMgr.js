import { encode } from 'mnid'

class OnboardMgr {

    constructor() {
        
    }

    async onboard(deviceKey){

      //Check if the deviceKey has created an identity already
      let idCreationObj; 
      try{
        console.log("calling identityManagerMgr.getIdentityCreation")
        idCreationObj = await this.identityManagerMgr.getIdentityCreation(body.deviceKey) 
      } catch(err) {
        console.log("Error on this.identityManagerMgr.getIdentityCreation")
        console.log(err)
        cb({ code: 500, message: err })
        return;
      }

      if(idCreationObj){
        const mess="deviceKey already used. On tx: "+idCreationObj.tx_hash
        console.log(mess)
        cb({code: 400, message: mess})
        return;
      }

      //Create Identity
      try{
        console.log("calling identityManagerMgr.createIdentity")
        const {managerAddress,txHash} = await this.identityManagerMgr.createIdentity(body) 
        console.log("managerAddress:"+managerAddress)
        console.log("txHash:"+txHash)

        let resp={
            managerType: body.managerType,
            managerAddress: managerAddress,
            txHash: txHash
        }
        cb(null, resp)
      } catch(err) {
        console.log("Error on this.identityManagerMgr.createIdentity")
        console.log(err)
        cb({ code: 500, message: err.message })
        return;
      }
        
        //TODO: Change. This is all fake data!!
        let mnid=encode({
            network: '0x1957',
            address: deviceKey
        })
        return mnid;
    }

}
module.exports = OnboardMgr
