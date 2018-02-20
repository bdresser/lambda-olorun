import { Credentials, SimpleSigner } from 'uport'

class UPortMgr {

    constructor() {
        this.credentials=null;
        this.callbackUrl=null;
    }

    isSecretsSet(){
        return (this.credentials !== null || this.callbackUrl !== null);
    }

    setSecrets(secrets){
        this.credentials = new Credentials({
          appName: secrets.APP_NAME,
          address: secrets.APP_MNID,
          signer:  SimpleSigner(secrets.SIGNER_KEY)
        })
        this.callbackUrl=secrets.CALLBACK_URL
    }
    
    async requestToken(){
        let requestOpts={
            notifications: true,
            callbackUrl: this.callbackUrl,
            accountType: 'devicekey'
            //exp: 1512529200
        }
        return this.credentials.createRequest(requestOpts);
    }

    async receiveAccessToken(accessToken){
        return this.credentials.receive(accessToken);
    }

    async push(pushToken, pubEncKey, url){
        return this.credentials.push(pushToken, pubEncKey, {url})
    }
}
module.exports = UPortMgr
