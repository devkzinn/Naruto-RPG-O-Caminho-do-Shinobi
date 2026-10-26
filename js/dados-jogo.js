/* Dados estáticos do universo: elementos, clãs, personagens, locais, inimigos, exames, falas e agenda dos NPCs. */

const RK = ["Estudante da Academia", "Genin", "Chunin", "Jounin"],
  TM = ["Manhã", "Tarde", "Noite"];

const ST = ["nin", "tai", "vel", "int"],
  AT = [...ST, "car"];

const E = {
  fogo: [
    "Fogo",
    "🔥",
    "vento",
    ["Bola de Fogo", "Flores de Fênix", "Nuvem de Cinzas"],
  ],
  agua: [
    "Água",
    "💧",
    "fogo",
    ["Dragão de Água", "Projétil de Água", "Grande Cachoeira"],
  ],
  vento: [
    "Vento",
    "🌪️",
    "relampago",
    ["Grande Ruptura", "Lâmina de Vento", "Esferas de Vácuo"],
  ],
  terra: [
    "Terra",
    "⛰️",
    "agua",
    ["Parede de Terra", "Dragão de Terra", "Rio de Lama"],
  ],
  relampago: [
    "Relâmpago",
    "⚡",
    "terra",
    ["Descarga Elétrica", "Corrente Elétrica", "Mil Pássaros"],
  ],
};

const JUTSU_EFFECTS = {
  "fogo:0": { type: "burn", label: "Chance de queimar por 2 turnos" },
  "fogo:1": {
    type: "multi",
    label: "3 projéteis · pode interromper uma carga",
  },
  "agua:1": {
    type: "expose",
    label: "Pressão da água expõe a guarda",
  },
  "terra:0": {
    type: "wall",
    label: "Barreira reduz os próximos 2 ataques",
  },
  "terra:1": {
    type: "snare",
    label: "Prende o alvo e enfraquece seus ataques",
  },
  "agua:0": {
    type: "surge",
    cost: 1.25,
    label: "Dano elevado · custo de chakra +25%",
  },
  "relampago:1": {
    type: "stun",
    label: "Chance de paralisar ou reduzir o ataque",
  },
  "relampago:0": {
    type: "interrupt",
    label: "Interrompe uma carga e abre a guarda",
  },
  "vento:1": {
    type: "cut",
    label: "Dano extra contra inimigo concentrado",
  },
};

const BOSS_PATTERNS = {
  water: {
    title: "Névoa e pressão",
    telegraph: "O inimigo reúne chakra para uma onda devastadora.",
    attack: "desfere uma onda de água",
    multiplier: 2.1,
    interval: 3,
    weakness: "relampago",
    weaknessName: "Relâmpago",
    guard: 0.8,
    tactic:
      "Relâmpago interrompe o fluxo de água; use Defender quando a onda for anunciada.",
    effect: "drain",
  },
  gravity: {
    title: "Repulsão gravitacional",
    telegraph:
      "O inimigo concentra chakra para uma repulsão de grande alcance.",
    attack: "libera uma onda de força",
    multiplier: 2.3,
    interval: 3,
    weakness: "fogo",
    weaknessName: "Fogo",
    guard: 0.85,
    tactic:
      "Fogo pressiona a formação. Um jutsu de vários projéteis pode interromper a carga.",
    effect: "push",
  },
  assault: {
    title: "Investida de combate",
    telegraph: "O inimigo firma a postura para uma investida devastadora.",
    attack: "avança com um golpe pesado",
    multiplier: 2.2,
    interval: 3,
    weakness: "vento",
    weaknessName: "Vento",
    guard: 0.85,
    tactic:
      "Vento pode cortar a guarda durante a investida; Defender reduz muito o impacto.",
    effect: "assault",
  },
  genjutsu: {
    title: "Genjutsu do Sharingan",
    telegraph: "O inimigo fixa o olhar e prepara uma técnica ilusória.",
    attack: "atinge sua mente com um genjutsu",
    multiplier: 1.9,
    interval: 3,
    weakness: "agua",
    weaknessName: "Água",
    guard: 0.8,
    tactic:
      "Água rompe o ritmo do genjutsu. Interrompa a preparação ou defenda-se para preservar chakra.",
    effect: "genjutsu",
  },
  heavy: {
    title: "Poder avassalador",
    telegraph: "O inimigo concentra chakra para um ataque devastador.",
    attack: "desfere o golpe devastador",
    multiplier: 2.2,
    interval: 3,
    weakness: "relampago",
    weaknessName: "Relâmpago",
    guard: 0.9,
    tactic:
      "Relâmpago pode romper a defesa; uma abertura após o ataque é a melhor hora para contra-atacar.",
    effect: "heavy",
  },
  orochimaru: {
    title: "Mordida da serpente",
    telegraph: "A serpente reúne veneno e chakra para atacar.",
    attack: "atinge você com uma mordida venenosa",
    multiplier: 1.8,
    interval: 2,
    weakness: "relampago",
    weaknessName: "Relâmpago",
    guard: 0.82,
    tactic:
      "Relâmpago interrompe o bote. Se a mordida vier, o veneno continuará causando dano.",
    effect: "poison",
  },
  gaara: {
    title: "Prisão de areia",
    telegraph: "A areia se ergue e começa a fechar o cerco ao seu redor.",
    attack: "esmaga você dentro de uma prisão de areia",
    multiplier: 2,
    interval: 2,
    weakness: "agua",
    weaknessName: "Água",
    guard: 0.65,
    tactic:
      "Água desfaz a armadura de areia. Ação da equipe também pode criar uma abertura.",
    effect: "sand",
  },
  madara: {
    title: "Susanoo",
    telegraph: "O Susanoo se ergue e prepara um golpe em área.",
    attack: "desfere um golpe colossal do Susanoo",
    multiplier: 2.5,
    interval: 3,
    weakness: "vento",
    weaknessName: "Vento",
    guard: 0.62,
    tactic:
      "Vento atravessa a defesa do Susanoo. Guarde chakra para interromper a carga ou use uma abertura da equipe.",
    effect: "susanoo",
  },
};

const BUILDS = [
  { name: "Especialista em Ninjutsu", main: "nin", support: "int" },
  { name: "Especialista em Taijutsu", main: "tai", support: "vel" },
  { name: "Ninja Veloz", main: "vel", support: "tai" },
  { name: "Estrategista", main: "int", support: "car" },
  { name: "Sensor de Chakra", main: "int", support: "nin" },
  { name: "Combatente Equilibrado", main: "tai", support: "nin" },
];

const CLANS = {
  none: {
    name: "Sem clã",
    icon: "🍃",
    description: "Sem bônus fixos; sua trajetória será definida pelo treino.",
    tradition: "Sem uma linhagem formal, seu legado será construído pelas escolhas e alianças que fizer.",
  },
  uchiha: {
    name: "Uchiha",
    icon: "👁️",
    description:
      "Sharingan · +2 em ninjutsu de combate e +10% de dano de jutsu. A partir do nível 8: +1 adicional.",
    tradition: "Uma linhagem marcada por laços intensos, talento ocular e a responsabilidade de não repetir antigas tragédias.",
  },
  hyuga: {
    name: "Hyūga",
    icon: "白",
    description:
      "Byakugan · +2 em investigação e rastreamento, além de +10% de esquiva. A partir do nível 8: +1 adicional.",
    tradition: "Disciplina, percepção e dever familiar moldam esta linhagem; confiança se conquista com respeito às escolhas individuais.",
  },
  senju: {
    name: "Senju",
    icon: "🌳",
    description:
      "Vitalidade · +12 de vida máxima e kits médicos recuperam +10 HP. A partir do nível 8: +1 em testes de proteção.",
    tradition: "Uma herança ligada à fundação de Konoha e à vontade de proteger a vila sem apagar as diferenças de cada geração.",
  },
  uzumaki: {
    name: "Uzumaki",
    icon: "🌀",
    description:
      "Reservas de chakra · +15 de chakra máximo e jutsus custam 10% menos. A partir do nível 8: +1 em testes de ninjutsu.",
    tradition: "Resiliência e reservas extraordinárias de chakra acompanham uma história de dispersão, reencontro e sobrevivência.",
  },
};

const ORGANIZATIONS = {
  anbu: {
    name: "ANBU",
    icon: "🎭",
    description:
      "Força de operações especiais de Konoha. Exige discrição, preparo e confiança da vila.",
    location: "torre",
    requirements: { rank: 2, missions: 8, reputation: 35, charisma: 6 },
    tests: [
      ["Um relatório contém uma informação que não deveria circular. O que você faz?", [["Compartilho apenas com a cadeia de comando", "int"], ["Protejo a fonte antes de entregar o relatório", "car"], ["Confirmo os fatos por uma rota independente", "vel"]]],
      ["Uma ordem coloca um aliado em risco desnecessário. Como reage?", [["Apresento uma alternativa tática antes de agir", "int"], ["Assumo a responsabilidade e protejo a equipe", "tai"], ["Peço uma confirmação formal sem expor o aliado", "car"]]],
      ["No teste final, sua identidade pode ser revelada para salvar um civil.", [["Interrompo a operação e retiro o civil", "vel"], ["Concluo a missão sem abandonar a pessoa", "car"], ["Uso o terreno para criar uma saída segura", "nin"]]],
    ],
    perk: "Bônus de investigação e infiltração em missões.",
  },
  akatsuki: {
    name: "Akatsuki",
    icon: "☁️",
    description:
      "Uma organização clandestina que recruta shinobi renegados. Sua proposta e seus custos não são os mesmos de uma vila.",
    location: "akatsuki",
    requirements: {
      rank: 2,
      missions: 5,
      maxReputation: 45,
      charisma: 5,
      renegade: true,
    },
    tests: [
      ["Um contato testa sua discrição antes de revelar o próximo ponto.", [["Mudo a rota e observo quem me segue", "vel"], ["Negocio informação sem revelar meu objetivo", "car"], ["Procuro sinais de uma armadilha", "int"]]],
      ["Uma ordem da organização entra em conflito com seu próprio julgamento.", [["Peço os motivos antes de aceitar", "car"], ["Avalio o risco e proponho outro método", "int"], ["Recuso colocar a equipe em perigo cego", "tai"]]],
      ["Um rival oferece uma informação valiosa em troca de confiança.", [["Verifico a pista sem entregar minha posição", "int"], ["Aceito um encontro em terreno neutro", "car"], ["Crio uma rota de retirada antes de conversar", "vel"]]],
    ],
    perk: "Bônus de combate e recuperação de informação em missões.",
  },
};

