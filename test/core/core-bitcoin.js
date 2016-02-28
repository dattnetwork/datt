/* global describe,it,before,after */
'use strict'
let Address = require('fullnode/lib/address')
let BIP44Wallet = require('../../core/bip44-wallet')
let CoreBitcoin = require('../../core/core-bitcoin')
let DB = require('../../core/db')
let Interp = require('fullnode/lib/interp')
let Txverifier = require('fullnode/lib/txverifier')
let Txbuilder = require('fullnode/lib/txbuilder')
let User = require('../../core/user')
let asink = require('asink')
let should = require('should')
let sinon = require('sinon')

describe('CoreBitcoin', function () {
  let db = DB('datt-testdatabase')
  let corebitcoin = CoreBitcoin(undefined, db)

  before(function () {
    return asink(function *() {
      yield db.asyncInitialize()
      yield corebitcoin.asyncInitialize()
    })
  })

  after(function () {
    return db.asyncDestroy()
  })

  it('should exist', function () {
    should.exist(CoreBitcoin)
    should.exist(CoreBitcoin())
  })

  describe('#initialize', function () {
    it('should set some initial variables', function () {
      should.exist(corebitcoin.balances)
      should.exist(corebitcoin.balances.confirmedBalanceSatoshis)
      should.exist(corebitcoin.balances.unconfirmedBalanceSatoshis)
      should.exist(corebitcoin.balances.totalBalanceSatoshis)
    })
  })

  describe('#fromUser', function () {
    it('should set known properties', function () {
      return asink(function *() {
        let user = yield User().asyncFromRandom()
        let corebitcoin = CoreBitcoin().fromUser(user)
        should.exist(corebitcoin.bip44wallet)
        should.exist(corebitcoin.bip44wallet.mnemonic)
        should.exist(corebitcoin.bip44wallet.masterxprv)
        should.exist(corebitcoin.bip44wallet.masterxpub)
      })
    })
  })

  describe('#unmonitorBlockchainAPI', function () {
    it('should set timeoutID to "unmonitor"', function () {
      let corebitcoin = CoreBitcoin()
      corebitcoin.unmonitorBlockchainAPI()
      corebitcoin.timeoutID.should.equal('unmonitor')
    })
  })

  describe('#asyncUpdateBalance', function () {
    it('should use blockchain API to get balance', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        corebitcoin.asyncGetAllAddresses = () => Promise.resolve([])
        corebitcoin.blockchainAPI = {
          asyncGetAddressesBalancesSatoshis: sinon.stub().returns(Promise.resolve({
            confirmedBalanceSatoshis: 100,
            unconfirmedBalanceSatoshis: 0,
            totalBalanceSatoshis: 100
          }))
        }
        corebitcoin.emit = sinon.spy()
        yield corebitcoin.asyncUpdateBalance()
        corebitcoin.blockchainAPI.asyncGetAddressesBalancesSatoshis.calledOnce.should.equal(true)
        corebitcoin.emit.calledOnce.should.equal(true)
      })
    })
  })

  describe('#getLastBalances', function () {
    it('if no balances have been retrieved remotely, it should return default balances obj from CoreBitcoin#initialize', function () {
      let corebitcoin = CoreBitcoin()

      let cachedBalances = corebitcoin.getLastBalances()

      should.exist(cachedBalances)

      cachedBalances.should.be.an.instanceOf(Object)
      cachedBalances.should.have.property('confirmedBalanceSatoshis', 0)
      cachedBalances.should.have.property('unconfirmedBalanceSatoshis', 0)
      cachedBalances.should.have.property('totalBalanceSatoshis', 0)
    })

    it('should return the last balances retrieved', function () {
      return asink(function *() {
        let mockBalances = {
          confirmedBalanceSatoshis: 100,
          unconfirmedBalanceSatoshis: 0,
          totalBalanceSatoshis: 100
        }

        let corebitcoin = CoreBitcoin()

        corebitcoin.asyncGetAllAddresses = () => Promise.resolve([])
        corebitcoin.blockchainAPI = {
          asyncGetAddressesBalancesSatoshis: sinon.stub().returns(Promise.resolve(mockBalances))
        }

        yield corebitcoin.asyncUpdateBalance()

        let cachedBalances = corebitcoin.getLastBalances()

        mockBalances.should.equal(cachedBalances)
      })
    })
  })

  describe('#asyncBuildTransaction', function () {
    it('should create a txbuilder object from mocked data', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        let bip44wallet = yield BIP44Wallet().asyncFromRandom()
        let bip44account = yield bip44wallet.asyncGetPrivateAccount(0)
        let keys = yield bip44account.asyncGetNextExtAddressKeys()

        corebitcoin.bip44wallet = bip44wallet
        corebitcoin.asyncGetAllAddresses = () => Promise.resolve([keys.address])
        corebitcoin.asyncGetNewIntAddress = () => Promise.resolve(keys.address)
        corebitcoin.blockchainAPI.asyncGetUTXOsJSON = () => Promise.resolve([
          {
            address: keys.address.toString(),
            txid: '0'.repeat(32 * 2),
            vout: 0,
            tx: 1449517728600,
            scriptPubKey: keys.address.toScript().toHex(),
            amount: 0.001,
            confirmations: 1
          }
        ])

        let txb = yield corebitcoin.asyncBuildTransaction(keys.address, 1000)
        ;(txb instanceof Txbuilder).should.equal(true)
      })
    })
  })

  describe('#asyncSignTransaction', function () {
    it('should create a txbuilder object from mocked data', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        let bip44wallet = yield BIP44Wallet().asyncFromRandom()
        let bip44account = yield bip44wallet.asyncGetPrivateAccount(0)
        let keys = yield bip44account.asyncGetNextExtAddressKeys()

        corebitcoin.bip44wallet = bip44wallet
        corebitcoin.asyncGetAllAddresses = () => Promise.resolve([keys.address])
        corebitcoin.asyncGetNewIntAddress = () => Promise.resolve(keys.address)
        corebitcoin.blockchainAPI.asyncGetUTXOsJSON = () => Promise.resolve([
          {
            address: keys.address.toString(),
            txid: '0'.repeat(32 * 2),
            vout: 0,
            tx: 1449517728600,
            scriptPubKey: keys.address.toScript().toHex(),
            amount: 0.001,
            confirmations: 1
          }
        ])

        let txb = yield corebitcoin.asyncBuildTransaction(keys.address, 1000)
        let txb2 = yield corebitcoin.asyncSignTransaction(txb)
        ;(txb2 instanceof Txbuilder).should.equal(true)
        Txverifier.verify(txb2.tx, txb2.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
      })
    })
  })

  describe('#asyncSendTransaction', function () {
    it('should call blockchainAPI\'s asyncSendTransaction', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        corebitcoin.blockchainAPI = {
          asyncSendTransaction: sinon.stub().returns(Promise.resolve())
        }
        let txb = 'hello'
        yield corebitcoin.asyncSendTransaction(txb)
        corebitcoin.blockchainAPI.asyncSendTransaction.calledOnce.should.equal(true)
        corebitcoin.blockchainAPI.asyncSendTransaction.calledWith(txb).should.equal(true)
      }, this)
    })
  })

  describe('#asyncBuildSignAndSendTransaction', function () {
    it('should call other internal methods', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        corebitcoin.asyncBuildTransaction = sinon.stub().returns(Promise.resolve('hello'))
        corebitcoin.asyncSignTransaction = sinon.stub().returns(Promise.resolve('hello'))
        corebitcoin.asyncSendTransaction = sinon.spy()
        let txb = yield corebitcoin.asyncBuildSignAndSendTransaction()
        corebitcoin.asyncBuildTransaction.calledOnce.should.equal(true)
        corebitcoin.asyncSignTransaction.calledOnce.should.equal(true)
        corebitcoin.asyncSendTransaction.calledOnce.should.equal(true)
        txb.should.equal('hello')
      })
    })
  })

  describe('#asyncGetAllUTXOs', function () {
    it('should get all utxos with mocked calls', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        let bip44wallet = yield BIP44Wallet().asyncFromRandom()
        let bip44account = yield bip44wallet.asyncGetPrivateAccount(0)
        let keys = yield bip44account.asyncGetNextExtAddressKeys()

        corebitcoin.bip44wallet = bip44wallet
        corebitcoin.asyncGetAllAddresses = () => Promise.resolve([keys.address])
        corebitcoin.blockchainAPI.asyncGetUTXOsJSON = () => Promise.resolve([
          {
            address: keys.address.toString(),
            txid: '0'.repeat(32 * 2),
            vout: 0,
            tx: 1449517728600,
            scriptPubKey: keys.address.toScript().toHex(),
            amount: 0.001,
            confirmations: 1
          }
        ])

        let utxos = yield corebitcoin.asyncGetAllUTXOs()
        utxos.length.should.equal(1)
        should.exist(utxos[0].txhashbuf)
        should.exist(utxos[0].txoutnum)
        should.exist(utxos[0].txout)
        should.exist(utxos[0].pubkey)
      })
    })
  })

  describe('#asyncGetAllAddresses', function () {
    it('should get addresses', function () {
      return asink(function *() {
        let user = yield User().asyncFromRandom()
        let corebitcoin = CoreBitcoin().fromUser(user)
        corebitcoin.dbbip44wallet = {
          asyncSave: () => Promise.resolve()
        }
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewIntAddress()
        let addresses = yield corebitcoin.asyncGetAllAddresses()
        addresses.length.should.equal(3)
      })
    })
  })

  describe('#asyncGetAllExtAddresses', function () {
    it('should get addresses', function () {
      return asink(function *() {
        let user = yield User().asyncFromRandom()
        let corebitcoin = CoreBitcoin().fromUser(user)
        corebitcoin.dbbip44wallet = {
          asyncSave: () => Promise.resolve()
        }
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewIntAddress()
        let addresses = yield corebitcoin.asyncGetAllExtAddresses()
        addresses.length.should.equal(2)
      })
    })
  })

  describe('#asyncGetExtAddress', function () {
    it('should get an address', function () {
      return asink(function *() {
        let address = yield corebitcoin.asyncGetExtAddress(0)
        let address2 = yield corebitcoin.asyncGetExtAddress(0)
        let address3 = yield corebitcoin.asyncGetExtAddress(15)
        ;(address instanceof Address).should.equal(true)
        address.toString().should.equal(address2.toString())
        address.toString().should.not.equal(address3.toString())
      })
    })
  })

  describe('#asyncGetNewExtAddress', function () {
    it('should get a new address', function () {
      return asink(function *() {
        let address = yield corebitcoin.asyncGetNewExtAddress()
        ;(address instanceof Address).should.equal(true)
      })
    })
  })

  describe('#asyncGetAllIntAddresses', function () {
    it('should get addresses', function () {
      return asink(function *() {
        let user = yield User().asyncFromRandom()
        let corebitcoin = CoreBitcoin().fromUser(user)
        corebitcoin.dbbip44wallet = {
          asyncSave: () => Promise.resolve()
        }
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewExtAddress()
        yield corebitcoin.asyncGetNewIntAddress()
        let addresses = yield corebitcoin.asyncGetAllIntAddresses()
        addresses.length.should.equal(1)
      })
    })
  })

  describe('#asyncGetNewIntAddress', function () {
    it('should get a new address', function () {
      return asink(function *() {
        let address = yield corebitcoin.asyncGetNewIntAddress()
        ;(address instanceof Address).should.equal(true)
      })
    })
  })

  describe('#asyncUpdateBlockInfo', function () {
    it('should call blockchainAPI.asyncGetLatestBlockInfo', function () {
      return asink(function *() {
        this.timeout(10000)
        let corebitcoin = CoreBitcoin()
        corebitcoin.blockchainAPI.asyncGetLatestBlockInfo = sinon.spy()
        yield corebitcoin.asyncGetLatestBlockInfo()
        corebitcoin.blockchainAPI.asyncGetLatestBlockInfo.calledOnce.should.equal(true)
      }, this)
    })

    it('should emit event "block-info" on CoreBitcoin', function () {
      return asink(function *() {
        this.timeout(10000)
        let corebitcoin = CoreBitcoin()
        corebitcoin.emit = sinon.spy()
        yield corebitcoin.asyncGetLatestBlockInfo()
        corebitcoin.emit.calledWith('block-info').should.equal(true)
      }, this)
    })
  })

  describe('#asyncGetLatestBlockInfo', function () {
    it('should call #asyncUpdateBlockInfo', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()
        corebitcoin.asyncUpdateBlockInfo = sinon.spy()
        yield corebitcoin.asyncGetLatestBlockInfo()
        corebitcoin.asyncUpdateBlockInfo.calledOnce.should.equal(true)
      })
    })
  })

  describe('#getLastBlockInfo', function () {
    it('if no block has been retrieved, it should return null', function () {
      let corebitcoin = CoreBitcoin()

      let lastBlockInfo = corebitcoin.getLastBlockInfo()

      should(lastBlockInfo).not.be.ok()
    })

    it('should return the last block retrieved by #asyncGetLatestBlockInfo', function () {
      return asink(function *() {
        let corebitcoin = CoreBitcoin()

        let retrievedBlockInfo = yield corebitcoin.asyncGetLatestBlockInfo()
        let cachedBlockInfo = corebitcoin.getLastBlockInfo()

        retrievedBlockInfo.should.equal(cachedBlockInfo)
      })
    })
  })
})
