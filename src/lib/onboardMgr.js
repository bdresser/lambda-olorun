import { encode } from 'mnid'

class OnboardMgr {

    constructor() {
        
    }

    async onboard(deviceKey){
        
        //TODO: Change. This is all fake data!!
        let mnid=encode({
            network: '0x1957',
            address: deviceKey
        })
        return mnid;
    }

}
module.exports = OnboardMgr
