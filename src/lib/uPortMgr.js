import { Credentials, SimpleSigner } from 'uport'
import { createJWT } from 'uport/lib/JWT'


class UPortMgr {

    constructor() {
        this.signer=null;
        this.address=null;
        this.credentials=null;
        this.callbackUrl=null;
    }

    isSecretsSet(){
        return (this.signer !== null || this.credentials !== null || this.callbackUrl !== null);
    }

    setSecrets(secrets){
        this.signer = SimpleSigner(secrets.SIGNER_KEY)
        this.address = secrets.APP_MNID;
        this.credentials = new Credentials({
          appName: secrets.APP_NAME,
          address: this.address,
          signer:  this.signer
        })
        this.callbackUrl=secrets.CALLBACK_URL
    }
    
    async requestToken(){
        let requestOpts={
            notifications: true,
            callbackUrl: this.callbackUrl,
            accountType: 'devicekey',
            network_id: '0x3039',
            exp: 1522540800 // Sunday, 1 de April de 2018 0:00:00 GMT
        }
        return this.credentials.createRequest(requestOpts);
    }

    async receiveAccessToken(accessToken){
        return this.credentials.receive(accessToken);
    }

    async signJWT(payload){
        return createJWT({address:this.address, signer:this.signer},payload)
    }

    async push(pushToken, pubEncKey, url){
        return this.credentials.push(pushToken, pubEncKey, {url})
    }
}
module.exports = UPortMgr
