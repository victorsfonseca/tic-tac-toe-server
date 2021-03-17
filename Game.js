// const socketio = require('socket.io')

export const FIRST_PLAYER = 'FIRST_PLAYER'
export const SECOND_PLAYER = 'SECOND_PLAYER'

// events

export const event = {
    BOARD_CHANGED: 'BOARD_CHANGED',
    PLAYER_CHANGED: 'PLAYER_CHANGED',
    SCORE_CHANGED:'SCORE_CHANGED',
    HISTORY_CHANGED: 'HISTORY_CHANGED',
    WE_HAVE_A_WINNER: 'WE_HAVE_A_WINNER',
    TIED: 'TIED',
    RESTARTED: 'RESTARTED'
}

export const events = [ 
    event.BOARD_CHANGED,
    event.PLAYER_CHANGED,
    event.SCORE_CHANGED,
    event.HISTORY_CHANGED,
    event.WE_HAVE_A_WINNER,
    event.TIED,
    event.RESTARTED
]

// errors

export const error_types = {
    GAME_ALREADY_FINISHED: 'GAME_ALREADY_FINISHED',
    NOT_YOUR_TURN: 'NOT_YOUR_TURN',
    SQUARE_ALREADY_MARKED: 'SQUARE_ALREADY_MARKED',
    CANT_UNDO_OPPONENT_PLAY: 'CANT_UNDO_OPPONENT_PLAY'
}

class GameAlreadyFinished extends Error{
    constructor(message){
        let error_message = message || 'Game already finished'
        super(error_message)
        this.type = 'GAME_ALREADY_FINISHED'
    }
}

class NotYourTurn extends Error{
    constructor(message){
        let error_message = message || 'Not your turn'
        super(error_message)
        this.type = 'NOT_YOUR_TURN'
    }
}

class SquareAlreadyMarked extends Error{
    constructor(message){
        let error_message = message || 'Square already marked'
        super(error_message)
        this.type = 'SQUARE_ALREADY_MARKED'
    }
}

class CantUndoOpponentPlay extends Error{
    constructor(message){
        let error_message = message || "Can't undo opponent play"
        super(error_message)
        this.type = 'CANT_UNDO_OPPONENT_PLAY'
    }
}


