/* Núcleo do jogo: utilidades, estado salvo, tempo, criação do personagem e inicialização. */

const $ = (s) => document.querySelector(s),
  R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  P = (a) => a[R(0, a.length - 1)];

const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const emojiWrap = (s) =>
  String(s).replace(
    /([\p{Extended_Pictographic}][\uFE0F\u200D\p{Extended_Pictographic}]*)/gu,
    '<span class="emoji-modern">$1</span>',
  );

const btn = (l, f, c = "") =>
  `<button class="b ${c}" onclick="${f}">${emojiWrap(l)}</button>`;

const bar = (l, v, m, c) =>
  `<div class="br"><span>${emojiWrap(l)} ${Math.round(v)}/${m}</span><i style="width:${Math.max(0, Math.min(100, (v / m) * 100))}%;background:var(--${c})"></i></div>`;

const rkb = (r) => `<span class="rk rk${r}">${r}</span>`;

// S contém todo o progresso persistido; save/load usam JSON no localStorage.
const SV = "naruto-rpg-v2";

let S = null,
  mode = "map",
  B = null,
  M = null,
  T = null,
  X = null,
  mapTab = "places";

const DAYS_PER_YEAR = 120;

const ACADEMY_CLASS_COUNT = 4;

const academyStudent = () => S.rk === 0;

const academyComplete = () => (S.academySessions || 0) >= ACADEMY_CLASS_COUNT;

const fresh = (n, a, el) => ({
  n,
  a,
  el,
  clan: "none",
  clanRenown: 0,
  clanMilestones: {},
  specialization: "balanced",
  gear: [],
  equipped: { weapon: null, armor: null, tool: null },
  specialItems: [],
  style: "Equilibrado",
  combatStyle: "Equilibrado",
  styles: ["Equilibrado"],
  power: "Regular",
  lv: 1,
  xp: 0,
  hp: 60,
  mh: 60,
  ck: 30,
  mc: 30,
  ryo: 100,
  day: 1,
  t: 0,
  ageDays: 0,
  worldYears: 0,
  season: "Primavera",
  weather: "Céu limpo",
  urgent: null,
  lastUrgent: "",
  lastAssignmentDay: 0,
  lastAssignmentId: "",
  assignment: null,
  promotionDuties: [],
  activeContract: null,
  socialEvent: null,
  socialCooldown: {},
  lastSocialDay: 0,
  bonds: {},
  promises: {},
  rep: 0,
  team: [],
  organizations: [],
  organizationHistory: [],
  organizationApplication: null,
  rogue: null,
  infiltration: null,
  teamInvites: {},
  loc: "academia",
  rk: a >= 12 ? 1 : 0,
  academySessions: 0,
  fatigue: 0,
  practice: {},
  chat: {},
  nin: 5,
  tai: 5,
  vel: 5,
  int: 5,
  car: 5,
  rel: {},
  love: {},
  rs: {},
  partner: null,
  done: 0,
  jt: [el + ":0"],
  ms: {},
  kit: 1,
  pill: 1,
  got: {},
  missionHistory: [],
  cd: {},
  duels: {},
  pres: {},
  worldConsequences: null,
  lesoes: [],
  sequelas: [],
  estresse: 0,
});

const ageOf = (id) => (NA[id] || 20) + (S.worldYears || 0);

// Versão do formato do save. Saves antigos (sem "v") são migrados em cont().
const VERSAO_SAVE = 5;
const save = () => {
  if (!S) return;
  try {
    S.v = VERSAO_SAVE;
    localStorage.setItem(SV, JSON.stringify(S));
  } catch (e) {}
};
// O log chama o salvamento a cada linha; agendamos para gravar uma vez por rajada.
let salvamentoAgendado = null;
function agendarSalvamento() {
  if (salvamentoAgendado) return;
  salvamentoAgendado = setTimeout(() => {
    salvamentoAgendado = null;
    save();
  }, 300);
}

const ld = () => {
  try {
    return JSON.parse(
      localStorage.getItem(SV) || localStorage.getItem("naruto-rpg-v1"),
    );
  } catch (e) {
    return null;
  }
};

const slot = () => S.day * 3 + S.t;

const used = (k) => S.cd[k] == slot() || ((S.cd[k] = slot()), false);

