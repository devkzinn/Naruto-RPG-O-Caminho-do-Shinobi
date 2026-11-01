/* Missões: contratos, operações em etapas, arcos de história, chamados urgentes e recompensas. */

function initializePromotionDuty(rank) {
  const duties = Array.isArray(S.promotionDuties)
    ? S.promotionDuties
    : (S.promotionDuties = []);
  if (rank == 2 && !duties.some((duty) => duty.rank == 2)) {
    duties.push({
      rank,
      type: "leadership",
      status: "pending",
      createdDay: S.day,
    });
    log(
      "🎖️ Como Chunin, sua próxima responsabilidade é liderar uma missão com aliados e apresentar o resultado à Hokage.",
      "bt",
    );
  }
  if (rank == 3 && !duties.some((duty) => duty.rank == 3)) {
    duties.push({
      rank,
      type: "mentorship",
      status: "pending",
      createdDay: S.day,
      mentoringSessions: 0,
    });
    log(
      "🎓 Como Jounin, você recebeu Konohamaru como aprendiz. Oriente-o, leve-o em uma missão e responda pelo resultado diante da Hokage.",
      "bt",
    );
  }
  save();
}

function recordPromotionDuty(bonuses) {
  const participants = bonuses.squad || [],
    duty = (S.promotionDuties || []).find(
      (entry) => entry.status == "pending",
    );
  if (!duty) return;
  if (duty.type == "leadership" && participants.length) {
    duty.status = "review";
    duty.mission = bonuses.title;
    duty.missionDay = S.day;
    duty.failures = bonuses.failures || 0;
    duty.squad = participants.slice();
    log(
      `📋 Você liderou a equipe em “${esc(duty.mission)}”. Tsunade espera seu relatório na Torre do Hokage.`,
      "bt",
    );
  } else if (
    duty.type == "mentorship" &&
    duty.mentoringSessions >= 2 &&
    participants.includes("konohamaru") &&
    (bonuses.failures || 0) == 0
  ) {
    duty.status = "review";
    duty.mission = bonuses.title;
    duty.missionDay = S.day;
    duty.failures = 0;
    duty.squad = participants.slice();
    log(
      `🛡️ Konohamaru voltou em segurança de “${esc(duty.mission)}”. Apresente seu relatório à Hokage.`,
      "bt",
    );
  }
}

function reviewPromotionDuty(index, decision) {
  const duty = S.promotionDuties?.[index];
  if (S.loc != "torre")
    return log(
      "Apresente-se na Torre do Hokage para prestar seu relatório.",
      "sys",
    );
  if (!duty || duty.status != "review")
    return log("Não há relatório de responsabilidade aguardando avaliação.", "sys");
  if (!["transparent", "conceal"].includes(decision))
    return log("Escolha uma resposta válida para o relatório.", "sys");
  const world = worldConsequences();
  if (decision == "transparent") {
    world.villageTrust = clampWorldValue(world.villageTrust + 3);
    S.rep = Math.min(100, (S.rep || 0) + 1);
    duty.status = "fulfilled";
    remember(
      "tsunade",
      "relatório",
      `Apresentou com transparência o resultado de “${duty.mission}”.`,
      { trust: 2, respect: 1 },
    );
    log(
      `📜 Tsunade aprova seu relatório transparente sobre “${esc(duty.mission)}”. A confiança da vila e sua reputação aumentam.`,
      "ok",
    );
  } else {
    world.villageTrust = clampWorldValue(world.villageTrust - 3);
    S.rep = Math.min(100, (S.rep || 0) + 2);
    duty.status = "concealed";
    remember(
      "tsunade",
      "relatório",
      `Omitiu detalhes ao relatar “${duty.mission}”.`,
      { trust: -2, respect: -1 },
    );
    (duty.squad || []).forEach((id) =>
      remember(
        id,
        "relatório",
        "Você omitiu detalhes ao prestar contas da missão à Hokage.",
        { trust: -1 },
      ),
    );
    log(
      `⚠️ Você omite parte do relatório de “${esc(duty.mission)}”. O prestígio imediato cresce, mas a confiança da vila e de Tsunade diminui.`,
      "bad",
    );
  }
  save();
  render();
}

function offerHokageMission() {
  let candidates = HOKAGE_OPS.filter((operation) => {
    const req = LOC_REQ[operation.loc];
    return (
      S.rk >= NEED[operation.rank] &&
      (operation.worldCondition ||
        (S.rep || 0) >= (REP_REQ[operation.rank] || 0)) &&
      (!req || (S.rk >= req.rk && S.done >= req.done)) &&
      worldOperationAvailable(operation)
    );
  });
  const consequenceMissions = candidates.filter(
    (operation) => operation.worldCondition,
  );
  if (consequenceMissions.length) candidates = consequenceMissions;
  if (candidates.length > 1) {
    const alternatives = candidates.filter(
      (operation) => operation.id != S.lastAssignmentId,
    );
    if (alternatives.length) candidates = alternatives;
  }
  if (!candidates.length) return;
  const commandStanding = Math.max(
      -20,
      Math.min(20, Number(S.commandStanding) || 0),
    ),
    assignmentBias = Math.max(-1, Math.min(1, commandStanding / 6)),
    score = (operation) =>
      MSK.indexOf(operation.rank) * assignmentBias,
    bestScore = Math.max(...candidates.map(score)),
    preferred = candidates.filter((operation) => score(operation) >= bestScore - 0.5),
    operation = P(preferred),
    squad = examSquad();
  S.assignment = {
    ...operation,
    status: "offered",
    stage: 0,
    phase: 0,
    successes: 0,
    failures: 0,
    preparationSuccesses: 0,
    squad,
  };
  S.lastAssignmentDay = S.day;
  S.lastAssignmentId = operation.id;
  log(
    `📜 <b>Tsunade designou você e ${squad.map((id) => N[id][0]).join(" e ")} para ${operation.title}.</b> Apresente-se na Torre do Hokage para partir.`,
    "bt",
  );
}

/* Chamados urgentes ficam pendentes até uma decisão; atender exige viagem normal. */
function chooseUrgent(response) {
  const event = S.urgent;
  if (!event) return;
  if (response == "self") {
    event.response = "self";
    S.loc = event.loc;
    S.pres = {};
    log(
      `🚨 Você parte imediatamente para ${L[event.loc][1]} e atende “${event.title}”.`,
      "bt",
    );
    answerUrgent();
    return;
  } else if (response == "ignored") {
    event.response = "ignored";
    log(
      `Você decide não intervir em “${event.title}”. A situação continuará evoluindo pelos próximos ${event.daysLeft} dia(s).`,
      "bad",
    );
  }
  render();
}

function goUrgent() {
  const event = S.urgent;
  if (!event) return log("Não há chamado urgente ativo.", "sys");
  if (event.response == "ignored")
    return log("Você decidiu não intervir neste chamado.", "sys");
  if (!event.response) event.response = "self";
  if (S.loc == event.loc) return answerUrgent();
  log(`🚶 Você parte para ${L[event.loc][1]} atender “${event.title}”.`, "bt");
  go(event.loc);
}

function askUrgentTeam() {
  const event = S.urgent;
  if (!event) return;
  const wd = ew(),
    squad = (S.team || []).filter(
      (id) =>
        !wd.dead[id] &&
        !(wd.hurt[id] && slot() < wd.hurt[id].until) &&
        !(wd.away[id] && S.day <= wd.away[id].until),
    );
  const stat =
      event.goal == "retrieve"
        ? "int"
        : event.goal == "protect"
          ? "tai"
          : "vel",
    bonus = Math.min(
      4,
      squad.reduce((total, id) => total + (allyTestStat(id) == stat ? 2 : 0), 0),
    ),
    // habilidade do aliado mais forte (o jogador está em outro lugar)
    skill = squad.length
      ? Math.max(...squad.map((id) => Math.round(6 + N[id][4][1] * 0.8)))
      : 4,
    roll = R(1, 20),
    dc = 14 + Math.max(0, MSK.indexOf(event.rank) - 1) * 2,
    total = roll + skill + bonus;
  S.urgent = null;
  tick(1);
  log(
    `<b>🧭 Apoio solicitado:</b> ${squad.length ? squad.map((id) => N[id][0]).join(" e ") : "uma patrulha local"} assume “${event.title}”. ${roll} + ${skill}${bonus ? ` + equipe ${bonus}` : ""} = ${total} (precisa de ${dc}).`,
    "sys",
  );
  if (total >= dc) {
    const reward = Math.round(event.reward * 0.65),
      xp = Math.round(event.xp * 0.6),
      payout = completeMission(
        event.rank,
        reward,
        xp,
        false,
        missionBonuses(event),
      );
    recordTeamPairMission(squad, true);
    if (event.npc) rel(event.npc, 3);
    squad.forEach((id) =>
      remember(id, "missao", `Ajudaram na ocorrência “${event.title}”.`, {
        affinity: 3,
        trust: 2,
        respect: 1,
        sharedMissions: 1,
      }),
    );
    settlePromises(squad, event.title);
    log(
      `✅ O apoio concluiu a ocorrência. +${payout.ryo} ryō e +${payout.xp} XP${missionBonusText(payout)}.`,
      "ok",
    );
  } else {
    S.rep = Math.max(0, (S.rep || 0) - 2);
    registerMarketCrisis(
      event,
      "A ocorrência terminou sem solução e os comerciantes estão repondo suprimentos.",
    );
    if (event.npc) {
      rel(event.npc, -3);
      if (MORTAL.includes(event.npc) && MSK.indexOf(event.rank) >= 2)
        hurtNpc(event.npc, MSK.indexOf(event.rank) >= 3);
    }
    if (squad.length) {
      const injured = P(squad);
      hurtNpc(injured, false);
      squad.forEach((id) =>
        remember(
          id,
          "contratempo",
          `A equipe sofreu um revés em “${event.title}”.`,
          { affinity: -2, trust: -2 },
        ),
      );
      log(
        `❌ A equipe não conseguiu concluir a ocorrência. ${N[injured][0]} voltou ferido(a); ${S.rogue?.active ? "as pessoas envolvidas perderam confiança" : "a vila perdeu reputação"} e a missão foi perdida.`,
        "bad",
      );
    } else
      log(
        `❌ A patrulha não conseguiu concluir a ocorrência. ${S.rogue?.active ? "As pessoas envolvidas perderam confiança" : "A vila perdeu reputação"} e a missão foi perdida.`,
        "bad",
      );
  }
  render();
}

function missUrgent(event) {
  const ignored = event.response == "ignored",
    penalty = ignored ? 4 : 2,
    community = S.rogue?.active ? "a comunidade local" : "a vila";
  S.rep = Math.max(0, (S.rep || 0) - penalty);
  if (event.npc) {
    rel(event.npc, -penalty);
    if (MORTAL.includes(event.npc) && MSK.indexOf(event.rank) >= 2)
      hurtNpc(event.npc, ignored && MSK.indexOf(event.rank) >= 3);
  }
  registerMarketCrisis(
    event,
    "O chamado urgente passou sem atendimento; a interrupção afetou o abastecimento local.",
  );
  S.urgent = null;
  log(
    ignored
      ? `⌛ “${event.title}” evoluiu sem intervenção. ${community} perdeu ${penalty} de reputação e ${event.npc ? N[event.npc][0] + " perdeu confiança em você." : ""}`
      : `⌛ “${event.title}” passou sem atendimento. ${community} perdeu ${penalty} de reputação.`,
    "bad",
  );
}