function Game(gameId, inicialPlayer){

    if(!gameId) throw new Error('No id passed')
    const id = gameId
    let board= [[null, null, null],
                [null, null, null],
                [null, null, null]]
    let inicial_player = FIRST_PLAYER
    let current_player = inicialPlayer || inicial_player
    let score = {
        first_player: 0,
        second_player: 0
    }
    let history = []
    let listenners = []

    on(event.WE_HAVE_A_WINNER, obj => {
        let wonPlayer = obj.player
        updateScore(wonPlayer)
    })

    function getBoard(){ return board }

    function getCurrentPlayer(){ return current_player}

    function getScore(){ return score }

    function getHistory(){ return history }

    function on(event, callback){
        listenners.push({
            event: event,
            callback: callback
        })
    }

    function emit(event, params = null){
        listenners.forEach(listenner => {
            if(listenner.event == event && listenner.callback) listenner.callback(params);
        });
    }

    function restartScore(){
        score.first_player = 0
        score.second_player = 0
        emit(event.SCORE_CHANGED, score)
    }

    function updateScore(player){
        if(player === FIRST_PLAYER) score.first_player++
        if(player === SECOND_PLAYER) score.second_player++
        emit(event.SCORE_CHANGED, score) 
    }

    function changeInicialPlayer(){
        inicial_player = (inicial_player == FIRST_PLAYER)? SECOND_PLAYER: FIRST_PLAYER
    }

    function addToHistory(row,column,player){
        let item = {
                        player: player,
                        position: {
                            row: row,
                            column: column
                        }
                    };
        
        history.push(item);

        emit(event.HISTORY_CHANGED, history)
        return history
    }

    function undoHistory(){
        history.pop();
        emit(event.HISTORY_CHANGED, this.history)
        return history
    }

    function changeBoard( row, col, value){
        board[row][col] =  value
        emit(event.BOARD_CHANGED, board)
        return board
    }

    function gameAlreadyFinished(){
        return checkIfFinished(false)
    }

    function isPlayerTurn(player){
        return current_player == player
    }

    function squareAlreadyMarked(row, col){
        return board[row][col] != null ? true : false
    }

    function checkIfFinished(emitEvents){
        
        function checkRows(){
            function checkRow(row){
                return board[row][0] && board[row][0] == board[row][1] && board[row][0] == board[row][2]
            }

            for(let row = 0; row < 3; row++){
                if(checkRow(row)){
                    if(emitEvents) emit(event.WE_HAVE_A_WINNER, {player: board[row][0], where:{row: row}})
                    return true
                }
            }

            return false
        }

        function checkColumns(){
            function checkColumn(col){
                return board[0][col] && board[0][col] == board[1][col] && board[0][col] == board[2][col]
            }

            for(let col = 0; col < 3; col++){
                if(checkColumn(col)){
                    // col won
                    if(emitEvents) emit(event.WE_HAVE_A_WINNER, { player: board[0][col], where:{col: col}})
                    return true
                }
            }
            
            return false
        }

        function checkDiagonals(){
            if(board[1][1] && board[1][1] == board[0][0] && board[1][1] == board[2][2]){
                // diagonal 0
                if(emitEvents) emit(event.WE_HAVE_A_WINNER, { player: board[1][1], where:{diagonal: 0}})
                return true
            }
            if(board[1][1] && board[1][1] == board[0][2] && board[1][1] == board[2][0]){
                // diagonal 1
                if(emitEvents) emit(event.WE_HAVE_A_WINNER, { player: board[1][1], where:{diagonal: 1}})
                return true
            }
            return false
        }

        function checkIfTied(){
            for(let row of board){
                for(let col of row){
                    if(col === null) return false
                }
            }
            if(emitEvents) emit(event.TIED)
            return true
        }

        if(checkRows()||
            checkColumns() ||
            checkDiagonals() ||
            checkIfTied()) return true

        return false
    }

    function changeCurrentPlayer(){
        current_player = (current_player == FIRST_PLAYER) ? SECOND_PLAYER : FIRST_PLAYER 
        emit(event.PLAYER_CHANGED, current_player)
    }

    function play(player, row, col){

        // validar dados
        if(player != FIRST_PLAYER && player != SECOND_PLAYER) throw new Error('Invalid Player')
        if(row < 0 || row >= 3) throw new Error('Invalid Row')
        if(col < 0 || col >= 3) throw new Error('Invalid Column')

        // executar funcão
        if(gameAlreadyFinished()) throw new GameAlreadyFinished('Game already finished')
        if(!isPlayerTurn(player)) throw new NotYourTurn('Not your turn')
        if(squareAlreadyMarked(row,col)) throw new SquareAlreadyMarked('Square already marked')

        changeBoard(row, col, player)
        addToHistory(row, col, player)
        if(checkIfFinished(true)) return
        changeCurrentPlayer()

        // retornar dados
    }

    function undoPlay(player){
        if(gameAlreadyFinished()) throw new GameAlreadyFinished()
        let lastPlay = history[history.length -1]
        if(lastPlay){
            if(player == lastPlay.player) throw new CantUndoOpponentPlay()
            changeBoard(lastPlay.position.row, lastPlay.position.column, null)
            undoHistory()
            changeCurrentPlayer()
            return true
        }
        return false
    }

    function restart(){
        board = [[null, null, null],
                [null, null, null],
                [null, null, null]];

        emit(event.BOARD_CHANGED, board)
        changeInicialPlayer()
        current_player = inicial_player
        emit(event.PLAYER_CHANGED, current_player)
        history = []
        emit(event.HISTORY_CHANGED, history)
        emit(event.RESTARTED)
    }

    return {
        id: id,
        board: getBoard,
        score: getScore,
        current_player: getCurrentPlayer,
        history: getHistory,
        on: on,
        play: play,
        undoPlay: undoPlay,
        restart: restart,
        restartScore: restartScore
    }
}

export default Game