const SPECIALIZATIONS = {
  balanced: {
    name: "Generalista",
    icon: "⚖️",
    description: "Sem bônus focados; flexível para qualquer função.",
  },
  ninjutsu: {
    name: "Ninjutsu",
    icon: "🔥",
    description:
      "+2 em testes de ninjutsu; a partir do nível 8, +1 adicional e +10% de dano de jutsu.",
  },
  taijutsu: {
    name: "Taijutsu",
    icon: "🥋",
    description:
      "+2 em testes de taijutsu; a partir do nível 8, +1 adicional e +10% de dano físico.",
  },
  tracking: {
    name: "Rastreamento",
    icon: "🐾",
    description:
      "+2 em velocidade e inteligência em investigação, busca e resgate; nível 8 revela uma pista extra por etapa investigativa bem-sucedida.",
  },
  strategy: {
    name: "Estratégia",
    icon: "♟️",
    description:
      "+2 em inteligência e carisma em missões; com equipe, reduz a dificuldade em 1. Nível 8 amplia a redução para 2.",
  },
  medical: {
    name: "Medicina ninja",
    icon: "🩺",
    description:
      "+2 em inteligência durante resgates e proteção; kits médicos recuperam +10 HP. Nível 8 aumenta o bônus de teste.",
  },
};

const GEAR = {
  kunai: {
    name: "Kunai balanceada",
    icon: "🗡️",
    slot: "weapon",
    cost: 90,
    description: "+2 em testes de taijutsu.",
  },
  armor: {
    name: "Armadura leve",
    icon: "🦺",
    slot: "armor",
    cost: 120,
    description: "Reduz em 10% o dano recebido.",
  },
  scroll: {
    name: "Pergaminho de chakra",
    icon: "📜",
    slot: "tool",
    cost: 110,
    description: "+2 em testes de ninjutsu.",
  },
  goggles: {
    name: "Óculos de rastreamento",
    icon: "🥽",
    slot: "tool",
    cost: 100,
    description: "+2 em testes de inteligência.",
  },
};

// NPC: [nome, emoji, título, falas, [hp, ataque, elemento], [bônus do conselho, texto]]
const N = {
  iruka: [
    "Iruka",
    "🍥",
    "Instrutor da Academia",
    [
      "“Todo grande ninja começou aprendendo. Continue firme!”",
      "“Força sem coração não faz um shinobi.”",
      "“Minha porta está sempre aberta para quem quer estudar.”",
    ],
    [70, 9, ""],
    ["int", "Iruka revisa suas táticas e você aprende muito sobre estratégia."],
  ],
  konohamaru: [
    "Konohamaru",
    "🧣",
    "Neto do Terceiro",
    [
      "“Um dia serei Hokage, tá ligado?!”",
      "“Quer me ajudar a pregar uma peça? Hehe!”",
      "“O chefe Naruto é meu rival… e meu ídolo!”",
    ],
    [40, 5, ""],
    ["vel", "Konohamaru mostra um atalho secreto e treina sua velocidade."],
  ],
  teuchi: [
    "Teuchi",
    "🍜",
    "Dono do Ichiraku",
    [
      "“Ramen fresquinho! A casa é sua, shinobi.”",
      "“Ninja de barriga cheia luta melhor, é a minha lei!”",
      "“O Naruto já devorou umas mil tigelas aqui.”",
    ],
    [50, 4, ""],
    ["mh", "Teuchi serve o ramen especial e sua vitalidade aumenta!"],
  ],
  naruto: [
    "Naruto Uzumaki",
    "🍥",
    "Shinobi hiperativo",
    [
      "“Eu vou ser Hokage, dattebayo!”",
      "“Ei, vamos treinar? Nunca desisto!”",
      "“Ramen é a melhor coisa do mundo!”",
    ],
    [90, 11, "vento"],
    ["vel", "Naruto ensina um truque com clones e você ganha agilidade."],
  ],
  lee: [
    "Rock Lee",
    "💚",
    "Mestre do taijutsu",
    [
      "“A juventude floresce! Vamos treinar até cair!”",
      "“Trabalho duro supera o talento!”",
      "“Se não fizer 500 flexões, farei 1000!”",
    ],
    [80, 12, ""],
    ["tai", "Lee divide seus pesos de treino e seus golpes ficam mais fortes."],
  ],
  sasuke: [
    "Sasuke Uchiha",
    "⚡",
    "Prodígio solitário",
    [
      "“…Não me atrapalhe.”",
      "“Poder é o que importa. Treine mais.”",
      "“Hmph. Você não é tão fraco assim.”",
    ],
    [85, 13, "relampago"],
    ["nin", "Sasuke corrige sua forma de moldar chakra."],
  ],
  sakura: [
    "Sakura Haruno",
    "🌸",
    "Ninja médica",
    [
      "“Cuide bem de si mesmo, ouviu?”",
      "“Controle de chakra é tudo!”",
      "“Se ficar ferido, venha ao hospital.”",
    ],
    [75, 12, ""],
    [
      "mh",
      "Sakura ensina um pouco de ninjutsu médico e seu corpo resiste mais.",
    ],
  ],
  neji: [
    "Neji Hyuuga",
    "👁️",
    "Gênio do Clã Hyuuga",
    [
      "“Destino… é algo que podemos mudar.”",
      "“Meus olhos veem tudo ao redor.”",
      "“Não subestime ninguém.”",
    ],
    [85, 12, ""],
    ["vel", "Neji mostra como ler o movimento do oponente."],
  ],
  kakashi: [
    "Kakashi Hatake",
    "📖",
    "Ninja Copiador",
    [
      "“Cheguei atrasado… havia um gato preto.”",
      "“Quem quebra regras é lixo, quem abandona amigos é pior.”",
      "“Hm? Estava lendo. Não é da sua conta.”",
    ],
    [120, 16, "relampago"],
    ["nin", "Kakashi demonstra um selo de mão raro e seu ninjutsu evolui."],
  ],
  tsunade: [
    "Tsunade",
    "👑",
    "Quinta Hokage",
    [
      "“Quer uma missão? Tenho muitas pendentes.”",
      "“A vila é minha prioridade, mocinho(a).”",
      "“Não me faça perder a paciência.”",
    ],
    [140, 18, ""],
    ["mh", "Tsunade transfere um pouco de chakra e sua vida aumenta."],
  ],
  shizune: [
    "Shizune",
    "🐷",
    "Assistente da Hokage",
    [
      "“Papelada, papelada… sempre papelada!”",
      "“Não deixe a Lady Tsunade beber demais.”",
      "“Seja gentil com os pacientes.”",
    ],
    [60, 8, ""],
    ["int", "Shizune ensina a identificar venenos."],
  ],
  jiraiya: [
    "Jiraiya",
    "🐸",
    "Sennin Sapo",
    [
      "“Eu sou o grande Jiraiya, o ermitão!”",
      "“Pesquisa de campo, claro. Pesquisa!”",
      "“Shinobi de verdade protege o futuro.”",
    ],
    [130, 17, "fogo"],
    ["nin", "Jiraiya compartilha um segredo de chakra natural."],
  ],
  hinata: [
    "Hinata Hyuuga",
    "💜",
    "Gentil kunoichi",
    [
      "“Ah… o-olá…”",
      "“Eu também quero ficar mais forte.”",
      "“Naruto me inspira todos os dias.”",
    ],
    [75, 10, ""],
    ["tai", "Hinata ensina o Punho Gentil básico."],
  ],
  anko: [
    "Anko Mitarashi",
    "🍡",
    "Examinadora ousada",
    [
      "“Quer sobreviver? Então não grite!”",
      "“Dango é vida, garoto(a).”",
      "“Na Floresta da Morte só vencem os cruéis.”",
    ],
    [90, 13, ""],
    ["tai", "Anko ensina uma emboscada com kunai."],
  ],
  kurenai: [
    "Kurenai Yuhi",
    "🌹",
    "Mestra de genjutsu",
    [
      "“Um bom ninja enxerga além da ilusão.”",
      "“Calma e controle: é isso que separa a técnica do caos.”",
      "“Os alunos de hoje são os guardiões de amanhã.”",
    ],
    [110, 15, ""],
    ["int", "Kurenai mostra como quebrar um genjutsu."],
  ],
  shikamaru: [
    "Shikamaru Nara",
    "☁️",
    "Estrategista do Time 10",
    [
      "“Que problemático… mas alguém precisa pensar nisso.”",
      "“Observe o campo antes de fazer seu movimento.”",
      "“Uma boa estratégia evita uma luta desnecessária.”",
    ],
    [90, 13, ""],
    ["int", "Shikamaru ajuda você a antecipar os movimentos do oponente."],
  ],
  choji: [
    "Choji Akimichi",
    "🍟",
    "Especialista em taijutsu",
    [
      "“Depois do treino, vamos ao Ichiraku?”",
      "“Nunca subestime alguém que luta pelos amigos.”",
      "“As técnicas do meu clã exigem preparo e controle.”",
    ],
    [100, 14, ""],
    ["tai", "Choji ensina a transformar força em golpes precisos."],
  ],
  ino: [
    "Ino Yamanaka",
    "🌼",
    "Ninja sensorial",
    [
      "“A comunicação é tão importante quanto a técnica.”",
      "“Preste atenção no que as pessoas não dizem.”",
      "“Posso ajudar com flores… ou com uma missão.”",
    ],
    [85, 12, ""],
    ["int", "Ino ensina a manter a concentração sob pressão."],
  ],
  kiba: [
    "Kiba Inuzuka",
    "🐕",
    "Ninja rastreador",
    [
      "“Akamaru e eu encontramos qualquer rastro!”",
      "“Se vai correr, tente acompanhar a gente.”",
      "“Um bom olfato salva tempo e vidas.”",
    ],
    [95, 14, ""],
    ["vel", "Kiba ensina você a se mover com rapidez pelo terreno."],
  ],
  shino: [
    "Shino Aburame",
    "🪲",
    "Ninja de observação",
    [
      "“A informação correta pode decidir uma missão.”",
      "“Meus insetos perceberam movimento ao norte.”",
      "“Não confunda silêncio com falta de atenção.”",
    ],
    [90, 13, ""],
    ["int", "Shino mostra como observar sinais quase imperceptíveis."],
  ],
  tenten: [
    "Tenten",
    "🗡️",
    "Especialista em armas ninja",
    [
      "“Uma ferramenta certa pode mudar o rumo da missão.”",
      "“Pratique a mira antes de gastar seus pergaminhos.”",
      "“Lee e Neji treinam sem parar. Eu também.”",
    ],
    [90, 13, ""],
    ["tai", "Tenten orienta seu treino de precisão e postura."],
  ],
  temari: [
    "Temari",
    "🌬️",
    "Kunoichi da Areia",
    [
      "“Não confunda distância com segurança.”",
      "“Uma rajada bem calculada encerra a luta depressa.”",
      "“A aliança entre as vilas protege a todos.”",
    ],
    [115, 16, "vento"],
    ["vel", "Temari ensina a usar o terreno para controlar a distância."],
  ],
  gaara: [
    "Gaara",
    "🏜️",
    "Kazekage da Areia",
    [
      "“Já não caminho sozinho.”",
      "“Proteger a vila é uma responsabilidade que escolhi.”",
      "“A confiança entre aliados também exige coragem.”",
    ],
    [145, 18, "terra"],
    ["int", "Gaara compartilha lições sobre proteger aliados em combate."],
  ],
  yamato: [
    "Yamato",
    "🌳",
    "Capitão da equipe",
    [
      "“Vamos manter a formação e seguir o plano.”",
      "“Controle de chakra se constrói com prática.”",
      "“Trabalho em equipe vem antes de qualquer técnica.”",
    ],
    [130, 17, "terra"],
    ["nin", "Yamato guia um exercício de controle de chakra."],
  ],
  sai: [
    "Sai",
    "🖌️",
    "Ninja da Raiz",
    [
      "“Estou aprendendo a compreender melhor os outros.”",
      "“Um desenho também pode transmitir uma mensagem.”",
      "“A equipe depende de confiança mútua.”",
    ],
    [105, 15, ""],
    ["int", "Sai ensina a registrar informações sem chamar atenção."],
  ],
  tazuna: [
    "Tazuna",
    "🔨",
    "Construtor da Ponte Naruto",
    [
      "“Esta ponte vai ligar pessoas, não apenas margens.”",
      "“A estrada ficou perigosa, mas não vou desistir.”",
      "“Obrigado por proteger minha equipe.”",
    ],
    [65, 6, ""],
    ["int", "Tazuna explica como avaliar estruturas e escolher rotas seguras."],
  ],
  kabuto: [
    "Kabuto Yakushi",
    "📚",
    "Ninja médico e informante",
    [
      "“Tenho algumas informações úteis para sua equipe.”",
      "“Observar antes de agir costuma evitar problemas.”",
      "“Ainda estou decidindo em quem confiar.”",
    ],
    [105, 14, ""],
    ["int", "Kabuto ensina a reconhecer sinais de armadilhas."],
  ],
  kankuro: [
    "Kankuro",
    "🎭",
    "Ninja das Marionetes",
    [
      "“Não chegue perto das minhas marionetes sem avisar.”",
      "“Lutar à distância também exige precisão.”",
      "“A Areia sabe cuidar dos seus.”",
    ],
    [120, 16, "terra"],
    ["tai", "Kankuro treina com você o controle preciso de armas."],
  ],
  itachi: [
    "Itachi Uchiha",
    "🐦‍⬛",
    "Ninja renegado da Akatsuki",
    [
      "“A realidade nem sempre é o que os olhos mostram.”",
      "“Proteja aquilo que realmente importa.”",
      "“Não confunda poder com compreensão.”",
    ],
    [190, 22, "fogo"],
    ["nin", "Itachi demonstra como manter o foco diante de ilusões."],
  ],
  kisameNpc: [
    "Kisame Hoshigaki",
    "🦈",
    "Espadachim da Névoa",
    [
      "“A Samehada reconhece chakra de longe.”",
      "“Espero que você saiba nadar.”",
      "“Ordens são ordens.”",
    ],
    [185, 23, "agua"],
    ["tai", "Kisame ensina a controlar a respiração durante o combate."],
  ],
  fukasaku: [
    "Fukasaku",
    "🐸",
    "Sábio do Monte Myoboku",
    [
      "“A energia natural exige equilíbrio e paciência.”",
      "“Não tente absorver mais do que consegue controlar.”",
      "“Jiraiya ainda tem muito a aprender.”",
    ],
    [160, 20, "vento"],
    ["nin", "Fukasaku orienta um exercício avançado de concentração."],
  ],
};