function missionBanter(team, success, title, approach) {
  (team || []).forEach((id) =>
    remember(id, "missao", `Em “${title}”, a equipe tentou: ${approach}.`, {
      affinity: success ? 1 : -1,
      trust: success ? 2 : -1,
      respect: success ? 1 : 0,
      sharedMissions: 1,
    }),
  );
  if (approach == "conclusão da missão") {
    const roleMember = (team || []).find(
      (member) => missionRoleOf(member) && bondOf(member).trust >= 0,
    );
    if (roleMember) {
      const role = missionRoleOf(roleMember);
      remember(
        roleMember,
        "papel de equipe",
        `${N[roleMember][0]} atuou como ${role.label.toLowerCase()} em “${title}”.`,
        success ? { trust: 1, respect: 1 } : {},
      );
      log(
        success
          ? `<b>${N[roleMember][0]}:</b> “Minha função ajudou a equipe. Vamos manter esse entrosamento.” <small>(${role.label})</small>`
          : `<b>${N[roleMember][0]}:</b> “Na próxima, vamos rever como cada um pode ajudar melhor.” <small>(${role.label})</small>`,
        success ? "ok" : "sys",
      );
    }
  }
  const banterTeam = (team || []).filter((member) => MISSION_BANTER[member]),
    id =
      banterTeam.find(
        (member) =>
          S.promises?.[member]?.status == "pending" &&
          S.promises[member].commentedMission != title,
      ) ||
      banterTeam.find((member) => bondOf(member).rivalry >= 2) ||
      banterTeam.find(
        (member) =>
          bondOf(member).trust >= 4 && bondOf(member).sharedMissions >= 3,
      ) ||
      banterTeam[0];
  if (!id) return;
  const bond = bondOf(id),
    promise = S.promises?.[id],
    pendingPromise =
      promise?.status == "pending" &&
      promise.commentedMission != title,
    line =
      bond.rivalry >= 2
        ? success
          ? `Não foi ruim. Ainda quero provar que meu plano teria sido melhor em “${esc(title)}”.`
          : `Eu avisei que esse plano era arriscado em “${esc(title)}”. Vamos tentar do meu jeito agora.`
        : pendingPromise
          ? success
            ? `Você veio como prometeu. Vamos terminar “${esc(title)}” juntos.`
            : `Eu confiei na sua promessa. Ainda podemos concluir “${esc(title)}”, mas não me deixe para trás.`
          : success && bond.trust >= 4 && bond.sharedMissions >= 3
            ? `Já passamos por muita coisa juntos. Eu sabia que você conseguiria em “${esc(title)}”.`
            : P(MISSION_BANTER[id][success ? "success" : "setback"]);
  if (pendingPromise) promise.commentedMission = title;
  const personalizedLine = line.replace("{title}", esc(title));
  log(
    `<b>${N[id][0]}:</b> “${personalizedLine}” <small>(${esc(approach)})</small>`,
    success ? "sys" : "bad",
  );
}

function resolveBondScene(team, activity, stat, total, dc, context) {
  let adjustedTotal = total,
    relationship = "";
  if (!activity.bondDisagreementUsed) {
    const rival = (team || []).find((id) => {
      const bond = bondOf(id);
      return bond.rivalry >= 2 && allyTestStat(id) != stat;
    });
    if (rival) {
      activity.bondDisagreementUsed = true;
      adjustedTotal -= 2;
      relationship = "rivalidade −2";
      remember(
        rival,
        "divergência",
        `${N[rival][0]} discordou do plano “${context}” por preferir sua própria especialidade.`,
      );
      log(
        `<b>${N[rival][0]}:</b> “Esse plano ignora o que eu faço melhor. Eu teria escolhido outra abordagem.” <small>(a rivalidade atrapalha a coordenação)</small>`,
        "sys",
      );
    }
  }
  let success = adjustedTotal >= dc;
  if (!success && dc - adjustedTotal <= 3 && !activity.bondCoverUsed) {
    const friend = (team || []).find((id) => {
      const bond = bondOf(id);
      return bond.trust >= 4 && bond.rivalry <= 0;
    });
    if (friend) {
      activity.bondCoverUsed = true;
      adjustedTotal = dc;
      success = true;
      relationship = relationship
        ? `${relationship} · apoio de amigo`
        : "apoio de amigo";
      remember(friend, "cobertura", `Ajudou você a corrigir um erro em “${context}”.`, {
        trust: 1,
        sharedMoments: 1,
      });
      log(
        `<b>${N[friend][0]}:</b> “Eu cubro você! Refaça o movimento; ainda dá tempo.” <small>(a confiança entre vocês evita que o erro vire uma falha)</small>`,
        "ok",
      );
    }
  }
  return { total: adjustedTotal, success, relationship };
}

function missionStyle(mission) {
  const normalize = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    title = normalize(mission[1]),
    description = normalize(mission[2]),
    context = `${title} ${description}`,
    goal = mission[6];
  if (
    /infiltr|espiao|espionagem|furtiv|disfarc|silencio|silencios|invadir a base|esgueir/.test(
      context,
    )
  )
    return "stealth";
  if (
    /investig|rastro|pista|pergaminho|document|informante|suspeit|recuperar/.test(
      context,
    )
  )
    return "investigation";
  if (
    /sobreviv|sem suprimentos|isolad[oa]|perdido na floresta|abrigo improvisado/.test(
      context,
    )
  )
    return "survival";
  if (goal == "escort" || /escolt|comboio|caravana|construtor/.test(context))
    return "escort";
  if (goal && MISSION_ROUTINES[goal]) return goal;
  if (/resgat|socorr|desaparecid|ferido|sequestrad/.test(title))
    return "rescue";
  if (/proteg|defesa|vigilia|guard|civis|evacu|jardim|capinar/.test(title))
    return "protect";
  if (/escolt|comboio|caravana|suprimento|construtor/.test(title))
    return "escort";
  if (/entreg|mensagem|mensageiro|levar/.test(title)) return "deliver";
  if (
    /document|pergaminho|investig|rastro|recuper|buscar|busca|pista|captur|procur|perdid|espiao|patrulh|rastre/.test(
      title,
    )
  )
    return "retrieve";
  if (/resgat|socorr|desaparecid|ferido|sequestrad/.test(description))
    return "rescue";
  if (
    /proteg|defesa|vigilia|guard|civis|evacu|jardim|capinar/.test(description)
  )
    return "protect";
  if (/escolt|comboio|caravana|suprimento|construtor/.test(description))
    return "escort";
  if (/entreg|mensagem|mensageiro|levar/.test(description)) return "deliver";
  if (
    /document|pergaminho|investig|rastro|recuper|buscar|busca|pista|captur|procur|perdid|espiao|patrulh|rastre/.test(
      context,
    )
  )
    return "retrieve";
  return mission[3] ? "combat" : "deliver";
}

function missionDays(rank) {
  return { D: 1, C: 1, B: 2, A: 3, S: 4 }[rank] || 1;
}

function missionFinalStages(rank) {
  return { D: 1, C: 1, B: 2, A: 2, S: 3 }[rank] || 1;
}

function missionCategoryLabel(style) {
  return (
    {
      stealth: "Infiltração",
      investigation: "Investigação",
      escort: "Escolta",
      survival: "Sobrevivência",
      combat: "Combate",
      retrieve: "Busca e recuperação",
      deliver: "Entrega",
      rescue: "Resgate",
      protect: "Proteção",
    }[style] || "Operação"
  );
}

// A previsão da partida vale por toda a operação e permite planejar a abordagem.
const MISSION_WEATHER_MODIFIERS = {
  "Neblina matinal": { stealth: 2, investigation: -1, retrieve: -1 },
  "Chuva leve": {
    stealth: 1,
    rescue: 1,
    investigation: -1,
    retrieve: -1,
    escort: -1,
  },
  "Chuva forte": {
    stealth: 2,
    investigation: -2,
    retrieve: -2,
    escort: -2,
    deliver: -1,
  },
  Tempestade: {
    stealth: 2,
    investigation: -2,
    retrieve: -2,
    escort: -2,
    deliver: -2,
    survival: -1,
    rescue: -1,
  },
  "Calor intenso": { survival: -2 },
  "Vento forte": {
    stealth: -1,
    investigation: 1,
    retrieve: 1,
    escort: -2,
    deliver: -1,
  },
  "Céu nublado": { stealth: 1, rescue: 1 },
  "Frio intenso": { survival: -2, escort: -1 },
  Neve: {
    survival: -2,
    investigation: -1,
    retrieve: -1,
    escort: -2,
    deliver: -1,
    rescue: -1,
  },
  "Céu limpo": {
    stealth: -1,
    investigation: 1,
    retrieve: 1,
    escort: 1,
    deliver: 1,
  },
};

function missionWeatherModifier(weather, style) {
  return MISSION_WEATHER_MODIFIERS[weather]?.[style] || 0;
}

function missionWeatherBrief(weather, style) {
  const modifier = missionWeatherModifier(weather, style);
  const effect =
    modifier > 0
      ? `vantagem de +${modifier} nos testes`
      : modifier < 0
        ? `penalidade de ${Math.abs(modifier)} nos testes`
        : "sem modificador tático";
  return `${weather || "Céu limpo"} · ${missionCategoryLabel(style)}: ${effect}.`;
}

function missionRoutineStyle(mission) {
  const style = missionStyle(mission);
  return MISSION_ROUTINES[style]
    ? style
    : MISSION_ROUTINES[mission[6]]
      ? mission[6]
      : mission[3]
        ? "combat"
        : "deliver";
}

const MISSION_FIELD_NOTES = {
  stealth: [
    "A patrulha mudou o intervalo entre as rondas desde o último relatório.",
    "Um sinal luminoso inesperado pode comprometer o disfarce.",
    "Há marcas recentes de outro grupo no caminho de infiltração.",
  ],
  investigation: [
    "Duas testemunhas descrevem a mesma cena de maneiras incompatíveis.",
    "Uma pista foi movida depois da passagem da equipe.",
    "Alguém observa a investigação de longe, sem se aproximar.",
  ],
  retrieve: [
    "A área foi revirada; é preciso distinguir rastros recentes dos antigos.",
    "O objeto procurado está perto de uma rota usada por civis.",
    "Uma anotação parcial sugere que outra pessoa chegou antes.",
  ],
  escort: [
    "O trajeto previsto ficou congestionado e os passageiros estão inquietos.",
    "O grupo protegido reconhece um marco que não aparece no mapa.",
    "Pegadas paralelas à estrada sugerem que alguém acompanha a escolta.",
  ],
  rescue: [
    "Um sinal fraco vem de uma direção diferente da indicada no pedido.",
    "A pessoa procurada deixou uma marca de orientação para quem viesse ajudar.",
    "A rota de retirada pode ficar bloqueada se a equipe demorar.",
  ],
  protect: [
    "Os protegidos discordam sobre qual saída deve permanecer aberta.",
    "O ponto de observação escolhido ficou exposto ao clima.",
    "Um ruído fora do perímetro pode ser uma distração ou um pedido de ajuda.",
  ],
  survival: [
    "A chuva ameaça os suprimentos que ainda estão secos.",
    "A equipe encontra abrigo, mas há sinais de que alguém passou a noite ali.",
    "O vento mudou e apagou parte das marcas deixadas no caminho.",
  ],
  combat: [
    "O adversário escolheu um terreno que limita ataques à distância.",
    "Há sinais de que o inimigo espera reforços, mas ninguém sabe quando chegarão.",
    "O confronto pode atrair moradores se a equipe não controlar o perímetro.",
  ],
  deliver: [
    "A pessoa que receberia a encomenda não está no ponto combinado.",
    "A carga parece intacta, mas o selo externo foi tocado.",
    "Um desvio curto passa por uma área que os moradores pediram para evitar.",
  ],
};

function missionFieldNote(contract) {
  const notes = MISSION_FIELD_NOTES[contract.style] || MISSION_FIELD_NOTES.combat,
    index = Math.floor(
      hs(
        contract.mission[1],
        contract.location || S.loc,
        contract.weather || S.weather,
        contract.day,
        contract.phase,
      ) * notes.length,
    ),
    location = L[contract.location || S.loc]?.[1] || "a região";
  return `${notes[index]} A equipe está em ${location}; a missão é “${contract.mission[1]}”.`;
}

function beginMultiDayMission(mission, index = -1, story = null, scene = null) {
  if (S.activeContract || M || B || S.assignment?.status == "active")
    return log(
      "Conclua ou retome a missão atual antes de iniciar outra.",
      "sys",
    );
  const style = missionStyle(mission),
    days = missionDays(mission[0]),
    contract = {
      mission: mission.slice(),
      location: S.loc,
      weather: S.weather || "Céu limpo",
      index,
      story,
      scene,
      status: "operation",
      style,
      day: 1,
      days,
      phase: 0,
      successes: 0,
      failures: 0,
      secondaryObjectives: 0,
      preparationSuccesses: 0,
      decisions: [],
      suspicion: 10,
      integrity: 100,
      clues: [],
      evidenceScore: 0,
      crossChecked: false,
      supplies: 3,
      shelter: 20,
      allyAssistUsed: {},
      reserve: S.mc ? Math.round((S.ck / S.mc) * 100) : 0,
    };
  if (style == "investigation") contract.suspect = R(0, 2);
  S.activeContract = contract;
  mode = "contract";
  log(
    `📜 <b>${mission[1]}</b> começa como uma operação de ${contract.days} etapa(s) estratégica(s), conforme o rank ${mission[0]}.`,
    "bt",
  );
  log(
    `🧭 Briefing: ${L[contract.location][1]} sob ${contract.weather.toLowerCase()}. ${
      S.team.length
        ? `Equipe disponível: ${S.team.map((id) => N[id][0]).join(" e ")}.`
        : "Você inicia sem aliados na equipe."
    }`,
    "sys",
  );
  if (S.t) tick(3 - S.t);
  render();
}

