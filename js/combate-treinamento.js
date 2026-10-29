/* Combate e treinamento: batalhas, jutsus, atributos, treino, senseis, exames e equipamentos. */

// atributos de combate / todos (car = carisma)
const attrCap = (stat) => {
  if (!AT.includes(stat)) return Infinity;
  const base = 12 + S.lv * 2 + S.rk * 4;
  return stat == "car"
    ? Math.min(base - 2, 26 + S.lv + S.rk * 2)
    : Math.min(base, 32 + S.lv * 2 + S.rk * 3);
};

function addStat(stat, amount) {
  if (!stat || !AT.includes(stat)) return 0;
  const cap = attrCap(stat),
    current = S[stat] || 0;
  if (current >= cap) return 0;
  const gain = Math.min(amount, cap - current);
  S[stat] = current + gain;
  return gain;
}

function bossPattern(name) {
  const value = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/konan/.test(value)) return "paper";
  if (/zetsu/.test(value)) return "roots";
  if (/kurogane|samurai renegado/.test(value)) return "kenjutsu";
  if (/orochimaru|sannin serpente/.test(value)) return "orochimaru";
  if (/itachi|sharingan da akatsuki/.test(value)) return "genjutsu";
  if (/madara/.test(value)) return "madara";
  if (/gaara/.test(value)) return "gaara";
  if (/zabuza|haku|kisame/.test(value)) return "water";
  if (/pain/.test(value)) return "gravity";
  if (/kimimaro|sasuke/.test(value)) return "assault";
  if (/itachi|obito/.test(value)) return "genjutsu";
  return "heavy";
}

const mu = (a, b) =>
  !a || !b ? 1 : E[a][2] == b ? 1.5 : E[b][2] == a ? 0.7 : 1;

// Jutsu: jt = técnicas conhecidas ('elemento:nível'), ms = usos de cada uma (8 usos = 1 nível de maestria, máx. 5)
const mlv = (k) => Math.min(5, Math.floor((S.ms[k] || 0) / 8)),
  tmast = () => Object.values(S.ms).reduce((a, b) => a + b, 0);

const els = () => [...new Set(S.jt.map((k) => k.split(":")[0]))],
  jc = (k) => {
    const cost = Math.ceil(
      [8, 15, 25][+k.split(":")[1]] *
        (1 - 0.07 * mlv(k)) *
        (JUTSU_EFFECTS[k]?.cost || 1),
    );
    return Math.max(1, S?.clan == "uzumaki" ? Math.floor(cost * 0.9) : cost);
  };

const exok = (x) =>
  S.lv >= x.lv &&
  S.done >= x.dn &&
  (!academyStudent() || academyComplete()) &&
  (!x.el || els().length >= x.el) &&
  (!x.mm || tmast() >= x.mm);

const exreq = (x) =>
  `Nv ${x.lv}${academyStudent() ? ` · ${ACADEMY_CLASS_COUNT} aulas práticas` : ""}${x.dn ? ` · ${x.dn} missões` : ""}${x.mm ? ` · ${x.mm} usos de jutsu` : ""}${x.el ? ` · ${x.el} elementos` : ""}`;

function gain(x) {
  S.xp += x;
  while (S.xp >= S.lv * 40) {
    S.xp -= S.lv * 40;
    S.lv++;
    S.mh += 10;
    S.mc += 6;
    S.hp = S.mh;
    S.ck = S.mc;
    addStat(P(AT), 1);
    addStat(P(AT), 1);
    log(`⬆️ <b>Nível ${S.lv}!</b> Seus atributos aumentaram.`, "ok");
    if (S.lv == 4 || S.lv == 8) learn(S.el + ":" + (S.lv == 4 ? 1 : 2), 1);
  }
}

function learn(k, v) {
  if (S.jt.includes(k)) return;
  S.jt.push(k);
  if (v) {
    const [e, i] = k.split(":");
    log(`✨ Novo jutsu: <b>${E[e][3][i]}</b>!`, "ok");
  }
}

function academyClass() {
  if (!academyStudent() || S.loc != "academia") return;
  if (academyComplete())
    return log(
      "🎓 Você já concluiu as quatro aulas práticas. Faça o exame de graduação.",
      "sys",
    );
  S.academySessions = (S.academySessions || 0) + 1;
  S.ck = Math.min(S.mc, S.ck + 8);
  gain(12);
  rel("iruka", 2);
  log(
    `📚 Aula ${S.academySessions}/${ACADEMY_CLASS_COUNT} concluída: você pratica controle de chakra, técnicas básicas e trabalho em equipe. +12 XP.`,
    "ok",
  );
  if (academyComplete())
    log(
      "🎓 Iruka libera você para o exame de graduação. Prepare-se e vença o examinador!",
      "bt",
    );
  tick(1);
  render();
}

function self(k) {
  if (k == "s") {
    log("🛏️ Você dorme e recupera as forças.", "sys");
    tick(3 - S.t);
    S.fatigue = 0;
    S.hp = S.mh;
    S.ck = S.mc;
    return render();
  }
  if (k == "m") {
    S.ck = Math.min(S.mc, S.ck + 15);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 25);
    log("🧘 Você medita, recupera chakra e reduz a fadiga.");
    tick(1);
    return render();
  }
  const sessions = {
      tai: ["tai", 25, "treino físico"],
      vel: ["vel", 20, "exercícios de agilidade"],
      nin: ["nin", 25, "controle de chakra"],
      int: ["int", 20, "estudo tático"],
    },
    [a, c, label] = sessions[k] || sessions.tai;
  if (!a) return;
  if ((S.fatigue || 0) >= 70)
    return log(
      "Você está exausto. Medite ou descanse antes de treinar novamente.",
      "sys",
    );
  if (k == "nin" && S.ck < 5)
    return log(
      "Você precisa de pelo menos 5 de chakra para praticar controle.",
      "sys",
    );
  if (k == "nin") S.ck -= 5;
  S.fatigue = Math.min(100, (S.fatigue || 0) + c);
  S.practice = S.practice || {};
  S.practice[a] = (S.practice[a] || 0) + 1;
  if (S.practice[a] >= 3) {
    const ganho = addStat(a, 1);
    if (ganho > 0) {
      log(
        `📈 O treino consistente melhora ${a.toUpperCase()} em 1 ponto.`,
        "ok",
      );
    }
    S.practice[a] -= 3;
  }
  gain(6);
  log(
    `🥋 Sessão de ${label} concluída. A fadiga aumenta; alterne atividades e reserve tempo para recuperar.`,
  );
  tick(1);
  render();
}

function item(t) {
  let bonus = 0;
  if (t == "kit") {
    if (S.kit < 1) return log("Você não tem kits médicos.", "sys");
    if (S.hp >= S.mh) return log("Sua vida já está cheia.", "sys");
    bonus = healingBonus();
    S.kit--;
    const heal = 40 + bonus;
    S.hp = Math.min(S.mh, S.hp + heal);
  } else if (t == "pill") {
    if (S.pill < 1) return log("Você não tem pílulas de chakra.", "sys");
    if (S.ck >= S.mc) return log("Seu chakra já está cheio.", "sys");
    S.pill--;
    S.ck = Math.min(S.mc, S.ck + 40);
  } else return log("Esse item não pode ser usado.", "sys");
  log(
    t == "kit"
      ? `🩹 Você usa um kit médico e recupera até ${40 + bonus} HP.`
      : "💊 Você toma uma pílula.",
  );
  render();
}

