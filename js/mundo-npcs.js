/* Mundo vivo: rotinas dos NPCs, rotas, passagem de dias, viagens e atividades por local. */

function recordWorldEvent(kind, title, detail, audience = null) {
  S.worldEvents = Array.isArray(S.worldEvents) ? S.worldEvents : [];
  const event = {
    day: S.day,
    kind,
    title,
    detail,
    audience: Array.isArray(audience) ? [...new Set(audience)] : null,
  };
  S.worldEvents.push(event);
  S.worldEvents = S.worldEvents.slice(-12);
  save();
  return event;
}

function recentWorldEvent() {
  return (S.worldEvents || []).at(-1) || null;
}

function marketDisruptionDays() {
  const until = ew().marketDisruptionUntil;
  return Number.isFinite(until) && until > S.day ? until - S.day : 0;
}

function registerMarketCrisis(event, detail) {
  const w = ew();
  w.marketDisruptionUntil = Math.max(
    w.marketDisruptionUntil || 0,
    S.day + 5,
  );
  w.marketDisruptionTitle = event.title;
  recordWorldEvent("crisis", event.title, detail);
}

function travelSideEvent() {
  if (S.sideEvent) return false;
  const history = Array.isArray(S.sideEventHistory)
      ? S.sideEventHistory
      : (S.sideEventHistory = []),
    recent = new Set(
      history.filter((entry) => S.day - entry.day < 5).map((entry) => entry.id),
    ),
    people = pres(S.loc).filter(
      (id) => !factionContactBlockedForEvents(id),
    ),
    candidates = [],
    add = (event) => {
      if (!recent.has(event.id)) candidates.push(event);
    };

  if (
    S.day % 12 == 0 &&
    ["academia", "ichiraku", "mercado", "treino"].includes(S.loc)
  ) {
    const attendee = people.length ? P(people) : "";
    add({
      id: "festival",
      kind: "festival",
      title: "Festival das lanternas",
      text: `Lanternas coloridas tomam as ruas de ${L[S.loc][1]}. Há música, barracas e gente da vila ajudando nos preparativos.`,
      npc: attendee,
    });
  }
  if (S.rk >= 1)
    add({
      id: "errand",
      kind: "errand",
      title: "Um pedido de última hora",
      text: "Uma mensageira pede ajuda para levar suprimentos a um posto próximo. É uma tarefa curta, mas alguém espera por eles.",
      npc: people.length ? P(people) : "",
    });
  if (["treino", "floresta", "exame"].includes(S.loc))
    add({
      id: "training",
      kind: "training",
      title: "Treino inesperado",
      text: "Um grupo está praticando no local. Uma instrutora percebe sua presença e oferece um exercício rápido de leitura de movimento.",
    });
  const rivals = people.filter((id) => ["sasuke", "lee", "neji", "kiba"].includes(id));
  if (rivals.length) {
    const rival = P(rivals);
    add({
      id: "rivalry",
      kind: "rivalry",
      title: "Desafio amistoso",
      text: `${N[rival][0]} propõe uma disputa breve. Não há plateia nem prêmio, apenas a chance de descobrir o que cada um aprendeu.`,
      npc: rival,
    });
  }
  if (people.length) {
    const companion = P(people);
    add({
      id: "friend",
      kind: "friend",
      title: "Um momento entre missões",
      text: `${N[companion][0]} está resolvendo uma tarefa cotidiana e parece contente por encontrar companhia.`,
      npc: companion,
    });
  }
  add({
    id: "rumor",
    kind: "rumor",
    title: "Rumores do caminho",
    text: P([
      `No mercado, comerciantes discordam sobre uma caravana que teria cruzado a região durante ${S.season.toLowerCase()}.`,
      "Dois mensageiros contam versões diferentes sobre uma antiga missão; ambos juram ter lido o relatório original.",
      `Perto de ${L[S.loc][1]}, alguém comenta que a Hokage procura voluntários para uma tarefa simples.`,
      "Um grupo de estudantes discute quem venceria uma corrida entre os telhados. Ninguém concorda com o resultado.",
    ]),
  });

  const story = storyState(),
    kzinnReady =
      (story.progress.kzinn || 0) > 0 || !!story.completed.kzinn;
  if (kzinnReady) {
    [
      {
        id: "kzinn-rumor-1",
        text: "Um veterano afirma que Kzinn atravessou a fronteira depois de negociar uma trégua. Um registro de escolta da mesma data diz que o herói nunca deixou a vila.",
      },
      {
        id: "kzinn-rumor-2",
        text: "Uma comerciante recorda ter visto o símbolo de Kzinn num abrigo nas montanhas. O mapa que ela guarda marca aquele símbolo numa ilha distante.",
      },
    ].forEach((rumor) => {
      if (story.kzinnRumors.includes(rumor.id) || Math.random() >= 0.35) return;
      add({
        ...rumor,
        kind: "kzinn",
        title: "Uma lembrança sobre Kzinn",
      });
    });
  }
  if (story.completed.kzinn && Math.random() < 0.12) {
    add({
      id: "kzinn-legacy",
      kind: "kzinn",
      title: "Um nome lembrado",
      text: "Durante uma conversa, alguém cita um feito atribuído a Kzinn. Outra pessoa se lembra do mesmo episódio de um jeito diferente; a conversa muda de assunto sem chegar a uma conclusão.",
    });
  }

  if (!candidates.length) return false;
  S.sideEvent = P(candidates);
  return true;
}

