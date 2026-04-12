const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()

// CORS ouvert pour l'iPad sur réseau local / Safari
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: false,
}))

const serveur = http.createServer(app)
const io = new Server(serveur, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  // Démarre en polling puis monte en WebSocket (correctif Safari/iOS)
  transports: ['polling', 'websocket'],
  // Compatibilité Engine.IO v3 pour les anciens WebKit
  allowEIO3: true,
})

const sessions = {}

// Retourne la couleur avec le plus de votes ; en cas d'égalité, choisit au hasard.
function calculerMajorite(votes) {
  const compte = { rouge: 0, vert: 0, bleu: 0, jaune: 0 }
  for (const couleur of Object.values(votes)) compte[couleur]++
  const max = Math.max(...Object.values(compte))
  const exAequo = Object.entries(compte).filter(([, v]) => v === max)
  return exAequo[Math.floor(Math.random() * exAequo.length)][0]
}

// Génère un code de session unique à 5 lettres.
function genererCode() {
  const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += lettres[Math.floor(Math.random() * lettres.length)]
  }
  return sessions[code] ? genererCode() : code
}

io.on('connection', (socket) => {
  console.log('Connexion', socket.id)

  // Le PC (Console) crée une session — il n'est pas ajouté aux joueurs.
  socket.on('creer-session', (_nomSession) => {
    const code = genererCode()
    sessions[code] = {
      hote:     socket.id,
      joueurs:  [],
      sequence: 0,
      energie:  100,
      votes:    {},
    }
    socket.join(code)
    socket.emit('session-creee', { code })
    console.log('Session créée', code, '— Console:', socket.id)
  })

  // Dès que la Manette (iPad) rejoint, la session démarre pour tout le monde.
  socket.on('rejoindre-session', ({ code, nomJoueur }) => {
    const session = sessions[code]

    if (!session) {
      socket.emit('erreur-code')
      return
    }

    session.joueurs.push({ id: socket.id, nom: nomJoueur })
    socket.join(code)
    io.to(code).emit('session-lancee')
    console.log('Manette rejointe', nomJoueur, '→ session lancée', code)
  })

  // Synchronisation vidéo (Manette → PC)
  socket.on('video-jouer', ({ code, temps }) => {
    socket.to(code).emit('video-jouer', { temps })
  })

  socket.on('video-pause', ({ code, temps }) => {
    socket.to(code).emit('video-pause', { temps })
  })

  socket.on('video-seek', ({ code, temps }) => {
    socket.to(code).emit('video-seek', { temps })
  })

  // Fin de vidéo (PC → Manette)
  socket.on('video-fin', (code) => {
    socket.to(code).emit('afficher-choix')
    console.log('Vidéo terminée → afficher-choix, session', code)
  })

  // Vote de la Manette
  socket.on('joueur-vote', ({ code, couleur }) => {
    const session = sessions[code]
    if (!session) return
    session.votes[socket.id] = couleur
    io.to(code).emit('vote-recu', {
      nbVotes:   Object.keys(session.votes).length,
      nbJoueurs: session.joueurs.length,
    })
  })

  // Calcul du résultat (déclenché par l'hôte)
  socket.on('calculer-vote', ({ code, choix }) => {
    const session = sessions[code]
    if (!session) return
    const couleurMaj  = calculerMajorite(session.votes)
    const consequence = choix[couleurMaj]
    if (!consequence) return
    session.energie = Math.max(0, session.energie + (consequence.energie || 0))
    session.votes   = {}
    io.to(code).emit('aller-consequence', {
      couleur:      couleurMaj,
      energie:      session.energie,
      consequence:  consequence.consequence,
      nextSequence: consequence.nextSequence,
    })
    console.log('aller-consequence →', couleurMaj, '| énergie:', session.energie)
  })

  socket.on('disconnect', () => {
    console.log('Déconnexion', socket.id)

    for (const code in sessions) {
      const session = sessions[code]

      if (session.hote === socket.id) {
        delete sessions[code]
        console.log('Console déconnectée → session supprimée', code)
        continue
      }

      const avant = session.joueurs.length
      session.joueurs = session.joueurs.filter(j => j.id !== socket.id)
      if (avant > session.joueurs.length && session.joueurs.length === 0) {
        delete sessions[code]
        console.log('Manette déconnectée → session supprimée', code)
      }
    }
  })
})

serveur.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000')
})
