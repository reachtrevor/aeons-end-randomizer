(function($) {
  // Globals
  var socket = io();
  var $window = $(window);
  var $document = $(document);
  var pathname = window.location.pathname;
  var has_room_id = pathname.length > 1;
  var _room;

  var characterData = [{
    label: 'Liza',
    value: 'liza'
  }, {
    label: 'Mineth',
    value: 'mineth'
  }, {
    label: 'Norma',
    value: 'norma'
  }];

  // Page variables
  var $login = $('.login');
  var $room = $('.room');
  var $join_room = $('.join-room');
  var $infobox = $('.info-box');
  var $notify_box = $('#notify');

  // Buttons
  $create_button = $('#create-button');

  // Inputs
  $character_select = $('[name="character"]');
  $join_character_select = $('[name="join-character"]');
  $player_slots = $('[name="slots"]');

  // If the user tried to go directly to the room
  if (has_room_id) {
    _room = pathname.substring(1);

    // Fade in the join room form
    setTimeout(function() { $join_room.addClass('is-showing') }, 300);
  } else {
    setTimeout(function() { $login.addClass('is-showing') }, 300);
  }

  // Create a joinable room on click
  $create_button.on('click', function() {
    // Send all user input to the backend
    socket.emit('create room', {
      slots: 3
    });
  });

  // Join Room Character Select Picker
  $join_character_select.on('change', function(e) {
    // var value = $(this).value();

    // Attempt to join the room
    socket.emit('join room', {
      character: 'mithra',
      room: _room
    });
  })

  // Socket io Events
  socket.on('room created', function(data) {

    // Switch to room view
    $login.removeClass('is-showing');
    $room.addClass('is-joining');

    // Notify the user they successfully joined the room
    socket.emit('join room', {
      character: 'liza',
      room: data.room
    });
  });

  socket.on('room joined', function(data) {
    window.history.replaceState({}, '', 'xwtyv')

    // Show correct state
    $('.is-joining, .is-showing').removeClass('is-joining, .is-showing');
    $room.addClass('is-showing')
  });

  socket.on('update room stats', function(data) {
    $infobox.text('room: ' + data.room + ', as ' + data.character + ', ' + (data.slots - data.players.length) + ' slots of ' + data.slots + ' remaining');
  });

  socket.on('err', function(data) {
    $notify_box.addClass('is-showing notification--error');
    $notify_box.text(data);

    setTimeout(function() {
      $notify_box.removeClass('is-showing');
    }, 4000);
  });

  socket.on('attention', function(data) {
    $notify_box.addClass('is-showing notification--error');
    $notify_box.text(data);

    setTimeout(function() {
      $notify_box.removeClass('is-showing');
    }, 4000);
  })


  Vue.component('toast', {
    template: '<aside :class="toastClass">{{toastMessage}}</aside>',
  })

  // Vue.component('html-select', {
  //   props: ['list'],

  //   data: function() {
  //     return {
  //       current: ''
  //     };
  //   },

  //   methods: {
  //     handleChange: function(event) {
  //       this.current = event.target.value;
  //     }
  //   },

  //   template: (
  //     '<select @change="handleChange">'+
  //       '<option v-for="item in list" :value="item.value">{{item.label}}</option>'+
  //     '</select>'
  //   )
  // });

  var app = new Vue({
    el: '#app',

    data: {
      characters: characterData,
      character: '',
      slots: 3,
      currentScreen: 'create'
    },

    methods: {
      handleCharacterChange(event) {
        this.character = event.target.value;
      },
      handleCreateRoom() {
        socket.emit('create room', {
          character: this.character,
          slots: this.slots
        });
      }
    }
  });

})(jQuery);