const marketPrice = (base) => {
  const reputationDiscount = Math.min(0.2, (S.rep || 0) / 500),
    regionalAdjustment = regionalMarketAdjustment(),
    crisisSurcharge = marketDisruptionDays() ? 0.15 : 0;
  return Math.max(
    1,
    Math.round(
      base *
        (1 - reputationDiscount) *
        (1 + regionalAdjustment) *
        (1 + crisisSurcharge),
    ),
  );
};

function buy(t, c) {
  const price = marketPrice(c);
  if (S.ryo < price) return log("Ryō insuficiente.", "sys");
  S.ryo -= price;
  if (t == "scr") {
    const a = P(AT);
    const ganho = addStat(a, 1);
    if (ganho > 0) log(`📜 Você estuda o pergaminho: +1 ${a.toUpperCase()}.`);
    else
      log(
        `📜 Você revisa um pergaminho, mas ${a.toUpperCase()} já chegou ao limite do treino atual.`,
        "sys",
      );
  } else {
    S[t]++;
    log("🛒 Compra feita.");
  }
  if (price < c)
    log(`🤝 Sua reputação reduziu o preço em ${c - price} ryō.`, "ok");
  render();
}

function buyGear(id) {
  if (!Object.prototype.hasOwnProperty.call(GEAR, id))
    return log("Esse equipamento não está disponível.", "sys");
  const item = GEAR[id];
  if ((S.gear || []).includes(id))
    return log("Você já possui este equipamento.", "sys");
  const price = marketPrice(item.cost);
  if (S.ryo < price) return log("Ryō insuficiente.", "sys");
  S.ryo -= price;
  S.gear = [...(S.gear || []), id];
  S.equipped = S.equipped || { weapon: null, armor: null, tool: null };
  S.equipped[item.slot] = id;
  log(`🛒 ${item.name} comprado e equipado. ${item.description}`, "ok");
  render();
}

function equipGear(id) {
  if (
    !(S.gear || []).includes(id) ||
    !Object.prototype.hasOwnProperty.call(GEAR, id)
  )
    return log("Você não possui esse equipamento.", "sys");
  S.equipped = S.equipped || { weapon: null, armor: null, tool: null };
  const gear = GEAR[id];
  S.equipped[gear.slot] = S.equipped[gear.slot] == id ? null : id;
  log(
    S.equipped[gear.slot]
      ? `🛡️ ${gear.name} equipado.`
      : `Você guardou ${gear.name}.`,
    "sys",
  );
  render();
}

function examSquad() {
  const squad = [...new Set((S.team || []).filter((id) => N[id]))];
  while (squad.length < 2) {
    const candidates = EXTEAM.filter((id) => !squad.includes(id));
    if (!candidates.length) break;
    squad.push(P(candidates));
  }
  return squad.slice(0, 2);
}

function examTeamBonus(stat) {
  const matched =
    (X.squad || []).filter((id) => N[id][5][0] == stat).length * 2;
  return Math.min(4, matched + Math.floor((X.trust || 0) / 40));
}

function exam() {
  const x = EXR[S.rk];
  if (academyStudent() && S.loc != "academia")
    return log("📚 O exame de graduação acontece na Academia Ninja.", "sys");
  if (!exok(x)) return log(`🔒 Requisitos: ${exreq(x)}.`, "sys");
  if (S.cd.ex == S.day)
    return log("📋 Os examinadores pedem que você volte amanhã.", "sys");
  if (S.rk == 0) {
    log("📝 O exame começa! Derrote o examinador.", "bt");
    return fight(EXM[0], {
      sp: 1,
      win: () => {
        S.rk++;
        recordPromotionCeremony(S.rk, ["iruka"], 100);
        initializePromotionDuty(S.rk);
        S.ryo += 100;
        log(`🎉 Você foi promovido a <b>${RK[S.rk]}</b>!`, "ok");
      },
    });
  }
  X = { rk: S.rk, s: 0, i: 0, ok: 0, trust: 50, squad: examSquad() };
  log(
    `🏟️ <b>${["", "Exame Chunin", "Exame Jounin"][S.rk]}</b>: ${EXS[S.rk].length} fases avaliam suas habilidades e o trabalho em equipe.`,
    "bt",
  );
  log(
    `🤝 Seu esquadrão de exame: ${X.squad.map((id) => N[id][0]).join(" e ")}.`,
    "sys",
  );
  exNext();
}

function exNext() {
  const g = EXS[X.rk][X.s];
  if (!g) {
    const y = X.rk * 150,
      participants = (X.squad || []).slice(),
      examTrust = X.trust || 0;
    S.rk++;
    recordPromotionCeremony(S.rk, participants, examTrust);
    initializePromotionDuty(S.rk);
    S.ryo += y;
    ST.forEach((k) => addStat(k, 2));
    S.mh += 20;
    S.mc += 10;
    S.hp = S.mh;
    S.ck = S.mc;
    log(
      `🎉 Você passou! Promovido a <b>${RK[S.rk]}</b>! +${y} ryo e atributos aumentados.`,
      "ok",
    );
    log(
      S.rk == 2
        ? "🔓 Agora você pode dominar um 2º elemento com um sensei forte (Kakashi, Jiraiya, Tsunade)."
        : "🔓 Agora você pode dominar um 3º elemento.",
      "bt",
    );
    X = null;
    mode = "map";
    tick(1);
    return render();
  }
  X.i = 0;
  X.ok = 0;
  log(`📋 <b>${g.n}</b>`, "bt");
  if (g.t == "fight") return exFight(0);
  X.cur = g.t == "team" ? g.tasks[0] : P(STP);
  mode = "ex";
  render();
}

function exFight(i) {
  const g = EXS[X.rk][X.s];
  fight(g.f[i], {
    sp: 1,
    win: () => {
      if (i + 1 < g.f.length) exFight(i + 1);
      else {
        X.s++;
        exNext();
      }
    },
  });
}

function exa(j) {
  const g = EXS[X.rk][X.s],
    quiz = g.t == "quiz";
  let success;
  if (quiz) {
    success = j == g.qs[X.i][2];
    log(
      success ? "✅ Resposta correta." : "❌ Resposta errada.",
      success ? "ok" : "bad",
    );
  } else {
    const c = X.cur[1][j],
      d = R(1, 20),
      bonus = g.t == "team" ? examTeamBonus(c[1]) : 0,
      total = d + S[c[1]] + bonus;
    success = total >= g.dc;
    log(
      `🎲 ${c[0]}: ${d} + ${S[c[1]]}${bonus ? ` + equipe ${bonus}` : ""} = ${total} (precisa de ${g.dc})`,
      "sys",
    );
    if (success) log("Você supera o obstáculo.", "ok");
    else {
      S.hp = Math.max(1, S.hp - 12);
      log("Falhou e perdeu 12 HP.", "bad");
    }
    if (g.t == "team") {
      if (success) {
        X.trust = Math.min(100, X.trust + 10);
        X.squad.forEach((id) => rel(id, 1));
        log(`🤝 A confiança do esquadrão aumenta para ${X.trust}%.`, "ok");
      } else {
        X.trust = Math.max(0, X.trust - 12);
        log(`⚠️ A confiança do esquadrão cai para ${X.trust}%.`, "bad");
      }
    }
  }
  X.ok += success ? 1 : 0;
  X.i++;
  tick(1);
  const totalTasks = quiz ? g.qs.length : g.t == "team" ? g.tasks.length : g.c;
  if (X.i < totalTasks) {
    X.cur = g.t == "team" ? g.tasks[X.i] : P(STP);
    return render();
  }
  if (X.ok >= g.need) {
    log(`✔️ Fase concluída (${X.ok}/${totalTasks})!`, "ok");
    X.s++;
    exNext();
  } else {
    log(
      `❌ Você foi reprovado nesta fase (${X.ok}/${totalTasks}). Tente novamente amanhã.`,
      "bad",
    );
    X = null;
    S.cd.ex = S.day;
    mode = "map";
    render();
  }
}

