var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var mongoose = require('mongoose')
var Game = require('./app/game/game.model')
var bodyParser = require('body-parser')

mongoose.connect('mongodb://localhost/aeonsend', function(error) {
  if (error) console.log('Error connecting to database')
  console.log('Connected to Aeons End Database')
})

// Allows serving of static files from public
// app.use(express.static('public'))

// Defines out default view path
app.set('views', __dirname + '/views')
app.set('x-powered-by', false)
app.set('view engine', 'pug')
app.use(bodyParser())

// Routes
app.get('/', function(req, res) {
  res.render('index')
})

app.post('/start', function(req, res) {
  var room = (Math.random()*1e32).toString(36);
  var pid = (Math.random()*1e32).toString(24);
  var num = req.body.playerCount;
  var players = [{
    id: pid,
    name: req.body.name,
    status: 'joined',
    statusDate: Date.now()
  }];

  for (var i = 1; i < num; i++) {
    players.push({
      id: pid + '-' + i,
      name: 'Open',
      status: 'Open',
      statusDate: Date.now()
    });
  }

  Game.create({
    room: room,
    status: 'waiting',
    playerCount: num,
    players: players
  }).then(function(game) {
    var data = game.toJSON();
    data.action = 'start';
    data.player = pid;

    res.send(data);
  }).catch(function(error) {
    console.log('There was an error creating a game')
    console.log(error)
  })
})

app.post('/join/:room', function(req, res) {
  var pid = (Math.random()*1e32).toString(36),
      player,
      pidx

  // First find the room and validate it exists. The returned game document
  // will not be modified. That will be done later using findOneAndUpdate()
  // I just want to be able to differentiate between error conditions -
  // room not found vs room full.
  Game.findByRoom(req.params.room, function(error, game) {
    if (error || !game) {
      res.send(400, { code: 'roomNotFound', message: 'Failed to find the expected game room' })
    } else {
      player = {
        id: pid,
        name: req.body.name,
        status: 'joined',
        statusDate: Date.now()
      };

      Game.findOneAndUpdate({
        '_id': game._id,
        'players.status': { $in: ['left', 'Open'] }
      }, {
        $set: { 'players.$': player }
      }, {
        new: true
      }, function(err, game) {
        var data;
        if (game) {
          data = game.toJSON()
          data.action = 'joined'
          data.player = pid

          res.send(data)
        } else {
          console.log('Find and Update Encountered and Error: ', err)
          res.send(400, {code: 'gameFull', message: 'All available player slots have been filled'})
        }
      })
    }
  })
})

// app.get('/:room_id', function(req, res, next) {
//   res.sendFile(__dirname + '/room.html')
// })

io.sockets.on('connection', function(client) {

  // Globals set in join that will be available to
  // the other handlers defined on this connection
  var _room,
      _id,
      _player

  client.on('join', function(data) {
    console.log('Someone has joined...', data)

    // Static helper to lookup a game based on the room
    Game.findByRoom( data.room, function(error, game) {
      var pcnt = 0,
          pidx

      if (game) {
        _id = game._id
        _room = game.room
        _player = data.player

        // Another helper to find player by ID in the
        // players array. They should already be there
        // since the API functions will have set it up.
        pidx = game.findPlayer(_player)

        if (pidx !== false) {

          // Join the room
          client.join(_room)

          // Now emit messages to everyone else in this room. If other
          // players in this game are connected, only those clients
          // will recieve the message
          io.sockets.in(_room).emit('joined')

          // Now, check if everyone is here
          game.players.forEach(function(player) {
            if (player.status == 'joined') {
              pcnt++
            }
          })

          // If so, update statuses, initialize
          // and notify everyone the game can begin
          if (pcnt == game.playerCount) {
            game.save(function( err, game ) {
              io.sockets.in(room).emit('ready')
            })
          }
        }
      }
    })
  })

  client.on('disconnect', function(data) {

    // Since we set the _id in the join event we can use it
    // here to lookup the game by it's ID
    Game.findById(_id, function(err, game) {
      if (game) {

        // Drop out of the game
        client.leave(_room)

        // Again multiple players may drop at the same time
        // so this needs to be atomic.
        Game.findOneAndUpdate({
          '_id': _id, 'players.id': _player
        }, {
          $set: { 'players.$.status' : 'left', 'players.$.statysDate': Date.now() }
        }, function() {
          io.sockets.in(_room).emit('left')
        })
      }
    })
  })
})

server.listen(4200, function() {
  console.log('server started on 4200')
})
