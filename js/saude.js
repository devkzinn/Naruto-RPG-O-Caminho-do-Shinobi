/* Saúde do shinobi: lesões que demoram a curar, sequelas permanentes e estresse de missão.
 * Depende de funções do núcleo (log, esc, R, P, S), carregado depois de combate-treinamento.js. */

// Lesões temporárias. "efeitos" são somados aos atributos enquanto a lesão durar.
const LESOES = {
  leve: {
    nome: "Ferimentos leves",
    dias: [1, 2],
    efeitos: {},
  },
  moderada: {
    nome: "Lesão muscular",
    dias: [3, 5],
    efeitos: { vel: -1 },
  },
  grave: {
    nome: "Lesão grave",
    dias: [7, 10],
    efeitos: { tai: -1, vel: -1 },
  },
};

// Sequelas permanentes: podem ficar quando uma lesão grave não é bem recuperada.
const SEQUELAS = {
  braco: { nome: "Cicatriz profunda no braço", efeitos: { tai: -1 } },
  joelho: { nome: "Joelho que nunca voltou ao normal", efeitos: { vel: -1 } },
  rosto: { nome: "Cicatriz visível no rosto", efeitos: { car: -1 } },
  visao: { nome: "Visão comprometida de um olho", efeitos: { nin: -1 } },
};

const MAX_SEQUELAS = 3;
const CHANCE_SEQUELA_GRAVE = 0.35;
const ESTRESSE_MAXIMO = 100;

// Garante os campos de saúde em qualquer save (novo ou migrado).
function garantirSaude() {
  if (!Array.isArray(S.lesoes)) S.lesoes = [];
  if (!Array.isArray(S.sequelas)) S.sequelas = [];
  if (!Number.isFinite(S.estresse)) S.estresse = 0;
  S.estresse = Math.min(ESTRESSE_MAXIMO, Math.max(0, S.estresse));
  S.lesoes = S.lesoes.filter((l) => l && LESOES[l.id]);
  S.sequelas = S.sequelas
    .filter((s) => s && SEQUELAS[s.id])
    .slice(0, MAX_SEQUELAS);
}

// Soma os efeitos aos atributos e guarda o que realmente mudou (o mínimo é 1),
// para que a reversão devolva exatamente o valor retirado.
function aplicarEfeitos(registro, efeitos) {
  registro.aplicado = registro.aplicado || {};
  for (const [atributo, delta] of Object.entries(efeitos)) {
    const antes = S[atributo];
    S[atributo] = Math.max(1, antes + delta);
    registro.aplicado[atributo] =
      (registro.aplicado[atributo] || 0) + (S[atributo] - antes);
  }
}

function desfazerEfeitos(registro) {
  for (const [atributo, delta] of Object.entries(registro.aplicado || {})) {
    S[atributo] = Math.max(1, S[atributo] - delta);
  }
  registro.aplicado = {};
}

function registrarLesao(gravidade, causa) {
  garantirSaude();
  const modelo = LESOES[gravidade];
  if (!modelo) return;
  const dias = R(modelo.dias[0], modelo.dias[1]);
  const lesao = {
    id: gravidade,
    nome: modelo.nome,
    dias,
    efeitos: modelo.efeitos,
    aplicado: {},
  };
  aplicarEfeitos(lesao, modelo.efeitos);
  S.lesoes.push(lesao);
  log(
    `🩹 <b>${esc(modelo.nome)}</b> por ${esc(causa)}. Recuperação estimada em ${dias} dia(s).`,
    "bad",
  );
  if (gravidade === "grave") aumentarEstresse(6, "a lesão");
}

// Chamado quando o personagem é derrotado em combate real (não em treino ou duelo).
function registrarDerrota(foiChefe, foiMissao) {
  garantirSaude();
  aumentarEstresse(foiChefe ? 15 : 8, "a derrota");
  if (foiMissao) aumentarEstresse(4, "a missão fracassada");
  const sorteio = Math.random();
  const gravidade = foiChefe
    ? sorteio < 0.65
      ? "grave"
      : "moderada"
    : sorteio < 0.55
      ? "leve"
      : sorteio < 0.9
        ? "moderada"
        : "grave";
  registrarLesao(gravidade, foiChefe ? "o ataque do chefe" : "o combate");
}

function registrarSequela() {
  garantirSaude();
  if (S.sequelas.length >= MAX_SEQUELAS) return;
  const disponiveis = Object.keys(SEQUELAS).filter(
    (id) => !S.sequelas.some((s) => s.id === id),
  );
  if (!disponiveis.length) return;
  const id = P(disponiveis);
  const modelo = SEQUELAS[id];
  const sequela = { id, nome: modelo.nome, efeitos: modelo.efeitos, aplicado: {} };
  aplicarEfeitos(sequela, modelo.efeitos);
  S.sequelas.push(sequela);
  log(
    `🩺 A recuperação não foi completa: <b>${esc(modelo.nome)}</b>. Esse efeito é permanente.`,
    "bad",
  );
}

function aumentarEstresse(valor, motivo) {
  garantirSaude();
  const antes = S.estresse;
  S.estresse = Math.min(ESTRESSE_MAXIMO, S.estresse + valor);
  if (antes < 70 && S.estresse >= 70)
    log(
      `😟 Com ${esc(motivo)}, o peso das últimas semanas começa a aparecer: seu estresse está alto.`,
      "bad",
    );
}

// Perder um aliado pesa mais do que perder um conhecido próximo.
function registrarLuto(eraAliado, eraProximo) {
  if (eraAliado) aumentarEstresse(30, "a morte de um companheiro de equipe");
  else if (eraProximo) aumentarEstresse(15, "a morte de alguém próximo");
}

// Fator aplicado ao dano causado pelo personagem em combate.
function fatorEstresseCombate() {
  garantirSaude();
  if (S.estresse >= 80) return 0.8;
  if (S.estresse >= 60) return 0.9;
  return 1;
}

// Fator aplicado à recuperação diária de vida.
function fatorRecuperacao() {
  garantirSaude();
  if (S.lesoes.some((l) => l.id === "grave")) return 0.5;
  if (S.lesoes.some((l) => l.id === "moderada")) return 0.75;
  return 1;
}

// Executado uma vez por dia: avança lesões, reduz o estresse e aplica pesadelos.
function saudeDiaria() {
  garantirSaude();
  S.lesoes = S.lesoes.filter((lesao) => {
    lesao.dias--;
    if (lesao.dias > 0) return true;
    desfazerEfeitos(lesao);
    log(`🩹 ${esc(lesao.nome)} cicatrizou.`, "ok");
    if (lesao.id === "grave" && Math.random() < CHANCE_SEQUELA_GRAVE)
      registrarSequela();
    return false;
  });
  S.estresse = Math.max(0, S.estresse - 4);
  if (S.estresse >= 40 && Math.random() < 0.3) {
    S.ck = Math.max(0, S.ck - 10);
    log(
      "😰 Você acordou no meio da noite com pesadelos. Seu chakra amanhece mais fraco.",
      "bad",
    );
  }
}

// Bloco de estado para o painel de status.
function saudeResumo() {
  garantirSaude();
  const itens = [
    ...S.lesoes.map((l) => `${esc(l.nome)} (${l.dias} dia(s))`),
    ...S.sequelas.map((s) => esc(s.nome)),
  ];
  return `<span><b>Saúde</b><br>Estresse ${Math.round(S.estresse)}/100<br>${itens.length ? itens.join("<br>") : "Sem lesões"}</span>`;
}