const CRIMINAL_ZONES = {
  akatsuki: {
    name: "Esconderijo da Akatsuki",
    chance: 0.65,
    enemies: ["akat", "obito"],
  },
  som: {
    name: "Esconderijo do Som",
    chance: 0.55,
    enemies: ["som", "dosu"],
  },
  santuario: {
    name: "Santuário da Cobra",
    chance: 0.5,
    enemies: ["renegado", "dosu"],
  },
  ponte: {
    name: "Ponte Naruto",
    chance: 0.4,
    enemies: ["gato", "bandidos"],
  },
  onda: {
    name: "País das Ondas",
    chance: 0.35,
    enemies: ["gato", "bandidos"],
  },
  fronteira: {
    name: "Fronteira",
    chance: 0.3,
    enemies: ["renegado", "som", "kiri"],
  },
};

function criminalThreat(location) {
  const zone = CRIMINAL_ZONES[location];
  if (zone) return { ...zone, nearby: false };
  const nearbyZone = routeNeighbors(location)
    .map((place) => CRIMINAL_ZONES[place])
    .find(Boolean);
  return nearbyZone
    ? { ...nearbyZone, chance: 0.15, nearby: true }
    : null;
}

function criminalLocationEncounter(location) {
  if (
    B ||
    M ||
    X ||
    S.activeContract ||
    S.assignment?.status == "active"
  )
    return false;
  const threat = criminalThreat(location);
  if (!threat || Math.random() >= threat.chance) return false;

  const enemyId = P(threat.enemies),
    enemy = EN[enemyId];
  if (!enemy) return false;
  log(
    threat.nearby
      ? `⚠️ Criminosos avistaram você perto de ${threat.name} e bloquearam a rota!`
      : `🚨 Você entrou em ${threat.name} e foi confrontado por criminosos!`,
    "bad",
  );
  fight(enemy, { criminalEncounter: true });
  return true;
}

function fillerEventPanel() {
  const event = S.sideEvent;
  if (!event) return "";
  const options =
    event.kind == "festival"
      ? ["Participar e ajudar nos preparativos", "Aproveitar a música e seguir depois"]
      : event.kind == "errand"
        ? ["Levar os suprimentos", "Agradecer e deixar a tarefa para outra equipe"]
        : event.kind == "training"
          ? ["Praticar o exercício", "Observar e anotar a técnica"]
          : event.kind == "rivalry"
            ? ["Aceitar a disputa", "Transformar o desafio em treino conjunto"]
            : event.kind == "friend"
              ? ["Oferecer ajuda", "Fazer companhia por alguns minutos"]
              : event.kind == "kzinn"
                ? ["Guardar o relato sem escolher uma versão", "Agradecer e não especular"]
                : ["Ouvir com atenção", "Continuar seu caminho"];
  return `<div class="world"><b>🌿 ${esc(event.title)}</b><br>${esc(event.text)}<div class="g">${options
    .map((label, index) =>
      btn(
        `${label}<small>Encontro opcional · Dia ${S.day}</small>`,
        `resolveFillerEvent(${index})`,
      ),
    )
    .join("")}</div></div>`;
}

