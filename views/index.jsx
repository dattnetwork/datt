/**
 * Index
 * =====
 *
 * This is the main index page component, i.e. the front-page.
 */
'use strict'
let React = require('react')

let Index = React.createClass({
  getInitialState: function () {
    return {
      status: 'uninitialized',
      mnemonic: ''
    }
  },
  componentDidMount: function () {
    let dattcore = this.props.dattcore
    dattcore.init().then(function () {
      this.setState({
        status: 'initialized',
        mnemonic: dattcore.getUserMnemonic()
      })
    }.bind(this))
    .catch(function (err) {
      this.setState({
        status: 'error initializing: ' + err
      })
    }.bind(this))
  },
  propTypes: {
    apptitle: React.PropTypes.string,
    dattcore: React.PropTypes.object
  },
  render: function () {
    return (
      <div className='container'>
        <div className='row page-header'>
          <div className='col-md-12'>
            <img src='/logo.svg' alt='' />
            <h1>{this.props.apptitle}</h1>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-8'>
            <p>
            status of dattcore: {this.state.status}
            </p>
          </div>

          <div className='col-md-4 side-boxes'>
            <UserBox dattcore={this.props.dattcore} mnemonic={this.state.mnemonic}/>
            <BitcoinBox bitsbalance={0}/>
            <ContentBox postsnumber={0}/>
            <PeerBox peersnumber={0}/>
          </div>
        </div>
      </div>
    )
  }
})

let UserBox = React.createClass({
  getInitialState: function () {
    return {
      username: '',
      newUsername: ''
    }
  },
  handleChange: function (e) {
    this.setState({
      newUsername: e.target.value
    })
  },
  handleSubmit: function () {
    let dattcore = this.props.dattcore
    return dattcore.setUserName(this.state.newUsername).then(function () {
      this.setState({
        username: dattcore.getUserName()
      })
    }.bind(this))
  },
  propTypes: {
    dattcore: React.PropTypes.object,
    mnemonic: React.PropTypes.string
  },
  render: function () {
    return (
      <div className='info-box'>
        <h2>My User</h2>
        <p>Your mnemonic: {this.props.mnemonic}</p>
        <p>
          <span>Your current username: {this.state.username}</span>
          <span>
            <input type='text' className='form-control' value={this.state.newUsername} onChange={this.handleChange}/>
            <button className='btn btn-default' onClick={this.handleSubmit}>Set</button>
          </span>
        </p>
      </div>
    )
  }
})

let BitcoinBox = React.createClass({
  propTypes: {
    bitsbalance: React.PropTypes.number
  },
  render: function () {
    return (
      <div className='info-box'>
        <h2>My Bitcoin</h2>
        <p>Your balance: {this.props.bitsbalance} bits</p>
        <p><button className='btn btn-default'>Send</button>
        <button className='btn btn-default'>Receive</button></p>
      </div>
    )
  }
})

let ContentBox = React.createClass({
  propTypes: {
    postsnumber: React.PropTypes.number
  },
  render: function () {
    return (
      <div className='info-box'>
        <h2>My Content</h2>
        <p>Number of posts: {this.props.postsnumber}</p>
        <p><button className='btn btn-default'>Export</button>
        <button className='btn btn-default'>Import</button></p>
      </div>
    )
  }
})

let PeerBox = React.createClass({
  propTypes: {
    peersnumber: React.PropTypes.number
  },
  render: function () {
    return (
      <div className='info-box'>
        <h2>My Peers</h2>
        <p>Number of peers: {this.props.peersnumber}</p>
      </div>
    )
  }
})

module.exports = Index
