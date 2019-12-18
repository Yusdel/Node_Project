const __MainDir = process.cwd()
const app = require('express')();
const http = require('http').createServer(app);
const child_process = require('child_process');
const config = require(__MainDir + '/config.json');
const Port = (new URL(config.MainHost)).port;
const crypto = require('crypto');
const fs = require('fs');

const Games = config.Games

StartProcess = (path, timeToRestart) => {

    child = child_process.fork(path);
    
    child.on('close', (code)=>{
        console.log(code);
        if (!(timeToRestart === undefined))
            setTimeout(() => StartProcess(child.spawnargs[1], timeToRestart), timeToRestart)
    })

}

const secret = 'piero va al mercato';
HashCode = function(password){
    const hash = crypto.createHmac('sha256', secret)
        .update(password)
        .digest('hex');
                  
    return hash;
}

InsertUser = (username, password) => {
    const Users = require(__MainDir + '/users.json');
    Users.push({
        Name: username, 
        Password: HashCode(password)
    })
    fs.writeFileSync(process.cwd() + '/users.json', JSON.stringify(Users) , 'utf-8');
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

    let dati = [];
    for (i in config.Games) {
        dati.push({Name: config.Games[i].Name ,Host: config.Games[i].Host}) 
    }
         
    res.send(dati);
});

app.get('/Login/:user/:password', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const Users = require(__MainDir + '/users.json');
    let find = Users.find(x => x.Name == req.params.user);
    if (!find){
        if(config.Enable_Auto_Registration){
            InsertUser(req.params.user, req.params.password);
            res.sendStatus(200);
            return;
        }
        res.sendStatus(401)
        return
    }
    if (find.Password != HashCode(req.params.password)){
        res.sendStatus(401)
        return
    }
    res.sendStatus(200);
});


http.listen(Port, function(){
    console.log('Main port:', http.address().port);
});