const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Snake = require('./../Game/ServerEngine');

Snake.Engine(io);

app.get('/', function(req, res){
    res.sendFile(process.cwd() + '/Client/GamePage.html');
});

app.get('/Game/ClientEngine.js', function(req, res){
    res.sendFile(process.cwd() + '/Game/ClientEngine.js');
});

app.get('/Game/Engine.js', function(req, res){
    res.sendFile(process.cwd() + '/Game/Engine.js');
});



http.listen(7777, function(){
    console.log('Server up on * :', http.address().port);
});
