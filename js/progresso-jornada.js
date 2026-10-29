/* Caminhos de vida, reputação regional e diário da jornada. */

const REGION_REPUTATION_CODES = ["k", "a", "o", "x", "s", "m", "r", "n", "g", "t", "f", "i"];

const LIFE_PATHS = {
  hokage: {
    title: "Tornar-se Hokage",
    summary: "Avance pelos exames e conquiste a nomeação já existente na campanha.",
    stages: [
      {
        title: "Alcançar o posto de Chūnin",
        requirement: "Torne-se Chūnin ou alcance um posto superior.",
        ready: () => S.rk >= 2,
        choices: ["Liderar pelo exemplo", "Proteger a equipe primeiro"],
      },
      {
        title: "Assumir responsabilidades de Jōnin",
        requirement: "Torne-se Jōnin e conclua 20 missões.",
        ready: () => S.rk >= 3 && S.done >= 20,
        choices: ["Construir confiança na vila", "Preparar a próxima geração"],
      },
      {
        title: "Receber a nomeação de Hokage",
        requirement:
          "Atenda aos requisitos da campanha: reputação 99,5+, fama 60+, 45 missões, 4 anos de jornada e nível 20.",
        ready: () => !!S.hokage,
        choices: ["Aceitar o dever de proteger todos", "Aceitar o dever de unir a vila"],
      },
    ],
  },
  clanLeader: {
    title: "Liderar um clã",
    summary: "Fortaleça sua linhagem e decida como conduzir seu legado.",
    clanOnly: true,
    stages: [
      {
        title: "Ganhar reconhecimento entre os seus",
        requirement: "Alcance 10 de renome de clã.",
        ready: () => (S.clanRenown || 0) >= 10,
        choices: ["Honrar as tradições", "Abrir espaço para novas ideias"],
      },
      {
        title: "Reunir a família em torno de um propósito",
        requirement: "Alcance 30 de renome de clã.",
        ready: () => (S.clanRenown || 0) >= 30,
        choices: ["Priorizar a proteção do clã", "Fortalecer os laços com a vila"],
      },
      {
        title: "Definir o futuro da linhagem",
        requirement: "Alcance 60 de renome de clã.",
        ready: () => (S.clanRenown || 0) >= 60,
        choices: ["Preservar o legado", "Preparar a próxima geração"],
      },
    ],
  },
  teacher: {
    title: "Ensinar na Academia",
    summary: "Compartilhe sua experiência e ajude novos estudantes a crescer.",
    stages: [
      {
        title: "Construir experiência em campo",
        requirement: "Alcance Chūnin e conclua 5 missões.",
        ready: () => S.rk >= 2 && S.done >= 5,
        choices: ["Ensinar disciplina", "Ensinar trabalho em equipe"],
      },
      {
        title: "Dar três aulas práticas",
        requirement: "Conduza 3 aulas na Academia Ninja.",
        ready: () => (S.academyLessons || 0) >= 3,
        choices: ["Valorizar a estratégia", "Valorizar a confiança"],
      },
      {
        title: "Formar uma nova geração",
        requirement: "Conclua 15 missões e conduza 5 aulas.",
        ready: () => S.done >= 15 && (S.academyLessons || 0) >= 5,
        choices: ["Ensinar a proteger os colegas", "Ensinar a pensar por conta própria"],
      },
    ],
  },
  wanderer: {
    title: "Viver como ninja errante",
    summary: "Construa seu próprio código fora das estruturas de uma vila.",
    stages: [
      {
        title: "Escolher uma vida fora de Konoha",
        requirement: "Torne-se renegado no Portão de Konoha. A deserção zera a reputação da vila e ativa caçadores.",
        ready: () => !!S.rogue?.active,
        choices: ["Assumir as consequências", "Proteger quem ficou para trás"],
      },
      {
        title: "Encontrar seu próprio caminho",
        requirement: "Conclua 3 missões depois da deserção.",
        ready: () => (S.rogue?.missionsDone || 0) >= 3,
        choices: ["Ajudar comunidades locais", "Manter distância dos conflitos"],
      },
      {
        title: "Escolher o legado de um errante",
        requirement: "Conclua 8 missões depois da deserção.",
        ready: () => (S.rogue?.missionsDone || 0) >= 8,
        choices: ["Continuar independente", "Buscar uma organização com objetivos claros"],
      },
    ],
  },
};

