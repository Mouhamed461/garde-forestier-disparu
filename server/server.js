const express = require('express')
const http    = require('http')
const { Server } = require('socket.io')
const cors    = require('cors')

const app = express()

app.use(cors({
  origin:      '*',
  methods:     ['GET', 'POST'],
  credentials: false,
}))

const serveur = http.createServer(app)
const io = new Server(serveur, {
  cors:      { origin: '*', methods: ['GET', 'POST'], credentials: false },
  transports: ['polling', 'websocket'],
  allowEIO3:  true,
})

// Salle unique permanente — plus de code à générer ni à saisir.
const SALLE_CODE = 'SALLE'
const sessions   = {}

function shufflerCouleurs() {
  const c = ['rouge', 'vert', 'bleu', 'jaune']
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]]
  }
  return c
}

function calculerMajorite(votes) {
  const compte = { rouge: 0, vert: 0, bleu: 0, jaune: 0 }
  for (const couleur of Object.values(votes)) compte[couleur]++
  const max     = Math.max(...Object.values(compte))
  const exAequo = Object.entries(compte).filter(([, v]) => v === max)
  return exAequo[Math.floor(Math.random() * exAequo.length)][0]
}

function initialiserSalle(hote = null) {
  return {
    hote,
    joueurs:             [],
    energie:             100,
    votes:               {},
    permutationCouleurs: shufflerCouleurs(),
    _disconnectTimer:    null,
  }
}

// Créer la salle au démarrage du serveur
sessions[SALLE_CODE] = initialiserSalle()

