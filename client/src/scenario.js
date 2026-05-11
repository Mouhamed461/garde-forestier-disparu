// Scénario — Jack Carter
//
// IDs stables des séquences (ne jamais les changer) :
//   1 = Opération Jack Carter          2 = Inventaire de Jack       9 = Test de survie (quiz)
//   3 = Le Voile du Nord (Inventaire)  10 = Le Voile du Nord (Quiz) 11 = Après l'errance
//   4 = Le Ravin
//   6 = La Cédrière (hydratation)      7 = Rencontre avec l'Ours
//   8 = L'Extraction Finale
//
// RÈGLE ABSOLUE — nextSequence référence toujours l'ID cible, jamais l'index du tableau.
// Utiliser idVersIndex(id) pour convertir avant toute navigation React.
//
// Nomenclature vidéos : ChapitreN_NomDuChapitre[_Action].mp4
//   N  = numéro de chapitre narratif (0-6), le quiz n'a pas de vidéo
//   _Action = verbe/conséquence logique — JAMAIS la couleur du bouton (couleur = aléatoire)
//
// type: 'video' | 'quiz-connaissance'
// consequence: 'continuer' | 'fin-prematuree' | 'fin-jeu' | 'quiz-echec' | 'retour-debriefing'
// videoConsequence: vidéo de conséquence jouée après le vote
// nextSequence: ID de la séquence cible (voir idVersIndex)
// dureeTimer: durée du timer de vote en secondes
// sousTitres: sous-titres affichés pendant la vidéo [{temps, texte}]
// correct: true/false — uniquement sur les choix quiz-connaissance

