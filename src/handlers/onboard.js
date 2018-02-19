
class OnboardHandler {
    constructor (uPortMgr,onboardMgr) {
        this.uPortMgr = uPortMgr
        this.onboardMgr = onboardMgr
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
            let profile=await this.uPortMgr.receiveAccessToken(body.access_token);
            console.log("<profile>");
            console.log(profile);
            console.log("</profile>");
            deviceKey=profile.address //TODO: Change. This is not right!!!
        } catch (error){
            console.log("Error on this.uPortMgr.receiveAccessToken")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        } 
      

        //Create new identity on private network
        let mnid
        try{
            mnid=await this.onboardMgr.onboard(deviceKey);
        } catch (error){
            console.log("Error on this.onboardMgr.onboard")
            console.log(error)
            cb({code: 500, message: error.message})
            return;
        }
        
        //Push network definition to mobile app

        cb(null,mnid)
    }

  }

  module.exports = OnboardHandler