function resumeMultiDayMission() {
  const contract = S.activeContract;
  if (!contract) return;
  contract.clues = Array.isArray(contract.clues) ? contract.clues : [];
  contract.evidenceScore = Number.isFinite(contract.evidenceScore)
    ? Math.max(0, Math.min(3, contract.evidenceScore))
    : Math.min(3, contract.clues.length);
  contract.crossChecked = contract.crossChecked === true;
  if (contract.status == "final") {
    const mission = contract.mission,
      n = contract.index >= 0 ? missionFinalStages(mission[0]) : 1;
    M = {
      m: mission,
      i: contract.index,
      s: contract.finalS || 0,
      n,
      failures: contract.failures || 0,
      successes: contract.successes || 0,
      secondaryObjectives: contract.secondaryObjectives || 0,
      preparationSuccesses: contract.preparationSuccesses || 0,
      step: contract.scene,
      story: contract.story || null,
      decisions: contract.decisions || [],
      operation: contract.style,
      operationAmbush: !!contract.operationAmbush,
      investigationBonus: contract.investigationBonus || 0,
      weather: contract.weather || S.weather,
      bondCoverUsed: !!contract.bondCoverUsed,
      bondDisagreementUsed: !!contract.bondDisagreementUsed,
    };
    return nx();
  }
  if (contract.status == "operation") {
    mode = "contract";
    render();
    return;
  }
  mode = "contract";
  render();
}

