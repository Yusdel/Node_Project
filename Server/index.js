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

    let player = new GameObject(500, 500, 18, 18, socket.id);
    if (PLAYERS[0] != undefined){
        player.position.x = 400;
        player.position.y = 500;
    }
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
    player.maxLength = 5;
    player.body = [];
    player.DestroyAll = function (){
        this.Destroy();
        this.body.forEach(element => {
            element.Destroy();
        });
    }
    player.die = function (){
        socket.emit('PlayerDead');
    }

    PLAYERS.push(player);
    player.socket = socket;

    socket.emit('PlayerPosition', player.position, player.body);
    
    socket.on('Movement', function(movement){

        if (!player.movement.flag)
            return;

        player.body.push(new GameObject(player.position.x, player.position.y, 20, 20));
        player.move(movement);
        if (player.body.length > player.maxLength)
            player.body.shift().Destroy();
        

    });

    socket.on('disconnect', () => {

        player.DestroyAll();
        PLAYERS.splice(PLAYERS.indexOf(player));

    });

    
});

setInterval(() => {
    let PlayerToRemove = [];

    PLAYERS.every((Player) => {
        let Objects = CollidableObjs.slice(0);
        Objects.splice(Objects.indexOf(Player), 1);
        
        Objects.every( (obj) => {
            if (Player.isCollided(obj)){
                PlayerToRemove.push(Player);
                return false;
            }
            return true;
        });
        return true
    });

    PlayerToRemove.forEach(Player => {
        Player.die();
        Player.DestroyAll();
        PLAYERS.splice(PLAYERS.indexOf(Player), 1);
    });

    PLAYERS.forEach(Player => {

        let OtherPlayers = PLAYERS.slice();
        let sendOtherPlayer = [];
        OtherPlayers.splice(OtherPlayers.indexOf(Player), 1);
        OtherPlayers.forEach(Other => {
            sendOtherPlayer.push({
                position : Other.position,
                body : Other.body
            })
        })
        
        Player.socket.emit('PlayerPosition', Player.position, Player.body);
        Player.socket.emit('OtherPlayers', sendOtherPlayer)
    });
}, 100);

http.listen(7777, function(){
    console.log('Server up on * :', http.address().port);
});