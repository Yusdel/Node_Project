const __MainDir = process.cwd()
const fs = require('fs')
const app = require('express')();
const httpReq = require('http')
const http = httpReq.createServer(app);
const io = require('socket.io')(http);
const Snake = require(__MainDir + '/Snake/Game/ServerEngine');
const config = require(__MainDir + '/config.json');

const GameConf = config.Games.find(x => x.Name == "Snake_Online");
const GamePort = (new URL(GameConf.Host)).port;
const Rooms = GameConf.Rooms;

try {
    require(process.cwd() + '/Snake/Scores.json')
} catch (error) {
    fs.writeFileSync(process.cwd() + '/Snake/Scores.json', JSON.stringify([]) , 'utf-8');
}

Rooms.forEach(x => x.Engine = new Snake.Engine(io.of(x.Name), x.MaxPlayers, GameConf.Config));

app.get('/', function(req, res){
    if (!req.query.nickname || !req.query.password || !req.query.home){
        res.redirect(config.MainHost)
        return;
    }
    httpReq.get(`${req.query.home}/Login/${req.query.nickname}/${req.query.password}`, x => {
        if (x.statusCode == 200){
            res.sendFile(__MainDir + '/Snake/Client/GamePage.html');
            return;
        }
        res.redirect(req.query.home);
    })
});

app.get('/Hub', function(req, res){
    res.redirect(config.MainHost)
});

app.get('/Game/ClientEngine.js', function(req, res){
    res.sendFile(__MainDir + '/Snake/Game/ClientEngine.js');
});

app.get('/Info/Scores', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    let score = require(__MainDir + '/Snake/Scores.json')
    res.send(score);
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