function resolveFillerEvent(choice) {
  const event = S.sideEvent;
  if (!event || (choice != 0 && choice != 1)) return;
  const npc = event.npc && N[event.npc] ? event.npc : "",
    participou = choice == 0;
  if (npc && factionContactBlocked(npc)) {
    S.sideEvent = null;
    return;
  }
  if (event.kind == "festival") {
    if (participou) {
      S.ck = Math.min(S.mc, S.ck + 8);
      if (npc)
        remember(npc, "festival", "Vocês ajudaram nos preparativos do festival.", {
          affinity: 2,
          trust: 1,
        });
      log("🏮 Você ajuda a preparar as lanternas; a vila parece um pouco mais próxima.", "ok");
    } else {
      gain(3);
      log("🎐 Você acompanha a música por alguns minutos e segue com o coração mais leve.");
    }
  } else if (event.kind == "errand") {
    if (participou) {
      S.ryo += 35;
      S.rep = Math.min(100, (S.rep || 0) + 1);
      gain(8);
      if (npc)
        remember(npc, "ajuda", "Você ajudou a levar suprimentos ao posto.", {
          affinity: 2,
          trust: 1,
        });
      recordWorldEvent("success", "Entrega de suprimentos", "Uma tarefa curta foi concluída a caminho do posto.");
      log("📦 Os suprimentos chegam a tempo. +35 ryō, +8 XP e +1 reputação.", "ok");
    } else log("A mensageira agradece e procura outra equipe para a entrega.", "sys");
  } else if (event.kind == "training") {
    const stat = choice == 0 ? "vel" : "int",
      increase = addStat(stat, 1);
    S.fatigue = Math.min(100, (S.fatigue || 0) + (choice == 0 ? 8 : 3));
    gain(6);
    log(`🥋 Você aproveita o exercício e recebe +6 XP${increase ? ` e +1 ${stat.toUpperCase()}` : ""}.`, "ok");
  } else if (event.kind == "rivalry") {
    if (participou) {
      remember(
        npc,
        "rivalidade",
        "Vocês aceitaram um desafio amistoso e aprenderam um com o outro.",
        { affinity: 1, rivalry: 1, respect: 1 },
      );
      addStat("tai", 1);
      gain(8);
      log(`⚔️ O desafio termina em risadas e provocações respeitosas. ${N[npc][0]} continua querendo superar você.`, "ok");
    } else {
      remember(npc, "treino", "Vocês trocaram conselhos em vez de competir.", { affinity: 2, trust: 1 });
      addStat("int", 1);
      gain(5);
      log(`🤝 A rivalidade vira uma troca de técnicas com ${N[npc][0]}.`, "ok");
    }
  } else if (event.kind == "friend") {
    if (participou) {
      remember(npc, "ajuda", "Você ajudou numa tarefa cotidiana entre missões.", { affinity: 3, trust: 1 });
      log(`🤝 ${N[npc][0]} agradece a ajuda e a confiança entre vocês cresce.`, "ok");
    } else {
      remember(npc, "conversa", "Vocês dividiram alguns minutos tranquilos entre missões.", { affinity: 1, sharedMoments: 1 });
      gain(3);
      log(`🍃 Você faz companhia a ${N[npc][0]} por alguns minutos.`, "sys");
    }
  } else if (event.kind == "kzinn") {
    if (participou && event.id.startsWith("kzinn-rumor-")) {
      const story = storyState();
      if (!story.kzinnRumors.includes(event.id))
        story.kzinnRumors.push(event.id);
      gain(4);
      log("📜 Você registra as versões lado a lado. Nenhuma delas resolve a contradição.", "bt");
    } else if (event.id == "kzinn-legacy")
      log("🍃 O nome de Kzinn permanece entre as histórias da vila, sem uma resposta definitiva.", "sys");
    else log("Você deixa o rumor seguir seu caminho, sem transformá-lo em conclusão.", "sys");
  } else if (participou) {
    gain(4);
    addStat("int", 1);
    log("🗣️ Você escuta versões diferentes e anota apenas o que pode ser confirmado.", "sys");
  } else log("Você agradece o comentário e continua sua jornada.", "sys");

  S.sideEventHistory = Array.isArray(S.sideEventHistory)
    ? S.sideEventHistory
    : [];
  S.sideEventHistory.push({ id: event.id, day: S.day });
  S.sideEventHistory = S.sideEventHistory.slice(-20);
  S.sideEvent = null;
  tick(1);
  render();
}

function reactToWorldEvent(id, n) {
  const event = (S.worldEvents || [])
    .slice()
    .reverse()
    .find(
      (entry) =>
        entry &&
        S.day - entry.day <= 14 &&
        (!Array.isArray(entry.audience) || entry.audience.includes(id)),
    );
  if (!event || S.day - event.day > 14) return;
  const w = ew();
  w.heard = w.heard || {};
  const eventKey = `${event.day}:${event.kind}:${event.title}`;
  if (w.heard[id] == eventKey) return;
  w.heard[id] = eventKey;
  const line =
    event.kind == "promotion"
      ? `${event.detail} A nova patente traz deveres que também serão avaliados.`
      : event.kind == "debrief"
        ? id == "tsunade"
          ? `Recebi seu relatório sobre “${event.title}”. ${event.detail}`
          : `Ouvi o que você relatou sobre “${event.title}”. ${event.detail}`
        : event.kind == "crisis"
      ? `A crise em “${event.title}” ainda afeta os estoques. Os comerciantes estão cobrando mais enquanto repõem as mercadorias.`
      : event.kind == "failure"
        ? `Soube do que aconteceu em “${event.title}”. ${event.detail}`
        : event.kind == "rescue"
          ? `Ouvi que você resgatou um aliado em “${event.title}”. Isso importa para a vila.`
          : event.kind == "civilians"
            ? `Os moradores comentam que você protegeu civis em “${event.title}”.`
            : `A vila está comentando sua missão “${event.title}”. ${event.detail}`;
  log(`<b>${esc(n[0])}:</b> “${esc(line)}”`, "sys");
}

function worldDay() {
  const season = SEASONS[Math.floor((S.ageDays || 0) / 30) % SEASONS.length];
  S.season = season.name;
  S.weather = P(season.weather);
  log(`🌦️ ${S.season}: ${S.weather}.`, "sys");
  if (S.socialEvent && S.day - S.socialEvent.day >= 2) {
    S.socialCooldown[S.socialEvent.npc] = S.day;
    S.socialEvent = null;
  }
  expirePromises();
  if (!S.assignment) {
    const activityBusy = !!(S.activeContract || M || B || X || S.sideEvent);
    if (!activityBusy) {
      if (S.urgent) {
        S.urgent.daysLeft--;
        if (S.urgent.daysLeft <= 0) missUrgent(S.urgent);
      }
      if (!S.urgent) {
        const rogue = S.rogue?.active;
        const candidates = CRISES.filter(
          (event) =>
            (rogue || MSK.indexOf(event.rank) >= MSK.indexOf("B")) &&
            event.id != S.lastUrgent &&
            (!rogue || (event.localCause && event.loc == S.loc)) &&
            S.rk >= NEED[event.rank] &&
            (() => {
              const req = LOC_REQ[event.loc];
              return !req || (S.rk >= req.rk && S.done >= req.done);
            })(),
        );
        const chance =
          S.weather == "Tempestade"
            ? 0.32
            : S.weather == "Chuva forte"
              ? 0.24
              : 0.13;
        if (candidates.length && Math.random() < chance) {
          const event = P(candidates);
          S.urgent = { ...event, daysLeft: 3, rogueLocal: !!rogue };
          S.lastUrgent = event.id;
          log(
            `🚨 Chamado urgente em ${L[event.loc][1]}: <b>${event.title}</b>. Você tem três dias para chegar e ajudar.`,
            "bt",
          );
        }
      }
      if (
        !S.urgent &&
        S.rk >= 1 &&
        S.day >= 4 &&
        S.day - (S.lastAssignmentDay || 0) >= 4 &&
        Math.random() < 0.16 + Math.min(0.2, (S.rep || 0) / 500)
      )
        offerHokageMission();
      if (
        !S.assignment &&
        !S.urgent &&
        !S.socialEvent &&
        Math.random() < 0.12 + Math.min(0.18, (S.rep || 0) / 500)
      )
        offerNpcEvent();
    }
  }
}