// Pratica um jutsu conhecido: gasta chakra, aumenta a maestria e pode ampliar o chakra máximo.
function prac(k) {
  if ((S.fatigue || 0) >= 70)
    return log(
      "Você está exausto. Medite ou descanse antes de praticar jutsu.",
      "sys",
    );
  const c = jc(k);
  if (S.ck < c) return log("Chakra insuficiente para praticar.", "sys");
  S.ck -= c;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 15);
  const b = mlv(k);
  S.ms[k] = (S.ms[k] || 0) + 4;
  gain(6);
  log(
    `🎯 Você pratica ${jn(k)}.${mlv(k) > b ? ` ⭐ <b>Maestria ${mlv(k)}!</b>` : ""}`,
    "ok",
  );
  tick(1);
  chakraGrow(0.8);
  render();
}

function enemyTactic(name, boss) {
  if (boss) return "boss";
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/bandido|ladrao|capanga|espadachim|guarda/.test(normalized))
    return "guard";
  if (/ninja|renegado|shinobi|mercenario|cacador/.test(normalized))
    return "chakra";
  if (/lobo|cobra|aranha|armad|trapper/.test(normalized))
    return "trap";
  return "chakra";
}

function fight(e, o) {
  const storyEnemyId = M?.story?.enemy || "",
    previousEscape =
      storyEnemyId && typeof worldConsequences == "function"
        ? worldConsequences().escapedBosses[storyEnemyId]
        : null;
  B = {
    n: e[0],
    hp: e[1],
    mx: e[1],
    atk: e[2],
    el: e[3],
    boss: e[4],
    pattern: bossPattern(e[0]),
    storyEnemyId,
    elementUsage: {},
    adaptedElement: previousEscape?.adaptedElement || "",
    adaptationMessage: previousEscape?.adaptedElement
      ? `${e[0]} estudou seu último confronto e se prepara contra ${E[previousEscape.adaptedElement]?.[0] || previousEscape.adaptedElement}.`
      : "",
    o: o || {},
    df: 0,
    tn: 0,
    ch: 0,
    ph: 0,
    team: (X?.squad || S.team || []).slice(),
    teamUsed: false,
    tactic: enemyTactic(e[0], !!e[4]),
    tacticGuard: 0,
    tacticTrap: 0,
    tacticCharge: 0,
    burnTurns: 0,
    burnDamage: 0,
    poisonTurns: 0,
    poisonDamage: 0,
    stunTurns: 0,
    slowTurns: 0,
    wallTurns: 0,
    open: 0,
    exposed: false,
    weaknessKnown: false,
    playerPinned: false,
  };
  B.weaknessKnown = !B.boss;
  mode = "battle";
  log(
    B.boss
      ? `👹 <b>CHEFE: ${B.n}</b> surge diante de você!`
      : `⚔️ <b>${B.n}</b> ${B.el ? E[B.el][1] : ""} entra em combate!`,
    "bt",
  );
  if (previousEscape?.count)
    log(
      `⚠️ Este chefe escapou ${previousEscape.count} vez(es) e voltou preparado.`,
      "bad",
    );
  render();
}

function winBattle() {
  const o = B.o,
    boss = B.boss;
  log(`🏆 <b>${B.n}</b> foi derrotado!`, "ok");
  B = null;
  mode = "map";
  gain(o.sp ? 12 : 18);
  o.win && o.win();
  if (boss) {
    S.kit++;
    S.pill++;
    log("🎁 O chefe deixa suprimentos: +1 kit médico e +1 pílula.", "ok");
  }
  render();
}

function loseBattle() {
  const duelId = B?.o?.duelId,
    chefe = !!B?.boss,
    sp = B?.o?.sp,
    failedMission = M?.m,
    lossCallback = B?.o?.loss,
    escapedStoryBoss =
      B?.boss && M?.story?.enemy
        ? {
            id: M.story.enemy,
            name: B.n,
            elementUsage: { ...(B.elementUsage || {}) },
          }
        : null;
  B = null;
  mode = "map";
  if (duelId) {
    const duel = S.duels?.[duelId] || { day: S.day, wins: 0, losses: 0 };
    const repeat = (duel.wins || 0) + (duel.losses || 0);
    const xp = Math.max(1, 4 - repeat);
    S.duels[duelId] = {
      ...duel,
      day: S.day,
      losses: (duel.losses || 0) + 1,
    };
    gain(xp);
    remember(
      duelId,
      "duelo",
      "Você perdeu o duelo amistoso, mas aprendeu algo.",
      {
        affinity: Math.max(0, 2 - repeat),
        respect: Math.max(0, 1 - repeat),
      },
    );
    log(`📉 ${N[duelId][0]} venceu o duelo. +${xp} XP de experiência.`, "sys");
  }
  if (sp) {
    S.hp = 1;
    gain(6);
    if (X) {
      X = null;
      S.cd.ex = S.day;
      log("❌ Você foi eliminado do exame. Tente de novo amanhã.", "bad");
    }
    if (!duelId) log("😮‍💨 Você perdeu o confronto, mas aprendeu algo.");
  } else {
    if (escapedStoryBoss && typeof recordStoryBossEscape == "function")
      recordStoryBossEscape(
        escapedStoryBoss.id,
        escapedStoryBoss.name,
        escapedStoryBoss.elementUsage,
      );
    if (M?.story) recordFailedStoryAttempt(M.story, M);
    if (failedMission)
      recordWorldEvent(
        "failure",
        failedMission[1],
        "A missão terminou em retirada após o jogador ser derrotado.",
        [
          ...new Set([
            ...(M?.team || S.team || []),
            ...pres(S.loc),
          ].filter((id) => N[id])),
        ],
      );
    if (failedMission) {
      const reportBonuses = missionBonuses(failedMission, M);
      queueMissionDebrief(
        failedMission,
        failedMission[0],
        reportBonuses,
        false,
      );
      updateShinobiCode(reportBonuses);
    }
    S.activeContract = null;
    S.hp = Math.ceil(S.mh / 2);
    S.ryo = Math.floor(S.ryo * 0.8);
    registrarDerrota(chefe, !!M);
    S.loc = "hospital";
    M = null;
    S.pres = {};
    log("😵 Você desmaiou e acorda no hospital. Perdeu parte dos ryo.", "bad");
    tick(3);
  }
  lossCallback?.();
  render();
}

const TEAM_COMBAT_SYNERGIES = [
  {
    id: "naruto-sasuke",
    members: ["naruto", "sasuke"],
    chakra: 10,
    bond: 0,
  },
  {
    id: "naruto-sakura",
    members: ["naruto", "sakura"],
    chakra: 8,
    bond: 2,
    name: "Naruto + Sakura",
    description: "ataque e cura coordenados",
  },
  {
    id: "shikamaru-ino",
    members: ["shikamaru", "ino"],
    chakra: 6,
    bond: 2,
    name: "Shikamaru + Ino",
    description: "imobiliza e expõe o alvo",
  },
  {
    id: "hinata-kiba",
    members: ["hinata", "kiba"],
    chakra: 5,
    bond: 2,
    name: "Hinata + Kiba",
    description: "dano e redução de velocidade",
  },
  {
    id: "lee-neji",
    members: ["lee", "neji"],
    chakra: 5,
    bond: 2,
    name: "Lee + Neji",
    description: "ataque que abre a guarda",
  },
  {
    id: "kakashi-sasuke",
    members: ["kakashi", "sasuke"],
    chakra: 10,
    bond: 2,
    name: "Kakashi + Sasuke",
    description: "ataque que interrompe uma carga",
  },
];

