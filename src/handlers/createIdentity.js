import { encode } from 'mnid'

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

        const networkName='msft' //This can be read from the url? Hardcoded for now
        const netwokrId='0x3039'

        console.log("access_token:"+body.access_token);

        //Get deviceKey from access_token
        let deviceKey;
        let profile;
        try{
            profile=await this.uPortMgr.receiveAccessToken(body.access_token);
            console.log("<profile>");
            console.log(profile);
            console.log("</profile>");
            deviceKey='0x1' //TODO: Change. This is not right!!!
        } catch (error){
            console.log("Error on this.uPortMgr.receiveAccessToken")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        } 
      

        //Check if the deviceKey has created an identity already ?
       

        //Create Identity
        let idCreationtxHash;
        let metaIdentityManagerAddress;
        try{
            console.log("calling identityManagerMgr.createIdentity")
            let identityOpts={
                deviceKey: deviceKey,
                managerType: 'MetaIdentityManager',
                blockchain: networkName
            }
            const {managerAddress,txHash} = await this.identityManagerMgr.createIdentity(identityOpts) 
            console.log("managerAddress:"+managerAddress)
            console.log("txHash:"+txHash)

            idCreationtxHash = txHash;
            metaIdentityManagerAddress=managerAddress;

        } catch(err) {
            console.log("Error on this.identityManagerMgr.createIdentity")
            console.log(err)
            cb({ code: 500, message: err.message })
            return;
        }

        //Wait for identity to be created
        const wait = (ms) => { new Promise(resolve => setTimeout(resolve, ms)) };

        let idAddress=null;
        while(idAddress==null){
            try{
                console.log("Waiting 1000 ms")
                await wait(1000);
                console.log("calling identityManagerMgr.getIdentityFromTxHash")
                idAddress=await this.identityManagerMgr.getIdentityFromTxHash(idCreationtxHash,networkName)
                console.log("idAddress:"+idAddress)
            } catch(err) {
                console.log("Error on this.identityManagerMgr.getIdentityFromTxHash")
                console.log(err)
                cb({ code: 500, message: err.message })
                return;
            }
        }

        
        //Prepare Private Chain Provisioning Message
        let privProv={
            aud: profile.address,
            sub: encode({
                network: netwokrId,
                address: idAddress
            }),
            dad: deviceKey,
            ctl: metaIdentityManagerAddress,
            rel: "https://api.uport.space/olorun/relay", //TODO: Make this a parameter
            acc: '',
            gw: 'http://104.214.116.254:8545/' //TODO: is this needed?
        }
    
        //Sign privProv
        let signedPrivProv;
        try{
            console.log("calling uPortMgr.signJWT")
            signedPrivProv=await this.uPortMgr.signJWT(privProv);
        } catch (error){
            console.log("Error on this.uPortMgr.signJWT")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        }
        console.log(signedPrivProv);

        //Push network definition to mobile app
        const privProvUrl='me.uport:net/'+signedPrivProv
        try{
            console.log("calling uPortMgr.push")
            await this.uPortMgr.push(profile.pushToken, profile.publicEncKey,privProvUrl);
            console.log("pushed.")
        } catch (error){
            console.log("Error on this.uPortMgr.push")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        }

        cb(null,signedPrivProv)
    }

  }

  module.exports = CreateIdentityHandler
