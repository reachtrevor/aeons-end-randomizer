var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)

var numUsers = 0

// Get's called with every new client connection
function handleIO(client) {
  console.log('Client connected')
  var addedUser = false

  // when the client emits 'new message', this broadcasts it to everyone else
  client.on('new message', function (data) {
    // we tell the client to execute 'new message'
    client.broadcast.emit('new message', {
      username: client.username,
      message: data
    })
  })

  // when the client emits 'add user',
  client.on('add user', function(username) {
    if (addedUser) return

    // we store the username in the socket session for this client
    client.username = username
    numUsers++
    addedUser = true
    client.emit('login', {
      numUsers: numUsers
    })

    // tell everyone (all clients) that someone new has connected
    client.broadcast.emit('user joined', {
      username: client.username,
      numUsers: numUsers
    })
  })

  // when the client emits 'typeing', we let everyone know who's typing
  client.on('typing', function() {
    client.broadcast.emit('typing', {
      username: client.username
    })
  })

  // when the client emits 'stop typing', we let everyone know
  client.on('stop typing', function() {
    client.broadcast.emit('stop typing', {
      username: client.username
    })
  })

  // when the user disconnects.. let people know and cleanup
  client.on('disconnect', function() {
    console.log('Client: ' + client.username + ' diconnected')
    if (addedUser) {
      --numUsers

      // let everyone know this client has left
      client.broadcast.emit('user left', {
        username: client.username,
        numUsers: numUsers
      })
    }
  })
}

// Allows serving of static files from public
app.use(express.static(__dirname + '/public'))

// Defines default view path
app.set('views', __dirname + '/views')
app.set('view engine', 'pug')

app.set('x-powered-by', false)

// Routes
app.get('/', function(req, res) {
  res.render('index')
})

io.on('connection', handleIO)

server.listen(4200, function() {
  console.log('server started on 4200')
})
