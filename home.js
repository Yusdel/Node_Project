
const Host = window.location.protocol+'//'+window.location.host

$(document).ready(() => {
    $.get(Host+'/Info').done(games => {
        games.forEach(game => {
            $('#Menu').append(`
            <div class="btn-group dropright">
                <button type="button" class="GameButton btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${game.Name.replace('_', ' ')}</button>
                <div class="dropdown-menu" id="${game.Name}Menu"></div>
            </div>
            `)
            $.get(game.Host+'/Info/Rooms').done(rooms => {
                rooms.sort();
                rooms.forEach(room => {
                    $(`#${game.Name}Menu`).append(`
                    <a class="dropdown-item" onclick="NicknameInsert('${room.Name}')">${room.Name.replace('-', ' ')}<div>${room.Player}/${room.MaxPlayers}</div></a>
                    `)
                });
            })
        })
    })
})

function NicknameInsert(link){
    swal({text: "Inserisci il tuo Nickname", content: 'input'})
        .then(x=>{
            if (!x || x.match(/^ *$/)) return; 
            window.location.assign(`http://localhost:7777/?room=${link}&nickname=${x}&home=${Host}`)
        })
}

