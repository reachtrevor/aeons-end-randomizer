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
    client.emit('room created', { room: roomId });
  });

  client.on('join room', function joinRoom(data) {
    var roomId = data.room;

    if (!_rooms[roomId]) {
      client.emit('err', 'room ' + roomId + ' does not exist');
      return;
    }

    var slots = _rooms[roomId].slots;
    var players = _rooms[roomId].players;

    // Are there available slots
    if (players.length < slots) {
      _rooms[roomId].players.push({
        name: data.character,
        player_number: players.length + 1
      });
    } else {
      client.emit('err', 'sorry, room is full');
      return;
    }

    // Finally... join the room for real
    client.roomId = roomId;
    client.join(roomId, function() {
      var room = Object.assign({}, data, {
        players: players,
        slots: slots
      });

      // Notifiy those in the room that someone joined
      io.to(roomId).emit('update room stats', room);
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
    client.emit('attention', 'It\'s your turn');
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
