var socket = io();//.connect('http://localhost:3000');

  //I'm connected now
  socket.emit('Hello');
  //DISCONNECTED
  socket.on('disconnect',function() {
    //alert("Server Lost");
  })

$(document).ready(function(){
    /*
     * Logica Pagina Client
     */
    function findPlayer(data){ return data.idClient == socket.id}
    let btn_start = document.querySelector('#start_game_btn');
    btn_start.onclick = function () {

    if(arena.gameObjects.find(findPlayer) !== undefined)
    { btn_start.style.pointerEvents = 'none'; }
    else { socket.emit('startGame') }

    //Disabled onclick event on button
    }
    //To Enabled again
    //btn_start.style.pointerEvents = 'auto';
    const gameZone = document.getElementById('gameZone');
    gameZone.width = 1000;  // eventualmente posso settare le dimensioni
    gameZone.height = 500;

    let arena = {};
    // Tipi di animazione
    const AnimationType = {
      NONE: 0,
      LINEAR: 1,
      KEYBOARD_RIGHT: 2,
      KEYBOARD_LEFT: 3,
    };

    //Tipi di Oggetti
    const ObjectType = {
      BACKGROUND: 'background',
      CIRCLE: 'circle',
      RECTANGLE: 'rectangle',
      TEXT: 'text',
      PLAYER: 'player',
      BULLET: 'bullet',
    };

    //ricavo il contesto che serve per disegnare
    const ctx = gameZone.getContext("2d");

    //DISEGNO TUTTI gli oggetti dell'array gameObjects
    function draw() {

      arena.gameObjects.forEach(element => {
        ctx.globalAlpha = element.alpha;
        switch (element.type) {
          case ObjectType.BACKGROUND:
            ctx.beginPath();
            ctx.rect(element.x, element.y, element.w, element.h);
            ctx.fillStyle = element.fillColor; //colore di riempimento
            ctx.fill();
            break;

            case ObjectType.RECTANGLE:
              ctx.beginPath();
              const x = element.x - element.w / 2;
              const y = element.y - element.h / 2;
              ctx.rect(x, y, element.w, element.h);
              if (element.fillColor !== null) {
                ctx.fillStyle = element.fillColor; //colore di riempimento
                ctx.fill();
              }
              if (element.color !== null) {
                ctx.strokeStyle = element.color; // colore del bordo
                ctx.stroke();
              }
              break;

            case ObjectType.CIRCLE:
              ctx.beginPath();
              ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
              if (element.fillColor !== null) {
                ctx.fillStyle = element.fillColor; //colore di riempimento
                ctx.fill();
              }
              if (element.color !== null) {
                ctx.strokeStyle = element.color; // colore del bordo
                ctx.stroke();
              }
              break;

              case ObjectType.PLAYER:
                ctx.beginPath();
                ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
                if (element.fillColor !== null) {
                  ctx.fillStyle = element.fillColor; //colore di riempimento
                  ctx.fill();
                }
                if (element.color !== null) {
                  ctx.strokeStyle = element.color; // colore del bordo
                  ctx.stroke();
                }
                break;

                case ObjectType.BULLET:
                  ctx.beginPath();
                  ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
                  if (element.fillColor !== null) {
                    ctx.fillStyle = element.fillColor; //colore di riempimento
                    ctx.fill();
                  }
                  if (element.color !== null) {
                    ctx.strokeStyle = element.color; // colore del bordo
                    ctx.stroke();
                  }
                  break;
            }
      });
    }

    //KEYBOARD CONTROLL
    /* gestione eventi da tastiera
     * creo un oggetto che mantiene traccia dei tasti premuti
     * e gestisco due set di tasti
     * keyboardRight:  W (alto), D (destra), S (basso), A (sinistra)
     * keyboardLeft: tasti cursore
     */
    function UserInput() {
      this.keyboardRight = {
        up: false,
        right: false,
        down: false,
        left: false
      };
      this.keyboardLeft = {
        up: false,
        right: false,
        down: false,
        left: false
      };
      this.mouse = {
        x: 0,
        y: 0
      };
    }

    //creo l'oggetto
    const userInput = new UserInput();

    function mouseBullet(event) {
      userInput.mouse.x = event.offsetX;
      userInput.mouse.y = event.offsetY;
      socket.emit('mouseClicked', userInput.mouse);
    }

    /* tramite gli eventi di tastiera keydown e keyup, posso settare le variabili
    corrispondenti ai tasti premuti e gestire meglio la situazione in cui il tasto viene mantenuto premuto:*/
    const keysHundler = function (event) {
      //in base al tipo di evento verifico se il tasto è ancora premuto o meno
      const ok = event.type === 'keydown';
      switch (event.keyCode) {
        // cursor
        case 38:
          userInput.keyboardLeft.up = ok;
          event.preventDefault();
          break;
        case 39:
          userInput.keyboardLeft.right = ok;
          event.preventDefault();
          break;
        case 40:
          userInput.keyboardLeft.down = ok;
          event.preventDefault();
          break;
        case 37:
          userInput.keyboardLeft.left = ok;
          event.preventDefault();
          break;

        // W D S A
        case 87:
          userInput.keyboardRight.up = ok;
          event.preventDefault();
          break;
        case 68:
          userInput.keyboardRight.right = ok;
          event.preventDefault();
          break;
        case 83:
          userInput.keyboardRight.down = ok;
          event.preventDefault();
          break;
        case 65:
          userInput.keyboardRight.left = ok;
          event.preventDefault();
          break;
      }

      //invio al server il tasto premuto
      socket.emit('keyPressed', event.keyCode);
      console.log(event.keyCode);
    };
    document.addEventListener('keydown', keysHundler);
    document.addEventListener('keyup', keysHundler);
    document.querySelector('canvas').addEventListener("click", mouseBullet);
    //canvas.addEventListener('mousemove', handleMouseMove);
    //END KEYBOARD CONTROLL

    //STEP 1 - (0 in Server)
    socket.on('Welcome', (data) => {
      Object.assign(arena, data);
      console.log(arena.gameObjects);
      if(arena.gameObjects.length == 0){socket.emit('First_Client')}
    })

    //STEP 3 - (2 in Server)
    socket.on('updatePositionLoopBackground', (data)=>{
      Object.assign(arena,data);
      draw();
      socket.emit('updatePositionLoop',userInput);
    })

}); //end document.ready