function act(t, i) {
  let d = 0,
    m = "",
    preparesOpening = false;
  const readyOpening = !!(B.open || B.exposed),
    wasPinned = B.playerPinned;
  if (t == "tai") {
    const critChance = Math.min(30, 10 + S.vel * 0.5);
    const c = Math.random() * 100 < critChance;
    d = Math.round((((5 + S.tai * 1.6) * R(8, 12)) / 10) * (c ? 1.8 : 1));
    m = `👊 ${c ? "<b>Golpe crítico!</b> " : "Você acerta: "}<b>${d}</b> de dano.`;
  } else if (t == "jut") {
    const [e, ti] = i.split(":"),
      effect = JUTSU_EFFECTS[i],
      c = jc(i);
    if (S.ck < c) return log("Chakra insuficiente!", "sys");
    S.ck -= c;
    const x = mu(e, B.el),
      b = mlv(i),
      base = (4 + S.nin * 1.7) * [1.5, 2.1, 2.9][+ti] * (1 + 0.12 * b) * x,
      variance = R(9, 11) / 10;
    d =
      effect?.type == "multi"
        ? Math.round(base * 0.43 * variance) * 3
        : Math.round(base * (effect?.type == "surge" ? 1.25 : 1) * variance);
    let effectText = "";
    if (effect?.type == "burn" && Math.random() < 0.4) {
      B.burnTurns = 2;
      B.burnDamage = Math.max(2, Math.round(d * 0.12));
      effectText = " Queimadura por 2 turnos!";
    }
    if (effect?.type == "multi" && B.ch && Math.random() < 0.55) {
      B.ch = 0;
      B.intent = "";
      effectText = " Os projéteis interrompem a concentração do chefe!";
    }
    if (effect?.type == "wall") {
      B.wallTurns = 2;
      effectText = " A Parede de Terra protegerá você contra 2 ataques.";
    }
    if (effect?.type == "expose") {
      B.exposed = true;
      preparesOpening = true;
      effectText = " A pressão da água expõe a guarda!";
    }
    if (effect?.type == "snare") {
      B.slowTurns = Math.max(B.slowTurns, 2);
      B.exposed = true;
      preparesOpening = true;
      effectText = " A lama prende o alvo e enfraquece seus ataques!";
    }
    if (effect?.type == "interrupt") {
      if (B.ch) {
        B.ch = 0;
        B.intent = "";
        effectText = " A descarga interrompe a carga!";
      }
      B.exposed = true;
      preparesOpening = true;
    }
    if (effect?.type == "stun") {
      if (Math.random() < 0.35) {
        B.stunTurns = 1;
        B.ch = 0;
        effectText = " O inimigo foi paralisado e perdeu a próxima ação!";
      } else {
        B.slowTurns = 2;
        effectText = " O choque reduziu o ataque do inimigo por 2 turnos.";
      }
    }
    if (effect?.type == "cut" && (B.ch || B.open)) {
      d = Math.round(d * (B.ch ? 1.5 : 1.3));
      if (B.ch) {
        B.ch = 0;
        B.intent = "";
        effectText = " A lâmina interrompe a técnica carregada!";
      } else effectText = " O alvo estava exposto: dano aumentado!";
    }
    S.ms[i] = (S.ms[i] || 0) + 1;
    m = `${E[e][1]} <b>${E[e][3][ti]}</b>! <b>${d}</b> de dano${x > 1 ? " (vantagem elemental!)" : x < 1 ? " (resistido)" : ""}.${mlv(i) > b ? ` ⭐ <b>Maestria ${mlv(i)}!</b>` : ""}${effectText}`;
  } else if (t == "support") {
    if (!B.team?.includes(i) || !N[i])
      return log("Esse aliado não está participando do combate.", "sys");
    if (B.teamUsed)
      return log("A equipe já usou sua ação cooperativa nesta luta.", "sys");
    const role = S.teamRoles?.[i] || "support";
    if (role == "medic") {
      const healed = Math.min(
        S.mh - S.hp,
        16 + Math.floor(S.int * 0.8) + Math.floor(N[i][4][0] * 0.04),
      );
      S.hp += healed;
      const cured = B.poisonTurns > 0;
      B.poisonTurns = 0;
      m = `🩺 <b>${N[i][0]}</b> estabiliza você (+${healed} HP)${cured ? " e neutraliza o veneno" : ""}.`;
    } else if (role == "tracker") {
      if (B.boss) {
        const profile = BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy,
          interrupted = !!B.ch;
        B.weaknessKnown = true;
        if (interrupted) {
          B.ch = 0;
          B.intent = "";
          preparesOpening = true;
        }
        m = `🔎 <b>${N[i][0]}</b> lê o padrão do chefe. Fraqueza: ${profile.weaknessName}${interrupted ? "; preparação interrompida" : ""}.`;
      } else {
        B.tacticTrap = 0;
        B.tacticCharge = 0;
        B.slowTurns = Math.max(B.slowTurns, 1);
        m = `🔎 <b>${N[i][0]}</b> identifica a próxima tática e atrasa o inimigo.`;
      }
    } else if (role == "scout") {
      if (B.ch) {
        B.ch = 0;
        B.intent = "";
        preparesOpening = B.boss;
        m = `💨 <b>${N[i][0]}</b> distrai o inimigo e interrompe o golpe anunciado.`;
      } else {
        B.slowTurns = Math.max(B.slowTurns, 2);
        preparesOpening = B.boss;
        m = `💨 <b>${N[i][0]}</b> flanqueia o inimigo, reduzindo seu ritmo por 2 turnos.`;
      }
    } else if (role == "leader") {
      B.exposed = B.boss;
      B.slowTurns = Math.max(B.slowTurns, 1);
      preparesOpening = B.boss;
      m = `🎯 <b>${N[i][0]}</b> coordena um ataque e abre uma janela para sua equipe.`;
    } else {
      B.wallTurns = Math.max(B.wallTurns, 1);
      S.ck = Math.min(S.mc, S.ck + 5);
      m = `🛡️ <b>${N[i][0]}</b> cobre sua posição com uma barreira e recupera 5 chakra.`;
    }
    B.teamUsed = true;
    rel(i, 1);
  } else if (t == "team") {
    if (!B.team?.length)
      return log("Você ainda não tem aliados na equipe.", "sys");
    if (B.teamUsed)
      return log("A equipe já usou sua ação cooperativa nesta luta.", "sys");
    B.teamUsed = true;
    d = Math.round(
      B.team.reduce((total, id) => {
        const specialty = N[id][5][0],
          stat = AT.includes(specialty) ? S[specialty] : S.tai;
        return total + 7 + stat * 0.45 + N[id][4][1] * 0.2;
      }, 0),
    );
    const allyNames = B.team.map((id) => N[id][0]).join(" e ");
    m = `🤝 <b>${allyNames}</b> combina suas habilidades com as suas! Dano conjunto: <b>${d}</b>.`;
    B.team.forEach((id) => rel(id, 1));
  } else if (t == "combo") {
    if (B.teamUsed)
      return log("A equipe já usou sua ação especial nesta luta.", "sys");
    const synergy = TEAM_COMBAT_SYNERGIES.find((entry) => entry.id == i),
      chakraCost = synergy?.chakra ?? (i == "shikamaru" ? 6 : 0);
    if (S.ck < chakraCost)
      return log(
        `Chakra insuficiente para esta combinação. Necessário: ${chakraCost}.`,
        "sys",
      );
    if (i == "naruto-sasuke") {
      if (!B.team.includes("naruto") || !B.team.includes("sasuke"))
        return log("A combinação exige Naruto e Sasuke na equipe.", "sys");
      const bond = teamPairBondOf("naruto", "sasuke");
      d = Math.round(22 + (S.nin + S.tai) * 0.9 + Math.min(6, bond.trust * 2));
      preparesOpening = true;
      m = `🌀⚡ <b>Naruto e Sasuke</b> sincronizam clones e relâmpago! Ataque combinado: <b>${d}</b>${bond.trust ? ` (sinergia +${Math.min(6, bond.trust * 2)} pelo vínculo)` : ""} e a guarda fica exposta.`;
      rel("naruto", 2);
      rel("sasuke", 2);
    } else if (i == "naruto-sakura") {
      if (!B.team.includes("naruto") || !B.team.includes("sakura"))
        return log("A técnica exige Naruto e Sakura na equipe.", "sys");
      const bond = teamPairBondOf("naruto", "sakura");
      if (bond.trust < synergy.bond)
        return log(
          "Naruto e Sakura precisam concluir duas missões juntos para coordenar esta técnica.",
          "sys",
        );
      const healed = Math.min(S.mh - S.hp, 12 + S.int);
      S.hp += healed;
      d = Math.round(14 + S.nin * 0.7 + bond.trust);
      preparesOpening = true;
      m = `🌪️🌸 <b>Naruto e Sakura</b> combinam pressão de clones e precisão médica: <b>${d}</b> de dano, +${healed} HP e guarda exposta.`;
      rel("naruto", 1);
      rel("sakura", 1);
    } else if (i == "shikamaru-ino") {
      if (!B.team.includes("shikamaru") || !B.team.includes("ino"))
        return log("A estratégia exige Shikamaru e Ino na equipe.", "sys");
      const bond = teamPairBondOf("shikamaru", "ino");
      if (bond.trust < synergy.bond)
        return log(
          "Shikamaru e Ino precisam concluir duas missões juntos para coordenar esta técnica.",
          "sys",
        );
      B.stunTurns = Math.max(B.stunTurns, 1);
      B.exposed = true;
      preparesOpening = true;
      m = `♟️🧠 <b>Shikamaru e Ino</b> combinam estratégia e leitura mental: o alvo fica imobilizado e exposto.`;
      rel("shikamaru", 1);
      rel("ino", 1);
    } else if (i == "hinata-kiba") {
      if (!B.team.includes("hinata") || !B.team.includes("kiba"))
        return log("A técnica exige Hinata e Kiba na equipe.", "sys");
      const bond = teamPairBondOf("hinata", "kiba");
      if (bond.trust < synergy.bond)
        return log(
          "Hinata e Kiba precisam concluir duas missões juntos para coordenar esta técnica.",
          "sys",
        );
      d = Math.round(16 + (S.tai + S.vel) * 0.5 + bond.trust);
      B.slowTurns = Math.max(B.slowTurns, 2);
      B.exposed = true;
      preparesOpening = true;
      m = `👁️🐺 <b>Hinata e Kiba</b> localizam e pressionam o ponto cego: <b>${d}</b> de dano, alvo lento e guarda exposta.`;
      rel("hinata", 1);
      rel("kiba", 1);
    } else if (i == "lee-neji") {
      if (!B.team.includes("lee") || !B.team.includes("neji"))
        return log("A técnica exige Lee e Neji na equipe.", "sys");
      const bond = teamPairBondOf("lee", "neji");
      if (bond.trust < synergy.bond)
        return log(
          "Lee e Neji precisam concluir duas missões juntos para coordenar esta técnica.",
          "sys",
        );
      d = Math.round(18 + (S.tai + S.vel) * 0.55 + bond.trust);
      B.exposed = true;
      preparesOpening = true;
      m = `💚👁️ <b>Lee e Neji</b> sincronizam velocidade e precisão: <b>${d}</b> de dano e a guarda fica exposta.`;
      rel("lee", 1);
      rel("neji", 1);
    } else if (i == "kakashi-sasuke") {
      if (!B.team.includes("kakashi") || !B.team.includes("sasuke"))
        return log("A técnica exige Kakashi e Sasuke na equipe.", "sys");
      const bond = teamPairBondOf("kakashi", "sasuke");
      if (bond.trust < synergy.bond)
        return log(
          "Kakashi e Sasuke precisam concluir duas missões juntos para coordenar esta técnica.",
          "sys",
        );
      d = Math.round(24 + (S.nin + S.tai) * 0.6 + bond.trust);
      const interrupted = !!B.ch;
      if (interrupted) {
        B.ch = 0;
        B.intent = "";
      }
      B.exposed = true;
      preparesOpening = true;
      m = `📖⚡ <b>Kakashi e Sasuke</b> sincronizam o ataque para quebrar a defesa: <b>${d}</b> de dano${interrupted ? " e carga interrompida" : ""}; a guarda fica exposta.`;
      rel("kakashi", 1);
      rel("sasuke", 1);
    } else if (i == "sakura") {
      if (!B.team.includes("sakura"))
        return log(
          "Sakura precisa estar na equipe para prestar apoio médico.",
          "sys",
        );
      const healed = Math.min(S.mh - S.hp, 18 + S.int);
      S.hp += healed;
      preparesOpening = true;
      m = `🌸 <b>Sakura</b> estabiliza seus ferimentos (+${healed} HP) e indica um ponto fraco.`;
      rel("sakura", 1);
    } else if (i == "shikamaru") {
      if (!B.team.includes("shikamaru"))
        return log(
          "Shikamaru precisa estar na equipe para preparar uma armadilha.",
          "sys",
        );
      B.stunTurns = Math.max(B.stunTurns, 1);
      preparesOpening = true;
      m = `♟️ <b>Shikamaru</b> prende o inimigo nas sombras e abre uma janela para atacar.`;
      rel("shikamaru", 1);
    } else {
      return log(
        "Essa combinação não está disponível com a equipe atual.",
        "sys",
      );
    }
    S.ck -= chakraCost;
    if (chakraCost) m += ` (-${chakraCost} chakra).`;
    B.teamUsed = true;
  } else if (t == "analyze") {
    const profile = BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy;
    if (!B.boss) {
      return log(
        "Observe a postura do inimigo durante um confronto com chefe.",
        "sys",
      );
    }
    B.weaknessKnown = true;
    m = `🔎 Você lê o padrão de <b>${B.n}</b>. Fraqueza: <b>${profile.weaknessName}</b>. ${profile.tactic}`;
  } else if (t == "def") {
    B.df = 1;
    S.ck = Math.min(S.mc, S.ck + 6);
    m = B.tacticGuard
      ? "🛡️ Você se defende e aguarda a postura protetora passar. Também recupera o fôlego."
      : "🛡️ Você se defende e recupera o fôlego.";
    B.tacticGuard = 0;
  } else if (t == "kit") {
    if (S.kit < 1) return log("Você não tem kits médicos.", "sys");
    S.kit--;
    const healed = Math.min(S.mh - S.hp, 40 + healingBonus());
    S.hp += healed;
    m = `🩹 Kit médico usado (+${healed} HP).`;
  } else if (t == "pill") {
    if (S.pill < 1) return log("Você não tem pílulas de chakra.", "sys");
    S.pill--;
    S.ck = Math.min(S.mc, S.ck + 40);
    m = "💊 Pílula usada (+40 chakra).";
  } else if (t == "run") {
    if (B.boss) return log("🚫 Não há como fugir de um chefe!", "bad");
    if (Math.random() < 0.4 + S.vel * 0.02) {
      log("💨 Você escapou!");
      B = null;
      M = null;
      X && ((X = null), (S.cd.ex = S.day));
      mode = "map";
      return render();
    }
    m = "Você não conseguiu fugir!";
  }
  if (B.boss && t == "jut") {
    const element = i.split(":")[0];
    B.elementUsage[element] = (B.elementUsage[element] || 0) + 1;
  }
  B.exposed = false;
  B.playerPinned = false;
  if (t == "tai" || t == "jut") {
    d = Math.round(d * combatDamageMultiplier(t));
  }
  if (!B.boss && B.tacticGuard && d > 0) {
    d = Math.round(d * 0.65);
    m = m.replace(/<b>\d+<\/b> de dano/, `<b>${d}</b> de dano`);
    m += " A guarda inimiga protegeu os aliados e reduziu o impacto.";
    B.tacticGuard = 0;
  }
  if (wasPinned && d > 0) {
    d = Math.round(d * 0.7);
    m += " Você ainda está desequilibrado.";
  }
  if (B.boss && d > 0) {
    const profile = BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy,
      element = t == "jut" ? i.split(":")[0] : "",
      hitsWeakness = element && element == profile.weakness,
      adapted = element && element == B.adaptedElement;
    if (adapted) {
      d = Math.round(d * 0.78);
      B.weaknessKnown = true;
      m += ` ${B.n} antecipou esse elemento e reduziu o dano.`;
    }
    if (readyOpening) d = Math.round(d * 1.25);
    if (hitsWeakness && !adapted) {
      d = Math.round(d * 1.5);
      B.weaknessKnown = true;
      preparesOpening = true;
      if (B.ch) {
        B.ch = 0;
        B.intent = "";
        m += " A fraqueza elemental interrompe a carga!";
      }
      m += ` Fraqueza ${profile.weaknessName}: dano aumentado!`;
    } else if (!readyOpening) {
      d = Math.round(d * profile.guard);
      if (!B.weaknessKnown)
        m += ` A guarda resiste; observe o padrão para descobrir uma fraqueza.`;
    } else m += " A abertura permite atravessar a guarda.";
    m = m.replace(/<b>\d+<\/b> de dano/, `<b>${d}</b> de dano`);
  } else if (t == "tai" || t == "jut") {
    m = m.replace(/<b>\d+<\/b> de dano/, `<b>${d}</b> de dano`);
  }
  if (B.boss && preparesOpening) B.exposed = true;
  log(m);
  B.hp -= d;
  B.open = 0;
  if (B.hp <= 0) return winBattle();
  enemyTurn();
  B.df = 0;
  if (B.hp <= 0) return winBattle();
  if (S.hp <= 0) {
    loseBattle();
    return;
  }
  render();
}

