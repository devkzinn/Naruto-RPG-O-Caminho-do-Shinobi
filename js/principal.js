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
  `<div class="br"><span class="bar-label">${emojiWrap(l)}</span><span class="bar-value">${Math.round(v)}/${m}</span><i style="width:${Math.max(0, Math.min(100, (v / m) * 100))}%;background:var(--${c})"></i></div>`;

const rkb = (r) => `<span class="rk rk${r}">${r}</span>`;

// S contém todo o progresso persistido; save/load usam JSON no localStorage.
const SV = "naruto-rpg-v2";
const SAVE_SLOTS_KEY = "naruto-rpg-save-slots-v1";
const INTRO_KEY = "naruto-rpg-intro-seen";

const readLocalStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const writeLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
};

const buildSaveSummary = (save = {}) => {
  const name = String(save.n || "Jornada sem nome").trim() || "Jornada sem nome";
  const rank = RK[save.rk] || "Academia";
  return {
    name,
    character: `${name} · ${save.a || 0} anos`,
    level: Number(save.lv) || 1,
    rank,
    day: `Dia ${Number(save.day) || 1}`,
    updatedAt: Number(save.lastSavedAt) || Date.now(),
  };
};

const getSaveSlotsState = () => {
  const raw = readLocalStorage(SAVE_SLOTS_KEY);
  if (!raw) return { active: SV, slots: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        active: parsed.active || SV,
        slots: parsed.slots && typeof parsed.slots == "object" ? parsed.slots : {},
      };
    }
  } catch (e) {}
  return { active: SV, slots: {} };
};

const persistSaveSlotsState = (state) =>
  writeLocalStorage(SAVE_SLOTS_KEY, JSON.stringify(state));

const ensureSaveSlots = () => {
  const state = getSaveSlotsState();
  if (!state.active) state.active = SV;
  const legacySave = readLocalStorage(SV);
  if (!state.slots[SV] && legacySave) {
    try {
      const parsed = JSON.parse(legacySave);
      state.slots[SV] = {
        id: SV,
        key: SV,
        name: parsed?.saveName || "Jornada principal",
        summary: buildSaveSummary(parsed),
        updatedAt: Number(parsed.lastSavedAt) || Date.now(),
      };
    } catch (e) {}
  }
  if (!state.slots[SV]) {
    state.slots[SV] = {
      id: SV,
      key: SV,
      name: "Jornada principal",
      summary: { name: "Jornada principal", character: "Sem personagem", level: 1, rank: "Academia", day: "Dia 1" },
      updatedAt: Date.now(),
    };
  }
  if (!state.slots[state.active]) state.active = SV;
  persistSaveSlotsState(state);
  return state;
};

const getActiveSaveKey = () => ensureSaveSlots().active || SV;

