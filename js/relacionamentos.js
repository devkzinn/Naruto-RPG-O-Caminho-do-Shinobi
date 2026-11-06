/* Relações, convites de equipe, linhagens, filiações, conversas e romance. */

const rl = (v) =>
  v < 0
    ? "😠 Hostil"
    : v < 20
      ? "🙂 Conhecido"
      : v < 50
        ? "😄 Amigo"
        : v < 80
          ? "💛 Melhor amigo"
          : "🔥 Irmão de armas";

// Expressões que indicam flerte. Evitam palavras ambíguas (ex.: "gato" = animal).
const ROM =
    /te amo|amo voc[eê]|gosto de voc[eê]|\bbeij(?:o|ar|ei|inho)|\bnamor(?:ar|o|ado|ada)\b|voc[eê] [eé] (?:lind[oa]|bonit[oa]|gat[oa])\b|sair comigo|encontro (?:comigo|rom[aâ]ntico)|cantada|paquer|flert/,
  SEXY =
    /(?<![a-zà-ÿ])(?:sexo|transa(?:r|mos)?|pelad[oa]|safad[oa])(?![a-zà-ÿ])/;

const VILLAIN_NPCS = new Set([
  "oro",
  "kabuto",
  "dosu",
  "tayuya",
  "obito",
  "itachi",
  "kisameNpc",
  "gato",
]);

const factionContactBlockedForEvents = (id) =>
  VILLAIN_NPCS.has(id) != !!S.rogue?.active;

function factionContactBlocked(id) {
  const villain = VILLAIN_NPCS.has(id),
    rogue = !!S.rogue?.active,
    npcFaction = FACTION_BY_NPC[id],
    factionHostile = npcFaction && factionStanding(npcFaction) <= 10;
  if (villain == rogue && !factionHostile) return false;

  if (
    villain &&
    !rogue &&
    S.infiltration?.location == S.loc
  ) {
    const suspicion = S.infiltration.suspicion || 0,
      discoveryChance = Math.min(
        0.9,
        Math.max(
          0.1,
          0.3 + suspicion * 0.12 - ((S.vel + S.int - 10) * 0.012),
        ),
      );
    if (Math.random() >= discoveryChance) {
      S.infiltration.suspicion = Math.min(4, suspicion + 1);
      log(
        `🕵️ Você observa ${N[id][0]} sem ser descoberto(a). Não pode iniciar uma relação sem se revelar como renegado.`,
        "sys",
      );
      save();
      render();
      return true;
    }
  }

  const target = N[id];
  S.infiltration = null;
  T = null;
  mode = "map";
  log(
    factionHostile
      ? `🚨 ${target[0]} rompe o contato: a relação com ${WORLD_FACTIONS[npcFaction].name} chegou ao nível hostil.`
      : villain
      ? `🚨 ${target[0]} percebe sua infiltração e ataca!`
      : `🚨 ${target[0]} reconhece você como renegado e parte para o ataque!`,
    "bad",
  );
  fight([target[0], target[4][0], target[4][1], target[4][2]], {
    factionHostility: true,
  });
  return true;
}

function offerNpcEvent() {
  if (S.day - (S.lastSocialDay || 0) < 2) return;
  const candidates = pres(S.loc).filter(
    (id) =>
      SOCIAL_SCENES[id] &&
      !factionContactBlockedForEvents(id) &&
      S.day - (S.socialCooldown?.[id] || -3) >= 3,
  );
  if (!candidates.length) return;
  const id = P(candidates);
  S.socialEvent = { npc: id, day: S.day };
  S.lastSocialDay = S.day;
}

function resolveSocial(index) {
  const id = S.socialEvent?.npc,
    scene = SOCIAL_SCENES[id],
    choice = scene?.choices[index];
  if (!id || ew().dead[id]) {
    S.socialEvent = null;
    return log("O encontro foi cancelado; essa pessoa não está mais disponível.", "sys");
  }
  if (factionContactBlocked(id)) {
    S.socialEvent = null;
    return;
  }
  if (!choice) return;
  const effect = SOCIAL_EFFECTS[choice[2]];
  remember(id, choice[2], choice[1], {
    affinity: effect.affinity,
    trust: effect.trust,
    respect: effect.respect,
    sharedMoments: 1,
  });
  recordJournalEvent(
    "decisão social",
    `${N[id][0]}: ${choice[0]}`,
    choice[1],
    [id],
    "A escolha alterou o vínculo e a disposição de vocês para trabalhar juntos.",
  );
  if (effect.stat) {
    const stat = effect.stat == "specialty" ? N[id][5][0] : effect.stat;
    addStat(stat, effect.increase);
  }
  if (effect.hp) S.hp = Math.min(S.mh, S.hp + effect.hp);
  if (effect.chakra) S.ck = Math.min(S.mc, S.ck + effect.chakra);
  if (effect.fatigue)
    S.fatigue = Math.max(0, (S.fatigue || 0) + effect.fatigue);
  let reputacaoGanha = 0;
  if (effect.rep && (S.rep || 0) < 12) {
    const antes = S.rep || 0;
    S.rep = Math.min(12, antes + effect.rep * 0.25);
    reputacaoGanha = Math.round((S.rep - antes) * 100) / 100;
  }
  S.socialCooldown[id] = S.day;
  S.socialEvent = null;
  gain(effect.xp);
  log(`<b>${N[id][0]}:</b> ${choice[1]}`);
  log(
    `🤝 Afinidade +${effect.affinity}${reputacaoGanha ? ` · reputação +${reputacaoGanha}` : ""}.`,
    "ok",
  );
  render();
}

function ignoreSocial() {
  const id = S.socialEvent?.npc;
  if (!id) return;
  S.socialCooldown[id] = S.day;
  S.socialEvent = null;
  log(`Você decide não atender ao pedido de ${N[id][0]} agora.`, "sys");
  render();
}

function allyTestStat(id) {
  const stat = N[id]?.[5]?.[0];
  return stat == "mh" || ![...ST, "car"].includes(stat) ? "tai" : stat;
}

const MISSION_ROLE_OPTIONS = {
  leader: { label: "Líder", stats: { car: 2, int: 1 } },
  tracker: { label: "Rastreador", stats: { int: 2, vel: 1 } },
  scout: { label: "Reconhecimento", stats: { vel: 2, int: 1 } },
  medic: { label: "Apoio médico", stats: { nin: 2, int: 1 } },
  support: { label: "Apoio", stats: { tai: 1, car: 1 } },
};

function missionRoleOf(id) {
  if (id == "player")
    return MISSION_ROLE_OPTIONS[S.playerRole] || MISSION_ROLE_OPTIONS.leader;
  const role = S.teamRoles?.[id];
  return MISSION_ROLE_OPTIONS[role] || null;
}

function assignMissionRole(id, role) {
  if (!Object.prototype.hasOwnProperty.call(MISSION_ROLE_OPTIONS, role))
    return log("Escolha um papel válido para a missão.", "sys");
  if (id != "player" && !(S.team || []).includes(id))
    return log("Apenas integrantes da equipe podem receber um papel.", "sys");
  if (id == "player") {
    const previousRole = S.playerRole || "leader",
      other = (S.team || []).find((member) => S.teamRoles?.[member] == role);
    S.playerRole = role;
    if (other) S.teamRoles[other] = previousRole;
  } else {
    S.teamRoles = S.teamRoles || {};
    const previousRole = S.teamRoles[id] || "support",
      other =
        role == (S.playerRole || "leader")
          ? "player"
          : (S.team || []).find(
              (member) => member != id && S.teamRoles[member] == role,
            );
    if (other == "player") S.playerRole = previousRole;
    else if (other) S.teamRoles[other] = previousRole;
    S.teamRoles[id] = role;
  }
  log(
    `${id == "player" ? "Você" : N[id][0]} assume o papel de ${MISSION_ROLE_OPTIONS[role].label.toLowerCase()} nas missões.`,
    "sys",
  );
  save();
  render();
}

function missionRoleBonus(stat, mission, team = S.team || []) {
  const assigned = [
    { id: "player", role: missionRoleOf("player") },
    ...team
      .filter((id) => N[id])
      .map((id) => ({ id, role: missionRoleOf(id) })),
  ].filter(
    ({ id, role }) =>
      role?.stats[stat] &&
      (id == "player" || bondOf(id).trust >= 0),
  );
  if (!assigned.length) return 0;
  const title = Array.isArray(mission)
      ? `${mission[1]} ${mission[2]} ${mission[6] || ""}`
      : `${mission?.title || ""} ${mission?.description || ""} ${mission?.goal || ""}`,
    normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    eligible = assigned.filter(({ role }) => {
      if (role == MISSION_ROLE_OPTIONS.medic)
        return /resgat|resgate|proteg|prote[cç][aã]o|ferid|medic|hospital/.test(normalized);
      if (role == MISSION_ROLE_OPTIONS.tracker)
        return /investig|rastro|pista|pergaminho|buscar|recuper|rastrea/.test(normalized);
      if (role == MISSION_ROLE_OPTIONS.scout)
        return /escolt|rota|vigia|patrulh|infiltr|fronteira|reconhec/.test(normalized);
      return true;
    });
  if (!eligible.length) return 0;
  const best = Math.max(
    ...eligible.map(({ id, role }) =>
      Math.min(3, role.stats[stat] + (id != "player" && bondOf(id).trust >= 4 ? 1 : 0)),
    ),
  );
  return Math.min(3, best);
}

function teamBonus(stat) {
  return Math.min(
    4,
    (S.team || []).reduce(
      (total, id) => total + (allyTestStat(id) == stat ? 2 : 0),
      0,
    ),
  );
}

const NPC_SOCIAL_PROFILES = {
  iruka: { charisma: 8, openness: 9, guard: 15 },
  naruto: { charisma: 8, openness: 8, guard: 18 },
  sasuke: { charisma: 4, openness: 2, guard: 34 },
  sakura: { charisma: 7, openness: 6, guard: 21 },
  kakashi: { charisma: 7, openness: 4, guard: 26 },
  tsunade: { charisma: 7, openness: 3, guard: 32 },
  shikamaru: { charisma: 6, openness: 5, guard: 22 },
  hinata: { charisma: 6, openness: 7, guard: 19 },
  teuchi: { charisma: 7, openness: 10, guard: 12 },
  gaara: { charisma: 6, openness: 4, guard: 27 },
  obito: { charisma: 7, openness: 2, guard: 35 },
  danzo: { charisma: 6, openness: 1, guard: 42 },
};

function npcSocialProfile(id) {
  return NPC_SOCIAL_PROFILES[id] || { charisma: 5, openness: 5, guard: 24 };
}

function socialReception(id) {
  const bond = bondOf(id),
    profile = npcSocialProfile(id),
    affinity = S.rel[id] || 0,
    score =
      (S.car - 5) * 1.8 +
      ((S.rep || 0) - 20) * 0.12 +
      (regionalReputation(REG[S.loc]) - 50) * 0.12 +
      affinity * 0.22 +
      bond.trust * 1.5 +
      bond.respect * 0.8 +
      profile.charisma * 0.5;
  return {
    accepted:
      affinity >= 0 && bond.trust >= -1
        ? true
        : score >= profile.guard,
    score,
    profile,
  };
}

function rejectSocialContact(id) {
  const result = socialReception(id);
  if (result.accepted) return false;
  log(
    `<b>${N[id][0]}:</b> “Não quero conversar agora. Sua reputação e a forma como você se aproxima ainda não me dão confiança.” <small>(Carisma ${S.car} · reputação global ${Math.floor(S.rep || 0)} · fama local ${Math.round(regionalReputation(REG[S.loc]))} · abertura ${result.profile.charisma}/10)</small>`,
    "sys",
  );
  return true;
}

function teamInvitationChance(id) {
  const bond = bondOf(id),
    faction = FACTION_BY_NPC[id],
    factionBonus = faction ? (factionStanding(faction) - 50) * 0.12 : 0,
    profile = npcSocialProfile(id);
  return Math.max(
    8,
    Math.min(
      92,
      18 +
        (S.rel[id] || 0) * 0.24 +
        bond.trust * 3 +
        bond.respect * 1.6 +
        bond.sharedMissions * 5 +
        (S.car - 5) * 2.5 +
        (S.rep || 0) * 0.16 +
        (regionalReputation(REG[S.loc]) - 50) * 0.08 +
        factionBonus +
        profile.openness -
        bond.rivalry * 5,
    ),
  );
}

function toggleTeam(id) {
  S.team = S.team || [];
  if (S.team.includes(id)) {
    S.team = S.team.filter((member) => member != id);
    log(`${N[id][0]} saiu da equipe.`, "sys");
  } else return inviteToTeam(id);
  render();
}

function inviteToTeam(id) {
  if (!N[id] || ew().dead[id])
    return log("Essa pessoa não pode entrar na equipe.", "sys");
  S.team = S.team || [];
  if (S.team.includes(id))
    return log(`${N[id][0]} já faz parte da sua equipe.`, "sys");
  if (S.team.length >= 2)
    return log(
      "A equipe já tem dois aliados. Remova alguém antes de escolher outro.",
      "sys",
    );
  if (where(id) != S.loc)
    return log(
      `${N[id][0]} não está por perto. Convites para uma equipe precisam ser feitos pessoalmente.`,
      "sys",
    );
  const bond = bondOf(id),
    cooldown = S.teamInvites?.[id] || 0;
  if (S.day < cooldown)
    return log(
      `${N[id][0]} pediu um tempo antes de considerar outro convite (até o dia ${cooldown}).`,
      "sys",
    );
  if (
    bond.trust < 1 &&
    bond.sharedMissions < 1 &&
    !((S.rep || 0) >= 50 && S.car >= 9)
  )
    return log(
      `${N[id][0]} ainda não viu como você age sob pressão. Ganhe confiança com conversas, treinos ou uma missão em conjunto antes de convidar.`,
      "sys",
    );
  const reception = socialReception(id),
    chance = teamInvitationChance(id);
  if (!reception.accepted || Math.random() * 100 >= chance) {
    S.teamInvites = S.teamInvites || {};
    S.teamInvites[id] = S.day + 3;
    log(
      `<b>${N[id][0]}:</b> “Ainda não posso aceitar. Quero ver como você trata a equipe quando a situação fica difícil.” (chance de aceite: ${Math.round(chance)}%)`,
      "sys",
    );
    return render();
  }
  S.team.push(id);
  S.teamInvites = S.teamInvites || {};
  S.teamInvites[id] = 0;
  remember(id, "equipe", "Aceitou o convite para integrar sua equipe.", {
    affinity: 2,
    trust: 2,
    respect: 1,
  });
  log(
    `🤝 ${N[id][0]} aceitou entrar para sua equipe. A especialidade ${allyTestStat(id).toUpperCase()} ajuda nos testes e a confiança cresce em missões compartilhadas.`,
    "ok",
  );
  render();
}

const rel = (id, v) => {
  S.rel = S.rel || {};
  S.rel[id] = Math.max(-100, Math.min(100, (S.rel[id] || 0) + v));
};

function bondOf(id) {
  S.bonds = S.bonds || {};
  const bond = S.bonds[id] || (S.bonds[id] = {});
  [
    "trust",
    "respect",
    "rivalry",
    "mentorship",
    "sharedMissions",
    "sharedMoments",
    "dates",
  ].forEach((key) => {
    if (!Number.isFinite(bond[key])) bond[key] = 0;
  });
  bond.trust = Math.max(-10, Math.min(15, bond.trust));
  bond.respect = Math.max(0, Math.min(10, bond.respect));
  bond.rivalry = Math.max(0, Math.min(10, bond.rivalry));
  bond.events = Array.isArray(bond.events) ? bond.events : [];
  return bond;
}

