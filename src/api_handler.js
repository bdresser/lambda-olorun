'use strict'
const AWS = require('aws-sdk');

const UPortMgr = require('./lib/uPortMgr')
const EthereumMgr = require('./lib/ethereumMgr')
const IdentityManagerMgr = require('./lib/identityManagerMgr')
const MetaTxMgr = require('./lib/metaTxMgr')


const RequestTokenHandler = require('./handlers/requestToken')
const CreateIdentityHandler = require('./handlers/createIdentity')
const RelayHandler = require('./handlers/relay')


let uPortMgr = new UPortMgr()
let ethereumMgr = new EthereumMgr()
let identityManagerMgr = new IdentityManagerMgr(ethereumMgr)
let metaTxMgr = new MetaTxMgr(ethereumMgr)

let requestTokenHandler = new RequestTokenHandler(uPortMgr)
let createIdentityHandler = new CreateIdentityHandler(uPortMgr,identityManagerMgr)
let relayHandler = new RelayHandler(ethereumMgr,metaTxMgr)

module.exports.requestToken = (event, context, callback) => { preHandler(requestTokenHandler,event,context,callback) }
module.exports.createIdentity = (event, context, callback) => { preHandler(createIdentityHandler,event,context,callback) }
module.exports.relay = (event, context, callback) => { preHandler(relayHandler,event,context,callback) }


const preHandler = (handler,event,context,callback) =>{
  console.log(event)
  if(!ethereumMgr.isSecretsSet() ||
     !uPortMgr.isSecretsSet() || 
     !identityManagerMgr.isSecretsSet()){
    const kms = new AWS.KMS();
    kms.decrypt({
      CiphertextBlob: Buffer(process.env.SECRETS, 'base64')
    }).promise().then(data => {
      const decrypted = String(data.Plaintext)
      uPortMgr.setSecrets(JSON.parse(decrypted))
      ethereumMgr.setSecrets(JSON.parse(decrypted))
      identityManagerMgr.setSecrets(JSON.parse(decrypted))
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
