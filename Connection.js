import { Server } from 'socket.io'
import { events as managerEvents } from './GameManager.js'

const event = {
    PLAYER_ASSIGNED: 'PLAYER_ASSIGNED',
    PLAYER_NOT_ASSIGNED: 'PLAYER_NOT_ASSIGNED'
}

export default function Connection(server, namespace, gameManager){

    const io = new Server(server, { path: namespace })

    console.log('Start Server...')

    io.on('connection', socket =>{
        console.log('[Conectado]  ' + socket.id)
        
        managerEvents.forEach(event =>{
            gameManager.on(
                event,
                (...params) =>{
                    socket.emit(event, params)
                },
                socket.id
            )
        })
        
        gameManager.iWannaPlay(socket.id)
        .then((params) => {
            let [player, state] = params
            socket.emit(event.PLAYER_ASSIGNED, player, state)
        })
        .catch(error =>{
            socket.emit(event.PLAYER_NOT_ASSIGNED, state)
        })
        
        socket.on('PLAY', (...params) => {
            let row, col
            [row, col] = params
            gameManager.play(socket.id, row, col)
        })

        socket.on('UNDO_PLAY', (...params) =>{
            gameManager.undoPlay(socket.id)
        })

        socket.on('RESTART', (...params) => {
            gameManager.restart(socket.id)
        })

        socket.on('disconnect', () =>{
            console.log('[Desconectado]  ' + socket.id)
            gameManager.playerLeave(socket.id)
        })
    })

}