N.haku = [
  "Haku",
  "❄️",
  "Ninja da Névoa",
  [
    "“A força verdadeira nasce quando protegemos alguém.”",
    "“Não queria que as coisas terminassem assim.”",
    "“O gelo pode esconder mais do que uma pessoa.”",
  ],
  [110, 16, "agua"],
  ["vel", "Haku ensina você a observar reflexos e movimentos na névoa."],
];

N.gato = [
  "Gato",
  "💰",
  "Mercenário do País das Ondas",
  [
    "“Tudo tem um preço. Até a lealdade.”",
    "“Ninjas são ferramentas úteis quando bem pagos.”",
    "“Você acha que pode mudar o destino desta ponte?”",
  ],
  [130, 18, ""],
  ["int", "Você descobre rotas usadas pelos mercenários de Gato."],
];

N.oro = [
  "Orochimaru",
  "🐍",
  "Sannin renegado e líder do Som",
  [
    "“A imortalidade é apenas o começo da pesquisa.”",
    "“Mostre-me que você tem algo que vale a pena estudar.”",
    "“Lealdade é uma ferramenta, não uma virtude.”",
  ],
  [340, 24, "terra"],
  ["int", "Orochimaru observa seus limites e revela pouco de seus planos."],
];

N.dosu = [
  "Dosu Kinuta",
  "🎧",
  "Líder do trio do Som",
  [
    "“O som chega antes do golpe.”",
    "“Não confunda silêncio com segurança.”",
    "“Orochimaru tem planos para todos nós.”",
  ],
  [125, 17, "relampago"],
  ["int", "Dosu revela como identificar armadilhas sonoras."],
];

N.tayuya = [
  "Tayuya",
  "🎼",
  "Kunoichi do Quarteto do Som",
  [
    "“Não me venha com sermões.”",
    "“Minha flauta não é para enfeite.”",
    "“Seus aliados não vão ouvir você gritar.”",
  ],
  [175, 21, "vento"],
  ["nin", "Tayuya demonstra como manter o foco sob pressão sonora."],
];

N.obito = [
  "Tobi",
  "🌀",
  "Máscara da Akatsuki",
  [
    "“Tobi é um bom rapaz! …Ou talvez não.”",
    "“O mundo está cheio de surpresas.”",
    "“Você ainda não entende o plano.”",
  ],
  [230, 25, "fogo"],
  ["int", "Você percebe inconsistências na história contada pelo mascarado."],
];

N.danzo = [
  "Danzō Shimura",
  "🩹",
  "Líder da Raiz",
  [
    "“A vila precisa sobreviver, custe o que custar.”",
    "“Nem todas as decisões podem ser tomadas às claras.”",
    "“A Raiz protege Konoha nas sombras.”",
  ],
  [220, 26, "vento"],
  ["int", "Danzō revela informações sobre operações secretas da vila."],
];

N.chiyo = [
  "Chiyo",
  "🧓",
  "Mestra das marionetes da Areia",
  [
    "“As escolhas de uma geração moldam a seguinte.”",
    "“Uma marionete só é tão forte quanto quem a controla.”",
    "“Gaara merece a chance de escolher seu próprio caminho.”",
  ],
  [155, 19, "terra"],
  ["int", "Chiyo ensina a reconhecer mecanismos escondidos em marionetes."],
];