function remember(id, type, detail, change = {}) {
  const bond = bondOf(id);
  if (change.affinity) rel(id, change.affinity);
  const bondLimits = {
    trust: [-10, 15],
    respect: [0, 10],
    rivalry: [0, 10],
  };
  Object.entries(bondLimits).forEach(([key, [min, max]]) => {
    if (change[key])
      bond[key] = Math.max(
        min,
        Math.min(max, (bond[key] || 0) + change[key]),
      );
  });
  ["mentorship", "sharedMissions", "sharedMoments", "dates"].forEach((key) => {
    if (change[key]) bond[key] = (bond[key] || 0) + change[key];
  });
  bond.events.push({ day: S.day, type, detail });
  bond.events = bond.events.slice(-5);
  if (
    [
      "promessa",
      "conflito",
      "amizade",
      "equipe",
      "decisão narrativa",
      "apoio na recuperação",
      "história de clã",
    ].includes(type)
  )
    recordJournalEvent(type, `${type[0].toUpperCase()}${type.slice(1)} com ${N[id]?.[0] || id}`, detail, [id]);
  return bond;
}

function teamPairBondKey(first, second) {
  return [first, second].sort().join(":");
}

function teamPairBondOf(first, second) {
  S.teamBonds = S.teamBonds || {};
  const key = teamPairBondKey(first, second),
    bond = S.teamBonds[key] || (S.teamBonds[key] = { trust: 0, missions: 0 });
  if (!Number.isFinite(bond.trust)) bond.trust = 0;
  if (!Number.isFinite(bond.missions)) bond.missions = 0;
  return bond;
}

function recordTeamPairMission(team, success) {
  if (!success || !Array.isArray(team) || team.length < 2) return;
  for (let first = 0; first < team.length; first++) {
    for (let second = first + 1; second < team.length; second++) {
      const bond = teamPairBondOf(team[first], team[second]);
      bond.missions++;
      bond.trust = Math.min(6, bond.trust + 1);
    }
  }
}

function bondLabel(id) {
  const bond = bondOf(id);
  if (S.partner == id && S.rs[id] == "couple" && rom(id))
    return "Relacionamento";
  if ((S.team || []).includes(id)) return "Equipe shinobi";
  if (bond.rivalry >= 2) return "Rivalidade";
  if (bond.mentorship > 0) return "Mestre e aprendiz";
  if (bond.sharedMissions > 0) return "Companheiros de missão";
  if (bond.trust >= 6) return "Amizade próxima";
  if (bond.trust >= 2) return "Amizade";
  return "Conhecidos";
}

function promiseSupport(id) {
  if (!(S.team || []).includes(id))
    return log(
      "Convide essa pessoa para sua equipe antes de prometer que estarão juntos na próxima missão.",
      "sys",
    );
  if (S.promises?.[id]?.status == "pending")
    return log(
      `${N[id][0]} já está esperando que você cumpra uma promessa.`,
      "sys",
    );
  S.promises = S.promises || {};
  S.promises[id] = {
    status: "pending",
    madeDay: S.day,
    dueDay: S.day + 6,
  };
  remember(
    id,
    "promessa",
    "Você prometeu contar com essa pessoa na próxima missão.",
    { trust: 1 },
  );
  log(
    `🤞 Você promete a ${N[id][0]} que estarão juntos na próxima missão. A promessa vale por seis dias.`,
    "ok",
  );
  render();
}

function reconcile(id) {
  const bond = bondOf(id);
  if (bond.rivalry <= 0 && bond.trust >= 0)
    return log(`${N[id][0]} não parece guardar ressentimento agora.`, "sys");
  if (bond.lastReconcileDay == S.day)
    return log(
      `${N[id][0]} precisa de um tempo antes de conversar sobre isso de novo.`,
      "sys",
    );
  bond.lastReconcileDay = S.day;
  remember(
    id,
    "reconciliação",
    "Vocês conversaram sobre o conflito e decidiram tentar de novo.",
    { affinity: 2, trust: 3, respect: 1, rivalry: -1, sharedMoments: 1 },
  );
  bond.rivalry = Math.max(0, bond.rivalry);
  log(
    `🕊️ Você e ${N[id][0]} conversam com honestidade e dão um primeiro passo para fazer as pazes.`,
    "ok",
  );
  tick(1);
  render();
}

function settlePromises(team, mission) {
  (team || []).forEach((id) => {
    const promise = S.promises?.[id];
    if (promise?.status != "pending") return;
    promise.status = "fulfilled";
    const bond = remember(
      id,
      "promessa",
      `Você cumpriu a promessa durante “${mission}”.`,
      { affinity: 4, trust: 3 },
    );
    log(
      bond.trust >= 6 && bond.sharedMissions >= 3
        ? `🤝 ${N[id][0]} sorri: “Eu sabia que podia contar com você. Cumprir essa promessa significa muito depois de tudo que já vivemos.”`
        : `🤝 Você cumpriu sua promessa a ${N[id][0]}. “Você veio quando eu precisei”, diz ${N[id][0]}. A confiança entre vocês aumentou.`,
      "ok",
    );
  });
}

function mentorApprentice() {
  const id = T,
    duty = (S.promotionDuties || []).find(
      (entry) => entry.rank == 3 && entry.type == "mentorship" && entry.status == "pending",
    );
  if (id != "konohamaru" || !duty)
    return log("Você não tem uma orientação de aprendiz pendente agora.", "sys");
  if (S.loc != "academia" || where(id) != S.loc)
    return log("Encontre Konohamaru na Academia Ninja para orientar seu treino.", "sys");
  if (duty.lastMentoringDay == S.day)
    return log("Konohamaru precisa praticar o que aprendeu antes de outra orientação.", "sys");
  duty.lastMentoringDay = S.day;
  duty.mentoringSessions++;
  remember(id, "orientação", "Você revisou com Konohamaru como manter a equipe protegida em campo.", {
    trust: 1,
    respect: 1,
    mentorship: 1,
    sharedMoments: 1,
  });
  log(
    `🎓 Você revisa com Konohamaru como proteger a equipe em campo. Orientações: ${duty.mentoringSessions}/2. ${duty.mentoringSessions >= 2 ? "Agora convide-o para a equipe e mantenha-o seguro numa missão sem contratempos." : "Voltem a treinar em outro dia antes de partir juntos."}`,
    "ok",
  );
  tick(1);
  render();
}

function callApprentice() {
  const duty = (S.promotionDuties || []).find(
    (entry) => entry.rank == 3 && entry.type == "mentorship" && entry.status == "pending",
  );
  if (!duty)
    return log("Você não tem uma orientação de aprendiz pendente agora.", "sys");
  if (ew().dead.konohamaru)
    return log("Konohamaru não pode atender ao chamado.", "sys");
  if (M || B || X || S.activeContract || S.assignment?.status == "active")
    return log("Conclua sua atividade atual antes de chamar Konohamaru.", "sys");

  const world = ew();
  world.apprenticeSummoned = true;
  world.position = world.position || {};
  world.position.konohamaru = "academia";
  if (world.travel) delete world.travel.konohamaru;
  save();
  log(
    "📣 Você chama Konohamaru para a Academia Ninja. Ele ficará disponível para as orientações enquanto sua responsabilidade de aprendiz estiver pendente.",
    "ok",
  );
  render();
}

function expirePromises() {
  Object.entries(S.promises || {}).forEach(([id, promise]) => {
    if (promise.status != "pending" || S.day <= promise.dueDay) return;
    promise.status = "broken";
    remember(id, "promessa", "Você não apareceu para a missão prometida.", {
      affinity: -5,
      trust: -4,
    });
    log(
      `💔 ${N[id][0]} percebeu que você não cumpriu sua promessa. A confiança caiu.`,
      "bad",
    );
  });
}

function clanFocusStat() {
  return {
    uchiha: "nin",
    hyuga: "int",
    senju: "tai",
    uzumaki: "nin",
  }[S.clan];
}

function gainClanRenown(rank) {
  if (!S.clan || S.clan == "none") return;
  const points = { D: 1, C: 2, B: 3, A: 4, S: 5 }[rank] || 1,
    before = S.clanRenown || 0;
  S.clanRenown = before + points;
  const stat = clanFocusStat();
  [10, 30, 60].forEach((threshold) => {
    if (
      before < threshold &&
      S.clanRenown >= threshold &&
      !S.clanMilestones?.[threshold]
    ) {
      S.clanMilestones = S.clanMilestones || {};
      S.clanMilestones[threshold] = true;
      if (stat) addStat(stat, 1);
      log(
        `🏯 Sua contribuição fortalece a linhagem ${CLANS[S.clan].name}. Renome ${threshold}: +1 ${stat?.toUpperCase() || "atributo"} e uma nova responsabilidade familiar.`,
        "ok",
      );
    }
  });
}

function organizationRequirementReason(id) {
  const organization = ORGANIZATIONS[id],
    requirement = organization.requirements,
    reasons = [];
  if (id == "anbu" && S.rogue?.active)
    reasons.push("você precisa ser leal a uma vila para entrar na ANBU");
  if (requirement.renegade && !S.rogue?.active)
    reasons.push("é preciso abandonar sua aldeia e se tornar renegado");
  if (S.loc != organization.location)
    reasons.push(`local: ${L[organization.location][1]}`);
  if (S.rk < requirement.rank)
    reasons.push(`rank ${RK[requirement.rank]} ou superior`);
  if (S.done < requirement.missions)
    reasons.push(`${requirement.missions} missões concluídas`);
  if (
    Number.isFinite(requirement.reputation) &&
    (S.rep || 0) < requirement.reputation
  )
    reasons.push(`reputação ${requirement.reputation}+`);
  if (
    Number.isFinite(requirement.maxReputation) &&
    (S.rep || 0) > requirement.maxReputation
  )
    reasons.push(`reputação até ${requirement.maxReputation}`);
  if (id == "anbu" && factionStanding("konoha") < 35)
    reasons.push("confiança política de Konoha 35+");
  if (id == "akatsuki" && factionStanding("akatsuki") < 25)
    reasons.push("influência da Akatsuki 25+");
  if (S.car < requirement.charisma)
    reasons.push(`carisma ${requirement.charisma}+`);
  return reasons.length ? `Requisitos pendentes: ${reasons.join(" · ")}.` : "";
}

function becomeRenegade() {
  if (S.rogue?.active) return log("Você já é um ninja renegado.", "sys");
  if (S.loc != "portao")
    return log("Vá ao Portão de Konoha para abandonar a aldeia.", "sys");
  if (S.rk < 1 || academyStudent())
    return log("Você precisa se formar na Academia antes de abandonar Konoha.", "sys");
  if (S.activeContract || S.assignment || M || B)
    return log("Conclua suas missões e compromissos antes de desertar.", "sys");
  if (!confirm("Desertar de Konoha é uma escolha grave. Você perderá a confiança da vila e passará a ser procurado. Deseja continuar?"))
    return;

  const member = S.organizations?.[0],
    record = [...(S.organizationHistory || [])]
      .reverse()
      .find((entry) => entry.id == member && entry.leftDay === null);
  if (record) record.leftDay = S.day;
  S.organizations = [];
  S.organizationApplication = null;
  S.urgent = null;
  S.rogue = {
    active: true,
    sinceDay: S.day,
    home: "konoha",
    wantedLevel: 1,
    lastHuntDay: 0,
    missionsDone: 0,
    pathOrganizationInterest: false,
  };
  S.rep = 0;
  changeFactionStanding("konoha", -25, "Deserção de Konoha");
  changeFactionStanding("akatsuki", 8, "Aproximação dos renegados");
  log(
    "🚨 <b>Você desertou de Konoha.</b> A vila rompeu seu vínculo, sua reputação foi zerada e caçadores de recompensa agora podem emboscar você. A Akatsuki aceita renegados em seu esconderijo.",
    "bad",
  );
  save();
  render();
}

function startOrganizationApplication(id) {
  const organization = ORGANIZATIONS[id];
  if (!organization) return log("Essa organização não existe.", "sys");
  if ((S.organizations || []).includes(id))
    return log(`Você já pertence à ${organization.name}.`, "sys");
  if ((S.organizations || []).length)
    return log(
      `Você já tem um vínculo com ${ORGANIZATIONS[S.organizations[0]].name}. Encerre-o antes de buscar outro.`,
      "sys",
    );
  const reason = organizationRequirementReason(id);
  if (reason) return log(`🔒 ${reason}`, "sys");
  const application = S.organizationApplication;
  if (application?.id == id && !application.failed) {
    mode = "org";
    render();
    return;
  }
  if (application?.id == id && application.cooldownUntil > S.day)
    return log(
      `A organização pediu que você espere até o dia ${application.cooldownUntil} antes de tentar novamente.`,
      "sys",
    );
  if (application && application.id != id && !application.failed)
    return log(
      `Conclua ou abandone primeiro o processo de seleção da ${ORGANIZATIONS[application.id].name}.`,
      "sys",
    );
  S.organizationApplication = {
    id,
    step: 0,
    successes: 0,
    startedDay: S.day,
    failed: false,
    cooldownUntil: 0,
  };
  mode = "org";
  log(
    `📨 Você se apresenta à ${organization.name}. A seleção envolve três decisões; nenhuma reputação garante aprovação.`,
    "bt",
  );
  render();
}

function cancelOrganizationApplication() {
  if (S.organizationApplication?.failed)
    return log("Não há uma seleção ativa para abandonar.", "sys");
  S.organizationApplication = null;
  log("Você encerrou o processo seletivo sem entrar na organização.", "sys");
  save();
  render();
}

function resolveOrganizationTrial(choiceIndex) {
  const application = S.organizationApplication,
    organization = ORGANIZATIONS[application?.id],
    stage = organization?.tests[application?.step],
    choice = stage?.[1][choiceIndex];
  if (!application || !organization || !choice)
    return log("Essa etapa da seleção não está mais disponível.", "sys");
  const stat = choice[1],
    roll = R(1, 20),
    rankBonus = Math.min(3, Math.floor(S.rk || 0)),
    difficulty = 14 + application.step * 2,
    total = roll + (S[stat] || 0) + rankBonus;
  log(
    `🎭 ${choice[0]}: ${roll} + ${stat.toUpperCase()} ${S[stat] || 0} + experiência ${rankBonus} = ${total} (precisa de ${difficulty}).`,
    "sys",
  );
  if (total >= difficulty) {
    application.successes++;
    log("A banca reconhece sua decisão e registra um acerto.", "ok");
  } else log("A decisão não convence completamente a banca.", "bad");
  application.step++;
  if (application.step >= organization.tests.length) {
    if (application.successes >= 2) {
      S.organizations = [application.id];
      S.organizationHistory = Array.isArray(S.organizationHistory)
        ? S.organizationHistory
        : [];
      S.organizationHistory.push({
        id: application.id,
        joinedDay: S.day,
        leftDay: null,
      });
      if (application.id == "anbu") {
        changeFactionStanding("konoha", 10, "Ingresso na ANBU");
      } else if (application.id == "akatsuki") {
        changeFactionStanding("akatsuki", 14, "Ingresso na Akatsuki");
        changeFactionStanding("konoha", -10, "Aliança com a Akatsuki");
      }
      S.organizationApplication = null;
      log(
        `✅ <b>Você foi aceito(a) na ${organization.name}.</b> ${organization.perk} Sua filiação ficará registrada no seu histórico.`,
        "ok",
      );
    } else {
      application.failed = true;
      application.step = 0;
      application.successes = 0;
      application.cooldownUntil = S.day + 5;
      log(
        `A ${organization.name} encerra a seleção sem uma oferta. Você poderá se candidatar novamente após o dia ${application.cooldownUntil}.`,
        "sys",
      );
    }
  }
  save();
  render();
}

