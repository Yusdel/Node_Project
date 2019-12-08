const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Snake = require('./../Game/ServerEngine');

Snake.Engine(io.of('/Room-1'));
Snake.Engine(io.of('/Room-2'));
Snake.Engine(io.of('/Room-3'));
Snake.Engine(io.of('/Room-4'));
Snake.Engine(io.of('/Room-5'));

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