function go(k) {
  if (!L[k]) return log("Esse destino não existe no mapa.", "sys");
  if (academyStudent() && k != "academia") {
    log(
      "📚 Você ainda não se formou. Iruka pede que conclua as aulas e o exame antes de sair da Academia.",
      "sys",
    );
    return render();
  }
  const req = LOC_REQ[k];
  if (req && (S.rk < req.rk || S.done < req.done)) {
    log(
      `🔒 Acesso bloqueado. Requer rank ${RK[req.rk]} e ${req.done} missões concluídas.`,
      "sys",
    );
    return render();
  }
  S.infiltration = null;
  S.loc = k;
  tick(1);
  mode = "map";
  log(`🚶 Você segue para <b>${L[k][1]}</b>.`, "sys");
  if (renegadeHunterEncounter(k) || criminalLocationEncounter(k)) return;
  if (Math.random() < 0.25) ev();
  render();
}

function renegadeHunterEncounter(location) {
  const rogue = S.rogue;
  if (!rogue?.active || rogue.lastHuntDay >= S.day) return false;
  const inKonoha = REG[location] == "k",
    chance = Math.min(
      0.6,
      (inKonoha ? 0.24 : 0.1) + Math.min(0.2, rogue.wantedLevel * 0.025),
    );
  if (Math.random() >= chance) return false;

  rogue.lastHuntDay = S.day;
  const hunter = [
    "Caçador de recompensas",
    Math.round(100 + S.lv * 18 + S.rk * 35),
    Math.round(10 + S.lv * 1.2 + S.rk * 3),
    "",
  ];
  log(
    `🚨 Um caçador de recompensas encontrou seu rastro${inKonoha ? " perto de Konoha" : ""}!`,
    "bad",
  );
  fight(hunter, {
    rogueHunter: true,
    win: () => {
      const bounty = 25 + rogue.wantedLevel * 10;
      rogue.wantedLevel++;
      S.ryo += bounty;
      log(
        `💰 Você derrotou o caçador e tomou ${bounty} ryō da recompensa. Sua notoriedade aumentou para nível ${rogue.wantedLevel}.`,
        "ok",
      );
    },
    loss: () => {
      rogue.wantedLevel++;
      log(
        `⚠️ Você perdeu o confronto e acorda no hospital. Sua fama como procurado aumentou para nível ${rogue.wantedLevel}.`,
        "bad",
      );
    },
  });
  return true;
}

function ev() {
  if (travelSideEvent()) {
    log("🌿 Um encontro inesperado interrompe sua viagem por alguns instantes.", "sys");
    return;
  }
  const r = R(1, 6);
  if (r == 1) {
    const y = R(10, 40);
    S.ryo += y;
    log(`💰 Você encontra ${y} ryo no chão!`);
  } else if (r == 2) {
    const foe =
      S.loc == "onda" || S.loc == "ponte"
        ? "gato"
        : S.loc == "som"
          ? "dosu"
          : S.loc == "akatsuki"
            ? "obito"
            : P(["ladrao", "lobo", "renegado"]);
    log("⚠️ Um inimigo aparece no caminho!", "bad");
    fight(EN[foe], {});
  } else if (r == 3)
    log(
      P([
        "🗣️ Ouve rumores sobre movimentações da Akatsuki.",
        "🗣️ Dizem que Naruto devorou 12 tigelas de ramen hoje.",
        "🗣️ Um mercador comenta que a Hokage busca novos ninjas.",
      ]),
      "sys",
    );
  else if (r == 4) {
    gain(6);
    log("🥷 Um ninja de passagem corrige sua postura. (+6 XP)");
  } else if (r == 5) {
    const witnesses = pres(S.loc);
    if (witnesses.length) {
      const id = P(witnesses);
      rel(id, 2);
      log(
        `🤝 Você ajuda ${N[id][0]} com uma tarefa simples. A confiança entre vocês aumenta.`,
        "ok",
      );
    } else
      log("🍃 O vento muda e nuvens escuras se acumulam no horizonte.", "sys");
  } else {
    const damage = R(4, 10);
    S.hp = Math.max(1, S.hp - damage);
    log(
      `🌧️ O terreno escorregadio causa uma queda. Você perde ${damage} HP.`,
      "bad",
    );
  }
}

