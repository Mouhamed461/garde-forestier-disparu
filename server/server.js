// Serveur principal Node.js
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const serveur = http.createServer(app)
const io = new Server(serveur, {
  cors: { origin: 'http://localhost:3000' }
})

// Connexion d'un joueur
io.on('connection', (socket) => {
  console.log('Joueur connecté', socket.id)

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté', socket.id)
  })
})

// Démarrage du serveur
serveur.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000')
})
