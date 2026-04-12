// Scénario — Jack Carter
// type: 'video' | 'quiz'
// consequence: 'continuer' | 'fin-prematuree' | 'fin-jeu'
// nextSequence: index de la prochaine séquence (undefined = séquence suivante)
// Les textes narratifs viennent de src/data/sequences.js (indexé par id)

export const SEQUENCES = [

  // SÉQUENCE 0 — Briefing
  {
    id: 1,
    type: 'video',
    titre: 'Le briefing de départ',
    video: '/videos/1.mp4',
    choix: {
      rouge: {
        label: 'Entrer immédiatement',
        consequence: 'continuer',
        nextSequence: 1,
        energie: 0,
      },
      vert: {
        label: 'Consulter le cahier',
        consequence: 'continuer',
        nextSequence: 2,
        energie: 0,
      },
      bleu: {
        label: 'Appeler les secours',
        consequence: 'continuer',
        nextSequence: 2,
        energie: -10,
      },
      jaune: {
        label: 'Attendre le lendemain',
        consequence: 'continuer',
        nextSequence: 2,
        energie: -10,
      },
    },
  },

  // SÉQUENCE 1 — Quiz de Survie
  {
    id: 2,
    type: 'quiz',
    titre: 'Quiz de Survie',
    image: '/photos/1.jpg',
    video: '/videos/1.mp4',
    choix: {
      rouge: {
        label: 'Couteau · Briquet · GPS',
        consequence: 'continuer',
        nextSequence: 0,
        energie: -5,
      },
      vert: {
        label: 'Boussole · Gourde · Cahier de survie',
        consequence: 'continuer',
        nextSequence: 2,
        energie: 0,
      },
      bleu: {
        label: 'Radio · Couverture · Corde',
        consequence: 'continuer',
        nextSequence: 0,
        energie: -5,
      },
      jaune: {
        label: 'Allumettes · Carte · Couteau',
        consequence: 'continuer',
        nextSequence: 0,
        energie: -5,
      },
    },
  },

  // SÉQUENCE 2 — Le Voile du Nord
  {
    id: 3,
    type: 'video',
    titre: 'Le Voile du Nord',
    video: '/videos/2.mp4',
    choix: {
      rouge: {
        label: 'Avancer au hasard',
        consequence: 'continuer',
        energie: -20,
      },
      vert: {
        label: 'Utiliser la boussole',
        consequence: 'continuer',
        energie: 0,
      },
      bleu: {
        label: "S'arrêter et attendre",
        consequence: 'continuer',
        energie: -10,
      },
      jaune: {
        label: 'Rebrousser chemin',
        consequence: 'continuer',
        energie: -15,
      },
    },
  },

  // SÉQUENCE 3 — La Rivière Gonflée
  {
    id: 4,
    type: 'video',
    titre: 'La Rivière Gonflée',
    video: '/videos/3.mp4',
    choix: {
      rouge: {
        label: 'Traverser en force',
        consequence: 'continuer',
        energie: -20,
      },
      vert: {
        label: 'Longer la berge',
        consequence: 'continuer',
        energie: 0,
      },
      bleu: {
        label: 'Construire un radeau',
        consequence: 'continuer',
        energie: -5,
      },
      jaune: {
        label: 'Faire demi-tour',
        consequence: 'continuer',
        energie: -15,
      },
    },
  },

  // SÉQUENCE 4 — Les Traces Disparaissent
  {
    id: 5,
    type: 'video',
    titre: 'Les Traces Disparaissent',
    video: '/videos/4.mp4',
    choix: {
      rouge: {
        label: 'Escalader la paroi',
        consequence: 'fin-prematuree',
        energie: 0,
      },
      vert: {
        label: 'Lire les indices au sol',
        consequence: 'continuer',
        energie: 0,
      },
      bleu: {
        label: 'Appeler à voix haute',
        consequence: 'continuer',
        energie: -5,
      },
      jaune: {
        label: 'Contourner par le flanc',
        consequence: 'continuer',
        energie: -10,
      },
    },
  },

  // SÉQUENCE 5 — Le Randonneur Retrouvé
  {
    id: 6,
    type: 'video',
    titre: 'Le Randonneur Retrouvé',
    video: '/videos/5.mp4',
    choix: {
      rouge: {
        label: 'Le porter sans attelle',
        consequence: 'continuer',
        energie: -20,
      },
      vert: {
        label: 'Confectionner une civière',
        consequence: 'continuer',
        energie: 0,
      },
      bleu: {
        label: 'Envoyer un signal et attendre',
        consequence: 'continuer',
        energie: -5,
      },
      jaune: {
        label: 'Le forcer à marcher',
        consequence: 'continuer',
        energie: -15,
      },
    },
  },

  // SÉQUENCE 6 — L'Extraction Finale
  {
    id: 7,
    type: 'video',
    titre: "L'Extraction Finale",
    video: '/videos/6.mp4',
    choix: {
      rouge: {
        label: "Forcer l'allure",
        consequence: 'fin-jeu',
        energie: -20,
      },
      vert: {
        label: 'Rythme régulier, pauses',
        consequence: 'fin-jeu',
        energie: 0,
      },
      bleu: {
        label: 'Allumer un feu de signal',
        consequence: 'fin-jeu',
        energie: 0,
      },
      jaune: {
        label: 'Laisser le randonneur',
        consequence: 'fin-jeu',
        energie: -100,
      },
    },
  },

]

// Calcule la fin selon l'énergie restante du groupe.
export function calculerFin(energie) {
  if (energie > 50) return 'heros'
  if (energie >= 20) return 'survivant'
  return 'abandon'
}