const hs = (...a) => {
  let h = 2166136261;
  for (const c of a.join("|")) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};

function ew() {
  S.wd = S.wd || {};
  ["away", "hurt", "dead", "returns"].forEach((k) => (S.wd[k] = S.wd[k] || {}));
  if (
    !S.wd.returns ||
    typeof S.wd.returns != "object" ||
    Array.isArray(S.wd.returns)
  )
    S.wd.returns = {};
  S.lp = S.lp || {};
  S.fame = S.fame || 0;
  S.rep = S.rep || 0;
  Object.keys(S.wd.dead).forEach((id) => {
    const i = EXTEAM.indexOf(id);
    if (i >= 0) EXTEAM.splice(i, 1);
    S.team = (S.team || []).filter((m) => m != id);
  });
  return S.wd;
}

const locsOf = (id) => Object.keys(L).filter((k) => L[k][2].includes(id));

const homeOf = (id) => {
  const ks = locsOf(id);
  return ks.some((k) => REG[k] == "k") ? "k" : REG[ks[0]];
};

function npcRoutine(id, locations) {
  if (NPC_SCHEDULES[id]) {
    const schedule = NPC_SCHEDULES[id],
      rotation = Math.floor(hs(id, "routine") * schedule.length);
    return [0, 1, 2].map(
      (slot) => schedule[(slot + rotation + S.day) % schedule.length],
    );
  }
  if (ROT[id])
    return ROT[id].map((places, t) =>
      places.length
        ? places[Math.floor(hs(id, "routine", t) * places.length)]
        : null,
    );
  const w = ew();
  w.routines = w.routines || {};
  if (!w.routines[id]) {
    const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    w.routines[id] = [0, 1, 2].map(
      (t) => locations[(seed + t) % locations.length],
    );
  }
  return w.routines[id];
}