const CLAN_FAMILY_MEMBERS = {
  uchiha: ["sasuke", "itachi", "obito", "madara"],
  hyuga: ["neji", "hinata", "hanabi"],
  senju: ["tsunade", "hashirama", "tobirama"],
  uzumaki: ["naruto", "nagato", "karin"],
};

// Idade inicial do elenco; o tempo vivido no save é somado a esses valores.
const NA = {
  iruka: 25,
  konohamaru: 8,
  teuchi: 43,
  naruto: 12,
  lee: 13,
  sasuke: 12,
  sakura: 12,
  neji: 13,
  kakashi: 26,
  tsunade: 51,
  shizune: 28,
  jiraiya: 54,
  hinata: 12,
  anko: 24,
  kurenai: 27,
  shikamaru: 12,
  choji: 12,
  ino: 12,
  kiba: 12,
  shino: 12,
  tenten: 13,
  temari: 15,
  gaara: 12,
  yamato: 26,
  sai: 17,
  tazuna: 58,
  kabuto: 19,
  kankuro: 13,
  itachi: 17,
  kisameNpc: 29,
  fukasaku: 800,
  haku: 15,
  gato: 48,
  oro: 50,
  dosu: 14,
  tayuya: 14,
  obito: 31,
  danzo: 72,
  chiyo: 73,
};

// Locais e personagens que podem aparecer em cada região.
const L = {
  academia: ["🏫", "Academia Ninja", ["iruka", "konohamaru"]],
  ichiraku: ["🍜", "Ichiraku Ramen", ["teuchi", "naruto", "hinata", "choji"]],
  treino: [
    "🥋",
    "Campo de Treinamento",
    [
      "lee",
      "sasuke",
      "sakura",
      "neji",
      "kakashi",
      "kurenai",
      "shikamaru",
      "choji",
      "ino",
      "kiba",
      "shino",
      "tenten",
      "yamato",
    ],
  ],
  torre: [
    "🏯",
    "Torre do Hokage",
    ["tsunade", "shizune", "jiraiya", "shikamaru", "sai", "danzo"],
  ],
  hospital: ["🏥", "Hospital de Konoha", ["sakura", "shizune", "hinata"]],
  mercado: [
    "🏮",
    "Mercado",
    ["hinata", "konohamaru", "anko", "jiraiya", "kurenai", "ino", "tenten"],
  ],
  floresta: [
    "🌲",
    "Floresta de Konoha",
    ["anko", "neji", "naruto", "kiba", "shino"],
  ],
  portao: ["🚪", "Portão de Konoha", ["kakashi", "yamato", "sai", "shikamaru"]],
  areia: ["🏜️", "Vila da Areia", ["gaara", "temari", "kankuro"]],
  onda: [
    "🌉",
    "País das Ondas",
    ["tazuna", "kakashi", "naruto", "haku", "gato"],
  ],
  exame: [
    "🌳",
    "Floresta da Morte",
    ["anko", "kabuto", "sasuke", "naruto", "dosu"],
  ],
  fronteira: [
    "🛤️",
    "Fronteira do País do Fogo",
    ["kiba", "shino", "yamato", "sai"],
  ],
  vale: ["🗿", "Vale do Fim", ["naruto", "sasuke", "kakashi"]],
  monte: ["🐸", "Monte Myoboku", ["fukasaku", "jiraiya"]],
  akatsuki: ["🌑", "Esconderijo da Akatsuki", ["itachi", "kisameNpc", "obito"]],
  som: ["🎵", "Esconderijo do Som", ["kabuto", "dosu", "tayuya"]],
  ponte: ["🌉", "Ponte Naruto", ["tazuna", "haku", "gato"]],
  distrito: ["🏮", "Distrito Uchiha", ["sasuke", "itachi"]],
  hospitalareia: ["🏥", "Hospital da Areia", ["chiyo", "kankuro", "sakura"]],
  posto: ["🛖", "Posto de patrulha", ["kiba", "shino", "yamato"]],
  santuario: ["🐍", "Santuário da Cobra", ["oro", "kabuto", "dosu"]],
};

const LOC_GROUPS = [
  [
    "Konoha",
    [
      "academia",
      "ichiraku",
      "treino",
      "torre",
      "hospital",
      "mercado",
      "portao",
      "floresta",
      "distrito",
      "posto",
    ],
  ],
  [
    "Países e fronteiras",
    ["onda", "ponte", "areia", "hospitalareia", "fronteira"],
  ],
  [
    "Locais especiais",
    ["exame", "vale", "monte", "som", "santuario", "akatsuki"],
  ],
];

const LOC_REQ = {
  onda: { rk: 1, done: 0 },
  ponte: { rk: 1, done: 1 },
  areia: { rk: 1, done: 0 },
  hospitalareia: { rk: 1, done: 3 },
  exame: { rk: 1, done: 1 },
  fronteira: { rk: 1, done: 2 },
  posto: { rk: 1, done: 1 },
  distrito: { rk: 1, done: 4 },
  vale: { rk: 1, done: 4 },
  som: { rk: 1, done: 2 },
  santuario: { rk: 2, done: 6 },
  monte: { rk: 2, done: 5 },
  akatsuki: { rk: 2, done: 5 },
};

// Romance: SOMENTE personagens adultos e jogador com 18+. [presente favorito, resposta positiva, resposta negativa]
const RM = {
  iruka: [
    "livro",
    "“Você é atencioso(a)… isso me deixa sem jeito.”",
    "“Sou seu professor, lembra? Vamos com calma.”",
  ],
  kakashi: [
    "livro",
    "“Maa, maa… você tem coragem. Gosto disso.”",
    "“Hm, talvez em outra hora. Estou lendo.”",
  ],
  tsunade: [
    "cha",
    "“Heh, ousado(a). Poucos têm essa audácia comigo.”",
    "“Cuidado, ou o próximo soco é de verdade.”",
  ],
  shizune: [
    "flor",
    "“Ah! V-você acha mesmo?… Obrigada, fico feliz.”",
    "“Desculpe, estou cheia de papelada agora…”",
  ],
  anko: [
    "dango",
    "“Ousado(a)… gosto disso. Continue.”",
    "“Hmph, vai com calma, novato(a).”",
  ],
  kurenai: [
    "flor",
    "“Que gentileza… você sabe mesmo conquistar alguém.”",
    "“Hoje não. Preciso manter o foco.”",
  ],
};

const G = {
  flor: ["🌹 Flores", 25],
  dango: ["🍡 Dango", 15],
  livro: ["📖 Livro", 30],
  cha: ["🍵 Chá fino", 20],
};

const DT = [
  ["Passear pela vila ao entardecer", "vel"],
  ["Conversar sob as estrelas", "car"],
  ["Dividir uma tigela no Ichiraku", "int"],
];

// Inimigos: [nome, hp, ataque, elemento, chefe?]
const EN = {
  ladrao: ["Ladrão de Estrada", 40, 7, ""],
  lobo: ["Lobo Selvagem", 36, 8, ""],
  renegado: ["Ninja Renegado", 70, 11, "fogo"],
  bandidos: ["Líder dos Bandidos", 80, 12, ""],
  kiri: ["Espadachim Renegado", 120, 16, "agua"],
  akat: ["Ninja de Capa Negra", 200, 22, "terra"],
  som: ["Ninja do Som", 105, 14, "relampago"],
  quarteto: ["Membro do Quarteto do Som", 190, 20, "terra", 1],
  kimimaro: ["Kimimaro, último do clã Kaguya", 280, 25, "terra", 1],
  deidara: ["Deidara, artista da explosão", 390, 29, "terra", 1],
  sasori: ["Sasori da Areia Vermelha", 430, 31, "fogo", 1],
  hidan: ["Hidan, imortal da Akatsuki", 520, 32, ""],
  kakuzu: ["Kakuzu, caçador de recompensas", 560, 35, "relampago", 1],
  haku: ["Haku, espelhos de gelo", 150, 18, "agua", 1],
  gato: ["Mercenário de Gato", 130, 17, ""],
  dosu: ["Dosu Kinuta", 145, 18, "relampago", 1],
  zaku: ["Zaku Abumi", 135, 17, "vento"],
  kin: ["Kin Tsuchi", 125, 16, "terra"],
  tayuya: ["Tayuya, flautista do Som", 210, 23, "vento", 1],
  jirobo: ["Jirobo, força do Quarteto", 240, 24, "terra", 1],
  kidomaru: ["Kidomaru, arqueiro do Som", 220, 23, "terra", 1],
  sakon: ["Sakon e Ukon", 250, 25, "terra", 1],
  obito: ["Tobi, máscara da Akatsuki", 620, 37, "fogo", 1],
  danzo: ["Danzō Shimura, líder da Raiz", 580, 36, "vento", 1],
  zabuza: ["Zabuza Momochi, Demônio da Névoa", 230, 19, "agua", 1],
  oro: ["Orochimaru, o Sannin Serpente", 340, 24, "terra", 1],
  kisame: ["Kisame Hoshigaki, Monstro da Névoa", 480, 28, "agua", 1],
  pain: ["Pain, o Deus que Desce", 640, 34, "vento", 1],
};

EN.gaaraStory = ["Gaara do Deserto, rival do torneio", 260, 24, "terra", 1];

EN.sasukeStory = [
  "Sasuke Uchiha, confronto no Vale do Fim",
  420,
  30,
  "relampago",
  1,
];

EN.kabutoStory = ["Kabuto Yakushi, espião da guerra", 680, 38, "agua", 1];

EN.madaraStory = ["Madara Uchiha, lenda revivida", 820, 42, "fogo", 1];

EN.shinobiDissidente = ["Líder dos Dissidentes", 760, 40, "relampago", 1];