const CLAN_STORIES = {
  uchiha: {
    title: "O peso do olhar",
    location: "distrito",
    stages: [
      {
        title: "Ouvir o que a família teme repetir",
        requirement: "Conclua 2 missões e alcance 10 de renome.",
        ready: () => S.done >= 2 && S.clanRenown >= 10,
        prompt: "Parentes querem saber se o poder do Sharingan será usado para proteger ou para alimentar ressentimentos.",
        choices: ["Prometer proteger seus companheiros", "Prometer julgar cada pessoa por suas ações"],
        result: "O clã reconhece que você está construindo um legado próprio.",
      },
      {
        title: "Reconciliar memória e futuro",
        requirement: "Conclua 8 missões e alcance 30 de renome.",
        ready: () => S.done >= 8 && S.clanRenown >= 30,
        prompt: "Uma lembrança dolorosa divide as opiniões da família sobre o lugar dos Uchiha em Konoha.",
        choices: ["Defender a confiança entre clã e vila", "Defender a autonomia do clã sem hostilidade"],
        result: "Sua posição abre espaço para conversas menos marcadas pelo passado.",
      },
    ],
  },
  hyuga: {
    title: "Além da tradição",
    location: "distrito",
    stages: [
      {
        title: "Questionar uma regra injusta",
        requirement: "Conclua 2 missões e alcance 10 de renome.",
        ready: () => S.done >= 2 && S.clanRenown >= 10,
        prompt: "Um jovem parente pede sua opinião sobre tradições que limitam suas escolhas.",
        choices: ["Apoiar mudanças com diálogo", "Apoiar cada pessoa a escolher seu próprio caminho"],
        result: "Sua família começa a discutir responsabilidade sem confundi-la com obediência cega.",
      },
      {
        title: "Proteger a família sem dividi-la",
        requirement: "Conclua 8 missões e alcance 30 de renome.",
        ready: () => S.done >= 8 && S.clanRenown >= 30,
        prompt: "Uma disputa entre parentes ameaça transformar diferenças em ressentimento.",
        choices: ["Mediar um acordo", "Defender quem teve menos voz"],
        result: "Os parentes aceitam um compromisso e passam a confiar em sua liderança.",
      },
    ],
  },
  senju: {
    title: "Vontade de proteger",
    location: "torre",
    stages: [
      {
        title: "Relembrar a promessa dos fundadores",
        requirement: "Conclua 2 missões e alcance 10 de renome.",
        ready: () => S.done >= 2 && S.clanRenown >= 10,
        prompt: "Um registro antigo pergunta o que significa proteger a vila sem apagar as diferenças.",
        choices: ["Proteger todos os moradores", "Unir pessoas sem exigir que pensem igual"],
        result: "Seu compromisso fortalece a ideia de que a vontade do fogo pertence a todos.",
      },
      {
        title: "Servir a comunidade em reconstrução",
        requirement: "Conclua 8 missões e alcance 30 de renome.",
        ready: () => S.done >= 8 && S.clanRenown >= 30,
        prompt: "Moradores pedem que a família Senju ajude a reparar os danos deixados pelos conflitos.",
        choices: ["Priorizar a reconstrução", "Reunir voluntários de diferentes famílias"],
        result: "O trabalho conjunto aproxima a família de quem vive na vila.",
      },
    ],
  },
  uzumaki: {
    title: "Laços que sobrevivem",
    location: "hospital",
    stages: [
      {
        title: "Reunir fragmentos da história",
        requirement: "Conclua 2 missões e alcance 10 de renome.",
        ready: () => S.done >= 2 && S.clanRenown >= 10,
        prompt: "Um pergaminho preservado conta como sobreviventes mantiveram sua identidade longe da terra natal.",
        choices: ["Preservar a história da família", "Compartilhar a história com Konoha"],
        result: "A memória da linhagem deixa de ser apenas uma ausência e passa a ser transmitida.",
      },
      {
        title: "Criar um novo lugar de pertencimento",
        requirement: "Conclua 8 missões e alcance 30 de renome.",
        ready: () => S.done >= 8 && S.clanRenown >= 30,
        prompt: "Um sobrevivente procura um lugar onde possa pertencer sem esconder suas origens.",
        choices: ["Oferecer apoio em Konoha", "Ajudar a procurar outros sobreviventes"],
        result: "Você transforma a resistência da linhagem em uma rede real de apoio.",
      },
    ],
  },
};