function scheduledWhere(id, d = S.day, t = S.t) {
  const w = ew(),
    timeSlot = d * 3 + t;
  if (w.dead[id]) return null;
  if (S.assignment?.status == "active" && S.assignment.squad?.includes(id))
    return null;
  if (M && (S.team || []).includes(id)) return null;
  const h = w.hurt[id];
  if (h && timeSlot < h.until) return homeOf(id) == "k" ? "hospital" : null;
  const a = w.away[id];
  if (a) {
    if (d == a.from && t == 0) return "portao";
    if (d == a.until && t == 1) return "portao";
    if (d >= a.from && d <= a.until) return null;
  }
  if (
    id == "konohamaru" &&
    w.apprenticeSummoned &&
    (S.promotionDuties || []).some(
      (duty) => duty.type == "mentorship" && duty.status == "pending",
    )
  )
    return "academia";
  const cs = locsOf(id).filter((k) => REG[k] == homeOf(id));
  if (!cs.length) return null;
  const eventText = `${S.urgent?.title || ""} ${M?.m?.[1] || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
    villageCrisis = /invas|ataque.{0,30}konoha|evacuacao de konoha/.test(
      eventText,
    ),
    storyDefense = M?.story?.arcId == "konohadefesa" && M.story.stageIndex >= 1;
  if (
    (villageCrisis || storyDefense) &&
    [
      "tsunade",
      "kakashi",
      "shikamaru",
      "sakura",
      "shizune",
      "yamato",
      "sai",
    ].includes(id)
  )
    return "torre";
  if (
    (villageCrisis || storyDefense) &&
    ["naruto", "lee", "kiba", "hinata", "neji", "tenten", "shino"].includes(id)
  )
    return "portao";
  const routine = npcRoutine(id, cs);
  return routine[t] || null;
}

function routeNeighbors(location) {
  const region = REG[location],
    hub = ROUTE_HUB[region],
    neighbors = new Set(ROUTE_LINKS[location] || []);
  if (hub) {
    if (location == hub)
      Object.keys(REG)
        .filter((place) => REG[place] == region && place != hub)
        .forEach((place) => neighbors.add(place));
    else neighbors.add(hub);
  }
  if (worldConsequences().regions.onda.bridge == "completed") {
    if (location == "fronteira") neighbors.add("ponte");
    if (location == "ponte") neighbors.add("fronteira");
  }
  return [...neighbors];
}

function routePath(from, to) {
  if (from == to) return [from];
  const queue = [[from]],
    visited = new Set([from]);
  while (queue.length) {
    const path = queue.shift(),
      last = path[path.length - 1];
    for (const next of routeNeighbors(last)) {
      if (visited.has(next)) continue;
      const candidate = [...path, next];
      if (next == to) return candidate;
      visited.add(next);
      queue.push(candidate);
    }
  }
  return null;
}

function advanceNpcTravel() {
  const w = ew();
  w.position = w.position || {};
  w.travel = w.travel || {};
  for (const id of Object.keys(N)) {
    if (S.assignment?.status == "active" && S.assignment.squad?.includes(id)) {
      w.position[id] = S.assignment.loc;
      delete w.travel[id];
      continue;
    }
    if (M && (S.team || []).includes(id)) {
      w.position[id] = S.loc;
      delete w.travel[id];
      continue;
    }
    const target = scheduledWhere(id);
    if (!target) {
      if (!w.away[id]) {
        delete w.position[id];
        delete w.travel[id];
      }
      continue;
    }
    if (!w.position[id]) {
      w.position[id] = target;
      continue;
    }
    if (w.position[id] == target) {
      delete w.travel[id];
      continue;
    }
    const path = routePath(w.position[id], target);
    if (!path || path.length < 2) {
      w.position[id] = target;
      delete w.travel[id];
      continue;
    }
    w.position[id] = path[1];
    if (w.position[id] == target) delete w.travel[id];
    else w.travel[id] = { to: target, remaining: path.length - 2 };
  }
}

function where(id) {
  const target = scheduledWhere(id);
  if (!target) return null;
  const w = ew();
  w.position = w.position || {};
  if (!w.position[id]) w.position[id] = target;
  return w.position[id];
}

function pres(l) {
  return Object.keys(N).filter((id) => where(id) == l);
}

function npcRecovery(id) {
  const injury = ew().hurt[id];
  if (!injury || slot() >= injury.until) return null;
  return {
    days: Math.ceil((injury.until - slot()) / 3),
    grave: injury.grave,
  };
}

function hurtNpc(id, grave) {
  const w = ew();
  if (w.dead[id]) return;
  w.hurt[id] = {
    until: slot() + (grave ? R(18, 27) : R(12, 18)),
    grave: !!grave,
  };
  delete w.away[id];
}

function die(id, why) {
  const w = ew(),
    n = N[id];
  if (!n || w.dead[id]) return;
  const eraAliado =
      (S.team || []).includes(id) || !!S.assignment?.squad?.includes(id),
    eraProximo = (S.rel?.[id] || 0) >= 40;
  w.dead[id] = S.day;
  delete w.hurt[id];
  delete w.away[id];
  delete (S.promises || {})[id];
  if (S.socialEvent?.npc == id) S.socialEvent = null;
  if (S.sideEvent?.npc == id) S.sideEvent = null;
  S.team = (S.team || []).filter((m) => m != id);
  if (S.rs) delete S.rs[id];
  log(`🕯️ <b>${n[0]} morreu</b> (${why}). Konoha está de luto.`, "bad");
  registrarLuto(eraAliado, eraProximo);
  RELS.filter((r) => r[0] == id || r[1] == id).forEach((r) => {
    const o = r[0] == id ? r[1] : r[0];
    if (N[o] && !w.dead[o]) {
      remember(o, "luto", `${n[0]} morreu.`, { trust: -1 });
      log(`${N[o][0]} está abalado(a) com a perda de ${n[0]}.`, "sys");
    }
  });
  if (S.assignment?.squad)
    S.assignment.squad = S.assignment.squad.filter((m) => m != id);
  if (S.urgent?.npc == id) {
    S.urgent = null;
    log("O chamado ligado a " + n[0] + " foi cancelado.", "sys");
  }
  S.pres = {};
}

function daySim() {
  const w = ew();
  Object.keys(w.hurt).forEach((id) => {
    const h = w.hurt[id];
    if (slot() < h.until) return;
    const med = ["tsunade", "shizune", "haruka", "sakura"].filter(
      (i) => !w.dead[i],
    ).length;
    if (h.grave && MORTAL.includes(id) && Math.random() < 0.28 - 0.04 * med)
      die(id, "não resistiu aos ferimentos");
    else {
      delete w.hurt[id];
      log(`🏥 ${N[id][0]} recebeu alta do hospital.`, "sys");
    }
  });
  Object.keys(w.away).forEach((id) => {
    const a = w.away[id];
    if (S.day > a.until) {
      registerNpcMissionReturn(id, a);
      return delete w.away[id];
    }
    const p = { B: 0.03, A: 0.07, S: 0.12 }[a.rank];
    if (p && S.day > a.from && Math.random() < p) {
      const grave = a.rank != "B" && Math.random() < 0.35;
      registerNpcMissionReturn(id, a, true);
      hurtNpc(id, grave);
      log(
        `🗣️ Notícia: ${N[id][0]} voltou ferido(a) de uma missão rank ${a.rank}${grave ? " e o estado é grave" : ""}.`,
        "sys",
      );
    }
  });
  Object.keys(AWAYR).forEach((id) => {
    if (
      !N[id] ||
      w.dead[id] ||
      w.away[id] ||
      w.hurt[id] ||
      S.assignment?.squad?.includes(id) ||
      Math.random() >= AWAYR[id]
    )
      return;
    w.away[id] = {
      from: S.day,
      until: S.day + R(2, 4),
      rank: P(["C", "C", "B", "B", "A"]),
      region: homeOf(id) || "k",
    };
  });
  if (
    S.urgent &&
    (S.assignment?.status == "active" || S.activeContract || M || B || X)
  ) {
    S.urgent.daysLeft--;
    if (S.urgent.daysLeft <= 0) missUrgent(S.urgent);
  }
  if (
    !S.hokage &&
    S.rk == 3 &&
    S.rep >= 99.5 &&
    S.fame >= 60 &&
    S.done >= 45 &&
    S.worldYears >= 4 &&
    S.lv >= 20
  ) {
    S.hokage = true;
    log(
      "🏯 <b>O conselho da vila e Tsunade reconhecem sua trajetória: você é nomeado(a) o Hokage de Konoha!</b>",
      "ok",
    );
  }
}

const lockedLoc = (k) => {
  const q = LOC_REQ[k];
  return q && (S.rk < q.rk || S.done < q.done);
};

function travelTo(k, infiltrate = false) {
  if (!L[k]) return log("Esse destino não existe no mapa.", "sys");
  if (academyStudent() && k != "academia") return go(k);
  if (lockedLoc(k)) return go(k);
  const threat = criminalThreat(k);
  if (infiltrate && (!threat || threat.nearby || S.rogue?.active))
    return log("Este local não oferece uma rota de infiltração disponível.", "sys");
  if (
    infiltrate &&
    (B || M || X || S.activeContract || S.assignment?.status == "active")
  )
    return log("Conclua o combate ou compromisso atual antes de se infiltrar.", "sys");
  const path = routePath(S.loc, k);
  if (!path) return log("Não há uma rota conhecida para esse destino.", "sys");
  if (path.length < 2) return log("Você já está nesse local.", "sys");
  const distance = path.length - 1;
  mode = "map";
  S.infiltration = infiltrate
    ? { location: k, day: S.day, suspicion: 0 }
    : null;
  for (let i = 1; i < path.length; i++) {
    S.loc = path[i];
    tick(1);
    if (
      !infiltrate &&
      (renegadeHunterEncounter(S.loc) ||
        criminalLocationEncounter(S.loc))
    ) {
      save();
      return;
    }
  }
  log(
    `🚶 Você chegou a <b>${L[k][1]}</b> após ${distance} ${distance == 1 ? "período" : "períodos"} de viagem.`,
    "sys",
  );
  if (infiltrate) {
    const detectionChance = Math.min(
      0.75,
      Math.max(0.12, 0.4 - ((S.int + S.vel - 10) * 0.015)),
    );
    if (Math.random() < detectionChance) {
      S.infiltration = null;
      const enemy = EN[P(threat.enemies)];
      log(
        `🚨 Sua infiltração em ${threat.name} foi descoberta antes que você pudesse se esconder!`,
        "bad",
      );
      fight(enemy, { infiltrationDiscovered: true });
      save();
      return;
    }
    S.infiltration = { location: k, day: S.day, suspicion: 0 };
    log(
      `🕵️ Você se infiltrou em ${threat.name} sem ser visto(a). Evite chamar atenção para não ser descoberto(a).`,
      "ok",
    );
  } else if (Math.random() < 0.25) ev();
  if (!infiltrate && distance > 1 && Math.random() < 0.3 && !B) {
    log("⚠️ Você é emboscado(a) na estrada!", "bad");
    fight(EN[P(["ladrao", "lobo", "renegado"])]);
    return;
  }
  selLoc = null;
  save();
  render();
}

/* ----- Atividades por local ----- */
const fat = (n) => (S.fatigue = Math.min(100, (S.fatigue || 0) + n)),
  heal = (n) => (S.hp = Math.min(S.mh, S.hp + n)),
  rep1 = () => (S.rep = Math.min(100, (S.rep || 0) + 1)),
  WATER = ["onda", "ponte", "cachoeira", "nevoa", "onsen"];

const ACTS = [
  [
    "onsen",
    "♨️ Banho termal",
    "20 ryō · zera a fadiga e cura",
    () => {
      if (S.ryo < 20) return log("Você não tem ryō suficiente.", "sys");
      S.ryo -= 20;
      S.fatigue = 0;
      S.hp = S.mh;
      S.ck = Math.min(S.mc, S.ck + 20);
      return "Você relaxa nas águas quentes e se sente renovado(a).";
    },
  ],
  [
    "cachoeira",
    "💧 Meditar sob a cachoeira",
    "Chakra cheio · chance rara de +1 chakra máximo",
    () => {
      S.ck = S.mc;
      fat(5);
      gain(15);
      if (Math.random() < 0.06) {
        S.mc++;
        return "Sua mente silencia: o chakra máximo aumentou em 1! (+15 XP)";
      }
      return "A água gelada clareia sua mente. (+15 XP)";
    },
  ],
  [
    "arena",
    "⚔️ Duelo amistoso",
    "Combate contra um duelista da arena",
    () => {
      fight([
        "Duelista da Arena",
        50 + S.lv * 9,
        6 + S.lv,
        P(["", "fogo", "agua", "vento"]),
      ]);
      return -1;
    },
  ],
  [
    "monumento",
    "🕯️ Homenagear os heróis",
    "+1 reputação · +8 XP",
    () => {
      rep1();
      gain(8);
      return "Você lê os nomes gravados e reflete sobre o Fogo da Vontade.";
    },
  ],
  [
    "floresta",
    "🌿 Coletar ervas e caçar",
    "Ryō e chance de kit médico",
    () => {
      fat(8);
      const y = R(20, 55);
      S.ryo += y;
      if (Math.random() < 0.3) {
        S.kit++;
        return `Você vende caça (+${y} ryō) e prepara um kit médico.`;
      }
      return `Você vende caça e ervas por ${y} ryō.`;
    },
  ],
  [
    "mercado",
    "📦 Bico de entregador",
    "25–50 ryō",
    () => {
      fat(6);
      const y = R(25, 50);
      S.ryo += y;
      return `Você entrega pacotes pela vila e ganha ${y} ryō.`;
    },
  ],
  [
    "mercado",
    "🛍️ Repor kit médico",
    "Comprar 1 kit médico · preço local varia · consome um período",
    () => {
      const price = marketPrice(25);
      if (S.ryo < price) return log("Ryō insuficiente para comprar um kit médico.", "sys");
      S.ryo -= price;
      S.kit++;
      return `Você conversa com os comerciantes e compra um kit médico por ${price} ryō.`;
    },
  ],
  [
    "mercado",
    "💊 Repor pílula de soldado",
    "Comprar 1 pílula · preço local varia · consome um período",
    () => {
      const price = marketPrice(30);
      if (S.ryo < price) return log("Ryō insuficiente para comprar uma pílula.", "sys");
      S.ryo -= price;
      S.pill++;
      return `Você compra uma pílula de soldado por ${price} ryō e confere o selo do frasco.`;
    },
  ],
  [
    "torre",
    "🗂️ Ajudar na papelada",
    "+30 ryō · +1 reputação",
    () => {
      S.ryo += 30;
      rep1();
      return "Shizune agradece a ajuda com os relatórios.";
    },
  ],
  [
    "portao",
    "🛡️ Patrulhar o portão",
    "+1 reputação · +12 XP · pode haver combate",
    () => {
      rep1();
      gain(12);
      fat(6);
      if (Math.random() < 0.2) {
        fight(EN[P(["ladrao", "lobo"])]);
        return -1;
      }
      return "A patrulha termina sem incidentes.";
    },
  ],
  [
    "hospital",
    "🩺 Voluntariar-se",
    "+1 reputação · +15 ryō · +10 XP",
    () => {
      rep1();
      S.ryo += 15;
      gain(10);
      return "Você ajuda a cuidar dos feridos.";
    },
  ],
  [
    "ichiraku",
    "🍜 Desafio das tigelas",
    "15 ryō · cura bastante",
    () => {
      if (S.ryo < 15) return log("Você não tem ryō suficiente.", "sys");
      S.ryo -= 15;
      heal(50);
      fat(-10);
      if (Math.random() < 0.05) {
        S.mh++;
        return "Teuchi aplaude! Sua vitalidade máxima aumentou em 1.";
      }
      return "Você devora o ramen e recupera as forças!";
    },
  ],
  [
    WATER,
    "🎣 Pescar",
    "15–35 ryō · chance de pílula",
    () => {
      fat(4);
      const y = R(15, 35);
      S.ryo += y;
      if (Math.random() < 0.15) {
        S.pill++;
        return `Você pesca uma carpa dourada: +${y} ryō e uma pílula!`;
      }
      return `Boa pescaria: +${y} ryō.`;
    },
  ],
  [
    ["chuva", "nuvem", "nevoa", "templo"],
    "🧭 Investigar a região",
    "Rumores, ryō ou encontros",
    () => {
      const r = Math.random();
      if (r < 0.25) {
        fight(EN[P(["renegado", "kiri", "som"])]);
        return -1;
      }
      if (r < 0.55) {
        const y = R(40, 90);
        S.ryo += y;
        return `Você faz um trabalho local por ${y} ryō.`;
      }
      gain(25);
      return "Moradores contam histórias e rumores da guerra. (+25 XP)";
    },
  ],
  [
    "*",
    "🧭 Explorar os arredores",
    "Pode render ryō, itens, XP ou combate",
    () => {
      const r = Math.random();
      if (r < 0.2) {
        fight(EN[P(["ladrao", "lobo", "renegado"])]);
        return -1;
      }
      if (r < 0.5) {
        const y = R(20, 60);
        S.ryo += y;
        fat(5);
        return `Você encontra uma bolsa esquecida: +${y} ryō.`;
      }
      if (r < 0.65) {
        S.kit++;
        return "Entre as pedras, você acha um kit médico.";
      }
      gain(15);
      return "Você descobre uma trilha antiga. (+15 XP)";
    },
  ],
];

const actHere = () =>
  ACTS.map((a, i) => ({ a, i })).filter(
    ({ a }) =>
      a[0] == "*" ||
      a[0] == S.loc ||
      (Array.isArray(a[0]) && a[0].includes(S.loc)),
  );

function recordRoutineActivity(title, outcome) {
  const witnesses = pres(S.loc),
      logEntry = {
        day: S.day,
        slot: S.t,
        location: S.loc,
        title,
        outcome,
      };
  S.routineLog = Array.isArray(S.routineLog) ? S.routineLog : [];
  S.routineLog.push(logEntry);
  S.routineLog = S.routineLog.slice(-30);
  recordJournalEvent(
      "rotina",
      title,
      `Atividade opcional em ${L[S.loc][1]}.`,
      witnesses,
      outcome,
  );
  const code = (S.shinobiCode = S.shinobiCode || {});
  if (/patrulh|papelada|suprimento/i.test(title))
      code.duty = Math.min(20, (code.duty || 0) + 1);
  if (/hospital|voluntari/i.test(title))
      code.civilians = Math.min(20, (code.civilians || 0) + 1);
}

function doAct(i) {
  S.acts = S.acts || {};
  if (S.acts[i] == S.day)
    return log("Você já fez isso hoje. Volte amanhã.", "sys");
  if (academyStudent()) return log("📚 Conclua a Academia antes.", "sys");
  const res = ACTS[i][3]();
  if (!res) return render();
  S.acts[i] = S.day;
  if (res !== -1) recordRoutineActivity(ACTS[i][1], res);
  tick(1);
  if (res !== -1) log(res, "ok");
  save();
  render();
}