const LIMITE_LOG = 300; // mensagens mantidas na tela
function log(h, c = "") {
  const d = document.createElement("p");
  d.className = c;
  d.innerHTML = h;
  const lista = $("#log");
  lista.append(d);
  while (lista.children.length > LIMITE_LOG) lista.firstElementChild.remove();
  lista.scrollTop = 1e9;
  agendarSalvamento();
}

// Avança o relógio em `n` períodos (manhã, tarde, noite). A cada virada de dia atualiza
// recuperação, calendário, clima, eventos e a simulação do mundo, sem pular nenhum dia.
function tick(n = 1) {
  for (let passo = 0; passo < n; passo++) {
    S.t++;
    let novoDia = false;
    if (S.t >= 3) {
      S.t -= 3;
      S.day++;
      novoDia = true;
      S.hp = Math.min(S.mh, S.hp + Math.ceil(S.mh * 0.4 * fatorRecuperacao()));
      S.ck = S.mc;
      S.fatigue = Math.max(0, (S.fatigue || 0) - 30);
      S.ageDays = (S.ageDays || 0) + 1;
      if (S.ageDays >= DAYS_PER_YEAR) {
        S.ageDays -= DAYS_PER_YEAR;
        S.worldYears = (S.worldYears || 0) + 1;
        S.a++;
        log(
          `🎂 Um ano se passou. Você agora tem ${S.a} anos; os moradores de Konoha também cresceram um ano.`,
          "ok",
        );
      }
      log(`🌅 Dia ${S.day} amanhece em Konoha.`, "sys");
    }
    advanceNpcTravel();
    S.pres = {};
    if (novoDia) {
      worldDay();
      ew();
      daySim();
      saudeDiaria();
    }
  }
  S.pres = {};
  save();
}

$("#els").innerHTML = Object.keys(E)
  .map(
    (k, i) =>
      `<label><input type="radio" name="el" value="${k}" ${i ? "" : "checked"}>${E[k][1]} ${E[k][0]}</label>`,
  )
  .join("");

$("#clanChoice").innerHTML = Object.entries(CLANS)
  .map(
    ([id, clan]) => `<option value="${id}">${clan.icon} ${clan.name}</option>`,
  )
  .join("");

$("#specialtyChoice").innerHTML = Object.entries(SPECIALIZATIONS)
  .map(
    ([id, specialty]) =>
      `<option value="${id}">${specialty.icon} ${specialty.name}</option>`,
  )
  .join("");

function updateIdentityPreview() {
  $("#clanPreview").textContent = CLANS[$("#clanChoice").value].description;
  $("#specialtyPreview").textContent =
    SPECIALIZATIONS[$("#specialtyChoice").value].description;
}

updateIdentityPreview();

function updateBuildMode() {
  $("#customBuild").hidden =
    document.querySelector("input[name=build]:checked").value == "random";
}

updateBuildMode();

if (ld()) $("#ct").hidden = false;
window.addEventListener("pagehide", () => save());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});

const show = () => {
  $("#cr").hidden = true;
  $("#gm").hidden = false;
  render();
};