function missionRoutinePick(index) {
  const contract = S.activeContract;
  if (!contract || contract.status != "routine") return;
  const scene = MISSION_ROUTINES[contract.style][contract.phase],
    choice = scene?.[1][index];
  if (!choice) return;
  const missionData = missionContext(contract.mission, contract.style),
    rank = MSK.indexOf(contract.mission[0]),
    bonus = teamBonus(choice[1]),
    roleBonus = missionRoleBonus(choice[1], missionData),
    styleBonus = styleTestBonus(choice[1]),
    identityBonus = identityTestBonus(choice[1], missionData),
    weatherBonus = missionWeatherModifier(contract.weather, contract.style),
    dc = Math.max(
      6,
      12 +
        rank * 2 -
        Math.floor((S.rep || 0) / 30) -
        missionDifficultyBonus(missionData),
    ),
    roll = R(1, 20),
    baseTotal = roll + S[choice[1]] + bonus + roleBonus + styleBonus + identityBonus + weatherBonus,
    bondScene = resolveBondScene(
      S.team,
      contract,
      choice[1],
      baseTotal,
      dc,
      contract.mission[1],
    ),
    total = bondScene.total,
    success = bondScene.success;
  log(
    `🎲 ${choice[0]}: ${roll} + ${S[choice[1]]}${bonus ? ` + equipe ${bonus}` : ""}${roleBonus ? ` + papel ${roleBonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identityBonus ? ` + identidade ${identityBonus}` : ""}${weatherBonus ? ` ${weatherBonus > 0 ? "+" : "−"} clima ${Math.abs(weatherBonus)}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
    "sys",
  );
  if (success) {
    contract.successes++;
    contract.preparationSuccesses++;
    gain(4 + rank * 2);
    log(
      "A rotina funciona e a equipe avança com mais segurança. Ela também melhora a recompensa final.",
      "ok",
    );
  } else {
    contract.failures++;
    const damage = 3 + rank * 2;
    S.hp = Math.max(1, S.hp - damage);
    S.fatigue = Math.min(100, (S.fatigue || 0) + 5);
    log(
      `O plano encontra dificuldades. Você perde ${damage} HP e a equipe segue com cautela.`,
      "bad",
    );
  }
  if (choice[2] == "heal") {
    const healed = Math.min(12, S.mh - S.hp);
    S.hp += healed;
    if (healed)
      log(`🩹 Você atende os ferimentos e recupera ${healed} HP.`, "ok");
  }
  if (choice[2] == "chakra") {
    S.ck = Math.min(S.mc, S.ck + 10);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 8);
    log("💠 Você recupera 10 chakra e reduz a fadiga.", "ok");
  }
  if (choice[2] == "rest") {
    S.hp = Math.min(S.mh, S.hp + 6);
    S.ck = Math.min(S.mc, S.ck + 6);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 12);
    log("🌙 A pausa recupera um pouco de vida, chakra e energia.", "ok");
  }
  contract.phase++;
  if (contract.phase >= MISSION_ROUTINE_PHASES.length) {
    missionBanter(
      S.team,
      success,
      contract.mission[1],
      `rotina do dia ${contract.day}`,
    );
    contract.phase = 0;
    if (contract.day >= contract.days) {
      contract.status = "final";
      contract.finalS = 0;
      log(
        `🏁 Os ${contract.days} dias de preparação terminaram. É hora de concluir o objetivo principal.`,
        "bt",
      );
    } else {
      contract.day++;
      log(
        `🌅 Dia ${contract.day}/${contract.days}: uma nova rotina começa na operação.`,
        "bt",
      );
    }
  }
  tick(1);
  if (contract.status == "final") resumeMultiDayMission();
  else render();
}

function missionOperationScene(contract) {
  const operation = MISSION_OPERATIONS[contract.style];
  const scene = operation
    ? [
      operation.scenes[contract.phase % operation.scenes.length],
      operation.choices.map(([label, stat, id]) => ({ label, stat, id })),
      ]
    : (() => {
      const routine =
        MISSION_ROUTINES[contract.style] || MISSION_ROUTINES.combat,
        selected = routine[contract.phase % routine.length];
      return [
        selected[0],
        selected[1].map(([label, stat]) => ({ label, stat, id: "routine" })),
      ];
      })(),
    choices = scene[1].slice();
  (S.team || [])
    .filter((id) => N[id] && !ew().dead[id] && !contract.allyAssistUsed?.[id])
    .forEach((id) =>
      choices.push({
      label: `${N[id][0]} assume a dianteira com sua especialidade`,
      stat: allyTestStat(id),
      id: "ally",
      allyId: id,
      }),
    );
  return [`${scene[0]} ${missionFieldNote(contract)}`, choices];
}

function completeMissionOperation(contract) {
  if (contract.style == "stealth" && contract.suspicion >= 70) {
    contract.failures++;
    contract.operationAmbush = true;
    log(
      "🚨 A suspeita chegou ao limite. A patrulha percebeu a infiltração e prepara uma emboscada.",
      "bad",
    );
  }
  if (contract.style == "escort" && contract.integrity < 40) {
    contract.failures++;
    log(
      "⚠️ A carga chegou bastante danificada; o objetivo final será mais difícil.",
      "bad",
    );
  }
  if (contract.style == "survival") {
    const shortage =
      (contract.supplies <= 0 ? 1 : 0) +
      (contract.reserve < 25 ? 1 : 0) +
      (contract.shelter < 20 ? 1 : 0);
    if (shortage) {
      contract.failures += shortage;
      contract.resourcePenalty = shortage;
      log(
        `⚠️ Você chega com recursos insuficientes. Dificuldade final +${shortage}.`,
        "bad",
      );
    }
  }
  contract.status = "final";
  contract.finalS = 0;
  tick(1);
  log(
    `🏁 A operação de ${contract.days} etapa(s) terminou. Agora resolva o objetivo principal.`,
    "bt",
  );
  save();
  resumeMultiDayMission();
}

function missionOperationPick(index) {
  const contract = S.activeContract;
  if (!contract || contract.status != "operation") return;
  const scene = missionOperationScene(contract),
    choice = scene[1][index];
  if (!choice) return;
  const missionData = missionContext(contract.mission, contract.style),
    rank = MSK.indexOf(contract.mission[0]),
    worldBonus = worldCheckBonus(contract.mission),
    pressure =
      contract.style == "stealth"
        ? Math.floor(contract.suspicion / 35)
        : contract.style == "investigation"
          ? Math.floor((contract.alert || 0) / 40)
          : contract.style == "escort"
            ? Math.floor((contract.routeRisk || 0) / 45)
            : 0,
    dc = Math.max(
      6,
      12 +
        rank * 2 +
        pressure -
        worldBonus -
        missionDifficultyBonus(missionData),
    ),
    roll = R(1, 20),
    team = teamBonus(choice.stat),
    roleBonus = missionRoleBonus(choice.stat, missionData),
    style = styleTestBonus(choice.stat),
    identity = identityTestBonus(choice.stat, missionData),
    weatherBonus = missionWeatherModifier(contract.weather, contract.style),
    ally = choice.id == "ally" ? choice.allyId : "",
    allyBond = ally ? bondOf(ally) : null,
    allyBonus = ally
      ? 2 + Math.min(2, Math.floor((allyBond.trust + allyBond.sharedMissions) / 4))
      : 0,
    baseTotal = roll + S[choice.stat] + team + roleBonus + style + identity + allyBonus + weatherBonus,
    bondScene = resolveBondScene(
      S.team,
      contract,
      choice.stat,
      baseTotal,
      dc,
      contract.mission[1],
    ),
    total = bondScene.total,
    success = bondScene.success;
  if (ally) {
    contract.allyAssistUsed = contract.allyAssistUsed || {};
    contract.allyAssistUsed[ally] = true;
  }
  log(
    `🎲 ${choice.label}: ${roll} + ${S[choice.stat]}${team ? ` + equipe ${team}` : ""}${roleBonus ? ` + papel ${roleBonus}` : ""}${allyBonus ? ` + apoio de ${N[ally]?.[0]} ${allyBonus}` : ""}${style ? ` + estilo ${style}` : ""}${identity ? ` + identidade ${identity}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${weatherBonus ? ` ${weatherBonus > 0 ? "+" : "−"} clima ${Math.abs(weatherBonus)}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
    "sys",
  );
  contract.decisions = contract.decisions || [];
  contract.decisions.push({
    choice: choice.label,
    stat: choice.stat,
    success,
  });
  contract.phase++;
  contract.day = contract.phase + 1;
  if (success) {
    contract.successes++;
    contract.preparationSuccesses++;
    gain(4 + rank * 2);
    log("A abordagem funciona e a equipe avança.", "ok");
  } else {
    contract.failures++;
    const damage = 3 + rank * 2;
    S.hp = Math.max(1, S.hp - damage);
    S.fatigue = Math.min(100, (S.fatigue || 0) + 4);
    log(
      `A abordagem encontra resistência. Você perde ${damage} HP e a operação fica mais perigosa.`,
      "bad",
    );
  }
  if (ally) {
    remember(
      ally,
      "apoio de missão",
      `${success ? "Liderou" : "Tentou liderar"} a equipe em “${contract.mission[1]}”.`,
      success
        ? { affinity: 1, trust: 1, respect: 1, sharedMissions: 1 }
        : { sharedMissions: 1 },
    );
    log(
      success
        ? `🤝 ${N[ally][0]} e você encontraram um ritmo melhor de trabalho.`
        : `${N[ally][0]} continua ao seu lado, embora a abordagem não tenha funcionado como esperavam.`,
      success ? "ok" : "sys",
    );
  }
  if (contract.style == "stealth") {
    const effects = {
      disguise: success ? -12 : 8,
      shadow: success ? -5 : 18,
      diversion: success ? -18 : 10,
    };
    contract.suspicion = Math.max(
      0,
      Math.min(100, contract.suspicion + (effects[choice.id] || 0)),
    );
    if (contract.suspicion >= 70)
      log("⚠️ Os guardas estão em alerta máximo.", "bad");
  } else if (contract.style == "investigation") {
    contract.alert = Math.max(
      0,
      Math.min(100, (contract.alert || 0) + (success ? -5 : 18)),
    );
    if (success) {
      const clues = INVESTIGATION_CLUES[contract.suspect],
        clueCount = S.specialization == "tracking" && S.lv >= 8 ? 2 : 1,
        cluesBefore = contract.clues.length;
      for (
        let clueIndex = 0;
        clueIndex < clueCount && contract.clues.length < clues.length;
        clueIndex++
      ) {
        const clue = clues[contract.clues.length];
        if (!contract.clues.includes(clue)) {
          contract.clues.push(clue);
          log(`🔎 Pista confirmada: ${clue}`, "ok");
        }
      }
      contract.evidenceScore = Math.min(
        3,
        (contract.evidenceScore || 0) + contract.clues.length - cluesBefore,
      );
    }
  } else if (contract.style == "escort") {
    const effect =
      choice.id == "safe"
        ? [success ? 5 : -12, success ? -12 : 14]
        : choice.id == "guard"
          ? [success ? 3 : -18, success ? -16 : 20]
          : [success ? -4 : -22, success ? -5 : 25];
    contract.integrity = Math.max(
      0,
      Math.min(100, contract.integrity + effect[0]),
    );
    contract.routeRisk = Math.max(
      0,
      Math.min(100, (contract.routeRisk || 0) + effect[1]),
    );
  } else if (contract.style == "survival") {
    contract.supplies = Math.max(0, contract.supplies - 1);
    if (choice.id != "shelter")
      contract.shelter = Math.max(0, contract.shelter - 8);
    if (choice.id == "forage")
      contract.supplies = Math.max(
        0,
        Math.min(contract.days + 2, contract.supplies + (success ? 1 : -1)),
      );
    if (choice.id == "shelter")
      contract.shelter = Math.max(
        0,
        Math.min(100, contract.shelter + (success ? 25 : -15)),
      );
    if (choice.id == "conserve") {
      S.ck = Math.max(0, S.ck - (success ? 2 : 8));
      contract.reserve = S.mc ? Math.round((S.ck / S.mc) * 100) : 0;
    }
    if (choice.id == "rest") {
      if (success) {
        S.fatigue = Math.max(0, (S.fatigue || 0) - 12);
        S.hp = Math.min(S.mh, S.hp + 4);
        S.ck = Math.min(S.mc, S.ck + 8);
      } else S.ck = Math.max(0, S.ck - 8);
      contract.reserve = S.mc ? Math.round((S.ck / S.mc) * 100) : 0;
    }
    if (!success && choice.id != "rest" && choice.id != "conserve") {
      S.ck = Math.max(0, S.ck - 8);
      contract.reserve = S.mc ? Math.round((S.ck / S.mc) * 100) : 0;
    }
  }
  if (contract.phase >= contract.days) {
    if (contract.style == "investigation") {
      contract.status = "deduction";
      log(
        "🧩 Compare as pistas e identifique quem está por trás do caso.",
        "bt",
      );
    } else return completeMissionOperation(contract);
  }
  tick(1);
  save();
  render();
}

function resolveInvestigation(suspect) {
  const contract = S.activeContract;
  if (
    !contract ||
    contract.status != "deduction" ||
    !INVESTIGATION_SUSPECTS[suspect]
  )
    return;
  contract.accused = suspect;
  contract.status = "approach";
  log(
    `🧩 Você registra ${INVESTIGATION_SUSPECTS[suspect]} como principal suspeito. Agora escolha como agir com as provas reunidas.`,
    "bt",
  );
  save();
  render();
}

function crossCheckInvestigation() {
  const contract = S.activeContract;
  if (
    !contract ||
    contract.status != "deduction" ||
    contract.crossChecked ||
    contract.clues.length >= 3
  )
    return;
  contract.crossChecked = true;
  const roll = R(1, 20),
    total = roll + S.int + Math.min(3, Math.floor((S.team || []).length * 1.5)),
    clue = INVESTIGATION_CLUES[contract.suspect][contract.clues.length];
  if (total >= 15 && clue) {
    contract.clues.push(clue);
    contract.evidenceScore = Math.min(3, (contract.evidenceScore || 0) + 1);
    log(`🔎 Você cruza depoimentos e confirma mais uma pista: ${clue}`, "ok");
  } else {
    contract.alert = Math.min(100, (contract.alert || 0) + 18);
    contract.failures++;
    log(
      "⚠️ As testemunhas não concordam. O suspeito percebe que você está investigando e fica mais difícil agir sem chamar atenção.",
      "bad",
    );
  }
  tick(1);
  save();
  render();
}

function resolveInvestigationApproach(approach) {
  const contract = S.activeContract;
  if (
    !contract ||
    contract.status != "approach" ||
    !["report", "shadow", "protect"].includes(approach)
  )
    return;
  const correct = contract.accused == contract.suspect,
    evidence = Math.max(contract.evidenceScore || 0, contract.clues.length),
    faction = FACTION_BY_REGION[REG[contract.location]],
    setStanding = (amount, reason) => {
      if (faction) changeFactionStanding(faction, amount, reason);
    };
  if (approach == "report") {
    if (correct && evidence >= 2) {
      contract.investigationBonus = 2;
      setStanding(4, "Relatório confirmado por provas independentes");
      log("✅ O relatório é sustentado por várias pistas. A autoridade local age sem expor a equipe.", "ok");
    } else if (correct) {
      contract.investigationBonus = 1;
      contract.failures++;
      setStanding(1, "Relatório correto, mas com provas limitadas");
      log("✅ O suspeito era o responsável, mas faltam provas para uma acusação completa. O objetivo fica mais difícil.", "sys");
    } else {
      contract.failures += 2;
      contract.operationAmbush = true;
      setStanding(-5, "Acusação oficial contra a pessoa errada");
      log("❌ A acusação oficial estava errada. O verdadeiro suspeito prepara uma emboscada e a confiança local cai.", "bad");
    }
  } else if (approach == "shadow") {
    if (correct) {
      contract.investigationBonus = evidence >= 2 ? 2 : 1;
      setStanding(2, "Suspeito seguido sem colocar testemunhas em risco");
      log("🕵️ A equipe segue o rastro em silêncio e confirma o responsável sem alertar os moradores.", "ok");
    } else {
      contract.failures++;
      if ((contract.alert || 0) >= 50) contract.operationAmbush = true;
      log("🕵️ O rastro não confirma a suspeita. A equipe perde tempo e pode ter sido percebida.", "sys");
    }
  } else {
    contract.secondaryObjectives++;
    if (correct) {
      contract.investigationBonus = 1;
      setStanding(3, "Possíveis alvos protegidos durante a investigação");
      log("🛡️ Você protege os possíveis alvos antes de agir. A investigação continua com a população em segurança.", "ok");
    } else {
      contract.failures++;
      setStanding(1, "Moradores protegidos apesar da pista incorreta");
      log("🛡️ A pista estava errada, mas os moradores foram avisados e não ficam expostos à reação do suspeito.", "sys");
    }
  }
  contract.investigationApproach = approach;
  completeMissionOperation(contract);
  save();
}

function syncMultiDayFinal() {
  const contract = S.activeContract;
  if (!contract || contract.status != "final" || !M) return;
  contract.finalS = M.s;
  contract.failures = M.failures || 0;
  contract.successes = M.successes || 0;
  contract.secondaryObjectives = M.secondaryObjectives || 0;
  contract.preparationSuccesses =
    M.preparationSuccesses || contract.preparationSuccesses || 0;
  contract.decisions = M.decisions || [];
  contract.bondCoverUsed = !!M.bondCoverUsed;
  contract.bondDisagreementUsed = !!M.bondDisagreementUsed;
  save();
}

function storyState() {
  S.story = S.story || {
    progress: {},
    completed: {},
    defeatedBosses: {},
    consequences: {},
    kzinnRumors: [],
  };
  S.story.progress = S.story.progress || {};
  S.story.completed = S.story.completed || {};
  S.story.defeatedBosses = S.story.defeatedBosses || {};
  S.story.consequences = S.story.consequences || {};
  S.story.kzinnRumors = Array.isArray(S.story.kzinnRumors)
    ? S.story.kzinnRumors
    : [];
  return S.story;
}

function recordFailedStoryAttempt(run, mission) {
  if (!run) return;
  const story = storyState(),
    metrics = story.metrics || (story.metrics = {}),
    arcMetrics =
      metrics[run.arcId] ||
      (metrics[run.arcId] = {
        successes: 0,
        failures: 0,
        protectiveDecisions: 0,
        decisions: [],
      }),
    decisions = mission?.decisions || [];
  arcMetrics.successes += mission?.successes || 0;
  arcMetrics.failures += (mission?.failures || 0) + 1;
  arcMetrics.decisions.push(
    ...decisions.map((decision) => ({
      ...decision,
      stage: run.stageIndex,
      failedAttempt: true,
    })),
  );
  arcMetrics.decisions = arcMetrics.decisions.slice(-40);
  arcMetrics.protectiveDecisions += decisions.filter(
    (decision) =>
      decision.success &&
      /proteg|trabalh|morador|civil|segur|evacu/i.test(decision.choice),
  ).length;
  save();
}

function worldConsequences() {
  const initial = {
    villageSafety: 50,
    villageTrust: 50,
    regions: {
      onda: {
        bridge: "unknown",
        workersInjured: false,
        residentTrust: 50,
      },
    },
    characterTrust: {},
    factions: {},
    factionHistory: [],
    escapedBosses: {},
    arcOutcomes: {},
    reconstruction: { konoha: "none" },
    decisions: [],
  };
  S.worldConsequences =
    S.worldConsequences && typeof S.worldConsequences == "object"
      ? S.worldConsequences
      : initial;
  const world = S.worldConsequences;
  world.regions = world.regions || {};
  world.regions.onda = Object.assign(
    { bridge: "unknown", workersInjured: false, residentTrust: 50 },
    world.regions.onda || {},
  );
  world.characterTrust = world.characterTrust || {};
  world.factions =
    world.factions && typeof world.factions == "object" && !Array.isArray(world.factions)
      ? world.factions
      : {};
  Object.keys(WORLD_FACTIONS).forEach((id) => {
    const score = Number(world.factions[id]);
    world.factions[id] = Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : 50;
  });
  world.factionHistory = Array.isArray(world.factionHistory)
    ? world.factionHistory
    : [];
  world.escapedBosses =
    world.escapedBosses && typeof world.escapedBosses == "object" && !Array.isArray(world.escapedBosses)
      ? world.escapedBosses
      : {};
  world.arcOutcomes = world.arcOutcomes || {};
  world.reconstruction = Object.assign(
    { konoha: "none" },
    world.reconstruction || {},
  );
  if (world.reconstruction.konoha == "none") {
    const outcome = world.arcOutcomes.konohadefesa?.konoha;
    if (outcome == "damaged") world.reconstruction.konoha = "needed";
    else if (outcome == "recovering")
      world.reconstruction.konoha = "ongoing";
  }
  world.decisions = Array.isArray(world.decisions) ? world.decisions : [];
  if (!Number.isFinite(world.villageSafety)) world.villageSafety = 50;
  if (!Number.isFinite(world.villageTrust)) world.villageTrust = 50;
  return world;
}

const clampWorldValue = (value) => Math.max(0, Math.min(100, value));

function factionStanding(id) {
  if (!WORLD_FACTIONS[id]) return 50;
  return worldConsequences().factions[id];
}

function changeFactionStanding(id, amount, reason = "") {
  if (!WORLD_FACTIONS[id] || !Number.isFinite(amount)) return 0;
  const world = worldConsequences(),
    before = world.factions[id],
    after = clampWorldValue(before + amount),
    change = after - before;
  if (!change) return 0;
  world.factions[id] = after;
  world.factionHistory.push({
    faction: id,
    amount: change,
    reason: String(reason || "Ações da equipe"),
    day: S.day,
  });
  world.factionHistory = world.factionHistory.slice(-24);
  return change;
}

const FACTION_IMPACT_BY_ARC = {
  ondas: {
    good: { waves: 12, konoha: 4 },
    mixed: { waves: 4 },
    poor: { waves: -12, konoha: -4 },
  },
  nuvem: {
    good: { kumo: 16, konoha: 4 },
    mixed: { kumo: 5 },
    poor: { kumo: -12, konoha: -3 },
  },
  chuva: {
    good: { ame: 18, konoha: 4, akatsuki: -8 },
    mixed: { ame: 5 },
    poor: { ame: -14, akatsuki: 6 },
  },
  "samurai-ferro": {
    good: { iron: 18, konoha: 4 },
    mixed: { iron: 6 },
    poor: { iron: -14, konoha: -3 },
  },
  "sinais-akatsuki": {
    good: { ame: 10, konoha: 8, akatsuki: -20 },
    mixed: { ame: 3, akatsuki: -8 },
    poor: { ame: -12, akatsuki: 14 },
  },
};

function applyStoryFactionImpact(arcId, quality) {
  const changes = FACTION_IMPACT_BY_ARC[arcId]?.[quality] || {};
  const applied = Object.entries(changes)
    .map(([id, amount]) => [id, changeFactionStanding(
      id,
      amount,
      `Desfecho de ${STORY_ARCS.find((arc) => arc.id == arcId)?.title || arcId}`,
    )])
    .filter(([, amount]) => amount);
  if (applied.length)
    log(
      `🏯 Relações atualizadas: ${applied.map(([id, amount]) => `${WORLD_FACTIONS[id].name} ${amount > 0 ? "+" : ""}${amount}`).join(" · ")}.`,
      "ok",
    );
}

function recordStoryBossEscape(enemyId, name, elementUsage = {}) {
  if (!enemyId) return;
  const world = worldConsequences(),
    previous = world.escapedBosses[enemyId] || {},
    preferredElement = Object.entries(elementUsage)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])[0]?.[0],
    count = (previous.count || 0) + 1;
  world.escapedBosses[enemyId] = {
    name: name || EN[enemyId]?.[0] || enemyId,
    count,
    day: S.day,
    adaptedElement: preferredElement || previous.adaptedElement || "",
  };
  world.villageSafety = clampWorldValue(world.villageSafety - 4);
  const affectedFaction =
    enemyId == "kurogane" ? "iron" : ["konan", "zetsu"].includes(enemyId) ? "ame" : "konoha";
  changeFactionStanding(affectedFaction, -5, `${name || enemyId} escapou de uma missão`);
  recordWorldEvent(
    "villain-escape",
    `${world.escapedBosses[enemyId].name} escapou`,
    `${world.escapedBosses[enemyId].name} escapou da equipe e agora ameaça novamente as rotas. A segurança da vila caiu.`,
  );
  log(
    `🚨 <b>${world.escapedBosses[enemyId].name} escapou.</b> As rotas ligadas ao caso ficarão mais perigosas até a próxima tentativa.`,
    "bad",
  );
}