function regionalReputation(region = REG[S.loc] || "k") {
  ensureRegionalReputation();
  return S.regionalRep[region] ?? 50;
}

function ensureRegionalReputation() {
  const regions = new Set([
    ...REGION_REPUTATION_CODES,
    ...Object.values(REG || {}),
  ]);
  S.regionalRep =
    S.regionalRep && typeof S.regionalRep == "object" && !Array.isArray(S.regionalRep)
      ? S.regionalRep
      : {};
  regions.forEach((region) => {
    const score = Number(S.regionalRep[region]);
    S.regionalRep[region] = Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : 50;
  });
  return S.regionalRep;
}

function changeRegionalReputation(region, amount) {
  if (!region || !Object.values(REG).includes(region) || !Number.isFinite(amount))
    return 0;
  const previous = regionalReputation(region);
  S.regionalRep[region] = Math.max(0, Math.min(100, previous + amount));
  return S.regionalRep[region] - previous;
}

function regionDisplayName(region) {
  return (
    {
      k: "Konoha",
      a: "Vila da Areia",
      o: "País das Ondas",
      x: "Akatsuki",
      s: "País do Som",
      m: "Monte Myōboku",
      r: "Vila da Chuva",
      n: "Vila da Nuvem",
      g: "Vila da Névoa",
      t: "Templo do Fogo",
      f: "País do Ferro",
      i: "Rotas insulares",
    }[region] || "região desconhecida"
  );
}

function regionalMarketAdjustment() {
  return (50 - regionalReputation()) / 625;
}

function recordJournalEvent(type, title, detail, characters = [], result = "") {
  if (!S || !title) return;
  S.journal = Array.isArray(S.journal) ? S.journal : [];
  S.journal.push({
    day: Math.max(1, Number(S.day) || 1),
    type: String(type || "jornada"),
    title: String(title),
    detail: String(detail || ""),
    characters: [...new Set(characters.filter((id) => typeof id == "string"))],
    result: String(result || ""),
  });
  S.journal = S.journal.slice(-120);
}

function lifePathState(id) {
  S.lifePaths = S.lifePaths || {};
  const path = LIFE_PATHS[id];
  if (!path) return null;
  const state =
    S.lifePaths[id] ||
    (S.lifePaths[id] = { stage: 0, choices: [], completed: false });
  state.stage = Math.max(0, Math.min(path.stages.length, Number(state.stage) || 0));
  state.choices = Array.isArray(state.choices) ? state.choices : [];
  state.completed = state.completed === true || state.stage >= path.stages.length;
  return state;
}

function chooseLifePath(id) {
  const path = LIFE_PATHS[id];
  if (!path || (path.clanOnly && (!S.clan || S.clan == "none")))
    return log("Esse caminho não está disponível para sua linhagem.", "sys");
  S.activeLifePath = id;
  recordJournalEvent("caminho", "Caminho de vida escolhido", path.title, [], "A escolha pode ser alterada enquanto a jornada avança.");
  log(`🧭 Você escolhe explorar o caminho “${path.title}”. A escolha não é permanente; os outros caminhos continuam abertos.`, "ok");
  save();
  render();
}

