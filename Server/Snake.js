const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Snake = require('./../Game/ServerEngine');

const roomNumber = 5;
const Rooms = [];

for (let i = roomNumber; i > 0; i--)
    Rooms.push(new Snake.Engine(io.of('/Room-'+i)));

app.get('/', function(req, res){
    res.sendFile(process.cwd() + '/Client/GamePage.html');
});

app.get('/Game/ClientEngine.js', function(req, res){
    res.sendFile(process.cwd() + '/Game/ClientEngine.js');
});

app.get('/Info/Rooms', function(req, res){
    let rooms = Object.keys(io.nsps);
    rooms.shift(1);
    rooms.forEach((x, i, arr) => {arr[i] = x.replace('/', '')})
    res.send(rooms);
})

console.log(Rooms)

http.listen(7777, function(){
    console.log('Server up on * :', http.address().port);
});
