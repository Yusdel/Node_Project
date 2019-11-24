var socket = io()//{transports: ['websocket'], upgrade: false});

$(window).on("beforeunload", () => {
    socket.close();
})

//TODO      Costruire contenitore di oggetti da disegnare in modo tale che si aggiorna solo la posizione e vengono disegnati in una volta sola

let GameObjectClient = function (x, y, width, height){

    this.Position = {x : x, y : y};
    this.Width = width;
    this.Height = height;
    this.Color = 'rgb(0, 0, 0)'

    this.Draw = function () {
        let ctx = $('#GameCanvas')[0].getContext('2d');
        ctx.fillStyle = this.Color;
        ctx.fillRect(this.Position.x, 1000 - this.Position.y, this.Width, 0-this.Height);
    }

}

function ClearAll(){
    let gameCanvas = $('#GameCanvas')[0];
    let ctx = gameCanvas.getContext('2d');
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

$(document).ready(() => {
    
    let Player_ = new GameObjectClient(0, 0, 20, 20);
    Player_.Color = 'rgb(116, 52, 235)';

    socket.on('PlayerPosition', (serverPos, serverBodyPos) => {

        ClearAll();

        Player_.Position = serverPos;
        Player_.Draw();

        serverBodyPos.forEach(element => {
            let Body = new GameObjectClient(element.x, element.y, 20, 20);
            Body.Color = 'rgba(116, 52, 235, 0.7)';
            Body.Draw();
        });
    
    })

    socket.on('OtherPlayers', (OtherPlayers) => {
        OtherPlayers.forEach(element => {
            let other = new GameObjectClient(element.Position.x, element.Position.y, 20, 20);
            other.Color = 'rgb(23, 31, 189)';
            other.Draw();
            element.Body.forEach(BodyPos => {
                let Body = new GameObjectClient(BodyPos.Position.x, BodyPos.Position.y, 20, 20);
                Body.Color = 'rgba(23, 31, 189, 0.7)';
                Body.Draw();
            });
        });
    })

    socket.on('Apples', (apples) => {
        apples.forEach(element => {
            let apple = new GameObjectClient(element.x, element.y, 20, 20);
            apple.Color = 'rgb(250, 11, 2)'
            apple.Draw();
        })
    })

    socket.on('PlayerDead', () => {
        console.log('Morto')
        ClearAll();
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
    }

    socket.emit('Movement', movement);
    
});