const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const Game = require('./../Game/Engine')

const CollidableObjs = [];

const GameObject = function (x, y, width, height, id) {

    Game.GameObject.call(this, x, y, width, height);
    this.id = id;
    CollidableObjs.push(this);

    this.Destroy = function (){
        let index = CollidableObjs.indexOf(this);
        CollidableObjs.splice(index, 1);
    }

}

app.get('/', function(req, res){

    res.sendFile(process.cwd() + '/Client/GamePage.html');

});

app.get('/Game/ClientEngine.js', function(req, res){

    res.sendFile(process.cwd() + '/Game/ClientEngine.js');

});

app.get('/Game/Engine.js', function(req, res){

    res.sendFile(process.cwd() + '/Game/Engine.js');

});


const PLAYERS = [];

io.on('connection', function(socket){

    let player = new GameObject(500, 500, 20, 20, socket.id);
    player.movement = {
        flag : true,
        cooldown : 100,
        speed : 20
    };
    player.move = function (movement){

        switch(movement){
            case 'left':
                player.position.x -= player.movement.speed;
                break;
            case 'right':
                player.position.x += player.movement.speed;
                break;
            case 'up':
                player.position.y -= player.movement.speed;
                break;
            case 'down':
                player.position.y += player.movement.speed;
                break;
        }
        player.movement.flag = false;
        setTimeout(()=>{ player.movement.flag = true }, player.movement.cooldown);

    }
    player.maxLength = 3;
    player.body = [];

    PLAYERS.push(player);

    io.emit('PlayerPosition', player.position, player.body);
    
    socket.on('Movement', function(movement){

        if (!player.movement.flag)
            return;

        player.body.push(new GameObject(player.position.x, player.position.y, 20, 20));
        player.move(movement);
        if (player.body.length > player.maxLength)
            player.body.shift().Destroy();
        
        io.emit('PlayerPosition', player.position, player.body);

    });

    setInterval(() => {
        PLAYERS.forEach(Player => {
            let Objects = CollidableObjs.slice(0);
            Objects.splice(Objects.indexOf(Player), 1);
            Objects.forEach(obj => {
                if (Player.isCollided(obj))
                    console.log('Colliso');
            });
        });
    }, 1000);
    
});



http.listen(7777, function(){
    console.log('Server up on * :', http.address().port);
});