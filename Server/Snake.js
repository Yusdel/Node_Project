const __MainDir = process.cwd()
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Snake = require('./../Game/ServerEngine');
const config = require(__MainDir + '/config.json');

const GameConf = config.Games.find(x => x.Name == "Snake");
const GamePort = (new URL(GameConf.Host)).port;
const Rooms = GameConf.Rooms;

Rooms.forEach(x => x.Engine = new Snake.Engine(io.of(x.Name), x.MaxPlayers, GameConf.Config));

app.get('/', function(req, res){
    res.sendFile(__MainDir + '/Client/GamePage.html');
});

app.get('/Hub', function(req, res){
    res.redirect(config.MainHost)
});

app.get('/Game/ClientEngine.js', function(req, res){
    res.sendFile(__MainDir + '/Game/ClientEngine.js');
});

app.get('/Info/Rooms', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    let roomInfos = []
    Rooms.forEach((x) => {
        let roomInfo = {}
        roomInfo.Name = x.Name.replace('/', '');
        roomInfo.Player = x.Engine.PlayerNumber();
        roomInfo.MaxPlayers = x.MaxPlayers;
        roomInfos.push(roomInfo)
    })
    roomInfos.sort((a, b) => {
        if (a.Name > b.Name) return 1;
        if (a.Name < b.Name) return -1;
        return 0;
    })
    res.send(roomInfos);
})

app.get('/Info/Config', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    let config = {}
    config.MapWidth = GameConf.Config.MapWidth;
    config.MapHeight = GameConf.Config.MapHeight;
    config.Scale = GameConf.Config.Scale;
    res.send(config);
})



http.listen(GamePort, function(){
    console.log('Snake port:', http.address().port);
});
