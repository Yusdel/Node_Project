var socket = io();

let GameObjectClient = function (x, y, width, height){

    GameObject.call(this, x, y, width, height);
    this.color = 'rgb(0, 0, 0)'

    this.draw = function () {
        let ctx = $('#GameCanvas')[0].getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

}

function clearAll(){
    let gameCanvas = $('#GameCanvas')[0];
    let ctx = gameCanvas.getContext('2d');
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

$(document).ready(() => {
    
    let Player_ = new GameObjectClient(0, 0, 20, 20);
    Player_.color = 'rgb(116, 52, 235)';
    Player_.dead = false;
    console.log(Player_);

    socket.on('PlayerPosition', (ServerPos, ServerBody) => {

        console.log(ServerPos, ServerBody)
        clearAll();
    
        if (Player_.dead)
            return;

        Player_.position = ServerPos;
        Player_.draw();

        if (ServerBody == undefined)
            return;

        ServerBody.forEach(element => {
            let Body = new GameObjectClient(element.position.x, element.position.y, 20, 20);
            Body.color = 'rgba(116, 52, 235, 0.7)';
            Body.draw();
        });
    
    })

    socket.on('OtherPlayers', (OtherPlayers) => {
        OtherPlayers.forEach(element => {
            let other = new GameObjectClient(element.position.x, element.position.y, 20, 20);
            other.color = 'rgb(23, 31, 189)';
            other.draw();
            element.body.forEach(BodyPos => {
                let Body = new GameObjectClient(BodyPos.position.x, BodyPos.position.y, 20, 20);
                Body.color = 'rgba(23, 31, 189, 0.7)';
                Body.draw();
            });
        });
    })

    socket.on('PlayerDead', () => {
        Player_.dead = true;
    })
    
})



document.addEventListener('keydown', function(event) {
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