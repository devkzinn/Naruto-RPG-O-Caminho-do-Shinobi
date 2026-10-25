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
    rogue = !!S.rogue?.active;
  if (villain == rogue) return false;

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
    villain
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
    `<b>${N[id][0]}:</b> “Não quero conversar agora. Sua reputação e a forma como você se aproxima ainda não me dão confiança.” <small>(Carisma ${S.car} · reputação ${Math.floor(S.rep || 0)} · abertura ${result.profile.charisma}/10)</small>`,
    "sys",
  );
  return true;
}

function teamInvitationChance(id) {
  const bond = bondOf(id),
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
  bond.events = Array.isArray(bond.events) ? bond.events : [];
  return bond;
}

function remember(id, type, detail, change = {}) {
  const bond = bondOf(id);
  if (change.affinity) rel(id, change.affinity);
  [
    "trust",
    "respect",
    "rivalry",
    "mentorship",
    "sharedMissions",
    "sharedMoments",
    "dates",
  ].forEach((key) => {
    if (change[key]) bond[key] = (bond[key] || 0) + change[key];
  });
  bond.events.push({ day: S.day, type, detail });
  bond.events = bond.events.slice(-5);
  return bond;
}

function bondLabel(id) {
  const bond = bondOf(id);
  if (S.rs[id] == "couple" && rom(id)) return "Relacionamento";
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
  };
  S.rep = 0;
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

const AC = {
  talk: (id, n) => {
    const lines = [...n[3]];
    if (S.urgent?.npc == id)
      lines.push(
        `“${S.urgent.title} está preocupando todo mundo. Você vai ajudar?”`,
      );
    const reply = chatPick(id, "bate-papo", lines);
    if (!used("talk" + id)) {
      remember(id, "conversa", reply, {
        affinity: 2,
        trust: 1,
        sharedMoments: 1,
      });
      gain(2);
      if (Math.random() < 0.15) addStat("car", 1);
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
  },
  gift: (id, n, g) => {
    const [gn, baseCost] = G[g],
      c = marketPrice(baseCost);
    if (S.ryo < c) return (log("Ryō insuficiente.", "sys"), 1);
    S.ryo -= c;
    const fav = (RM[id] || ["dango"])[0] == g;
    remember(id, "presente", `Você deu ${gn}.`, {
      affinity: fav ? 10 : 4,
      trust: fav ? 3 : 1,
    });
    if (rom(id)) love(id, fav ? 3 : 1);
    log(
      `🎁 ${n[0]} ${fav ? "adora" : "aceita"} ${gn}. <b>“Obrigado(a), ${esc(S.n)}!”</b>`,
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
    log(`🥋 Você treina ao lado de ${n[0]}.`);
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
    remember(id, "rivalidade", "Vocês aceitaram um duelo amistoso.", {
      rivalry: 1,
    });
    log(
      `⚔️ Você desafia ${n[0]} para um duelo amistoso! (−${cost} chakra · +12% fadiga)`,
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
        log(`🤝 ${n[0]} reconhece sua força. +${xp} XP.`, "ok");
      },
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
  log(`<b>Você:</b> ${esc(t)}`);
  if (SEXY.test(l)) {
    rel(T, -4);
    log(
      `<b>${n[0]}:</b> ${P(["“Opa, mais respeito!”", "“Esse não é jeito de falar comigo.”"])}`,
      "bad",
    );
    return render();
  }
  if (ROM.test(l)) {
    if (rom(T)) return flirt();
    log(
      `<b>${n[0]}:</b> “Hehe, você é gentil… mas prefiro que sejamos apenas amigos.”`,
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
  log(`<b>${n[0]}:</b> ${r}`);
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
  if (VOZ[id]?.[topic]) replies = VOZ[id][topic];
  if (VOZ_EXTRA[id]?.[topic]) replies = VOZ_EXTRA[id][topic];
  return chatPick(id, topic, replies);
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
    rel(o, 1);
    log(`<b>${N[o][0]}:</b> ${P(N[o][3])}`);
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
    log(`😉 <b>${n[0]}:</b> ${RM[id][1]}`, "ok");
  } else {
    love(id, -2);
    remember(
      id,
      "flerte",
      "O flerte não foi correspondido; vocês decidiram ir com calma.",
      { affinity: -2, trust: -1 },
    );
    log(`😅 <b>${n[0]}:</b> ${RM[id][2]}`, "bad");
  }
  const p = S.partner;
  if (p && p != id && Math.random() < 0.6) {
    love(p, -12);
    rel(p, -5);
    log(
      `😡 ${N[p][0]} soube que você andou flertando por aí… e não ficou nada feliz.`,
      "bad",
    );
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
  log(`🌹 ${n[0]} aceita o convite. <b>“Aonde vamos?”</b>`);
  render();
}

function dt(i) {
  const id = T,
    n = N[id];
  if (!rom(id)) {
    log(
      "Encontros românticos estão disponíveis apenas entre personagens adultos.",
      "sys",
    );
    return render();
  }
  const [l, a] = DT[i],
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
    log(
      `💕 ${P(["A conversa flui e vocês encontram um ritmo confortável", "Vocês riem de histórias antigas e descobrem algo novo um sobre o outro", "O passeio fica marcado por uma conversa sincera"])}. ${n[0]} parece feliz com o tempo que passaram juntos.`,
      "ok",
    );
  } else {
    love(id, 2);
    remember(
      id,
      "encontro",
      `O encontro foi um pouco desajeitado: ${l.toLowerCase()}.`,
      { trust: 1, sharedMoments: 1, dates: 1 },
    );
    log(
      `😅 O passeio fica um pouco desajeitado, mas ${n[0]} agradece por você ter tentado.`,
    );
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
  if (S.partner && S.partner != id) {
    log(
      `💔 Você já está com ${N[S.partner][0]}. Termine antes de começar outro namoro.`,
      "bad",
    );
    return render();
  }
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
  log(
    `💍 <b>${n[0]}:</b> “Quero tentar isso com você.” — Vocês começam um relacionamento.`,
    "ok",
  );
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
        `🍃 Você e ${n[0]} conversam sem pressa e recuperam o fôlego. (+15 HP)`,
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
        `💋 Você e ${n[0]} compartilham um beijo carinhoso. Depois, conversam sobre como se sentiram.`,
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
        `🌙 Você e ${n[0]} passam a noite conversando sobre planos e lembranças. Pela manhã, ambos acordam descansados.`,
        "ok",
      );
      tick(1);
    }
  } else if (a == "x" && confirm(`Terminar o namoro com ${n[0]}?`)) {
    love(id, -35);
    remember(id, "término", "Vocês decidiram terminar o relacionamento.", {
      affinity: -15,
      trust: -3,
    });
    S.rs[id] = "";
    S.partner = null;
    log(
      `💔 Vocês conversam com honestidade e encerram o relacionamento. ${n[0]} pede um tempo para processar a decisão.`,
      "bad",
    );
  }
  render();
}
