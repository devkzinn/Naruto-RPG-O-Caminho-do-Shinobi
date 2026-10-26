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
      (S.rep || 0) >= (REP_REQ[operation.rank] || 0) &&
      (!req || (S.rk >= req.rk && S.done >= req.done))
    );
  });
  if (candidates.length > 1)
    candidates = candidates.filter(
      (operation) => operation.id != S.lastAssignmentId,
    );
  if (!candidates.length) return;
  const operation = P(candidates),
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
    styleBonus = styleTestBonus(choice[1]),
    identityBonus = identityTestBonus(choice[1], missionData),
    dc = Math.max(
      6,
      12 +
        rank * 2 -
        Math.floor((S.rep || 0) / 30) -
        missionDifficultyBonus(missionData),
    ),
    roll = R(1, 20),
    baseTotal = roll + S[choice[1]] + bonus + styleBonus + identityBonus,
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
    `🎲 ${choice[0]}: ${roll} + ${S[choice[1]]}${bonus ? ` + equipe ${bonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identityBonus ? ` + identidade ${identityBonus}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
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
    style = styleTestBonus(choice.stat),
    identity = identityTestBonus(choice.stat, missionData),
    ally = choice.id == "ally" ? choice.allyId : "",
    allyBond = ally ? bondOf(ally) : null,
    allyBonus = ally
      ? 2 + Math.min(2, Math.floor((allyBond.trust + allyBond.sharedMissions) / 4))
      : 0,
    baseTotal = roll + S[choice.stat] + team + style + identity + allyBonus,
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
    `🎲 ${choice.label}: ${roll} + ${S[choice.stat]}${team ? ` + equipe ${team}` : ""}${allyBonus ? ` + apoio de ${N[ally]?.[0]} ${allyBonus}` : ""}${style ? ` + estilo ${style}` : ""}${identity ? ` + identidade ${identity}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
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
        clueCount = S.specialization == "tracking" && S.lv >= 8 ? 2 : 1;
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
  if (suspect == contract.suspect) {
    contract.investigationBonus = 1;
    log(
      `✅ As pistas confirmam: ${INVESTIGATION_SUSPECTS[suspect]} está por trás do caso. Você evita uma emboscada.`,
      "ok",
    );
  } else {
    contract.failures += 2;
    contract.operationAmbush = true;
    log(
      `❌ A conclusão estava errada. ${INVESTIGATION_SUSPECTS[suspect]} não era responsável; o verdadeiro suspeito prepara uma emboscada. Dificuldade final +2.`,
      "bad",
    );
  }
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
    arcOutcomes: {},
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
  world.arcOutcomes = world.arcOutcomes || {};
  world.decisions = Array.isArray(world.decisions) ? world.decisions : [];
  if (!Number.isFinite(world.villageSafety)) world.villageSafety = 50;
  if (!Number.isFinite(world.villageTrust)) world.villageTrust = 50;
  return world;
}

const clampWorldValue = (value) => Math.max(0, Math.min(100, value));

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
  log(`🌍 <b>Consequência persistente:</b> ${outcome.summary}`, "bt");
  return outcome;
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
    sasuke = world.arcOutcomes.sasuke?.sasuke;
  if (id == "tazuna" && waves.bridge != "unknown")
    return waves.bridge == "completed"
      ? "A ponte está pronta, e os trabalhadores estão seguros. Os moradores ainda falam da sua proteção."
      : waves.workersInjured
        ? "A obra atrasou e alguns trabalhadores se feriram. Precisamos reconstruir a confiança junto com a ponte."
        : "A ponte ainda está em construção. Os moradores esperam que a próxima etapa seja mais segura.";
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

// Um arco abre quando o requisito de progressão é cumprido. Arcos principais seguem a
// ordem da lista; arcos paralelos ("free") dependem apenas do arco indicado em "after".
function storyArcOpen(index) {
  const story = storyState(),
    arc = STORY_ARCS[index],
    req = arc.unlock,
    existingKazekageProgress =
      arc.id == "kazekage" &&
      ((story.progress.kazekage || 0) > 0 || !!story.completed.kazekage),
    anteriorConcluido = arc.free
      ? !arc.after || !!story.completed[arc.after]
      : index === 0 ||
        !!story.completed[STORY_ARCS[index - 1].id] ||
        existingKazekageProgress;
  return (
    anteriorConcluido &&
    S.rk >= req.rank &&
    S.lv >= req.level &&
    S.done >= req.missions
  );
}

function storyLockReason(index) {
  const story = storyState(),
    arc = STORY_ARCS[index],
    req = arc.unlock,
    existingKazekageProgress =
      arc.id == "kazekage" &&
      ((story.progress.kazekage || 0) > 0 || !!story.completed.kazekage);
  if (arc.free) {
    if (arc.after && !storyState().completed[arc.after]) {
      const anterior = STORY_ARCS.find((outro) => outro.id == arc.after);
      return `Conclua o arco “${anterior?.title || arc.after}” primeiro.`;
    }
  } else if (
    index > 0 &&
    !story.completed[STORY_ARCS[index - 1].id] &&
    !existingKazekageProgress
  )
    return `Conclua ${STORY_ARCS[index - 1].title} primeiro.`;
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
  if (run.isBoss && run.enemy) story.defeatedBosses[run.enemy] = true;
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
    styleBonus = styleTestBonus(stat),
    identity = identityTestBonus(stat, assignmentMission),
    rank = MSK.indexOf(assignment.rank),
    roll = R(1, 20),
    dc = Math.max(6, 12 + rank * 2 - missionDifficultyBonus(assignmentMission)),
    baseTotal = roll + S[stat] + bonus + styleBonus + identity,
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
    `🎲 ${choice[0]}: ${roll} + ${S[stat]}${bonus ? ` + equipe ${bonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identity ? ` + identidade ${identity}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${total} (precisa de ${dc})`,
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
    styleBonus = styleTestBonus(c[1]),
    identity = identityTestBonus(c[1], M.m),
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
    baseTotal = r + S[c[1]] + bonus + styleBonus + identity,
    bondScene = resolveBondScene(S.team, M, c[1], baseTotal, dc, M.m[1]),
    tt = bondScene.total,
    secondary = M.s == 0 && M.i >= 0 && MISSION_OPTIONS[M.i]?.[0] == c[0];
  M.decisions = M.decisions || [];
  M.decisions.push({ choice: c[0], stat: c[1], success: tt >= dc });
  log(
    `🎲 ${c[0]}: ${r} + ${S[c[1]]}${bonus ? ` + equipe ${bonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${tt} (precisa de ${dc})`,
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
    styleBonus = styleTestBonus(c[1]),
    identity = identityTestBonus(c[1], m),
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
        baseTotal = r + S[c[1]] + bonus + styleBonus + identity,
        bondScene = resolveBondScene(S.team, M, c[1], baseTotal, dc, m[1]),
        tt = bondScene.total;
  M.decisions = M.decisions || [];
  M.decisions.push({ choice: c[0], stat: c[1], success: tt >= dc });
  log(
    M.story?.finale
      ? `🔎 ${c[0]}: você chega ao fim da trilha sem encontrar resistência.`
      : `🎲 ${c[0]}: ${r} + ${S[c[1]]}${bonus ? ` + equipe ${bonus}` : ""}${styleBonus ? ` + estilo ${styleBonus}` : ""}${identity ? ` + identidade ${identity}` : ""}${worldBonus ? ` + mundo ${worldBonus}` : ""}${bondScene.relationship ? ` · ${bondScene.relationship}` : ""} = ${tt} (precisa de ${dc})`,
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
    recordWorldEvent(
      "failure",
      m[1],
      M.m[6] == "protect"
        ? "A proteção falhou e civis ou aliados ainda correm risco."
        : "O objetivo de resgate não foi concluído.",
    );
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
    squad: Array.isArray(progress.squad)
      ? progress.squad.slice()
      : (S.team || []).slice(),
    civilianRisk,
    rescue,
    failures: progress.failures || 0,
  };
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
    if (bonuses.failures && (bonuses.civilianRisk || bonuses.rescue))
      recordWorldEvent(
        "failure",
        bonuses.title,
        "A missão teve contratempos e os envolvidos ainda comentam o resultado.",
      );
    else if (civilians)
      recordWorldEvent(
        "civilians",
        bonuses.title,
        "Civis foram protegidos sem contratempos.",
      );
    else if (allies)
      recordWorldEvent(
        "rescue",
        bonuses.title,
        "Um aliado foi resgatado com sucesso.",
      );
    else
      recordWorldEvent(
        "success",
        bonuses.title,
        "A missão foi concluída com sucesso.",
      );
  }
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
    requiredRep = REP_REQ[rank] || 0;
  if (S.rk < requiredRank || S.lv < requiredLevel || (S.rep || 0) < requiredRep)
    return log(
      `🔒 Requer rank ${RK[requiredRank]}, nível ${requiredLevel} e reputação ${requiredRep}+.`,
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
