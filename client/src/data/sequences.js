// type : "succes"  → continue sans pénalité
//        "malus"   → continue avec perte d'énergie
//        "mort"    → fin prématurée, mission terminée

const sequences = {

  1: {
    description: "",
    question: "",
    choix: {
      rouge: "Consulter le sac de Jack",
      vert:  "Entrer directement dans la forêt",
    },
    consequences: {
      rouge: {
        texte: "Jake prend le temps de vérifier son sac à dos, il passe en revue son matériel et consulte le cahier de survie pour ne rien oublier.",
        type: "succes",
        energieDelta: 0,
      },
      vert: {
        texte: "Pressé par l'urgence, Jake s'enfonce immédiatement dans les bois sans vérifier son paquetage, il réalise vite qu'il ne sait plus s'il a tout le nécessaire.",
        type: "malus",
        energieDelta: 0,
      },
    },
  },

  2: {
    description: "",
    question: "",
    choix: {
      rouge: "L'équipement est mémorisé",
      vert:  "On continue sans s'attarder",
    },
    consequences: {
      rouge: {
        texte: "L'équipement est passé en revue. Jake entre en forêt avec une connaissance claire de son matériel.",
        type: "succes",
        energieDelta: 0,
      },
      vert: {
        texte: "Jake repart sans mémoriser tout l'équipement. Il avancera avec moins de certitudes.",
        type: "malus",
        energieDelta: -5,
      },
    },
  },

  3: {
    description: "Le brouillard s'installe entre les arbres, épais et silencieux. Jake ne distingue plus rien à dix mètres devant lui. Il lui faut impérativement trouver un moyen de maintenir le cap avant de se perdre définitivement.",
    question: "",
    choix: {
      rouge: "Utiliser la boussole",
      vert:  "Avancer sans boussole",
    },
    consequences: {
      rouge: {
        texte: "Jake sort sa boussole et maintient le cap malgré le brouillard. Il progresse efficacement vers Jack Carter.",
        type: "succes",
        energieDelta: 0,
      },
      vert: {
        texte: "Sans boussole, Jake perd ses repères dans le brouillard et tourne en rond. Il perd du temps précieux et une partie de son énergie.",
        type: "malus",
        energieDelta: -20,
      },
    },
  },

  4: {
    description: "Un ravin s'ouvre en travers du chemin. La paroi descend à pic sur plusieurs mètres. Les traces de Jack s'arrêtent au bord. Il a forcément trouvé un moyen de passer.",
    question: "Comment Jake franchit-il le ravin ?",
    choix: {
      rouge: "Sauter en espérant être amorti par la neige",
      vert:  "Utiliser la corde pour descendre en rappel",
      bleu:  "Contourner par le flanc de la colline",
    },
    consequences: {
      rouge: {
        texte: "Jake saute. La neige n'amortit pas assez. Chute violente, entorse grave. Jake ne peut pas poursuivre la mission seul. Retour au débriefing.",
        type: "mort",
        energieDelta: 0,
      },
      vert: {
        texte: "Jake accroche la corde à un arbre solide et descend en rappel. Il touche le fond du ravin intact, prêt à continuer.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Le contournement rallonge le trajet d'une heure. Jake arrive de l'autre côté épuisé mais entier. Chaque minute perdue compte.",
        type: "malus",
        energieDelta: -15,
      },
    },
  },

  5: {
    description: "Le passage du ravin est inévitable. La paroi descend à pic dans l'obscurité. Jake doit choisir comment aborder la descente.",
    question: "Comment Jake doit-il descendre le ravin ?",
    choix: {
      rouge: "Escalader la paroi à mains nues, sans corde",
      vert:  "Utiliser la corde pour sécuriser la descente",
      bleu:  "Descendre dans l'obscurité sans lampe à torche",
      jaune: "Contourner par le flanc de la colline",
    },
    consequences: {
      rouge: {
        texte: "Sans corde de sécurité, Jake glisse à mi-hauteur et chute lourdement. La mission s'arrête ici.",
        type: "mort",
        energieDelta: 0,
      },
      vert: {
        texte: "La corde sécurise chaque prise. Jake descend lentement mais sûrement. Il rejoint le fond du ravin intact.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Sans lampe, Jake rate une prise dans le noir. Plusieurs chutes, équipement endommagé — il perd un temps précieux et 30 % d'énergie.",
        type: "malus",
        energieDelta: -30,
      },
      jaune: {
        texte: "Le détour est long mais sûr. Jake arrive de l'autre côté épuisé et en retard sur son itinéraire.",
        type: "malus",
        energieDelta: -10,
      },
    },
  },

  6: {
    description: "En traversant la cédrière, Jake tombe face à face avec un ours. L'animal s'arrête, le fixe. Chaque geste compte.",
    question: "Que fait Jake face à l'ours ?",
    choix: {
      rouge: "Fuir en courant",
      vert:  "Rester immobile et parler doucement",
      bleu:  "Gesticuler et crier pour l'effrayer",
      jaune: "S'allonger par terre et ne plus bouger",
    },
    consequences: {
      rouge: {
        texte: "Fuir provoque l'instinct de chasse de l'ours. La poursuite est fatale. La mission s'arrête ici.",
        type: "mort",
        energieDelta: 0,
      },
      vert: {
        texte: "Rester calme désarme la situation. L'ours s'éloigne lentement. Jake peut reprendre sa route.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Crier agresse l'ours. Il charge brièvement avant de reculer. Jake s'en sort mais perd beaucoup d'énergie.",
        type: "malus",
        energieDelta: -20,
      },
      jaune: {
        texte: "S'allonger peut fonctionner pour un grizzly, pas ici. L'ours renifle Jake longuement avant de partir. Il s'en sort de justesse.",
        type: "malus",
        energieDelta: -10,
      },
    },
  },

  9: {
    description: "Avant d'entrer en forêt, prouvez que vous connaissez exactement l'équipement vital du sac de Jack.",
    question: "Parmi ces combinaisons, laquelle contient exactement l'équipement vital de Jack Carter ?",
    choix: {
      rouge: "Boussole, gourde d'eau, trousse de secours, corde",
      vert:  "Boussole, lampe à torche, bâtons de randonnée, gourde",
      bleu:  "Gourde d'eau, trousse de secours, bâtons de randonnée, lampe à torche",
      jaune: "Corde, bâtons de randonnée, lampe à torche, boussole",
    },
    consequences: {
      rouge: {
        texte: "Exact. Boussole, gourde d'eau, trousse de secours et corde — les quatre éléments vitaux du sac. L'équipe entre en forêt.",
        type: "succes",
        energieDelta: 0,
      },
      vert: {
        texte: "Proche, mais la lampe à torche et les bâtons ne remplacent pas la trousse de secours ni la corde. Retour au débriefing.",
        type: "malus",
        energieDelta: -10,
      },
      bleu: {
        texte: "Sans boussole, impossible de s'orienter en forêt dense. La trousse ne suffit pas sans navigation. Retour au débriefing.",
        type: "malus",
        energieDelta: -10,
      },
      jaune: {
        texte: "Il manque la gourde d'eau et la trousse de secours — deux éléments vitaux pour survivre. Retour au débriefing.",
        type: "malus",
        energieDelta: -10,
      },
    },
  },

  7: {
    description: "La station est à deux heures. Jake a la randonneuse avec lui. Ses jambes tremblent, les ressources s'amenuisent. La fin est en vue, mais rien n'est encore joué.",
    question: "Comment Jake gère-t-il ces deux dernières heures ?",
    choix: {
      rouge: "Forcer l'allure pour arriver avant la nuit",
      vert:  "Rythme régulier avec pauses toutes les 20 min",
      bleu:  "Allumer un grand feu de signalisation",
      jaune: "Laisser le randonneur et courir chercher des secours",
    },
    consequences: {
      rouge: {
        texte: "Jake s'effondre d'épuisement à vingt minutes de la station. Les secours doivent sortir pour les récupérer tous les deux.",
        type: "malus",
        energieDelta: -20,
      },
      vert: {
        texte: "Jake arrive à la station épuisé mais debout. Le randonneur est pris en charge aussitôt. Mission accomplie.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "L'hélicoptère repère le feu en quinze minutes. Évacuation médicale immédiate. Jake a tout géré.",
        type: "succes",
        energieDelta: 0,
      },
      jaune: {
        texte: "Jake abandonne la blessée dans le froid. La randonneuse ne survivra pas à la nuit. Une décision que personne n'oubliera.",
        type: "malus",
        energieDelta: -100,
      },
    },
  },

}

export default sequences