io.on('connection', (socket) => {
  console.log('Connexion', socket.id)

  // La Console rejoint la salle automatiquement (sans saisie de code)
  socket.on('rejoindre-console', () => {
    sessions[SALLE_CODE].hote = socket.id
    socket.join(SALLE_CODE)
    socket.emit('console-prete', { code: SALLE_CODE })
    console.log('Console rejointe → salle', SALLE_CODE)
  })

  // La Manette prend le contrôle : réinitialise et lance la partie
  socket.on('prendre-controle', () => {
    const s = sessions[SALLE_CODE]

    if (s._disconnectTimer) {
      clearTimeout(s._disconnectTimer)
      s._disconnectTimer = null
    }

    // Nouvelle partie : réinitialiser énergie, votes et permutation
    s.energie             = 100
    s.votes               = {}
    s.permutationCouleurs = shufflerCouleurs()
    s.joueurs             = [{ id: socket.id, nom: 'Manette' }]

    socket.join(SALLE_CODE)
    io.to(SALLE_CODE).emit('session-lancee', { permutationCouleurs: s.permutationCouleurs })
    console.log('Manette — prise de contrôle → partie lancée, salle', SALLE_CODE)
  })

  // Reconnexion silencieuse de la Manette pendant le délai de grâce
  socket.on('rejoindre-session', ({ code, nomJoueur }) => {
    const s = sessions[SALLE_CODE]
    if (!s) return

    if (s._disconnectTimer) {
      clearTimeout(s._disconnectTimer)
      s._disconnectTimer = null
    }

    const existant = s.joueurs.find(j => j.nom === (nomJoueur || 'Manette'))
    if (existant) {
      existant.id = socket.id
      socket.join(SALLE_CODE)
      console.log('Manette reconnectée → reprise silencieuse, salle', SALLE_CODE)
    }
  })

  // Synchronisation vidéo (Manette → Console)
  socket.on('video-jouer', ({ code, temps }) => {
    socket.to(SALLE_CODE).emit('video-jouer', { temps })
  })
  socket.on('video-pause', ({ code, temps }) => {
    socket.to(SALLE_CODE).emit('video-pause', { temps })
  })
  socket.on('video-seek', ({ code, temps }) => {
    socket.to(SALLE_CODE).emit('video-seek', { temps })
  })
  // Fin de vidéo principale → signaler à la Manette d'afficher les choix
  socket.on('video-fin', (code) => {
    socket.to(SALLE_CODE).emit('afficher-choix')
    console.log('Vidéo terminée → afficher-choix, salle', SALLE_CODE)
  })

  // Vote de la Manette
  socket.on('joueur-vote', ({ code, couleur }) => {
    const s = sessions[SALLE_CODE]
    if (!s) return
    s.votes[socket.id] = couleur
    io.to(SALLE_CODE).emit('vote-recu', {
      nbVotes:   Object.keys(s.votes).length,
      nbJoueurs: s.joueurs.length,
    })
  })

  // Calcul du résultat (déclenché par l'hôte)
  socket.on('calculer-vote', ({ code, choix }) => {
    const s = sessions[SALLE_CODE]
    if (!s) return
    const couleurMaj  = calculerMajorite(s.votes)
    const consequence = choix[couleurMaj]
    if (!consequence) return
    s.energie = Math.max(0, s.energie + (consequence.energie || 0))
    s.votes   = {}
    io.to(SALLE_CODE).emit('aller-consequence', {
      couleur:      couleurMaj,
      energie:      s.energie,
      consequence:  consequence.consequence,
      nextSequence: consequence.nextSequence,
    })
    console.log('aller-consequence →', couleurMaj, '| énergie:', s.energie)
  })

  // La Console (re)joint la room après navigation interne
  socket.on('rejoindre-video', ({ code }) => {
    socket.join(SALLE_CODE)
    console.log('Console — rejoindre-video → salle', SALLE_CODE, '— socket', socket.id)
  })

  // Mission lancée depuis le synopsis (n'importe quel appareil peut déclencher)
  socket.on('lancer-mission', ({ code, nomEquipe }) => {
    io.to(SALLE_CODE).emit('mission-lancee', { nomEquipe: nomEquipe || '' })
    console.log('Mission lancée → salle', SALLE_CODE, '| équipe:', nomEquipe || '(sans nom)')
  })

  // La Manette envoie "Continuer" → notifie uniquement la Console
  socket.on('continuer-sequence', ({ code }) => {
    socket.to(SALLE_CODE).emit('continuer-sequence')
    console.log('Continuer séquence → salle', SALLE_CODE)
  })

  // Console → Manette : animation du titre terminée, bouton lecture déverrouillé
  socket.on('titre-fini', (code) => {
    socket.to(SALLE_CODE).emit('titre-fini')
    console.log('Titre terminé → Manette déverrouillée, salle', SALLE_CODE)
  })

  // Console → Manette : inventaire entièrement affiché, en attente de validation
  socket.on('inventaire-pret', (code) => {
    socket.to(SALLE_CODE).emit('inventaire-pret')
    console.log('Inventaire prêt → attente validation manette, salle', SALLE_CODE)
  })

  // Manette → Console : le joueur valide l'inventaire
  socket.on('valider-inventaire', ({ code }) => {
    socket.to(SALLE_CODE).emit('valider-inventaire')
    console.log('Inventaire validé → reprise, salle', SALLE_CODE)
  })

  // Manette → Console : rejouer la vidéo inventaire depuis le début
  socket.on('rejouer-video', ({ code }) => {
    socket.to(SALLE_CODE).emit('rejouer-video')
    console.log('Rejouer vidéo → salle', SALLE_CODE)
  })

  // Manette → Console : passer (skip) la vidéo en cours
  socket.on('passer-video', ({ code }) => {
    socket.to(SALLE_CODE).emit('passer-video')
    console.log('Passer vidéo → salle', SALLE_CODE)
  })

  // Console → Manette : la séquence suivante est sur le point d'être chargée
  socket.on('sequence-change', ({ code, next }) => {
    socket.to(SALLE_CODE).emit('sequence-change', { next })
    console.log('sequence-change → séquence', next, '| salle', SALLE_CODE)
  })

  // Recommencer depuis le début sans détruire la session
  socket.on('redemarrer', ({ code }) => {
    const s = sessions[SALLE_CODE]
    if (!s) return
    s.energie = 100
    s.votes   = {}
    io.to(SALLE_CODE).emit('redemarrer')
    console.log('Mission redémarrée → salle', SALLE_CODE)
  })

  // Fin de partie → retour à l'accueil simultané sur toutes les interfaces
  socket.on('recommencer', ({ code }) => {
    const s = sessions[SALLE_CODE]
    if (!s) return
    s.energie = 100
    s.votes   = {}
    io.to(SALLE_CODE).emit('recommencer')
    console.log('Recommencer → retour accueil, salle', SALLE_CODE)
  })

  // Quitter : réinitialise la salle sans la détruire (permanente)
  socket.on('quitter-session', ({ code }) => {
    io.to(SALLE_CODE).emit('session-terminee')
    sessions[SALLE_CODE] = initialiserSalle(sessions[SALLE_CODE].hote)
    console.log('Session quittée → salle réinitialisée', SALLE_CODE)
  })

  socket.on('disconnect', () => {
    console.log('Déconnexion', socket.id)
    const s = sessions[SALLE_CODE]
    if (!s) return

    // Console déconnectée : conserver la session, juste libérer le slot hôte
    if (s.hote === socket.id) {
      s.hote = null
      console.log('Console déconnectée → session conservée, salle', SALLE_CODE)
      return
    }

    // Manette déconnectée → délai de grâce 5 minutes avant réinitialisation
    const avant = s.joueurs.length
    s.joueurs   = s.joueurs.filter(j => j.id !== socket.id)
    if (avant > s.joueurs.length && s.joueurs.length === 0) {
      console.log('Manette déconnectée → délai de grâce 5 min, salle', SALLE_CODE)
      s._disconnectTimer = setTimeout(() => {
        const sess = sessions[SALLE_CODE]
        if (sess && sess.joueurs.length === 0) {
          sessions[SALLE_CODE] = initialiserSalle(sess.hote)
          console.log('Délai de grâce écoulé → salle réinitialisée', SALLE_CODE)
        }
      }, 300000) // 5 minutes
    }
  })
})

serveur.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000')
})
