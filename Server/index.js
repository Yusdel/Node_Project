const process = require('child_process');

console.log('Processo padre avviato');

StartProcess = (path, timeToRestart) => {

    child = process.fork(path);
    
    child.on('close', (code)=>{
        console.log(code);
        if (!(timeToRestart === undefined))
            setTimeout(() => StartProcess(child.spawnargs[1], timeToRestart), timeToRestart)
    })

}

StartProcess('./Server/Snake.js', 2000);