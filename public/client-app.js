(function($) {
  // Globals
  var socket = io();
  var _room;

  var characterData = [{
    label: 'Adelheim',
    value: 'Adelheim'
  }, {
    label: 'Brama',
    value: 'Brama'
  }, {
    label: 'Jian',
    value: 'Jian'
  }, {
    label: 'Kadir',
    value: 'Kadir'
  }, {
    label: 'Lash',
    value: 'Lash'
  }, {
    label: 'Malastar',
    value: 'Malastar'
  }, {
    label: 'Mist',
    value: 'Mist'
  }, {
    label: 'Nym',
    value: 'Nym'
  }, {
    label: 'Phaedraxa',
    value: 'Phaedraxa'
  }, {
    label: 'Reeve',
    value: 'Reeve'
  }, {
    label: 'Xaxos',
    value: 'Xaxos'
  }, {
    label: 'Z’hana',
    value: 'Z’hana'
  }];

  // Global Toast Components
  Vue.component('toast', {
    data: function() {
      return {
        notificationType: this.type || 'error'
      };
    },

    beforeUpdate: function() {
      var self = this;
      if (this.show) {
        setTimeout(function() {
          self.$emit('expire-toast');
        }, 4000);
      }
    },

    computed: {
      classes: function() {
        return {
          'is-showing': this.show,
          'notification--error': this.notificationType === 'error',
          'notification--info': this.notificationType === 'info',
        }
      }
    },

    props: ['show', 'type'],
    template: '<aside class="notification" :class="classes"><slot></slot></aside>'
  });

  // Root Instance
  var app = new Vue({
    el: '#app',

    data: function() {
      return {
        characters: characterData,
        character: '',
        currentScreen: 'play-mode',
        players: [],
        room: {
          id: null,
          players: [],
          slots: null
        },
        slots: 3,
        toast: {
          type: 'error',
          show: false,
          message: 'An Error Occured...'
        },
      }
    },

    beforeMount: function() {
      var pathname = window.location.pathname;
      var hasRoomId = pathname.length > 1;

      if (hasRoomId) {
        this.room.id = pathname.substring(1);
        this.switchScreen('join-room');

        socket.emit('join room', { id: this.room.id });
      } else {
        this.currentScreen = 'play-mode';
      }
    },

    mounted: function() {
      var self = this;

      // When the room is created
      socket.on('room created', function(roomId) {
        self.room.id = roomId;

        socket.emit('join room', {
          character: self.character,
          id: roomId
        });
      });

      // When a room was joined
      socket.on('room joined', function(roomData) {
        // Update url
        window.history.replaceState({}, '', roomData.id);
        // Update state
        self.room = roomData;
        self.switchScreen('remote-play');
      });

      // When an error occurs
      socket.on('err', function(error) {
        if (error.code === 'full' || error.code === '404') {
          self.switchScreen('play-mode');
          window.history.replaceState({}, '', '/');
        }

        self.showNotification('error', error.msg);
      });

      socket.on('silent err', function(error) {
        if (error.code === '201') {
          self.switchScreen('join-room');
        }
      });
    },

    computed: {
      availableSlotsText: function() {
        var room = this.room;
        return (room.players.length) + ' of ' + room.slots + ' players';
      },

      currentCharactersText: function() {
        var room = this.room;
        return this.room.players.map(function(player) {
          return player.character;
        }).join(', ');
      }
    },

    methods: {
      handleCharacterChange: function(event) {
        this.character = event.target.value;
      },

      handleCreateRoom: function() {
        // Request a room be created
        socket.emit('create room', {
          character: this.character,
          slots: this.slots
        });
      },

      isShowing: function(screen) {
        return (screen === this.currentScreen) ? 'is-showing' : '';
      },

      switchScreen: function(screen) {
        this.currentScreen = screen;
      },

      increasePlayers: function() {
        if (this.slots < 4) {
          this.slots++;
        }
      },

      decreasePlayers: function() {
        if (this.slots !== 1) {
          this.slots--;
        }
      },

      hasRoomId: function() {
        var room = window.location.pathname;
        if (room.length > 1) {
          return this.roomIsAvailable(room);
        } else {
          return false;
        }
      },

      joinRoom: function() {
        socket.emit('join room', {
          character: this.character,
          id: this.room.id
        });
      },

      roomIsAvailable: function(room) {
        var App = this;
        socket.on('room available', function(isAvailable) {
          return isAvailable;
        });
        socket.emit('check for room', { room: room })
      },

      showNotification: function(type, message) {
        var toast = Object.assign({}, this.toast, {
          show: true,
          type: type,
          message: message
        });

        this.toast = toast;
      },

      startGame() {
        console.log(this.room.slots)
        console.log(this.room.players.length)
      },

      shufflePlayers() {
        var i = 0,
            j = 0,
            temp = null,
            players = this.room.players;

        for (i = players.length - 1; i > 0; i -= 1) {
          j = Math.floor(Math.random() * (i + 1));
          temp = players[i];
          players[i] = players[j];
          players[j] = temp;
        }

        return players;
      },

      removeNotification: function() {
        var toast = Object.assign({}, this.toast, {
          show: false
        });

        this.toast = toast;
      }
    },

  });

})(jQuery);