const SEASONS = [
  {
    name: "Primavera",
    weather: ["Céu limpo", "Chuva leve", "Neblina matinal"],
  },
  {
    name: "Verão",
    weather: ["Calor intenso", "Céu limpo", "Tempestade"],
  },
  {
    name: "Outono",
    weather: ["Vento forte", "Chuva leve", "Céu nublado"],
  },
  { name: "Inverno", weather: ["Frio intenso", "Neve", "Céu limpo"] },
];

const SOCIAL_SCENES = {
  iruka: {
    prompt:
      "Iruka pede ajuda para organizar um treino da Academia antes da próxima turma chegar.",
    choices: [
      [
        "Ajudar a preparar a aula",
        "“Obrigado. Um bom começo pode mudar o dia de um estudante.”",
        "help",
      ],
      [
        "Demonstrar um exercício em dupla",
        "“Boa ideia. Aprendemos melhor quando praticamos juntos.”",
        "train",
      ],
      [
        "Perguntar como estão os alunos",
        "“Eles estão crescendo. É isso que me dá orgulho.”",
        "listen",
      ],
    ],
  },
  naruto: {
    prompt:
      "Naruto aparece animado: alguns clones se perderam depois de um treino no campo.",
    choices: [
      [
        "Ajudá-lo a reunir os clones",
        "“Sabia que podia contar com você! Dattebayo!”",
        "help",
      ],
      [
        "Transformar a busca em uma corrida",
        "“Agora sim! Quem chegar por último paga o ramen!”",
        "train",
      ],
      [
        "Ouvir o plano dele até o fim",
        "“Às vezes eu começo antes de explicar, né?”",
        "listen",
      ],
    ],
  },
  sakura: {
    prompt:
      "Sakura está organizando suprimentos médicos para uma equipe que volta de missão.",
    choices: [
      [
        "Ajudar a conferir os materiais",
        "“Valeu. Cada curativo certo pode fazer diferença.”",
        "help",
      ],
      [
        "Praticar controle de chakra",
        "“Precisão primeiro. Não precisa forçar além do necessário.”",
        "train",
      ],
      [
        "Perguntar se ela também está descansando",
        "“Estou bem… obrigada por lembrar de perguntar.”",
        "rest",
      ],
    ],
  },
  shikamaru: {
    prompt:
      "Shikamaru analisa o mapa da vila e quer saber qual patrulha precisa de reforço.",
    choices: [
      [
        "Revisar os caminhos com ele",
        "“Boa leitura. Isso pode evitar um problema amanhã.”",
        "consult",
      ],
      [
        "Simular uma estratégia de defesa",
        "“Que problemático… mas esse plano faz sentido.”",
        "train",
      ],
      [
        "Ouvir o que preocupa a equipe",
        "“É bom poder falar sem transformar tudo em reunião.”",
        "listen",
      ],
    ],
  },
  teuchi: {
    prompt:
      "Teuchi separou uma tigela extra: Naruto pagou adiantado, mas ainda não apareceu.",
    choices: [
      [
        "Dividir a tigela com Teuchi",
        "“Ramen compartilhado fica ainda melhor. Sente-se!”",
        "rest",
      ],
      [
        "Ajudar a levar tigelas às mesas",
        "“Obrigado! A casa fica mais animada quando todos ajudam.”",
        "help",
      ],
      [
        "Perguntar as novidades do Ichiraku",
        "“Tenho uma história nova para cada tigela servida.”",
        "listen",
      ],
    ],
  },
  lee: {
    prompt:
      "Lee propõe um treino surpresa, mas promete parar antes que alguém se machuque.",
    choices: [
      [
        "Aceitar um treino técnico curto",
        "“Excelente! A juventude também sabe treinar com inteligência!”",
        "train",
      ],
      [
        "Ajudá-lo a marcar o percurso",
        "“Um percurso seguro permite que todos deem o melhor de si!”",
        "help",
      ],
      [
        "Convencê-lo a fazer uma pausa primeiro",
        "“Descansar também fortalece a chama da juventude!”",
        "rest",
      ],
    ],
  },
  kiba: {
    prompt:
      "Kiba e Akamaru encontraram um rastro perto da vila e querem conferir para onde ele vai.",
    choices: [
      [
        "Seguir as marcas com eles",
        "“Boa! Akamaru já sabia que você era de confiança.”",
        "train",
      ],
      [
        "Avisar a patrulha antes de sair",
        "“Certo, assim ninguém confunde um rastro com uma ameaça.”",
        "help",
      ],
      [
        "Deixar Akamaru conduzir a busca",
        "“Ele encontrou um caminho seguro. Bom faro, parceiro!”",
        "listen",
      ],
    ],
  },
  shino: {
    prompt:
      "Shino observou insetos mudando de direção perto do portão e quer comparar as pistas.",
    choices: [
      [
        "Examinar os sinais com cuidado",
        "“Uma observação compartilhada reduz as chances de erro.”",
        "consult",
      ],
      [
        "Treinar leitura de rastros",
        "“Seu foco melhorou. Os detalhes estão mais claros agora.”",
        "train",
      ],
      [
        "Pedir que explique o que percebeu",
        "“Fico satisfeito que tenha perguntado antes de concluir.”",
        "listen",
      ],
    ],
  },
  tenten: {
    prompt:
      "Tenten está testando um novo sistema para organizar ferramentas e pergaminhos.",
    choices: [
      [
        "Ajudar a testar a organização",
        "“Ótimo. Assim ninguém perde tempo procurando o equipamento.”",
        "help",
      ],
      [
        "Treinar a mira com os alvos novos",
        "“Boa postura. Mais uma série e você vai notar a diferença.”",
        "train",
      ],
      [
        "Sugerir que ela mostre o sistema à equipe",
        "“É uma boa forma de evitar que alguém saia sem o item certo.”",
        "consult",
      ],
    ],
  },
  tsunade: {
    prompt:
      "Tsunade interrompe a papelada para ouvir sua opinião sobre a segurança da vila.",
    choices: [
      [
        "Sugerir reforço nas rotas de patrulha",
        "“Uma recomendação útil. Vou levar isso para o próximo relatório.”",
        "consult",
      ],
      [
        "Oferecer ajuda para organizar os relatórios",
        "“Finalmente alguém que entende que a vila também depende de planejamento.”",
        "help",
      ],
      [
        "Perguntar como os moradores podem ajudar",
        "“Uma vila preparada começa com pessoas bem informadas.”",
        "listen",
      ],
    ],
  },
};

const SOCIAL_EFFECTS = {
  help: {
    affinity: 3,
    trust: 2,
    respect: 1,
    stat: "int",
    increase: 1,
    xp: 6,
    rep: 1,
  },
  train: {
    affinity: 2,
    trust: 1,
    respect: 2,
    stat: "specialty",
    increase: 1,
    xp: 8,
  },
  listen: {
    affinity: 3,
    trust: 3,
    stat: "car",
    increase: 1,
    xp: 4,
    rep: 2,
  },
  consult: {
    affinity: 2,
    trust: 1,
    respect: 2,
    stat: "int",
    increase: 1,
    xp: 6,
    rep: 2,
  },
  rest: { affinity: 3, trust: 2, hp: 10, chakra: 8, fatigue: -10, xp: 4 },
};

const EXR = [
  { lv: 2, dn: 0, loc: "academia", nm: "🎓 Exame de graduação" },
  { lv: 6, dn: 3, mm: 10, loc: "torre", nm: "🏅 Exame Chunin" },
  { lv: 12, dn: 8, el: 2, loc: "torre", nm: "🥇 Exame Jounin" },
];

