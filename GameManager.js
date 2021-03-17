import Game, {event as GameEvent , events as GameEvents, FIRST_PLAYER, SECOND_PLAYER} from "./Game.js"

export const event = {
    ...GameEvent,
    YOUR_TURN: 'YOUR_TURN',
    OPPONENT_TURN: 'OPPONENT_TURN',
    YOU_WON: 'YOU_WON',
    YOU_LOSE: 'YOU_LOSE',
    WAITING_PLAYER: 'WAITING_PLAYER',
    GAME_RUNNING: 'GAME_RUNNING'
}

export const events = [
    ...GameEvents,
    event.YOUR_TURN,
    event.OPPONENT_TURN,
    event.YOU_WON,
    event.YOU_LOSE,
    event.WAITING_PLAYER,
    event.GAME_RUNNING
]

function GameManager(){
    
    let game = Game('123456789')
    let first_player = null
    let second_player = null

    game.on(GameEvent.BOARD_CHANGED, board => { emit(event.BOARD_CHANGED, board)})
    game.on(GameEvent.HISTORY_CHANGED, history => { emit(event.HISTORY_CHANGED, history)})
    game.on(GameEvent.RESTARTED, restarted)
    game.on(GameEvent.SCORE_CHANGED, score => {emit(event.SCORE_CHANGED, score)})
    game.on(GameEvent.TIED, () => {emit(event.TIED)})
    game.on(GameEvent.PLAYER_CHANGED, playerChanged)
    game.on(GameEvent.WE_HAVE_A_WINNER, weHaveAWinner)

    let listenners = []

    function on(event, callback, id){
        listenners.push({
            id: id,
            event: event,
            callback: callback
        })
    }

    function emit(event, params = null){
        listenners.forEach(listenner => {
            if(listenner.event == event && listenner.callback) listenner.callback(params);
        });
    }

    function restarted(){
        emit(event.RESTARTED)
        if(checkFor2Players()) emit(event.GAME_RUNNING)
    }

    function playerChanged(player){
        
        let player_turn = player == FIRST_PLAYER ? first_player : second_player
        let opponent_player = player == FIRST_PLAYER ? second_player : first_player

        listenners.forEach(listenner => {
            if(listenner.id == player_turn && listenner.event == event.YOUR_TURN && listenner.callback) listenner.callback()
            if(listenner.id == opponent_player && listenner.event == event.OPPONENT_TURN && listenner.callback) listenner.callback()
            if(listenner.id != player_turn && listenner.id != opponent_player && listenner.event == event.PLAYER_CHANGED && listenner.callback) listenner.callback(player)
        })
    }

    function weHaveAWinner(obj){
        
        let winner = obj.player == FIRST_PLAYER ? first_player : second_player
        let loser = obj.player == FIRST_PLAYER ? second_player : first_player
        
        listenners.forEach(listenner => {
            if(listenner.id == winner && listenner.event == event.YOU_WON && listenner.callback) listenner.callback(obj.where)
            if(listenner.id == loser && listenner.event == event.YOU_LOSE && listenner.callback) listenner.callback(obj.where)
            if(listenner.id != winner && listenner.id != loser && listenner.event == event.WE_HAVE_A_WINNER && listenner.callback) listenner.callback(obj)
        })
    }

    function checkFor2Players(){
        if(first_player && second_player) return true 
        return false
    }

    function assignFirstPlayer(playerId) {
        if(!first_player) {
            first_player = playerId
            return true
        }
        return false
    }

    function assignSecondPlayer(playerId) {
        if(!second_player) {
            second_player = playerId
            return true
        }
        return false
    }

    function playerAssigned(){
        if(checkFor2Players()){
            emit(event.GAME_RUNNING)
        }else{
            emit(event.WAITING_PLAYER)
        }
    }

    function getGameState(){
        let state = {
                board: game.board(),
                score: game.score(),
                history: game.history(),
                currentPlayer: game.current_player()
            }
        return state
    }

    function iWannaPlay(playerId){
        return new Promise((resolve, reject) =>{
            let state = getGameState()
            if(assignFirstPlayer(playerId)){ resolve([FIRST_PLAYER, state]); playerAssigned(); return}
            if(assignSecondPlayer(playerId)){ resolve([SECOND_PLAYER, state]); playerAssigned(); return}
            reject('Player not assigned', state)
        })
    }

    function playerLeave(playerId) {
        if(first_player == playerId) first_player = null
        if(second_player == playerId) second_player = null
        game.restart()
        game.restartScore()
        emit(event.WAITING_PLAYER)
    }

    function play(player, row, col){
        try{

            if(!(first_player && second_player)) return false

            if(player == first_player){
                game.play(FIRST_PLAYER, row, col) 
                return true
            } 

            if(player == second_player){
                game.play(SECOND_PLAYER, row, col)
                return true
            } 
        }catch(error){
            console.log(error)
        }

        return false
    }

    function undoPlay(player) {
        try{
            if(player == second_player){
                game.undoPlay(FIRST_PLAYER)
                return true
            } 

            if(player == first_player){
                game.undoPlay(SECOND_PLAYER)
                return true
            } 
        }catch(error){
            console.log(error)
        }

        return false
    }

    function restart(player) {
        if(player == first_player || player == second_player) game.restart()
    }
    return {
        on: on,
        iWannaPlay: iWannaPlay,
        playerLeave: playerLeave,
        play: play,
        undoPlay: undoPlay,
        restart: restart
    }
}

export default GameManager