function clearStoryBossEscape(enemyId) {
  if (!enemyId) return;
  const world = worldConsequences(),
    escaped = world.escapedBosses[enemyId];
  if (!escaped) return;
  delete world.escapedBosses[enemyId];
  log(`✅ A ameaça de ${escaped.name} foi removida das rotas.`, "ok");
}

function storyOutcomeQuality(metrics) {
  const attempts = (metrics.successes || 0) + (metrics.failures || 0),
    rate = attempts ? (metrics.successes || 0) / attempts : 1;
  return rate >= 0.72 ? "good" : rate >= 0.4 ? "mixed" : "poor";
}

function resolveStoryOutcome(arc, story) {
  const world = worldConsequences(),
    metrics = story.metrics?.[arc.id] || {
      successes: 0,
      failures: 0,
      protectiveDecisions: 0,
      decisions: [],
    },
    quality = storyOutcomeQuality(metrics),
    good = quality == "good",
    poor = quality == "poor";
  const outcome = {
    quality,
    successes: metrics.successes || 0,
    failures: metrics.failures || 0,
    decisions: metrics.decisions || [],
    day: S.day,
  };
  world.villageSafety = clampWorldValue(
    world.villageSafety + (good ? 10 : poor ? -12 : 0),
  );
  world.villageTrust = clampWorldValue(
    world.villageTrust + (good ? 8 : poor ? -10 : 0),
  );
  if (arc.id == "ondas") {
    const protectedWorkers = (metrics.protectiveDecisions || 0) > 0 && good;
    world.regions.onda.bridge = protectedWorkers
      ? "completed"
      : poor
        ? "delayed"
        : "under_construction";
    world.regions.onda.workersInjured = poor;
    world.regions.onda.residentTrust = clampWorldValue(
      world.regions.onda.residentTrust +
        (protectedWorkers ? 18 : poor ? -18 : -5),
    );
    outcome.bridge = world.regions.onda.bridge;
    outcome.workersInjured = world.regions.onda.workersInjured;
    outcome.summary = protectedWorkers
      ? "A ponte foi concluída; os trabalhadores estão seguros e os moradores confiam mais em você."
      : poor
        ? "A obra atrasou, trabalhadores se feriram e a confiança dos moradores caiu."
        : "A construção continua, mas a ponte ainda não está concluída e os moradores aguardam novos esforços.";
  } else if (arc.id == "sasuke") {
    const fate = good
      ? "returned"
      : poor
        ? "separated"
        : "returned_with_distance";
    outcome.sasuke = fate;
    world.characterTrust.sasuke =
      (world.characterTrust.sasuke || 0) + (good ? 2 : poor ? -3 : -1);
    world.characterTrust.naruto =
      (world.characterTrust.naruto || 0) + (good ? 2 : poor ? -1 : 0);
    world.characterTrust.sakura =
      (world.characterTrust.sakura || 0) + (good ? 1 : poor ? -1 : 0);
    world.characterTrust.kakashi =
      (world.characterTrust.kakashi || 0) + (good ? 1 : poor ? -1 : 0);
    outcome.summary = good
      ? "Sasuke retorna à equipe e os laços do Time 7 se fortalecem."
      : poor
        ? "Sasuke segue seu próprio caminho; Naruto e a equipe precisam rever seus objetivos."
        : "Sasuke sobrevive ao confronto, mas a confiança da equipe ainda precisa ser reconstruída.";
  } else if (arc.id == "konohadefesa") {
    outcome.konoha = good ? "protected" : poor ? "damaged" : "recovering";
    world.reconstruction.konoha =
      outcome.konoha == "damaged"
        ? "needed"
        : outcome.konoha == "recovering"
          ? "ongoing"
          : "none";
    outcome.summary = good
      ? "Konoha foi defendida com segurança e sua população reconhece o esforço."
      : poor
        ? "A vila sofreu danos e precisa de reconstrução."
        : "A ameaça foi contida, mas a vila ainda se recupera.";
  } else
    outcome.summary = good
      ? `${arc.title} terminou com apoio e confiança reforçados.`
      : poor
        ? `${arc.title} deixou danos e a confiança local diminuiu.`
        : `${arc.title} foi concluído, mas ainda há consequências a resolver.`;
  applyStoryFactionImpact(arc.id, quality);
  world.arcOutcomes[arc.id] = outcome;
  world.decisions.push(
    ...outcome.decisions.map((decision) => ({
      arcId: arc.id,
      day: S.day,
      ...decision,
    })),
  );
  world.decisions = world.decisions.slice(-30);
  story.consequences[arc.id] = outcome;
  recordWorldEvent(`arc-${quality}`, arc.title, outcome.summary);
  const participants =
    arc.id == "sasuke"
      ? ["naruto", "sasuke", "sakura", "kakashi"]
      : arc.id == "ondas"
        ? ["tazuna"]
        : [];
  recordJournalEvent(
    "desfecho narrativo",
    arc.title,
    `Resultado: ${quality}.`,
    participants,
    outcome.summary,
  );
  log(`🌍 <b>Consequência persistente:</b> ${outcome.summary}`, "bt");
  return outcome;
}

function worldOperationAvailable(operation) {
  if (!operation.worldCondition) return true;
  const story = storyState(),
    world = worldConsequences();
  if (operation.worldCondition == "bridge-reconstruction")
    return (
      !!story.completed.ondas &&
      ["delayed", "under_construction"].includes(
        world.regions.onda.bridge,
      )
    );
  if (operation.worldCondition == "konoha-reconstruction")
    return (
      !!story.completed.konohadefesa &&
      ["needed", "ongoing"].includes(world.reconstruction.konoha)
    );
  return false;
}

function resolveWorldOperation(assignment) {
  if (!assignment?.worldCondition) return;
  const world = worldConsequences(),
    successful = assignment.successes >= assignment.failures;
  if (assignment.worldCondition == "bridge-reconstruction") {
    const region = world.regions.onda;
    region.bridge = successful ? "completed" : "delayed";
    region.residentTrust = clampWorldValue(
      region.residentTrust + (successful ? 12 : -5),
    );
    world.villageTrust = clampWorldValue(
      world.villageTrust + (successful ? 3 : -2),
    );
    log(
      successful
        ? "🌉 A reconstrução foi concluída com segurança. A rota para a fronteira está aberta e os moradores voltam a confiar no projeto."
        : "🌉 A obra continua atrasada. Os trabalhadores estão protegidos, mas será preciso organizar outra etapa de reconstrução.",
      successful ? "ok" : "sys",
    );
  } else if (assignment.worldCondition == "konoha-reconstruction") {
    world.reconstruction.konoha = successful ? "completed" : "ongoing";
    world.villageSafety = clampWorldValue(
      world.villageSafety + (successful ? 8 : -3),
    );
    world.villageTrust = clampWorldValue(
      world.villageTrust + (successful ? 5 : -4),
    );
    log(
      successful
        ? "🏘️ Os abrigos e serviços de Konoha foram restaurados. A vila está mais segura e confia na equipe."
        : "🏘️ A reconstrução de Konoha avançou apenas em parte. A equipe precisará voltar para concluir os reparos.",
      successful ? "ok" : "sys",
    );
  }
}

