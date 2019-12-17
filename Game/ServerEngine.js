const fs = require('fs')

module.exports.Engine = Engine = function (io, MaxPlayers, Config){

    const __OBJECTS = [];
    const __SolidObjects = [];
    const __ServerTick = Config.ServerTick;

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

    const MapWidth = Config.MapWidth;
    const MapHeight = Config.MapHeight;
    const Movements = ['up', 'right', 'down', 'left']
    const Players = [];
    const PlayersStartPos = [
        {x : 0, y : 0},
        {x : 0, y : MapHeight - Config.Scale},
        {x : MapWidth - Config.Scale, y : MapHeight - Config.Scale},
        {x : MapWidth - Config.Scale, y : 0},
    ];
    const Apples = [];
    const PowerUps = [];
    const Walls = [];

    let Wall = new GameObject(-2, 0, 1, MapHeight, true)
    Wall.Name = 'left'
    Wall = new GameObject(MapWidth+1, 0, 1, MapHeight, true)
    Wall.Name = 'right'
    Wall = new GameObject(0, -2, MapWidth, 1, true)
    Wall.Name = 'Down'
    Wall = new GameObject(0, MapHeight+1, MapWidth, 1, true)
    Wall.Name = 'up'

    const PlayerObject = function (x, y, width, height){

        GameObject.call(this, x, y, width, height, true);
        this.PlayerN = Players.length;
        Players.push(this);
        this.Arrays.push(Players);

        this.Name = 'Player';
        this.Score = 0;

        this.Movement = {
            Can : true,
            Type: undefined,
            Cooldown : 75,
            Speed : Config.Scale          //pixel per tick
        }
        this.Move = function(movement){
            switch(movement){
                case Movements[3]:
                    this.Position.x -= this.Movement.Speed;
                    break;
                case Movements[1]:
                    this.Position.x += this.Movement.Speed;
                    break;
                case Movements[0]:
                    this.Position.y += this.Movement.Speed;
                    break;
                case Movements[2]:
                    this.Position.y -= this.Movement.Speed;
                    break;
            }
            this.Movement.Can = false;
            setTimeout(()=>{ this.Movement.Can = true }, this.Movement.Cooldown);
        }

        this.Body = [];
        this.MaxLength = 3;
        this.AddBody = function (position){
            let body = new GameObject(position.x, position.y, Config.Scale, Config.Scale, true);
            body.Name = 'Body';
            body.PlayerRef = this;
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
            this.Start.Occupated = false;
        }

        this.Reset = function(){
            __SolidObjects.push(this);
            this.Body = [];
            this.MaxLength = 3;
            this.Position.x = this.Start.x;
            this.Position.y = this.Start.y;
            this.Movement.NewType = undefined;
            this.Movement.Type = undefined;
            this.Dead = false;
        }

    }

    let GenerateRandomPosition = function (arrOutside, radius){
        let ok = false;
        let x, y;
        let maxCount = 0;
        while(!ok){
            let continua = false;
            x = Math.floor(Math.random() * (MapWidth / Config.Scale));
            y = Math.floor(Math.random() * (MapHeight / Config.Scale));
            maxCount++;
            if (maxCount >= 100) break;
            PlayersStartPos.forEach(start => {if ((start.x / Config.Scale) == x && (start.y / Config.Scale) == y) continua = true})
            if (continua) continue;
            if (!radius && !arrOutside) break;
            if (!radius) radius = 1;
            let dx, dy;
            ok = arrOutside.every(obj => {
                dx = Math.abs(x - obj.Position.x / Config.Scale)
                dy = Math.abs(y - obj.Position.y / Config.Scale)
                //console.log(dx+"   "+dy)
                if (dx > radius || dy > radius) return true;
                return false;
            })
        }
        let obj = new GameObject(x*Config.Scale, y*Config.Scale, Config.Scale,Config.Scale, true);
        return obj;
    }

    let GenerateApple = function (){
        apple = GenerateRandomPosition(__SolidObjects);
        Apples.push(apple);
        apple.Arrays.push(Apples);
        apple.Name = 'Apple';
    }

    const PowerUpTypes = [
        {Name : 'Apple_Triplicated', Durate : 12000, Probability : 30, Effect : function (player) {
            player.Stretch += 2;
            setTimeout(() => player.Stretch -= 2, this.Durate);
        }}, 
        {Name : 'Faster', Durate : 7000, Probability : 30, Effect : function (player) {
            player.Movement.Cooldown -= 25;
            setTimeout(() => player.Movement.Cooldown += 25, this.Durate);
        }}, 
        {Name : 'Slower', Durate : 7000, Probability : 30, Effect : function (player) {
            player.Movement.Cooldown += 25;
            setTimeout(() => player.Movement.Cooldown -= 25, this.Durate);
        }},
        {Name : 'Walls', Durate : 25000, Probability : 10, WallNum : 25, Effect : function () {
            let walls = []
            for (let i = 0; i < this.WallNum; i++) walls.push(GenerateWall(5));
            setTimeout(() => {for (let i = walls.length-1; i >= 0; i--) walls[i].Destroy()}, this.Durate)
        }}
    ]
    if (io.name == '/Room-4'){
        PowerUpTypes[3].Durate = 30000;
        PowerUpTypes[3].Probability = 250;
        PowerUpTypes[3].WallNum = 50;
    }
    let indexProbability = PowerUpTypes.map((Pow, i) => {
        if (Pow.Probability) return Array(Math.round(Pow.Probability)).fill(i)
    }).reduce((arrRes, currArr) => arrRes.concat(currArr), []);
    const PowerUpCooldown = 6000;

    let GeneratePowerUp = function(){
        powerUp = GenerateRandomPosition(__SolidObjects);
        PowerUps.push(powerUp);
        powerUp.Arrays.push(PowerUps);
        powerUp.Name = 'PowerUp';
        powerUp.Type = PowerUpTypes[indexProbability[Math.floor(Math.random()*indexProbability.length)]]
    }

    let GenerateWall = function(radiusFromPlayer){
        wall = GenerateRandomPosition(Players, radiusFromPlayer)
        Walls.push(wall);
        wall.Arrays.push(Walls);
        wall.Name = 'Wall';
        return wall;
    }

    GenerateApple();
    GeneratePowerUp();

    // End  -   -   -   -   -   -   -   -



    io.on('connection', function(socket){

        // Region -   -   -   -   -   -   -   -
        
        if (Players.length >= MaxPlayers){
            socket.emit('FullRoom');
            return;
        }
        let player = {};
        let canStart = !PlayersStartPos.every(start => {
            if (start.Occupated) return true;
            player = new PlayerObject (0, 0, Config.Scale, Config.Scale);
            player.Start = start;
            start.Occupated = true;
            return false;
        })
        if (!canStart) {
            socket.emit('FullRoom');
            return;
        }
        player.Position.x = player.Start.x;
        player.Position.y = player.Start.y;
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
        player.Stretch = 1;

        player.SendPowerUps = () => {
            let powerUps = []
            PowerUps.forEach(powerUp => powerUps.push(powerUp.Position));
            socket.emit('PowerUps', powerUps);
        }
        player.SendPowerUpType = (type, duration) => {
            socket.emit('PowerUpTaken', type, duration);
        }

        player.SendWalls = () => {
            let walls = []
            Walls.forEach(wall => walls.push(wall.Position))
            socket.emit('Walls', walls)
        }

        player.UpdateScore = (score) => {
            player.Score += score;
            if (player.Score < 0)
                player.Score = 0;
            SendAllScore();
        }

        socket.on('Nickname', nickname => {
            let exist = !Players.every(x => {return x.Nickname !== nickname})
            if (exist) {
                socket.emit('NicknameExist');
                socket.disconnect();
            }
            player.Nickname = nickname;
            player.UpdateScore(0);
        });

        socket.on('Movement', function(movement){
            player.Movement.NewType = movement;
        });

        socket.on('Restart', function(){
            player.Reset();
        })

        // End  -   -   -   -   -   -   -   -

        socket.on('disconnect', () => {

        // Region -   -   -   -   -   -   -   -
        let score = player.Score;
        let nickname = player.Nickname;
        player.DestroyAll();
        SaveScore(nickname, score)

        // End -   -   -   -   -   -   -   -

        });

    });

    // const Debugger = setInterval(() => {
    //     let s = "" + io.name + "\n";
    //     s += '__Object: ' + __OBJECTS.length + "\n"
    //     s += '__SolidObject: ' + __SolidObjects.length + "\n"
    //     s += 'Total Players: ' + Players.length + "\n"
    //     console.log(s);
    // }, 7000)

    const SendAllScore = () => {
        scores = [];
        Players.forEach(player => scores.push({Nickname: player.Nickname, Score: player.Score}));
        io.emit('UpdateScore', scores);
    }

    const SaveScore = (nickname, score) => {
        let file = require(process.cwd() + '/Scores.json');
        let roomScores = file.find(x => x.Room == io.name.replace('/', ''))
        if (!roomScores){ 
            roomScores = {Room: io.name.replace('/', ''), Scores : []};
            file.push(roomScores)
        }
        let Score = roomScores.Scores.find(x => x.Nickname == nickname)
        if (!Score){
            Score = {Nickname : nickname, Score : score}
            roomScores.Scores.push(Score)
        }
        if (Score.Score < score) Score.Score = score;
        roomScores.Scores.sort((a, b)=>{return b.Score - a.Score})
        if (roomScores.Scores.length > 10) roomScores.Scores.pop();
        fs.writeFileSync(process.cwd() + '/Scores.json', JSON.stringify(file) , 'utf-8');
    }

    const Cicle = setInterval(() => {

        // Region -   -   -   -   -   -   -   -

        let DeadPlayer = []
        Players.every( player => {
            
            player.SendOtherPlayers();
            player.SendApples();
            player.SendPowerUps();
            player.SendWalls();

            if (player.Dead)
                return true;
            
            player.SendPosition();

            if(player.Movement.Can && !player.Dead && player.Movement.NewType){
                if (player.Movement.NewType === Movements[0] && player.Movement.Type !== Movements[2]) player.Movement.Type = player.Movement.NewType;
                if (player.Movement.NewType === Movements[1] && player.Movement.Type !== Movements[3]) player.Movement.Type = player.Movement.NewType;
                if (player.Movement.NewType === Movements[2] && player.Movement.Type !== Movements[0]) player.Movement.Type = player.Movement.NewType;
                if (player.Movement.NewType === Movements[3] && player.Movement.Type !== Movements[1]) player.Movement.Type = player.Movement.NewType;
                player.AddBody(player.Position);
                player.Move(player.Movement.Type);
            }
            
            if (player.Collide()){
                if(player.ObjCollided.Name == 'Apple'){
                    player.ObjCollided.Destroy();
                    player.UpdateScore(10 * player.Stretch);
                    GenerateApple();
                    player.MaxLength += player.Stretch;
                    return true;
                }
                if(player.ObjCollided.Name == 'PowerUp'){
                    PowerUpTypes.every(POW => {
                        if (player.ObjCollided.Type == POW){
                            POW.Effect(player);
                            return false;
                        }
                        return true;
                    })
                    player.SendPowerUpType(player.ObjCollided.Type.Name, player.ObjCollided.Type.Durate);
                    player.ObjCollided.Destroy();
                    setTimeout(GeneratePowerUp, PowerUpCooldown);
                    return true;
                }
                DeadPlayer.push(player);
                if (player.ObjCollided.Name === 'Player'){
                    player.ObjCollided.UpdateScore(25 * player.MaxLength);
                }
                if (player.ObjCollided.Name === 'Body' && player.ObjCollided.PlayerRef !== player){
                    player.ObjCollided.PlayerRef.UpdateScore(25 * player.MaxLength);
                }
                return true;
            }
            return true;
        })
        DeadPlayer.forEach(player => {player.Die(); player.UpdateScore(-100); player.SendDead(); });

        // End -   -   -   -   -   -   -   -

    }, __ServerTick);

    const DESTROY_ALL_OBJECT = function(){
        __OBJECTS.forEach(obj => {
            obj.Destroy();
        });
    }

    this.PlayerNumber = () => Players.length;

}