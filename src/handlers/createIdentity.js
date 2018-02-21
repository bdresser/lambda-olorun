
class CreateIdentityHandler {
    constructor (uPortMgr,identityManagerMgr) {
        this.uPortMgr = uPortMgr
        this.identityManagerMgr = identityManagerMgr
    }

    async handle(event,context, cb) {
        let body;

        if (event && !event.body){
            body = event
        } else if (event && event.body) {
            try {
            body = JSON.parse(event.body)
            } catch (e) {
            cb({ code: 400, message: 'no json body'})
            return;
            }
        } else {
            cb({code: 400, message: 'no json body'})
            return;
        }

        if (!body.access_token) {
            cb ({code: 400, message: 'access_token parameter missing'})
            return;
        }

        console.log("access_token:"+body.access_token);

        //Get deviceKey from access_token
        let deviceKey;
        try{
            /*
            let profile=await this.uPortMgr.receiveAccessToken(body.access_token);
            console.log("<profile>");
            console.log(profile);
            console.log("</profile>");
            */
            deviceKey='0x1' //profile.address //TODO: Change. This is not right!!!
        } catch (error){
            console.log("Error on this.uPortMgr.receiveAccessToken")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        } 
      

        //Check if the deviceKey has created an identity already ?
       

        //Create Identity
        let idCreationtxHash;
        try{
            console.log("calling identityManagerMgr.createIdentity")
            let identityOpts={
                deviceKey: deviceKey,
                managerType: 'MetaIdentityManager',
                blockchain: 'msft'
            }
            const {managerAddress,txHash} = await this.identityManagerMgr.createIdentity(identityOpts) 
            console.log("managerAddress:"+managerAddress)
            console.log("txHash:"+txHash)

            idCreationtxHash = txHash;

        } catch(err) {
            console.log("Error on this.identityManagerMgr.createIdentity")
            console.log(err)
            cb({ code: 500, message: err.message })
            return;
        }

        //Wait for identity to be created

        //while(idAddres!=null)
        //let idAddress=await this.identityManagerMgr.getIdentityFromTxHash(idCreationtxHash,'msft')
        
        //Prepare network def
        let netDef={
            /*
            aud: encode({
              network: '0x3',
              address: onboard.address
            }),
            */
            sub: encode({
              network: '0x1957', //Change to MSFT network id
              address: idAddress
            }),
            gw: 'http://104.214.116.254:8545/',
            rel: "https://api.uport.space/olorun/relay",
            //ctl: onboard.controllerAddress,
        }

        //Sign netDef

        //Push network definition to mobile app

        cb(null,netDef)
    }

  }

  module.exports = CreateIdentityHandler
