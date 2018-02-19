'use strict'
const AWS = require('aws-sdk');

const UPortMgr = require('./lib/uPortMgr')
const OnboardMgr = require('./lib/onboardMgr')

const RequestTokenHandler = require('./handlers/requestToken')
const OnboardHandler = require('./handlers/onboard')

let uPortMgr = new UPortMgr()
let onboardMgr = new OnboardMgr()

let requestTokenHandler = new RequestTokenHandler(uPortMgr)
let onboardHandler = new OnboardHandler(uPortMgr,onboardMgr)

module.exports.requestToken = (event, context, callback) => { preHandler(requestTokenHandler,event,context,callback) }
module.exports.onboard = (event, context, callback) => { preHandler(onboardHandler,event,context,callback) }

const preHandler = (handler,event,context,callback) =>{
  console.log(event)
  if(!uPortMgr.isSecretsSet()){
    const kms = new AWS.KMS();
    kms.decrypt({
      CiphertextBlob: Buffer(process.env.SECRETS, 'base64')
    }).promise().then(data => {
      const decrypted = String(data.Plaintext)
      uPortMgr.setSecrets(JSON.parse(decrypted))
      doHandler(handler,event,context,callback)
    })
  }else{
    doHandler(handler,event,context,callback)
  }
}

const doHandler = (handler,event,context,callback) =>{
  handler.handle(event,context,(err,resp)=>{
    let response;
    if(err==null){
      response = {
          statusCode: 200,
          body: JSON.stringify({
            status: 'success',
            data: resp
          })
        }
    }else{
      //console.log(err);
      let code=500;
      if(err.code) code=err.code;
      let message=err;
      if(err.message) message=err.message;
      
      response = {
        statusCode: code,
        body: JSON.stringify({
          status: 'error',
          message: message
        })
      }
    }

    callback(null, response)
  })

}