// Corrige saves antigos ou corrompidos sem descartar o progresso do jogador.
function migrarSave() {
  const padrao = fresh(S.n, S.a, S.el);
  [
    "hp",
    "mh",
    "ck",
    "mc",
    "ryo",
    "xp",
    "lv",
    "day",
    "t",
    "nin",
    "tai",
    "vel",
    "int",
    "car",
    "kit",
    "pill",
    "done",
    "fatigue",
    "rep",
  ].forEach((chave) => {
    if (!Number.isFinite(S[chave])) S[chave] = padrao[chave] ?? 0;
  });
  [
    "bonds",
    "promises",
    "rel",
    "love",
    "rs",
    "got",
    "cd",
    "duels",
    "pres",
    "practice",
    "chat",
    "ms",
    "socialCooldown",
  ].forEach((chave) => {
    if (!S[chave] || typeof S[chave] != "object" || Array.isArray(S[chave]))
      S[chave] = {};
  });
  garantirSaude();
  S.promotionDuties = Array.isArray(S.promotionDuties)
    ? S.promotionDuties.filter(
        (duty) =>
          duty &&
          [2, 3].includes(duty.rank) &&
          ["pending", "review", "fulfilled", "concealed"].includes(
            duty.status,
          ),
      )
    : [];
  if (!Array.isArray(S.jt)) S.jt = padrao.jt;
  S.jt = S.jt.filter((k) => typeof k == "string" && E[k.split(":")[0]]);
  if (!S.jt.length) S.jt = padrao.jt;
  S.lv = Math.max(1, Math.floor(S.lv));
  S.t = Math.min(2, Math.max(0, Math.floor(S.t)));
  S.mh = Math.max(1, S.mh);
  S.mc = Math.max(1, S.mc);
  S.hp = Math.min(S.mh, Math.max(1, S.hp));
  S.ck = Math.min(S.mc, Math.max(0, S.ck));
  S.ryo = Math.max(0, S.ryo);
  S.kit = Math.max(0, S.kit);
  S.pill = Math.max(0, S.pill);
  S.fatigue = Math.min(100, Math.max(0, S.fatigue));
  S.rogue =
    S.rogue && typeof S.rogue == "object"
      ? {
          active: S.rogue.active === true,
          sinceDay: Math.max(1, Number(S.rogue.sinceDay) || 1),
          home: "konoha",
          wantedLevel: Math.max(1, Number(S.rogue.wantedLevel) || 1),
          lastHuntDay: Math.max(0, Number(S.rogue.lastHuntDay) || 0),
        }
      : null;
  S.infiltration =
    S.infiltration &&
    typeof S.infiltration == "object" &&
    L[S.infiltration.location] &&
    Number.isFinite(S.infiltration.suspicion)
      ? {
          location: S.infiltration.location,
          day: Math.max(1, Number(S.infiltration.day) || 1),
          suspicion: Math.max(0, Math.min(4, S.infiltration.suspicion)),
        }
      : null;
  if (!L[S.loc]) S.loc = S.rk == 0 ? "academia" : "torre";
  if (S.urgent && !L[S.urgent.loc]) S.urgent = null;
  if (S.rogue?.active && S.urgent && !S.urgent.rogueLocal)
    S.urgent = null;
  if (S.assignment && !L[S.assignment.loc]) S.assignment = null;
  S.v = VERSAO_SAVE;
}
function cont() {
  const v = ld();
  if (!v || typeof v != "object") {
    $("#ct").hidden = true;
    return;
  }
  if (v.v !== VERSAO_SAVE) {
    // Guarda uma cópia do save original antes de migrar.
    try {
      localStorage.setItem(
        SV + "-backup",
        localStorage.getItem(SV) || localStorage.getItem("naruto-rpg-v1"),
      );
    } catch (e) {}
  }
  S = Object.assign(fresh(v.n, v.a, v.el), v);
  migrarSave();
  S.clan = Object.prototype.hasOwnProperty.call(CLANS, S.clan)
    ? S.clan
    : "none";
  S.specialization = Object.prototype.hasOwnProperty.call(
    SPECIALIZATIONS,
    S.specialization,
  )
    ? S.specialization
    : "balanced";
  S.gear = Array.isArray(S.gear)
    ? S.gear.filter((id) => Object.prototype.hasOwnProperty.call(GEAR, id))
    : [];
  S.specialItems = Array.isArray(S.specialItems)
    ? S.specialItems.filter((id) =>
        Object.prototype.hasOwnProperty.call(SPECIAL_ITEMS, id),
      )
    : [];
  S.missionHistory = Array.isArray(S.missionHistory)
    ? S.missionHistory.filter(
        (entry) =>
          entry &&
          typeof entry.id == "string" &&
          typeof entry.title == "string" &&
          typeof entry.day == "number",
      )
    : [];
  S.clanRenown = Math.max(0, Number(S.clanRenown) || 0);
  S.clanMilestones =
    S.clanMilestones && typeof S.clanMilestones == "object"
      ? S.clanMilestones
      : {};
  S.organizations = Array.isArray(S.organizations)
    ? S.organizations.filter((id) =>
        Object.prototype.hasOwnProperty.call(ORGANIZATIONS, id),
      ).slice(0, 1)
    : [];
  S.teamInvites =
    S.teamInvites && typeof S.teamInvites == "object" && !Array.isArray(S.teamInvites)
      ? S.teamInvites
      : {};
  S.organizationHistory = Array.isArray(S.organizationHistory)
    ? S.organizationHistory.filter((entry) => entry && ORGANIZATIONS[entry.id])
    : [];
  S.organizationApplication =
    S.organizationApplication &&
    ORGANIZATIONS[S.organizationApplication.id] &&
    Number.isInteger(S.organizationApplication.step)
      ? S.organizationApplication
      : null;
  S.equipped = Object.assign(
    { weapon: null, armor: null, tool: null },
    S.equipped || {},
  );
  ["weapon", "armor", "tool"].forEach((slot) => {
    const id = S.equipped[slot];
    if (
      !Object.prototype.hasOwnProperty.call(GEAR, id) ||
      GEAR[id].slot != slot ||
      !S.gear.includes(id)
    )
      S.equipped[slot] = null;
  });
  S.pres = {};
  S.team = Array.isArray(S.team)
    ? S.team.filter((id) => N[id] && !S.wd?.dead?.[id]).slice(0, 2)
    : [];
  [0, 1, 2].forEach((i) => S.lv >= [1, 4, 8][i] && learn(S.el + ":" + i));
  mode = S.activeContract
    ? "contract"
    : S.assignment?.status == "active"
      ? "assignment"
      : "map";
  show();
  log(
    S.activeContract
      ? `Você retoma a operação “${esc(S.activeContract.mission[1])}”.`
      : "Você retoma sua jornada em Konoha.",
    "sys",
  );
}

