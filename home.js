
const Host = window.location.protocol+'//'+window.location.host

function StringScore(scoreArray){
    let s = '';
    scoreArray.forEach(score => {
        s += score.Nickname + '<br>Score: ' + score.Score + '<br><br>';
    })
    console.log(s)
    return s;
}

$(document).ready(() => {
    $.get(Host+'/Info').done(games => {
        games.forEach(game => {
            $('#Menu').append(`
            <div class="my-3 btn-group dropright">
                <button type="button" class="GameButton btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${game.Name.replace('_', ' ')}</button>
                <div class="dropdown-menu" id="${game.Name}Menu">
                    <a class="dropdown-item" onclick="NicknameInsert('${game.Host}')">Play</a>
                </div>
            </div>
            `)
            $.get(game.Host+'/Info/Scores').done(score => {
                console.log(score)
                score.forEach(room => {
                    let accordion = $('#accordion');
                    if (room.Room){
                        accordion.append(`
                        <div class="card">
                            <button class="btn" data-toggle="collapse" data-target="#collapse${room.Room}" aria-expanded="false" aria-controls="collapse${room.Room}">
                                <div class="card-header" id="heading${room.Room}">
                                    <h5 class="mb-0">${room.Room}</h5>
                                </div>
                            </button>
                            <div id="collapse${room.Room}" class="collapse" aria-labelledby="heading${room.Room}" data-parent="#accordion">
                                <div class="card-body">
                                    ${StringScore(room.Scores)}
                                </div>
                            </div>
                        </div>
                        `)
                        return;
                    }
                    accordion.append(`
                    <div class="card">
                        <button class="btn" data-toggle="collapse" data-target="#collapse${game.Name}" aria-expanded="false" aria-controls="collapse${game.Name}">
                            <div class="card-header" id="heading${game.Name}">
                                <h5 class="mb-0">${game.Name}</h5>
                            </div>
                        </button>
                        <div id="collapse${game.Name}" class="collapse" aria-labelledby="heading${game.Name}" data-parent="#accordion">
                            <div class="card-body">
                                ${StringScore(room.Scores)}
                            </div>
                        </div>
                    </div>
                    `)
                })
            })
            $.get(game.Host+'/Info/Rooms').done(rooms => {
                rooms.sort();
                let s = ''
                rooms.forEach(room => {
                    s += `<a class="dropdown-item" onclick="NicknameInsert('${game.Host}','${room.Name}')">${room.Name.replace('-', ' ')}<div>${room.Player}/${room.MaxPlayers}</div></a>`
                })
                $(`#${game.Name}Menu`).html(s);
            })
        })
    })
})

function NicknameInsert(host, link){
    swal({text: "Inserisci il tuo Nickname", content: 'input'})
        .then(x=>{
            if (!x || x.match(/^ *$/)) return; 
            if (link){
                window.location.assign(`${host}/?room=${link}&nickname=${x}&home=${Host}`)
                return;
            }
            window.location.assign(`${host}/?nickname=${x}&home=${Host}`)
        })
}