function worldCheckBonus(mission) {
  const world = worldConsequences(),
    title = Array.isArray(mission) ? mission[1] : mission.title || "",
    description = Array.isArray(mission)
      ? mission[2]
      : mission.description || "",
    goal = Array.isArray(mission) ? mission[6] : mission.goal || "",
    context = `${title} ${description} ${goal}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  let bonus = 0;
  if (
    world.villageSafety >= 70 &&
    /civis|moradores|trabalhadores|evacu|proteg|defesa/.test(context)
  )
    bonus++;
  if (/ponte|ondas|tazuna|trabalhadores/.test(context)) {
    if (world.regions.onda.bridge == "completed") bonus++;
    else if (world.regions.onda.bridge == "delayed") bonus--;
  }
  const sasuke = world.arcOutcomes.sasuke?.sasuke;
  if (sasuke && /equipe|aliad|companheir|resgat/.test(context))
    bonus += sasuke == "returned" ? 1 : sasuke == "separated" ? -1 : 0;
  return Math.max(-2, Math.min(2, bonus));
}

function worldReply(id, text) {
  const world = worldConsequences(),
    waves = world.regions.onda,
    sasuke = world.arcOutcomes.sasuke?.sasuke,
    reconstruction = world.reconstruction.konoha;
  if (id == "tazuna" && waves.bridge != "unknown")
    return waves.bridge == "completed"
      ? "A ponte está pronta, e os trabalhadores estão seguros. Os moradores ainda falam da sua proteção."
      : waves.workersInjured
        ? "A obra atrasou e alguns trabalhadores se feriram. Precisamos reconstruir a confiança junto com a ponte."
        : "A ponte ainda está em construção. Os moradores esperam que a próxima etapa seja mais segura.";
  if (
    ["tsunade", "shizune", "sakura", "kakashi", "naruto", "iruka"].includes(id) &&
    /konoha|vila|reconstr|abrigo|morador/.test(text)
  ) {
    if (reconstruction == "needed")
      return "Konoha ainda precisa reconstruir abrigos e serviços. Vou priorizar uma equipe para ajudar os moradores.";
    if (reconstruction == "ongoing")
      return "Os reparos de Konoha começaram, mas ainda há setores que precisam de apoio. A equipe pode fazer diferença.";
    if (reconstruction == "completed")
      return "Os abrigos e serviços foram restaurados. A vila está mais segura, embora ninguém tenha esquecido o que aconteceu.";
    if (world.villageTrust < 35)
        return "A confiança da vila está baixa. Precisamos provar com ações consistentes que Konoha pode contar conosco.";
  }
  if (
    ["naruto", "sakura", "kakashi", "sasuke"].includes(id) &&
    sasuke &&
    /miss[aã]o|equipe|sasuke|vale|resgat/.test(text)
  )
    return sasuke == "returned"
      ? "Sasuke voltou para perto da equipe. Agora precisamos decidir juntos o que vem depois."
      : sasuke == "separated"
        ? "Sasuke continua distante. Não vou desistir, mas a equipe precisa encontrar outro caminho."
        : "Sasuke voltou, mas ainda existe uma distância entre nós. Vamos reconstruir a confiança.";
  return "";
}

// Um arco abre quando o requisito de progressão e a dependência narrativa forem atendidos.
// Isso mantém arcos principais encadeados e também preserva arcos paralelos que dependem
// de um arco específico, evitando bloqueios por ordem de lista ou save incompleto.
function storyArcDependencyState(index, story = storyState()) {
  const arc = STORY_ARCS[index];
  if (!arc) return { open: false, reason: "Arco indisponível." };

  if (arc.free) {
    if (arc.after && !story.completed[arc.after]) {
      const anterior = STORY_ARCS.find((outro) => outro.id == arc.after);
      return {
        open: false,
        reason: `Conclua o arco “${anterior?.title || arc.after}” primeiro.`,
      };
    }
    return { open: true, reason: "" };
  }

  const previousArc = STORY_ARCS[index - 1];
  const existingKazekageProgress =
    arc.id == "kazekage" &&
    ((story.progress.kazekage || 0) > 0 || !!story.completed.kazekage);

  if (index > 0 && previousArc && !story.completed[previousArc.id] && !existingKazekageProgress) {
    return {
      open: false,
      reason: `Conclua ${previousArc.title} primeiro.`,
    };
  }

  return { open: true, reason: "" };
}

function storyArcOpen(index) {
  const story = storyState(),
    arc = STORY_ARCS[index],
    req = arc?.unlock;
  if (!arc || !req) return false;
  const dependency = storyArcDependencyState(index, story);
  if (!dependency.open) return false;
  return (
    S.rk >= req.rank &&
    S.lv >= req.level &&
    S.done >= req.missions
  );
}

function storyLockReason(index) {
  const story = storyState(),
    arc = STORY_ARCS[index],
    req = arc?.unlock;
  if (!arc || !req) return "Arco indisponível.";
  const dependency = storyArcDependencyState(index, story);
  if (!dependency.open) return dependency.reason;
  return `Requer rank ${RK[req.rank]}, nível ${req.level} e ${req.missions} missões concluídas.`;
}

function startStoryMission(id) {
  if (S.activeContract || M || B || S.assignment?.status == "active")
    return log(
      "Conclua ou retome a missão atual antes de iniciar outra.",
      "sys",
    );
  const index = STORY_ARCS.findIndex((arc) => arc.id == id),
    arc = STORY_ARCS[index];
  if (!arc) return;
  if (!storyArcOpen(index)) return log(`🔒 ${storyLockReason(index)}`, "sys");
  const story = storyState(),
    stageIndex = story.progress[id] || 0;
  if (story.completed[id] || stageIndex >= arc.missions.length)
    return log("Este arco já foi concluído.", "sys");
  const stage = arc.missions[stageIndex],
    lostTarget = stage.enemy && ew().dead[stage.enemy] ? stage.enemy : "",
    storyRun = {
      arcId: id,
      stageIndex,
      enemy: lostTarget ? "" : stage.enemy || "",
      isBoss: !lostTarget && !!EN[stage.enemy]?.[4],
      finale: !!stage.finale,
      lostTarget,
    };
  if (stage.loc && S.loc != stage.loc)
    return log(
      `📍 Esta pista só pode ser investigada em ${L[stage.loc][1]}. Viaje até lá e volte ao mural para continuar.`,
      "sys",
    );
  log(
    `📖 <b>${arc.title}</b> · etapa ${stageIndex + 1}/${arc.missions.length}.`,
    "bt",
  );
  const mission = lostTarget
    ? [
        stage.rank,
        `Vestígios de ${stage.title}`,
        `A pessoa ligada a esta pista morreu antes da sua chegada. Investigue o que ficou para trás e como a ausência dela mudou a situação.`,
        "",
        stage.reward,
        stage.xp,
        "retrieve",
      ]
    : [
        stage.rank,
        stage.title,
        stage.description,
        stage.enemy || "",
        stage.reward,
        stage.xp,
        stage.goal || "",
      ];
  if (lostTarget)
    log(
      `🕯️ ${N[lostTarget]?.[0] || lostTarget} já morreu. A etapa muda: você investigará as consequências sem trazê-lo(a) de volta.`,
      "sys",
    );
  beginMultiDayMission(
    mission,
    -2,
    storyRun,
    stage.scene,
  );
}

function finishStoryStage(run) {
  if (!run) return;
  const story = storyState(),
    arc = STORY_ARCS.find((entry) => entry.id == run.arcId);
  if (!arc) return;
  const next = run.stageIndex + 1,
    metrics = story.metrics || (story.metrics = {}),
    arcMetrics =
      metrics[arc.id] ||
      (metrics[arc.id] = {
        successes: 0,
        failures: 0,
        protectiveDecisions: 0,
        decisions: [],
      }),
    decisions = M?.decisions || [];
  arcMetrics.successes += M?.successes || 0;
  arcMetrics.failures += M?.failures || 0;
  arcMetrics.decisions.push(
    ...decisions.map((decision) => ({
      ...decision,
      stage: run.stageIndex,
    })),
  );
  arcMetrics.decisions = arcMetrics.decisions.slice(-40);
  arcMetrics.protectiveDecisions += decisions.filter(
    (decision) =>
      decision.success &&
      /proteg|trabalh|morador|civil|segur|evacu/i.test(decision.choice),
  ).length;
  story.progress[arc.id] = next;
  if (run.isBoss && run.enemy) {
    story.defeatedBosses[run.enemy] = true;
    clearStoryBossEscape(run.enemy);
  }
  if (run.finale) {
    S.specialItems = Array.isArray(S.specialItems)
      ? S.specialItems
      : [];
    if (!S.specialItems.includes("colarKzinn"))
      S.specialItems.push("colarKzinn");
    story.kzinnEndingFound = true;
    log(
      "No esconderijo, você não encontra Kzinn. O lugar está vazio. Entre as pedras, resta apenas um colar gasto, que os registros antigos identificam como dele. Você guarda o objeto — e as perguntas que vieram com ele.",
      "bt",
    );
    recordWorldEvent(
      "legacy",
      "O esconderijo sem resposta",
      "Um colar ligado a Kzinn foi encontrado; seu paradeiro continua desconhecido.",
    );
  }
  if (next >= arc.missions.length) {
    story.completed[arc.id] = true;
    const outcome = resolveStoryOutcome(arc, story);
    log(`📜 <b>${arc.title} concluído.</b> ${outcome.summary}`, "ok");
  } else
    log(
      `📖 A história avança: ${arc.title} · etapa ${next + 1}/${arc.missions.length}.`,
      "bt",
    );
  save();
}

function answerUrgent() {
  const event = S.urgent;
  if (!event) return log("Não há chamado urgente ativo.", "sys");
  if (event.response == "ignored")
    return log("Você decidiu não intervir neste chamado.", "sys");
  if (S.loc != event.loc)
    return log(
      `O chamado está em ${L[event.loc][1]}. Viaje até lá antes de responder.`,
      "sys",
    );
  S.urgent = null;
  M = {
    m: [
      event.rank,
      event.title,
      event.description,
      "",
      event.reward,
      event.xp,
      event.goal,
    ],
    i: -1,
    s: 0,
    n: 1,
    failures: 0,
    successes: 0,
    secondaryObjectives: 0,
    step: event.scene,
    urgent: event,
  };
  log(`🆘 Você atende ao chamado: <b>${event.title}</b>.`, "bt");
  nx();
}

function answerAssignment() {
  const assignment = S.assignment;
  if (!assignment || assignment.status != "offered")
    return log("Não há uma designação pendente da Hokage.", "sys");
  if (S.loc != "torre")
    return log("Apresente-se na Torre do Hokage antes de partir.", "sys");
  assignment.status = "active";
  assignment.phase = 0;
  S.loc = assignment.loc;
  mode = "assignment";
  log(
    `🛡️ Tsunade confirma a missão. Você parte para ${L[assignment.loc][1]} com ${assignment.squad.map((id) => N[id][0]).join(" e ")}.`,
    "bt",
  );
  tick(1);
  if (S.t) tick(3 - S.t);
  render();
}

function assignmentPick(index) {
  const assignment = S.assignment;
  if (!assignment || assignment.status != "active") return;
  const mission = [
      assignment.rank,
      assignment.title,
      assignment.description,
      "",
      assignment.reward,
      assignment.xp,
    ],
    style = missionRoutineStyle(mission),
    phase = assignment.phase || 0,
    scene =
      phase == 1
        ? assignment.stages[assignment.stage]
        : MISSION_ROUTINES[style][phase == 0 ? 0 : 2],
    choice = scene?.[1][index];
  if (!choice) return;
  const assignmentMission = {
      title: assignment.title,
      goal: assignment.description,
      squad: assignment.squad,
    },
    stat = choice[1],
    bonus = Math.min(
      4,
      assignment.squad.reduce(
        (total, id) => total + (allyTestStat(id) == stat ? 2 : 0),
        0,
      ),
    ),
    roleBonus = missionRoleBonus(stat, assignmentMission, assignment.squad),
    styleBonus = styleTestBonus(stat),
    identity = identityTestBonus(stat, assignmentMission),
    rank = MSK.indexOf(assignment.rank),
    roll = R(1, 20),
    dc = Math.max(6, 12 + rank * 2 - missionDifficultyBonus(assignmentMission)),
    baseTotal = roll + S[stat] + bonus + roleBonus + styleBonus + identity,
    bondScene = resolveBondScene(
      assignment.squad,
      assignment,
      stat,
      baseTotal,
      dc,
      assignment.title,
    ),
    total = bondScene.total,
    success = bondScene.success;
  log(
    `🎲 ${choice[0]}: ${roll} + ${S[stat]}${bonus ? ` + equipe ${bonus}` : ""}${roleBonus ? ` + papel ${roleBonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identity ? ` + identidade ${identity}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
    "sys",
  );
  if (success) {
    assignment.successes++;
    if (phase != 1)
      assignment.preparationSuccesses =
        (assignment.preparationSuccesses || 0) + 1;
    gain(phase == 1 ? 10 : 4 + rank * 2);
    log(
      phase == 1
        ? "A equipe executa o plano e avança com segurança."
        : "A rotina funciona e também melhora a recompensa final.",
      "ok",
    );
  } else {
    assignment.failures++;
    const damage = phase == 1 ? 6 + rank * 3 : 3 + rank * 2;
    S.hp = Math.max(1, S.hp - damage);
    gain(phase == 1 ? 4 : 2);
    log(
      `O plano encontra resistência. Você perde ${damage} HP, mas a operação continua.`,
      "bad",
    );
  }
  if (choice[2] == "heal") S.hp = Math.min(S.mh, S.hp + 12);
  if (choice[2] == "chakra") S.ck = Math.min(S.mc, S.ck + 10);
  if (choice[2] == "rest") {
    S.hp = Math.min(S.mh, S.hp + 6);
    S.ck = Math.min(S.mc, S.ck + 6);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 12);
  }
  assignment.phase++;
  const dayComplete = assignment.phase >= MISSION_ROUTINE_PHASES.length;
  if (dayComplete) {
    missionBanter(
      assignment.squad,
      success,
      assignment.title,
      `rotina do dia ${assignment.stage + 1}`,
    );
    assignment.phase = 0;
    assignment.stage++;
  }
  const complete = assignment.stage >= assignment.stages.length;
  tick(1);
  if (complete) {
    const reward = Math.max(50, assignment.reward - assignment.failures * 25),
      xp = Math.max(20, assignment.xp - assignment.failures * 8),
      payout = completeMission(
        assignment.rank,
        reward,
        xp,
        false,
        missionBonuses(assignment, assignment),
      );
    recordTeamPairMission(
      assignment.squad,
      assignment.successes >= assignment.failures,
    );
    resolveWorldOperation(assignment);
    assignment.squad.forEach((id) =>
      remember(id, "missao", `Concluíram juntos “${assignment.title}”.`, {
        affinity: 6,
        trust: 4,
        respect: 2,
        sharedMissions: 1,
      }),
    );
    settlePromises(assignment.squad, assignment.title);
    S.assignment = null;
    mode = "map";
    log(
      `✅ <b>${assignment.title} concluída!</b> +${payout.ryo} ryō, +${payout.xp} XP e +6 de afinidade com cada integrante da equipe${missionBonusText(payout)}. Missões concluídas: ${S.done}.`,
      "ok",
    );
    save();
    render();
  } else {
    if (dayComplete)
      log(
        `🌅 Dia ${S.day}: etapa ${assignment.stage + 1}/${assignment.stages.length}. A operação continua com a equipe.`,
        "bt",
      );
    mode = "assignment";
    render();
  }
}

function nx() {
  if (M.s < M.n) {
    let scene = M.s == 0 ? M.step || MSTEP[M.i] : P(STP);
    if (M.s == 0 && M.i >= 0 && MISSION_OPTIONS[M.i])
      scene = [scene[0], [...scene[1], MISSION_OPTIONS[M.i]]];
    M.cur =
      M.failures && M.s == M.n - 1
        ? [
            `Por causa dos contratempos, você chega sob pressão. ${scene[0]}`,
            scene[1],
          ]
        : scene;
    mode = "mis";
    render();
  } else {
    const m = M.m;
    if (m[6]) {
      const goal = OBJ[m[6]];
      M.cur = [
        M.failures
          ? `${goal[0]} As dificuldades anteriores deixaram pouco tempo para concluir.`
          : goal[0],
        goal[1],
      ];
      mode = "goal";
      render();
      return;
    }
    const base = EN[m[3]],
      f = Math.max(0, (M.failures || 0) - (M.investigationBonus || 0)),
      e = [
        base[0],
        Math.round(base[1] * (1 + f * 0.08)),
        Math.round(base[2] * (1 + f * 0.05)),
        base[3],
        base[4],
      ];
    log(
      f
        ? `Os contratempos alertaram o inimigo. ${e[4] ? "O líder" : "O adversário"} espera por você.`
        : e[4]
          ? `Você chega ao covil… e o líder da missão o aguarda.`
          : "Você chega ao objetivo e o confronto é inevitável!",
      "bt",
    );
    fight(e, {
      win: () => {
        const payout = completeMission(
          m[0],
          m[4],
          m[5],
          false,
          missionBonuses(m, M),
        );
        recordTeamPairMission(S.team, true);
        missionBanter(S.team, true, m[1], "conclusão da missão");
        settlePromises(S.team, m[1]);
        finishStoryStage(M.story);
        log(
          `✅ Missão rank ${m[0]} cumprida! +${payout.ryo} ryo e +${payout.xp} XP${missionBonusText(payout)}. (Total: ${S.done})`,
          "ok",
        );
        S.activeContract = null;
        M = null;
        tick(1);
      },
    });
  }
}