function resolveLifePathStage(id, choiceIndex) {
  const path = LIFE_PATHS[id],
    state = lifePathState(id),
    stage = path?.stages[state?.stage],
    choice = stage?.choices[choiceIndex];
  if (!path || !state || !stage || !choice || S.activeLifePath != id)
    return log("Esta etapa do caminho de vida não está disponível.", "sys");
  if (!stage.ready())
    return log(`Ainda falta: ${stage.requirement}`, "sys");
  state.choices.push({ day: S.day, stage: state.stage, choice });
  const region = REG[S.loc] || "k";
  if (id == "hokage") {
    if (/confian|proteger|unir/i.test(choice)) {
      S.rep = Math.min(100, (S.rep || 0) + 3);
      changeRegionalReputation("k", 3);
    } else addStat("car", 1);
  } else if (id == "clanLeader") {
    gainClanRenown("D");
    addStat(clanFocusStat() || "int", 1);
    if (/tradições|proteger o clã|preservar o legado/i.test(choice))
      changeRegionalReputation("k", -1);
    else {
      changeRegionalReputation("k", 3);
      S.rep = Math.min(100, (S.rep || 0) + 1);
    }
  } else if (id == "teacher") {
    if (/equipe|confian|proteger/i.test(choice)) {
      addStat("car", 1);
      S.rel.iruka = Math.min(100, (S.rel.iruka || 0) + 2);
    } else addStat("int", 1);
  } else if (id == "wanderer") {
    if (/assumir as consequências/i.test(choice))
      S.rogue.wantedLevel = Math.min(5, (S.rogue.wantedLevel || 1) + 1);
    else if (/comunidades|proteger|para trás/i.test(choice))
      changeRegionalReputation(region, 4);
    else if (/independente/i.test(choice))
      S.fame = Math.min(100, (S.fame || 0) + 2);
    else if (/distância/i.test(choice))
      changeRegionalReputation(region, -2);
    else if (/organização/i.test(choice)) {
      S.rogue.pathOrganizationInterest = true;
      changeRegionalReputation(region, -1);
    }
  }
  const previousTitle = stage.title;
  state.stage++;
  state.completed = state.stage >= path.stages.length;
  if (id == "hokage" && state.stage == path.stages.length) {
    const world = worldConsequences();
    if (/proteger todos/i.test(choice))
      world.villageSafety = Math.min(100, world.villageSafety + 3);
    else world.villageTrust = Math.min(100, world.villageTrust + 3);
  }
  recordJournalEvent(
    "caminho",
    `${path.title}: ${previousTitle}`,
    `Decisão: ${choice}.`,
    [],
    state.completed ? "Caminho concluído." : "Etapa concluída.",
  );
  log(
    `🧭 <b>${previousTitle}</b>: ${choice}. ${
      state.completed
        ? "Você concluiu este caminho."
        : "A próxima etapa já está registrada no seu diário."
    }`,
    "ok",
  );
  save();
  render();
}

function teachAcademyLesson() {
  if (S.loc != "academia")
    return log("Vá à Academia Ninja para conduzir uma aula.", "sys");
  if (S.rk < 2 || (S.done || 0) < 5)
    return log("É preciso ser Chūnin e ter concluído 5 missões para ensinar.", "sys");
  if ((S.fatigue || 0) >= 70)
    return log("Sua fadiga está alta; descanse antes de conduzir uma aula.", "sys");
  S.academyLessons = (S.academyLessons || 0) + 1;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 8);
  S.ck = Math.min(S.mc, S.ck + 5);
  S.rel.iruka = Math.min(100, (S.rel.iruka || 0) + 1);
  gain(8);
  recordJournalEvent("ensino", "Aula na Academia Ninja", `Você conduziu a aula prática número ${S.academyLessons}.`, ["iruka"], "Estudantes receberam orientação e você ganhou 8 XP.");
  log(`🎓 Você conduziu uma aula prática na Academia (${S.academyLessons} no total). +8 XP, +5 chakra e +8% de fadiga.`, "ok");
  tick(1);
  render();
}

