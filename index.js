const __MainDir = process.cwd()
const app = require('express')();
const http = require('http').createServer(app);
const child_process = require('child_process');
const config = require(__MainDir + '/config.json');
const Port = (new URL(config.MainHost)).port;

const Games = config.Games

StartProcess = (path, timeToRestart) => {

    child = child_process.fork(path);
    
    child.on('close', (code)=>{
        console.log(code);
        if (!(timeToRestart === undefined))
            setTimeout(() => StartProcess(child.spawnargs[1], timeToRestart), timeToRestart)
    })

}

Games.forEach(game => StartProcess(game.Path, 2000))

app.get('/', function(req, res){
    res.sendFile(__MainDir + '/View/home.html');
});

app.get('/home.js', function(req, res){
    res.sendFile(__MainDir + '/home.js');
});

app.get('/Info', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    let infos = []
    Games.forEach((x) => {
        let info = {}
        info.Name = x.Name
        info.Host = x.Host
        infos.push(info)
    })
    res.send(infos);
});

http.listen(Port, function(){
    console.log('Main port:', http.address().port);
});