function leaveOrganization() {
  const id = S.organizations?.[0];
  if (!id) return log("Você não pertence a uma organização.", "sys");
  const record = [...(S.organizationHistory || [])]
    .reverse()
    .find((entry) => entry.id == id && entry.leftDay === null);
  if (record) record.leftDay = S.day;
  S.organizations = [];
  log(
    `Você encerrou seu vínculo com a ${ORGANIZATIONS[id].name}. Os feitos e as consequências dessa passagem continuam no histórico.`,
    "sys",
  );
  save();
  render();
}

const npc = (id) => {
  if (!N[id] || ew().dead[id])
    return log("Essa pessoa não está mais disponível para interagir.", "sys");
  if (factionContactBlocked(id)) return;
  T = id;
  mode = "npc";
  if (!S.rel[id]) S.rel[id] = 0;
  render();
};

const NPC_FAVORITE_GIFTS = {
  naruto: "dango",
  choji: "dango",
  ino: "flor",
  sakura: "flor",
  hinata: "flor",
  shizune: "flor",
  kurenai: "flor",
  sasuke: "livro",
  kakashi: "livro",
  gaara: "livro",
  sai: "livro",
  shikamaru: "cha",
  tsunade: "cha",
  temari: "cha",
  anko: "dango",
};

const NPC_GIFT_REPLIES = {
  naruto: {
    favorite: ["Dango! Valeu! Vou guardar espaço para uma tigela de ramen também.", "Você lembrou do que eu gosto? Isso sim é amizade!"],
    other: ["Valeu! Não é ramen, mas um presente continua sendo um presente.", "Hehe, obrigado. Vou dividir isso com o pessoal depois do treino."],
  },
  choji: {
    favorite: ["Dango para depois do almoço? Você entende de prioridades.", "Obrigado! Comida compartilhada fica ainda melhor."],
    other: ["Obrigado por lembrar de mim. Vou guardar para depois do treino.", "Que gentileza! Isso vai ficar ótimo com uma refeição."],
  },
  ino: {
    favorite: ["Flores lindas! Você escolheu pensando em mim, né?", "Adorei. Vou colocar essas flores onde todos possam ver."],
    other: ["Obrigada! Não era o que eu esperava, mas gostei do gesto.", "Que atencioso. Vou encontrar um bom lugar para isso."],
  },
  hinata: {
    favorite: ["A-ah, flores… muito obrigada. Vou cuidar delas com carinho.", "Você escolheu algo tão bonito. Fico feliz que tenha pensado em mim."],
    other: ["Obrigada… não precisava, mas vou guardar com cuidado.", "É muito gentil da sua parte. Gostei de verdade."],
  },
  sakura: {
    favorite: ["Flores! Que gesto bonito. Vou colocá-las no hospital para alegrar o ambiente.", "Você escolheu muito bem. Obrigada por pensar em mim."],
    other: ["Obrigada! Não é preciso gastar para mostrar que se importa, sabia?", "Gostei do presente. Mas da próxima vez, não deixe de cuidar de você também."],
  },
  sasuke: {
    favorite: ["Um livro? Pelo menos você escolheu algo útil. Obrigado.", "Vou dar uma olhada quando tiver tempo. Foi uma boa escolha."],
    other: ["Não precisava. …Obrigado.", "Vou aceitar. Não espere que eu faça uma grande cerimônia por causa disso."],
  },
  kakashi: {
    favorite: ["Um livro. Finalmente alguém que entende um presente prático.", "Hm, parece interessante. Vou ler quando terminar o que estou lendo agora."],
    other: ["Obrigado. Vou guardar — depois que terminar este capítulo.", "Que gentil. Não precisava, mas agradeço."],
  },
  shikamaru: {
    favorite: ["Chá. Uma escolha eficiente; combina com uma tarde sem reuniões.", "Obrigado. Isso pode tornar a próxima sessão de estratégia menos problemática."],
    other: ["Obrigado. Só não precisava fazer tanto esforço.", "Vou guardar. É bom receber algo sem precisar montar um plano em troca."],
  },
  tsunade: {
    favorite: ["Chá de qualidade. Você tem bom gosto — não conte isso para os apostadores.", "Finalmente um presente que não é mais papelada. Obrigada."],
    other: ["Obrigada. Mas não pense que vai me convencer com presentes a ignorar um relatório atrasado.", "É um bom gesto. Agora volte ao trabalho antes que eu mude de ideia."],
  },
  anko: {
    favorite: ["Dango! Você sabe como conquistar minha atenção.", "Aí sim. Agora está falando a minha língua."],
    other: ["Valeu. Vou aceitar, mas ainda prefiro dango.", "Que gentil. Da próxima vez, escolha algo que dê para comer no caminho."],
  },
};

const NPC_ACTION_DIALOGUE = {
  naruto: {
    train: ["Vamos! Só não vale parar antes de eu ficar cansado!", "Bora treinar! Se eu cair, levanto e tento de novo — dattebayo!"],
    duel: ["Hehe, aceito! Mas depois a gente comemora com ramen.", "Quero ver o que você aprendeu. Vamos dar o nosso melhor!"],
    duelWin: ["Boa luta! Da próxima vez eu vou estar ainda mais preparado.", "Você ficou mais forte. Isso me deixa animado para o próximo treino!"],
    duelLoss: ["Ei, você lutou bem. Não precisa ficar se cobrando; vamos treinar de novo quando estiver pronto.", "Foi por pouco! Descansa e depois tentamos outra vez."],
  },
  sasuke: {
    train: ["Vamos corrigir seus movimentos antes de aumentar a intensidade.", "Se vai treinar comigo, mantenha o foco. Repetir o erro não ajuda."],
    duel: ["Não vou pegar leve. Mostre o que consegue fazer.", "Certo. Sem distrações — vamos ver quem lê melhor os movimentos do outro."],
    duelWin: ["Você aproveitou a abertura. Continue treinando.", "Não foi ruim. Da próxima vez, não conte com o mesmo erro."],
    duelLoss: ["Você perdeu a concentração no fim. Corrija isso e tente outra vez.", "Não se machucou à toa. Aprenda com o que aconteceu."],
  },
  sakura: {
    train: ["Vamos focar na precisão. Se sentir dor, paramos.", "Quero ver controle de chakra, não alguém tentando provar que aguenta tudo."],
    duel: ["Tudo bem, mas é um treino. Se alguém se machucar, paramos na hora.", "Vamos testar a técnica sem transformar isso numa briga de verdade."],
    duelWin: ["Boa luta. Agora me deixa conferir se você não se machucou.", "Você leu bem meus movimentos. Só não deixe a vitória subir à cabeça."],
    duelLoss: ["Não tem vergonha em perder. Vamos entender o que aconteceu e cuidar desses ferimentos.", "Você se esforçou. Primeiro descansa; depois a gente revê sua estratégia."],
  },
  lee: {
    train: ["A juventude floresce com disciplina! Vamos aquecer antes de começar!", "Treino intenso, mas seguro! Não quero que ninguém se machuque."],
    duel: ["Aceito com entusiasmo! Vamos lutar com todo o nosso espírito!", "Prepare-se! A chama da juventude vai decidir este duelo!"],
    duelWin: ["Magnífico! Sua dedicação está dando frutos!", "Uma derrota também pode alimentar a chama da juventude!"],
    duelLoss: ["Você lutou com coragem! Vamos analisar cada movimento e melhorar!", "Não desanime! Descanse hoje e amanhã treinaremos com ainda mais sabedoria!"],
  },
  hinata: {
    train: ["P-podemos começar devagar. Quero acertar a postura antes de acelerar.", "Obrigada por treinar comigo. Vou me esforçar para acompanhar."],
    duel: ["Tudo bem… vou tentar dar o meu melhor, mas vamos parar se alguém se ferir.", "Aceito. Quero testar o que aprendi, sem deixar o nervosismo decidir por mim."],
    duelWin: ["Você foi muito bem… obrigada por lutar com cuidado.", "Acho que aprendi bastante. Parabéns pela vitória."],
    duelLoss: ["Você se esforçou muito. Não deixe uma derrota apagar todo o seu progresso.", "Está tudo bem. Podemos treinar juntos de novo quando você estiver pronto."],
  },
  shikamaru: {
    train: ["Vamos fazer uma série curta e revisar a postura. Treinar sem plano é problemático.", "Aquecimento primeiro. Não quero perder o resto do dia tratando uma lesão evitável."],
    duel: ["Certo. Vamos usar o campo e parar antes que isso vire uma missão de resgate.", "Aceito. Se você repetir o mesmo movimento, vou aproveitar — aviso dado."],
    duelWin: ["Você mudou de estratégia no meio da luta. Foi a escolha certa.", "Bem pensado. Eu devia ter previsto esse movimento."],
    duelLoss: ["Você tinha uma abertura, mas não percebeu. Isso é corrigível.", "Não precisa se culpar. Vamos revisar o que funcionou e o que não funcionou."],
  },
  kakashi: {
    train: ["Primeiro, mostre como você se prepara. A técnica começa antes do primeiro golpe.", "Vamos manter o treino seguro. Não quero preencher um relatório de acidente."],
    duel: ["Aceito. Só não espere que eu explique cada movimento antes de usar.", "Um duelo amistoso? Certo. Vou tentar chegar antes de você terminar o aquecimento."],
    duelWin: ["Boa leitura. Você observou antes de atacar — continue assim.", "Você venceu porque protegeu sua abertura. Lembre-se disso na próxima missão."],
    duelLoss: ["Você esqueceu de observar o campo. Uma pausa pode ensinar mais que outro golpe.", "Não se preocupe com o resultado. O importante é voltar com algo para melhorar."],
  },
  gaara: {
    train: ["Vamos treinar controle e defesa. A força não precisa causar dano para ser útil.", "Escolha o ritmo que consegue sustentar. Um aliado ferido não ajuda a equipe."],
    duel: ["Aceito, desde que ambos mantenham o controle. O objetivo é aprender.", "Vamos testar nossas habilidades sem esquecer que somos aliados."],
    duelWin: ["Você manteve a calma e escolheu o momento certo.", "Sua vitória não diminui o que aprendi observando você."],
    duelLoss: ["Você não precisa provar seu valor vencendo. O que aprendeu também importa.", "Vamos cuidar dos ferimentos e conversar sobre a luta depois."],
  },
  temari: {
    train: ["Ajuste sua distância. Força desperdiçada não serve para nada.", "Vamos treinar com propósito. Não vou passar a tarde repetindo movimento errado."],
    duel: ["Aceito. Tente não confundir confiança com descuido.", "Vamos ver se você consegue acompanhar meu ritmo."],
    duelWin: ["Você aproveitou o terreno. Pelo menos estava prestando atenção.", "Boa leitura. Não espere que eu elogie de novo tão cedo."],
    duelLoss: ["Você avançou sem considerar a distância. Corrija isso antes de pedir revanche.", "Não foi uma luta ruim; seu erro foi previsível. Mude a abordagem."],
  },
  sai: {
    train: ["Podemos praticar movimentos básicos e observar o que cada um faz diferente.", "Quero melhorar também. Se notar algo estranho na minha postura, pode dizer."],
    duel: ["Aceito. Vou tentar não interpretar o duelo como uma discussão pessoal.", "Vamos lutar com clareza. Se algum de nós quiser parar, diga."],
    duelWin: ["Você venceu. Gostaria de desenhar a sequência para entender o que aconteceu.", "Parabéns. Acho que consegui aprender algo observando sua estratégia."],
    duelLoss: ["Você perdeu o duelo, mas isso não define o seu valor para a equipe.", "Podemos rever os movimentos juntos. Não precisa fingir que não ficou frustrado."],
  },
};

function npcInteractionLine(id, action, fallback) {
  return chatPick(
    id,
    `interacao:${action}`,
    NPC_ACTION_DIALOGUE[id]?.[action] || fallback,
  );
}

