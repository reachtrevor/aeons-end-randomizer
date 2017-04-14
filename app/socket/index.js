// Rooms
var _rooms = {};

module.exports = function handleIO(client) {
  var io = this;
  console.log('Client Connected');

  // Listen for when someone creates a room
  client.on('create room', function createRoom(data) {
    var roomId = 'xwtyv';
    _rooms[roomId] = {
      players: [],
      slots: data.slots
    };
    client.emit('room created', roomId);
  });

  // Listen for when someone tries to joing the room
  client.on('join room', function joinRoom(data) {
    var roomId = data.id;
    var character = data.character;

    // Room doesn't exist
    if (!_rooms[roomId]) {
      client.emit('err', {
        code: '404',
        msg: 'There is no room by that the id: ' + roomId
      });
      return;
    }

    // User didn't pick a character
    if (!data.character) {
      client.emit('silent err', {
        code: '201',
        msg: 'No character specified when attempting to join room'
      });
      return;
    }

    var slots = _rooms[roomId].slots;
    var players = _rooms[roomId].players;

    // Room is full
    if (players.length >= slots) {
      client.emit('err', {
        code: 'full',
        msg: 'Room ' + roomId + ' is full',
      });
      return;
    }

    _rooms[roomId].players.push({
      character: data.character,
      player_number: players.length + 1
    });

    // Finally... join the room for real
    client.roomId = roomId;
    client.character = data.character;
    client.join(roomId, function() {
      var room = Object.assign({}, data, {
        players: players,
        slots: slots
      });

      // Notifiy those in the room that someone joined
      // io.to(roomId).emit('update room stats', room);
      io.to(roomId).emit('room joined', room);
    });
  });

  client.on('change player', function(data) {

    // Helps update the card selected for everyone
    client
      .to(client.roomId)
      .broadcast
      .emit('player turn', data.character);

    // Tell current player it's their turn
    // client.emit('attention', 'It\'s your turn');
  });

  client.on('disconnect', function() {
    if (client.roomId) {
      var room = _rooms[client.roomId];
      var players = room.players.slice();
      var playerIndex;

      // The player who left
      for (var i = 0; i <= players; i++) {
        if (players[i].name === client.character) playerIndex = i;
      }

      // Remove disconnecting player
      players.splice(playerIndex, 1);

      // Save copy of players back to the room
      _rooms[client.roomId].players = players;

      io.to(client.roomId)
        .emit('update room state', Object.assign({}, {
          players: room.players,
          slots: room.slots
        }));

      io.to(client.roomId)
        .emit('attention', client.character + ' has been disconnected');
    }
  });
}
