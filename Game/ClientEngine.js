
let GetParams = () => {
    let url_string = window.location.href;
    let url = new URL(url_string);
    return url.searchParams.get("room");
}

var socket = io('/'+GetParams())//{transports: ['websocket'], upgrade: false});
socket.on('Connesso', (x) => console.log('Connesso ' + x))
$(window).on("beforeunload", () => {
    socket.close();
})

const MapWidth = 1000;
const MapHeight = 500;
//TODO      Costruire contenitore di oggetti da disegnare in modo tale che si aggiorna solo la posizione e vengono disegnati in una volta sola

let GameObjectClient = function (x, y, width, height){

    this.Position = {x : x, y : y};
    this.Width = width;
    this.Height = height;
    this.Color = 'rgb(0, 0, 0)'
    this.ObjConnectedToDraw = [];

    this.Draw = function () {
        let ctx = $('#GameCanvas')[0].getContext('2d');
        this.ObjConnectedToDraw.forEach(element => {
            element.Draw();
        });
        ctx.fillStyle = this.Color;
        ctx.fillRect(this.Position.x, MapHeight - this.Position.y, this.Width, 0-this.Height);
    }

    this.RefreshObjPos = function(newObjPos, newObjsPosConnected, otherObjsColor) {     // Position, []Position
        this.Position = newObjPos;

        if (!newObjsPosConnected) return;

        let newObjsCount = newObjsPosConnected.length - this.ObjConnectedToDraw.length;
        
        if (newObjsCount < 0)
            this.ObjConnectedToDraw.splice(0, -newObjsCount)

        for (let i = 0; i < newObjsCount; i++){
            let objConnected = new GameObjectClient(0, 0, 20, 20);
            objConnected.Color = otherObjsColor;
            this.ObjConnectedToDraw.push(objConnected);
        }

        for (let i = 0; i < newObjsPosConnected.length; i++){
            this.ObjConnectedToDraw[i].Position = newObjsPosConnected[i]
        }
    }

}

function ClearAll(){
    let gameCanvas = $('#GameCanvas')[0];
    let ctx = gameCanvas.getContext('2d');
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}


$(document).ready(() => {
    
    let Player_ = new GameObjectClient(0, 0, 20, 20);
    let Enemies_ = [];
    let Apple_ = new GameObjectClient(0,0,20,20);
    let PowerUp_ = new GameObjectClient(0,0,20,20);
    PowerUp_.Color = 'rgb(222, 215, 22)';
    Apple_.Color = 'rgb(250, 11, 2)';
    Player_.Color = 'rgb(116, 52, 235)';

    setInterval(() => {
        ClearAll();
        if (!Player_.Dead) Player_.Draw();
        Apple_.Draw();
        if (PowerUp_.Position) PowerUp_.Draw();
        Enemies_.forEach(enemy => enemy.Draw());
    }, 10)

    socket.on('PlayerPosition', (serverPos, serverBodyPos) => {

        Player_.RefreshObjPos(serverPos, serverBodyPos, 'rgba(116, 52, 235, 0.7)');
    
    })

    socket.on('OtherPlayers', (OtherPlayers) => {

        let newEnemiesCount = OtherPlayers.length - Enemies_.length;
        if (newEnemiesCount < 0)
            Enemies_.splice(0, -newEnemiesCount)
        for (let i = 0; i < newEnemiesCount; i++){
            let enemy = new GameObjectClient(0, 0, 20, 20);
            enemy.Color = 'rgb(23, 31, 189)';
            Enemies_.push(enemy);
        }
        for (let i = 0; i < Enemies_.length; i++){
            Enemies_[i].RefreshObjPos(OtherPlayers[i].Position, OtherPlayers[i].Body, 'rgba(23, 31, 189, 0.7)');
        }

    })

    socket.on('Apples', (apples) => {
        
        Apple_.RefreshObjPos(apples[0])

    })

    socket.on('PowerUps', (powerUp) => {
        
        PowerUp_.RefreshObjPos(powerUp[0])

    })

    const PowerUpActived = [];

    let startPowerUpBar = (type, duration) => {
        if (!PowerUpActived[type]){
            let timer = {};
            timer.TEMPO = Date.now();
            timer.progress = $('#'+type)[0].style
            timer.Interval = setInterval(() => {
                timer.c = 100 - 100/duration*(Date.now()-timer.TEMPO);
                timer.progress.width = ''+timer.c+'%'
                if (timer.c <= 0){
                    $('#'+type).closest('.progress').hide();
                    PowerUpActived[type] = undefined;
                    clearInterval(timer.Interval);
                }
            }, 40)
            PowerUpActived[type] = timer;
            return;
        }
        PowerUpActived[type].TEMPO = Date.now();
    }

    socket.on('PowerUpTaken', (type, duration) => {
        let html = $('#'+type)[0];
        if (html == undefined){
            $('.PowerUps').append(`
            <div class="progress mb-3">
                <div class="progress-bar progress-bar-striped progress-bar-animated" id="${type}" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">${type+'!'}</div>
            </div>
            `)
            startPowerUpBar(type, duration);
            return;
        }
        $('#'+type).closest('.progress').show();
        startPowerUpBar(type, duration);
    })

    socket.on('FullRoom', () => {
        alert('Stanza piena');
        window.location.replace("/");
    })

    socket.on('PlayerDead', () => {
        console.log('Morto')
        socket.emit('Restart');
    })
    
})



document.addEventListener('keydown', function(event) {
    let movement = '';
    switch (event.keyCode) {
        case 65: // A
            movement = 'left';
            break;
        case 87: // W
            movement = 'up';
            break;
        case 68: // D
            movement = 'right';
            break;
        case 83: // S
            movement = 'down';
            break;
        case 38:
            movement = 'up';
            break;
        case 39:
            movement = 'right';
            break;
        case 40:
            movement = 'down';
            break;
        case 37:
            movement = 'left';
            break;
    }

    socket.emit('Movement', movement);
    
});