function enemyTurn() {
  if (B.poisonTurns > 0) {
    S.hp -= B.poisonDamage;
    B.poisonTurns--;
    log(
      `☠️ O veneno causa ${B.poisonDamage} de dano. (${B.poisonTurns} turno(s) restante(s))`,
      "bad",
    );
    if (S.hp <= 0) return;
  }
  if (B.burnTurns > 0) {
    B.hp -= B.burnDamage;
    B.burnTurns--;
    log(
      `🔥 A queimadura causa ${B.burnDamage} de dano. (${B.burnTurns} turno(s) restante(s))`,
      "bad",
    );
    if (B.hp <= 0) return;
  }
  B.tn++;
  if (B.boss && !B.ph && B.hp < B.mx / 2) {
    B.ph = 1;
    B.atk = Math.round(B.atk * 1.25);
    log(`🔥 ${B.n} libera todo o seu poder! <b>Fase 2!</b>`, "bad");
    const repeatedElement = Object.entries(B.elementUsage || {})
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!B.adaptedElement && repeatedElement) {
      B.adaptedElement = repeatedElement;
      B.adaptationMessage = `${B.n} reconheceu o uso repetido de ${E[repeatedElement]?.[0] || repeatedElement} e adaptou a guarda.`;
    }
    if (B.adaptedElement)
      log(`🧠 ${B.adaptationMessage}`, "bt");
  }
  if (B.stunTurns > 0) {
    B.stunTurns--;
    B.ch = 0;
    B.intent = "";
    if (!B.boss) {
      B.tacticCharge = 0;
      B.tacticTrap = 0;
    }
    return log(`⚡ ${B.n} está paralisado e perde a ação!`, "ok");
  }
  if (!B.boss && B.tactic == "trap") {
    if (B.tacticTrap == 1) {
      B.tacticTrap = 0;
      if (B.df) {
        log(`🛡️ Você se protegeu a tempo e evita a armadilha de ${B.n}.`, "ok");
      } else {
        const damage = Math.max(2, Math.round(B.atk * 0.65));
        S.hp -= damage;
        B.playerPinned = true;
        log(`🪤 A armadilha preparada por ${B.n} dispara: ${damage} de dano e desequilíbrio! Defender ou interromper a preparação teria evitado o golpe.`, "bad");
        return;
      }
    } else if (B.tn % 4 == 1) {
      B.tacticTrap = 1;
      return log(`⚠️ ${B.n} se afasta e prepara uma armadilha no terreno. Defenda-se ou interrompa a preparação antes do próximo ataque.`, "bt");
    }
  } else if (!B.boss && B.tactic == "chakra") {
    if (B.tacticCharge == 1) {
      B.tacticCharge = 0;
      const wall = B.wallTurns > 0,
        damage = Math.max(1, Math.round(B.atk * 1.5 * (B.df ? 0.4 : 1) * (wall ? 0.45 : 1)));
      if (wall) B.wallTurns--;
      S.hp -= damage;
      log(`💥 ${B.n} libera o golpe de chakra concentrado: ${damage} de dano${B.df || wall ? " (reduzido pela defesa)" : ""}.`, "bad");
      return;
    }
    if (B.tn % 4 == 2) {
      B.tacticCharge = 1;
      return log(`⚠️ ${B.n} reúne chakra para um golpe forte. Defenda-se, use uma barreira ou interrompa a carga com um efeito de controle.`, "bt");
    }
  }
  if (!B.boss && B.tactic == "guard" && B.tn % 4 == 3) {
    B.tacticGuard = 1;
    return log(`⚠️ ${B.n} assume uma postura defensiva para proteger os aliados. Prepare-se: seus ataques causarão menos dano no próximo turno.`, "bt");
  }
  if (B.boss && B.ch) {
    B.ch = 0;
    B.intent = "";
    const pattern = BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy,
      wall = B.wallTurns > 0,
      e = Math.max(
        1,
        Math.round(
          B.atk *
            pattern.multiplier *
            (B.df ? 0.35 : 1) *
            (wall ? 0.45 : 1) *
            (hasGear("armor") ? 0.9 : 1),
        ),
      );
    if (wall) B.wallTurns--;
    S.hp -= e;
    B.open = 1;
    let effectText = "";
    if (pattern.effect == "genjutsu" || pattern.effect == "drain") {
      const drained = pattern.effect == "genjutsu" ? 8 : 5;
      S.ck = Math.max(0, S.ck - drained);
      effectText = ` e drena ${drained} chakra`;
    } else if (pattern.effect == "poison" && !B.df && !wall) {
      B.poisonTurns = 2;
      B.poisonDamage = Math.max(3, Math.round(B.atk * 0.16));
      effectText = ` e aplica veneno por ${B.poisonTurns} turnos`;
    } else if (pattern.effect == "sand" && !B.df && !wall) {
      B.playerPinned = true;
      effectText = " e prende você na areia";
    } else if (pattern.effect == "push" && !B.df && !wall) {
      B.playerPinned = true;
      effectText = " e desequilibra você";
    } else if (pattern.effect == "paper" && !B.df && !wall) {
      B.playerPinned = true;
      S.ck = Math.max(0, S.ck - 6);
      effectText = " e prende você entre as folhas, drenando 6 chakra";
    } else if (pattern.effect == "roots" && !B.df && !wall) {
      B.playerPinned = true;
      S.ck = Math.max(0, S.ck - 5);
      effectText = " e prende seus movimentos, drenando 5 chakra";
    } else if (pattern.effect == "assault" && !B.df && !wall) {
      B.playerPinned = true;
      effectText = " e desequilibra você com o impacto";
    } else if (pattern.effect == "susanoo") {
      B.exposed = true;
      effectText = " mas o golpe deixa uma breve abertura";
    }

    return log(
      `💥 ${B.n} ${pattern.attack}: <b>${e}</b> de dano${B.df || wall || hasGear("armor") ? " (reduzido pela defesa)" : ""}${effectText}!`,
      "bad",
    );
  }
  const profile = B.boss
    ? BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy
    : null;
  if (B.boss && B.tn % profile.interval == 0) {
    B.ch = 1;
    B.intent = profile.telegraph;
    return log(
      `⚠️ ${B.n} prepara: <b>${profile.telegraph}</b> ${profile.tactic}`,
      "bt",
    );
  }
  const evadeChance = Math.min(35, S.vel * 0.8 + (S.clan == "hyuga" ? 10 : 0));
  if (Math.random() * 100 < evadeChance)
    return log("💨 Você esquiva do ataque!");
  const wall = B.wallTurns > 0,
    slow = B.slowTurns > 0,
    e = Math.max(
      1,
      Math.round(
        ((B.atk * R(8, 12)) / 10) *
          (B.df ? 0.4 : 1) *
          (wall ? 0.45 : 1) *
          (slow ? 0.7 : 1) *
          (B.el && mu(B.el, S.el) > 1 ? 1.3 : 1) *
          (hasGear("armor") ? 0.9 : 1),
      ),
    );
  if (wall) B.wallTurns--;
  if (slow) B.slowTurns--;
  S.hp -= e;
  log(
    `💥 ${B.n} ataca: <b>${e}</b> de dano${wall ? " (reduzido pela Parede de Terra)" : ""}${slow ? " (ataque enfraquecido)" : ""}${hasGear("armor") ? " (armadura leve)" : ""}.`,
    "bad",
  );
}