const AC = {
  talk: (id, n) => {
    const lines = [...n[3]];
    if (S.urgent?.npc == id)
      lines.push(
        `“${S.urgent.title} está preocupando todo mundo. Você vai ajudar?”`,
      );
    const reply = `${chatPick(id, "bate-papo", lines)} ${relationshipConversation(id, "bate-papo")}`;
    const alreadyTalkedThisPeriod = used("talk" + id);
    if (!alreadyTalkedThisPeriod) {
      remember(id, "conversa", reply, {
        affinity: 2,
        trust: 1,
        sharedMoments: 1,
      });
      gain(2);
      if (Math.random() < 0.15) addStat("car", 1);
      recordJournalEvent(
        "conversa",
        `Conversa com ${n[0]}`,
        reply,
        [id],
        "Um momento entre missões.",
      );
    }
    log(`<b>${n[0]}:</b> ${reply}`);
    reactToWorldEvent(id, n);
    if (Math.random() < 0.4) {
      if (S.rep >= 60)
        log(`<b>${n[0]}:</b> “Todos em Konoha falam dos seus feitos.”`);
      else if (S.rep >= 25)
        log(`<b>${n[0]}:</b> “Ouvi dizer que você tem ajudado a vila.”`);
      else if (S.done >= 3)
        log(
          `<b>${n[0]}:</b> “Ainda estão de olho em você, mas está no caminho.”`,
        );
    }
    if (!alreadyTalkedThisPeriod) tick(1);
  },
  gift: (id, n, g) => {
    const [gn, baseCost] = G[g],
      c = marketPrice(baseCost);
    if (S.ryo < c) return (log("Ryō insuficiente.", "sys"), 1);
    S.ryo -= c;
    const fav = (NPC_FAVORITE_GIFTS[id] || RM[id]?.[0] || "dango") == g;
    remember(id, "presente", `Você deu ${gn}.`, {
      affinity: fav ? 10 : 4,
      trust: fav ? 3 : 1,
    });
    if (rom(id)) love(id, fav ? 3 : 1);
    const reactions = NPC_GIFT_REPLIES[id]?.[fav ? "favorite" : "other"];
    log(
      `🎁 <b>${n[0]}:</b> “${reactions ? chatPick(id, `presente:${fav ? "favorito" : "outro"}`, reactions) : fav ? `Adorei ${gn}! Você se lembrou do que eu gosto, ${esc(S.n)}.` : `Obrigado(a) pelo presente, ${esc(S.n)}.`}”`,
    );
    if (c < baseCost)
      log(`🤝 Sua reputação reduziu o preço em ${baseCost - c} ryō.`, "ok");
  },
  train: (id, n) => {
    if ((S.fatigue || 0) >= 70)
      return (
        log("Você está exausto. Descanse antes de treinar com alguém.", "sys"),
        1
      );
    if (S.ck < 5) return (log("Chakra insuficiente.", "sys"), 1);
    S.ck -= 5;
    S.fatigue = Math.min(100, (S.fatigue || 0) + 20);
    remember(id, "treino", "Vocês treinaram juntos.", {
      affinity: 3,
      trust: 2,
      respect: 1,
      sharedMoments: 1,
    });
    gain(6);
    S.practice = S.practice || {};
    S.practice.tai = (S.practice.tai || 0) + 1;
    if (S.practice.tai >= 3) {
      const ganho = addStat("tai", 1);
      if (ganho > 0) log("O treino em dupla melhora Tai em 1 ponto.", "ok");
      S.practice.tai -= 3;
    }
    const k = P(S.jt);
    S.ms[k] = (S.ms[k] || 0) + 2;
    log(
      `🥋 <b>${n[0]}:</b> “${npcInteractionLine(id, "train", ["Vamos continuar praticando juntos. O importante é aprender sem se machucar."])}”`,
    );
    tick(1);
  },
  duel: (id, n) => {
    S.duels = S.duels || {};
    const duelToday = S.duels[id];
    if (duelToday && duelToday.day === S.day)
      return (
        log(
          `<b>${n[0]}:</b> “Já treinamos o bastante hoje. Vamos continuar amanhã.”`,
          "sys",
        ),
        1
      );
    const repeat =
      duelToday && duelToday.day !== S.day
        ? 0
        : (duelToday?.wins || 0) + (duelToday?.losses || 0);
    const cost = Math.max(6, 14 - repeat);
    if ((S.fatigue || 0) >= 85)
      return (
        log(
          "Você está muito cansado para duelar agora. Descanse um pouco.",
          "sys",
        ),
        1
      );
    if (S.ck < cost)
      return (log("Chakra insuficiente para um duelo amistoso.", "sys"), 1);
    S.ck = Math.max(0, S.ck - cost);
    S.fatigue = Math.min(100, (S.fatigue || 0) + 12);
    S.duels[id] = {
      day: S.day,
      wins: duelToday && duelToday.day !== S.day ? 0 : duelToday?.wins || 0,
      losses: duelToday && duelToday.day !== S.day ? 0 : duelToday?.losses || 0,
    };
    remember(id, "duelo", "Vocês aceitaram um duelo amistoso.", {
      sharedMoments: 1,
    });
    log(
      `⚔️ <b>${n[0]}:</b> “${npcInteractionLine(id, "duel", ["Aceito o desafio. Vamos manter o duelo amistoso e aprender com a luta."])}” (−${cost} chakra · +12% fadiga)`,
    );
    tick(1);
    fight([n[0], n[4][0], n[4][1], n[4][2]], {
      sp: 1,
      duelId: id,
      duelRepeat: repeat,
      win: () => {
        const repeatCount =
          (S.duels[id]?.wins || 0) + (S.duels[id]?.losses || 0);
        const xp = Math.max(2, 8 - repeatCount * 2);
        const aff = Math.max(1, 4 - repeatCount);
        const respect = Math.max(1, 2 - repeatCount);
        S.duels[id].wins = (S.duels[id].wins || 0) + 1;
        remember(id, "duelo", "Você venceu o duelo amistoso.", {
          affinity: aff,
          respect,
        });
        gain(xp);
        log(
          `🤝 <b>${n[0]}:</b> “${npcInteractionLine(id, "duelWin", ["Boa luta. Você conquistou essa vitória."])}” (+${xp} XP)`,
          "ok",
        );
      },
      loss: () =>
        log(
          `<b>${n[0]}:</b> “${npcInteractionLine(id, "duelLoss", ["Foi uma boa luta. Descanse e pense no que pode fazer diferente da próxima vez."])}”`,
        ),
    });
    return 1;
  },
  adv: (id, n) => {
    if ((S.rel[id] || 0) < 35)
      return (
        log(
          `<b>${n[0]}:</b> “Ainda não nos conhecemos bem o bastante…” (precisa de afinidade 35)`,
        ),
        1
      );
    if (S.got[id])
      return (log(`<b>${n[0]}:</b> “Já lhe disse tudo o que sei.”`), 1);
    S.got[id] = 1;
    remember(id, "mentoria", "Você pediu e recebeu um conselho importante.", {
      trust: 2,
      mentorship: 1,
    });
    const s = n[5][0];
    if (s == "mh") {
      S.mh += 10;
      S.hp += 10;
    } else addStat(s, 2);
    gain(20);
    log(
      `✨ ${n[5][1]} <b>(+${s == "mh" ? "10 HP" : "2 " + s.toUpperCase()})</b>`,
      "ok",
    );
  },
  bully: (id, n) => {
    remember(id, "conflito", "Você provocou este personagem.", {
      affinity: -8,
      trust: -2,
      rivalry: 1,
    });
    if (S.rs[id]) love(id, -10);
    log(`😈 Você provoca ${n[0]}. <b>“Está pedindo para apanhar?”</b>`, "bad");
    if (Math.random() < 0.5) {
      fight([n[0], n[4][0], n[4][1], n[4][2]], { sp: 1 });
      return 1;
    }
  },
};

function dn(a, x) {
  if (!N[T] || ew().dead[T]) {
    mode = "map";
    return log("Essa pessoa não está mais disponível para interagir.", "sys");
  }
  if (factionContactBlocked(T)) return;
  if (["talk", "train", "duel", "adv"].includes(a) && rejectSocialContact(T))
    return render();
  if (!AC[a](T, N[T], x)) render();
}

function shinobiCodeReply(id, text) {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (!/\b(missao|equipe|aliado|ordem|civil|morador)\b/.test(normalized))
    return "";
  const code = S.shinobiCode || {};
  if (id == "tsunade" && (code.duty || 0) >= 3)
    return " Tenho notado que você respeita os deveres da patente e não foge dos relatórios.";
  if ((S.team || []).includes(id) && (code.squad || 0) >= 3)
    return " Gosto de ver que você costuma ouvir o esquadrão antes de decidir.";
  if ((id == "iruka" || id == "tsunade") && (code.civilians || 0) >= 3)
    return " Suas últimas escolhas mostram que você não trata os moradores como dano colateral.";
  if (id == "tsunade" && (code.results || 0) >= 3)
    return " Você costuma buscar resultados rápidos; quero ter certeza de que entende os riscos para a equipe.";
  return "";
}

function say(prompt) {
  if (!N[T] || ew().dead[T]) {
    mode = "map";
    return log("Essa pessoa não está mais disponível para conversar.", "sys");
  }
  if (factionContactBlocked(T)) return;
  const t = (prompt || $("#fr").value || "").trim();
  if (!t) return;
  if (rejectSocialContact(T)) return render();
  const n = N[T],
    l = t.toLowerCase();
  const horario = `Dia ${S.day} · ${TM[S.t]}`;
  log(
    `<span class="chat-avatar chat-avatar-player" aria-hidden="true">忍</span><span class="chat-line"><span class="chat-speaker">Você</span><span class="chat-text">${esc(t)}</span><span class="chat-time">${horario}</span></span>`,
    "chat-message chat-player",
  );
  if (SEXY.test(l)) {
    rel(T, -4);
    log(
      `<span class="chat-avatar" aria-hidden="true">${n[1]}</span><span class="chat-line"><span class="chat-speaker">${esc(n[0])}</span><span class="chat-text">${P(["“Opa, mais respeito!”", "“Esse não é jeito de falar comigo.”"])}</span><span class="chat-time">${horario}</span></span>`,
      "chat-message chat-npc bad",
    );
    return render();
  }
  if (ROM.test(l)) {
    if (S.partner == T && S.rs?.[T] == "couple") {
      log(
        `<span class="chat-avatar" aria-hidden="true">${n[1]}</span><span class="chat-line"><span class="chat-speaker">${esc(n[0])}</span><span class="chat-text">${romanceLine(T, "partner", ["Fico feliz que tenha me contado. Gosto do que estamos construindo, sem pressa."])}</span><span class="chat-time">${horario}</span></span>`,
        "chat-message chat-npc",
      );
      return render();
    }
    if (rom(T) && !S.partner && (bondOf(T).romanceCooldownUntil || 0) <= S.day)
      return flirt();
    const response = S.partner && S.partner != T
      ? `“${N[S.partner][0]} é seu parceiro. Não quero começar algo enquanto vocês ainda estiverem juntos.”`
      : (bondOf(T).romanceCooldownUntil || 0) > S.day
        ? "“Ainda preciso de um tempo depois do que aconteceu entre nós.”"
        : !rom(T)
          ? "“Gosto de você como pessoa, mas não quero transformar isso em romance.”"
          : romanceLine(T, "reject", [RM[T][2]]);
    log(
      `<span class="chat-avatar" aria-hidden="true">${n[1]}</span><span class="chat-line"><span class="chat-speaker">${esc(n[0])}</span><span class="chat-text">${response}</span><span class="chat-time">${horario}</span></span>`,
      "chat-message chat-npc",
    );
    return render();
  }
  const o = Object.keys(N).find(
    (k) => k != T && l.includes(N[k][0].split(" ")[0].toLowerCase()),
  );
  let r = o
    ? `“${N[o][0]}? ${P(["É um bom shinobi.", "Cuidado com ele(a).", "Somos mais próximos do que parece.", "Não tenho muito a dizer."])}”`
    : chatReply(T, l);
  if (/idiota|feio|fraco|burro/.test(l)) {
    remember(T, "conflito", `Você disse algo ofensivo: ${t.slice(0, 60)}.`, {
      affinity: -5,
      trust: -2,
      rivalry: 1,
    });
    r = "“Como é que é?!” — " + n[0] + " fecha a cara.";
  } else {
    if (!used("say" + T))
      remember(T, "conversa", `Vocês conversaram sobre ${t.slice(0, 60)}.`, {
        affinity: 1,
        trust: 1,
      });
    if ((S.rel[T] || 0) >= 20)
      r +=
        " " +
        P([
          "Fico feliz que tenha perguntado.",
          "Gosto de poder conversar com você.",
          "Pode contar comigo.",
        ]);
  }
  const consequenceReply = worldReply(T, l);
  if (consequenceReply) r += " " + consequenceReply;
  const codeReply = shinobiCodeReply(T, l);
  if (codeReply) r += codeReply;
  const localFame = regionalReputation(REG[S.loc]);
  if (localFame < 20)
    r += " “Ainda não sei se posso confiar em você por aqui.”";
  else if (localFame >= 80)
    r += " “Sua boa fama já chegou até esta região.”";
  log(
    `<span class="chat-avatar" aria-hidden="true">${n[1]}</span><span class="chat-line"><span class="chat-speaker">${esc(n[0])}</span><span class="chat-text">${r}</span><span class="chat-time">${horario}</span></span>`,
    "chat-message chat-npc",
  );
  reactToWorldEvent(T, n);
  render();
}

function chatPick(id, topic, replies) {
  S.chat = S.chat || {};
  const key = id + ":" + topic,
    last = S.chat[key],
    recent = Array.isArray(last) ? last : last ? [last] : [],
    pool = replies.filter((reply) => !recent.includes(reply)),
    fallback = replies.filter((reply) => reply != recent.at(-1)),
    reply = P(pool.length ? pool : fallback.length ? fallback : replies);
  S.chat[key] = [...recent, reply].slice(-2);
  return reply;
}

