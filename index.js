var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var handleIO = require('./app/socket')

var numUsers = 0

// Allows serving of static files from public
app.use(express.static(__dirname + '/public'))

// Defines default view path
app.set('views', __dirname + '/views')
app.set('view engine', 'pug')
app.set('x-powered-by', false)

// Routes
require('./app/routes/gets')(app)
require('./app/routes/posts')(app)

io.on('connection', handleIO)

server.listen(process.env.PORT || 4200, function() {
  console.log('server started on 4200')
})