// Treino com senseis, por nível da técnica: afinidade, Nin mínimo e sessões necessárias.
const TA = [30, 40, 55],
  TN = [6, 10, 16],
  TS = [1, 2, 3];

function chakraGrow(w) {
  const cap = 40 + S.lv * 9 + S.rk * 12;
  if (S.mc >= cap || S.ckDay == S.day || (S.fatigue || 0) < 20) return;
  if (Math.random() < 0.03 * w) {
    S.ckDay = S.day;
    const g = R(1, 2);
    S.mc += g;
    log(
      `💠 Após o treino exaustivo, sua reserva máxima de chakra cresce em ${g} (agora ${S.mc}).`,
      "ok",
    );
  }
}

function teach(k) {
  const id = T,
    n = N[id],
    [e, s] = k.split(":"),
    i = +s,
    mx = SENMAX[id]?.[e];
  ew();
  if (mx == null || i > mx)
    return log(
      `<b>${n[0]}:</b> “Não domino essa técnica o bastante para ensiná-la.”`,
      "sys",
    );
  if (S.jt.includes(k)) return;
  if ((S.rel[id] || 0) < TA[i])
    return log(
      `<b>${n[0]}:</b> “Ainda não confio o bastante para ensinar isso.” (Afinidade ${TA[i]})`,
    );
  if (
    i > 0 &&
    !(S.jt.includes(e + ":" + (i - 1)) && mlv(e + ":" + (i - 1)) >= i)
  )
    return log(
      `<b>${n[0]}:</b> “Domine a técnica anterior primeiro (Maestria ${i}).”`,
    );
  if (!els().includes(e) && els().length >= Math.max(1, S.rk))
    return log(
      `🔒 Seu rank só permite ${Math.max(1, S.rk)} elemento(s).`,
      "bad",
    );
  if (S.lv < TL[i])
    return log(
      `<b>${n[0]}:</b> “Você ainda não tem preparo para isso.” (Nv ${TL[i]})`,
    );
  if (S.nin < TN[i])
    return log(
      `<b>${n[0]}:</b> “Seu controle de chakra ainda é insuficiente.” (Nin ${TN[i]})`,
    );
  if ((S.fatigue || 0) >= 70)
    return log("Você está exausto demais para absorver a lição.", "sys");
  const cost = Math.ceil(TC[i] / TS[i]);
  if (S.ryo < cost) return log("Ryo insuficiente para a sessão.", "sys");
  if (used("sen" + id))
    return log(`<b>${n[0]}:</b> “Descanse um pouco. Continuamos mais tarde.”`);
  S.ryo -= cost;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 15);
  const chance = Math.min(
    0.95,
    0.5 + (n[4][1] / 18) * 0.25 + (S.nin - TN[i]) * 0.03,
  );
  if (Math.random() < chance) S.lp[k] = (S.lp[k] || 0) + 1;
  else {
    gain(4);
    log(
      `${n[0]} corrige seus erros, mas você não consegue fixar a técnica nesta sessão.`,
      "bad",
    );
  }
  if ((S.lp[k] || 0) >= TS[i]) {
    delete S.lp[k];
    learn(k);
    gain(15 + i * 10);
    log(
      `🎓 ${n[0]} guia você até dominar <b>${E[e][3][i]}</b>! (-${cost} ryo)`,
      "ok",
    );
    if (i == 2) {
      const ganho = addStat("nin", 2);
      if (ganho > 0)
        log(`🏅 Você agora <b>domina o elemento ${E[e][0]}</b>! +2 Nin.`, "ok");
      else
        log(
          `🏅 Você domina ${E[e][0]}, mas Nin já chegou ao limite atual.`,
          "sys",
        );
    }
  } else if (S.lp[k])
    log(
      `📖 Sessão concluída: progresso ${S.lp[k]}/${TS[i]} em ${E[e][3][i]}.`,
      "ok",
    );
  chakraGrow(1 + i * 0.5);
  tick(1);
  render();
}