function lifePathPanel() {
  const entries = Object.entries(LIFE_PATHS).filter(
    ([, path]) => !path.clanOnly || (S.clan && S.clan != "none"),
  );
  return `<h3>🧭 Caminhos de vida</h3><p>Escolher um caminho só organiza objetivos; não fecha os outros. Cada etapa mostra seus requisitos e pede uma decisão antes de avançar.</p><div class="g">${entries
    .map(([id, path]) => {
      const state = lifePathState(id),
        active = S.activeLifePath == id,
        stage = path.stages[state.stage],
        ready = !!stage?.ready(),
        label = state.completed
          ? "Concluído"
          : `${stage.title} · ${stage.requirement}`;
      const action = state.completed
        ? `log('Este caminho já foi concluído.','sys')`
        : !active
          ? `chooseLifePath('${id}')`
          : ready
            ? `log('Escolha uma decisão abaixo para avançar.','sys')`
            : `log('Requisito pendente: ${stage.requirement.replace(/'/g, "\\'")}','sys')`;
      const choices = active && ready
        ? `<div class="g">${stage.choices
            .map((choice, index) =>
              btn(
                `${choice}<small>Decisão da etapa ${state.stage + 1}/${path.stages.length}</small>`,
                `resolveLifePathStage('${id}',${index})`,
              ),
            )
            .join("")}</div>`
        : "";
      const teachButton =
        id == "teacher" &&
        active &&
        !state.completed &&
        state.stage >= 1
          ? btn(
              `🎓 Conduzir aula na Academia<small>${S.academyLessons || 0} aulas · requer estar na Academia, rank Chūnin e fadiga abaixo de 70%</small>`,
              "teachAcademyLesson()",
              S.loc == "academia" && S.rk >= 2 && S.done >= 5 && (S.fatigue || 0) < 70
                ? "p"
                : "lock",
            )
          : "";
      return `<div class="world"><b>${esc(path.title)}</b><br><small>${esc(path.summary)}</small><br><small>Etapa ${Math.min(state.stage + 1, path.stages.length)}/${path.stages.length} · ${esc(label)}${active ? " · caminho em foco" : ""}</small><div class="row">${btn(active ? "Caminho selecionado" : "Explorar este caminho", action, active ? "p" : "")}</div>${choices}${teachButton}</div>`;
    })
    .join("")}</div>${back}`;
}

function journalPanel() {
  const entries = (S.journal || []).slice().reverse();
  return `<h3>📔 Diário da jornada</h3><p>Registros de decisões, relações, missões e mudanças importantes do mundo.</p>${
    entries.length
      ? `<div class="g">${entries
          .map(
            (entry) =>
              `<div class="world"><b>Dia ${Math.max(1, Number(entry.day) || 1)} · ${esc(entry.title)}</b><br><small>${esc(entry.type)}${entry.characters?.length ? ` · Com: ${entry.characters.map((id) => esc(N[id]?.[0] || id)).join(", ")}` : ""}</small>${entry.detail ? `<br>${esc(entry.detail)}` : ""}${entry.result ? `<br><small>Resultado: ${esc(entry.result)}</small>` : ""}</div>`,
          )
          .join("")}</div>`
      : '<div class="world">Ainda não há acontecimentos importantes registrados. Decisões narrativas, promessas, conflitos e resultados de missões aparecerão aqui.</div>'
  }${back}`;
}

function npcReturnsPanel() {
  const returns = Object.entries(ew().returns || {}).filter(
    ([id, result]) =>
      N[id] &&
      !ew().dead[id] &&
      (!Number.isFinite(result.slot) || slot() <= result.slot),
  );
  if (!returns.length) return "";
  return `<div class="world alert"><b>📨 Aliados voltaram de missão</b><div class="g">${returns
    .map(([id, result]) => {
      const consequence =
        ["naruto", "sasuke", "sakura", "kakashi"].includes(id) &&
        S.worldConsequences?.arcOutcomes?.sasuke?.summary;
      const reflectAction = consequence
        ? btn("Conversar sobre o destino de Sasuke", `resolveNpcReturn('${id}','reflect')`)
        : "";
      return `<div class="world"><b>${esc(N[id][0])}</b> voltou de uma missão rank ${esc(result.rank)} ${result.success ? "bem-sucedida" : "difícil"} (${esc(regionDisplayName(result.region))}).${result.injured ? "<br><small>Voltou ferido e precisou de tratamento.</small>" : ""}<div class="g">${btn("Ouvir e apoiar o relato", `resolveNpcReturn('${id}','support')`)}${reflectAction}</div></div>`;
    })
    .join("")}</div></div>`;
}

function registerNpcMissionReturn(id, assignment, injured = false) {
  if (!N[id] || ew().dead[id] || !assignment) return;
  const rankChance = { C: 0.86, B: 0.74, A: 0.62, S: 0.5 },
    success = Math.random() < (rankChance[assignment.rank] ?? 0.92),
    region = assignment.region || homeOf(id) || "k",
    returns = (ew().returns = ew().returns || {});
  returns[id] = {
    rank: assignment.rank || "C",
    success,
    injured: !!injured,
    region,
    day: S.day,
    slot: slot(),
  };
  log(
    `🗣️ ${N[id][0]} voltou da missão rank ${assignment.rank || "C"} ${success ? "com sucesso" : "após um contratempo"}${injured ? " e precisou de atendimento" : ""}. Seu relato está disponível no mapa.`,
    `${success ? "ok" : "sys"} mission-return`,
  );
  recordJournalEvent(
    "retorno de missão",
    `Retorno de ${N[id][0]}`,
    `Missão rank ${assignment.rank || "C"}.`,
    [id],
    success
      ? "O aliado voltou com a missão concluída."
      : "O aliado voltou após um contratempo.",
  );
}

function expireNpcMissionReturns() {
  const returns = ew().returns || {};
  Object.entries(returns).forEach(([id, result]) => {
    const returnSlot = Number.isFinite(result.slot)
      ? result.slot
      : (result.day || S.day) * 3;
    if (slot() > returnSlot) delete returns[id];
  });
  document.querySelectorAll("#log .mission-return").forEach((message) => {
    message.remove();
  });
}

function resolveNpcReturn(id, response) {
  const result = ew().returns?.[id];
  if (!result || !N[id] || ew().dead[id])
    return log("Não há um relato de missão pendente para essa pessoa.", "sys");
  const bond = bondOf(id),
    world = S.worldConsequences || {},
    sasukeOutcome = world.arcOutcomes?.sasuke?.sasuke,
    storyRelated = ["naruto", "sasuke", "sakura", "kakashi"].includes(id)
      ? sasukeOutcome
        ? world.arcOutcomes.sasuke.summary
        : ""
      : "";
  if (response == "support") {
    remember(
      id,
      "retorno de missão",
      `Você ouviu o relato da missão rank ${result.rank}.`,
      {
        affinity: result.success ? 2 : 0,
        trust: result.success ? 1 : 2,
        respect: 1,
      },
    );
    if (result.success) changeRegionalReputation(result.region, 1);
  } else if (response == "reflect") {
    if (!storyRelated)
      return log(`${N[id][0]} não tem uma consequência recente para conversar.`, "sys");
    remember(id, "decisão narrativa", `Vocês conversaram sobre ${storyRelated}`, {
      affinity: 1,
      trust: 2,
    });
  } else return log("Essa resposta não está disponível.", "sys");

  delete ew().returns[id];
  const responseText =
    response == "reflect"
      ? `Vocês conversam sobre o desfecho: ${storyRelated}`
      : result.success
        ? "Você reconhece o esforço da equipe, e a confiança entre vocês cresce."
        : "Você acolhe o relato do contratempo; sua confiança ajuda a pessoa a seguir em frente.";
  recordJournalEvent(
    "retorno de missão",
    `Relato de ${N[id][0]}`,
    `Missão rank ${result.rank}.`,
    [id],
    responseText,
  );
  log(`<b>${N[id][0]}:</b> “${esc(responseText)}”`, "ok");
  save();
  render();
}

function clanStoryPanel() {
  const story = CLAN_STORIES[S.clan];
  if (!story)
    return '<h4>História da linhagem</h4><div class="world">Sem clã ou linhagem: sua história será construída pelas escolhas, missões e alianças que fizer.</div>';
  S.clanStories = S.clanStories || {};
  const progress = Math.max(0, Math.min(story.stages.length, S.clanStories[S.clan] || 0));
  const stage = story.stages[progress];
  if (!stage)
    return `<h4>${esc(story.title)}</h4><div class="world">Sua história de linhagem foi concluída. As decisões e consequências permanecem no diário.</div>`;
  const canResolve = stage.ready();
  const activeMission =
      S.clanStoryMission?.clan == S.clan &&
      S.clanStoryMission?.stage == progress,
    requirement = `Missão em ${L[story.location][1]} · ${stage.requirement}`,
    missionAction = activeMission
      ? `<div class="g">${stage.choices.map((choice, index) => btn(choice, `resolveClanStory(${index})`)).join("")}</div>`
      : btn(
          `🗺️ Iniciar missão da linhagem<small>${esc(requirement)} · custa 10 chakra e 10% de fadiga</small>`,
          `startClanStoryMission()`,
          canResolve && S.loc == story.location && S.ck >= 10 && (S.fatigue || 0) <= 90 ? "p" : "lock",
        );
  return `<h4>📖 História: ${esc(story.title)}</h4><div class="world"><b>${esc(stage.title)}</b><br>${esc(stage.prompt)}<br><small>Etapa ${progress + 1}/${story.stages.length} · Requisito: ${esc(stage.requirement)} · Missão em ${L[story.location][1]}${activeMission ? ` · iniciada no dia ${S.clanStoryMission.startedDay}` : ""}</small></div>${canResolve ? missionAction : '<div class="world">Continue sua jornada; a missão ficará disponível quando o requisito for cumprido.</div>'}`;
}

function startClanStoryMission() {
  const story = CLAN_STORIES[S.clan],
    progress = S.clanStories?.[S.clan] || 0,
    stage = story?.stages[progress];
  if (!story || !stage || !stage.ready())
    return log("Essa missão de linhagem ainda não está disponível.", "sys");
  if (S.loc != story.location)
    return log(`Vá a ${L[story.location][1]} para iniciar esta missão de linhagem.`, "sys");
  if (S.ck < 10 || (S.fatigue || 0) > 90)
    return log("A missão exige 10 chakra e fadiga abaixo de 90%.", "sys");
  if (
    S.clanStoryMission?.clan == S.clan &&
    S.clanStoryMission?.stage == progress
  )
    return log("A missão de linhagem já está em andamento; escolha como responder.", "sys");
  S.ck -= 10;
  S.fatigue = Math.min(100, (S.fatigue || 0) + 10);
  S.clanStoryMission = { clan: S.clan, stage: progress, startedDay: S.day };
  log(`🗺️ Você iniciou a missão “${esc(stage.title)}”. O relato e as decisões estão prontos; escolha como responder.`, "bt");
  recordJournalEvent("missão de clã", stage.title, stage.prompt, [], "Missão de linhagem iniciada; -10 chakra e +10% de fadiga.");
  save();
  render();
}

function resolveClanStory(choiceIndex) {
  const story = CLAN_STORIES[S.clan],
    progress = S.clanStories?.[S.clan] || 0,
    stage = story?.stages[progress],
    choice = stage?.choices[choiceIndex];
  if (
    !story ||
    !stage ||
    !choice ||
    !stage.ready() ||
    S.clanStoryMission?.clan != S.clan ||
    S.clanStoryMission?.stage != progress
  )
    return log("Essa etapa da história de clã ainda não está disponível.", "sys");
  if (S.loc != story.location)
    return log(`Retorne a ${L[story.location][1]} para concluir a missão de linhagem.`, "sys");
  S.clanStories[S.clan] = progress + 1;
  S.clanStoryMission = null;
  S.clanRenown = (S.clanRenown || 0) + 5;
  const stat = clanFocusStat();
  if (stat) addStat(stat, 1);
  const alignedWithVillage = /proteger seus companheiros|confian|medi|reconstrução|voluntários|compartilhar a história|apoio em konoha/i.test(choice);
  let regional = 0;
  if (alignedWithVillage) {
    regional = changeRegionalReputation("k", 3);
    S.rep = Math.min(100, (S.rep || 0) + 1);
  } else if (S.clan == "uchiha") {
    (S.team || []).forEach((id) =>
      remember(id, "legado de clã", "Você decidiu julgar aliados por suas ações.", {
        trust: 1,
      }),
    );
    regional = changeRegionalReputation("k", 1);
  } else if (S.clan == "hyuga") {
    addStat("car", 1);
    regional = changeRegionalReputation("k", 1);
  } else if (S.clan == "senju") {
    const world = worldConsequences();
    world.villageTrust = Math.max(0, Math.min(100, world.villageTrust + 3));
    regional = changeRegionalReputation("k", 1);
  } else if (S.clan == "uzumaki") {
    S.clanRenown += 2;
    regional = changeRegionalReputation("k", 1);
  }
  S.clanLegacy = {
    clan: S.clan,
    choice,
    day: S.day,
  };
  recordJournalEvent(
    "missão de clã",
    `${story.title}: ${stage.title}`,
    `Decisão: ${choice}.`,
    [],
    `${stage.result} Recompensa: +5 renome, +1 ${stat?.toUpperCase() || "atributo"}, efeito da decisão e +${regional} reputação regional.`,
  );
  log(`🏯 <b>${stage.title}</b>: ${esc(stage.result)} Decisão: ${esc(choice)}. Recompensa: +5 renome, +1 ${stat?.toUpperCase() || "atributo"}${alignedWithVillage ? " e +1 reputação da vila" : ""}.`, "ok");
  save();
  render();
}

function recoveryChoice(kind) {
  garantirSaude();
  const injured = S.lesoes.length > 0,
    stressed = S.estresse > 0,
    clinic = S.loc == "hospital";
  if (kind == "clinic") {
    if (!clinic) return log("Vá ao hospital de Konoha para receber tratamento.", "sys");
    const cost = injured ? 25 + S.lesoes.length * 10 : 15;
    if (!injured && !stressed) return log("Você não precisa de tratamento no momento.", "sys");
    if (S.ryo < cost) return log(`O tratamento custa ${cost} ryō; você tem ${S.ryo}.`, "sys");
    S.ryo -= cost;
    S.lesoes.forEach((injury) => desfazerEfeitos(injury));
    S.lesoes = [];
    S.hp = S.mh;
    S.estresse = Math.max(0, S.estresse - 45);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 25);
    log(`🏥 O hospital tratou suas lesões e reduziu seu estresse. Custo: ${cost} ryō. Lesões removidas; vida restaurada e estresse reduzido em até 45.`, "ok");
    recordJournalEvent("recuperação", "Tratamento no hospital", "Você escolheu tratamento profissional.", [], `Custo: ${cost} ryō. Lesões tratadas sem risco de sequelas.`);
  } else if (kind == "ally") {
    const ally = (S.team || []).find((id) => N[id] && bondOf(id).trust >= 3 && !ew().away[id] && !ew().hurt[id] && !ew().dead[id]);
    if (!ally) return log("É preciso ter na equipe um aliado disponível com confiança 3 ou maior.", "sys");
    if (!injured && !stressed) return log("Você não precisa de apoio agora.", "sys");
    S.hp = Math.min(S.mh, S.hp + Math.ceil(S.mh * 0.25));
    S.ck = Math.min(S.mc, S.ck + Math.ceil(S.mc * 0.25));
    S.estresse = Math.max(0, S.estresse - 20);
    S.fatigue = Math.max(0, (S.fatigue || 0) - 15);
    remember(ally, "apoio na recuperação", "Pediu apoio para se recuperar após lesões e estresse.", { affinity: 1, trust: 1 });
    log(`🤝 ${N[ally][0]} fica ao seu lado. Você recupera 25% da vida e do chakra, reduz 20 de estresse e 15% de fadiga; lesões físicas permanecem.`, "ok");
    recordJournalEvent("recuperação", "Apoio de aliado", "Você pediu apoio para se recuperar.", [ally], "Recuperou 25% de vida e chakra, -20 estresse e -15% fadiga.");
  } else if (kind == "train") {
    if (!injured && !stressed) return log("Você não apresenta lesões nem estresse para arriscar um treino de recuperação.", "sys");
    if ((S.fatigue || 0) >= 90) return log("Com fadiga em 90% ou mais, treinar agora é inseguro. Escolha hospital, apoio ou descanso.", "sys");
    const risk = S.lesoes.some((injury) => injury.id == "grave") ? 30 : injured ? 15 : 0;
    if (risk && !confirm(`Treinar agora custa 10 chakra e 12% de fadiga. Há ${risk}% de chance de piorar uma lesão, mas não de criar sequelas permanentes. Continuar?`)) return;
    if (S.ck < 10) return log("Você precisa de 10 chakra para este treino.", "sys");
    S.ck -= 10;
    S.fatigue = Math.min(100, (S.fatigue || 0) + 12);
    S.estresse = Math.max(0, S.estresse - 5);
    if (risk && Math.random() * 100 < risk) {
      const injury = S.lesoes[0];
      if (injury) injury.dias += 1;
      S.hp = Math.max(1, S.hp - 5);
      log("⚠️ O esforço piora uma lesão: +1 dia de recuperação e -5 HP. Nenhuma sequela permanente foi criada.", "bad");
    } else {
      gain(6);
      log("🥋 O treino leve custa 10 chakra e 12% de fadiga, reduz 5 de estresse e concede 6 XP. Nenhuma lesão piorou.", "ok");
    }
    recordJournalEvent("recuperação", "Treino durante a recuperação", "Você escolheu continuar treinando apesar de lesões ou estresse.", [], "O risco e os custos foram apresentados antes da decisão.");
  } else return log("Escolha de recuperação inválida.", "sys");
  save();
  render();
}