// Exames em fases (índice = rank atual). quiz = perguntas, chk = provas de atributo, fight = lutas em sequência
const EXS = [
  0,
  [
    {
      n: "1ª Fase · Prova escrita",
      t: "quiz",
      need: 4,
      qs: [
        [
          "Um companheiro é capturado durante a missão. O que fazer?",
          [
            "Abandoná-lo e cumprir a missão",
            "Planejar o resgate com o time",
            "Atacar sozinho",
          ],
          1,
        ],
        ["Qual elemento supera a Água?", ["Fogo", "Terra", "Vento"], 1],
        [
          "Antes de infiltrar território inimigo, o mais sábio é…",
          ["Reunir informações", "Entrar à força", "Agir sem plano"],
          0,
        ],
        [
          "Um aliado se fere durante a retirada. Qual é a prioridade?",
          [
            "Proteger o aliado e reorganizar a equipe",
            "Deixá-lo para trás",
            "Separar o grupo",
          ],
          0,
        ],
        [
          "Você recebe uma ordem que coloca civis em risco. O que faz?",
          [
            "Ignora os civis",
            "Procura uma solução que proteja a equipe e os civis",
            "Abandona a missão sem avisar",
          ],
          1,
        ],
      ],
    },
    {
      n: "2ª Fase · Travessia em equipe",
      t: "team",
      need: 2,
      dc: 13,
      tasks: [
        [
          "Uma ponte estreita cede sob o peso do equipamento.",
          [
            ["Atravessar um por vez com uma corda de segurança", "int"],
            ["Correr para chegar primeiro", "vel"],
            ["Mandar o aliado mais forte testar sozinho", "tai"],
          ],
        ],
        [
          "Um colega fica preso do outro lado de uma correnteza.",
          [
            ["Montar uma linha de apoio entre todos", "tai"],
            ["Pular na água sem avisar", "vel"],
            ["Esperar que ele resolva sozinho", "int"],
          ],
        ],
        [
          "A equipe encontra dois caminhos e pouco tempo.",
          [
            ["Dividir funções e manter contato", "car"],
            ["Cada um escolhe uma rota", "vel"],
            ["Seguir sem combinar um sinal", "int"],
          ],
        ],
      ],
    },
    {
      n: "3ª Fase · Sobrevivência na floresta",
      t: "chk",
      c: 4,
      need: 3,
      dc: 14,
    },
    {
      n: "4ª Fase · Proteção do pergaminho",
      t: "team",
      need: 2,
      dc: 15,
      tasks: [
        [
          "Uma equipe rival tenta separar seu grupo.",
          [
            ["Manter o portador protegido no centro", "tai"],
            ["Perseguir o rival mais rápido", "vel"],
            ["Espalhar-se pela floresta", "int"],
          ],
        ],
        [
          "O portador do pergaminho perdeu a confiança no plano.",
          [
            ["Ouvir o grupo e combinar uma nova rota", "car"],
            ["Dar ordens sem explicar", "tai"],
            ["Continuar como se nada tivesse acontecido", "int"],
          ],
        ],
        [
          "Uma armadilha bloqueia a única trilha segura.",
          [
            ["Desarmar enquanto o time vigia", "int"],
            ["Mandar todos atravessarem correndo", "vel"],
            ["Deixar o aliado mais ferido para trás", "tai"],
          ],
        ],
      ],
    },
    {
      n: "5ª Fase · Torneio",
      t: "fight",
      f: [
        ["Candidato de Kusa", 90, 13, "terra"],
        ["Finalista do Torneio", 170, 18, "relampago", 1],
      ],
    },
  ],
  [
    {
      n: "1ª Fase · Estratégia e comando",
      t: "quiz",
      need: 3,
      qs: [
        [
          "Dois objetivos urgentes surgem ao mesmo tempo. O que fazer primeiro?",
          [
            "Avaliar riscos e delegar tarefas",
            "Correr sozinho ao mais próximo",
            "Esperar que outra equipe resolva",
          ],
          0,
        ],
        [
          "Um adversário prepara um ataque concentrado. Qual sinal importa?",
          [
            "A postura e o fluxo de chakra",
            "A cor da roupa",
            "O barulho dos espectadores",
          ],
          0,
        ],
        [
          "Seu esquadrão discorda da rota. Como decide?",
          [
            "Compara riscos e escuta as informações do grupo",
            "Escolhe sem ouvir ninguém",
            "Divide a equipe sem combinar",
          ],
          0,
        ],
        [
          "A missão muda no meio da operação. O que fazer?",
          [
            "Atualizar o plano e comunicar a equipe",
            "Insistir no plano antigo",
            "Agir sem informar os aliados",
          ],
          0,
        ],
      ],
    },
    {
      n: "2ª Fase · Rastreamento de campo",
      t: "chk",
      c: 4,
      need: 3,
      dc: 16,
    },
    {
      n: "3ª Fase · Resgate sob pressão",
      t: "team",
      need: 2,
      dc: 16,
      tasks: [
        [
          "Um batedor está ferido e há rastros de inimigos por perto.",
          [
            [
              "Um aliado presta socorro enquanto os outros cobrem a área",
              "int",
            ],
            ["Todos perseguem os rastros", "vel"],
            ["Deixar o batedor e continuar", "tai"],
          ],
        ],
        [
          "A rota de retirada ficou bloqueada por destroços.",
          [
            ["Coordenar a remoção e vigiar os flancos", "tai"],
            ["Cada integrante tenta uma saída", "vel"],
            ["Aguardar sem estabelecer perímetro", "int"],
          ],
        ],
        [
          "O inimigo usa um sinal falso para atrair a equipe.",
          [
            ["Confirmar o sinal com o esquadrão", "nin"],
            ["Separar-se para investigar", "vel"],
            ["Ignorar qualquer comunicação", "int"],
          ],
        ],
      ],
    },
    {
      n: "4ª Fase · Provação individual",
      t: "chk",
      c: 4,
      need: 3,
      dc: 18,
    },
    {
      n: "5ª Fase · Defesa coordenada",
      t: "team",
      need: 2,
      dc: 18,
      tasks: [
        [
          "Um ataque ameaça civis e o posto de comando.",
          [
            ["Dividir a equipe entre proteção e contenção", "car"],
            ["Todos atacam o mesmo alvo", "tai"],
            ["Recuar sem avisar os civis", "int"],
          ],
        ],
        [
          "Um aliado está prestes a ser cercado.",
          [
            ["Criar uma abertura para a retirada do aliado", "vel"],
            ["Usar a chance para atacar sozinho", "tai"],
            ["Esperar o aliado pedir ajuda", "int"],
          ],
        ],
        [
          "O adversário prepara uma técnica de grande alcance.",
          [
            ["Avisar o esquadrão e dispersar com cobertura", "int"],
            ["Manter a formação fechada", "tai"],
            ["Tentar interromper sem coordenar", "vel"],
          ],
        ],
      ],
    },
    {
      n: "6ª Fase · Provação final",
      t: "fight",
      f: [
        ["Rival da Anbu", 210, 22, "agua"],
        ["Kakashi Hatake, o Examinador", 320, 27, "relampago", 1],
      ],
    },
  ],
];

// Senseis fortes e os elementos que podem ensinar
const SEN = {
  kakashi: ["relampago", "fogo"],
  jiraiya: ["fogo", "terra", "agua"],
  tsunade: ["terra", "vento"],
};

const TL = [1, 3, 6],
  TC = [60, 140, 280];

const EXM = [
  ["Iruka (examinador)", 70, 10, ""],
  ["Examinador Chunin", 110, 15, ""],
  ["Examinador Jounin", 150, 19, ""],
];

const EXTEAM = [
  "sakura",
  "shikamaru",
  "choji",
  "ino",
  "kiba",
  "shino",
  "hinata",
  "neji",
  "lee",
  "tenten",
];

const VOZ = {
  naruto: {
    sonho: [
      "Vou ser Hokage, proteger todo mundo e nunca voltar atrás na minha palavra!",
      "Meu sonho continua o mesmo. Vou mostrar que até alguém como eu pode se tornar Hokage.",
    ],
    equipe: [
      "Um companheiro nunca é descartável. A gente volta para buscar os nossos!",
      "Quando o time acredita um no outro, até uma missão impossível fica ao nosso alcance.",
    ],
  },
  sasuke: {
    treino: [
      "Não adianta repetir movimentos sem entender por que falhou. Observe e corrija.",
      "Treine em silêncio. O resultado fala mais alto que promessas.",
    ],
    combate: [
      "Não baixe a guarda. Um segundo de distração pode decidir uma luta.",
      "Ataque quando enxergar uma abertura, não só porque está com raiva.",
    ],
  },
  sakura: {
    treino: [
      "Treinar até se machucar não é disciplina. Faça uma pausa e cuide do corpo.",
      "Precisão e controle valem mais do que desperdiçar chakra.",
    ],
    sentimento: [
      "Você pode ser forte e ainda precisar de ajuda. Uma coisa não anula a outra.",
      "Respire. Vamos resolver primeiro o que está ao nosso alcance.",
    ],
  },
  shikamaru: {
    missao: [
      "Antes de agir, descubra o que a missão realmente exige. Um plano simples já evita confusão.",
      "Se há civis envolvidos, a prioridade é tirá-los do perigo antes de perseguir o inimigo.",
    ],
    equipe: [
      "Distribua as tarefas conforme os pontos fortes de cada pessoa. É menos problemático assim.",
      "Não precisa vencer tudo sozinho; uma equipe bem coordenada economiza energia.",
    ],
  },
  choji: {
    comida: [
      "Uma refeição compartilhada deixa qualquer equipe mais unida. Vamos ao Ichiraku?",
      "Guarde energia para a missão e depois comemoramos com um prato bem servido.",
    ],
  },
  ino: {
    equipe: [
      "Escutar o time também é uma habilidade ninja. Às vezes alguém percebe o que passou despercebido.",
      "Uma conversa honesta pode impedir uma briga antes que ela comece.",
    ],
  },
  kiba: {
    combate: [
      "Akamaru farejou movimento adiante. Vamos contornar antes que percebam a gente.",
      "Rastrear é mais do que seguir pegadas: procure galhos quebrados e mudanças no vento.",
    ],
  },
  shino: {
    missao: [
      "Os sinais no terreno contam uma história. Não os apague antes de examiná-los.",
      "Informação confiável vale mais do que correr para o primeiro confronto.",
    ],
  },
  tenten: {
    treino: [
      "Cuide dos seus equipamentos e pratique a mira com calma. Não desperdice ferramentas.",
      "Repetição melhora a precisão, desde que você corrija a postura a cada tentativa.",
    ],
  },
  temari: {
    clima: [
      "Vento forte muda a direção de armas e técnicas. Observe antes de avançar.",
      "Com essa tempestade, o melhor caminho talvez não seja o mais curto.",
    ],
  },
  gaara: {
    equipe: [
      "Uma vila não é feita só de muros. São as pessoas que escolhem proteger umas às outras.",
      "Confiar em alguém também exige coragem. Eu precisei aprender isso.",
    ],
  },
  yamato: {
    missao: [
      "Mantenha a formação e deixe uma rota de retirada. Um bom capitão pensa no retorno.",
      "Se a missão mudou, atualize o plano em vez de insistir numa estratégia que já falhou.",
    ],
  },
  sai: {
    equipe: [
      "Ainda estou aprendendo a falar com as pessoas. Mas percebi que perguntar e ouvir ajuda.",
      "Um desenho pode guardar uma lembrança melhor do que um relatório.",
    ],
  },
  tazuna: {
    local: [
      "A ponte liga mais do que duas margens. Ela pode mudar a vida de quem mora por aqui.",
      "O trabalho ainda não terminou, mas agora consigo imaginar a travessia pronta.",
    ],
  },
  haku: {
    equipe: [
      "Mesmo em lados opostos, as pessoas podem carregar sentimentos importantes.",
      "Eu só queria ser útil para alguém que precisava de mim.",
    ],
  },
  gato: {
    missao: [
      "Mercenários fazem o que foram pagos para fazer. Descubra quem está financiando o problema.",
      "Uma rota comercial parada custa caro. Sempre há alguém tentando lucrar com o medo.",
    ],
  },
  dosu: {
    combate: [
      "Escute o ambiente. O som entrega passos que os olhos ainda não encontraram.",
      "Se o chão vibra, não fique parado esperando para descobrir o motivo.",
    ],
  },
  tayuya: {
    combate: [
      "Se não aguenta o som, tampe os ouvidos. Se aguenta, tente acompanhar o ritmo.",
      "Não se distraia com a melodia. O próximo golpe vem no compasso seguinte.",
    ],
  },
  obito: {
    missao: [
      "Toda guerra começa com uma história que alguém decidiu contar. Investigue quem ganha com ela.",
      "As pessoas veem o que esperam ver. Isso torna uma máscara bastante útil.",
    ],
  },
  danzo: {
    missao: [
      "A segurança da vila exige informação. Nem toda operação pode ser anunciada.",
      "Pense nas consequências para Konoha antes de aceitar uma ordem duvidosa.",
    ],
  },
  chiyo: {
    equipe: [
      "O passado não precisa decidir o que a próxima geração será.",
      "Uma técnica pode ser ensinada; a decisão de como usá-la pertence a você.",
    ],
  },
};