function pick(j) {
  const c = M.cur[1][j],
    ri = MSK.indexOf(M.m[0]),
    bonus = teamBonus(c[1]),
    roleBonus = missionRoleBonus(c[1], M.m),
    styleBonus = styleTestBonus(c[1]),
    identity = identityTestBonus(c[1], M.m),
    weatherBonus = missionWeatherModifier(
      M.weather || S.activeContract?.weather || S.weather,
      missionStyle(M.m),
    ),
    worldBonus = worldCheckBonus(M.m),
    dc = Math.max(
      6,
      10 +
        ri * 3 -
        Math.floor((S.rep || 0) / 25) -
        worldBonus -
        missionDifficultyBonus(M.m),
    ),
    r = R(1, 20),
    baseTotal = r + S[c[1]] + bonus + roleBonus + styleBonus + identity + weatherBonus,
    bondScene = resolveBondScene(S.team, M, c[1], baseTotal, dc, M.m[1]),
    tt = bondScene.total,
    secondary = M.s == 0 && M.i >= 0 && MISSION_OPTIONS[M.i]?.[0] == c[0];
  M.decisions = M.decisions || [];
  M.decisions.push({ choice: c[0], stat: c[1], success: tt >= dc });
  if (M.story)
    recordJournalEvent(
      "decisão narrativa",
      `${STORY_ARCS.find((arc) => arc.id == M.story.arcId)?.title || M.m[1]}: ${c[0]}`,
      `Teste de ${c[1].toUpperCase()}.`,
      S.team || [],
      tt >= dc ? "A decisão teve êxito." : "A decisão teve contratempos.",
    );
  log(
    `🎲 ${c[0]}: ${r} + ${S[c[1]]}${bonus ? ` + equipe ${bonus}` : ""}${roleBonus ? ` + papel ${roleBonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identity ? ` + identidade ${identity}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${weatherBonus ? ` ${weatherBonus > 0 ? "+" : "−"} clima ${Math.abs(weatherBonus)}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${tt} (precisa de ${dc})`,
    "sys",
  );
  if (tt >= dc) {
    M.successes++;
    if (secondary) {
      M.secondaryObjectives = (M.secondaryObjectives || 0) + 1;
      log(
        "⭐ Objetivo secundário concluído. Ele renderá um bônus ao finalizar a missão.",
        "ok",
      );
    }
    gain(8 + ri * 2);
    log("Deu certo! Você avança.", "ok");
  } else {
    M.failures++;
    const d = 6 + ri * 4;
    S.hp = Math.max(1, S.hp - d);
    log(
      `Falhou e perdeu ${d} HP, mas segue em frente. O contratempo pode tornar o final mais difícil.`,
      "bad",
    );
  }
  missionBanter(S.team, tt >= dc, M.m[1], c[0]);
  M.s++;
  syncMultiDayFinal();
  tick(1);
  nx();
}

function pickGoal(j) {
  const m = M.m,
    c = M.cur[1][j],
    ri = MSK.indexOf(m[0]),
    bonus = teamBonus(c[1]),
    roleBonus = missionRoleBonus(c[1], m),
    styleBonus = styleTestBonus(c[1]),
    identity = identityTestBonus(c[1], m),
    weatherBonus = missionWeatherModifier(
      M.weather || S.activeContract?.weather || S.weather,
      missionStyle(m),
    ),
    worldBonus = worldCheckBonus(m),
    dc = M.story?.finale
      ? 0
      : Math.max(
          6,
          12 +
            ri * 3 +
            (M.failures || 0) * 2 -
            Math.floor((S.rep || 0) / 25) -
            worldBonus -
            (M.investigationBonus || 0) -
            missionDifficultyBonus(m),
        ),
    r = R(1, 20),
        baseTotal = r + S[c[1]] + bonus + roleBonus + styleBonus + identity + weatherBonus,
        bondScene = resolveBondScene(S.team, M, c[1], baseTotal, dc, m[1]),
        tt = bondScene.total;
  M.decisions = M.decisions || [];
  M.decisions.push({ choice: c[0], stat: c[1], success: tt >= dc });
  if (M.story)
    recordJournalEvent(
      "decisão narrativa",
      `${STORY_ARCS.find((arc) => arc.id == M.story.arcId)?.title || M.m[1]}: ${c[0]}`,
      `Teste de ${c[1].toUpperCase()}.`,
      S.team || [],
      tt >= dc ? "A decisão teve êxito." : "A decisão teve contratempos.",
    );
  log(
    M.story?.finale
      ? `🔎 ${c[0]}: você chega ao fim da trilha sem encontrar resistência.`
      :       `🎲 ${c[0]}: ${r} + ${S[c[1]]}${bonus ? ` + equipe ${bonus}` : ""}${roleBonus ? ` + papel ${roleBonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identity ? ` + identidade ${identity}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${weatherBonus ? ` ${weatherBonus > 0 ? "+" : "−"} clima ${Math.abs(weatherBonus)}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${tt} (precisa de ${dc})`,
    "sys",
  );
  if (tt >= dc) {
    const payout = completeMission(
      m[0],
      m[4],
      m[5],
      M.urgent,
      missionBonuses(m, M),
    );
    recordTeamPairMission(S.team, true);
    if (M.urgent) {
      rel(M.urgent.npc, 5);
      pres(S.loc)
        .filter((id) => id != M.urgent.npc)
        .forEach((id) => rel(id, 1));
      log(
        `🤝 ${N[M.urgent.npc][0]} e os moradores reconhecem sua ajuda.`,
        "ok",
      );
    }
    finishStoryStage(M.story);
    log(
      `✅ Objetivo concluído! +${payout.ryo} ryo e +${payout.xp} XP${missionBonusText(payout)}. Missões concluídas: ${S.done}.`,
      "ok",
    );
  } else {
    const d = 8 + ri * 3;
    S.hp = Math.max(1, S.hp - d);
    gain(Math.floor(m[5] * 0.25));
    if (M.story) recordFailedStoryAttempt(M.story, M);
    const reportBonuses = missionBonuses(m, M),
      listeners = [
        ...new Set([
          ...(reportBonuses.squad || []),
          ...pres(S.loc),
        ].filter((id) => N[id])),
      ];
    recordWorldEvent(
      "failure",
      m[1],
      M.m[6] == "protect"
        ? "A proteção falhou e civis ou aliados ainda correm risco."
        : "O objetivo de resgate não foi concluído.",
      listeners,
    );
    queueMissionDebrief(m, m[0], reportBonuses, false);
    updateShinobiCode(reportBonuses);
    if (M.urgent) {
      registerMarketCrisis(
        M.urgent,
        "A ocorrência terminou sem solução e os comerciantes estão repondo suprimentos.",
      );
      S.rep = Math.max(0, (S.rep || 0) - 2);
      rel(M.urgent.npc, -2);
      log(
        "A vila perde um pouco de confiança após o resgate malsucedido. Reputação −2.",
        "bad",
      );
    }
    log(
      `❌ O objetivo não foi concluído. Você perde ${d} HP e recebe XP pela experiência da tentativa, mas sem recompensa ou crédito de missão.`,
      "bad",
    );
  }
  missionBanter(S.team, tt >= dc, m[1], c[0]);
  settlePromises(S.team, m[1]);
  S.activeContract = null;
  M = null;
  mode = "map";
  tick(1);
  render();
}

function repGain(rank, urg) {
  S.rep = S.rep || 0;
  const cap = RCAP[rank] || 22;
  if (S.rep < cap)
    S.rep = Math.min(
      cap,
      Math.round(
        (S.rep + (RW[rank] || 0.2) * (urg ? 1.5 : 1) * (1 - S.rep / 130)) * 100,
      ) / 100,
    );
  if (rank == "A" || rank == "S")
    S.fame = Math.min(100, (S.fame || 0) + (rank == "S" ? 3 : 1.2));
}

function missionBonuses(mission, progress = {}) {
  const title = mission.title || mission[1] || "",
    description = mission.description || mission[2] || "",
    goal = mission.goal || mission[6] || "",
    storyRun = progress.story,
    contractIndex = Number.isInteger(progress.i) && progress.i >= 0
      ? progress.i
      : null,
    week = Math.floor(S.day / 4),
    archiveId = storyRun
      ? `story:${storyRun.arcId}:${storyRun.stageIndex}`
      : contractIndex !== null
        ? `contract:${contractIndex}:${week}`
        : progress.id
          ? `operation:${progress.id}:${S.day}`
          : `mission:${S.day}:${title}`;
  const context = `${title} ${description}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const civilianRisk =
    /civis|moradores|trabalhadores|comboio|caravana|comerciantes|construtor|equipe medica|equipe de obras|familia|aldeoes|viajantes|vidas em jogo|proteger a vila|konoha.{0,24}ataque/.test(
      context,
    );
  const rescue =
    /resgat|resgate|batedor|equipe desaparecida|aliado|companheiro|kazekage/.test(
      context,
    ) || goal == "rescue";
  const noSetbacks = (progress.failures || 0) == 0;
  return {
    secondaryObjectives: Math.max(0, progress.secondaryObjectives || 0),
    preparationSuccesses: Math.max(0, progress.preparationSuccesses || 0),
    alliesSaved:
      progress.alliesSaved ??
      ((rescue || goal == "protect") && !civilianRisk ? 1 : 0),
    civiliansProtected:
      progress.civiliansProtected ?? (noSetbacks && civilianRisk ? 1 : 0),
    title,
    description,
    archiveId,
    contractIndex,
    week,
    storyArcId: storyRun?.arcId || "",
    storyStageIndex: storyRun?.stageIndex ?? -1,
    operationId: progress.id || "",
    decisions: Array.isArray(progress.decisions)
      ? progress.decisions.map((decision) => ({
          choice: String(decision.choice || ""),
          success: decision.success === true,
        }))
      : [],
    squad: Array.isArray(progress.squad)
      ? progress.squad.slice()
      : (S.team || []).slice(),
    civilianRisk,
    rescue,
    failures: progress.failures || 0,
  };
}

function updateShinobiCode(bonuses) {
  const code = (S.shinobiCode = S.shinobiCode || {
      duty: 0,
      civilians: 0,
      squad: 0,
      results: 0,
    }),
    add = (key) => {
      code[key] = Math.max(-20, Math.min(20, (Number(code[key]) || 0) + 1));
    };
  (bonuses.decisions || []).forEach(({ choice }) => {
    const text = choice
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (/ordem|protocolo|relat|registro|hokage|tazuna/.test(text)) add("duty");
    if (/proteg|civil|morador|ferid|abrigo|evacua|segur/.test(text))
      add("civilians");
    if (/equipe|aliad|companheir|esquad|coorden|juntos/.test(text))
      add("squad");
    if (/atacar|avancar|derrotar|interromper|confront|forca/.test(text))
      add("results");
  });
}

function queueMissionDebrief(mission, rank, bonuses, success) {
  const title = bonuses.title || mission[1] || "Missão sem registro",
    archiveId = bonuses.archiveId || `mission:${S.day}:${title}`,
    id = `${success ? "debrief" : "withdrawal"}:${archiveId}`,
    team = [...new Set((bonuses.squad || S.team || []).filter((member) => N[member]))],
    witnesses = [
      ...new Set([
        ...team,
        ...pres(S.loc).filter((member) => N[member]),
      ]),
    ],
    pending = (S.pendingDebriefs = Array.isArray(S.pendingDebriefs)
      ? S.pendingDebriefs
      : []);
  if (pending.some((entry) => entry.id == id)) return;
  pending.push({
    id,
    title,
    rank,
    day: S.day,
    failures: Math.max(0, bonuses.failures || 0),
    success,
    team,
    witnesses,
  });
  log(
    success
      ? `📋 “${esc(title)}” aguarda seu debriefing. Relate o resultado ao superior e à equipe quando quiser.`
      : `📋 A retirada de “${esc(title)}” aguarda seu debriefing. Explique o que aconteceu ao superior e à equipe quando estiver pronto.`,
    "bt",
  );
}

function resolveMissionDebrief(id, response) {
  const pending = S.pendingDebriefs || [],
    index = pending.findIndex((entry) => entry.id == id),
    report = pending[index];
  if (!report)
    return log("Este debriefing já foi apresentado ou não está disponível.", "sys");
  if (!["truth", "conceal", "responsibility"].includes(response))
    return log("Escolha uma resposta válida para o debriefing.", "sys");
  if (response == "conceal" && report.failures <= 0)
    return log("Não há um contratempo para omitir neste relatório.", "sys");

  const team = report.team || [],
    audience = [
      ...new Set([
        ...(report.witnesses || []),
        ...(response == "conceal" ? [] : ["tsunade"]),
      ]),
    ],
    code = (S.shinobiCode = S.shinobiCode || {
      duty: 0,
      civilians: 0,
      squad: 0,
      results: 0,
    });
  if (response == "truth") {
    S.commandStanding = Math.min(20, (S.commandStanding || 0) + 1);
    S.rep = Math.min(100, (S.rep || 0) + 0.5);
    code.duty = Math.min(20, (code.duty || 0) + 1);
    team.forEach((member) =>
      remember(member, "debriefing", `Você relatou com transparência “${report.title}”.`, {
        trust: 1,
        respect: 1,
      }),
    );
    log(
      "📜 Você relata o resultado sem esconder os contratempos. Tsunade valoriza a clareza, e a equipe percebe que pode confiar na sua palavra.",
      "ok",
    );
  } else if (response == "conceal") {
    S.commandStanding = Math.max(-20, (S.commandStanding || 0) - 2);
    S.rep = Math.max(0, (S.rep || 0) - 0.5);
    code.results = Math.min(20, (code.results || 0) + 1);
    team.forEach((member) =>
      remember(member, "debriefing omitido", `Você omitiu um contratempo de “${report.title}” no relatório.`, {
        trust: -1,
        respect: -1,
      }),
    );
    log(
      "🤫 Você omite um contratempo. O relatório parece melhor, mas a confiança da equipe e a consideração da chefia diminuem.",
      "bad",
    );
  } else {
    S.commandStanding = Math.min(20, (S.commandStanding || 0) + 2);
    S.rep = Math.min(100, (S.rep || 0) + 0.25);
    code.duty = Math.min(20, (code.duty || 0) + 1);
    code.squad = Math.min(20, (code.squad || 0) + 1);
    team.forEach((member) =>
      remember(member, "responsabilidade", `Você assumiu sua parte nos problemas de “${report.title}”.`, {
        trust: 2,
        respect: 2,
        rivalry: -1,
      }),
    );
    log(
      "🛡️ Você assume sua parte nos problemas e descreve o que a equipe enfrentou. A chefia reconhece sua responsabilidade, e os aliados se sentem protegidos.",
      "ok",
    );
  }

  const description =
      response == "truth"
        ? "Relatou com transparência os acertos e contratempos."
        : response == "conceal"
          ? "Omitiu um contratempo no relatório oficial."
          : "Assumiu responsabilidade pelos contratempos da equipe.",
    listeners = audience.filter((member) => N[member]);
  recordJournalEvent(
    "debriefing",
    `Relatório: ${report.title}`,
    description,
    [...new Set([...team, "tsunade"].filter((member) => N[member]))],
    response == "conceal"
      ? "A confiança da equipe e a consideração da chefia diminuíram."
      : "O relatório foi registrado; sua conduta influencia futuras designações.",
  );
  recordWorldEvent(
    "debrief",
    report.title,
    response == "conceal"
      ? "O relatório oficial omitiu um contratempo; a equipe presente conhece o que realmente ocorreu."
      : description,
    listeners,
  );
  pending.splice(index, 1);
  save();
  render();
}

function recordPromotionCeremony(rank, participants = [], examTrust = 0) {
  const title = `Cerimônia de graduação · ${RK[rank]}`,
    team = [...new Set(participants.filter((id) => N[id]))],
    promoted = (S.promotionHistory = Array.isArray(S.promotionHistory)
      ? S.promotionHistory
      : []);
  promoted.push({ rank, title, day: S.day, team, examTrust });
  promoted.splice(0, Math.max(0, promoted.length - 10));
  recordJournalEvent(
    "graduação",
    title,
    `Após cumprir os requisitos e passar pelo exame, ${S.n} recebeu o novo rank.`,
    [...new Set([...team, "iruka", "tsunade"].filter((id) => N[id]))],
    rank == 1
      ? "A bandana e o primeiro posto como genin marcam o início de novas responsabilidades."
      : `A promoção foi conquistada no exame. Novas responsabilidades de ${RK[rank]} foram registradas.`,
  );
  recordWorldEvent(
    "promotion",
    title,
    `${S.n} foi promovido(a) a ${RK[rank]} após concluir o exame.`,
    [...new Set([...team, "iruka", "tsunade"].filter((id) => N[id]))],
  );
  log(
    rank == 1
      ? "🎓 A cerimônia é simples: Iruka entrega sua bandana diante dos colegas. A partir de hoje, suas decisões também respondem por uma equipe."
      : `🎓 A promoção a ${RK[rank]} é anunciada após a avaliação. ${examTrust >= 70 ? "O esquadrão reconhece a confiança construída durante o exame." : "A nova patente traz deveres maiores junto com o reconhecimento."}`,
    "ok",
  );
}

function completeMission(rank, reward, xp, urgent, bonuses = {}) {
  const secondary = bonuses.secondaryObjectives || 0,
    preparation = bonuses.preparationSuccesses || 0,
    allies = bonuses.alliesSaved || 0,
    civilians = bonuses.civiliansProtected || 0,
    preparationRate = Math.min(0.2, preparation * 0.015),
    rate = Math.min(
      0.5,
      secondary * 0.1 + preparationRate + allies * 0.15 + civilians * 0.1,
    ),
    bonusRyo = Math.round(reward * rate),
    bonusXp = Math.round(xp * rate);
  S.ryo += reward + bonusRyo;
  gain(xp + bonusXp);
  S.done++;
  if (S.rogue?.active)
    S.rogue.missionsDone = Math.max(0, Number(S.rogue.missionsDone) || 0) + 1;
  const missionRegionCode =
    bonuses.region ||
    (bonuses.location && REG[bonuses.location]) ||
    (bonuses.title
      ? missionRegion(
          [rank, bonuses.title, bonuses.description || "", bonuses.enemy || ""],
        )
      : REG[S.loc] || "k");
  changeRegionalReputation(
    missionRegionCode,
    bonuses.failures ? -1 : Math.min(4, 1 + secondary),
  );
  recordPromotionDuty(bonuses);
  gainClanRenown(rank);
  S.missionHistory = Array.isArray(S.missionHistory)
    ? S.missionHistory
    : [];
  if (
    bonuses.title &&
    !S.missionHistory.some((entry) => entry.id == bonuses.archiveId)
  ) {
    const arc = bonuses.storyArcId
      ? STORY_ARCS.find((item) => item.id == bonuses.storyArcId)
      : null;
    S.missionHistory.push({
      id: bonuses.archiveId || `mission:${S.day}:${bonuses.title}`,
      title: bonuses.title,
      description: bonuses.description || "",
      rank,
      day: S.day,
      contractIndex: bonuses.contractIndex ?? null,
      week: bonuses.week ?? null,
      storyArcId: bonuses.storyArcId || "",
      storyTitle: arc?.title || "",
      operationId: bonuses.operationId || "",
    });
  }
  repGain(rank, urgent);
  const repBonus = secondary * 0.25 + allies * 0.5 + civilians * 0.5;
  if (repBonus)
    S.rep = Math.min(
      RCAP[rank] || 100,
      Math.round(((S.rep || 0) + repBonus) * 100) / 100,
    );
  if (bonuses.title) {
    const storyCharacters = bonuses.storyArcId == "sasuke"
      ? ["naruto", "sasuke", "sakura", "kakashi"]
      : bonuses.storyArcId == "ondas"
        ? ["tazuna"]
        : (bonuses.squad || []);
    const witnesses = [
      ...new Set([
        ...(bonuses.squad || []),
        ...pres(S.loc),
        ...storyCharacters,
      ].filter((id) => N[id])),
    ];
    recordJournalEvent(
      "missão",
      bonuses.title,
      `Missão rank ${rank} concluída.`,
      storyCharacters,
      bonuses.failures
        ? `${bonuses.failures} contratempo(s); fama regional ajustada.`
        : "Objetivos concluídos; fama regional aumentou.",
    );
    if (bonuses.failures && (bonuses.civilianRisk || bonuses.rescue))
      recordWorldEvent(
        "failure",
        bonuses.title,
        "A missão teve contratempos e os envolvidos ainda comentam o resultado.",
        witnesses,
      );
    else if (civilians)
      recordWorldEvent(
        "civilians",
        bonuses.title,
        "Civis foram protegidos sem contratempos.",
        witnesses,
      );
    else if (allies)
      recordWorldEvent(
        "rescue",
        bonuses.title,
        "Um aliado foi resgatado com sucesso.",
        witnesses,
      );
    else
      recordWorldEvent(
        "success",
        bonuses.title,
        "A missão foi concluída com sucesso.",
        witnesses,
      );
    queueMissionDebrief([rank, bonuses.title], rank, bonuses, true);
  }
  updateShinobiCode(bonuses);
  const bonusLabels = [];
  if (secondary)
    bonusLabels.push(`Objetivo secundário +${Math.round(secondary * 10)}%`);
  if (preparationRate)
    bonusLabels.push(
      `Preparação diária +${Math.round(preparationRate * 100)}%`,
    );
  if (allies) bonusLabels.push("Aliado resgatado +15%");
  if (civilians) bonusLabels.push("Civis protegidos +10%");
  return { ryo: reward + bonusRyo, xp: xp + bonusXp, bonusLabels };
}

const missionBonusText = (payout) =>
  payout.bonusLabels.length ? ` · bônus: ${payout.bonusLabels.join(", ")}` : "";

function missionRegion(mission) {
  const title = `${mission?.[1] || ""} ${mission?.[2] || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/onda|tazuna|ponte/.test(title)) return "o";
  if (/areia|kazekage/.test(title)) return "a";
  if (/akatsuki/.test(title)) return "x";
  if (/som/.test(title)) return "s";
  return REG[S.loc] || "k";
}

function smis(i) {
  const mission = MS[i];
  if (!mission) return log("Esse contrato não existe.", "sys");
  if (mission[3] && ew().dead[mission[3]])
    return log(
      `Este contrato mudou: ${N[mission[3]]?.[0] || mission[3]} já morreu e não pode voltar ao mundo.`,
      "sys",
    );
  if (S.activeContract || M || B || X || S.assignment?.status == "active")
    return log(
      "Conclua ou retome sua atividade atual antes de aceitar outro contrato.",
      "sys",
    );
  const rank = mission[0],
    requiredRank = NEED[rank],
    requiredLevel = LVN[rank],
    requiredRep = REP_REQ[rank] || 0,
    region = missionRegion(mission),
    requiredRegionalRep = { D: 0, C: 25, B: 30, A: 35, S: 40 }[rank] || 0;
  if (S.rk < requiredRank || S.lv < requiredLevel || (S.rep || 0) < requiredRep)
    return log(
      `🔒 Requer rank ${RK[requiredRank]}, nível ${requiredLevel} e reputação ${requiredRep}+.`,
      "sys",
    );
  if (regionalReputation(region) < requiredRegionalRep)
    return log(
      `🔒 A recepção em ${regionDisplayName(region)} ainda não permite este contrato. Reputação regional ${requiredRegionalRep}+ necessária (atual ${Math.round(regionalReputation(region))}). Conclua missões locais ou ajude moradores.`,
      "sys",
    );
  const story = storyState(),
    week = Math.floor(S.day / 4),
    available = hs("q", i, week) < (i < MS0 ? 0.8 : 0.6);
  if (
    (S.missionHistory || []).some(
      (entry) => entry.contractIndex == i && entry.week == week,
    )
  )
    return log("Este contrato já foi concluído neste ciclo do mural.", "sys");
  if (story.defeatedBosses[mission[3]] || !available)
    return log("Este contrato não está disponível no mural hoje.", "sys");
  if (S.hp <= Math.ceil(S.mh * 0.2))
    return log(
      "Você está ferido demais para partir. Descanse ou use um kit médico.",
      "sys",
    );
  beginMultiDayMission(mission, i);
}