const NPC_BOND_DIALOGUE = {
  iruka: {
    beginning: ["Não precisa ter tudo resolvido agora. Aprender também é poder perguntar.", "Se quiser conversar, estou ouvindo — sem prova no fim."],
    trust: ["É bom ver você escolhendo seu próprio caminho. Posso ajudar, mas a decisão é sua.", "Você não precisa provar seu valor o tempo todo para merecer apoio."],
    team: ["Depois de tantas missões, fico feliz em saber que voltamos para conversar também.", "Ensinar e aprender funciona nos dois sentidos. Tenho orgulho do que construímos."],
    conflict: ["Não quero fingir que nada aconteceu. Se puder, me conte o que estava passando pela sua cabeça."],
    partner: ["Gosto dos momentos em que não preciso ser seu instrutor — só o Iruka, ao seu lado.", "Depois de um dia cheio, uma conversa tranquila com você já ajuda bastante."],
  },
  naruto: {
    beginning: ["Hehe, ainda não sei muito sobre você. Que tal começar com um ramen?", "Você parece legal! Aposto que a gente vai se entender melhor depois de uma missão."],
    trust: ["Quando você diz que vai estar lá, eu acredito. Sei o quanto isso importa.", "Não precisa carregar tudo sozinho. Eu também posso contar com você, né?"],
    team: ["A gente já passou por bastante coisa junto. E ainda tem muito ramen para comemorar!", "Depois de tudo que enfrentamos, você já é parte do meu time — dattebayo!"],
    conflict: ["Fiquei chateado, mas não vou desistir de você. Vamos conversar de verdade?", "Não dá para resolver tudo com um sorriso. Me explica o que aconteceu."],
    partner: ["Posso falar sério por um minuto? Fico feliz quando você está por perto.", "Guardei um lugar para você no Ichiraku. Não é uma grande declaração, mas é importante para mim!"],
  },
  sasuke: {
    beginning: ["Não confunda estar no mesmo lugar com sermos amigos. Ainda estou observando.", "Se veio falar comigo, diga o que realmente quer."],
    trust: ["Não costumo dizer isso, mas sei que você não abandona a equipe.", "Você provou que é confiável. Não espere que eu repita isso toda hora."],
    team: ["Em campo, sei como você reage. Isso vale mais do que conversa fiada.", "Trabalhamos bem juntos. Não estrague isso tentando transformar tudo em competição."],
    conflict: ["Não vou esquecer o que aconteceu. Se quer consertar, mostre com atitudes.", "Falar é fácil. Quero ver o que você faz daqui para a frente."],
    partner: ["Não sou bom com esse tipo de conversa. Só… prefiro quando você está por perto.", "Não vou fazer promessas vazias. Se estou aqui, é porque escolhi ficar."],
  },
  sakura: {
    beginning: ["Podemos começar sem pressa. Nem toda conversa precisa virar uma competição.", "Se veio pedir conselho, eu escuto — mas também vou dizer quando você precisa descansar."],
    trust: ["Confio em você, mas não vou fingir que está tudo bem se você estiver se machucando.", "Gosto de poder falar com sinceridade, mesmo quando não concordamos."],
    team: ["Depois de tantas missões, aprendi que posso contar com você — e você pode contar comigo.", "A equipe funciona melhor quando ninguém precisa esconder que está cansado."],
    conflict: ["Fiquei magoada com aquilo. Quero entender seu lado, mas preciso que você também escute o meu.", "Desculpas ajudam, mas o que vai me convencer é ver você agir diferente."],
    partner: ["Com você, não preciso transformar cada momento em treino ou missão.", "Quero que a gente possa falar sobre as coisas difíceis, não só sobre as boas."],
  },
  kakashi: {
    beginning: ["Hm. Se veio conversar, prometo tentar não me atrasar para a próxima parte.", "É bom conhecer alguém antes de confiar a vida a essa pessoa numa missão."],
    trust: ["Você aprendeu a olhar pelos outros. Espero que também esteja aprendendo a olhar por si.", "Não preciso perguntar se posso contar com você. Suas ações já responderam."],
    team: ["Nossa equipe já sobreviveu a algumas situações complicadas. Vamos tentar evitar repetir as piores.", "Um bom time consegue ficar em silêncio sem deixar de se entender."],
    conflict: ["Já vi orgulho custar caro para uma equipe. Que tal começarmos admitindo o que cada um fez?", "Não vou passar uma borracha no ocorrido, mas posso ouvir o que você tem a dizer."],
    partner: ["Terminei de ler por hoje. Achei que você merecia minha atenção inteira.", "Nem toda pausa precisa ser preenchida. Às vezes, ficar ao seu lado basta."],
  },
  hinata: {
    beginning: ["A-ah, obrigada por vir conversar comigo. Às vezes eu demoro um pouco para responder.", "Eu fico nervosa, mas gosto quando alguém realmente escuta."],
    trust: ["Quando você acredita em mim, encontro coragem para tentar mais uma vez.", "Não preciso ser a pessoa mais forte da sala para estar aqui com você."],
    team: ["Nas missões, você me ajudou a confiar mais na minha própria voz.", "É bom saber que podemos cuidar um do outro, sem que ninguém precise fazer tudo sozinho."],
    conflict: ["Eu fiquei triste com o que aconteceu. Podemos conversar, mas… por favor, não me apresse.", "Quero acreditar que foi um erro, não algo que você pensa de verdade."],
    partner: ["Eu ainda fico tímida, mas quero que você saiba: escolho estar aqui.", "Posso segurar sua mão? Às vezes é mais fácil demonstrar do que explicar."],
  },
  shikamaru: {
    beginning: ["Se não for uma emergência, podemos conversar sentados? Parece mais eficiente.", "Ainda estou tentando descobrir se você planeja as coisas ou só tem sorte."],
    trust: ["Não preciso revisar seu plano inteiro. Isso é… bem conveniente.", "Confio em você para perceber quando a situação muda, não só seguir o roteiro."],
    team: ["Já cobrimos as falhas um do outro em missão. Isso é praticamente uma declaração de amizade.", "Você pensa antes de agir mais do que costumava. Está ficando menos problemático."],
    conflict: ["Vamos separar o que aconteceu do que achamos que aconteceu. Assim fica mais fácil resolver.", "Não quero transformar isso numa briga. Mas também não vou fingir que não me incomodou."],
    partner: ["Reservei um tempo para ficar com você. Não chamei de plano porque isso seria estranho.", "Podemos não fazer nada por um tempo? Com você, até isso parece uma boa ideia."],
  },
  gaara: {
    beginning: ["Ainda estou aprendendo a conhecer as pessoas sem esperar o pior delas.", "A confiança não é uma ordem. Ela precisa de tempo."],
    trust: ["Você me mostrou que uma aliança pode ser construída por escolhas, não por obrigação.", "Hoje sei que posso pedir ajuda sem deixar de ser responsável."],
    team: ["O que fizemos juntos aproximou nossas vilas, não apenas nossas equipes.", "Lembro de cada missão em que você escolheu proteger alguém mesmo sob pressão."],
    conflict: ["Não quero que a raiva decida por nós. Diga o que aconteceu, e eu ouvirei.", "Se houve dano, precisamos reconhecer isso antes de falar em seguir em frente."],
    partner: ["Com você, o silêncio não parece solidão.", "Quero dividir com você tanto as responsabilidades quanto os momentos de descanso."],
  },
  temari: {
    beginning: ["Se quer minha opinião, pergunte direto. Não tenho paciência para rodeios.", "Vamos ver se você conversa tão bem quanto luta."],
    trust: ["Você não precisa concordar comigo para eu respeitar sua palavra.", "Aprendi a confiar no seu julgamento. Não me faça me arrepender."],
    team: ["Já vimos o bastante para saber como cada um reage quando o plano dá errado.", "A aliança entre nós funciona porque nenhum dos dois precisa fingir ser outra pessoa."],
    conflict: ["Não vou adivinhar o que você quis dizer. Explique, e depois eu decido.", "Se passou do limite, reconheça. Não tente disfarçar com charme."],
    partner: ["Não espere que eu fique mais delicada só porque estamos juntos. Mas eu escolho estar aqui.", "Guardei a noite para nós. Não se atrase."],
  },
  sai: {
    beginning: ["Estou tentando aprender quais perguntas demonstram interesse sem parecer um interrogatório.", "Se eu disser algo estranho, pode me corrigir. Estou praticando."],
    trust: ["Passei a reconhecer quando você está preocupado, mesmo que não diga em voz alta.", "Gosto de registrar momentos importantes. Você aparece em vários dos meus desenhos."],
    team: ["Trabalhar juntos me ensinou que confiança também se demonstra dividindo informações.", "Ainda não entendo todas as expressões, mas sei que posso contar com você."],
    conflict: ["Não entendi bem o que senti quando discutimos. Sei que não quero ignorar o problema.", "Se eu interpretar errado, me diga. Quero ouvir sua versão sem presumir."],
    partner: ["Fiz um desenho para você. Não consegui colocar tudo o que queria dizer, então escrevi atrás.", "Estar com você me ajuda a entender que intimidade também pode ser construída aos poucos."],
  },
  ino: {
    beginning: ["Vamos conversar — mas sem fingir que não percebeu o clima estranho na sala.", "Eu gosto de gente que presta atenção. Então, o que você veio me contar?"],
    trust: ["Você pode ser honesto comigo, mesmo quando a resposta não for perfeita.", "Aprendi a confiar no que você faz, não só no que diz."],
    team: ["A equipe melhorou quando todo mundo começou a falar com franqueza.", "Você já sabe quando eu preciso de espaço e quando só preciso que me escutem."],
    conflict: ["Não tente mudar de assunto. Me diga o que aconteceu e por que você acha que me magoou.", "Podemos fazer as pazes, mas não se eu for a única pessoa tentando."],
    partner: ["Eu gosto de receber atenção — mas gosto ainda mais quando você percebe o que eu realmente preciso.", "Vamos sair sem transformar isso numa missão. Quero conversar com você, só isso."],
  },
  kiba: {
    beginning: ["E aí! Se quiser conversar, vamos andando. Ficar parado é meio sem graça.", "Akamaru já decidiu que você parece confiável. Eu ainda estou avaliando."],
    trust: ["Você já provou que não some quando as coisas ficam difíceis. Isso conta.", "Akamaru reconhece quem é parceiro de verdade. Eu também."],
    team: ["As missões ficam melhores quando a gente pode confiar no instinto um do outro.", "Da próxima vez, Akamaru escolhe a rota. Ele tem um faro melhor para problemas."],
    conflict: ["Fala logo o que você fez. Prefiro uma discussão honesta a ficar farejando desculpas.", "Akamaru percebe quando estou irritado. Então, sim, ainda estou."],
    partner: ["Akamaru aprovou o passeio. Isso significa que você passou no teste mais importante.", "Vamos sair para caminhar. Prometo tentar não transformar tudo numa corrida."],
  },
  shino: {
    beginning: ["Percebi sua aproximação há algum tempo. Ainda assim, agradeço por ter vindo falar.", "O silêncio não significa falta de interesse. Pode continuar."],
    trust: ["Suas atitudes têm sido consistentes. Esse é um sinal confiável.", "Você passou a observar antes de concluir. Isso demonstra consideração."],
    team: ["Nossas observações se complementam. A equipe erra menos quando todos compartilham o que viram.", "Se precisar de uma opinião direta, pode perguntar. Não farei suposições."],
    conflict: ["Há uma diferença entre intenção e impacto. Precisamos considerar ambos.", "Ainda não concluí o que pensar. Escutarei sua explicação antes de decidir."],
    partner: ["Preparei um passeio tranquilo. Considerei ambientes com pouca movimentação.", "Não sou expressivo, mas valorizo a presença constante que você oferece."],
  },
};

const NPC_SPACE_DIALOGUE = {
  iruka: ["Ainda preciso de um pouco de tempo para reorganizar meus sentimentos. Podemos manter uma conversa respeitosa, sem pressa."],
  naruto: ["Ainda estou chateado. Não quero brigar, mas preciso de um tempo antes de voltar ao que era."],
  sasuke: ["Não vou fingir que nada aconteceu. Dê espaço para que eu decida o que fazer com isso."],
  sakura: ["Ainda estou processando o término. Podemos conversar, mas não quero retomar o relacionamento agora."],
  kakashi: ["Não vou transformar isso numa missão. Só preciso de algum tempo e espero que respeite esse limite."],
  hinata: ["Ainda estou me recuperando. Por favor, não me peça para decidir agora o que sinto."],
  shikamaru: ["Ainda não organizei tudo o que estou pensando. Vamos deixar a conversa sobre nós para outro dia."],
  gaara: ["Preciso de espaço para compreender o que mudou. Respeitar esse tempo também é uma forma de cuidado."],
  temari: ["Não tente apressar uma resposta. Vou falar quando estiver pronta."],
  sai: ["Ainda estou tentando entender como me sinto. Preciso de um tempo antes de falar sobre nós."],
  ino: ["Ainda estou magoada. Podemos nos tratar com respeito, mas não quero fingir que já passou."],
  kiba: ["Ainda estou irritado com o término. Me dá um tempo e não tenta resolver isso com uma piada."],
  shino: ["Ainda não estou pronto para retomar esse vínculo. Respeitar o espaço é o mais adequado agora."],
};

function relationshipConversation(id, topic = "geral") {
  const bond = bondOf(id),
    missions = bond.sharedMissions,
    trust = bond.trust,
    family = (CLAN_FAMILY_MEMBERS[S.clan] || []).includes(id),
    recentEvent = [...bond.events]
      .reverse()
      .find(
        (event) =>
          event.type != "conversa" &&
          S.day - event.day >= 0 &&
          S.day - event.day <= 14,
      ),
    stage =
      S.partner == id && S.rs?.[id] == "couple"
        ? "partner"
        : bond.romanceCooldownUntil > S.day
          ? "space"
        : bond.rivalry >= 2 || trust < 0
          ? "conflict"
          : (S.team || []).includes(id) || missions
            ? "team"
            : trust >= 4
              ? "trust"
              : "beginning",
    personalized =
      stage == "space"
        ? NPC_SPACE_DIALOGUE[id]
        : NPC_BOND_DIALOGUE[id]?.[stage],
    opening = chatPick(
      id,
      `vinculo:${stage}`,
      personalized ||
        (stage == "conflict"
          ? ["Sei que algo ficou mal resolvido entre nós. Podemos conversar sem fingir que nada aconteceu?"]
          : stage == "partner"
            ? ["Gosto de dividir estes momentos com você. Não precisamos ter pressa para preencher o silêncio."]
            : stage == "team"
              ? [
                  `Depois de ${missions} ${missions == 1 ? "missão" : "missões"} juntos, nossa parceria já tem uma história.`,
                  "É bom saber que nossa confiança foi construída com o que fizemos, não só com o que prometemos.",
                ]
              : trust >= 4
                ? ["Confio mais em você a cada vez que conversamos.", "É bom saber que posso contar com alguém como você."]
                : trust > 0
                  ? ["Acho que estamos começando a nos entender de verdade.", "Gosto de ver que nossa confiança está crescendo aos poucos."]
                  : ["Ainda estamos nos conhecendo, mas gosto de ouvir o que você pensa.", "Cada conversa ajuda a entender melhor quem você é."]),
    ),
    details = [opening];

  if (family && stage != "partner") {
    const clanName = CLANS[S.clan]?.name;
    if (clanName)
      details.push(
        chatPick(id, `linhagem:${S.clan}`, [
          `Saber que você também carrega o legado ${clanName} torna esta conversa especial.`,
          `Como alguém ligado ao clã ${clanName}, entendo o peso que uma herança pode trazer.`,
        ]),
      );
  }

  const recentEventKey = recentEvent
    ? JSON.stringify([recentEvent.day, recentEvent.type, recentEvent.detail])
    : "";
  if (
    recentEvent &&
    bond.lastMentionedEvent != recentEventKey &&
    stage != "space" &&
    !(stage == "conflict" && recentEvent.type == "conflito")
  ) {
    const detail = esc(recentEvent.detail),
      memory =
        recentEvent.type == "missao"
          ? NPC_BOND_DIALOGUE[id]?.team
            ? `Ainda me lembro da missão que dividimos: ${detail}`
            : `Ainda penso na missão que dividimos: ${detail}`
          : recentEvent.type == "conflito"
            ? `Não esqueci nosso desentendimento: ${detail}`
            : recentEvent.type == "promessa"
              ? `Lembro do que aconteceu com a nossa promessa: ${detail}`
              : `Ainda me lembro de quando ${detail}`;
    details.push(memory);
    bond.lastMentionedEvent = recentEventKey;
  }

  return details.join(" ");
}

const NPC_TOPIC_DIALOGUE = {
  iruka: {
    saudacao: ["Olá! Como você está de verdade? Não precisa responder como se fosse uma prova.", "Que bom ver você. A Academia fica mais animada quando os alunos aparecem por vontade própria."],
    sentimento: ["Você não precisa esconder que está cansado. Até os shinobi mais dedicados precisam de apoio.", "Quer me contar o que aconteceu? Vou ouvir antes de tentar dar um conselho."],
  },
  naruto: {
    saudacao: ["E aí! Já comeu? Se não, a conversa fica melhor com ramen!", "Oi! Eu estava pensando em treinar, mas posso conversar primeiro. O que foi?"],
    sentimento: ["Eu sei como é achar que ninguém está ouvindo. Pode falar comigo — não vou desistir no meio.", "Não precisa fingir que está tudo bem. A gente pode enfrentar isso junto!"],
  },
  sasuke: {
    saudacao: ["O que foi? Se quer falar comigo, não precisa inventar uma desculpa.", "Hm. Você parece ter algo em mente. Pode falar."],
    sentimento: ["Não vou dizer que entendo exatamente. Mas sei que ignorar o problema não faz ele desaparecer.", "Se precisa de ajuda, peça. Não transforme isso numa disputa."],
  },
  sakura: {
    saudacao: ["Oi! Você está com uma cara cansada. Quer conversar ou prefere que eu confira se está tudo bem?", "Que bom que veio. Só não tente me convencer de que dormir três horas é suficiente."],
    sentimento: ["Respire um pouco. Não precisa resolver tudo enquanto ainda está abalado.", "Se quiser, eu escuto primeiro. Depois a gente pensa no que fazer."],
  },
  kakashi: {
    saudacao: ["Chegou na hora certa. Eu estava prestes a terminar este capítulo… talvez.", "Oi. Espero que não seja outra missão urgente, mas pode falar."],
    sentimento: ["Até um shinobi experiente precisa de um tempo para organizar os pensamentos.", "Você não precisa carregar isso sozinho. A equipe existe também para esses momentos."],
  },
  hinata: {
    saudacao: ["O-olá! Fico feliz que tenha vindo. Como você está?", "Oi… eu estava pensando em você. Quer conversar um pouco?"],
    sentimento: ["Eu talvez não saiba o que dizer de imediato, mas quero ouvir.", "Você pode ir no seu tempo. Não vou apressar você."],
  },
  shikamaru: {
    saudacao: ["Oi. Se a conversa puder esperar até eu terminar isso, prometo prestar atenção de verdade.", "O que aconteceu? Sua expressão está entregando que não é só papo furado."],
    sentimento: ["Não precisa encontrar uma solução agora. Às vezes, entender o problema já é um começo.", "Quer desabafar ou quer pensar num plano? Posso fazer qualquer um dos dois."],
  },
  ino: {
    saudacao: ["Oi! Você veio conversar ou quer que eu adivinhe o que está sentindo?", "Ainda bem que apareceu. Estava ficando sem novidades por aqui."],
    sentimento: ["Não vou tentar ler sua mente. Me conta com suas palavras.", "Você pode ser sincero comigo. Não precisa dizer que está bem só para encerrar o assunto."],
  },
  kiba: {
    saudacao: ["E aí! Akamaru já veio cumprimentar você. Isso é um ótimo sinal.", "Oi! Se não estiver com pressa, vamos dar uma volta enquanto conversamos?"],
    sentimento: ["Se alguém fez você se sentir assim, me conta. Mas vamos pensar antes de sair correndo atrás da pessoa.", "Até Akamaru precisa parar para descansar. Você também pode fazer isso."],
  },
  shino: {
    saudacao: ["Olá. Notei que você parecia querer conversar. Estou disponível.", "Sua presença foi registrada. Isso não significa que estou reclamando."],
    sentimento: ["Posso não reagir da forma que espera, mas estou prestando atenção.", "Descrever o que aconteceu pode ajudar a separar os fatos das preocupações."],
  },
  gaara: {
    saudacao: ["É bom receber você. Como estão as coisas em Konoha?", "Olá. Podemos conversar sem tratar isso como uma reunião entre vilas."],
    sentimento: ["A solidão pode fazer parecer que ninguém compreenderia. Não precisa passar por isso sozinho.", "Diga apenas o que se sentir confortável em dividir. Vou respeitar seu tempo."],
  },
  sai: {
    saudacao: ["Olá. Estou tentando escolher uma saudação apropriada. Esta pareceu melhor do que ficar em silêncio.", "Que bom que veio. Posso mostrar o desenho que fiz durante a patrulha."],
    sentimento: ["Não tenho certeza de qual expressão combina com esse momento, mas quero ajudar.", "Se preferir, podemos ficar em silêncio. Também posso ouvir quando estiver pronto."],
  },
};

