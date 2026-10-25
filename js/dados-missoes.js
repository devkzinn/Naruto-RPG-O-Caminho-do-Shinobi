/* Dados estáticos de missões: contratos, arcos de história, rotinas, operações, crises e designações. */

// Missões: [rank, nome, descrição, inimigo final, ryo, xp]
const MS = [
  [
    "D",
    "Capturar o gato Tora",
    "A esposa do Daimyo perdeu o gato… de novo.",
    "ladrao",
    60,
    25,
  ],
  [
    "D",
    "Capinar o jardim da vila",
    "Um serviço simples, mas algo se mexe nos arbustos.",
    "lobo",
    45,
    20,
  ],
  [
    "C",
    "Escoltar o construtor Tazuna",
    "Bandidos cercam a estrada para a Vila da Onda.",
    "bandidos",
    150,
    50,
  ],
  [
    "C",
    "Caçar o ninja renegado",
    "Um renegado foi visto perto da fronteira.",
    "renegado",
    180,
    60,
  ],
  [
    "B",
    "Infiltrar a base do Espadachim",
    "Vá em silêncio. Se falhar, a vila não ajudará.",
    "kiri",
    350,
    120,
  ],
  [
    "B",
    "Duelo na Ponte da Névoa",
    "Zabuza empunha sua espada gigante sob a neblina.",
    "zabuza",
    500,
    180,
  ],
  [
    "A",
    "Enfrentar a ameaça da Capa Negra",
    "Uma organização misteriosa avança sobre a vila.",
    "akat",
    700,
    250,
  ],
  [
    "A",
    "Cobra na Floresta da Morte",
    "Orochimaru espreita durante o exame. Há vidas em jogo.",
    "oro",
    950,
    330,
  ],
  [
    "S",
    "A Sombra de Kisame",
    "Um membro da Akatsuki foi visto perto de Konoha.",
    "kisame",
    1400,
    450,
  ],
  [
    "S",
    "A Invasão de Pain",
    "Konoha está sob ataque. Só você pode detê-lo.",
    "pain",
    2600,
    800,
  ],
  [
    "D",
    "Entregar remédios ao hospital",
    "Leve uma caixa de medicamentos sem danificar os frascos.",
    "",
    40,
    18,
    "deliver",
  ],
  [
    "D",
    "Recuperar a bolsa do mensageiro",
    "O mensageiro perdeu seus documentos entre as vielas.",
    "",
    55,
    24,
    "retrieve",
  ],
  [
    "C",
    "Escoltar a equipe de obras",
    "Proteja os trabalhadores que reparam a estrada para o País do Fogo.",
    "",
    170,
    58,
    "escort",
  ],
  [
    "C",
    "Levar uma mensagem ao País do Vento",
    "Uma carta urgente precisa chegar aos aliados de Suna.",
    "",
    185,
    62,
    "deliver",
  ],
  [
    "B",
    "Recuperar o pergaminho dos selos",
    "Um pergaminho desapareceu durante o transporte. Traga-o de volta à Torre.",
    "",
    380,
    130,
    "retrieve",
  ],
  [
    "B",
    "Resgatar um batedor na Floresta da Morte",
    "O batedor enviado para observar os movimentos do Som não retornou.",
    "",
    440,
    155,
    "rescue",
  ],
  [
    "A",
    "Proteger a equipe médica de Konoha",
    "Acompanhe os médicos enquanto eles atendem feridos fora das muralhas.",
    "",
    780,
    275,
    "protect",
  ],
  [
    "S",
    "Retirar civis durante o ataque a Konoha",
    "Ajude os moradores a alcançar um abrigo seguro em meio ao caos.",
    "",
    1800,
    520,
    "rescue",
  ],
  [
    "D",
    "Levar suprimentos ao Time 7",
    "Kakashi aguarda um lote de bandagens e provisões no caminho do País das Ondas.",
    "",
    65,
    28,
    "deliver",
  ],
  [
    "D",
    "Recuperar o pergaminho de Naruto",
    "Um pergaminho de treino caiu perto do campo de exercícios.",
    "",
    55,
    23,
    "retrieve",
  ],
  [
    "C",
    "Proteger o comboio de comerciantes",
    "Escolte comerciantes pela estrada onde foram vistos ninjas do Som.",
    "som",
    210,
    72,
  ],
  [
    "C",
    "Recuperar o pergaminho do Exame Chunin",
    "Uma equipe perdeu um pergaminho na Floresta da Morte. Traga-o ao posto de controle.",
    "",
    195,
    68,
    "retrieve",
  ],
  [
    "B",
    "Investigar o esconderijo do Som",
    "Siga os rastros deixados pelos subordinados de Orochimaru.",
    "quarteto",
    460,
    160,
  ],
  [
    "B",
    "Ajudar a equipe de resgate",
    "Encontre os rastros da equipe que partiu atrás de Sasuke.",
    "kimimaro",
    520,
    190,
  ],
  [
    "A",
    "Resgatar o Kazekage Gaara",
    "A Akatsuki levou Gaara. Alcance o esconderijo e impeça a fuga de Deidara.",
    "deidara",
    1100,
    390,
  ],
  [
    "A",
    "Deter a dupla imortal",
    "Hidan e Kakuzu foram vistos atacando viajantes perto da fronteira.",
    "kakuzu",
    1250,
    420,
  ],
  [
    "S",
    "Invadir o esconderijo da Akatsuki",
    "Reúna informações e enfrente Sasori antes que ele mude de esconderijo.",
    "sasori",
    1900,
    610,
  ],
  [
    "S",
    "Conter o avanço do Quarteto do Som",
    "Uma última equipe inimiga tenta bloquear a retirada dos aliados.",
    "quarteto",
    2100,
    680,
  ],
];

const NEED = { D: 1, C: 1, B: 2, A: 3, S: 3 },
  LVN = { D: 1, C: 3, B: 6, A: 10, S: 15 },
  MSK = "DCBAS";

