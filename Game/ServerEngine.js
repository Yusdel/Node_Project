
const __OBJECTS = [];
const __SolidObjects = [];
const __ServerTick = 2;

const GameObject = function (x, y, width, height, solid) {

    __OBJECTS.push(this);

    this.Position = {x : x, y : y};
    this.Width = width;
    this.Height = height;
    this.Solid = solid;
    this.Arrays = [__OBJECTS];   //list of all array that remove obj from

    if (this.Solid){
        __SolidObjects.push(this)
        this.Arrays.push(__SolidObjects);
    }

    this.IsCollided = function (GameObject) {
        if (this.Position.x < GameObject.Position.x + GameObject.Width  && 
            this.Position.x + this.Width  > GameObject.Position.x &&
            this.Position.y < GameObject.Position.y + GameObject.Height && 
            this.Position.y + this.Height > GameObject.Position.y ){
            return true;
        }
        return false;
    }

    this.Collide = function(){
        let other = __SolidObjects.slice();
        other.splice(other.indexOf(this), 1);
        return !other.every( obj => {
            if (this.IsCollided(obj)){
                this.ObjCollided = obj;
                return false;
            }
            return true;
        })
    }

    this.Destroy = function (){
        this.Arrays.forEach(array => {
            let index = array.indexOf(this);
            if (index > -1)
                array.splice(index, 1);
        });
    }

}

// Region -   -   -   -   -   -   -   -

const Players = [];
const Apples = [];

let Wall = new GameObject(-2, 0, 1, 1000, true)
Wall.Name = 'left'
Wall = new GameObject(1001, 0, 1, 1000, true)
Wall.Name = 'right'
Wall = new GameObject(0, -2, 1000, 1, true)
Wall.Name = 'Down'
Wall = new GameObject(0, 1001, 1000, 1, true)
Wall.Name = 'up'

const PlayerObject = function (x, y, width, height){

    GameObject.call(this, x, y, width, height, true);
    Players.push(this);
    this.Arrays.push(Players);

    this.Movement = {
        Can : true,
        Type: undefined,
        Cooldown : 75,
        Speed : 20          //pixel per tick
    }
    this.Move = function(movement){
        switch(movement){
            case 'left':
                this.Position.x -= this.Movement.Speed;
                break;
            case 'right':
                this.Position.x += this.Movement.Speed;
                break;
            case 'up':
                this.Position.y += this.Movement.Speed;
                break;
            case 'down':
                this.Position.y -= this.Movement.Speed;
                break;
        }
        this.Movement.Can = false;
        setTimeout(()=>{ this.Movement.Can = true }, this.Movement.Cooldown);
    }

    this.Body = [];
    this.MaxLength = 3;
    this.AddBody = function (position){
        let body = new GameObject(position.x, position.y, 20, 20, true);
        this.Body.push(body);
        if (this.Body.length > this.MaxLength){
            this.Body.shift().Destroy();
        }
    }
    this.Dead = false;

    this.Die = function(){
        this.Body.forEach(element => {
            element.Destroy();
        });
        __SolidObjects.splice(__SolidObjects.indexOf(this), 1)
        this.Dead = true;
    }

    this.DestroyAll = function(){
        this.Body.forEach(element => {
            element.Destroy();
        });
        this.Destroy();
    }

}

let GenerateApple = function (){
    let x = Math.floor(Math.random() * 50);
    let y = Math.floor(Math.random() * 50);
    let apple = new GameObject(x*20, y*20, 20,20, true);
    Apples.push(apple);
    apple.Arrays.push(Apples);
    apple.Name = 'Apple';
}

GenerateApple();

// End  -   -   -   -   -   -   -   -

module.exports.Engine = Engine = function (io){

    io.on('connection', function(socket){

        // Region -   -   -   -   -   -   -   -
        
        let player = new PlayerObject (0, 0, 20, 20);
        player.SendDead = () => socket.emit('PlayerDead');
        player.SendPosition = () => {
            if (player != undefined && !player.Dead){
                let body = [];
                player.Body.forEach(element => {
                    body.push(element.Position)
                });
                socket.emit('PlayerPosition', player.Position, body);
            }
        }
        player.SendOtherPlayers = () => {
            let otherPlayers = Players.slice();
            let sendOtherPlayer = [];
            if (player != undefined)
                otherPlayers.splice(otherPlayers.indexOf(player), 1);
            otherPlayers.every(other => {
                if (other.Dead)
                    return true
                let body = [];
                other.Body.forEach(element => {
                    body.push(element.Position)
                });
                sendOtherPlayer.push({
                    Position : other.Position,
                    Body : body
                });
                return true
            });
            socket.emit('OtherPlayers', sendOtherPlayer);
        }
        player.SendApples = () => {
            let apples = []
            Apples.forEach(apple => apples.push(apple.Position));
            socket.emit('Apples', apples);
        }

        socket.on('Movement', function(movement){
            player.Movement.Type = movement;
            if (!player.Movement.Can)
                return;
        });

        // End  -   -   -   -   -   -   -   -

        socket.on('disconnect', () => {

        // Region -   -   -   -   -   -   -   -

        player.DestroyAll();

        // End -   -   -   -   -   -   -   -

        });

    });

}

// TODO     Risolvere problemi con refresh pagina che disconnette tipo tutti
const Cicle = setInterval(() => {

    // Region -   -   -   -   -   -   -   -

    let DeadPlayer = []                 // On collide controll first he see who die and the kill
    Players.every( player => {

        player.SendPosition();
        player.SendOtherPlayers();
        player.SendApples();

        if (player.Dead)
            return true;

        if(player.Movement.Can && player.Movement.Type != undefined && !player.Dead){
            player.AddBody(player.Position);
            player.Move(player.Movement.Type);
        }
        
        if (player.Collide()){
            if(player.ObjCollided.Name == 'Apple'){
                player.ObjCollided.Destroy();
                GenerateApple();
                player.MaxLength++;
                return true;
            }
            DeadPlayer.push(player);
            return true;
        }
        return true;
    })
    DeadPlayer.forEach(player => {player.Die(); player.SendDead(); });

    // End -   -   -   -   -   -   -   -

}, __ServerTick);

const DESTROY_ALL_OBJECT = function(){
    __OBJECTS.forEach(obj => {
        obj.Destroy();
    });
}
