# lambda-olorun
uPort private network support

[![codecov](https://codecov.io/gh/uport-project/lambda-olorun/branch/master/graph/badge.svg)](https://codecov.io/gh/uport-project/lambda-olorun)

## Instalation

### Deploy contracts
Follow the steps to deploy the contracts on https://github.com/uport-project/uport-identity

optional deploy the ERC-780 compatible uport-registry , following the steps on https://github.com/uport-project/uport-registry

### Configure network 
Edit the `private-network.js` file and add a new entry for the network. Something like this:

```json
0x3039: {
    rpcUrl: 'http://104.214.116.251:8545/',
    defaultGasPrice: 20000000000, // 20 Gwei
    uPort: {
        IdentityManager: '0xb8a00506e12d39522cd1787389ae8f83db536e46',
        MetaIdentityManager: '0xd7dc3926bc6089a5be4815215ceaa6e707591023',
        TxRelay: '0x6a841ba0ea1a88cfbc085220fc6b65973afca431'
    }
}

```

Each entry is identified by the `network_id` of the private blockchain.

To get the `network_id` of the network just do:

`curl -X POST --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":67}' <rpc-endpoint>
`



The following are the parameters to configure

| Parameter                   | Description                                                         | 
| --------------------------- | ------------------------------------------------------------------- | 
| rcpUrl                      | Url of the rpcEndpoint for the private network                      | 
| defaultGasPrice             | Default gas price for network                                       |
| uPort.IdentityManager       | address of the deployed IdentityManager on the private network      |
| uPort.MetaIdentityManager   | address of the deployed MetaIdentityManager on the private network  |
| uPort.TxRelay               | address of the deployed TxRelay on the private network              |
| uPort.Registry              | address of the deployed Registry on the private network (optional)  |