function session(id) {
  const n = N[id],
    st = n[5][0];
  ew();
  if ((S.rel[id] || 0) < 15)
    return log(
      `<b>${n[0]}:</b> “Nos conhecemos pouco para treinos pesados.” (Afinidade 15)`,
      "sys",
    );
  if ((S.fatigue || 0) >= 65 || S.ck < 8 || S.hp <= Math.ceil(S.mh * 0.2))
    return log("Você está debilitado demais para treinar agora.", "sys");
  if (used("ses" + id))
    return log(`${n[0]} sugere esperar o próximo período.`, "sys");
  if (st != "mh" && S[st] >= attrCap(st))
    return log(
      `Seu limite atual de ${st.toUpperCase()} é ${attrCap(st)}. Suba de nível ou rank para evoluir mais.`,
      "sys",
    );
  const q = n[4][1] / 9,
    pts = Math.max(
      1,
      Math.round(
        q *
          (0.7 + Math.random() * 0.6) *
          (1 +
            Math.min(0.5, (S.fatigue < 30 ? 0.25 : 0) + bondOf(id).trust / 40)),
      ),
    );
  S.ck -= 8;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 25);
  S.practice = S.practice || {};
  S.practice[st] = (S.practice[st] || 0) + pts;
  let up = 0;
  while (S.practice[st] >= 3) {
    S.practice[st] -= 3;
    if (st == "mh") {
      S.mh += 3;
      S.hp += 3;
      up++;
    } else {
      const ganho = addStat(st, 1);
      if (ganho) up++;
      else {
        S.practice[st] = 0;
        break;
      }
    }
  }
  remember(id, "treino", "Sessão de treino com orientação.", {
    affinity: 2,
    trust: 1,
    respect: 1,
    mentorship: 1,
  });
  gain(8 + Math.round(q * 4));
  log(
    `🥋 ${n[0]} conduz um treino pesado: +${pts} pontos de prática em ${st.toUpperCase()}${up ? ` · <b>${st.toUpperCase()} +${up}</b>` : ""}.`,
    "ok",
  );
  chakraGrow(1);
  tick(1);
  render();
}

