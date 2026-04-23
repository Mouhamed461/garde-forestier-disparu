// type : "succes"  → continue sans pénalité
//        "malus"   → continue avec perte d'énergie
//        "mort"    → fin prématurée, mission terminée

const sequences = {

  1: {
    description: "Jake Carter, jeune garde stagiaire, reçoit sa première mission. Un randonneur n'est pas rentré depuis hier soir. Chaque minute compte.",
    question: "Comment Jake doit-il commencer sa progression ?",
    choix: {
      rouge: "Entrer immédiatement sans vérifier son équipement",
      vert:  "Consulter le cahier de survie et préparer son itinéraire",
      bleu:  "Appeler les secours avant d'entrer pour signaler sa position",
      jaune: "Attendre le lendemain pour avoir plus de lumière",
    },
    consequences: {
      rouge: {
        texte: "Jake entre sans vérifier son équipement. Il devra d'abord prouver qu'il connaît les objets essentiels pour survivre.",
        type: "malus",
        energieDelta: 0,
      },
      vert: {
        texte: "Jake consulte son cahier, identifie les objets vitaux et planifie son itinéraire. Il entre en forêt avec une vision claire.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Les secours prennent note mais ne peuvent pas intervenir sans localisation précise. Jake perd du temps précieux.",
        type: "malus",
        energieDelta: -10,
      },
      jaune: {
        texte: "Attendre signifie perdre des heures critiques. Le randonneur est en danger et chaque minute compte.",
        type: "malus",
        energieDelta: -10,
      },
    },
  },

  2: {
    description: "Jake est entré en forêt sans vérifier son sac. Il doit prouver qu'il connaît les bases avant d'aller plus loin. Un mauvais choix d'équipement peut coûter une vie.",
    question: "Quels sont les 3 objets essentiels pour survivre en forêt ?",
    choix: {
      rouge: "Couteau · Briquet · GPS",
      vert:  "Boussole · Gourde · Cahier de survie",
      bleu:  "Radio · Couverture · Corde",
      jaune: "Allumettes · Carte · Couteau",
    },
    consequences: {
      rouge: {
        texte: "Faux. Le GPS est peu fiable en forêt dense. Sans boussole ni cahier, Jake tourne en rond. Retour au briefing.",
        type: "malus",
        energieDelta: -5,
      },
      vert: {
        texte: "Correct ! Boussole, gourde et cahier de survie — les 3 essentiels identifiés. Jake peut entrer en forêt.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Utiles en campement mais insuffisants pour progresser en forêt dense. Retour au briefing.",
        type: "malus",
        energieDelta: -5,
      },
      jaune: {
        texte: "Sans boussole ni gourde, la mission est compromise avant même de commencer. Retour au briefing.",
        type: "malus",
        energieDelta: -5,
      },
    },
  },

  3: {
    description: "Le brouillard s'installe entre les arbres. Jake ne voit pas à dix mètres devant lui. Il doit choisir comment progresser sans se perdre.",
    question: "Jack est dans la forêt. Comment doit-il progresser ?",
    choix: {
      rouge: "Avancer au hasard en espérant trouver",
      vert:  "Utiliser la boussole pour maintenir le cap",
      bleu:  "S'arrêter et attendre que le brouillard se lève",
      jaune: "Rebrousser chemin par sécurité",
    },
    consequences: {
      rouge: {
        texte: "Jack s'épuise en tournant en rond pendant 2 heures. Il perd de l'énergie et du temps précieux.",
        type: "malus",
        energieDelta: -20,
      },
      vert: {
        texte: "Jack maintient son cap malgré le brouillard. Il progresse efficacement vers le randonneur.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Jack attend que le brouillard se lève. Du temps précieux est perdu.",
        type: "malus",
        energieDelta: -10,
      },
      jaune: {
        texte: "Jack recule et perd du terrain. Le randonneur est toujours en danger.",
        type: "malus",
        energieDelta: -15,
      },
    },
  },

  4: {
    description: "Une rivière gonflée barre le chemin. Le courant est violent. Les traces du randonneur s'arrêtent ici — il a traversé d'une façon ou d'une autre.",
    question: "Comment Jake doit-il traverser ?",
    choix: {
      rouge: "Traverser en force, tenu par une corde",
      vert:  "Longer la berge jusqu'à trouver un gué",
      bleu:  "Construire un radeau avec des branches",
      jaune: "Faire demi-tour et chercher un pont",
    },
    consequences: {
      rouge: {
        texte: "Jake lutte contre le courant. Il passe, mais sort épuisé, trempé, une partie de son équipement emportée par l'eau.",
        type: "malus",
        energieDelta: -20,
      },
      vert: {
        texte: "Plus en aval, Jake trouve un passage à gué peu profond. Il traverse sans difficulté, sec et efficace.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Le radeau tient à peine. La traversée prend deux heures. Jake arrive à l'autre rive fatigué et en retard.",
        type: "malus",
        energieDelta: -5,
      },
      jaune: {
        texte: "Le détour par le pont rallonge la route d'une heure. La nuit commence à tomber. Chaque minute perdue compte.",
        type: "malus",
        energieDelta: -15,
      },
    },
  },

  5: {
    description: "Les empreintes s'arrêtent au pied d'une paroi de granite. Jake lève les yeux — la face est raide, sans prise visible. Le randonneur est monté par ici.",
    question: "Comment Jake doit-il progresser ?",
    choix: {
      rouge: "Escalader la paroi à mains nues",
      vert:  "Analyser les indices avec le cahier de survie",
      bleu:  "Appeler le randonneur à voix haute",
      jaune: "Contourner par le flanc de la colline",
    },
    consequences: {
      rouge: {
        texte: "Jake glisse à mi-hauteur et chute lourdement. Fractures, perte de connaissance. La mission s'arrête ici.",
        type: "mort",
        energieDelta: 0,
      },
      vert: {
        texte: "Le cahier révèle un passage caché derrière un éboulis. Jake contourne par une sente invisible à l'œil nu.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Une voix faible répond au loin. Jake localise le randonneur grâce au son — mais il s'est inutilement épuisé.",
        type: "malus",
        energieDelta: -5,
      },
      jaune: {
        texte: "Le détour est long, mais Jake rejoint le sommet sans risque. Une heure de retard, mais il arrive entier.",
        type: "malus",
        energieDelta: -10,
      },
    },
  },

  6: {
    description: "Il est là, appuyé contre un pin, les lèvres bleues. Tibia fracturé, début d'hypothermie. Il est conscient mais ne peut pas marcher. Il reste trois heures de lumière.",
    question: "Comment Jake doit-il le prendre en charge ?",
    choix: {
      rouge: "Le porter sur l'épaule immédiatement",
      vert:  "Confectionner une attelle et une civière",
      bleu:  "Rester sur place et envoyer un signal",
      jaune: "Le forcer à marcher malgré la douleur",
    },
    consequences: {
      rouge: {
        texte: "Sans immobilisation, le transport aggrave la fracture. Le randonneur crie de douleur à chaque pas. Jake s'épuise.",
        type: "malus",
        energieDelta: -20,
      },
      vert: {
        texte: "L'attelle stabilise le membre. La civière improvisée permet un transport sûr. Le randonneur est en relative sécurité.",
        type: "succes",
        energieDelta: 0,
      },
      bleu: {
        texte: "Les secours reçoivent le signal mais mettront du temps. Le froid continue de progresser pendant l'attente.",
        type: "malus",
        energieDelta: -5,
      },
      jaune: {
        texte: "Marcher sur un tibia fracturé est insupportable. Jake doit l'arrêter après cent mètres, la situation empire.",
        type: "malus",
        energieDelta: -15,
      },
    },
  },

  7: {
    description: "La station est à deux heures. Jake a le randonneur avec lui. Ses jambes tremblent, les ressources s'amenuisent. La fin est en vue, mais rien n'est encore joué.",
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
        texte: "Jake abandonne l'homme blessé dans le froid. Le randonneur ne survivra pas à la nuit. Une décision que personne n'oubliera.",
        type: "malus",
        energieDelta: -100,
      },
    },
  },

}

export default sequences