const getSaveByKey = (key) => {
  const raw = readLocalStorage(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const backupSaveData = (key, nextPayload) => {
  if (!key || !nextPayload) return;
  const previousPayload = readLocalStorage(key);
  const serializedNext =
    typeof nextPayload == "string" ? nextPayload : JSON.stringify(nextPayload);
  if (!previousPayload || previousPayload == serializedNext) return;
  try {
    if (!validateSavePayload(JSON.parse(previousPayload))) return;
  } catch (e) {
    return;
  }
  writeLocalStorage(`${key}-backup`, previousPayload);
};

const setSaveStateMeta = (slotKey, saveObject = S) => {
  if (!saveObject) return;
  const state = ensureSaveSlots();
  state.active = slotKey;
  const summary = buildSaveSummary(saveObject);
  state.slots[slotKey] = {
    id: slotKey,
    key: slotKey,
    name: saveObject.saveName || state.slots[slotKey]?.name || summary.name,
    summary,
    updatedAt: Date.now(),
  };
  persistSaveSlotsState(state);
};

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
  promotionHistory: [],
  activeContract: null,
  socialEvent: null,
  socialCooldown: {},
  lastSocialDay: 0,
  bonds: {},
  promises: {},
  rep: 0,
  regionalRep: {},
  activeLifePath: null,
  lifePaths: {},
  clanStories: {},
  clanStoryMission: null,
  clanLegacy: null,
  academyLessons: 0,
  journal: [],
  team: [],
  teamRoles: {},
  playerRole: "leader",
  pendingDebriefs: [],
  commandStanding: 0,
  shinobiCode: {
    duty: 0,
    civilians: 0,
    squad: 0,
    results: 0,
  },
  routineLog: [],
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
const VERSAO_SAVE = 7;
const save = () => {
  if (!S) return;
  try {
    const activeKey = getActiveSaveKey();
    S.v = VERSAO_SAVE;
    S.saveName = S.saveName || (ensureSaveSlots().slots?.[activeKey]?.name || "Jornada principal");
    S.lastSavedAt = Date.now();
    const payload = JSON.stringify(S);
    backupSaveData(activeKey, payload);
    writeLocalStorage(activeKey, payload);
    writeLocalStorage(SV, payload);
    setSaveStateMeta(activeKey, S);
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
    const state = ensureSaveSlots();
    const activeKey = state.active || SV;
    const data = getSaveByKey(activeKey) || getSaveByKey(SV) || getSaveByKey("naruto-rpg-v1");
    return data ? JSON.parse(JSON.stringify(data)) : null;
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
    expireNpcMissionReturns();
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

const clanIcons = {
  none: '<path d="M12 21c0-5.5-1.2-9.1-5.2-12.4M12 16c.2-4.8 2.5-8.1 7-10-0.1 5.3-2.6 8.3-7 9.2M10.5 11.5C7 12 5 10.3 4 7c3.6.1 5.7 1.4 6.5 4.5" />',
  uchiha: '<path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="1" />',
  hyuga: '<path d="M12 3.2 19 7v10l-7 3.8L5 17V7l7-3.8Z" /><path d="M8.5 12h7M12 8.5v7" />',
  senju: '<path d="M12 21V9M12 15c-4.6 0-7-2.2-7.2-6.4 4.1.1 6.5 1.8 7.2 5M12 12c0-4.8 2.4-7.6 7.2-8-.1 4.7-2.5 7.4-7.2 8ZM8.5 21h7" />',
  uzumaki: '<path d="M12 12c0-2.1 3.2-2.4 3.5 0 .4 3.8-5.1 5.3-7.7 2.5C4.1 10.5 8 4.5 13 4.5c4.4 0 7.5 3.2 7.5 7.5" />',
};

$("#clanOptions").innerHTML = Object.entries(CLANS)
  .map(
    ([id, clan], index) => `
      <button
        class="clan-option"
        type="button"
        data-clan="${id}"
        role="option"
        aria-pressed="${index === 0}"
        aria-selected="${index === 0}"
        tabindex="-1"
      >
        <span class="clan-icon clan-icon-${id}" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${clanIcons[id]}</svg>
        </span>
        <span>${esc(clan.name)}</span>
      </button>`,
  )
  .join("");

function setClanPickerOpen(open, focusSelected = false) {
  const trigger = $("#clanPickerTrigger");
  const options = $("#clanOptions");
  trigger.setAttribute("aria-expanded", String(open));
  options.hidden = !open;
  if (open && focusSelected) {
    options.querySelector('[aria-selected="true"]')?.focus();
  }
}

$("#clanPickerTrigger").addEventListener("click", () => {
  setClanPickerOpen($("#clanOptions").hidden, true);
});

function setSpecialtyPickerOpen(open, focusSelected = false) {
  const trigger = $("#specialtyPickerTrigger");
  const options = $("#specialtyOptions");
  trigger.setAttribute("aria-expanded", String(open));
  options.hidden = !open;
  if (open && focusSelected) {
    options.querySelector('[aria-selected="true"]')?.focus();
  }
}

$("#specialtyPickerTrigger").addEventListener("click", () => {
  setSpecialtyPickerOpen($("#specialtyOptions").hidden, true);
});

$("#specialtyChoice").innerHTML = Object.entries(SPECIALIZATIONS)
  .map(
    ([id, specialty]) =>
      `<option value="${id}">${specialty.icon} ${specialty.name}</option>`,
  )
  .join("");

const specialtyIcons = {
  balanced:
    '<path d="M12 3v18M5 7h14M7 7l-3 6h6L7 7Zm10 0-3 6h6l-3-6ZM8 21h8" />',
  ninjutsu:
    '<path d="M13.5 2.8 5.8 13h5.4l-.8 8.2L18.2 11h-5.4l.7-8.2Z" />',
  taijutsu:
    '<path d="M4 12h2l.8-5.4c.2-1.4 2.2-1.2 2.3.2l.3 2.7V5.7a1.4 1.4 0 0 1 2.8 0v3.8V6a1.4 1.4 0 0 1 2.8 0v4.1V7.2a1.4 1.4 0 0 1 2.8 0v6.1c0 3.5-2.2 6-5.7 6H9.4c-1.5 0-2.7-.7-3.5-2L4 14.3A1.5 1.5 0 0 1 4 12Z" /><path d="M9.4 10v2M12.2 9.5v2.5M15 10v2" />',
  tracking:
    '<path d="M7.2 11.2c-1.8 0-3-1.5-2.7-3.2.2-1.5 1.3-2.2 2.4-1.6 1 .5 1.1 1.7.3 2.4M16.8 11.2c1.8 0 3-1.5 2.7-3.2-.2-1.5-1.3-2.2-2.4-1.6-1 .5-1.1 1.7-.3 2.4M9.5 6.6c-1.3-1.5-.3-3.6 1.2-3.4 1.3.2 1.8 1.6 1.3 2.7M14.5 6.6c1.3-1.5.3-3.6-1.2-3.4-1.3.2-1.8 1.6-1.3 2.7M12 11c-2.7 0-5.2 2.5-5.2 5.2 0 2.2 1.5 4 3.4 4 .9 0 1.3-.8 1.8-.8s.9.8 1.8.8c1.9 0 3.4-1.8 3.4-4C17.2 13.5 14.7 11 12 11Z" />',
  strategy:
    '<path d="M5 4h14v16H5zM8 8h8M8 12h3M8 16h2M14 12l1.5 1.5L18 11" />',
  medical:
    '<path d="M8 3h8v4h3v13H5V7h3V3Z" /><path d="M12 10v7M8.5 13.5h7" />',
};

$("#specialtyOptions").innerHTML = Object.entries(SPECIALIZATIONS)
  .map(
    ([id, specialty], index) => `
      <button
        class="clan-option"
        type="button"
        data-specialty="${id}"
        role="option"
        aria-selected="${index === 0}"
        tabindex="-1"
      >
        <span class="clan-icon specialty-icon-${id}" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${specialtyIcons[id]}</svg>
        </span>
        <span>${esc(specialty.name)}</span>
      </button>`,
  )
  .join("");

$("#clanOptions").addEventListener("click", (event) => {
  const option = event.target.closest("[data-clan]");
  if (!option) return;

  $("#clanChoice").value = option.dataset.clan;
  updateIdentityPreview();
  setClanPickerOpen(false);
  $("#clanPickerTrigger").focus();
});

$("#specialtyOptions").addEventListener("click", (event) => {
  const option = event.target.closest("[data-specialty]");
  if (!option) return;

  $("#specialtyChoice").value = option.dataset.specialty;
  updateIdentityPreview();
  setSpecialtyPickerOpen(false);
  $("#specialtyPickerTrigger").focus();
});

$("#clanPicker").addEventListener("keydown", (event) => {
  const options = [...$("#clanOptions").querySelectorAll("[data-clan]")];
  const currentIndex = options.indexOf(document.activeElement);

  if (event.key === "Escape") {
    setClanPickerOpen(false);
    $("#clanPickerTrigger").focus();
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if ($("#clanOptions").hidden) setClanPickerOpen(true);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
  }

  if (
    (event.key === "Enter" || event.key === " ") &&
    document.activeElement.matches("[data-clan]")
  ) {
    event.preventDefault();
    document.activeElement.click();
  }
});

$("#specialtyPicker").addEventListener("keydown", (event) => {
  const options = [...$("#specialtyOptions").querySelectorAll("[data-specialty]")];
  const currentIndex = options.indexOf(document.activeElement);

  if (event.key === "Escape") {
    setSpecialtyPickerOpen(false);
    $("#specialtyPickerTrigger").focus();
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if ($("#specialtyOptions").hidden) setSpecialtyPickerOpen(true);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
  }

  if (
    (event.key === "Enter" || event.key === " ") &&
    document.activeElement.matches("[data-specialty]")
  ) {
    event.preventDefault();
    document.activeElement.click();
  }
});

document.addEventListener("click", (event) => {
  if (!$("#clanPicker").contains(event.target)) setClanPickerOpen(false);
  if (!$("#specialtyPicker").contains(event.target))
    setSpecialtyPickerOpen(false);
});

function updateIdentityPreview() {
  const selectedClan = $("#clanChoice").value;
  $("#clanPreview").textContent = CLANS[selectedClan].description;
  $("#clanOptions")
    .querySelectorAll("[data-clan]")
    .forEach((option) => {
      const selected = option.dataset.clan === selectedClan;
      option.setAttribute(
        "aria-pressed",
        String(selected),
      );
      option.setAttribute("aria-selected", String(selected));
    });
  const clan = CLANS[selectedClan];
  $("#clanPickerTrigger").setAttribute(
    "aria-label",
    `Clã ou linhagem: ${clan.name}`,
  );
  $("#clanPickerTrigger").innerHTML = `
    <span class="clan-picker-selection">
      <span class="clan-icon clan-icon-${selectedClan}" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${clanIcons[selectedClan]}</svg>
      </span>
      <span>${esc(clan.name)}</span>
    </span>
    <span class="clan-picker-chevron" aria-hidden="true"></span>`;
  const selectedSpecialty = $("#specialtyChoice").value;
  const specialty = SPECIALIZATIONS[selectedSpecialty];
  $("#specialtyPreview").textContent = specialty.description;
  $("#specialtyOptions")
    .querySelectorAll("[data-specialty]")
    .forEach((option) =>
      option.setAttribute(
        "aria-selected",
        String(option.dataset.specialty === selectedSpecialty),
      ),
    );
  $("#specialtyPickerTrigger").setAttribute(
    "aria-label",
    `Especialização: ${specialty.name}`,
  );
  $("#specialtyPickerTrigger").innerHTML = `
    <span class="clan-picker-selection">
      <span class="clan-icon specialty-icon-${selectedSpecialty}" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${specialtyIcons[selectedSpecialty]}</svg>
      </span>
      <span>${esc(specialty.name)}</span>
    </span>
    <span class="clan-picker-chevron" aria-hidden="true"></span>`;
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
    "lifePaths",
    "clanStories",
    "regionalRep",
  ].forEach((chave) => {
    if (!S[chave] || typeof S[chave] != "object" || Array.isArray(S[chave]))
      S[chave] = {};
  });
  S.teamRoles =
    S.teamRoles && typeof S.teamRoles == "object" && !Array.isArray(S.teamRoles)
      ? S.teamRoles
      : {};
  S.playerRole = ["leader", "tracker", "scout", "medic", "support"].includes(
    S.playerRole,
  )
    ? S.playerRole
    : "leader";
  S.pendingDebriefs = Array.isArray(S.pendingDebriefs)
    ? S.pendingDebriefs
        .filter((entry) => entry && typeof entry.title == "string")
        .map((entry) => ({
          id: String(entry.id || `debrief:${entry.day || S.day}:${entry.title}`),
          title: entry.title,
          rank: typeof entry.rank == "string" ? entry.rank : "D",
          day: Math.max(1, Number(entry.day) || S.day),
          failures: Math.max(0, Number(entry.failures) || 0),
          success: entry.success === true,
          team: Array.isArray(entry.team)
            ? entry.team.filter((id) => typeof id == "string" && N[id])
            : [],
          witnesses: Array.isArray(entry.witnesses)
            ? entry.witnesses.filter((id) => typeof id == "string" && N[id])
            : [],
        }))
        .slice(-10)
    : [];
  S.commandStanding = Math.max(
    -20,
    Math.min(20, Number(S.commandStanding) || 0),
  );
  const codeDefaults = { duty: 0, civilians: 0, squad: 0, results: 0 };
  S.shinobiCode =
    S.shinobiCode && typeof S.shinobiCode == "object" && !Array.isArray(S.shinobiCode)
      ? S.shinobiCode
      : {};
  Object.keys(codeDefaults).forEach((key) => {
    S.shinobiCode[key] = Math.max(
      -20,
      Math.min(20, Number(S.shinobiCode[key]) || 0),
    );
  });
  S.promotionHistory = Array.isArray(S.promotionHistory)
    ? S.promotionHistory.filter(
        (entry) => entry && Number.isFinite(entry.rank) && typeof entry.title == "string",
      ).slice(-10)
    : [];
  S.routineLog = Array.isArray(S.routineLog)
    ? S.routineLog.filter((entry) => entry && typeof entry.title == "string").slice(-30)
    : [];
  ensureRegionalReputation();
  S.activeLifePath =
    typeof S.activeLifePath == "string" &&
    Object.prototype.hasOwnProperty.call(LIFE_PATHS, S.activeLifePath)
      ? S.activeLifePath
      : null;
  S.journal = Array.isArray(S.journal)
    ? S.journal
        .filter((entry) => entry && typeof entry.title == "string")
        .map((entry) => ({
          day: Math.max(1, Number(entry.day) || 1),
          type: typeof entry.type == "string" ? entry.type : "jornada",
          title: entry.title,
          detail: typeof entry.detail == "string" ? entry.detail : "",
          characters: Array.isArray(entry.characters)
            ? entry.characters.filter((id) => typeof id == "string")
            : [],
          result: typeof entry.result == "string" ? entry.result : "",
        }))
        .slice(-120)
    : [];
  S.academyLessons = Math.max(0, Number(S.academyLessons) || 0);
  S.clanStoryMission =
    S.clanStoryMission &&
    typeof S.clanStoryMission.clan == "string" &&
    CLAN_STORIES[S.clanStoryMission.clan] &&
    Number.isInteger(S.clanStoryMission.stage) &&
    S.clanStoryMission.stage >= 0 &&
    S.clanStoryMission.stage < CLAN_STORIES[S.clanStoryMission.clan].stages.length
      ? {
          clan: S.clanStoryMission.clan,
          stage: S.clanStoryMission.stage,
          startedDay: Math.max(1, Number(S.clanStoryMission.startedDay) || S.day),
        }
      : null;
  S.clanLegacy =
    S.clanLegacy &&
    typeof S.clanLegacy.clan == "string" &&
    typeof S.clanLegacy.choice == "string"
      ? {
          clan: S.clanLegacy.clan,
          choice: S.clanLegacy.choice,
          day: Math.max(1, Number(S.clanLegacy.day) || S.day),
        }
      : null;
  Object.keys(LIFE_PATHS).forEach((id) => lifePathState(id));
  if (S.clan && S.clan != "none" && CLAN_STORIES[S.clan]) {
    const max = CLAN_STORIES[S.clan].stages.length;
    S.clanStories[S.clan] = Math.max(
      0,
      Math.min(max, Number(S.clanStories[S.clan]) || 0),
    );
  }
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
          missionsDone: Math.max(0, Number(S.rogue.missionsDone) || 0),
          pathOrganizationInterest: S.rogue.pathOrganizationInterest === true,
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
function validateSavePayload(data) {
  if (!data || typeof data != "object" || Array.isArray(data)) return false;
  if (typeof data.n != "string" || !data.n.trim()) return false;
  if (!Number.isFinite(Number(data.a)) || !Number.isFinite(Number(data.day))) return false;
  if (!data.el || !E[data.el]) return false;
  if (!Number.isFinite(Number(data.lv))) return false;
  return true;
}

function loadSaveSlot(slotKey) {
  const data = getSaveByKey(slotKey);
  if (!data) return false;
  if (!validateSavePayload(data)) {
    log("⚠️ Esse save não é compatível com esta versão do jogo. Ele foi ignorado sem apagar o progresso atual.", "sys");
    return false;
  }
  const state = ensureSaveSlots();
  state.active = slotKey;
  persistSaveSlotsState(state);
  const valid = Object.assign(fresh(data.n, data.a, data.el), data);
  valid.saveName = valid.saveName || state.slots[slotKey]?.name || "Jornada principal";
  valid.saveSlotKey = slotKey;
  valid.lastSavedAt = Number(valid.lastSavedAt) || Date.now();
  S = valid;
  if (valid.v !== VERSAO_SAVE) {
    try {
      const backupSource = JSON.stringify(valid);
      writeLocalStorage(`${slotKey}-backup`, backupSource);
    } catch (e) {}
  }
  migrarSave();
  return true;
}

function createSaveSlot(name = "Nova jornada") {
  const slotName = String(name || "Nova jornada").trim() || "Nova jornada";
  const state = ensureSaveSlots();
  const slotKey = `naruto-rpg-save-${Date.now()}`;
  state.slots[slotKey] = {
    id: slotKey,
    key: slotKey,
    name: slotName,
    summary: { name: slotName, character: "Vazio", level: 1, rank: "Academia", day: "Dia 1" },
    updatedAt: Date.now(),
  };
  state.active = slotKey;
  persistSaveSlotsState(state);
  if (S) {
    S.saveName = slotName;
    S.saveSlotKey = slotKey;
    save();
  }
  return slotKey;
}

function renameSaveSlot(slotKey, nextName) {
  const state = ensureSaveSlots();
  const name = String(nextName || "").trim() || state.slots[slotKey]?.name || "Jornada";
  if (!state.slots[slotKey]) return;
  state.slots[slotKey].name = name;
  if (S && S.saveSlotKey == slotKey) S.saveName = name;
  persistSaveSlotsState(state);
  render();
}

function exportSaveSlot(slotKey) {
  const data = getSaveByKey(slotKey) || (S && S.saveSlotKey == slotKey ? S : null);
  if (!data) {
    log("⚠️ Não há save válido para exportar neste espaço.", "sys");
    return;
  }
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(data.n || "naruto-rpg").toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  log(`📦 Save exportado: ${data.n || "jornada"}.json`, "ok");
}

function handleImportSaveFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!validateSavePayload(parsed)) {
        log("⚠️ Arquivo JSON inválido ou incompatível. Nenhum save foi sobrescrito.", "sys");
        return;
      }
      const activeKey = getActiveSaveKey();
      if (readLocalStorage(activeKey)) backupSaveData(activeKey, parsed);
      else if (S) writeLocalStorage(`${activeKey}-backup`, JSON.stringify(S));
      parsed.saveName = parsed.saveName || `Importado · ${String(parsed.n || "Jornada").trim()}`;
      parsed.saveSlotKey = activeKey;
      parsed.lastSavedAt = Date.now();
      const migrated = Object.assign(fresh(parsed.n, parsed.a, parsed.el), parsed);
      const previousSave = S;
      S = migrated;
      S.saveSlotKey = activeKey;
      try {
        migrarSave();
      } catch (error) {
        S = previousSave;
        throw error;
      }
      save();
      log(`✅ Save importado com sucesso em ${parsed.n}. O progresso atual foi preservado em backup local.`, "ok");
      render();
    } catch (e) {
      log("⚠️ Arquivo JSON inválido. O conteúdo não foi aceito e não alterou o progresso atual.", "sys");
    }
  };
  reader.onerror = () => {
    log("⚠️ Não foi possível ler este arquivo de save.", "sys");
  };
  reader.readAsText(file);
}

function cont() {
  const v = ld();
  if (!v || typeof v != "object") {
    $("#ct").hidden = true;
    return;
  }
  if (v.v !== VERSAO_SAVE) {
    try {
      const key = getActiveSaveKey();
      writeLocalStorage(`${key}-backup`, JSON.stringify(v));
    } catch (e) {}
  }
  S = Object.assign(fresh(v.n, v.a, v.el), v);
  S.saveName = S.saveName || ensureSaveSlots().slots?.[S.saveSlotKey || getActiveSaveKey()]?.name || "Jornada principal";
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
    const activeKey = getActiveSaveKey();
    S = null; // impede que o salvamento de saída recrie o progresso apagado
    clearTimeout(salvamentoAgendado);
    try {
      localStorage.removeItem(activeKey);
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
  if (localStorage.getItem(INTRO_KEY) !== "1") {
    localStorage.setItem(INTRO_KEY, "1");
    mode = "guide";
  }
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