const VOZ_EXTRA = {
  naruto: {
    sobre: [
      "Sou Naruto Uzumaki! Vou ser Hokage e ainda vou provar que meus amigos podem contar comigo.",
      "Gosto de ramen, treino e de nunca desistir de alguém da minha equipe.",
    ],
    valores: [
      "Eu protegeria meus amigos. Não volto atrás na minha palavra, esse é meu jeito ninja.",
      "Uma promessa vale quando a gente continua tentando cumprir, mesmo quando fica difícil.",
    ],
  },
  iruka: {
    sobre: [
      "Sou professor da Academia. Quero que cada aluno encontre um caminho próprio para crescer.",
      "Nem todo aprendizado acontece numa sala; cuidar dos outros também ensina.",
    ],
    valores: [
      "Eu protegeria meus alunos e daria a eles a chance de escolher o próprio futuro.",
      "Ninguém deveria ser definido apenas pelos erros que cometeu.",
    ],
  },
  sakura: {
    sobre: [
      "Quero ser alguém em quem minha equipe possa confiar, dentro e fora do combate.",
      "Estudo medicina porque força também significa conseguir cuidar de alguém.",
    ],
    valores: [
      "Eu protegeria meus companheiros e os civis. Não existe vitória que compense abandoná-los.",
      "Cuidar de si também é parte de estar pronto para ajudar os outros.",
    ],
  },
  shikamaru: {
    sobre: [
      "Prefiro um plano simples que funcione a dez ideias complicadas.",
      "Parece problemático falar de mim, mas gosto de poder contar com a equipe.",
    ],
    valores: [
      "Eu protegeria a equipe evitando riscos que não precisam ser assumidos.",
      "O melhor plano é aquele que traz todo mundo de volta para casa.",
    ],
  },
  lee: {
    sobre: [
      "Sou Rock Lee! Quero provar que dedicação e treino podem abrir caminhos novos.",
      "Admiro quem continua tentando e também sabe quando precisa descansar.",
    ],
    valores: [
      "Eu protegeria meus companheiros. Treinar juntos significa apoiar uns aos outros.",
      "A força tem valor quando ajuda alguém, não quando serve só para aparecer.",
    ],
  },
  hinata: {
    sobre: [
      "Ainda fico tímida às vezes, mas estou aprendendo a dizer o que penso.",
      "Quero ficar mais forte para apoiar as pessoas importantes para mim.",
    ],
    valores: [
      "Eu protegeria quem não consegue se defender sozinho.",
      "Coragem também pode ser dar um passo pequeno, mesmo com medo.",
    ],
  },
  gaara: {
    sobre: [
      "Aprendi a liderar ouvindo as pessoas da minha vila, não apenas dando ordens.",
      "Ainda estou descobrindo como confiar, mas não caminho mais sozinho.",
    ],
    valores: [
      "Eu protegeria minha vila e as alianças que ajudam todos a viver em paz.",
      "A força não deve repetir a solidão que um dia causou sofrimento.",
    ],
  },
  kakashi: {
    sobre: [
      "Sou Kakashi. Gosto de ler, mas meus alunos costumam ocupar bastante do meu tempo.",
      "Já cometi erros suficientes para saber que a equipe vem antes do orgulho.",
    ],
    valores: [
      "Eu protegeria meus companheiros. Regras podem esperar quando alguém precisa de ajuda.",
      "Ninguém deve ser deixado para trás só porque a missão ficou difícil.",
    ],
  },
};

Object.assign(N, {
  asuma: [
    "Asuma Sarutobi",
    "🚬",
    "Jounin e sensei",
    [
      "“Shogi ensina mais que muita luta.”",
      "“Proteger a vila é proteger quem vem depois.”",
      "“Fumar? Só depois do treino.”",
    ],
    [120, 16, "vento"],
    ["int", "Asuma analisa seu estilo e você ganha visão tática."],
  ],
  gai: [
    "Might Guy",
    "🦵",
    "Jounin mestre do taijutsu",
    [
      "“A juventude é o nosso maior poder!”",
      "“Treino sem limites constrói shinobis sem limites!”",
      "“Vamos correr cem voltas na vila!”",
    ],
    [130, 17, ""],
    ["tai", "Guy conduz um treino extremo e seus golpes ficam firmes."],
  ],
  genma: [
    "Genma Shiranui",
    "🪥",
    "Jounin examinador",
    [
      "“Mantenha a guarda alta.”",
      "“Bons exames mostram quem está pronto.”",
      "“Calma. Pressa derruba qualquer um.”",
    ],
    [90, 13, ""],
    ["vel", "Genma testa seus reflexos com senbon de treino."],
  ],
  ebisu: [
    "Ebisu",
    "🕶️",
    "Tutor de elite",
    [
      "“Disciplina vem antes do talento.”",
      "“Os jovens precisam de bons exemplos.”",
      "“Anote tudo o que aprender.”",
    ],
    [70, 10, ""],
    ["int", "Ebisu revisa sua teoria de chakra com paciência."],
  ],
  izumo: [
    "Izumo Kamizuki",
    "🚪",
    "Chunin do portão",
    [
      "“Registre sua saída, por favor.”",
      "“Quem entra e sai passa por nós.”",
      "“O turno é longo, mas alguém precisa fazê-lo.”",
    ],
    [60, 8, ""],
    ["vel", "Izumo ensina a observar movimentos suspeitos."],
  ],
  kotetsu: [
    "Kotetsu Hagane",
    "⚙️",
    "Chunin do portão",
    [
      "“Nada entra aqui sem aviso.”",
      "“Quer um conselho? Durma cedo.”",
      "“Izumo está sempre reclamando do café.”",
    ],
    [60, 8, ""],
    ["tai", "Kotetsu mostra como aguentar um turno inteiro de guarda."],
  ],
  ayame: [
    "Ayame",
    "🍜",
    "Atendente do Ichiraku",
    [
      "“Sempre tem uma tigela quente para você.”",
      "“O papai cozinha com carinho.”",
      "“Naruto vem todo dia, sabia?”",
    ],
    [35, 3, ""],
    ["mh", "Ayame serve uma tigela reforçada e sua vitalidade cresce!"],
  ],
  goro: [
    "Goro",
    "🔨",
    "Ferreiro do mercado",
    [
      "“Uma boa lâmina conta uma história.”",
      "“Kunai gasto é kunai caro.”",
      "“Preciso de entregas rápidas.”",
    ],
    [55, 6, ""],
    ["tai", "Goro deixa você bater o martelo e fortalece seus braços."],
  ],
  haruka: [
    "Dra. Haruka",
    "🩺",
    "Médica do hospital",
    [
      "“Descanso também é tratamento.”",
      "“Conte-me onde dói.”",
      "“Poucos shinobis ouvem os médicos.”",
    ],
    [55, 5, ""],
    ["mh", "Haruka orienta sua recuperação e você fica mais resistente."],
  ],
  mei: [
    "Mei",
    "🌸",
    "Florista do mercado",
    [
      "“As flores sabem de todos os segredos.”",
      "“Todo mundo passa por aqui.”",
      "“Quer levar algo para alguém especial?”",
    ],
    [30, 2, ""],
    ["car", "Mei ensina a falar com gentileza e você ganha carisma."],
  ],
});

Object.assign(NA, {
  asuma: 30,
  gai: 30,
  genma: 29,
  ebisu: 30,
  izumo: 22,
  kotetsu: 22,
  ayame: 20,
  goro: 46,
  haruka: 35,
  mei: 27,
});

[
  ["treino", "asuma", "gai", "genma"],
  ["academia", "ebisu"],
  ["portao", "izumo", "kotetsu"],
  ["ichiraku", "ayame"],
  ["mercado", "goro", "mei"],
  ["hospital", "haruka"],
  ["torre", "genma"],
].forEach(([l, ...ids]) => L[l][2].push(...ids));

