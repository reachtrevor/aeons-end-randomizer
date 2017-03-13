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

// Get's called with every new client connection
function handleIO(socket) {
  console.log('Client connected')

  function disconnect() {
    console.log('Client disconnected')
  }

  socket.on('disconnect', disconnect)

  socket.on('submit', function(data) {
    socket.broadcast.emit('message', data)
  })

  socket.on('move', function(data) {
    socket.broadcast.emit('move', data)
  })

}

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

io.on('connection', handleIO)

server.listen(4200, function() {
  console.log('server started on 4200')
})
