import express from 'express';
import { createServer } from 'http';
import body_parser_pkg from 'body-parser';
import cors from 'cors';
import Connection from './Connection.js'
import GameManager from './GameManager.js'

const { urlencoded, json } = body_parser_pkg

const api = express()
const server = createServer(api)

const PORT = process.env.PORT || 1711

const manager = GameManager()
const gameConnection = Connection(server, '/GAME/', manager)

api.use(cors());

api.use(urlencoded({
    extended: true
}));

api.use(json());

api.get('/new-game', (req, res) =>{
    let data = req.query
    let game = manager.newGame()
    console.log('Novo jogo:')
    console.log(game)
    res.json(data)
})

server.listen(PORT, ()=>{
    console.log('Running tic-tac-toe server...')
})