function newg() {
  if (confirm("Começar um novo jogo? O progresso atual será perdido.")) {
    S = null; // impede que o salvamento de saída recrie o progresso apagado
    clearTimeout(salvamentoAgendado);
    try {
      localStorage.removeItem(SV);
      localStorage.removeItem("naruto-rpg-v1");
    } catch (e) {}
    location.reload();
  }
}

function start() {
  const n = $("#nm").value.trim() || "Shinobi",
    a = Math.min(40, Math.max(6, +$("#ag").value || 12)),
    randomMode =
      document.querySelector("input[name=build]:checked").value == "random",
    el = randomMode
      ? P(Object.keys(E))
      : document.querySelector("input[name=el]:checked").value,
    build = randomMode ? P(BUILDS) : null;
  S = fresh(n, a, el);
  if (a >= 16) ST.forEach((k) => addStat(k, 2));
  S.clan = randomMode
    ? P(Object.keys(CLANS).filter((id) => id != "none"))
    : $("#clanChoice").value;
  S.specialization = randomMode
    ? P(Object.keys(SPECIALIZATIONS).filter((id) => id != "balanced"))
    : $("#specialtyChoice").value;
  if (S.clan == "senju") {
    S.mh += 12;
    S.hp = S.mh;
  }
  if (S.clan == "uzumaki") {
    S.mc += 15;
    S.ck = S.mc;
  }
  if (randomMode) {
    const tier = R(1, 3);
    S.style = build.name;
    S.power = ["Iniciante", "Experiente", "Prodígio"][tier - 1];
    S.lv = tier;
    S.mh += 10 * (tier - 1);
    S.mc += 6 * (tier - 1);
    S.hp = S.mh;
    S.ck = S.mc;
    addStat(build.main, R(3, 6));
    addStat(build.support, R(1, 3));
  } else
    addStat(
      {
        fogo: "nin",
        agua: "int",
        vento: "vel",
        terra: "tai",
        relampago: "nin",
      }[el],
      2,
    );
  mode = "map";
  $("#log").innerHTML = "";
  show();
  log(
    `🍃 Bem-vindo(a) a Konoha, <b>${esc(n)}</b>! Aos ${a} anos, você inicia a vida shinobi com o elemento ${E[el][1]} <b>${E[el][0]}</b>.`,
  );
  log(
    `${CLANS[S.clan].icon} Linhagem: <b>${CLANS[S.clan].name}</b>. ${SPECIALIZATIONS[S.specialization].icon} Especialização: <b>${SPECIALIZATIONS[S.specialization].name}</b>.`,
    "sys",
  );
  if (randomMode)
    log(
      `🎲 Seu destino foi sorteado: <b>${S.style}</b>, poder <b>${S.power}</b> e nível ${S.lv}.`,
      "bt",
    );
  log(
    academyStudent()
      ? `Você é <b>Estudante da Academia</b>. Complete ${ACADEMY_CLASS_COUNT} aulas práticas e passe no exame de graduação antes de sair da Academia.`
      : "Você já se formou como <b>Genin</b>. Vá à Torre do Hokage para pegar missões!",
    "sys",
  );
  log(
    "Dica: clique em personagens para interagir, ou escreva livremente o que quer fazer. Missões vão de rank D a S, e os chefes só aparecem nas mais perigosas.",
    "sys",
  );
}
