// Rooms
var _rooms = {};

module.exports = function handleIO(client) {
  var io = this;
  console.log('Client Connected')

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
    client.join(roomId, function() {

      // Notifiy those in the room that someone joined
      io.to(roomId).emit('room joined', Object.assign({}, data, {
        players: players,
        slots: slots
      }));
    });
  });

  client.on('player turn', function(data) {
    // data will contain { character: matt }
    // tell everyone including matt that it's his turn
    // tell matt specifically that it's his turn with an extra notification
  });

  client.on('disconnect', function() {
    // remove player from room by character name
    // emit that this player has disconnected
  });
}
