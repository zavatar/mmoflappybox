$(document).ready(function() {

    var initWin = {w:800, h:490};
    var initPos = {x:100, y:245};
    var initAnchor = {x:-0.2, y:0.5};
    var players = {};
    var game = new Phaser.Game(initWin.w, initWin.h, Phaser.AUTO, 'flappy');

    var Makebird = function() {
        var bird = game.add.sprite(initPos.x, initPos.y, 'bird');
        bird.body.gravity.y = 0;
        bird.anchor.setTo(initAnchor.x, initAnchor.y);
        return bird;
    };

    var main_state = {

        preload: function() {
            game.stage.backgroundColor = '#f0f0f0';
            game.stage.disableVisibilityChange = true;
            game.load.image('bird', '/static/bird.png');
            game.load.image('pipe', '/static/pipe.png');

            // Load jump sound
            game.load.audio('jump', '/static/jump.wav');
        },

        create: function() {
            game.stage.scale.startFullScreen();
            var up_key = game.input.keyboard.addKey(Phaser.Keyboard.UP);
            up_key.onDown.add(this.start, this);
            game.input.onDown.add(this.start, this);

            this.pipes = game.add.group();
            this.pipes.createMultiple(20, 'pipe');

            this.bird = Makebird();

            this.score = 0;
            var style = { font: "30px Arial", fill: "0" };
            this.label_score = game.add.text(20, 20, "0", style);

            var guide = { font: "30px Arial", fill: "0" };
            this.label_guide = game.add.text(100, 300, "Press UP Key", style);

            // Add sounds to the game
            this.jump_sound = game.add.audio('jump');
            this.hit_sound = game.add.audio('hit');
        },

        update: function() {
            if (this.bird.inWorld == false)
                this.restart_game();

            // Make the bird slowly rotate downward
            if (this.bird.angle < 20)
                this.bird.angle += 1;

            if (this.bird.body.y != this.bird.body.preY) {
                socket.emit('update', {
                    posY: this.bird.body.y,
                    angle: this.bird.angle
                });
            }

            game.physics.overlap(this.bird, this.pipes, this.hit_pipe, null, this);
        },

        start: function(e) {
            if (e.x < 0 || e.x > game.width || e.y < 0 || e.y > game.height)
                return;

            var up_key = game.input.keyboard.addKey(Phaser.Keyboard.UP);
            up_key.onDown.add(this.jump, this);
            game.input.onDown.remove(this.start, this);
            game.input.onDown.add(this.jump, this);

            this.bird.body.gravity.y = 1000;
            this.timer = game.time.events.loop(1500, this.add_row_of_pipes, this);
            this.label_guide.content = '';
            
            this.jump(e);
        },

        jump: function(e) {
            // if the bird hit a pipe, no jump
            if (this.bird.alive == false)
                return;

            this.bird.body.velocity.y = -350;

            // Animation to rotate the bird
            game.add.tween(this.bird).to({angle: -20}, 100).start();

            // Play a jump sound
            this.jump_sound.play();
        },

        // Dead animation when the bird hit a pipe
        hit_pipe: function() {
            // Set the alive flag to false
            this.bird.alive = false;

            // Prevent new pipes from apearing
            game.time.events.remove(this.timer);

            // Go trough all the pipes, and stop their movement
            this.pipes.forEachAlive(function(p){
                p.body.velocity.x = 0;
            }, this);
        },

        restart_game: function() {
            game.time.events.remove(this.timer);
            game.state.start('main');
        },

        add_one_pipe: function(x, y) {
            var pipe = this.pipes.getFirstDead();
            pipe.reset(x, y);
            pipe.body.velocity.x = -200;
            pipe.outOfBoundsKill = true;
        },

        add_row_of_pipes: function() {
            var hole = Math.floor(Math.random()*5)+1;

            for (var i = 0; i < 8; i++)
                if (i != hole && i != hole +1)
                    this.add_one_pipe(initWin.w, i*60+10);

            this.score += 1;
            this.label_score.content = this.score;
        },
    };

    var socket = io.connect('localhost');

    var name = $('body').data('name');
    console.log(name, 'connecting server');

    var Add = function(name) {
        players[name] = Makebird();
    };

    var Remove = function(name) {
        players[name].kill();
        delete players[name];
    };

    var Updates = function(name, data) {
        if (name in players) {
            players[name].angle = data.angle;
            players[name].y = data.posY;
        }
    };

    var joinedFun = function(thisname) {
        if (thisname != name) {
            Add(thisname);
            alertify.success(thisname + ' Joined!');
        }
    };

    socket.on('connect', function() {
        console.log('connected');
        socket.emit('join', {name: name});
    });

    socket.on('update', function(data) {
        if (data.name != name) {
            Updates(data.name, data.data);
        }
    });

    socket.on('assign', function(players) {
        players.forEach(joinedFun);
    });

    socket.on('leave', function(data) {
        if (data.name != name) {
            Remove(data.name);
            alertify.success(data.name + ' ran away!');
        }
    });

    socket.on('join', function(data) {
        joinedFun(data.name);
    });

    game.state.add('main', main_state);
    game.state.start('main');

});