function chatReply(id, text) {
  const t = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let topic = "geral",
    replies;
  if (/\b(anbu|akatsuki|organizacao|organizacoes|faccoes?)\b/.test(t)) {
    topic = "organizacoes";
    const member = S.organizations?.[0];
    replies = member
      ? [
          `Você escolheu se vincular à ${ORGANIZATIONS[member].name}. Uma filiação abre algumas portas, mas também traz deveres e consequências.`,
          `A ${ORGANIZATIONS[member].name} espera que você responda pelas decisões que toma em nome dela.`,
        ]
      : id == "tsunade"
        ? [
            "A ANBU seleciona shinobi com disciplina e histórico confiável. Não é um atalho para ganhar prestígio.",
            "Há uma seleção reservada na Torre. Reputação ajuda, mas a equipe precisa saber que você toma decisões por conta própria.",
          ]
        : id == "obito" || id == "itachi"
          ? [
              "A Akatsuki não é uma vila nem uma família. Quem se aproxima precisa entender o preço antes de aceitar qualquer ordem.",
              "Ouvi versões diferentes sobre os objetivos da Akatsuki. Nem todos os seus membros contam a mesma história.",
            ]
          : [
              "Dizem que a ANBU procura gente discreta; outros juram que o recrutamento depende mais de confiança do que de força.",
              "Os rumores sobre a Akatsuki se contradizem. Uma coisa parece certa: entrar não significa poder sair sem consequências.",
            ];
  } else if (/\b(cla|linhagem|familia)\b/.test(t)) {
    topic = "linhagem";
    replies =
      S.clan == "none"
        ? [
            "Uma família pode oferecer raízes, mas não decide quem você vai se tornar.",
            "O legado também pode ser feito por quem escolhemos proteger.",
          ]
        : [
            `Você carrega a linhagem ${CLANS[S.clan].name}. O renome ${S.clanRenown || 0} mostra o que suas missões acrescentaram à história da família.`,
            `${CLANS[S.clan].tradition} Seu caminho ainda depende das escolhas que fizer.`,
          ];
  } else if (/\b(idade|anos|velho|velha|aniversario)\b/.test(t)) {
    topic = "idade";
    replies = [
      `Hoje tenho ${ageOf(id)} anos. E você, como está se sentindo com o passar do tempo?`,
      `O tempo muda bastante coisa. Estou com ${ageOf(id)} anos agora.`,
    ];
  } else if (
    S.assignment?.status == "active" &&
    /\b(missao|objetivo|etapa|equipe)\b/.test(t)
  ) {
    topic = "missao";
    const assignment = S.assignment,
      scene = assignment.stages[assignment.stage];
    replies = [
      `Estamos em “${assignment.title}”, etapa ${assignment.stage + 1} de ${assignment.stages.length}. ${scene[0]}`,
      `A equipe é ${assignment.squad.map((member) => N[member][0]).join(" e ")}. Vamos concluir esta etapa e seguir juntos.`,
    ];
  } else if (
    S.assignment?.status == "offered" &&
    /\b(missao|designacao|equipe|hokage)\b/.test(t)
  ) {
    topic = "missao";
    replies = [
      `Tsunade designou ${S.assignment.squad.map((member) => N[member][0]).join(" e ")} para “${S.assignment.title}”. Precisamos nos apresentar na Torre.`,
      `A Hokage espera nossa equipe na Torre. Depois partimos para ${L[S.assignment.loc][1]}.`,
    ];
  } else if (/\b(sobre voce|quem e voce|me conta)\b/.test(t)) {
    topic = "sobre";
    replies = [
      "Cada pessoa da vila tem uma história. O que você gostaria de saber?",
      "Prefiro mostrar quem sou pelas escolhas que faço. E você?",
    ];
  } else if (/\b(proteger|protegeria|principio|valor|valores)\b/.test(t)) {
    topic = "valores";
    replies = [
      "Eu protegeria as pessoas que confiam em mim.",
      "Uma equipe precisa saber o que está tentando preservar.",
    ];
  } else if (/\b(missao|missao atual|contrato|objetivo)\b/.test(t)) {
    topic = "missao";
    replies = M
      ? [
          `Você está em “${M.m[1]}”. Já enfrentou ${M.successes || 0} etapas com sucesso e teve ${M.failures || 0} contratempo(s).`,
          `A missão ativa é “${M.m[1]}”. Pense bem: seus contratempos podem deixar o final mais difícil.`,
        ]
      : id == "tsunade"
        ? [
            "Consulte o mural da Torre. Escolha uma missão adequada ao seu rank e volte com um relatório.",
            "Há contratos de escolta, busca e combate. Planejamento evita ferimentos.",
          ]
        : [
            "Não temos uma missão ativa no momento. O mural da Torre lista contratos disponíveis.",
            "Vamos falar com a Hokage e verificar se há uma missão para nossa equipe.",
          ];
  } else if (/\b(onde|local|lugar|ir|caminho|chegar|mapa)\b/.test(t)) {
    topic = "local";
    replies = [
      `Estamos em ${L[S.loc][1]}. ${Object.keys(L).length} lugares já aparecem no mapa; alguns exigem mais experiência para viajar.`,
      `Este lugar é ${L[S.loc][1]}. Veja os destinos agrupados por região no mapa.`,
    ];
  } else if (
    /\b(clima|tempo|chuva|tempestade|nevasca|enchente|incendio|deslizamento)\b/.test(
      t,
    )
  ) {
    topic = "clima";
    replies = S.urgent
      ? [
          `O clima está ${S.weather.toLowerCase()} e há um chamado: “${S.urgent.title}”. Temos ${S.urgent.daysLeft} dia(s) para chegar a ${L[S.urgent.loc][1]}.`,
          `Precisamos considerar ${S.weather.toLowerCase()}. A ocorrência “${S.urgent.title}” está ativa em ${L[S.urgent.loc][1]}.`,
        ]
      : [
          `Estamos no ${S.season.toLowerCase()} e o tempo está ${S.weather.toLowerCase()}. Isso pode mudar as condições da próxima missão.`,
          `O clima de hoje é ${S.weather.toLowerCase()}. Fique atento aos avisos da vila.`,
        ];
  } else if (
    /\b(rumor|rumores|boato|boatos|noticia|noticias|ouvi dizer)\b/.test(t)
  ) {
    topic = "rumores";
    replies = S.urgent
      ? [
          `O pessoal comenta sobre “${S.urgent.title}”. O chamado ainda está aberto em ${L[S.urgent.loc][1]}.`,
          `Ouvi que “${S.urgent.title}” precisa de ajuda. Não deixe o prazo acabar.`,
        ]
      : S.loc == "areia" || S.loc == "hospitalareia"
        ? [
            "Dizem que a Kazekage está fortalecendo os laços entre as vilas.",
            "Os moradores comentam sobre antigos mestres das marionetes da Areia.",
          ]
        : S.loc == "onda" || S.loc == "ponte"
          ? [
              "A Ponte Naruto virou símbolo de esperança para quem vive aqui.",
              "Os comerciantes dizem que a estrada está mais segura desde a reconstrução da ponte.",
            ]
          : [
              "Há rumores de movimentação nas fronteiras, mas ainda não sabemos quem está envolvido.",
              "Ouvi dizer que a Hokage está procurando ninjas para novas missões.",
            ];
  } else if (/\b(ramen|comer|fome|comida|dango)\b/.test(t)) {
    topic = "comida";
    replies =
      id == "teuchi"
        ? [
            "O caldo fica melhor quando cozinha sem pressa. Naruto costuma pedir uma porção extra.",
            "Uma tigela quente e uma conversa boa: esse é o segredo do Ichiraku.",
          ]
        : id == "choji"
          ? [
              "Depois de uma missão, uma boa refeição ajuda a recuperar o ânimo.",
              "Conheço um lugar ótimo para comer. Vamos ao Ichiraku quando terminarmos o treino.",
            ]
          : [
              "Um ramen quentinho ajuda a descansar depois de um dia puxado.",
              "Comer bem também faz parte de cuidar da equipe.",
            ];
  } else if (/\b(treino|treinar|forte|melhorar|praticar|jutsu)\b/.test(t)) {
    topic = "treino";
    replies =
      id == "lee"
        ? [
            "Treino constante, descanso e boa forma. Não adianta exagerar e se machucar.",
            "Vamos trabalhar o básico com atenção. A juventude também precisa dormir!",
          ]
        : id == "shikamaru"
          ? [
              "Treino inteligente começa com um objetivo. Escolha uma habilidade e acompanhe o progresso.",
              "Não gaste energia à toa: alterne prática, estudo e recuperação.",
            ]
          : id == "sakura"
            ? [
                "Controle e repetição são importantes. Preste atenção à fadiga para evitar lesões.",
                "Comece com uma sessão curta, recupere-se e só então aumente a intensidade.",
              ]
            : [
                "Escolha uma habilidade no mapa e faça sessões regulares. A fadiga e o descanso também contam.",
                "Treino de jutsu melhora com prática; cada técnica exige chakra e tempo.",
              ];
  } else if (/\b(luta|combate|inimigo|perigo|defender|atacar)\b/.test(t)) {
    topic = "combate";
    replies =
      id == "kakashi"
        ? [
            "Observe o adversário antes de atacar. Quando ele preparar um golpe forte, defenda-se.",
            "Uma equipe que protege os companheiros tem mais chance de voltar para casa.",
          ]
        : id == "gaara"
          ? [
              "Proteja seus aliados e não deixe que o inimigo escolha o terreno.",
              "Mantenha a calma. Uma defesa bem colocada pode mudar o rumo da luta.",
            ]
          : [
              "Guarde chakra para os momentos importantes e fique atento aos sinais do inimigo.",
              "Nem todo problema precisa ser resolvido com um ataque.",
            ];
  } else if (/\b(amigo|amizade|equipe|companheiro|confiar|time)\b/.test(t)) {
    topic = "equipe";
    replies =
      id == "naruto"
        ? [
            "Eu nunca abandono um companheiro. É assim que vou me tornar Hokage!",
            "Confiança não aparece de uma hora para outra. A gente constrói isso junto.",
          ]
        : id == "shikamaru"
          ? [
              "Uma equipe funciona melhor quando cada pessoa sabe o que os outros podem fazer.",
              "Às vezes o melhor plano é aquele que mantém todos em segurança.",
            ]
          : [
              "Uma equipe forte conversa e escuta antes de agir.",
              "A confiança se prova quando a missão fica difícil.",
            ];
  } else if (
    /\b(triste|medo|sozinho|sozinha|preocupado|preocupada|cansado|cansada)\b/.test(
      t,
    )
  ) {
    topic = "sentimento";
    replies =
      id == "hinata"
        ? [
            "Eu também fico nervosa às vezes. Um passo pequeno ainda é um passo.",
            "Você não precisa resolver tudo agora. Posso ficar aqui com você.",
          ]
        : [
            "Tudo bem pedir ajuda quando o peso fica grande. Não precisa enfrentar isso sozinho.",
            "Faça uma pausa, respire e procure alguém em quem confia.",
          ];
  } else if (/\b(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(t)) {
    topic = "saudacao";
    replies =
      id == "naruto"
        ? [
            "Oi! Já comeu? Depois vamos treinar!",
            "E aí! Tenho certeza de que hoje vai acontecer alguma coisa interessante.",
          ]
        : [
            "Olá. Bom ver você por aqui. Como vai a equipe?",
            "Oi! Como posso ajudar hoje?",
          ];
  } else if (/\b(obrigado|obrigada|valeu|agradeco)\b/.test(t)) {
    topic = "agradecimento";
    replies = [
      "Não precisa agradecer. Estamos na mesma equipe.",
      "Pode contar comigo quando precisar.",
      "Fico feliz por ter ajudado.",
    ];
  } else if (/sonho|futuro|hokage|objetivo/.test(t)) {
    topic = "sonho";
    replies =
      id == "naruto"
        ? [
            "Vou ser Hokage e fazer todo mundo reconhecer meu valor! E você, qual é o seu sonho?",
            "Meu sonho não mudou. Vou continuar avançando, aconteça o que acontecer.",
          ]
        : id == "konohamaru"
          ? [
              "Vou superar o Naruto e me tornar Hokage! Ainda tenho muito treino pela frente.",
            ]
          : [
              "Quero ficar forte o bastante para proteger as pessoas importantes para mim. E você?",
              "O futuro depende das escolhas que fazemos hoje.",
            ];
  } else if (/\?$|\b(como|por que|porque|quem|quando)\b/.test(t)) {
    topic = "pergunta";
    replies = [
      "Boa pergunta. O que fez você pensar nisso?",
      "Nunca tinha pensado por esse lado. O que você acha?",
      "Depende da situação. Pode me contar um pouco mais?",
    ];
  } else {
    topic = "geral";
    const h = esc(text.slice(0, 70) + (text.length > 70 ? "…" : ""));
    replies = [
      `Entendi: “${h}”. O que aconteceu depois?`,
      "Isso parece importante para você. Como se sente a respeito?",
      "Hm, quero entender melhor. O que você faria nessa situação?",
    ];
  }
  if (NPC_TOPIC_DIALOGUE[id]?.[topic]) replies = NPC_TOPIC_DIALOGUE[id][topic];
  if (VOZ[id]?.[topic]) replies = VOZ[id][topic];
  if (VOZ_EXTRA[id]?.[topic]) replies = VOZ_EXTRA[id][topic];
  return `${chatPick(id, topic, replies)} ${relationshipConversation(id, topic)}`;
}

const FREE_TEXT_EXAMPLES = [
  ["Treinar", "treinar"],
  ["Meditar", "meditar"],
  ["Dormir e descansar", "dormir"],
  ["Comer ramen", "comer ramen"],
  ["Pescar", "pescar"],
  ["Explorar os arredores", "explorar"],
  ["Contar uma piada", "contar uma piada"],
];

function runFreeTextExample(index) {
  const example = FREE_TEXT_EXAMPLES[index],
    input = $("#fr");
  if (!example || !input) return;
  input.value = example[1];
  fr();
}

function talkToNearbyExample(index) {
  const nearby = pres(S.loc),
    id = nearby[index],
    input = $("#fr");
  if (!id || !input) return;
  input.value = `conversar com ${N[id][0]}`;
  fr();
}

function fr() {
  const t = ($("#fr").value || "").trim();
  if (!t) return;
  const l = t.toLowerCase();
  log(`<b>Você:</b> ${esc(t)}`);
  const o = pres(S.loc).find((k) =>
    l.includes(N[k][0].split(" ")[0].toLowerCase()),
  );
  if (o) {
    T = o;
    if (/ataca|luta|duelo|desafi/.test(l)) return dn("duel");
    if (/provoc|zomb|pregar|ofend|peça/.test(l)) return dn("bully");
    mode = "npc";
    log(
      `<b>${N[o][0]}:</b> ${P(N[o][3])} ${relationshipConversation(o, "bate-papo")}`,
    );
    return render();
  }
  if (/ramen|comer|fome|dango/.test(l)) {
    if (S.ryo < 15) log("Você está sem ryo para comer.", "sys");
    else {
      S.ryo -= 15;
      S.hp = Math.min(S.mh, S.hp + 25);
      S.ck = Math.min(S.mc, S.ck + 10);
      log("🍜 Você devora uma tigela. Delícia!");
      tick(1);
    }
  } else if (/treina|treino/.test(l)) return self("t");
  else if (/medit/.test(l)) return self("m");
  else if (/dorm|descans/.test(l)) return self("s");
  else if (/roub|furt/.test(l)) {
    if (R(1, 20) + S.vel >= 18) {
      const y = R(15, 50);
      S.ryo += y;
      log(`🕶️ Você rouba ${y} ryo sem ser notado.`);
    } else {
      S.hp = Math.max(1, S.hp - 10);
      pres(S.loc).forEach((k) => rel(k, -6));
      log("🚨 Pego em flagrante! Todos ao redor desaprovam.", "bad");
    }
    tick(1);
  } else if (/pesc|nadar/.test(l)) {
    const y = R(8, 30);
    S.ryo += y;
    gain(5);
    log(`🎣 Você passa um tempo à beira do rio e lucra ${y} ryo.`);
    tick(1);
  } else if (/explor|andar|passear/.test(l)) {
    log("🧭 Você explora os arredores.", "sys");
    ev();
    tick(1);
  } else if (/pegadinha|prank|peça|piada/.test(l)) {
    gain(5);
    pres(S.loc).forEach((k) => rel(k, R(-3, 3)));
    log(
      "😜 Você apronta uma travessura em plena Konoha! Alguns riem, outros não.",
    );
    tick(1);
  } else {
    gain(3);
    log(
      `✨ ${P(["Você tenta", "Você decide", "Você se arrisca a"])}: <i>${esc(t)}</i>. ${P(["Os moradores observam curiosos.", "O vento de Konoha sopra e algo muda dentro de você.", "Um ninja ao longe assente em aprovação."])}`,
    );
    tick(1);
  }
  render();
}

const ROMANCE_DIALOGUE = {
  iruka: {
    flirt: ["Você sempre encontra um jeito de me surpreender. Confesso que isso me deixa feliz.", "Ah… eu não esperava ouvir isso de você. Acho que também sinto algo especial."],
    reject: ["Você é importante para mim, mas não quero transformar carinho em uma promessa que não posso fazer.", "Gosto de você, só não desse jeito. Espero que possamos continuar sendo honestos um com o outro."],
    invite: ["Aceito. Só não precisa preparar uma aula inteira; podemos escolher algo simples.", "Gostaria, sim. Um passeio tranquilo parece uma boa mudança de rotina."],
    commitment: ["Quero tentar isso com você. Vamos construir esse relacionamento com cuidado e sinceridade.", "Também quero ficar ao seu lado. Não precisamos ter todas as respostas hoje."],
    date_walk_success: ["Foi bom caminhar sem precisar falar de aula ou de missão. Quero repetir isso.", "Você me fez esquecer um pouco da rotina. Obrigado por dividir esse tempo comigo."],
    date_stars_success: ["Fazia tempo que eu não parava para olhar o céu. A conversa ficou mais fácil assim.", "Gosto de poder falar dos nossos sonhos sem precisar fingir que já temos todas as respostas."],
    date_ramen_success: ["Uma refeição simples e uma boa conversa. Acho que vou lembrar dessa noite por bastante tempo.", "Você escolheu bem. O ramen estava ótimo, mas sua companhia foi melhor."],
    date_awkward: ["Acho que os dois ficaram um pouco nervosos. Não tem problema; podemos tentar de novo sem pressa.", "Não foi exatamente como eu imaginei, mas agradeço por ter vindo. O que importa é sermos sinceros."],
    partner: ["Quero que possamos conversar com honestidade, mesmo quando nenhum dos dois sabe a resposta.", "Estar com você não apaga as responsabilidades, mas torna mais fácil enfrentá-las."],
    partnerTime: ["Vamos deixar as missões de lado por um instante. Como você tem se sentido?", "Não precisamos planejar nada. Quero só saber como foi seu dia."],
    affection: ["Posso ficar assim mais um pouco? É bom saber que estamos confortáveis um com o outro.", "Obrigada por perguntar com o olhar. Eu também queria esse carinho."],
    night: ["Conversar sem pressa me lembra que não precisamos ter tudo decidido para seguir em frente.", "Quero guardar esta noite como um momento tranquilo, só nosso."],
    breakup: ["Ainda me importo com você, mas não acho justo continuarmos como casal. Preciso de um tempo.", "Não quero transformar o que vivemos em ressentimento. Mas, por agora, é melhor seguirmos separados."],
  },
  kakashi: {
    flirt: ["Maa… não imaginei que fosse tão direto. Admito que gostei.", "Essa foi inesperada. Talvez eu devesse guardar o livro e prestar atenção em você."],
    reject: ["Você é uma boa companhia, mas prefiro manter as coisas no campo da amizade.", "Não quero alimentar uma expectativa que não consigo corresponder. Espero que entenda."],
    invite: ["Aceito. Vou tentar chegar na hora — sem prometer milagres.", "Parece uma boa ideia. Só me dê um ponto de encontro que eu consiga encontrar."],
    commitment: ["Quero tentar. Para mim, confiança e sinceridade vêm antes de grandes promessas.", "Sim. Não sou bom com discursos, mas estou disposto a construir isso com você."],
    date_walk_success: ["O passeio foi tranquilo. E, desta vez, não me atrasei tanto.", "Foi bom sair sem precisar observar cada telhado em busca de uma ameaça."],
    date_stars_success: ["O céu estava limpo. A conversa também foi… surpreendentemente fácil.", "Não vou transformar isso numa lição, mas gostei de ouvir o que você pensa."],
    date_ramen_success: ["O ramen estava bom. A conversa também — embora eu ainda prefira meu livro.", "Uma noite agradável. Talvez eu até me lembre de chegar na hora da próxima."],
    date_awkward: ["Acho que nós dois estávamos mais atentos ao silêncio do que à conversa. Ainda assim, foi bom tentar.", "Não foi perfeito, mas momentos tranquilos não precisam ser. Obrigado pelo convite."],
    partner: ["Você tem minha atenção. Isso é raro o bastante para eu considerar um compromisso sério.", "Não prometo ser pontual, mas prometo avisar quando me atrasar."],
    partnerTime: ["Podemos ficar quietos por um tempo. Não vou considerar isso um plano, prometo.", "Tenho um capítulo esperando, mas posso deixar para depois. Como foi seu dia?"],
    affection: ["Tudo bem. Gosto quando a gente não precisa transformar carinho em discurso.", "Pode ficar. Não vou reclamar — pelo menos não hoje."],
    night: ["Foi uma noite tranquila. Para variar, não precisei resolver nada antes de dormir.", "A conversa foi boa. Acho que vou até lembrar dela amanhã."],
    breakup: ["Entendo. Não vou tentar mudar sua decisão. Espero que possamos seguir em frente com respeito.", "Não é fácil ouvir isso, mas prefiro que sejamos honestos. Vou respeitar seu espaço."],
  },
  tsunade: {
    flirt: ["Heh. Você tem coragem para escolher justamente esse momento. Isso me diverte.", "Não costumo ficar sem resposta… mas admito que foi uma boa tentativa."],
    reject: ["Não confunda respeito e carinho com interesse romântico. Prefiro deixar isso claro.", "Você é valente, mas não é assim que vai me convencer. Vamos manter a relação profissional."],
    invite: ["Tudo bem. Mas sem apostas e sem transformar a noite numa competição.", "Aceito. Escolha um lugar tranquilo; a Torre pode esperar por algumas horas."],
    commitment: ["Quero tentar. Mas não espere que eu deixe de ser Hokage; precisamos respeitar as responsabilidades um do outro.", "Sim. Não vou prometer que tudo será simples, mas prometo falar com honestidade."],
    date_walk_success: ["Foi bom sair da Torre sem que alguém me entregasse um relatório no caminho.", "Uma caminhada tranquila fez mais por mim que outra noite diante da papelada."],
    date_stars_success: ["Faz tempo que não converso sobre o futuro sem pensar em decisões da vila.", "Você escolheu uma noite calma. Eu precisava disso mais do que imaginava."],
    date_ramen_success: ["Não é saquê, mas foi uma refeição decente. E sua companhia não foi ruim.", "Uma boa refeição e nenhuma emergência. Quase um milagre em Konoha."],
    date_awkward: ["Não precisa tentar me impressionar. Um encontro honesto já é melhor que uma aposta.", "A conversa ficou meio travada, mas não vou transformar isso num relatório de desempenho."],
    partner: ["Se eu estiver trabalhando demais, pode me lembrar de parar. Só não espere que eu admita de primeira.", "Nem a Hokage consegue resolver tudo sozinha. É bom ter você ao meu lado."],
    partnerTime: ["Vou deixar os relatórios para amanhã. Agora me conte como você está.", "Uma pausa não vai derrubar a vila. Vamos aproveitar antes que alguém apareça com uma emergência."],
    affection: ["Tudo bem. Não precisa fazer uma cena disso — só seja sincero comigo.", "Heh. Você ainda consegue me surpreender."],
    night: ["Passei tempo demais pensando em responsabilidades. Esta noite, quero pensar no que construímos.", "A vila pode esperar até amanhã. Hoje, vamos descansar."],
    breakup: ["Não vou fingir que não dói, mas respeito sua decisão. Precisamos de espaço para seguir em frente.", "Então vamos encerrar isso com honestidade. Não quero que nenhum de nós fique por obrigação."],
  },
  shizune: {
    flirt: ["Ah… eu não estava preparada para essa pergunta. Mas fico feliz que tenha sido sincero.", "Você me pegou de surpresa. Vou precisar de um instante para responder… sim, gostei."],
    reject: ["Obrigada por confiar em mim, mas meus sentimentos não são os mesmos. Quero ser sincera com você.", "Você é uma pessoa querida. Só não quero que um gesto gentil pareça uma promessa romântica."],
    invite: ["Gostaria, sim. Só preciso terminar de organizar a agenda antes de sair.", "Aceito. Uma pausa da papelada parece exatamente o que eu precisava."],
    commitment: ["Também quero tentar. Vamos cuidar um do outro sem deixar de conversar sobre o que precisamos.", "Sim. Quero ver onde isso pode chegar, um dia de cada vez."],
    date_walk_success: ["Foi bom sair um pouco da rotina da Torre. Até a Tonton parece mais tranquila.", "Eu precisava de uma pausa. Obrigada por me ajudar a lembrar disso."],
    date_stars_success: ["Consegui esquecer a papelada por alguns minutos. Foi muito bom conversar com você.", "A noite estava tão calma que finalmente consegui relaxar."],
    date_ramen_success: ["Uma refeição sem interrupções da Hokage… acho que isso conta como um encontro perfeito.", "Adorei poder conversar sem olhar para a pilha de relatórios a cada minuto."],
    date_awkward: ["Eu também fiquei um pouco nervosa. Podemos rir disso e tentar conversar com mais calma.", "Não foi ruim — só ficamos sem saber o que dizer por alguns instantes."],
    partner: ["Quero dividir com você tanto os dias tranquilos quanto aqueles em que tudo parece urgente.", "Quando estou ao seu lado, consigo deixar as preocupações da Torre para depois."],
    partnerTime: ["Podemos falar de qualquer coisa que não seja a lista de tarefas da Tsunade?", "Quero ouvir como você está. Hoje não precisa resolver nada para ninguém."],
    affection: ["Sim… obrigada por ser carinhoso e respeitar meu tempo.", "Fico feliz que tenha perguntado. Também queria ficar perto de você."],
    night: ["Foi bom falar dos nossos planos sem olhar para a agenda a cada minuto.", "Amanhã a papelada continua lá. Esta noite, quero só descansar ao seu lado."],
    breakup: ["Obrigada por ser sincero. Vou sentir falta do que tínhamos, mas preciso respeitar sua decisão.", "Eu gostaria que fosse diferente, mas não quero que nenhum de nós permaneça por culpa."],
  },
  anko: {
    flirt: ["Ousado. Gostei da iniciativa — mas não ache que vai ser tão fácil assim.", "Hah! Pelo menos você teve coragem de falar. Isso já é um começo."],
    reject: ["Você parece legal, mas não estou interessada. Não leve para o lado pessoal.", "Boa tentativa, novato. Prefiro manter a gente como está."],
    invite: ["Aceito. Mas se for uma armadilha, espero que pelo menos seja uma boa.", "Vamos. Escolhe um lugar; eu cuido para não ser entediante."],
    commitment: ["Vamos tentar. Só não venha com joguinhos: se algo incomodar, fala na minha cara.", "Sim, eu quero. Não prometo ser fácil, mas prometo ser direta."],
    date_walk_success: ["Uma caminhada sem armadilhas nem provas. Quase senti falta do perigo — quase.", "Você sabe que eu prefiro ação, mas esse passeio foi surpreendentemente divertido."],
    date_stars_success: ["Quem diria que ficar parada olhando o céu podia ser tão bom?", "A conversa foi boa. Não espalhe que eu gostei de uma noite tranquila."],
    date_ramen_success: ["Dango teria sido melhor, mas a companhia compensou a escolha questionável.", "Comida boa e alguém que não se assusta comigo. Gostei."],
    date_awkward: ["Hah, já tive encontros bem mais desastrosos. Da próxima vez, tenta relaxar.", "Ficou meio estranho, mas pelo menos ninguém explodiu nada. Ainda é uma vitória."],
    partner: ["Não tente me proteger de tudo. Só fique por perto e seja honesto comigo.", "Se vamos fazer isso, quero que continue sendo divertido — e sem joguinhos."],
    partnerTime: ["Vamos sair daqui antes que alguém apareça com um relatório ou uma armadilha.", "Conta uma história boa. Se for entediante, vou interromper — com carinho."],
    affection: ["Pode. Só não fique esperando que eu vire uma pessoa toda melosa de repente.", "Tudo bem. Mas se alguém perguntar, eu estava só conferindo se você estava bem."],
    night: ["Uma noite sem perigo, sem prova e sem relatório. Não foi ruim.", "Fica mais um pouco. Amanhã eu volto a reclamar da rotina."],
    breakup: ["Entendi. Não vou implorar para você ficar. Só não espere que eu aja como se nada tivesse acontecido amanhã.", "Certo. Prefiro uma verdade desagradável a alguém ficando comigo por pena."],
  },
  kurenai: {
    flirt: ["Foi uma surpresa agradável. Gosto da sua sinceridade.", "Você conseguiu me deixar sem resposta por um instante. Isso não acontece sempre."],
    reject: ["Agradeço o carinho, mas não sinto o mesmo. Prefiro ser clara para não criar expectativas.", "Você merece alguém que corresponda ao que sente. Eu não posso prometer isso."],
    invite: ["Aceito. Escolher um momento tranquilo parece uma ótima ideia.", "Gostaria, sim. Vamos encontrar um lugar onde possamos conversar sem pressa."],
    commitment: ["Quero tentar, desde que continuemos respeitando o tempo e os limites um do outro.", "Sim. Para mim, um relacionamento precisa de confiança e espaço para sermos sinceros."],
    date_walk_success: ["A vila parece diferente quando podemos observá-la sem pressa.", "Foi bom conversar longe das responsabilidades da equipe."],
    date_stars_success: ["Uma noite silenciosa pode dizer muito. Fiquei feliz por dividir essa com você.", "Gostei de ouvir seus planos. Espero que continue construindo esse futuro com cuidado."],
    date_ramen_success: ["Uma refeição simples pode ser especial quando a conversa é sincera.", "Obrigada por me convidar. Foi bom ter um momento nosso."],
    date_awkward: ["Não precisa interpretar cada silêncio como um erro. Podemos ir nos conhecendo no nosso ritmo.", "Foi um pouco desajeitado, mas ainda assim gostei de passar esse tempo com você."],
    partner: ["Quero que nosso vínculo seja um lugar seguro, não mais uma obrigação para cumprir.", "Podemos falar sobre o que sentimos sem tentar adivinhar a resposta certa."],
    partnerTime: ["Quero ouvir como você está, sem tentar analisar cada palavra como um genjutsu.", "Vamos reservar um tempo para nós. O restante pode esperar um pouco."],
    affection: ["Sim. Gosto de como você pergunta em vez de presumir.", "Obrigada por ser gentil e respeitar o que me deixa confortável."],
    night: ["Foi bom dividir uma noite tranquila e falar sobre o que esperamos do futuro.", "A serenidade desta noite me fez bem. Obrigada por compartilhá-la comigo."],
    breakup: ["Obrigada por falar com honestidade. Vou precisar de um tempo, mas não quero guardar ressentimento.", "É doloroso, mas respeito o que você decidiu. Vamos nos dar espaço para processar."],
  },
};

function romanceLine(id, scene, fallback) {
  return chatPick(
    id,
    `romance:${scene}`,
    ROMANCE_DIALOGUE[id]?.[scene] || fallback,
  );
}

function romanceUnavailable(id) {
  if (S.partner && S.partner != id) {
    log(
      `${N[S.partner][0]} é seu parceiro. Resolva esse relacionamento antes de iniciar um romance com outra pessoa.`,
      "sys",
    );
    return true;
  }
  const cooldown = bondOf(id).romanceCooldownUntil || 0;
  if (S.day < cooldown) {
    log(
      `${N[id][0]} pediu um tempo depois do término. Respeite esse espaço até o dia ${cooldown}.`,
      "sys",
    );
    return true;
  }
  return false;
}

const rom = (id) => S.a >= 18 && ageOf(id) >= 18 && !!RM[id];

const love = (id, v) => {
  S.love[id] = Math.max(0, Math.min(100, (S.love[id] || 0) + v));
};

function shareMeal(id) {
  if (S.loc != "ichiraku")
    return log(
      "Vocês precisam estar no Ichiraku para compartilhar uma refeição.",
      "sys",
    );
  if (S.ryo < 15)
    return log("Você não tem ryō suficiente para pagar a refeição.", "sys");
  if (used("meal" + id))
    return log(`${N[id][0]} sugere deixar para outra hora.`, "sys");
  S.ryo -= 15;
  const favorite = ["teuchi", "naruto", "choji"].includes(id);
  S.hp = Math.min(S.mh, S.hp + 15);
  S.ck = Math.min(S.mc, S.ck + 8);
  remember(id, "refeição", "Vocês dividiram uma refeição no Ichiraku.", {
    affinity: favorite ? 4 : 2,
    trust: 2,
    sharedMoments: 1,
  });
  log(
    favorite
      ? `🍜 ${N[id][0]} conta histórias entre uma tigela e outra. A conversa fica mais leve.`
      : `🍜 Você e ${N[id][0]} compartilham uma refeição e conversam com calma.`,
    "ok",
  );
  tick(1);
  render();
}

function flirt() {
  const id = T,
    n = N[id];
  if (!rom(id)) {
    log("Romance está disponível apenas entre personagens adultos.", "sys");
    return render();
  }
  if (S.partner == id && S.rs?.[id] == "couple") {
    log(
      `<b>${n[0]}:</b> “${romanceLine(id, "partner", ["Gosto do que estamos construindo juntos."])}”`,
    );
    return render();
  }
  if (romanceUnavailable(id)) return render();
  if ((S.rel[id] || 0) < 15 || bondOf(id).trust < 2) {
    log(
      `<b>${n[0]}:</b> “Quero conhecer melhor você antes de interpretar isso como flerte.”`,
    );
    return render();
  }
  if (used("flt" + id)) {
    log(`<b>${n[0]}:</b> “Calma, acabamos de conversar. Me dê um tempo…”`);
    return render();
  }
  const r = R(1, 20),
    tt = r + S.car + Math.floor(S.rel[id] / 10) + (S.rs[id] ? 3 : 0);
  log(
    `🎲 Flertar: ${r} + ${S.car} (carisma) + bônus = ${tt} (precisa de 14)`,
    "sys",
  );
  if (tt >= 14) {
    love(id, R(3, 6));
    remember(id, "flerte", "Vocês trocaram um flerte bem recebido.", {
      trust: 1,
      sharedMoments: 1,
    });
    log(`😉 <b>${n[0]}:</b> ${romanceLine(id, "flirt", [RM[id][1]])}`, "ok");
  } else {
    love(id, -2);
    remember(
      id,
      "flerte",
      "O flerte não foi correspondido; vocês decidiram ir com calma.",
      { affinity: -2, trust: -1 },
    );
    log(`😅 <b>${n[0]}:</b> ${romanceLine(id, "reject", [RM[id][2]])}`, "bad");
  }
  render();
}

function inv() {
  const id = T,
    n = N[id];
  if (!rom(id)) {
    log(
      "Encontros românticos estão disponíveis apenas entre personagens adultos.",
      "sys",
    );
    return render();
  }
  if (S.partner == id && S.rs?.[id] == "couple") {
    log(`${n[0]} já está em um relacionamento com você. Escolham juntos como passar o tempo.`, "sys");
    return render();
  }
  if (romanceUnavailable(id)) return render();
  const bond = bondOf(id);
  if (
    (S.rel[id] || 0) < 30 ||
    (S.love[id] || 0) < 20 ||
    bond.trust < 3 ||
    bond.sharedMoments < 2
  ) {
    log(
      `<b>${n[0]}:</b> “Quero conhecer melhor seu jeito antes de aceitar um encontro.” É preciso construir confiança e compartilhar alguns momentos.`,
    );
    return render();
  }
  if (S.ryo < 40) {
    log("Você não tem ryo suficiente para o encontro.", "sys");
    return render();
  }
  if (used("date" + id)) {
    log(
      `<b>${n[0]}:</b> “Acabamos de passar um tempo juntos. Vamos mais tarde?”`,
    );
    return render();
  }
  S.ryo -= 40;
  mode = "date";
  log(`🌹 <b>${n[0]}:</b> “${romanceLine(id, "invite", ["Aceito. O que você tinha em mente?"])}”`);
  render();
}

function dt(i) {
  const id = T,
    n = N[id],
    date = DT[i];
  if (mode != "date" || !date) {
    mode = "npc";
    log("Esse encontro já não está disponível. Conversem novamente para combinar outro.", "sys");
    return render();
  }
  if (!rom(id)) {
    log(
      "Encontros românticos estão disponíveis apenas entre personagens adultos.",
      "sys",
    );
    return render();
  }
  if (i == 1 && S.t != 2) {
    log("O céu ainda está claro. Guardem a conversa sob as estrelas para a noite.", "sys");
    return render();
  }
  const [l, a] = date,
    r = R(1, 20),
    tt = r + S[a] + Math.floor(bondOf(id).trust / 2);
  log(`🎲 ${l}: ${r} + ${S[a]} + bônus = ${tt} (precisa de 15)`, "sys");
  if (tt >= 15) {
    love(id, R(8, 14));
    remember(id, "encontro", `Vocês foram juntos: ${l.toLowerCase()}.`, {
      affinity: 3,
      trust: 3,
      respect: 1,
      sharedMoments: 1,
      dates: 1,
    });
    const scene = ["walk", "stars", "ramen"][i];
    log(`💕 <b>${n[0]}:</b> “${romanceLine(id, `date_${scene}_success`, [`Gostei de passar esse tempo com você. A conversa fluiu melhor do que eu esperava.`, `Foi bom conhecer um pouco mais de você. Quero guardar esse momento.`, `Acho que conseguimos encontrar nosso ritmo. Obrigado pelo convite.`])}”`, "ok");
  } else {
    love(id, 2);
    remember(
      id,
      "encontro",
      `O encontro foi um pouco desajeitado: ${l.toLowerCase()}.`,
      { trust: 1, sharedMoments: 1, dates: 1 },
    );
    log(`😅 <b>${n[0]}:</b> “${romanceLine(id, "date_awkward", ["Acho que ficamos um pouco sem jeito. Mesmo assim, agradeço por ter tentado."])}”`);
  }
  if (!S.rs[id]) S.rs[id] = "date";
  mode = "npc";
  tick(1);
  render();
}

function ask() {
  const id = T,
    n = N[id];
  if (!rom(id)) {
    log("Namoro está disponível apenas entre personagens adultos.", "sys");
    return render();
  }
  if (S.partner == id && S.rs?.[id] == "couple") {
    log(`Você e ${n[0]} já estão em um relacionamento.`, "sys");
    return render();
  }
  if (S.partner && S.partner != id) {
    log(
      `💔 Você já está com ${N[S.partner][0]}. Termine antes de começar outro namoro.`,
      "bad",
    );
    return render();
  }
  if (romanceUnavailable(id)) return render();
  const bond = bondOf(id);
  if ((S.love[id] || 0) < 55 || bond.trust < 8 || bond.dates < 2) {
    log(
      `<b>${n[0]}:</b> “Gosto do que estamos construindo, mas quero mais tempo e experiências juntos antes de decidir.” (São necessários confiança e dois encontros.)`,
    );
    return render();
  }
  S.rs[id] = "couple";
  S.partner = id;
  love(id, 5);
  remember(
    id,
    "relacionamento",
    "Vocês conversaram e decidiram começar um relacionamento.",
    { trust: 3, sharedMoments: 1 },
  );
  log(`💍 <b>${n[0]}:</b> “${romanceLine(id, "commitment", ["Quero tentar isso com você. Vamos construir esse relacionamento com sinceridade."])}”`, "ok");
  render();
}

function couple(a) {
  const id = T,
    n = N[id],
    lv = S.love[id] || 0,
    bond = bondOf(id);
  if (!rom(id)) {
    log(
      "Interações românticas estão disponíveis apenas entre personagens adultos.",
      "sys",
    );
    return render();
  }
  if (S.partner != id || S.rs?.[id] != "couple") {
    log("Essa interação é exclusiva de um relacionamento ativo.", "sys");
    return render();
  }
  if (a == "t") {
    if (used("ct" + id))
      log(`${n[0]} sorri: “Vamos deixar para mais tarde, ok?”`, "sys");
    else {
      love(id, 3);
      remember(
        id,
        "tempo juntos",
        "Vocês reservaram um momento tranquilo para conversar.",
        { trust: 2, sharedMoments: 1 },
      );
      S.hp = Math.min(S.mh, S.hp + 15);
      log(
        `🍃 ${n[0]}: “${romanceLine(id, "partnerTime", ["Gosto de ter um momento tranquilo com você. Como foi seu dia?"])}” (+15 HP)`,
        "ok",
      );
      tick(1);
    }
  } else if (a == "k") {
    if (lv < 60 || bond.trust < 8 || bond.dates < 2)
      log(
        `<b>${n[0]}:</b> “Prefiro esperar até termos mais confiança e momentos juntos.”`,
      );
    else if (used("k" + id)) log(`${n[0]} ri: “Você é insistente!”`, "sys");
    else {
      love(id, 2);
      remember(
        id,
        "carinho",
        "Vocês compartilharam um beijo carinhoso, com respeito e conforto mútuos.",
        { trust: 2, sharedMoments: 1 },
      );
      log(
        `💋 ${n[0]}: “${romanceLine(id, "affection", ["Também quero ficar perto de você. Obrigado por respeitar meu tempo."])}”`,
        "ok",
      );
    }
  } else if (a == "n") {
    if (lv < 90 || bond.trust < 12 || bond.dates < 3)
      log(
        `<b>${n[0]}:</b> “Quero construir mais confiança e viver outros momentos juntos primeiro.”`,
      );
    else if (S.t != 2)
      log(
        `${n[0]} sugere: “Vamos conversar com calma quando a vila estiver mais tranquila.”`,
        "sys",
      );
    else if (S.cd["n" + id] == S.day)
      log(`${n[0]} sorri: “Já tivemos nosso momento especial hoje.”`, "sys");
    else {
      S.cd["n" + id] = S.day;
      love(id, 3);
      remember(
        id,
        "conversa íntima",
        "Vocês passaram a noite conversando sobre planos e lembranças, e acordaram descansados.",
        { trust: 2, sharedMoments: 1 },
      );
      S.hp = S.mh;
      S.ck = S.mc;
      log(
        `🌙 ${n[0]}: “${romanceLine(id, "night", ["Foi bom conversar sem pressa sobre nossos planos e lembranças."])}” Pela manhã, vocês acordam descansados.`,
        "ok",
      );
      tick(1);
    }
  } else if (a == "x" && confirm(`Terminar o namoro com ${n[0]}?`)) {
    love(id, -35);
    bond.romanceCooldownUntil = S.day + 7;
    remember(id, "término", "Vocês decidiram terminar o relacionamento.", {
      affinity: -15,
      trust: -3,
    });
    S.rs[id] = "";
    S.partner = null;
    log(
      `💔 ${n[0]}: “${romanceLine(id, "breakup", ["Acho melhor encerrarmos por aqui. Preciso de um tempo para processar tudo."])}” Vocês encerram o relacionamento e combinam de dar espaço um ao outro.`,
      "bad",
    );
  }
  render();
}