function ensureStyleState() {
  if (!Array.isArray(S.styles)) S.styles = ["Equilibrado"];
  S.styles = [
    ...new Set([
      "Equilibrado",
      ...S.styles.filter(
        (id) =>
          id == "Equilibrado" || STYLE_BOOK.some((style) => style.id == id),
      ),
    ]),
  ];
  if (!S.styles.includes(S.combatStyle)) S.combatStyle = "Equilibrado";
  return S.styles;
}

function equippedSummary() {
  return (
    ["weapon", "armor", "tool"]
      .filter((slot) => S.equipped?.[slot] && GEAR[S.equipped[slot]])
      .map((slot) => GEAR[S.equipped[slot]].name)
      .join(" · ") || "Nenhum"
  );
}

function hasGear(id) {
  return (
    Object.prototype.hasOwnProperty.call(GEAR, id) &&
    S?.equipped?.[GEAR[id].slot] == id
  );
}

function gearStatBonus(stat) {
  return (
    (stat == "tai" && hasGear("kunai") ? 2 : 0) +
    (stat == "nin" && hasGear("scroll") ? 2 : 0) +
    (stat == "int" && hasGear("goggles") ? 2 : 0)
  );
}

function healingBonus() {
  return (
    (S.clan == "senju" ? 10 : 0) + (S.specialization == "medical" ? 10 : 0)
  );
}

function missionKind(mission) {
  if (!mission) return "";
  const text =
      `${mission.title || mission[1] || ""} ${mission.goal || mission[2] || ""}`.toLowerCase(),
    type = mission[6] || mission.type;
  if (type == "protect" || /proteger|proteção|defesa/.test(text))
    return "protect";
  if (type == "rescue" || /resgate|resgatar|salvar/.test(text)) return "rescue";
  if (
    ["retrieve", "investigation", "stealth"].includes(type) ||
    /investiga|pista|rastre|busca/.test(text)
  )
    return "investigation";
  if (type == "escort" || /escolta|acompanhar/.test(text)) return "escort";
  if (type == "combat" || (mission[3] && EN[mission[3]])) return "combat";
  return "";
}

function missionContext(mission, type) {
  return { title: mission[1], goal: mission[2], type };
}

function identityTestBonus(stat, mission) {
  const clan = S.clan || "none",
    spec = S.specialization || "balanced",
    kind = missionKind(mission);
  let bonus = gearStatBonus(stat);
  if (clan == "uchiha" && stat == "nin" && (!mission || kind == "combat"))
    bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (
    clan == "hyuga" &&
    ["investigation", "rescue"].includes(kind) &&
    ["int", "vel"].includes(stat)
  )
    bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (clan == "senju" && kind == "protect") bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (clan == "uzumaki" && stat == "nin") bonus += 1 + (S.lv >= 8 ? 1 : 0);
  const clanRenownBonus = Math.min(2, Math.floor((S.clanRenown || 0) / 25));
  if (
    clanRenownBonus &&
    ((clan == "uchiha" && stat == "nin" && (!mission || kind == "combat")) ||
      (clan == "hyuga" &&
        ["investigation", "rescue"].includes(kind) &&
        ["int", "vel"].includes(stat)) ||
      (clan == "senju" && kind == "protect") ||
      (clan == "uzumaki" && stat == "nin"))
  )
    bonus += clanRenownBonus;
  if (spec == "ninjutsu" && stat == "nin") bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (spec == "taijutsu" && stat == "tai") bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (
    spec == "tracking" &&
    ["investigation", "rescue", "retrieve"].includes(kind) &&
    ["vel", "int"].includes(stat)
  )
    bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (spec == "strategy" && ["int", "car"].includes(stat))
    bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (
    spec == "medical" &&
    ["rescue", "protect"].includes(kind) &&
    stat == "int"
  )
    bonus += 2 + (S.lv >= 8 ? 1 : 0);
  if (
    (S.organizations || []).includes("anbu") &&
    ["stealth", "investigation"].includes(kind) &&
    ["int", "vel"].includes(stat)
  )
    bonus++;
  if (
    (S.organizations || []).includes("akatsuki") &&
    ["combat", "survival"].includes(kind) &&
    ["nin", "tai"].includes(stat)
  )
    bonus++;
  return bonus;
}

function combatDamageMultiplier(kind) {
  let multiplier = 1;
  if (kind == "jut" && S.clan == "uchiha") multiplier *= 1.1;
  if (kind == "jut" && S.specialization == "ninjutsu" && S.lv >= 8)
    multiplier *= 1.1;
  if (kind == "tai" && S.specialization == "taijutsu" && S.lv >= 8)
    multiplier *= 1.1;
  multiplier *= fatorEstresseCombate();
  return multiplier;
}

function missionDifficultyBonus(mission) {
  const hasTeam = Array.isArray(mission?.squad)
    ? mission.squad.length > 0
    : (S.team || []).length > 0;
  if (S.specialization != "strategy" || !hasTeam) return 0;
  return S.lv >= 8 ? 2 : 1;
}

function styleTestBonus(stat) {
  ensureStyleState();
  const style = STYLE_BOOK.find((entry) => entry.id == S.combatStyle);
  return style?.stat == stat ? 2 : 0;
}

function combatStyleName() {
  ensureStyleState();
  return (
    STYLE_BOOK.find((entry) => entry.id == S.combatStyle)?.name || "Equilibrado"
  );
}

function styleTraining(id) {
  const style = STYLE_BOOK.find((entry) => entry.id == id),
    known = ensureStyleState();
  if (!style || style.master != T)
    return log("Este mestre não ensina esse estilo.", "sys");
  if (known.includes(id)) {
    S.combatStyle = id;
    save();
    log(
      `🥋 Estilo equipado: <b>${style.name}</b>. Bônus de +2 em ${style.stat.toUpperCase()} nos testes de missão.`,
      "ok",
    );
    return render();
  }
  const missing = [];
  if ((S.rel[T] || 0) < style.affinity)
    missing.push(`afinidade ${style.affinity}`);
  if (S.lv < style.level) missing.push(`nível ${style.level}`);
  if (S.done < style.missions)
    missing.push(`${style.missions} missão(ões) concluída(s)`);
  if (S.ryo < style.cost) missing.push(`${style.cost} ryō`);
  if ((S.fatigue || 0) >= 70) missing.push("fadiga abaixo de 70%");
  if (missing.length) return log(`Ainda falta: ${missing.join(", ")}.`, "sys");
  S.ryo -= style.cost;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 10);
  S.styles.push(id);
  S.combatStyle = id;
  remember(T, "treino", `Aprendeu o estilo ${style.name} com ${N[T][0]}.`, {
    affinity: 2,
    trust: 1,
    respect: 1,
    mentorship: 1,
  });
  gain(12);
  log(
    `📘 <b>${style.name}</b> aprendido e equipado! +2 em ${style.stat.toUpperCase()} nos testes de missão. (-${style.cost} ryō)`,
    "ok",
  );
  tick(1);
  save();
  render();
}
