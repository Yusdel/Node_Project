module.exports = function(io){
    const __OBJECTS = [];
    const __SolidObjects = [];
    const __ServerTick = 100;

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
                if (this.IsCollided(obj))
                    return false;
                return true;
            })
        }

        this.Destroy = function (){
            this.Arrays.forEach(array => {
                let index = array.indexOf(this);
                array.splice(index, 1);
            });
        }

    }

    // Rgion -   -   -   -   -   -   -   -

    const Sockets = [];
    const Players = [];
    const PlayerObject = function (x, y, width, height){

        GameObject.call(this, x, y, width, height, true);
        Players.push(this);
        this.Arrays.push(Players);

        this.Movement = {
            Can : true,
            Cooldown : 100,
            Speed : 20
        }
        this.Move = function(movement){
            switch(movement){
                case 'left':
                    this.Position.x -= this.Movement.speed;
                    break;
                case 'right':
                    this.Position.x += this.Movement.speed;
                    break;
                case 'up':
                    this.Position.y -= this.Movement.speed;
                    break;
                case 'down':
                    this.Position.y += this.Movement.speed;
                    break;
            }
            this.Movement.Can = false;
            setTimeout(()=>{ this.Movement.Can = true }, this.Movement.Cooldown);
        }

        this.Body = [];
        this.MaxLength = 3;
        this.AddBody = function (position){
            let body = new GameObject(position.x, position.y, 20, 20, true);
            body.Arrays.push(this.Body);
            this.Body.push(body);
            if (this.Body.length > this.MaxLength){
                this.Body[0].Destroy();
            }
        }

        this.Die = function(){
            this.Body.forEach(element => {
                element.Destroy();
            });
            this.Destroy();
            socket.emit('PlayerDead');
        }

    }

    // End  -   -   -   -   -   -   -   -

    const Engine = function (io){
        
        io.on('connection', function(socket){

            // Region -   -   -   -   -   -   -   -

            let player = new PlayerObject (0, 0, 20, 20);
            socket.Player = player;
            Sockets.push(socket);

            socket.on('Movement', function(movement){
                if (!player.Movement.Can)
                    return;
                player.AddBody(player.position.x, player.position.y, 20, 20);
                player.Move(movement);
            });

            // End  -   -   -   -   -   -   -   -

            socket.on('disconnect', () => {
        
            // Region -   -   -   -   -   -   -   -

            socket.Player.Die();
            
            // End -   -   -   -   -   -   -   -

            });

        });

    }

    const Cicle = setInterval(() => {
        
        // Region -   -   -   -   -   -   -   -
        
        Players.every( player => {
            if (player.Collide())
                player.Die();
        })

        Sockets.forEach(socket => {
            if (socket.Player != undefined)
                socket.emit('PlayerPosition', socket.Player.Position, socket.Player.Body);
            
            let otherPlayers = Players.slice();
            let sendOtherPlayer = [];
            otherPlayers.splice(otherPlayers.indexOf(socket.Player), 1);
            otherPlayers.forEach(other => {
                sendOtherPlayer.push({
                    Position : other.Position,
                    Body : other.Body
                });
            });
            socket.emit('OtherPlayers', sendOtherPlayer);
        });

        // End -   -   -   -   -   -   -   -
        
    }, __ServerTick);

    const DESTROY_ALL_OBJECT = function(){
        __OBJECTS.forEach(obj => {
            obj.Destroy();
        });
    }
}