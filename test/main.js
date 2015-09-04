/* global it,describe,before */
var Main = require('../lib/main')
var Message = require('../lib/message')
var q = require('q')
var should = require('should')

describe('Main', function () {
  var main

  before(function () {
    main = new Main()
  })

  describe('Main', function () {
    it('should see the global main', function () {
      should.exist(main)
    })

  })

  describe('ContentDiscovery', function () {
    // Create a temporary to be used during tests
    function getMainObject () {
      var main = new Main()
      main.getContent = function (hash) {
        var deferred = q.defer()
        if (hash === 'testhash') {
          deferred.resolve('testcontent')
        } else {
          deferred.reject()
        }
        return deferred.promise
      }
      main.broadcastMessage = function (msg) {
        return q('broadcasted')
      }
      main.sendMessage = function (msg, sender) {
        return q('sentMessage')
      }

      main.peer = {}
      main.peer.id = '0'
      return main
    }

    describe('ContentDiscovery', function () {
      var main = getMainObject()

      describe('#handleContentDiscoveryRequest', function () {
        it('should not handle message coming from itself', function () {
          var message = Message.requestPeersForHash('testhash', main.peer.id)
          return main.handleContentDiscoveryRequest(message).then(function (result) {
            result.should.equal('Own message')
          })
        })

        it('should handle message with another id and send an announcement because it has this content', function () {
          main.peer.id = '1'
          var message = Message.requestPeersForHash('testhash', main.peer.id)
          main.peer.id = '0'
          return main.handleContentDiscoveryRequest(message).then(function (result) {
            result.should.eql(['broadcasted', 'sentMessage'])
          })
        })

        it('should not propagate the same message twice', function () {
          main.peer.id = '1'
          var message = Message.requestPeersForHash('testhash', main.peer.id)
          main.peer.id = '0'
          return main.handleContentDiscoveryRequest(message).then(function (result) {
            result.should.equal('Already seen message. Stop propagating')
          })
        })

        it('should propagate message and not send announcement', function () {
          main.peer.id = '1'
          var message = Message.requestPeersForHash('testhash2', main.peer.id)
          main.peer.id = '0'
          return main.handleContentDiscoveryRequest(message).then(function (result) {
            result.should.eql(['broadcasted', 'Did not have content'])
          })
        })
      })

      it('should throw an error if it cannot send announcement', function () {
        // Create main object with failing send
        var main2 = getMainObject()
        main2.sendMessage = function (msg, sender) {
          var deferred = q.defer()
          deferred.reject('send error')
          return deferred.promise
        }
        main2.peer.id = '2'
        var message = Message.requestPeersForHash('testhash', main2.peer.id)
        main2.peer.id = '0'

        return main2.handleContentDiscoveryRequest(message).then(function (result) {
          should.fail('ContentDiscover#handleContentDiscoveryRequest should fail when unable to send message')
        }).fail(function (error) {
          error.should.equal('send error')
        })
      })
    })

  })

  // TODO: Enable the rest of these tests in node by creating code with the
  // same interface that works over TCP instead of Web RTC. Or, optionally, the
  // server-side code could also use the node-webrtc library.
  if (!process.browser) {
    return
  }

  /* TODO: re-enable when tests automatically run web RTC rendezvous server
  describe('#init', function () {
    it('should initialize our global main', function () {
      return main.init()
    })

  })
  */

  describe('#signIn', function () {
    it('should sign in a user', function () {
      return main.signIn('user', 'password').then(function (user) {
        should.exist(main.user)
        main.user.username.should.equal('user')
        main.user.password.should.equal('password')
      })
    })

  })

  describe('#broadcastMessage', function () {
    it('should return a promise', function () {
      return main.broadcastMessage('my message')
    })

  })

})
