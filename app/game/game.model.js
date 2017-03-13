var mongoose = require('mongoose')
var _ = require('lodash')

var GameModel = mongoose.Schema({
  room: { type: String, index: true },
  status: String,
  playerCount: Number,

  players: [mongoose.Schema({
    id: String,
    name: String,
    status: String,
  }, { _id: false })]
})

GameModel.statics.findByRoom = function(room, cb) {
  return this.findOne({ room: room }, cb)
}

GameModel.methods.findPlayer = function(player) {
  return _.find(this.players, { id: player.id })
}

module.exports = mongoose.model('Game', GameModel)