const STORY_ARCS = [
  {
    id: "ondas",
    title: "Arco 1 · País das Ondas",
    summary: "Escolta, investigação, Haku e Zabuza.",
    unlock: { rank: 1, level: 3, missions: 1 },
    consequence:
      "A Ponte Naruto foi concluída; Tazuna e os moradores lembram quem os protegeu.",
    missions: [
      {
        rank: "C",
        title: "A escolta de Tazuna",
        description: "Leve o construtor ao País das Ondas e proteja a equipe.",
        enemy: "bandidos",
        reward: 180,
        xp: 60,
        scene: [
          "Bandidos cercam a carroça na estrada para a ponte.",
          [
            ["Manter a carroça no centro da formação", "tai"],
            ["Localizar os bandidos antes que ataquem", "int"],
            ["Afastá-los com uma técnica de chakra", "nin"],
          ],
        ],
      },
      {
        rank: "C",
        title: "Rastros de Gato",
        description:
          "Investigue quem financia os ataques contra os trabalhadores.",
        goal: "retrieve",
        reward: 140,
        xp: 48,
        scene: [
          "Um informante deixou documentos escondidos perto do cais.",
          [
            ["Examinar as marcas na margem", "int"],
            ["Seguir o mensageiro sem ser visto", "vel"],
            ["Convencer os trabalhadores a falar", "car"],
          ],
        ],
      },
      {
        rank: "B",
        title: "Os espelhos de Haku",
        description: "Enfrente o caçador mascarado que protege Zabuza.",
        enemy: "haku",
        reward: 240,
        xp: 85,
        scene: [
          "A névoa fecha a passagem e agulhas surgem de todos os lados.",
          [
            ["Ler o movimento dos reflexos", "int"],
            ["Proteger Tazuna e avançar", "tai"],
            ["Localizar Haku pelo chakra", "nin"],
          ],
        ],
      },
      {
        rank: "B",
        title: "O Demônio da Névoa",
        description: "Impeça Zabuza de voltar a ameaçar a ponte.",
        enemy: "zabuza",
        reward: 300,
        xp: 110,
        scene: [
          "Zabuza ergue a Kubikiribōchō e prepara um golpe devastador.",
          [
            ["Manter a guarda e esperar a abertura", "tai"],
            ["Interromper a concentração com ninjutsu", "nin"],
            ["Contornar a névoa com velocidade", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "ecos-ponte",
    title: "Arco 2 · Ecos da Ponte",
    summary:
      "A reconstrução revela registros adulterados e moradores divididos sobre o que fazer.",
    unlock: { rank: 1, level: 3, missions: 3 },
    consequence:
      "Os trabalhadores recuperam os registros e decidem como reconstruir a confiança sem apagar o que viveram.",
    missions: [
      {
        rank: "C",
        title: "O livro de contas molhado",
        description:
          "Ajude Tazuna a recuperar o livro de pagamentos levado pela maré antes que a tinta desapareça.",
        goal: "retrieve",
        loc: "ponte",
        reward: 180,
        xp: 65,
        scene: [
          "Uma caixa de documentos se soltou durante a noite. O livro de pagamentos ficou preso entre as vigas, e há marcas recentes de alguém que tentou alcançá-lo antes de vocês.",
          [
            ["Examinar as marcas e escolher uma passagem segura", "int"],
            ["Usar chakra para firmar as vigas", "nin"],
            ["Descer com uma corda enquanto a equipe dá cobertura", "vel"],
          ],
        ],
      },
      {
        rank: "C",
        title: "Nomes riscados",
        description:
          "Descubra por que alguns trabalhadores foram removidos da lista de pagamento.",
        goal: "investigation",
        loc: "onda",
        reward: 210,
        xp: 72,
        scene: [
          "Três nomes foram riscados, mas os próprios trabalhadores dizem que receberam. Um deles pede que ninguém publique a lista antes de confirmar o que aconteceu.",
          [
            ["Comparar cópias e ouvir cada trabalhador em separado", "int"],
            ["Pedir que Tazuna explique a contabilidade da obra", "car"],
            ["Seguir o mensageiro que entregou a lista", "vel"],
          ],
        ],
      },
      {
        rank: "B",
        title: "A ponte para amanhã",
        description:
          "Proteja uma reunião entre trabalhadores e moradores enquanto eles decidem o destino dos registros.",
        goal: "protect",
        loc: "ponte",
        reward: 270,
        xp: 95,
        scene: [
          "A discussão esquenta quando chega um bilhete anônimo exigindo que os documentos sejam queimados. Ninguém sabe quem o deixou, e há crianças entre os curiosos.",
          [
            ["Afastar os curiosos e manter uma saída livre", "tai"],
            ["Organizar turnos de fala e verificar o bilhete", "car"],
            ["Observar os telhados sem interromper a reunião", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "exame-sinos",
    title: "Arco 3 · Os sinos antes do exame",
    summary:
      "Uma prova de seleção é ameaçada por sabotagens discretas e uma equipe rival em pânico.",
    unlock: { rank: 1, level: 6, missions: 5 },
    consequence:
      "O exame segue adiante com novas medidas de segurança; os candidatos lembram quem os tratou como aliados, não como obstáculos.",
    missions: [
      {
        rank: "C",
        title: "O pergaminho trocado",
        description:
          "Encontre o pergaminho de inscrição que desapareceu durante os preparativos do exame.",
        goal: "retrieve",
        loc: "exame",
        reward: 220,
        xp: 78,
        scene: [
          "O pergaminho reaparece dentro de uma bolsa que não pertence a nenhum candidato. A tinta do selo está fresca, embora a assinatura seja antiga.",
          [
            ["Comparar o selo com os registros da Academia", "int"],
            ["Procurar resíduos de chakra no papel", "nin"],
            ["Perguntar aos candidatos sem acusar ninguém", "car"],
          ],
        ],
      },
      {
        rank: "B",
        title: "O teste que não estava no mapa",
        description:
          "Localize uma equipe de genin que se perdeu após seguir marcas falsas na floresta.",
        goal: "rescue",
        loc: "exame",
        reward: 290,
        xp: 100,
        scene: [
          "As marcas levam a uma área fora do percurso oficial. Há sinais de luta, mas nenhum dos candidatos quer abandonar o colega ferido.",
          [
            ["Rastrear o caminho sem deixar novas marcas", "vel"],
            ["Estabilizar o ferido e combinar uma retirada", "int"],
            ["Usar chakra para sinalizar a equipe de apoio", "nin"],
          ],
        ],
      },
      {
        rank: "B",
        title: "Os sinos ao amanhecer",
        description:
          "Impeça uma sabotagem durante a abertura do exame sem transformar os candidatos em suspeitos.",
        goal: "protect",
        loc: "exame",
        reward: 340,
        xp: 118,
        scene: [
          "Pouco antes do amanhecer, os sinos de sinalização começam a tocar fora de ordem. Os candidatos correm para lados diferentes, convencidos de que a prova já começou.",
          [
            ["Encontrar o mecanismo e interromper o sinal", "int"],
            ["Reunir os candidatos e acalmá-los", "car"],
            ["Subir pelas árvores para vigiar os perímetros", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "tratado-suna",
    title: "Arco 4 · O tratado de Suna",
    summary:
      "Uma missão diplomática une Konoha e Suna pouco antes de uma ameaça atingir o Kazekage.",
    unlock: { rank: 2, level: 9, missions: 8 },
    consequence:
      "Konoha e Suna compartilham alertas e rotas de emergência; uma ameaça ainda sem rosto continua à espreita.",
    missions: [
      {
        rank: "B",
        title: "O mensageiro sem bandeira",
        description:
          "Escolte um mensageiro ferido até Suna e descubra por que ele escondeu o símbolo de sua vila.",
        goal: "escort",
        loc: "fronteira",
        reward: 380,
        xp: 135,
        scene: [
          "O mensageiro carrega um mapa com o selo de Suna raspado. Ele afirma que não está fugindo de ninguém, mas insiste para que a rota não passe por postos oficiais.",
          [
            ["Perguntar o que ele teme antes de escolher a rota", "car"],
            ["Examinar o mapa em busca de alterações", "int"],
            ["Avançar por um caminho discreto com cobertura", "vel"],
          ],
        ],
      },
      {
        rank: "A",
        title: "Duas cópias do mesmo tratado",
        description:
          "Investigue documentos diplomáticos que atribuem ordens opostas ao Kazekage.",
        goal: "investigation",
        loc: "areia",
        reward: 440,
        xp: 155,
        scene: [
          "As duas cópias têm o mesmo selo, mas uma delas ordena que a patrulha recue. A outra diz para avançar. Ambas foram autenticadas em vilas diferentes na mesma manhã.",
          [
            ["Comparar a composição da tinta e os horários", "int"],
            ["Perguntar quem teve acesso aos selos", "car"],
            ["Rastrear os mensageiros que cruzaram a fronteira", "vel"],
          ],
        ],
      },
      {
        rank: "A",
        title: "O conselho sob cerco",
        description:
          "Proteja a reunião entre os líderes locais quando uma emboscada tenta silenciar os dois lados.",
        goal: "protect",
        loc: "areia",
        reward: 520,
        xp: 180,
        scene: [
          "Fragmentos de argila endurecida caem no pátio. Os guardas querem fechar todas as saídas, mas um dos conselheiros não voltou da ronda.",
          [
            ["Abrir uma rota protegida para civis e conselheiros", "int"],
            ["Conter a ameaça sem abandonar os feridos", "tai"],
            ["Coordenar os guardas para cobrir os telhados", "car"],
          ],
        ],
      },
    ],
  },
  {
    id: "kazekage",
    title: "Arco 5 · Resgate do Kazekage",
    summary: "Resgate Gaara e enfrente a ameaça da Akatsuki.",
    unlock: { rank: 2, level: 8, missions: 6 },
    consequence:
      "Gaara retorna a Suna e a aliança entre as vilas se fortalece.",
    missions: [
      {
        rank: "A",
        title: "Rastro da Akatsuki",
        description: "Siga os rastros dos sequestradores até o esconderijo.",
        goal: "retrieve",
        reward: 420,
        xp: 145,
        scene: [
          "Marcas de chakra levam a uma trilha estreita na fronteira.",
          [
            ["Analisar os rastros antes de avançar", "int"],
            ["Seguir o grupo sem ser visto", "vel"],
            ["Pedir que a equipe vigie as rotas", "car"],
          ],
        ],
      },
      {
        rank: "A",
        title: "A arte da explosão",
        description: "Impeça Deidara de fugir com o Kazekage.",
        enemy: "deidara",
        reward: 520,
        xp: 180,
        scene: [
          "Deidara sobrevoa o esconderijo enquanto prepara argila explosiva.",
          [
            ["Acompanhar o padrão das explosões", "int"],
            ["Aproximar-se antes que ele decole", "vel"],
            ["Proteger os aliados do impacto", "tai"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O esconderijo das marionetes",
        description: "Derrote Sasori e liberte Gaara.",
        enemy: "sasori",
        reward: 680,
        xp: 230,
        scene: [
          "Sasori revela suas marionetes e bloqueia a passagem até Gaara.",
          [
            ["Observar os fios que controlam as marionetes", "int"],
            ["Destruir as armas com um ataque preciso", "tai"],
            ["Procurar uma abertura com ninjutsu", "nin"],
          ],
        ],
      },
    ],
  },
  {
    id: "sasuke",
    title: "Arco 6 · Resgate de Sasuke",
    summary: "Montagem da equipe, perseguição e confrontos em sequência.",
    unlock: { rank: 2, level: 12, missions: 8 },
    consequence:
      "Sasuke não desaparece da história: o desfecho do Vale do Fim fica registrado permanentemente.",
    missions: [
      {
        rank: "B",
        title: "Rastrear o grupo do Som",
        description: "Encontre os rastros da equipe que levou Sasuke.",
        goal: "rescue",
        reward: 320,
        xp: 110,
        scene: [
          "Marcas de sandálias e chakra se dividem perto da fronteira.",
          [
            ["Seguir o rastro mais recente", "vel"],
            ["Pedir que a equipe cubra as rotas laterais", "car"],
            ["Ler os resíduos de chakra", "nin"],
          ],
        ],
      },
      {
        rank: "B",
        title: "Bloqueio do Quarteto do Som",
        description:
          "Abra caminho para que a equipe de resgate continue a perseguição.",
        enemy: "quarteto",
        reward: 380,
        xp: 135,
        scene: [
          "O Quarteto fecha a passagem e prepara uma barreira.",
          [
            ["Dividir funções com os aliados", "int"],
            ["Romper a linha antes que se feche", "tai"],
            ["Encontrar uma rota pela mata", "vel"],
          ],
        ],
      },
      {
        rank: "A",
        title: "A última barreira",
        description: "Supere o guardião que protege a rota até Sasuke.",
        enemy: "kimimaro",
        reward: 480,
        xp: 170,
        scene: [
          "Kimimaro bloqueia o desfiladeiro e seus ossos viram lâminas.",
          [
            ["Manter distância e estudar os movimentos", "int"],
            ["Proteger os aliados durante o avanço", "tai"],
            ["Atacar antes que ele complete a formação", "vel"],
          ],
        ],
      },
      {
        rank: "A",
        title: "Confronto no Vale do Fim",
        description:
          "Alcance Sasuke e decida o resultado desta etapa da perseguição.",
        enemy: "sasukeStory",
        reward: 560,
        xp: 200,
        scene: [
          "Sasuke aguarda no vale, decidido a seguir sozinho.",
          [
            ["Chamá-lo para voltar à equipe", "car"],
            ["Desarmar sua postura com um movimento preciso", "vel"],
            ["Enfrentar seu poder de frente", "nin"],
          ],
        ],
      },
    ],
  },
  {
    id: "konohadefesa",
    title: "Arco 7 · Ameaças à Vila",
    summary: "Akatsuki, resgate de aliados e defesa de Konoha.",
    unlock: { rank: 3, level: 18, missions: 20 },
    consequence:
      "A defesa de Konoha e a ameaça da Akatsuki ficam registradas; Pain não volta como contrato comum.",
    missions: [
      {
        rank: "A",
        title: "Sinais da Akatsuki",
        description: "Intercepte o membro da Akatsuki que ronda as fronteiras.",
        enemy: "kisame",
        reward: 620,
        xp: 220,
        scene: [
          "A Samehada absorve chakra enquanto Kisame bloqueia a estrada.",
          [
            ["Avisar os aliados e proteger a retaguarda", "car"],
            ["Forçar o inimigo a sair da água", "tai"],
            ["Desestabilizar o fluxo da espada com chakra", "nin"],
          ],
        ],
      },
      {
        rank: "S",
        title: "Evacuação de Konoha",
        description:
          "Retire civis e proteja os aliados durante o ataque à vila.",
        goal: "protect",
        reward: 700,
        xp: 250,
        scene: [
          "Destroços bloqueiam a rua; moradores e ninjas feridos precisam de saída.",
          [
            ["Organizar uma rota segura para os civis", "int"],
            ["Carregar os feridos enquanto a equipe cobre a rua", "tai"],
            ["Abrir uma passagem por cima dos telhados", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A batalha contra Pain",
        description: "Defenda Konoha e impeça que Pain ataque novamente.",
        enemy: "pain",
        reward: 900,
        xp: 320,
        scene: [
          "Pain observa a vila e prepara uma técnica de grande alcance.",
          [
            ["Avisar todos para se protegerem", "car"],
            ["Interromper a concentração antes da explosão", "nin"],
            ["Esperar o momento certo para contra-atacar", "int"],
          ],
        ],
      },
    ],
  },
  {
    id: "cincokage",
    title: "Arco 8 · Cúpula dos Cinco Kage",
    summary: "Investigue a tensão entre as vilas e enfrente a ameaça da Raiz.",
    unlock: { rank: 3, level: 22, missions: 26 },
    consequence:
      "A conspiração de Danzō é revelada e as vilas reforçam sua aliança.",
    missions: [
      {
        rank: "A",
        title: "Rumores na fronteira",
        description:
          "Investigue os sinais de uma conspiração contra a aliança das vilas.",
        goal: "retrieve",
        reward: 720,
        xp: 250,
        scene: [
          "Documentos codificados foram vistos perto de uma rota diplomática.",
          [
            ["Comparar os símbolos com registros da vila", "int"],
            ["Rastrear quem transportou os documentos", "vel"],
            ["Convencer os guardas a compartilhar informações", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O líder da Raiz",
        description:
          "Interrompa os planos de Danzō antes que a cúpula seja atacada.",
        enemy: "danzo",
        reward: 900,
        xp: 310,
        scene: [
          "Danzō protege o braço selado e tenta ganhar tempo.",
          [
            ["Identificar os selos antes de atacar", "int"],
            ["Pressionar sem lhe dar espaço", "tai"],
            ["Desviar dos ataques e buscar uma abertura", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A máscara por trás da crise",
        description: "Enfrente Tobi e proteja os representantes das vilas.",
        enemy: "obito",
        reward: 1050,
        xp: 360,
        scene: [
          "Tobi surge entre os guardas e distorce o espaço ao redor.",
          [
            ["Observar o intervalo entre suas aparições", "int"],
            ["Coordenar os aliados para cercá-lo", "car"],
            ["Atacar no instante em que se materializa", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "guerra",
    title: "Arco 9 · Quarta Grande Guerra Ninja",
    summary: "Una os esquadrões aliados e enfrente os últimos adversários.",
    unlock: { rank: 3, level: 26, missions: 32 },
    consequence:
      "A guerra termina e os shinobi das cinco nações iniciam uma nova era de cooperação.",
    missions: [
      {
        rank: "S",
        title: "Mobilização da Aliança",
        description:
          "Organize a comunicação entre os esquadrões antes do avanço inimigo.",
        goal: "protect",
        reward: 900,
        xp: 320,
        scene: [
          "Mensagens contraditórias chegam de três frentes ao mesmo tempo.",
          [
            ["Confirmar os relatos antes de redistribuir as equipes", "int"],
            ["Enviar reforços para proteger os feridos", "tai"],
            ["Estabelecer um sinal comum entre os esquadrões", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O exército reanimado",
        description:
          "Encontre e detenha Kabuto, que controla as forças reanimadas.",
        enemy: "kabutoStory",
        reward: 1150,
        xp: 390,
        scene: [
          "Kabuto prepara uma técnica que ameaça os combatentes feridos.",
          [
            ["Interromper os selos de controle", "nin"],
            ["Afastar os aliados antes da técnica", "car"],
            ["Atacar durante a preparação", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A lenda do campo de batalha",
        description: "Impeça Madara de romper as linhas da Aliança Shinobi.",
        enemy: "madaraStory",
        reward: 1400,
        xp: 470,
        scene: [
          "Madara avança sozinho, confiante de que nenhum esquadrão pode detê-lo.",
          [
            ["Coordenar os ataques da Aliança", "car"],
            ["Estudar o ritmo de suas técnicas", "int"],
            ["Avançar junto dos aliados para pressioná-lo", "tai"],
          ],
        ],
      },
    ],
  },
];

STORY_ARCS.push(
  {
    id: "epilogo",
    title: "Arco 10 · Origem do Chakra",
    summary: "Enfrente o último perigo da guerra e proteja o futuro do mundo shinobi.",
    unlock: { rank: 3, level: 30, missions: 38 },
    consequence:
      "Kaguya foi selada; as nações iniciam a reconstrução, mas a paz ainda precisa ser protegida.",
    missions: [
      {
        rank: "S",
        title: "Escudo da Aliança",
        description: "Proteja os esquadrões contra o ataque final.",
        goal: "protect",
        reward: 1100,
        xp: 380,
        scene: [
          "O céu se parte e a Lua parece observar cada movimento.",
          [
            ["Reunir os esquadrões em uma formação defensiva", "car"],
            ["Encontrar abrigo para os feridos", "int"],
            ["Conter o avanço inimigo", "tai"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O último rival",
        description: "Detenha Tobi antes que ele alcance a Lua.",
        enemy: "obito",
        reward: 1300,
        xp: 430,
        scene: [
          "Obito reúne chakra das Dez-Caudas diante do campo de batalha.",
          [
            ["Atacar durante a mudança de forma", "vel"],
            ["Desestabilizar o chakra das bestas", "nin"],
            ["Coordenar a Aliança para cercá-lo", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A Deusa Coelho",
        description: "Enfrente Kaguya e encerre a era das guerras.",
        enemy: "kaguya",
        reward: 1700,
        xp: 560,
        scene: [
          "Kaguya flutua sobre dimensões que se dobram ao seu redor.",
          [
            ["Ler as mudanças entre as dimensões", "int"],
            ["Combinar chakra com a equipe", "nin"],
            ["Aproveitar uma abertura para selá-la", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "reconstrucao",
    title: "Arco 11 · Ecos da Guerra",
    summary: "Proteja a reconstrução e impeça uma facção de reacender o conflito.",
    unlock: { rank: 3, level: 34, missions: 42 },
    consequence:
      "As rotas são reabertas e os dissidentes são detidos; a Aliança pode reconstruir em segurança.",
    missions: [
      {
        rank: "A",
        title: "Rotas interrompidas",
        description:
          "Leve suprimentos às comunidades isoladas pelos danos da guerra.",
        goal: "deliver",
        reward: 1050,
        xp: 360,
        scene: [
          "Uma ponte destruída deixou uma comunidade sem acesso aos suprimentos.",
          [
            ["Reforçar a passagem antes de cruzar", "int"],
            ["Transportar a carga pelo caminho mais rápido", "vel"],
            ["Organizar uma travessia em equipe", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A cúpula sob ameaça",
        description:
          "Proteja os representantes das cinco nações durante as negociações.",
        goal: "protect",
        reward: 1250,
        xp: 420,
        scene: [
          "Um aviso anônimo prevê um ataque durante a reunião da Aliança.",
          [
            ["Inspecionar o local antes da chegada dos representantes", "int"],
            ["Reforçar a guarda e retirar os civis", "tai"],
            ["Coordenar os guardas das cinco nações", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A última faísca",
        description:
          "Derrote o líder dissidente que tenta reiniciar a guerra.",
        enemy: "shinobiDissidente",
        reward: 1500,
        xp: 500,
        scene: [
          "O líder dos dissidentes bloqueia a passagem e prepara um ataque.",
          [
            ["Antecipar seus movimentos", "int"],
            ["Quebrar sua guarda com um avanço direto", "tai"],
            ["Cercá-lo com a ajuda dos aliados", "car"],
          ],
        ],
      },
    ],
  },
);

STORY_ARCS.push(
  {
    id: "fronteiras",
    free: 1,
    after: "reconstrucao",
    title: "Arco 12 · As fronteiras em silêncio",
    summary:
      "Uma rota de abastecimento desaparece dos mapas; três versões oficiais não combinam.",
    unlock: { rank: 3, level: 35, missions: 44 },
    consequence:
      "Os postos de fronteira passam a compartilhar registros, embora algumas lacunas permaneçam sem explicação.",
    missions: [
      {
        rank: "A",
        title: "O relatório que não chegou",
        description:
          "Compare registros da Torre do Hokage e descubra por que uma patrulha foi apagada dos relatórios.",
        goal: "retrieve",
        loc: "torre",
        reward: 620,
        xp: 220,
        scene: [
          "Dois livros de registro descrevem a mesma patrulha em dias diferentes. A assinatura de recebimento está intacta; a página seguinte foi arrancada com cuidado.",
          [
            ["Comparar tinta, datas e caligrafia", "int"],
            ["Rastrear o chakra deixado na encadernação", "nin"],
            ["Perguntar aos funcionários sem acusar ninguém", "car"],
          ],
        ],
      },
      {
        rank: "A",
        title: "O posto de vigia vazio",
        description:
          "Verifique um posto abandonado e recupere o sinal que a patrulha deixou para trás.",
        goal: "retrieve",
        loc: "posto",
        reward: 680,
        xp: 240,
        scene: [
          "O posto está limpo demais para ter sido abandonado às pressas. Há marcas de botas recentes, mas nenhuma pegada segue para fora do perímetro.",
          [
            ["Procurar marcas sob a poeira", "int"],
            ["Seguir o último eco de chakra", "nin"],
            ["Montar vigia e observar quem retorna", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A rota que muda de nome",
        description:
          "Escolte uma mensageira até a fronteira e confronte as versões incompatíveis sobre a rota.",
        goal: "escort",
        loc: "fronteira",
        reward: 820,
        xp: 290,
        scene: [
          "A mensageira conhece o caminho, mas insiste que o marco de pedra mudou de lugar. Seu mapa mostra o marco em três pontos diferentes.",
          [
            ["Deixar a mensageira explicar antes de escolher a trilha", "car"],
            ["Conferir o terreno e os marcos pessoalmente", "int"],
            ["Avançar pela rota mais curta, mantendo cobertura", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "arquivo-mudo",
    free: 1,
    after: "fronteiras",
    title: "Arco 13 · O arquivo mudo",
    summary:
      "Um arquivo lacrado guarda cartas que nunca foram entregues e versões que se contradizem.",
    unlock: { rank: 3, level: 37, missions: 48 },
    consequence:
      "As cartas são preservadas para consulta; seus trechos ausentes continuam em aberto.",
    missions: [
      {
        rank: "A",
        title: "A chave sem fechadura",
        description:
          "Investigue uma chave enviada ao Distrito Uchiha sem qualquer indicação de destino.",
        goal: "retrieve",
        loc: "distrito",
        reward: 700,
        xp: 250,
        scene: [
          "A chave traz o selo de um arquivo que não consta nos mapas do distrito. Um bilhete afirma que ela abre uma porta; outro, escrito pela mesma mão, diz que a porta nunca existiu.",
          [
            ["Examinar o selo e a idade do metal", "int"],
            ["Buscar o destino pelo resíduo de chakra", "nin"],
            ["Procurar alguém que reconheça a caligrafia", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "Cartas na sala inundada",
        description:
          "Recupere cartas de um depósito antigo antes que a água apague a tinta.",
        goal: "retrieve",
        loc: "santuario",
        reward: 780,
        xp: 275,
        scene: [
          "O depósito contém cartas endereçadas a pessoas que nunca estiveram na mesma vila. Algumas têm marcas de água por dentro dos envelopes.",
          [
            ["Secar e separar as páginas por caligrafia", "int"],
            ["Usar chakra para afastar a água sem tocar no papel", "nin"],
            ["Retirar primeiro os envelopes presos à parede", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O destinatário ausente",
        description:
          "Apure quem deveria receber as cartas e registre o que ainda pode ser confirmado.",
        goal: "investigation",
        loc: "fronteira",
        reward: 900,
        xp: 315,
        scene: [
          "Uma testemunha reconhece o lacre, mas não o nome. Outra reconhece o nome e jura que o lacre pertencia a uma missão diferente.",
          [
            ["Separar fatos verificáveis de lembranças", "int"],
            ["Confrontar os relatos sem sugerir respostas", "car"],
            ["Procurar vestígios físicos no antigo caminho", "vel"],
          ],
        ],
      },
    ],
  },
  {
    id: "kzinn",
    free: 1,
    after: "arquivo-mudo",
    title: "Arco especial · Kzinn: O Lendário Shinobi",
    summary:
      "Siga rastros incompletos de um herói lendário cujo paradeiro continua desconhecido.",
    unlock: { rank: 3, level: 39, missions: 52 },
    consequence:
      "O nome de Kzinn continua vivo em relatos incompletos; nenhuma versão explica seu desaparecimento.",
    missions: [
      {
        rank: "A",
        title: "O nome nos relatórios",
        description:
          "Investigue por que arquivos de várias nações mencionam os feitos de Kzinn, mas discordam sobre quando aconteceram.",
        goal: "investigation",
        loc: "torre",
        reward: 760,
        xp: 270,
        scene: [
          "Na Torre, um mural de missões antigas cita Kzinn como o shinobi que impediu uma crise internacional. O relatório atribui o feito a uma equipe; uma nota posterior credita tudo a uma única pessoa.",
          [
            ["Comparar carimbos e datas das cópias", "int"],
            ["Perguntar a quem preservou os documentos", "car"],
            ["Seguir o traço de chakra apagado do papel", "nin"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O distrito das testemunhas",
        description:
          "Procure no Distrito Uchiha registros deixados por quem conheceu Kzinn.",
        goal: "retrieve",
        loc: "distrito",
        reward: 820,
        xp: 290,
        scene: [
          "Uma caixa de depoimentos guarda lembranças incompatíveis: para uma testemunha, Kzinn salvou a vila numa noite de inverno; para outra, naquela data ele já estava longe do País do Fogo.",
          [
            ["Registrar cada relato sem escolher um como verdade", "int"],
            ["Buscar o documento original que os depoimentos citam", "vel"],
            ["Perguntar aos moradores o que preferem preservar", "car"],
          ],
        ],
      },
      {
        rank: "S",
        title: "A trilha que termina na fronteira",
        description:
          "Siga uma rota associada ao último avistamento conhecido de Kzinn.",
        goal: "rescue",
        loc: "fronteira",
        reward: 900,
        xp: 320,
        scene: [
          "Um antigo mensageiro lembra de ter escoltado Kzinn até a fronteira. Um mapa marca a passagem para o leste; o diário do mesmo mensageiro diz que seguiram para oeste.",
          [
            ["Reconstruir a rota usando os marcos preservados", "int"],
            ["Proteger o mensageiro enquanto ele revisita o caminho", "tai"],
            ["Seguir os vestígios sem presumir um destino", "vel"],
          ],
        ],
      },
      {
        rank: "S",
        title: "O esconderijo sem resposta",
        description:
          "Investigue o abrigo que diferentes relatos apontam como o último refúgio de Kzinn.",
        goal: "retrieve",
        loc: "santuario",
        finale: true,
        reward: 1100,
        xp: 380,
        scene: [
          "As pistas terminam num abrigo discreto, escondido entre rochas antigas. Há marcas de passagens distintas, mas nenhuma permite datar a última visita. Você está perto do lugar que procurava.",
          [
            ["Examinar o entorno antes de entrar", "int"],
            ["Procurar sinais de armadilhas e passagens", "vel"],
            ["Avançar com cuidado e manter a equipe unida", "car"],
          ],
        ],
      },
    ],
  },
);

const SPECIAL_ITEMS = {
  colarKzinn: {
    name: "Colar de Kzinn",
    description:
      "Um colar gasto pelo tempo, reconhecível pelos relatos como pertencente a Kzinn. No esconderijo, não havia ninguém para explicar como ele chegou ali.",
  },
};

// Objetivos finais sem combate: cada opção testa uma habilidade diferente.
const OBJ = {
  deliver: [
    "A entrega está quase concluída. Como você garante que a encomenda chegue em segurança?",
    [
      ["Escolher uma rota segura", "int"],
      ["Avançar rapidamente", "vel"],
      ["Pedir orientação a um morador", "car"],
    ],
  ],
  retrieve: [
    "Você encontrou o último rastro. Como localiza os pertences?",
    [
      ["Examinar as pistas com cuidado", "int"],
      ["Procurar de um ponto elevado", "vel"],
      ["Detectar chakra residual", "nin"],
    ],
  ],
  escort: [
    "O caminho fica perigoso. Como mantém a pessoa escoltada protegida?",
    [
      ["Manter uma formação defensiva", "tai"],
      ["Vigiar os flancos", "vel"],
      ["Acalmar e coordenar o grupo", "car"],
    ],
  ],
  rescue: [
    "Você encontra sinais de que há alguém por perto. Como conduz o resgate?",
    [
      ["Seguir as marcas com atenção", "int"],
      ["Abrir caminho rapidamente", "tai"],
      ["Localizar chakra aliado", "nin"],
    ],
  ],
  protect: [
    "Uma ameaça se aproxima do grupo. Como protege os civis?",
    [
      ["Organizar uma retirada segura", "int"],
      ["Interpor-se e defender a equipe", "tai"],
      ["Guiar todos por uma rota alternativa", "vel"],
    ],
  ],
};

const STP = [
  [
    "Uma ponte quebrada bloqueia o caminho.",
    [
      ["Saltar com agilidade", "vel"],
      ["Criar passagem com chakra", "nin"],
      ["Procurar outro caminho", "int"],
    ],
  ],
  [
    "Rastros recentes na lama sugerem perigo.",
    [
      ["Seguir os rastros", "int"],
      ["Vigiar do alto de uma árvore", "vel"],
      ["Avançar na força", "tai"],
    ],
  ],
  [
    "Um viajante suspeito pede ajuda.",
    [
      ["Interrogar com firmeza", "tai"],
      ["Ler suas intenções", "int"],
      ["Usar um genjutsu leve", "nin"],
    ],
  ],
  [
    "Fios e kunai: uma armadilha!",
    [
      ["Desviar", "vel"],
      ["Desarmar com cuidado", "int"],
      ["Resistir ao golpe", "tai"],
    ],
  ],
  [
    "Uma tempestade de areia dificulta a visão.",
    [
      ["Cobrir o rosto e avançar", "tai"],
      ["Orientar-se pelo vento", "int"],
      ["Dissipar com chakra", "nin"],
    ],
  ],
  [
    "Aldeões desconfiados barram a passagem.",
    [
      ["Persuadir com educação", "car"],
      ["Mostrar a testa protetora", "int"],
      ["Intimidar", "tai"],
    ],
  ],
  [
    "Um mensageiro ferido cai à sua frente.",
    [
      ["Prestar socorro", "int"],
      ["Carregar até a vila", "tai"],
      ["Convencê-lo a falar", "car"],
    ],
  ],
  [
    "Névoa densa esconde inimigos.",
    [
      ["Sentir o chakra ao redor", "nin"],
      ["Mover-se em silêncio", "vel"],
      ["Esperar e observar", "int"],
    ],
  ],
];

// Primeiro obstáculo exclusivo de cada contrato; opções testam estilos diferentes.
const MSTEP = [
  [
    "Tora dispara pelos telhados e some de vista.",
    [
      ["Seguir as pegadas no telhado", "vel"],
      ["Atraí-lo com comida", "car"],
      ["Bloquear as saídas do beco", "int"],
    ],
  ],
  [
    "O jardim está cheio de marcas e os arbustos se mexem.",
    [
      ["Examinar as marcas", "int"],
      ["Afastar os animais com cuidado", "car"],
      ["Limpar a área rapidamente", "tai"],
    ],
  ],
  [
    "A carroça de Tazuna range enquanto a estrada se estreita.",
    [
      ["Inspecionar as rodas", "int"],
      ["Vigiar a encosta", "vel"],
      ["Ajudar a empurrar a carroça", "tai"],
    ],
  ],
  [
    "O ninja renegado cruzou um riacho e apagou parte do rastro.",
    [
      ["Procurar pegadas na margem", "int"],
      ["Subir para observar a região", "vel"],
      ["Seguir o fluxo de chakra", "nin"],
    ],
  ],
  [
    "Guardas patrulham a entrada da base do Espadachim.",
    [
      ["Criar uma distração", "nin"],
      ["Observar o ritmo da patrulha", "int"],
      ["Passar pelo terreno elevado", "vel"],
    ],
  ],
  [
    "A névoa encobre Zabuza e separa você de seus aliados.",
    [
      ["Localizar os companheiros pelo chakra", "nin"],
      ["Proteger a retaguarda", "tai"],
      ["Ganhar altura para enxergar", "vel"],
    ],
  ],
  [
    "Um informante viu mantos negros perto da fronteira.",
    [
      ["Registrar cada detalhe", "int"],
      ["Rastrear o grupo sem ser visto", "vel"],
      ["Enviar um sinal à vila", "car"],
    ],
  ],
  [
    "Na Floresta da Morte, uma marca de cobra aparece num tronco.",
    [
      ["Examinar a marca", "int"],
      ["Procurar armadilhas ao redor", "vel"],
      ["Marcar uma rota de retirada", "car"],
    ],
  ],
  [
    "Uma onda de água avança contra o caminho do comboio.",
    [
      ["Firmar uma barreira de terra", "nin"],
      ["Retirar os viajantes da margem", "vel"],
      ["Segurar a passagem", "tai"],
    ],
  ],
  [
    "Explosões atingem a rua e os moradores correm sem direção.",
    [
      ["Organizar a evacuação", "car"],
      ["Afastar os destroços", "tai"],
      ["Encontrar uma rota protegida", "int"],
    ],
  ],
  [
    "A caixa de remédios precisa cruzar um corredor lotado.",
    [
      ["Proteger os frascos na mochila", "int"],
      ["Abrir passagem com cuidado", "car"],
      ["Levar a caixa pelo caminho alto", "vel"],
    ],
  ],
  [
    "O vento espalhou folhas da bolsa do mensageiro pela estrada.",
    [
      ["Seguir a direção do vento", "int"],
      ["Buscar nos galhos próximos", "vel"],
      ["Perguntar aos viajantes", "car"],
    ],
  ],
  [
    "A equipe de obras descobriu rachaduras na ponte provisória.",
    [
      ["Testar os apoios antes da travessia", "int"],
      ["Distribuir o peso da equipe", "tai"],
      ["Vigiar as margens", "vel"],
    ],
  ],
  [
    "A carta para Suna está selada, mas a rota principal foi bloqueada.",
    [
      ["Encontrar um desvio seguro", "int"],
      ["Cruzar antes do anoitecer", "vel"],
      ["Negociar passagem com os guardas", "car"],
    ],
  ],
  [
    "O pergaminho dos selos reage ao chakra e começa a se abrir.",
    [
      ["Conter o chakra ao redor", "nin"],
      ["Fechar o selo na ordem correta", "int"],
      ["Afastar curiosos da área", "car"],
    ],
  ],
  [
    "O batedor deixou kunai marcadas perto de uma ravina.",
    [
      ["Seguir as marcas com cautela", "int"],
      ["Descer com uma corda", "vel"],
      ["Chamar pelo sinal combinado", "car"],
    ],
  ],
  [
    "A equipe médica ficou encurralada enquanto atende um ferido.",
    [
      ["Criar uma barreira de proteção", "nin"],
      ["Retirar o paciente primeiro", "tai"],
      ["Organizar a saída da equipe", "int"],
    ],
  ],
  [
    "Uma família se recusa a abandonar a casa durante o ataque.",
    [
      ["Explicar o risco com calma", "car"],
      ["Ajudar a carregar os pertences", "tai"],
      ["Mostrar o caminho até o abrigo", "int"],
    ],
  ],
  [
    "O caminho até o Time 7 está coberto por lama e galhos caídos.",
    [
      ["Proteger os suprimentos da água", "int"],
      ["Abrir passagem com força", "tai"],
      ["Escolher um caminho mais alto", "vel"],
    ],
  ],
  [
    "Naruto deixou uma trilha de folhas e marcas de treino.",
    [
      ["Reconhecer as marcas do pergaminho", "int"],
      ["Seguir o rastro até o campo", "vel"],
      ["Perguntar aos colegas da equipe", "car"],
    ],
  ],
  [
    "O comboio ouviu passos acompanhando a estrada.",
    [
      ["Escoltar pela frente e pela retaguarda", "tai"],
      ["Observar os rastros laterais", "int"],
      ["Mudar a formação do comboio", "car"],
    ],
  ],
  [
    "O pergaminho do exame foi visto perto de uma árvore marcada.",
    [
      ["Procurar armadilhas antes de tocar nele", "int"],
      ["Subir e observar o terreno", "vel"],
      ["Usar chakra para localizar o selo", "nin"],
    ],
  ],
  [
    "Símbolos do Som foram deixados na entrada do esconderijo.",
    [
      ["Decifrar os símbolos", "int"],
      ["Vigiar a entrada antes de avançar", "vel"],
      ["Criar uma distração distante", "nin"],
    ],
  ],
  [
    "A equipe de resgate encontrou marcas de luta e uma trilha recente.",
    [
      ["Separar os rastros por direção", "int"],
      ["Seguir a trilha mais fresca", "vel"],
      ["Preparar primeiros socorros", "car"],
    ],
  ],
  [
    "O esconderijo da Akatsuki está protegido por fios quase invisíveis.",
    [
      ["Procurar os pontos de ancoragem", "int"],
      ["Desarmar os fios com chakra", "nin"],
      ["Abrir uma rota para a equipe", "vel"],
    ],
  ],
  [
    "A dupla imortal está perto de viajantes feridos.",
    [
      ["Retirar os civis antes do confronto", "car"],
      ["Separar os inimigos", "int"],
      ["Conter o avanço deles", "tai"],
    ],
  ],
  [
    "O esconderijo de Sasori tem várias passagens e bonecos armados.",
    [
      ["Mapear as passagens", "int"],
      ["Avançar protegendo a equipe", "tai"],
      ["Detectar mecanismos com chakra", "nin"],
    ],
  ],
  [
    "O Quarteto do Som tenta cortar a retirada dos aliados.",
    [
      ["Organizar uma defesa em linha", "tai"],
      ["Guiar os aliados por outra rota", "int"],
      ["Distrair o grupo e ganhar tempo", "vel"],
    ],
  ],
];

const MISSION_OPTIONS = [
  ["Oferecer um brinquedo para atrair Tora", "car"],
  ["Separar uma área segura antes de mexer nos arbustos", "int"],
  ["Combinar um sinal de parada com Tazuna", "car"],
  ["Preparar uma marca de chakra para não perder o rastro", "nin"],
  ["Usar um disfarce para passar pela patrulha", "car"],
  ["Enviar um sinal combinado para reunir os aliados", "car"],
  ["Deixar uma rota segura para o informante", "car"],
  ["Fazer uma cópia da marca antes de seguir", "int"],
  ["Guiar a carroça por um caminho mais alto", "vel"],
  ["Usar sinais para orientar os moradores", "int"],
  ["Separar os remédios por ordem de entrega", "int"],
  ["Deixar marcas discretas indicando o caminho", "nin"],
  ["Avisar os trabalhadores sobre cada trecho instável", "car"],
  ["Pedir escolta temporária a viajantes aliados", "car"],
  ["Conter a reação do pergaminho com um selo temporário", "nin"],
  ["Lançar uma corda de segurança antes de descer", "tai"],
  ["Estabilizar o paciente antes de mover a equipe", "nin"],
  ["Pedir a um morador que acompanhe as crianças", "car"],
  ["Criar uma cobertura para manter secos os suprimentos", "nin"],
  ["Deixar um aviso no campo para a equipe do Time 7", "car"],
  ["Mandar um batedor observar o comboio à distância", "int"],
  ["Confirmar o selo com o posto de controle", "car"],
  ["Criar uma distração usando um disfarce do Som", "car"],
  ["Preparar sinais para guiar a equipe de resgate", "car"],
  ["Usar um clone para testar os fios antes de avançar", "nin"],
  ["Afastar os civis antes de separar os inimigos", "car"],
  ["Isolar os mecanismos das marionetes antes de avançar", "int"],
  ["Dar o sinal de retirada antes de fechar a linha", "car"],
];

// Emergências temporárias. Cada chamada tem uma cena e uma resolução próprias.
const CRISES = [
  {
    id: "enchente",
    title: "Enchente no País das Ondas",
    description:
      "A chuva subiu o nível do rio e trabalhadores estão ilhados perto da ponte.",
    loc: "ponte",
    localCause: true,
    rank: "C",
    npc: "tazuna",
    goal: "rescue",
    reward: 150,
    xp: 55,
    scene: [
      "A correnteza ameaça levar uma carroça com dois trabalhadores.",
      [
        ["Prender uma corda entre as margens", "tai"],
        ["Encontrar um ponto raso rio acima", "int"],
        ["Usar chakra para erguer uma passagem", "nin"],
      ],
    ],
  },
  {
    id: "incendio",
    title: "Incêndio na Floresta da Morte",
    description:
      "Um raio atingiu árvores secas. Há animais e viajantes perto da fumaça.",
    loc: "exame",
    localCause: true,
    rank: "C",
    npc: "anko",
    goal: "rescue",
    reward: 170,
    xp: 60,
    scene: [
      "A fumaça cobre a trilha e o fogo se aproxima de um grupo perdido.",
      [
        ["Guiar o grupo contra o vento", "int"],
        ["Abrir caminho entre os galhos", "tai"],
        ["Localizar todos pelo chakra", "nin"],
      ],
    ],
  },
  {
    id: "deslizamento",
    title: "Deslizamento na fronteira",
    description:
      "A encosta cedeu após vários dias de chuva e bloqueou a rota de patrulha.",
    loc: "fronteira",
    localCause: true,
    rank: "C",
    npc: "yamato",
    goal: "retrieve",
    reward: 190,
    xp: 70,
    scene: [
      "Uma voz pede ajuda sob os destroços da encosta.",
      [
        ["Marcar a área antes de escavar", "int"],
        ["Remover as pedras maiores", "tai"],
        ["Buscar uma entrada lateral", "vel"],
      ],
    ],
  },
  {
    id: "terremoto",
    title: "Tremor em Konoha",
    description:
      "Um tremor danificou casas perto do portão. Moradores precisam de ajuda.",
    loc: "portao",
    localCause: true,
    rank: "D",
    npc: "sakura",
    goal: "rescue",
    reward: 100,
    xp: 35,
    scene: [
      "Uma família está presa em uma casa com a estrutura instável.",
      [
        ["Retirar primeiro quem está ferido", "int"],
        ["Sustentar a viga enquanto saem", "tai"],
        ["Encontrar uma entrada segura", "vel"],
      ],
    ],
  },
  {
    id: "tempestade",
    title: "Tempestade na estrada da Areia",
    description:
      "Ventos fortes derrubaram as placas da rota e um mensageiro se perdeu.",
    loc: "areia",
    localCause: true,
    rank: "C",
    npc: "temari",
    goal: "retrieve",
    reward: 165,
    xp: 58,
    scene: [
      "A areia apaga os rastros do mensageiro e reduz a visibilidade.",
      [
        ["Usar as marcas do terreno", "int"],
        ["Procurar abrigo e esperar a rajada", "tai"],
        ["Seguir o fluxo de chakra", "nin"],
      ],
    ],
  },
  {
    id: "genin",
    title: "Genin desaparecidos",
    description:
      "Dois estudantes não voltaram de uma coleta de ervas nos arredores.",
    loc: "floresta",
    rank: "D",
    npc: "iruka",
    goal: "rescue",
    reward: 95,
    xp: 32,
    scene: [
      "Você encontra uma bolsa caída e marcas que se dividem em três trilhas.",
      [
        ["Examinar pegadas e galhos", "int"],
        ["Subir para observar a mata", "vel"],
        ["Chamar pelo sinal da Academia", "car"],
      ],
    ],
  },
  {
    id: "mensageiro",
    title: "Mensageiro ferido no portão",
    description:
      "Um mensageiro chegou ferido com uma informação urgente para a Hokage.",
    loc: "portao",
    rank: "D",
    npc: "shizune",
    goal: "protect",
    reward: 90,
    xp: 30,
    scene: [
      "O mensageiro está consciente, mas uma emboscada pode estar próxima.",
      [
        ["Levá-lo ao hospital com segurança", "tai"],
        ["Verificar se há perseguidores", "vel"],
        ["Perguntar o que aconteceu", "car"],
      ],
    ],
  },
  {
    id: "bandidos",
    title: "Ataque ao comboio",
    description:
      "Bandidos cercaram um comboio de alimentos que abastece a vila.",
    loc: "mercado",
    rank: "C",
    npc: "shikamaru",
    goal: "protect",
    reward: 175,
    xp: 62,
    scene: [
      "Os atacantes tentam separar a carroça da escolta.",
      [
        ["Manter a carroça no centro da formação", "tai"],
        ["Prever o próximo movimento deles", "int"],
        ["Evacuar os comerciantes primeiro", "car"],
      ],
    ],
  },
  {
    id: "nevasca",
    title: "Nevasca no Monte Myoboku",
    description:
      "A neve fechou uma trilha e sapos mensageiros ficaram isolados.",
    loc: "monte",
    localCause: true,
    rank: "B",
    npc: "fukasaku",
    goal: "rescue",
    reward: 280,
    xp: 95,
    scene: [
      "A trilha desapareceu sob a neve e o vento esconde os chamados.",
      [
        ["Procurar abrigo antes de avançar", "int"],
        ["Abrir caminho na neve", "tai"],
        ["Rastrear os chamados pelo chakra", "nin"],
      ],
    ],
  },
  {
    id: "invasao",
    title: "Movimento suspeito da Akatsuki",
    description:
      "Um batedor avistou mantos negros perto do esconderijo. Confirme a informação.",
    loc: "akatsuki",
    rank: "A",
    npc: "itachi",
    goal: "retrieve",
    reward: 420,
    xp: 145,
    scene: [
      "Há marcas recentes no chão, mas também sinais de uma armadilha.",
      [
        ["Observar de longe antes de avançar", "int"],
        ["Desarmar a armadilha com chakra", "nin"],
        ["Preparar uma rota de retirada", "vel"],
      ],
    ],
  },
];

const HOKAGE_OPS = [
  {
    id: "suprimentos",
    rank: "D",
    title: "Escolta de suprimentos",
    description:
      "Uma equipe de comerciantes precisa levar mantimentos até o posto de patrulha.",
    loc: "portao",
    reward: 170,
    xp: 60,
    stages: [
      [
        "A carroça está pronta, mas a equipe ainda não combinou a formação.",
        [
          ["Organizar a carga e a ordem de marcha", "int"],
          ["Animar os comerciantes e combinar sinais", "car"],
          ["Examinar a estrada antes da partida", "vel"],
        ],
      ],
      [
        "A estrada fica estreita e há marcas recentes junto à mata.",
        [
          ["Avançar com vigias nos flancos", "vel"],
          ["Manter a carroça protegida no centro", "tai"],
          ["Parar e identificar os rastros", "int"],
        ],
      ],
      [
        "O posto aparece no horizonte, mas uma roda da carroça começa a ceder.",
        [
          ["Distribuir o peso entre os membros da equipe", "tai"],
          ["Improvisar um reparo com as ferramentas", "int"],
          ["Acalmar os comerciantes e concluir a entrega", "car"],
        ],
      ],
    ],
  },
  {
    id: "ponte",
    rank: "C",
    title: "Proteção da reconstrução da ponte",
    description:
      "Trabalhadores na Ponte Naruto relatam movimentação suspeita durante a reconstrução.",
    loc: "ponte",
    reward: 260,
    xp: 90,
    stages: [
      [
        "A equipe chega ao canteiro. É preciso proteger os trabalhadores sem interromper a obra.",
        [
          ["Distribuir a equipe em pontos de observação", "int"],
          ["Reforçar a segurança junto aos trabalhadores", "tai"],
          ["Conversar com os moradores sobre os suspeitos", "car"],
        ],
      ],
      [
        "Um sinal combinado aparece na margem oposta.",
        [
          ["Seguir discretamente as marcas na margem", "vel"],
          ["Confirmar o sinal antes de avançar", "int"],
          ["Proteger a travessia dos trabalhadores", "tai"],
        ],
      ],
      [
        "Um grupo tenta sabotar as cordas de sustentação durante a noite.",
        [
          ["Cortar o acesso às cordas sem alertar o grupo", "vel"],
          ["Imobilizar os sabotadores com ajuda da equipe", "tai"],
          ["Descobrir quem os enviou", "int"],
        ],
      ],
      [
        "Com a ameaça contida, a ponte precisa ser liberada com segurança.",
        [
          ["Inspecionar cada apoio antes da travessia", "int"],
          ["Organizar a passagem dos trabalhadores", "car"],
          ["Vigiar a margem até a equipe terminar", "vel"],
        ],
      ],
    ],
  },
  {
    id: "resgate",
    rank: "B",
    title: "Busca da equipe desaparecida",
    description:
      "Um esquadrão de reconhecimento não retornou da Floresta da Morte.",
    loc: "exame",
    reward: 390,
    xp: 140,
    stages: [
      [
        "A última mensagem do esquadrão aponta para três trilhas diferentes.",
        [
          ["Comparar pegadas e marcas nas árvores", "int"],
          ["Rastrear o fluxo de chakra", "nin"],
          ["Subir para observar a floresta", "vel"],
        ],
      ],
      [
        "Armadilhas recentes indicam que alguém está tentando atrasar o resgate.",
        [
          ["Desarmar as armadilhas e marcar a rota", "int"],
          ["Avançar em silêncio pelos galhos", "vel"],
          ["Abrir caminho para a equipe médica", "tai"],
        ],
      ],
      [
        "A equipe desaparecida está ferida e um inimigo ronda o esconderijo.",
        [
          ["Criar uma distração para retirar os feridos", "nin"],
          ["Conter o inimigo enquanto o time recua", "tai"],
          ["Coordenar a retirada pelo caminho seguro", "int"],
        ],
      ],
      [
        "Todos estão reunidos, mas a rota de volta está sendo observada.",
        [
          ["Dividir a equipe para proteger os flancos", "tai"],
          ["Usar uma rota alternativa até o posto", "int"],
          ["Sinalizar a extração sem revelar a posição", "vel"],
        ],
      ],
    ],
  },
];

const MISSION_BANTER = {
  naruto: {
    success: [
      "Boa! Assim a gente chega ao fim de “{title}” sem deixar ninguém para trás.",
      "Esse plano funcionou! Vamos continuar juntos em “{title}”.",
    ],
    setback: [
      "Não desiste. Ainda dá para concluir “{title}” se cuidarmos uns dos outros.",
      "Foi difícil, mas eu não vou abandonar a equipe agora.",
    ],
  },
  sakura: {
    success: [
      "Boa execução. Em “{title}”, manter a equipe segura é tão importante quanto avançar.",
      "Funcionou. Vamos conferir se todos estão bem antes da próxima etapa.",
    ],
    setback: [
      "Respire. Vamos tratar os ferimentos e reorganizar a equipe antes de seguir.",
      "Esse contratempo não define a missão. Vou ajudar a equipe a se recuperar.",
    ],
  },
  shikamaru: {
    success: [
      "A abordagem em “{title}” foi eficiente. Melhor avançar com um plano claro.",
      "Menos problemático do que parecia. Vamos manter essa formação em “{title}”.",
    ],
    setback: [
      "O plano falhou; vamos usar essa informação para ajustar “{title}”.",
      "Que problemático… mas ainda temos tempo para rever a estratégia.",
    ],
  },
  kiba: {
    success: [
      "Akamaru confirmou o caminho. Estamos no rumo certo para “{title}”.",
      "Boa escolha. O rastro está limpo e a equipe pode avançar.",
    ],
    setback: [
      "O rastro se perdeu, mas Akamaru já está procurando outra passagem.",
      "Não fica parado. Vamos contornar o problema e terminar “{title}”.",
    ],
  },
  shino: {
    success: [
      "Os sinais confirmam a abordagem. Podemos registrar esse avanço em “{title}”.",
      "A equipe deixou poucas pistas. Isso favorece a próxima etapa.",
    ],
    setback: [
      "O contratempo revelou algo sobre o terreno. Vamos ajustar a rota.",
      "Ainda há informações úteis nesta falha; não vamos repeti-la.",
    ],
  },
  lee: {
    success: [
      "Excelente trabalho em equipe! Vamos manter o ritmo, sem esquecer a segurança.",
      "A juventude avança melhor quando todos se apoiam!",
    ],
    setback: [
      "Uma pausa breve, depois tentamos outra abordagem com segurança!",
      "Não confunda um revés com o fim da missão. A equipe continua!",
    ],
  },
  hinata: {
    success: [
      "Fico feliz que todos estejam bem. Vamos continuar apoiando uns aos outros.",
      "Sua decisão deu confiança à equipe. Posso ajudar na próxima etapa.",
    ],
    setback: [
      "Tudo bem, ainda podemos nos reorganizar. Não precisa enfrentar isso sozinho.",
      "Vou ficar ao seu lado enquanto encontramos uma forma mais segura.",
    ],
  },
};

const MISSION_ROUTINES = {
  escort: [
    [
      "Antes da partida, como você organiza a escolta?",
      [
        ["Definir uma formação que proteja a carga", "int"],
        ["Vistoriar a rota e os pontos de parada", "vel"],
        ["Combinar sinais com os passageiros", "car"],
      ],
    ],
    [
      "A escolta encontra um obstáculo no caminho. Como avança?",
      [
        ["Abrir passagem mantendo a carga protegida", "tai"],
        ["Procurar um desvio seguro", "int"],
        ["Enviar um batedor para verificar a frente", "vel"],
      ],
    ],
    [
      "Ao anoitecer, como prepara o acampamento da equipe?",
      [
        ["Montar turnos de vigia", "int"],
        ["Reforçar o perímetro da carroça", "tai"],
        ["Acalmar os passageiros e dividir tarefas", "car"],
      ],
    ],
  ],
  rescue: [
    [
      "Antes de entrar na área, o que você prepara?",
      [
        ["Marcar uma rota de retirada", "int"],
        ["Localizar sinais de chakra dos desaparecidos", "nin"],
        ["Reunir a equipe e dividir funções", "car"],
      ],
    ],
    [
      "Você encontra uma pista perto de uma zona perigosa. Como prossegue?",
      [
        ["Seguir os rastros sem deixar marcas", "vel"],
        ["Abrir caminho para alcançar os feridos", "tai"],
        ["Confirmar se há aliados por perto", "nin"],
      ],
    ],
    [
      "Um resgatado precisa de cuidados antes da viagem. O que faz?",
      [
        ["Estabilizar os ferimentos e poupar forças", "int", "heal"],
        ["Carregá-lo enquanto a equipe cobre a retaguarda", "tai"],
        ["Organizar o retorno pelo caminho mais curto", "vel"],
      ],
    ],
  ],
  retrieve: [
    [
      "Como começa a busca pelo item ou informação?",
      [
        ["Comparar os relatos e mapear a área", "int"],
        ["Procurar resíduos de chakra", "nin"],
        ["Perguntar aos moradores próximos", "car"],
      ],
    ],
    [
      "A pista leva a um terreno cheio de armadilhas. Como investiga?",
      [
        ["Examinar o chão antes de avançar", "int"],
        ["Desarmar o mecanismo com chakra", "nin"],
        ["Observar a área de um ponto elevado", "vel"],
      ],
    ],
    [
      "Você encontrou o que procurava. Como protege a descoberta?",
      [
        ["Guardar o item e registrar sua localização", "int"],
        ["Criar uma rota de retirada discreta", "vel"],
        ["Revezar a vigia enquanto a equipe descansa", "tai", "rest"],
      ],
    ],
  ],
  protect: [
    [
      "Como organiza a defesa antes que a ameaça chegue?",
      [
        ["Definir posições e setores de vigilância", "int"],
        ["Reforçar a linha de proteção", "tai"],
        ["Acalmar e orientar as pessoas protegidas", "car"],
      ],
    ],
    [
      "A ameaça tenta separar o grupo. Qual é sua resposta?",
      [
        ["Manter os protegidos no centro da formação", "tai"],
        ["Conduzi-los por uma rota alternativa", "vel"],
        ["Coordenar a equipe para cobrir os flancos", "car"],
      ],
    ],
    [
      "A noite chega e a proteção continua. O que prioriza?",
      [
        ["Revezar a guarda para evitar distrações", "int"],
        ["Fortalecer as barreiras ao redor do abrigo", "nin"],
        ["Ajudar os protegidos a descansar em segurança", "car", "rest"],
      ],
    ],
  ],
  deliver: [
    [
      "Como prepara a entrega antes de sair?",
      [
        ["Conferir a encomenda e proteger o conteúdo", "int"],
        ["Escolher o caminho mais rápido", "vel"],
        ["Confirmar o destino e avisar quem espera", "car"],
      ],
    ],
    [
      "O trajeto está bloqueado. Como mantém a entrega no prazo?",
      [
        ["Encontrar um desvio sem expor a carga", "int"],
        ["Atravessar antes que o bloqueio piore", "vel"],
        ["Pedir orientação a quem conhece a região", "car"],
      ],
    ],
    [
      "Você precisa passar a noite antes de chegar ao destino. Como cuida da carga?",
      [
        ["Guardar a encomenda em local seco e seguro", "int"],
        ["Fazer uma vigília perto dos suprimentos", "tai"],
        ["Descansar para estar pronto para a etapa final", "car", "rest"],
      ],
    ],
  ],
  combat: [
    [
      "Antes do confronto, como você se prepara?",
      [
        ["Estudar o terreno e prever rotas de fuga", "int"],
        ["Reunir a equipe e combinar sinais", "car"],
        ["Treinar uma abertura para o primeiro ataque", "tai"],
      ],
    ],
    [
      "O inimigo muda de posição durante a operação. Como reage?",
      [
        ["Acompanhar seus movimentos sem se expor", "vel"],
        ["Interromper seu avanço com taijutsu", "tai"],
        ["Ler o fluxo de chakra e antecipar a técnica", "nin"],
      ],
    ],
    [
      "Após um dia de combate, como se prepara para continuar?",
      [
        ["Tratar ferimentos e recuperar o fôlego", "int", "heal"],
        ["Repor chakra com uma pausa controlada", "nin", "chakra"],
        ["Montar guarda enquanto os aliados descansam", "tai"],
      ],
    ],
  ],
};

const MISSION_ROUTINE_PHASES = [
  "Planejamento da manhã",
  "Ação em campo",
  "Rotina da noite",
];

const MISSION_OPERATIONS = {
  stealth: {
    scenes: [
      "A entrada está vigiada. Como você atravessa sem levantar suspeitas?",
      "O corredor de serviço está ocupado. Qual é sua abordagem?",
      "Você se aproxima do objetivo; uma patrulha muda de rota.",
      "A saída está quase livre, mas alguém percebeu movimento.",
    ],
    choices: [
      ["Usar um disfarce convincente", "car", "disguise"],
      ["Avançar pelas sombras e telhados", "vel", "shadow"],
      ["Criar uma distração longe da entrada", "int", "diversion"],
    ],
  },
  investigation: {
    scenes: [
      "Você chega ao local do primeiro indício. Como começa a investigação?",
      "As testemunhas dão versões diferentes. Como confirma os relatos?",
      "Uma pista importante foi encontrada; o que você verifica agora?",
      "O rastro termina perto de três possíveis responsáveis.",
    ],
    choices: [
      ["Examinar marcas e documentos com cuidado", "int", "inspect"],
      ["Seguir resíduos de chakra", "nin", "chakra"],
      ["Conversar com testemunhas separadamente", "car", "question"],
    ],
  },
  escort: {
    scenes: [
      "A equipe alcança a primeira bifurcação da rota.",
      "Um trecho estreito obriga a escolta a mudar a formação.",
      "Sinais de emboscada aparecem ao lado da estrada.",
      "O destino está próximo, mas o grupo está cansado.",
    ],
    choices: [
      ["Escolher o caminho seguro e conferir a carga", "int", "safe"],
      ["Manter a formação ao redor dos passageiros", "tai", "guard"],
      ["Tomar um atalho para evitar os perseguidores", "vel", "shortcut"],
    ],
  },
  survival: {
    scenes: [
      "O terreno dificulta o avanço. Como você prepara o grupo?",
      "A noite se aproxima e os suprimentos são limitados.",
      "O clima piora; é preciso proteger o chakra e encontrar abrigo.",
      "O último trecho exige que você chegue com recursos para o confronto.",
    ],
    choices: [
      ["Procurar água e suprimentos na região", "int", "forage"],
      ["Montar um abrigo protegido do clima", "vel", "shelter"],
      ["Conservar chakra e racionar o equipamento", "nin", "conserve"],
      ["Fazer uma pausa curta para recuperar o fôlego", "car", "rest"],
    ],
  },
};

const INVESTIGATION_SUSPECTS = [
  "Mercenários pagos por Gato",
  "Um agente do Som",
  "Um guarda da rota",
];

const INVESTIGATION_CLUES = [
  [
    "O registro de pagamentos leva ao intermediário de Gato.",
    "Um carregamento de moedas de Gato passou por este posto.",
    "A testemunha reconheceu o símbolo dos mercenários.",
  ],
  [
    "O resíduo de chakra coincide com técnicas do Som.",
    "O relatório menciona um sinal usado por ninjas do Som.",
    "A testemunha ouviu a vibração característica do grupo.",
  ],
  [
    "A chave usada pertence ao turno da guarda.",
    "O registro de entrada foi alterado durante a troca de vigia.",
    "A testemunha viu o uniforme de um guarda na passagem.",
  ],
];

const RCAP = { D: 22, C: 42, B: 62, A: 82, S: 100 },
  RW = { D: 0.2, C: 0.5, B: 1.1, A: 2.2, S: 4 };

const REP_REQ = { B: 12, A: 25, S: 35 };

const DG = {
    D: "baixo",
    C: "moderado",
    B: "alto",
    A: "muito alto",
    S: "extremo",
  },
  FL = {
    rescue: "pessoas podem morrer ou ficar feridas",
    retrieve: "uma informação ou material valioso se perde",
    protect: "o alvo protegido pode ser capturado",
  };

CRISES.push(
  {
    id: "emboscada",
    title: "Esquadrão desaparecido",
    description:
      "Um grupo de reconhecimento não respondeu aos sinais e há indícios de emboscada.",
    loc: "exame",
    rank: "B",
    npc: "anko",
    goal: "rescue",
    reward: 330,
    xp: 115,
    scene: [
      "Rastros apontam para uma armadilha preparada com antecedência.",
      [
        ["Seguir os rastros com cautela", "int"],
        ["Forçar a passagem", "tai"],
        ["Rastrear o chakra deles", "nin"],
      ],
    ],
  },
  {
    id: "perseguido",
    title: "Mensageiro perseguido",
    description:
      "Um mensageiro com informações confidenciais está sendo caçado perto da fronteira.",
    loc: "fronteira",
    rank: "B",
    npc: "yamato",
    goal: "protect",
    reward: 310,
    xp: 105,
    scene: [
      "Os perseguidores se aproximam pela mata.",
      [
        ["Criar uma rota falsa", "int"],
        ["Interceptar os perseguidores", "tai"],
        ["Escoltar o mensageiro em velocidade", "vel"],
      ],
    ],
  },
  {
    id: "civis",
    title: "Civis encurralados",
    description:
      "Viajantes ficaram presos na estrada da Areia enquanto renegados cercam o grupo.",
    loc: "areia",
    rank: "B",
    npc: "temari",
    goal: "rescue",
    reward: 340,
    xp: 118,
    scene: [
      "Os renegados fecharam as duas saídas da estrada.",
      [
        ["Distrair os renegados", "car"],
        ["Abrir caminho à força", "tai"],
        ["Guiar os civis por uma duna", "vel"],
      ],
    ],
  },
  {
    id: "ferido",
    title: "Shinobi ferido precisa de resgate",
    description:
      "Um shinobi gravemente ferido está isolado perto do posto e piora a cada hora.",
    loc: "posto",
    rank: "B",
    npc: "shino",
    goal: "rescue",
    reward: 320,
    xp: 110,
    scene: [
      "Ele ainda respira, mas perdeu muito sangue.",
      [
        ["Estabilizar os ferimentos", "int"],
        ["Carregá-lo até o hospital", "tai"],
        ["Correr à frente e chamar a equipe médica", "vel"],
      ],
    ],
  },
  {
    id: "infiltracao",
    title: "Infiltração na vila",
    description:
      "Há sinais de um intruso no Distrito Uchiha. Investigue antes que a ameaça avance.",
    loc: "distrito",
    rank: "A",
    npc: "sasuke",
    goal: "retrieve",
    reward: 520,
    xp: 180,
    scene: [
      "Pegadas recentes e uma janela forçada indicam alguém experiente.",
      [
        ["Seguir as pegadas em silêncio", "vel"],
        ["Montar uma armadilha de chakra", "nin"],
        ["Interrogar vizinhos e vigias", "car"],
      ],
    ],
  },
);

const DEFC = [
  ["Agir com cautela", "int"],
  ["Avançar com força", "tai"],
  ["Agir com rapidez", "vel"],
];

const MS0 = MS.length;

[
  [
    "D",
    "Peças para o ferreiro",
    "Goro precisa de peças entregues no mercado antes do anoitecer.",
    "ladrao",
    55,
    22,
    "deliver",
    "A rua do mercado está cheia e a encomenda é frágil.",
  ],
  [
    "D",
    "Flores para a Hokage",
    "Mei quer enviar flores à Torre sem que murchem.",
    "ladrao",
    60,
    24,
    "deliver",
    "O sol forte ameaça as flores durante o trajeto.",
  ],
  [
    "D",
    "Cão farejador perdido",
    "Um cão do esquadrão de rastreio fugiu para a floresta.",
    "lobo",
    70,
    26,
    "retrieve",
    "Pegadas pequenas somem entre as raízes.",
  ],
  [
    "D",
    "Ajuda no hospital",
    "Dra. Haruka precisa de ervas e suprimentos.",
    "ladrao",
    65,
    25,
    "retrieve",
    "As ervas crescem em um barranco escorregadio.",
  ],
  [
    "C",
    "Escolta de comerciantes",
    "Uma caravana atravessará a estrada até o posto.",
    "bandidos",
    160,
    52,
    "escort",
    "A estrada é estreita e há marcas suspeitas nas margens.",
  ],
  [
    "C",
    "Patrulha da fronteira",
    "Relatos de vultos na fronteira do País do Fogo.",
    "renegado",
    175,
    58,
    null,
    "A patrulha encontra uma fogueira ainda quente.",
  ],
  [
    "C",
    "Documentos roubados",
    "Pergaminhos administrativos sumiram da Torre.",
    "renegado",
    180,
    60,
    "retrieve",
    "O ladrão deixou poucas pistas no corredor.",
  ],
  [
    "C",
    "Vigília na ponte",
    "Trabalhadores temem sabotagem durante a noite.",
    "som",
    190,
    62,
    "protect",
    "Sombras se movem do outro lado do rio.",
  ],
  [
    "C",
    "Sobrevivência na Floresta da Morte",
    "Você ficou isolado na floresta. Gerencie suprimentos, chakra e abrigo para alcançar o posto.",
    "lobo",
    190,
    65,
    null,
    "A chuva apagou a trilha e resta pouca comida na mochila.",
  ],
  [
    "B",
    "Base do Som abandonada",
    "Uma base inimiga pode conter informações valiosas.",
    "quarteto",
    340,
    115,
    "retrieve",
    "As paredes escondem armadilhas recentes.",
  ],
  [
    "B",
    "Comboio sob ataque",
    "Ninjas renegados cercam um comboio diplomático.",
    "kiri",
    360,
    125,
    "protect",
    "Os atacantes miram o líder da escolta.",
  ],
  [
    "B",
    "Espião no hospital",
    "Alguém copia fichas médicas de shinobis em serviço.",
    "akat",
    380,
    130,
    null,
    "Uma pista leva a um paciente que nunca existiu.",
  ],
  [
    "A",
    "Líder renegado",
    "Um renegado procurado reorganiza seguidores perto da fronteira.",
    "sasori",
    700,
    230,
    null,
    "O esconderijo tem rotas de fuga e vigias treinados.",
  ],
  [
    "A",
    "Resgate diplomático",
    "Um enviado foi sequestrado a caminho da Areia.",
    "kakuzu",
    760,
    250,
    "rescue",
    "Seus captores trocam de posição a cada hora.",
  ],
  [
    "A",
    "Selo proibido",
    "Um pergaminho perigoso precisa ser recuperado.",
    "hidan",
    740,
    240,
    "retrieve",
    "O pergaminho está selado e vigiado.",
  ],
  [
    "S",
    "Ameaça à vila",
    "Uma figura poderosa foi vista perto das muralhas.",
    "kisame",
    1600,
    420,
    null,
    "Há sinais de chakra enorme e controlado.",
  ],
  [
    "S",
    "Operação estratégica",
    "Um golpe decisivo contra uma organização que ameaça várias nações.",
    "pain",
    1900,
    500,
    null,
    "Cada erro pode custar vidas.",
  ],
].forEach((x) => {
  MS.push(x.slice(0, 7));
  MSTEP.push([x[7], DEFC]);
});

/* ----- Arcos paralelos (abrem por requisitos próprios, sem depender da ordem principal) ----- */
const OPT = {
  int: "Analisar o terreno e o inimigo",
  tai: "Enfrentar com força e resistência",
  vel: "Surpreender com velocidade",
  nin: "Usar chakra e ninjutsu",
  car: "Coordenar e convencer os aliados",
};

const stg = (rank, title, description, key, reward, xp, sc, st) => {
  const o = {
    rank,
    title,
    description,
    reward,
    xp,
    scene: [sc, st.split(",").map((s) => [OPT[s], s])],
  };
  EN[key] ? (o.enemy = key) : (o.goal = key);
  return o;
};

STORY_ARCS.push(
  {
    id: "floresta",
    free: 1,
    title: "Paralelo · Sombras na Floresta da Morte",
    summary: "Sobreviva ao Portão 44 e encare o Sannin Serpente.",
    unlock: { rank: 1, level: 8, missions: 5 },
    consequence:
      "Orochimaru recua e a Floresta da Morte passa a ser patrulhada.",
    missions: [
      stg(
        "C",
        "Portão 44",
        "Atravesse a floresta e proteja o pergaminho da equipe.",
        "zaku",
        200,
        65,
        "Rugidos ecoam e um ninja do Som ataca por trás das árvores.",
        "vel,int,tai",
      ),
      stg(
        "B",
        "O sinal do Som",
        "Detenha o ninja que persegue os candidatos.",
        "dosu",
        280,
        95,
        "Dosu prepara ondas sonoras que embaralham seus sentidos.",
        "int,nin,vel",
      ),
      stg(
        "A",
        "A serpente nas sombras",
        "Enfrente Orochimaru antes que ele marque a próxima vítima.",
        "oro",
        460,
        160,
        "Uma serpente gigante surge e Orochimaru sorri entre as raízes.",
        "int,nin,tai",
      ),
    ],
  },
  {
    id: "akatsuki2",
    free: 1,
    title: "Paralelo · Imortais da Akatsuki",
    summary: "Hidan e Kakuzu ameaçam as rotas comerciais.",
    unlock: { rank: 2, level: 14, missions: 10 },
    consequence:
      "Os caçadores de recompensas da Akatsuki são detidos e as rotas reabrem.",
    missions: [
      stg(
        "A",
        "Rastro dos imortais",
        "Siga corpos e rituais até o esconderijo da dupla.",
        "retrieve",
        420,
        150,
        "Símbolos de sangue marcam o chão em círculos perfeitos.",
        "int,vel,nin",
      ),
      stg(
        "A",
        "O ritual de Hidan",
        "Impeça que Hidan complete o ritual.",
        "hidan",
        520,
        185,
        "Hidan gargalha com a foice girando acima da cabeça.",
        "vel,tai,nin",
      ),
      stg(
        "A",
        "A dívida de Kakuzu",
        "Derrote o caçador de recompensas de cinco corações.",
        "kakuzu",
        580,
        205,
        "Fios negros costuram Kakuzu aos seus corações extras.",
        "int,tai,vel",
      ),
    ],
  },
  {
    id: "uchiha",
    free: 1,
    title: "Paralelo · O Segredo do Clã Uchiha",
    summary: "Investigue o Distrito Uchiha e a sombra de Itachi.",
    unlock: { rank: 2, level: 16, missions: 12 },
    consequence:
      "A verdade sobre o massacre fica registrada nos arquivos da vila.",
    missions: [
      stg(
        "B",
        "Documentos proibidos",
        "Recupere os registros guardados no Distrito Uchiha.",
        "retrieve",
        380,
        130,
        "Um selo antigo protege a sala de arquivos secretos.",
        "int,nin,vel",
      ),
      stg(
        "A",
        "A sombra do distrito",
        "Enfrente o ninja que vigia os arquivos.",
        "akat",
        460,
        160,
        "Um ninja de capa negra bloqueia a saída entre os telhados.",
        "vel,tai,nin",
      ),
      stg(
        "S",
        "O corvo de olhos rubros",
        "Enfrente Itachi e descubra o que ele esconde.",
        "itachi",
        760,
        270,
        "Corvos giram no ar e o Sharingan de Itachi encontra seus olhos.",
        "int,nin,car",
      ),
    ],
  },
  {
    id: "nuvem",
    free: 1,
    title: "Paralelo · Os Oito Caudas",
    summary: "Viaje à Vila da Nuvem e encontre Killer B.",
    unlock: { rank: 3, level: 20, missions: 22 },
    consequence:
      "A Vila da Nuvem se torna aliada e Killer B reconhece sua força.",
    missions: [
      stg(
        "A",
        "Escolta diplomática",
        "Escolte o emissário até a Vila da Nuvem.",
        "escort",
        560,
        200,
        "Trovões cortam o céu e mercenários cercam a comitiva.",
        "tai,vel,car",
      ),
      stg(
        "A",
        "Mercenários da tempestade",
        "Dissolva a emboscada nas montanhas.",
        "akat",
        600,
        215,
        "Raios caem em sequência e a trilha desmorona.",
        "vel,nin,int",
      ),
      stg(
        "S",
        "O rap do Jinchūriki",
        "Prove seu valor contra Killer B.",
        "killerb",
        820,
        295,
        "Killer B rima, gira as espadas e o chakra explode ao redor.",
        "vel,tai,nin",
      ),
    ],
  },
  {
    id: "chuva",
    free: 1,
    title: "Paralelo · A Chuva Que Não Cessa",
    summary: "Liberte a Vila da Chuva da sombra de Hanzō.",
    unlock: { rank: 3, level: 24, missions: 28 },
    consequence: "A chuva cessa sobre a vila, e Ame renasce como aliada.",
    missions: [
      stg(
        "A",
        "Prisioneiros de Ame",
        "Resgate civis presos nas torres da Chuva.",
        "rescue",
        640,
        230,
        "A chuva abafa passos e todas as torres parecem iguais.",
        "int,vel,nin",
      ),
      stg(
        "S",
        "O guardião das torres",
        "Derrube o imortal que protege o acesso.",
        "hidan",
        700,
        255,
        "Hidan surge das sombras e ri sob a chuva.",
        "tai,vel,nin",
      ),
      stg(
        "S",
        "A Salamandra de Ame",
        "Enfrente Hanzō e liberte a vila.",
        "hanzo",
        900,
        320,
        "Hanzō ergue a foice envenenada e a salamandra ruge atrás dele.",
        "int,tai,car",
      ),
    ],
  },
);