export const SEQUENCES = [

  // ─── CHAPITRE 0 — Opération Jack Carter (intro / briefing) ─────────────────
  {
    id: 1,
    type: 'video',
    titre: 'Opération Jack Carter',
    dureeTimer: 65,
    video: '/assets/videos/Chapitre0_OperationJackCarter.mp4',
    choix: {
      rouge: {
        label: 'Consulter le sac de Jack',
        consequence: 'continuer',
        nextSequence: 2,   // → Inventaire de Jack
        energie: 0,
      },
      vert: {
        label: 'Entrer directement dans la forêt',
        consequence: 'continuer',
        nextSequence: 9,   // → Test de survie (quiz)
        energie: 0,
      },
    },
  },

  // ─── CHAPITRE 1 — Inventaire de Jack (accès via "Consulter le sac") ─────────
  {
    id: 2,
    type: 'video',
    titre: 'Inventaire de Jack',
    dureeTimer: 60,
    video: '/assets/videos/Chapitre1_InventaireDeJack.mp4',
    sousTitres: [
      { temps: 9,  texte: 'Bâtons de randonnée' },
      { temps: 17, texte: "Gourde d'eau" },
      { temps: 24, texte: 'Trousse de secours' },
      { temps: 34, texte: 'Lampe à torche' },
      { temps: 40, texte: 'Corde' },
      { temps: 50, texte: 'Boussole' },
    ],
    choix: {
      rouge: {
        label: "L'équipement est mémorisé",
        consequence: 'continuer',
        nextSequence: 3,   // → Le Voile du Nord
        energie: 0,
      },
      vert: {
        label: "On continue sans s'attarder",
        consequence: 'continuer',
        nextSequence: 3,   // → Le Voile du Nord
        energie: -5,
      },
    },
  },

  // ─── QUIZ — Test de survie (accès via "Entrer dans la forêt") ───────────────
  // La bonne réponse est obligatoire pour progresser.
  {
    id: 9,
    type: 'quiz-connaissance',
    titre: 'Test de survie',
    dureeTimer: 50,
    question: "Parmi ces combinaisons, laquelle contient exactement l'équipement vital de Jack Carter ?",
    choix: {
      rouge: {
        label: "Boussole, gourde d'eau, trousse de secours, corde",
        correct: true,
        consequence: 'continuer',
        nextSequence: 10,  // → Le Voile du Nord (branche Quiz — sans vérification du sac)
        energie: 0,
      },
      vert: {
        label: "Boussole, gourde d'eau, trousse de secours, lampe à torche",
        correct: false,
        consequence: 'quiz-echec',
        energie: -10,
      },
      bleu: {
        label: "Trousse de secours, gourde d'eau, drone télécommandé, GPS satellite",
        correct: false,
        consequence: 'quiz-echec',
        energie: -10,
      },
      jaune: {
        label: "Corde, boussole, cafetière à expresso, rollers tout-terrain",
        correct: false,
        consequence: 'quiz-echec',
        energie: -10,
      },
    },
  },

  // ─── CHAPITRE 2a — Le Voile du Nord (branche Inventaire) ───────────────────
  // Le joueur a vérifié le sac : il sait qu'il a la boussole et l'utilise.
  {
    id: 3,
    type: 'video',
    titre: 'Le Voile du Nord',
    dureeTimer: 45,
    video: '/assets/videos/Chapitre2_VoileDuNord.mp4',
    choix: {
      rouge: {
        label: 'Utiliser la boussole pour maintenir le cap',
        videoConsequence: '/assets/videos/Chapitre2_VoileDuNord_Boussole.mp4',
        consequence: 'continuer',
        nextSequence: 4,   // → Le Ravin
        energie: 0,
      },
    },
  },

  // ─── CHAPITRE 2b — Le Voile du Nord (branche Quiz) ──────────────────────────
  // Le joueur n'a pas vérifié son sac : quelle que soit sa réponse,
  // le manque de préparation entraîne obligatoirement l'errance.
  {
    id: 10,
    type: 'video',
    titre: 'Le Voile du Nord',
    dureeTimer: 30,
    video: '/assets/videos/Chapitre2_VoileDuNord.mp4',
    choix: {
      rouge: {
        label: 'Oui, j\'ai pris la boussole',
        videoConsequence: '/assets/videos/Chapitre2_VoileDuNord_Errance.mp4',
        consequence: 'continuer',
        nextSequence: 11,  // → Après l'errance
        energie: 0,
      },
      vert: {
        label: 'Non, je n\'ai pas de boussole',
        videoConsequence: '/assets/videos/Chapitre2_VoileDuNord_Errance.mp4',
        consequence: 'continuer',
        nextSequence: 11,  // → Après l'errance
        energie: 0,
      },
    },
  },

  // ─── APRÈS L'ERRANCE — Continuer ou rentrer ─────────────────────────────────
  // La mission est compromise par le manque de préparation.
  // "Continuer" applique une perte d'énergie et mène au Ravin.
  // "Rentrer" déclenche un Game Over immédiat.
  {
    id: 11,
    type: 'quiz-connaissance',
    titre: 'Continuer ou rentrer ?',
    dureeTimer: 45,
    question: 'La mission est compromise par le manque de préparation. Que décidez-vous ?',
    choix: {
      rouge: {
        label: 'Continuer vers le Ravin malgré tout',
        consequence: 'continuer',
        nextSequence: 4,   // → Le Ravin
        energie: -20,
      },
      vert: {
        label: 'Rentrer et abandonner la mission',
        consequence: 'fin-prematuree',
        energie: 0,
      },
    },
  },

  // ─── CHAPITRE 3 — Le Ravin ──────────────────────────────────────────────────
  // Sauter = retour débriefing immédiat (pas de vidéo)
  // Rappel  = descente sécurisée à la corde
  // Detour  = contourner par le flanc de la colline (-15)
  {
    id: 4,
    type: 'video',
    titre: 'Le Ravin',
    dureeTimer: 40,
    video: '/assets/videos/Chapitre3_LeRavin.mp4',
    choix: {
      rouge: {
        label: 'Sauter en espérant être amorti par la neige',
        consequence: 'retour-debriefing',
        energie: 0,
      },
      vert: {
        label: 'Utiliser la corde pour descendre en rappel',
        videoConsequence: '/assets/videos/Chapitre3_LeRavin_Rappel.mp4',
        consequence: 'continuer',
        nextSequence: 6,   // → La Cédrière
        energie: 0,
      },
      bleu: {
        label: 'Contourner par le flanc de la colline',
        videoConsequence: '/assets/videos/Chapitre3_LeRavin_Detour.mp4',
        consequence: 'continuer',
        nextSequence: 6,   // → La Cédrière
        energie: -15,
      },
    },
  },

  // ─── CHAPITRE 4 — La Cédrière (effort physique & hydratation) ───────────────
  // Les deux choix mènent à la Rencontre avec l'Ours (ID: 7).
  // Perte       = forcer la marche sans s'hydrater → fatigue accumulée (-15)
  // Hydratation = s'arrêter pour boire → récupération (+10)
  {
    id: 6,
    type: 'video',
    titre: 'La Cédrière',
    dureeTimer: 30,
    video: '/assets/videos/Chapitre4_LaCedriere.mp4',
    choix: {
      rouge: {
        label: "Continuer la marche sans s'arrêter",
        videoConsequence: '/assets/videos/Chapitre4_LaCedriere_Perte.mp4',
        consequence: 'continuer',
        nextSequence: 7,   // → Rencontre avec l'Ours
        energie: -15,
      },
      vert: {
        label: "S'arrêter pour boire et récupérer",
        videoConsequence: '/assets/videos/Chapitre4_LaCedriere_Hydratation.mp4',
        consequence: 'continuer',
        nextSequence: 7,   // → Rencontre avec l'Ours
        energie: 10,
      },
    },
  },

  // ─── CHAPITRE 5 — Rencontre avec l'Ours ─────────────────────────────────────
  // Immobile = rester calme, parler doucement (bon réflexe)
  // Panique  = fuite ou gestes brusques (mauvais réflexe → fin prématurée ou perte d'énergie)
  {
    id: 7,
    type: 'video',
    titre: "Rencontre avec l'Ours",
    dureeTimer: 30,
    video: '/assets/videos/Chapitre5_RencontreOurs.mp4',
    choix: {
      rouge: {
        label: 'Fuir en courant',
        videoConsequence: '/assets/videos/Chapitre5_RencontreOurs_Panique.mp4',
        consequence: 'fin-prematuree',
        energie: 0,
      },
      vert: {
        label: 'Rester immobile et parler doucement',
        videoConsequence: '/assets/videos/Chapitre5_RencontreOurs_Immobile.mp4',
        consequence: 'continuer',
        nextSequence: 8,   // → L'Extraction Finale
        energie: 0,
      },
      bleu: {
        label: "Gesticuler et crier pour l'effrayer",
        videoConsequence: '/assets/videos/Chapitre5_RencontreOurs_Panique.mp4',
        consequence: 'continuer',
        nextSequence: 8,   // → L'Extraction Finale
        energie: -20,
      },
      jaune: {
        label: "S'allonger par terre et ne plus bouger",
        videoConsequence: '/assets/videos/Chapitre5_RencontreOurs_Panique.mp4',
        consequence: 'continuer',
        nextSequence: 8,   // → L'Extraction Finale
        energie: -10,
      },
    },
  },

  // ─── CHAPITRE 6 — L'Extraction Finale ───────────────────────────────────────
  // RythmeSoutenu = progression régulière (bon)
  // Epuisement    = effort excessif ou abandon (mauvais)
  {
    id: 8,
    type: 'video',
    titre: "L'Extraction Finale",
    dureeTimer: 20,
    video: '/assets/videos/Chapitre6_ExtractionFinale.mp4',
    choix: {
      rouge: {
        label: "(Forcer l'allure)",
        videoConsequence: '/assets/videos/Chapitre6_ExtractionFinale_Epuisement.mp4',
        consequence: 'fin-jeu',
        energie: -20,
      },
      vert: {
        label: '(Rythme régulier, pauses)',
        videoConsequence: '/assets/videos/Chapitre6_ExtractionFinale_RythmeSoutenu.mp4',
        consequence: 'fin-jeu',
        energie: 0,
      },
      bleu: {
        label: '(Allumer un feu de signal)',
        videoConsequence: '/assets/videos/Chapitre6_ExtractionFinale_RythmeSoutenu.mp4',
        consequence: 'fin-jeu',
        energie: 0,
      },
      jaune: {
        label: '(Laisser la randonneuse)',
        videoConsequence: '/assets/videos/Chapitre6_ExtractionFinale_Epuisement.mp4',
        consequence: 'fin-jeu',
        energie: -100,
      },
    },
  },

]

// Convertit un ID de séquence en index dans le tableau SEQUENCES.
// À utiliser partout où nextSequence est transformé en index de navigation.
export function idVersIndex(id) {
  const idx = SEQUENCES.findIndex(s => s.id === id)
  if (idx === -1) {
    console.error(`[scenario] idVersIndex: ID ${id} introuvable dans SEQUENCES`)
    return 0
  }
  return idx
}

// Calcule la fin selon l'énergie restante du groupe.
export function calculerFin(energie) {
  if (energie > 50) return 'heros'
  if (energie >= 20) return 'survivant'
  return 'abandon'
}