const REG = {
  academia: "k",
  ichiraku: "k",
  treino: "k",
  torre: "k",
  hospital: "k",
  mercado: "k",
  portao: "k",
  floresta: "k",
  distrito: "k",
  posto: "k",
  fronteira: "k",
  vale: "k",
  areia: "a",
  hospitalareia: "a",
  onda: "o",
  ponte: "o",
  akatsuki: "x",
  som: "s",
  santuario: "s",
  exame: "s",
  monte: "m",
};

const MORTAL = [
  "izumo",
  "kotetsu",
  "ebisu",
  "genma",
  "asuma",
  "haku",
  "gato",
  "dosu",
  "tayuya",
  "chiyo",
  "danzo",
];

const AWAYR = {
  kakashi: 0.12,
  yamato: 0.12,
  asuma: 0.12,
  gai: 0.12,
  genma: 0.1,
  izumo: 0.08,
  kotetsu: 0.08,
  kurenai: 0.1,
  anko: 0.1,
  jiraiya: 0.08,
  sai: 0.1,
  shikamaru: 0.08,
  neji: 0.07,
  kiba: 0.07,
  shino: 0.07,
  tenten: 0.07,
  lee: 0.07,
  naruto: 0.08,
  sasuke: 0.06,
  sakura: 0.05,
  ebisu: 0.05,
};

const ROT = {
  teuchi: [["ichiraku"], ["ichiraku"], []],
  ayame: [["ichiraku"], ["ichiraku"], []],
  iruka: [["academia"], ["academia", "mercado"], ["ichiraku"]],
  tsunade: [["torre"], ["torre", "hospital"], ["torre", "mercado"]],
  shizune: [["torre", "hospital"], ["torre"], ["hospital"]],
  haruka: [["hospital"], ["hospital"], ["hospital"]],
  ebisu: [["academia"], ["academia", "mercado"], []],
  mei: [["mercado"], ["mercado"], []],
  goro: [["mercado"], ["mercado"], []],
};

const NPC_SCHEDULES = {
  iruka: ["academia", "academia", "ichiraku"],
  naruto: ["treino", "treino", "ichiraku"],
  sakura: ["hospital", "treino", "ichiraku"],
  kakashi: ["portao", "treino", "torre"],
  shikamaru: ["torre", "treino", "ichiraku"],
  sasuke: ["treino", "vale", "distrito"],
  hinata: ["hospital", "mercado", "ichiraku"],
  lee: ["treino", "treino", "ichiraku"],
  tsunade: ["torre", "hospital", "torre"],
  kiba: ["floresta", "portao", "ichiraku"],
  shino: ["floresta", "posto", "torre"],
  tenten: ["treino", "mercado", "treino"],
  yamato: ["portao", "treino", "fronteira"],
  oro: ["santuario", "santuario", "santuario"],
  kabuto: ["som", "santuario", "som"],
  dosu: ["som", "som", "santuario"],
  tayuya: ["som", "som", "santuario"],
  itachi: ["akatsuki", "akatsuki", "akatsuki"],
  kisameNpc: ["akatsuki", "akatsuki", "akatsuki"],
  obito: ["akatsuki", "akatsuki", "akatsuki"],
};

const ROUTE_HUB = {
  k: "torre",
  a: "areia",
  o: "onda",
  x: "akatsuki",
  s: "som",
  m: "monte",
};

const ROUTE_LINKS = {
  torre: ["portao"],
  portao: ["torre", "fronteira"],
  fronteira: ["portao", "areia", "onda", "akatsuki", "som", "monte"],
  areia: ["fronteira"],
  onda: ["fronteira"],
  akatsuki: ["fronteira"],
  som: ["fronteira"],
  monte: ["fronteira"],
};

const RELS = [
  ["naruto", "sasuke", "rival"],
  ["naruto", "sakura", "amizade"],
  ["naruto", "hinata", "admiração"],
  ["kakashi", "yamato", "aliança"],
  ["asuma", "kurenai", "amizade"],
  ["asuma", "shikamaru", "mestre"],
  ["gai", "lee", "mestre"],
  ["gai", "kakashi", "rival"],
  ["iruka", "naruto", "mestre"],
  ["tsunade", "shizune", "aliança"],
  ["jiraiya", "tsunade", "amizade"],
  ["izumo", "kotetsu", "amizade"],
  ["teuchi", "ayame", "família"],
  ["goro", "mei", "amizade"],
  ["sasuke", "itachi", "conflito"],
  ["gaara", "temari", "família"],
  ["kiba", "shino", "amizade"],
  ["ebisu", "konohamaru", "mestre"],
  ["haruka", "tsunade", "profissional"],
];

const SENMAX = {
  kakashi: { relampago: 2, fogo: 1 },
  jiraiya: { fogo: 2, terra: 1, agua: 2 },
  tsunade: { terra: 2, vento: 1 },
  yamato: { terra: 2, agua: 1 },
  asuma: { vento: 2, fogo: 1 },
  gaara: { terra: 2 },
  sasuke: { relampago: 2, fogo: 1 },
  naruto: { vento: 2 },
};

Object.keys(SENMAX).forEach((id) => (SEN[id] = Object.keys(SENMAX[id])));

Object.assign(L, {
  onsen: ["♨️", "Fontes Termais", ["jiraiya", "kurenai", "anko"]],
  monumento: ["🪦", "Monumento aos Heróis", ["asuma", "gai", "genma"]],
  arena: ["🏟️", "Arena de Duelos", ["gai", "genma", "kiba"]],
  cachoeira: ["💧", "Cachoeira do Silêncio", []],
  chuva: ["🌧️", "Vila da Chuva", []],
  nuvem: ["⛈️", "Vila da Nuvem", []],
  nevoa: ["🌫️", "Vila da Névoa", []],
  templo: ["🏛️", "Templo do Fogo", []],
});

LOC_GROUPS[0][1].push("onsen", "monumento", "arena", "cachoeira");

LOC_GROUPS[1][1].push("chuva", "nuvem", "nevoa");

LOC_GROUPS[2][1].push("templo");

Object.assign(LOC_REQ, {
  onsen: { rk: 1, done: 2 },
  monumento: { rk: 1, done: 3 },
  arena: { rk: 1, done: 3 },
  cachoeira: { rk: 1, done: 5 },
  nevoa: { rk: 2, done: 10 },
  nuvem: { rk: 2, done: 12 },
  templo: { rk: 2, done: 9 },
  chuva: { rk: 3, done: 20 },
});

Object.assign(REG, {
  onsen: "k",
  monumento: "k",
  arena: "k",
  cachoeira: "k",
  chuva: "r",
  nuvem: "n",
  nevoa: "g",
  templo: "t",
});

Object.assign(ROUTE_HUB, {
  r: "chuva",
  n: "nuvem",
  g: "nevoa",
  t: "templo",
});

["chuva", "nuvem", "nevoa", "templo"].forEach((k) => {
  ROUTE_LINKS[k] = ["fronteira"];
  ROUTE_LINKS.fronteira.push(k);
});

Object.assign(EN, {
  itachi: ["Itachi Uchiha, Sharingan da Akatsuki", 560, 34, "fogo", 1],
  killerb: ["Killer B, Jinchūriki das Oito Caudas", 450, 30, "relampago", 1],
  hanzo: ["Hanzō da Salamandra", 520, 33, "agua", 1],
  kaguya: ["Kaguya Ōtsutsuki, Deusa Coelho", 1000, 48, "", 1],
});

/* ----- Mapa-múndi dinâmico ----- */
const MP = {
  academia: [45, 95],
  ichiraku: [115, 45],
  mercado: [195, 55],
  hospital: [270, 95],
  treino: [40, 215],
  torre: [160, 190],
  floresta: [60, 330],
  distrito: [145, 375],
  onsen: [230, 335],
  cachoeira: [300, 290],
  monumento: [290, 185],
  arena: [225, 255],
  posto: [100, 275],
  portao: [355, 235],
  fronteira: [455, 235],
  vale: [380, 330],
  exame: [400, 130],
  som: [470, 95],
  santuario: [400, 45],
  akatsuki: [560, 55],
  onda: [565, 160],
  ponte: [650, 130],
  areia: [610, 330],
  hospitalareia: [690, 270],
  monte: [500, 375],
  chuva: [690, 45],
  nuvem: [640, 215],
  nevoa: [540, 285],
  templo: [330, 395],
};

/* ----- Progressão de estilos shinobi e transparência dos vínculos ----- */
const STYLE_BOOK = [
  {
    id: "taijutsu",
    name: "Taijutsu de Konoha",
    master: "lee",
    stat: "tai",
    affinity: 15,
    level: 2,
    missions: 1,
    cost: 60,
    description: "Golpes precisos e pressão constante.",
  },
  {
    id: "ninjutsu",
    name: "Ninjutsu Elemental",
    master: "kakashi",
    stat: "nin",
    affinity: 20,
    level: 3,
    missions: 2,
    cost: 100,
    description: "Controle de chakra aplicado ao combate.",
  },
  {
    id: "strategist",
    name: "Estratégia de Equipe",
    master: "shikamaru",
    stat: "int",
    affinity: 15,
    level: 2,
    missions: 1,
    cost: 70,
    description: "Leitura do campo e decisões calculadas.",
  },
  {
    id: "tracker",
    name: "Rastreamento Shinobi",
    master: "kiba",
    stat: "vel",
    affinity: 15,
    level: 2,
    missions: 1,
    cost: 70,
    description: "Movimentação ágil e leitura de rastros.",
  },
];
