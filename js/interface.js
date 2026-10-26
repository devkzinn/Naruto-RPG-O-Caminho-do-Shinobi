/* Interface: telas, menus, mapa e renderização. */

let missionBoardTab = "available";

function missionOperationMeters(contract) {
  if (contract.style == "stealth")
    return bar("🕵️ Suspeita", contract.suspicion, 100, "hp");
  if (contract.style == "investigation")
    return (
      bar(
        "🔎 Pistas confirmadas",
        contract.clues.length,
        Math.max(1, contract.days),
        "ck",
      ) + bar("🚨 Alerta no local", contract.alert || 0, 100, "hp")
    );
  if (contract.style == "escort")
    return (
      bar("📦 Integridade da carga", contract.integrity, 100, "ck") +
      bar("⚠️ Risco da rota", contract.routeRisk || 0, 100, "hp")
    );
  if (contract.style == "survival")
    return (
      bar(
        "🎒 Suprimentos",
        contract.supplies,
        Math.max(3, contract.days + 1),
        "ac",
      ) +
      bar("⛺ Abrigo", contract.shelter, 100, "ck") +
      bar("💠 Reserva de chakra", contract.reserve, 100, "lv")
    );
  return "";
}

function campaignBoard() {
  const story = storyState();
  return (
    '<h3>📖 História principal</h3><div class="g">' +
    STORY_ARCS.map((arc, index) => {
      const done = !!story.completed[arc.id],
        stage = story.progress[arc.id] || 0,
        open = storyArcOpen(index),
        destination = arc.missions[stage]?.loc,
        label = done
          ? ""
          : open
            ? `Continuar · etapa ${stage + 1}/${arc.missions.length}: ${arc.missions[stage].title}${destination ? ` · 📍 ${L[destination][1]}` : ""}`
            : storyLockReason(index);
      if (done) return "";
      return btn(
        `${arc.title}<small>${arc.summary}</small><small>${label}</small>`,
        open
          ? `startStoryMission('${arc.id}')`
          : `log('🔒 ${label}','sys')`,
        open ? "p" : "lock",
      );
    }).filter(Boolean).join("") +
    (STORY_ARCS.some((arc) => !story.completed[arc.id])
      ? ""
      : '<small>Todos os arcos disponíveis foram concluídos. Consulte o histórico na aba “Concluídas”.</small>') +
    "</div>" +
    ((S.specialItems || []).length
      ? `<h4>✨ Itens especiais</h4><div class="world">${S.specialItems
          .filter((id) => SPECIAL_ITEMS[id])
          .map(
            (id) =>
              `<b>${esc(SPECIAL_ITEMS[id].name)}</b><br><small>${esc(SPECIAL_ITEMS[id].description)}</small>`,
          )
          .join("<hr>")}</div>`
      : "")
  );
}

function completedMissionBoard() {
  const story = storyState(),
    completedArcs = STORY_ARCS.filter((arc) => story.completed[arc.id]),
    history = (S.missionHistory || []).slice().sort((a, b) => b.day - a.day),
    olderCompletions = Math.max(0, (S.done || 0) - history.length);
  return `<h3>✅ Missões concluídas</h3><small style="color:var(--mu)">Seu histórico de contratos e etapas narrativas concluídas.</small>${
    olderCompletions
      ? `<div class="world"><b>📚 Progresso anterior</b><br><small>${olderCompletions} missão(ões) concluída(s) antes do histórico detalhado ser adicionado ao jogo. O total do save foi preservado; os títulos dessas missões não estavam registrados.</small></div>`
      : ""
  }${
    completedArcs.length
      ? `<h4>Arcos concluídos</h4><div class="g">${completedArcs
          .map(
            (arc) =>
              `<div class="world"><b>${esc(arc.title)}</b><br><small>${esc(story.consequences[arc.id]?.summary || arc.consequence)}</small></div>`,
          )
          .join("")}</div>`
      : ""
  }${
    history.length
      ? `<h4>Histórico de missões · ${history.length}</h4><div class="g">${history
          .map((entry) => {
            const source = entry.storyTitle
              ? entry.storyTitle
              : entry.contractIndex !== null
                ? "Contrato semanal"
                : entry.operationId
                  ? "Designação ou ocorrência"
                  : "Missão";
            return `<div class="world"><b>${rkb(entry.rank || "D")}${esc(entry.title)}</b><br><small>Dia ${entry.day} · ${esc(source)}</small>${entry.description ? `<br><small>${esc(entry.description)}</small>` : ""}</div>`;
          })
          .join("")}</div>`
      : '<div class="world">Nenhuma missão foi concluída ainda. As próximas conclusões aparecerão aqui.</div>'
  }`;
}

function vAssignment() {
  const assignment = S.assignment,
    phase = assignment.phase || 0,
    mission = [
      assignment.rank,
      assignment.title,
      assignment.description,
      "",
      assignment.reward,
      assignment.xp,
    ],
    style = missionRoutineStyle(mission),
    scene =
      phase == 1
        ? assignment.stages[assignment.stage]
        : MISSION_ROUTINES[style][phase == 0 ? 0 : 2],
    squad = assignment.squad.map((id) => `${N[id][1]} ${N[id][0]}`).join(" · ");
  return `<h3>🛡️ ${assignment.title}</h3><small style="color:var(--mu)">Dia ${assignment.stage + 1}/${assignment.stages.length} · ${MISSION_ROUTINE_PHASES[phase]} · Rank ${assignment.rank} · ${assignment.successes} sucessos · ${assignment.failures} contratempos</small><div class="world">🤝 Equipe designada: ${squad}<br>📍 ${L[assignment.loc][1]} · Estilo: ${missionCategoryLabel(missionStyle(mission))}</div><p>${scene[0]}</p><div class="g">${scene[1]
    .map((choice, index) => {
      return btn(
        `${choice[0]}<small>Teste de ${choice[1].toUpperCase()}</small>`,
        `assignmentPick(${index})`,
      );
    })
    .join(
      "",
    )}</div><div class="row">${btn("⏸️ Pausar e voltar ao mapa", "mode='map';render()")}</div>`;
}

function vContract() {
  const contract = S.activeContract;
  if (!contract) return vMap();
  const mission = contract.mission;
  const preparationBonus = Math.min(
    20,
    (contract.preparationSuccesses || 0) * 1.5,
  );
  if (contract.status == "final")
    return `<h3>🏁 Etapa final · ${esc(mission[1])}</h3><p>A operação levou ${contract.days} etapa(s) estratégica(s). Agora falta resolver o objetivo principal.</p><div class="world">✅ ${contract.preparationSuccesses || 0} acertos de operação · ⚠️ ${contract.failures} contratempos<br>🏅 Bônus de recompensa por preparação: +${preparationBonus}%${contract.operationAmbush ? "<br>🚨 O inimigo está preparado para uma emboscada." : ""}</div><div class="g">${btn("Iniciar etapa final", "resumeMultiDayMission()", "p")}</div>`;
  if (contract.status == "deduction")
    return `<h3>🧩 Conclusão da investigação · ${esc(mission[1])}</h3><div class="world"><b>Pistas reunidas</b><br>${contract.clues.length ? contract.clues.map((clue) => `• ${esc(clue)}`).join("<br>") : "Nenhuma pista confirmada. Um palpite errado pode preparar uma emboscada."}<br><br>Escolha quem as evidências apontam como responsável.</div><div class="g">${INVESTIGATION_SUSPECTS.map((suspect, index) => btn(suspect, `resolveInvestigation(${index})`)).join("")}</div>`;
  if (contract.status == "operation") {
    const scene = missionOperationScene(contract);
    return `<h3>📜 ${esc(mission[1])}</h3><small style="color:var(--mu)">${missionCategoryLabel(contract.style)} · etapa ${contract.phase + 1}/${contract.days} · rank ${mission[0]} · ${contract.successes} acertos · ${contract.failures} contratempos</small><div class="world">🎯 ${esc(mission[2])}<br>${missionOperationMeters(contract)}</div><p>${scene[0]}</p><div class="g">${scene[1].map((choice, index) => btn(`${choice.label}<small>Teste de ${choice.stat.toUpperCase()}</small>`, `missionOperationPick(${index})`)).join("")}</div>`;
  }
  const scene = MISSION_ROUTINES[contract.style][contract.phase];
  return `<h3>📜 ${esc(mission[1])}</h3><small style="color:var(--mu)">Dia ${contract.day}/${contract.days} · Rank ${mission[0]} · ${MISSION_ROUTINE_PHASES[contract.phase]}</small><div class="world">🎯 ${esc(mission[2])}<br>🧭 Estilo da missão: ${contract.style == "combat" ? "combate" : contract.style == "retrieve" ? "investigação e recuperação" : contract.style == "deliver" ? "entrega" : contract.style == "rescue" ? "resgate" : contract.style == "protect" ? "proteção" : "escolta"} · ${contract.successes} sucessos · ${contract.failures} contratempos<br>🏅 Preparação: ${contract.preparationSuccesses || 0} acertos · bônus atual +${preparationBonus}%</div><p>${scene[0]}</p><div class="g">${scene[1].map((choice, index) => btn(`${choice[0]}<small>Teste de ${choice[1].toUpperCase()}</small>`, `missionRoutinePick(${index})`)).join("")}</div>`;
}

const back = btn(
  '<span class="back-icon" aria-hidden="true">←</span><span>Voltar</span>',
  "mode='map';render()",
  "back-button",
);

function promotionDutiesPanel() {
  const duties = S.promotionDuties || [];
  if (!duties.length) return "";
  const cards = duties
    .map((duty, index) => {
      const title =
          duty.type == "leadership"
            ? "Liderança Chunin"
            : "Aprendiz Jounin · Konohamaru",
        description =
          duty.type == "leadership"
            ? duty.status == "pending"
              ? "Conclua uma missão com pelo menos um aliado e apresente seu relatório à Hokage."
              : `Missão liderada: ${esc(duty.mission || "não registrada")} · contratempos: ${duty.failures || 0}.`
            : duty.status == "pending"
              ? `Oriente Konohamaru em dois dias diferentes (${duty.mentoringSessions || 0}/2), convide-o para a equipe e conclua uma missão com ele sem contratempos.`
              : `Aprendiz protegido em “${esc(duty.mission || "missão não registrada")}”.`;
      if (duty.status == "review")
        return `<div class="world"><b>📋 ${title} · relatório pendente</b><br>${description}<br><small>Responda à Hokage: um relatório transparente fortalece a confiança; omitir detalhes traz prestígio imediato, mas desgasta os vínculos.</small><div class="row">${S.loc == "torre" ? btn("📜 Relatar com transparência", `reviewPromotionDuty(${index},'transparent')`, "p") + btn("🤫 Omitir detalhes", `reviewPromotionDuty(${index},'conceal')`) : btn("Ir à Torre do Hokage para prestar contas", "travelTo('torre')", "p")}</div></div>`;
      return `<div class="world"><b>${duty.status == "fulfilled" ? "✅" : duty.status == "concealed" ? "⚠️" : "🎖️"} ${title}</b><br>${duty.status == "pending" ? description : duty.status == "fulfilled" ? `Relatório transparente sobre “${esc(duty.mission || "missão não registrada")}”.` : `Você omitiu detalhes sobre “${esc(duty.mission || "missão não registrada")}”; a confiança ficou abalada.`}${duty.type == "mentorship" && duty.status == "pending" && duty.mentoringSessions < 2 && S.loc != "academia" ? `<div class="row">${btn("Levar orientação à Academia", "travelTo('academia')")}</div>` : ""}</div>`;
    })
    .join("");
  return `<h4>🎖️ Responsabilidades do seu rank</h4><div class="g">${cards}</div>`;
}

function vGuide() {
  return `<h3>📘 Guia do shinobi</h3><div class="g">${[
    ["🎮 Como jogar", "O mapa, a missão e a interação com NPCs são seus principais pontos de partida. Explore o mapa, complete missões e use a equipe para melhorar o desempenho."],
    ["🧭 Missões", "Acesse o mural de missões para aceitar contratos. Reputação, nível e rank abrem oportunidades maiores e mais recompensas."],
    ["🤝 Equipe", "Convide aliados com confiança, respeito e afinidade. A equipe melhora o combate e o desempenho em missões mais complexas."],
    ["🧪 Técnicas", "Treine atributos e aprenda jutsus quando atingir os requisitos. Jutsus têm custo de chakra e podem ser mais eficazes conforme sua maestria."],
    ["💾 Saves", "Os saves ficam no navegador e no dispositivo. Use a aba de jornadas para criar espaços, exportar JSON e importar backups sem perder o progresso atual."],
  ].map(([title, body]) => `<div class="world"><b>${title}</b><br><small>${body}</small></div>`).join("")}</div><div class="row">${btn("↩️ Voltar", "mode='map';render()", "p")}</div>`;
}

function vSaves() {
  const state = ensureSaveSlots();
  const active = getActiveSaveKey();
  const cards = Object.values(state.slots || {})
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map((slot) => {
      const summary = slot.summary || { name: slot.name || "Jornada", level: 1, rank: "Academia", day: "Dia 1" };
      const isActive = slot.key == active;
      return `<div class="world ${isActive ? "save-slot-active" : ""}"><b>${esc(slot.name || "Jornada")}</b><br><small>${esc(summary.character || summary.name)} · Nv ${summary.level || 1} · ${esc(summary.rank || "Academia")} · ${esc(summary.day || "Dia 1")}</small><div class="row">${btn(isActive ? "Ativa" : "Carregar", isActive ? "" : `loadSaveSlot('${slot.key}')`, isActive ? "p" : "")}${btn("Exportar", `exportSaveSlot('${slot.key}')`)}${btn("Renomear", `renameSaveSlot('${slot.key}', prompt('Novo nome da jornada:', '${esc(slot.name || "Jornada")}'))`)}${btn("Remover", `if(confirm('Remover este save local?')) { removeSaveSlot('${slot.key}'); }`, isActive ? "lock" : "")}</div></div>`;
    })
    .join("") || `<div class="world">Você ainda não criou um espaço de save. Use “Nova jornada” para iniciar uma segunda linha de progresso.</div>`;
  return `<h3>💾 Jornadas e salvamento</h3><p>Os saves ficam neste navegador e neste dispositivo. Se o navegador for apagado, o conteúdo local pode ser perdido. Faça backup antes de substituir um save e exporte a jornada quando quiser guardar uma cópia em JSON.</p>${cards}<div class="row">${btn("🆕 Nova jornada", `const name = prompt('Nome da jornada:', 'Nova jornada'); if (name) createSaveSlot(name);`, "p")}${btn("📥 Importar JSON", "triggerSaveImport()", "p")}${btn("↩️ Voltar", "mode='map';render()")}</div><input id="saveImportInput" type="file" accept=".json,application/json" style="display:none" onchange="if(this.files && this.files[0]) handleImportSaveFile(this.files[0]); this.value='';" />`;
}

function triggerSaveImport() {
  const input = document.getElementById("saveImportInput");
  if (input) input.click();
}

function removeSaveSlot(slotKey) {
  const state = ensureSaveSlots();
  if (!state.slots[slotKey]) return;
  const wasActive = state.active == slotKey;
  delete state.slots[slotKey];
  if (Object.keys(state.slots).length === 0) {
    state.slots[SV] = { id: SV, key: SV, name: "Jornada principal", summary: { name: "Jornada principal", character: "Sem personagem", level: 1, rank: "Academia", day: "Dia 1" }, updatedAt: Date.now() };
  }
  if (wasActive) state.active = Object.keys(state.slots)[0] || SV;
  persistSaveSlotsState(state);
  if (wasActive && S && S.saveSlotKey == slotKey) {
    const next = getSaveByKey(state.active);
    if (next) {
      const restored = Object.assign(fresh(next.n, next.a, next.el), next);
      S = restored;
      S.saveName = state.slots[state.active].name;
      S.saveSlotKey = state.active;
      render();
    }
  }
  render();
}

function vMap() {
  const x = EXR[S.rk];
  const people = pres(S.loc)
    .map((id) => {
      const travel = S.wd?.travel?.[id],
        recovery = npcRecovery(id);
      return btn(
        `${N[id][1]} ${N[id][0]}<small>${ageOf(id)} anos · ${N[id][2]}</small><small>${rl(S.rel[id] || 0)}${S.rs[id] == "couple" ? " · 💞" : ""}</small>${recovery ? `<small>🏥 Em recuperação · rotina em cerca de ${recovery.days} dia(s)</small>` : ""}${travel ? `<small>🚶 A caminho de ${L[travel.to][1]}</small>` : ""}`,
        `npc('${id}')`,
      );
    })
    .join("");
  const incident = S.urgent
    ? `<div class="world alert"><b>🚨 CHAMADO URGENTE · ${S.urgent.title}</b><br>${S.urgent.description}${crisisInfo(S.urgent)}<br><small>Destino: ${L[S.urgent.loc][1]} · prazo: ${S.urgent.daysLeft} dia(s)</small>${S.urgent.response == "ignored" ? "<p>Você decidiu não intervir. A situação continua evoluindo.</p>" : S.urgent.response == "self" ? "<p>Você assumiu o atendimento; viaje até o destino para começar.</p>" : ""}${S.urgent.response == "ignored" ? "" : `<div class="row">${S.urgent.response == "self" ? btn(S.loc == S.urgent.loc ? "Atender chamado" : "Viajar até o destino", S.loc == S.urgent.loc ? "answerUrgent()" : "goUrgent()", "p") : ""}</div>`}</div>`
    : "";
  const examButton =
    S.rk < 3
      ? btn(
          `${x.nm}<small>${exok(x) ? "Requisitos completos · iniciar" : `Requisitos: ${exreq(x)}`}</small>`,
          "exam()",
          exok(x) ? "p" : "lock",
        )
      : "";
  const dutiesPanel = promotionDutiesPanel();
  const deployment = S.assignment
    ? `<div class="world alert"><b>📜 Designação da Hokage: ${S.assignment.title}</b><br>${S.assignment.description}<br><small>Equipe: ${S.assignment.squad.map((id) => N[id][0]).join(" e ")} · ${S.assignment.status == "active" ? `dia ${S.assignment.stage + 1}/${S.assignment.stages.length} · ${MISSION_ROUTINE_PHASES[S.assignment.phase || 0]}` : "apresente-se na Torre do Hokage"}</small><div class="row">${S.assignment.status == "active" ? btn("Retomar operação", "mode='assignment';render()", "p") : btn(S.loc == "torre" ? "Partir para a missão" : "Ir à Torre do Hokage", S.loc == "torre" ? "answerAssignment()" : "go('torre')", "p")}</div></div>`
    : "";
  const contractDeployment = S.activeContract
    ? `<div class="world alert"><b>📜 Operação em andamento: ${esc(S.activeContract.mission[1])}</b><br><small>${S.activeContract.status == "final" ? "Operação concluída · objetivo final pendente" : S.activeContract.status == "deduction" ? "Investigação pronta · conclusão pendente" : S.activeContract.status == "routine" ? `Dia ${S.activeContract.day}/${S.activeContract.days} · ${MISSION_ROUTINE_PHASES[S.activeContract.phase]}` : `Etapa ${Math.min(S.activeContract.phase + 1, S.activeContract.days)}/${S.activeContract.days} · ${S.activeContract.style == "stealth" ? "suspeita " + S.activeContract.suspicion + "%" : S.activeContract.style == "escort" ? "integridade da carga " + S.activeContract.integrity + "%" : S.activeContract.style == "survival" ? "suprimentos " + S.activeContract.supplies : S.activeContract.style == "investigation" ? "pistas " + S.activeContract.clues.length : missionCategoryLabel(S.activeContract.style)}`}</small><div class="row">${btn(S.activeContract.status == "final" ? "Retomar etapa final" : S.activeContract.status == "deduction" ? "Concluir investigação" : S.activeContract.status == "routine" ? "Retomar rotina diária" : "Retomar operação", "resumeMultiDayMission()", "p")}</div></div>`
    : "";
  const tabs = [
    ["places", "📍 Mapa"],
    ["training", "🥋 Treinos"],
    ["care", "🧘 Descanso"],
    ["services", "📜 Serviços"],
    ["action", "✍️ Ação"],
    ["act", "🎯 Fazer"],
  ];
  const nav = `<nav class="category-nav" aria-label="Categorias de ações">${tabs.map(([key, label]) => `<button class="b category-tab ${mapTab == key ? "cat-active" : ""}" aria-pressed="${mapTab == key}" onclick="mapTab='${key}';render()">${label}</button>`).join("")}</nav>`;
  const mapaViagem = `<div class="map-heading"><h4>🗺️ Mapa de viagem</h4><small>Dia ${S.day} · Saída: ${L[S.loc][1]}</small></div>${consequencePanel()}<p><small style="color:var(--mu)">Toque em um marcador para selecionar o destino. Em telas pequenas, deslize o mapa na horizontal. O caminho e os requisitos aparecem logo abaixo.</small></p>${mapLegend()}${mapSVG()}${mapPanel()}`;
  let content = "";
  if (mapTab == "places")
    content = `<h3>${L[S.loc][0]} ${L[S.loc][1]}</h3><div class="world">🌦️ ${S.season || "Primavera"} · ${S.weather || "Céu limpo"} · ${S.rogue?.active ? `Procurado · nível ${S.rogue.wantedLevel}` : `Reputação da vila: ${Math.floor(S.rep || 0)}/100`} · Fama em ${esc(regionDisplayName(REG[S.loc]))}: ${Math.round(regionalReputation(REG[S.loc]))}/100</div>${locationConsequencePanel(S.loc)}${npcReturnsPanel()}${S.rogue?.active && REG[S.loc] == "k" ? '<div class="world alert">🚨 Você está em território de Konoha. Patrulhas podem reconhecer seu rosto e chamar caçadores.</div>' : ""}${S.loc == "portao" && !S.rogue?.active ? '<div class="world alert"><b>🚨 Deserção</b><br>Abandonar Konoha fará de você um criminoso procurado. Esta escolha encerra seus vínculos com a vila.</div><div class="row">${btn("🏃 Desertar de Konoha", "becomeRenegade()")}</div>' : ""}${dutiesPanel}<h4>Pessoas por perto</h4><div class="g">${people || "<small>Ninguém está por aqui agora.</small>"}</div>${mapaViagem}`;
  else if (mapTab == "training")
    content =
      `<h3>🥋 Treinos e progressão</h3><small style="color:var(--mu)">Fadiga ${S.fatigue || 0}% · Tai ${S.practice?.tai || 0}/3 · Vel ${S.practice?.vel || 0}/3 · Nin ${S.practice?.nin || 0}/3 · Int ${S.practice?.int || 0}/3</small><div class="g">` +
      btn(
        "🥋 Treino físico<small>Desenvolve Tai · aumenta fadiga</small>",
        "self('tai')",
      ) +
      btn(
        "🏃 Treino de agilidade<small>Desenvolve Vel · aumenta fadiga</small>",
        "self('vel')",
      ) +
      btn(
        "🌀 Controle de chakra<small>Desenvolve Nin · custa chakra</small>",
        "self('nin')",
      ) +
      btn(
        "📖 Estudo tático<small>Desenvolve Int · exige concentração</small>",
        "self('int')",
      ) +
      btn(
        "🎯 Praticar jutsu<small>Consome chakra e aumenta maestria</small>",
        "mode='jt';render()",
      ) +
      btn(
        "📘 Guia rápido<small>Relembre comandos e sistemas do jogo</small>",
        "mode='guide';render()",
      ) +
      (S.loc == "academia" && academyStudent() && !academyComplete()
        ? btn(
            `📚 Aula prática<small>${S.academySessions || 0}/${ACADEMY_CLASS_COUNT} aulas concluídas</small>`,
            "academyClass()",
          )
        : "") +
      examButton +
      "</div>";
  else if (mapTab == "care")
    content =
      `<h3>🧘 Recuperação</h3><div class="g">` +
      btn(
        "🧘 Meditar<small>Recupera chakra e reduz fadiga</small>",
        "self('m')",
      ) +
      btn(
        "🛏️ Dormir<small>Avança até amanhã e restaura energia</small>",
        "self('s')",
      ) +
      (S.kit
        ? btn(
            "🩹 Usar kit médico<small>Recupera até 40 HP</small>",
            "item('kit')",
          )
        : "") +
      (S.pill
        ? btn(
            "💊 Usar pílula<small>Recupera até 40 chakra</small>",
            "item('pill')",
          )
        : "") +
      `<div class="world"><b>Escolha conforme sua condição.</b><br>${S.lesoes.length ? `Lesões: ${S.lesoes.map((injury) => `${esc(injury.nome)} (${injury.dias} dia(s))`).join(", ")}. ` : "Sem lesões ativas. "}${S.estresse || 0} de estresse · ${S.fatigue || 0}% de fadiga.<br><small>Hospital em Konoha: ${S.lesoes.length ? `${25 + S.lesoes.length * 10} ryō, remove lesões sem sequelas e restaura vida` : "15 ryō para reduzir estresse"}; aliado de confiança: recupera 25% de vida/chakra, -20 estresse e -15 fadiga, mas não trata lesões; treino: -10 chakra, +12 fadiga, -5 estresse, +6 XP e risco informado antes da confirmação.</small></div>` +
      btn(
        `🏥 Tratamento no hospital<small>${S.loc == "hospital" ? `${S.lesoes.length ? 25 + S.lesoes.length * 10 : 15} ryō · remove lesões sem sequelas, restaura vida e reduz até 45 estresse` : "Vá ao Hospital de Konoha"}</small>`,
        "recoveryChoice('clinic')",
        S.loc == "hospital" && (S.lesoes.length || S.estresse) && S.ryo >= (S.lesoes.length ? 25 + S.lesoes.length * 10 : 15) ? "p" : "lock",
      ) +
      btn(
        `🤝 Pedir apoio a aliado<small>${(S.team || []).some((id) => bondOf(id).trust >= 3 && !ew().away[id] && !ew().hurt[id] && !ew().dead[id]) ? "25% de vida/chakra · -20 estresse · -15% fadiga · lesões permanecem" : "Requer aliado na equipe, disponível, com confiança 3+"}</small>`,
        "recoveryChoice('ally')",
        (S.team || []).some((id) => bondOf(id).trust >= 3 && !ew().away[id] && !ew().hurt[id] && !ew().dead[id]) && (S.lesoes.length || S.estresse) ? "" : "lock",
      ) +
      btn(
        `🥋 Treinar durante a recuperação<small>-10 chakra · +12% fadiga · -5 estresse · +6 XP${S.lesoes.length ? ` · risco de piorar lesão: ${S.lesoes.some((injury) => injury.id == "grave") ? 30 : 15}% (sem sequelas permanentes)` : ""}</small>`,
        "recoveryChoice('train')",
        (S.lesoes.length || S.estresse) && (S.fatigue || 0) < 90 && S.ck >= 10 ? "" : "lock",
      ) +
      "</div>";
  else if (mapTab == "services")
    content =
      `<h3>📜 Serviços</h3><div class="g">` +
      btn(
        `🤝 Equipe shinobi<small>${(S.team || []).length}/2 aliados · convites por confiança e contexto</small>`,
        "mode='team';render()",
        "p",
      ) +
      btn(
        `${CLANS[S.clan]?.icon || "🍃"} Linhagem<small>${CLANS[S.clan]?.name || "Sem clã"} · renome ${S.clanRenown || 0}</small>`,
        "mode='clan';render()",
      ) +
      btn(
        "🌐 Organizações shinobi<small>ANBU, Akatsuki e processos seletivos</small>",
        "mode='org';render()",
      ) +
      btn(
        "💾 Jornadas e saves<small>Gerencie espaços de progresso locais, exporte e importe JSON</small>",
        "mode='saves';render()",
      ) +
      btn(
        "🧭 Caminhos de vida<small>Hokage, liderança de clã, ensino ou vida errante · escolhas não são permanentes</small>",
        "mode='lifePaths';render()",
      ) +
      btn(
        `📔 Diário da jornada<small>${(S.journal || []).length} acontecimentos importantes</small>`,
        "mode='journal';render()",
      ) +
      btn(
        `${S.rogue?.active ? "🚨" : "🕊️"} Caminho do renegado<small>${S.rogue?.active ? `Procurado · nível ${S.rogue.wantedLevel}` : "Deserção, caçadores e vida criminosa"}</small>`,
        "mode='rogue';render()",
      ) +
      btn(
        "🎒 Inventário<small>Consumíveis, equipamentos e itens especiais</small>",
        "mode='inventory';render()",
      ) +
      (S.rk > 0
        ? btn(
            "📜 Abrir mural de missões<small>Escolha um contrato disponível</small>",
            "mode='ms';render()",
            "p",
          )
        : btn(
            "📜 Missões<small>Disponível após se tornar Genin</small>",
            "log('O mural de missões abre quando você se tornar Genin.','sys')",
            "lock",
          )) +
      (S.loc == "mercado"
        ? btn(
            "🛒 Abrir loja ninja<small>Suprimentos e pergaminhos</small>",
            "mode='shop';render()",
            "p",
          )
        : "") +
      "</div>";
  else if (mapTab == "act") content = actsView();
  else {
    const nearby = pres(S.loc);
    content = `<h3>✍️ Ação livre</h3><p>Escreva uma ação ou escolha um exemplo para executá-lo imediatamente. Algumas ações avançam o tempo.</p><div class="row"><input type="text" id="fr" placeholder="Ex.: treinar, dormir, comer ramen ou explorar" aria-label="Descreva uma ação" onkeydown="if(event.key=='Enter')fr()">${btn("Executar", "fr()", "p")}</div><h4>Exemplos rápidos</h4><div class="g">${FREE_TEXT_EXAMPLES.map(([label], index) => btn(label, `runFreeTextExample(${index})`)).join("")}</div>${nearby.length ? `<h4>Conversar com alguém por perto</h4><div class="g">${nearby.map((id, index) => btn(`💬 ${N[id][0]}<small>Iniciar uma conversa</small>`, `talkToNearbyExample(${index})`)).join("")}</div>` : ""}`;
  }
  return (
    incident +
    fillerEventPanel() +
    nav +
    deployment +
    contractDeployment +
    content
  );
}

function vTeam() {
  const dead = ew().dead,
    team = (S.team || []).filter((id) => N[id] && !dead[id]),
    available = pres(S.loc).filter((id) => !dead[id] && !team.includes(id));
  const teamCards = team
      .map((id) => {
        const bond = bondOf(id);
        return btn(
          `${N[id][1]} ${N[id][0]}<small>${N[id][2]} · Confiança ${bond.trust} · Missões em conjunto ${bond.sharedMissions}</small><small>Especialidade ${allyTestStat(id).toUpperCase()} · remover da equipe</small>`,
          `toggleTeam('${id}')`,
        );
      })
      .join(""),
    availableCards = available
      .map((id) => {
        const bond = bondOf(id),
          known =
            bond.trust >= 1 ||
            bond.sharedMissions >= 1 ||
            ((S.rep || 0) >= 50 && S.car >= 9),
          cooldown = S.day < (S.teamInvites?.[id] || 0),
          estimate = known
            ? `Aceite estimado: ${Math.round(teamInvitationChance(id))}%`
            : "Ainda precisam agir juntos antes de considerar um convite";
        return btn(
          `${N[id][1]} ${N[id][0]}<small>Afinidade ${S.rel[id] || 0} · confiança ${bond.trust} · respeito ${bond.respect}</small><small>${estimate}${cooldown ? ` · aguarde até o dia ${S.teamInvites[id]}` : ""}</small>`,
          `inviteToTeam('${id}')`,
          cooldown ? "lock" : "",
        );
      })
      .join("");
  return (
    `<h3>🤝 Equipe shinobi · ${team.length}/2</h3><p>Convites são pessoais e podem ser recusados. Afinidade ajuda, mas confiança, respeito, missões compartilhadas, carisma, reputação e a disposição de cada pessoa também contam. Aliados apoiam operações e combates.</p><h4>Equipe atual</h4><div class="g">${teamCards || "<small>Nenhum aliado selecionado.</small>"}</div><h4>Pessoas por perto</h4><div class="g">` +
    (availableCards ||
      "<small>Ninguém disponível neste local. Procure pessoas no mapa e construa confiança antes de convidá-las.</small>") +
    `</div><div class="row">${back}</div>`
  );
}

function vClan() {
  const clan = CLANS[S.clan] || CLANS.none,
    stat = clanFocusStat(),
    nextMilestone = [10, 30, 60].find(
      (threshold) => (S.clanRenown || 0) < threshold,
    ),
    members = (CLAN_FAMILY_MEMBERS[S.clan] || []).filter((id) => N[id]);
  return `<h3>${clan.icon} Linhagem · ${esc(clan.name)}</h3><div class="world">${esc(clan.tradition || clan.description)}<br><small>${esc(clan.description)}</small></div>${
    S.clan == "none"
      ? '<p>Você não escolheu uma linhagem no início da jornada. Seu caminho não depende de sangue ou herança.</p>'
      : `<h4>Legado da família</h4><div class="world">Renome da linhagem: <b>${S.clanRenown || 0}</b> · foco: <b>${stat?.toUpperCase() || "—"}</b><br><small>Missões concluídas fortalecem o nome da família. Marcos em 10, 30 e 60 de renome concedem +1 no atributo de foco; renome também aprimora técnicas características a partir de 25 e 50.</small>${nextMilestone ? `<br>Próximo marco: ${nextMilestone} (${Math.max(0, nextMilestone - (S.clanRenown || 0))} de renome restantes).` : "<br>Todos os marcos de legado foram alcançados."}</div>`
  }${
    members.length
      ? `<h4>Parentes e figuras da linhagem</h4><div class="g">${members
          .map((id) => {
            if (ew().dead[id])
              return `<div class="world">${N[id][1]} ${N[id][0]} · falecido(a); sua memória permanece no mundo.</div>`;
            const location = where(id);
            return location
              ? btn(
                  `${N[id][1]} ${N[id][0]}<small>${N[id][2]} · ${L[location][1]}</small>`,
                  location == S.loc ? `npc('${id}')` : `go('${location}')`,
                )
              : `<div class="world">${N[id][1]} ${N[id][0]} · fora da vila ou em missão.</div>`;
          })
          .join("")}</div>`
      : ""
  }${clanStoryPanel()}<div class="row">${back}</div>`;
}

function vOrganization() {
  const membership = S.organizations?.[0],
    application = S.organizationApplication,
    stage =
      application && !application.failed
        ? ORGANIZATIONS[application.id]?.tests[application.step]
        : null;
  if (membership) {
    const organization = ORGANIZATIONS[membership],
      record = [...(S.organizationHistory || [])]
        .reverse()
        .find((entry) => entry.id == membership && entry.leftDay === null);
    return `<h3>${organization.icon} ${organization.name}</h3><div class="world">${esc(organization.description)}<br><b>Benefício:</b> ${esc(organization.perk)}<br><small>Integrante desde o dia ${record?.joinedDay ?? S.day}. A filiação altera como algumas missões e personagens reagem a você.</small></div><div class="row">${btn("Encerrar vínculo", "leaveOrganization()")}${back}</div>`;
  }
  const activeTrial = stage
    ? `<h4>Seleção · etapa ${application.step + 1}/3</h4><div class="world">${esc(stage[0])}<br><small>Acertos até agora: ${application.successes}/3 · teste com a especialidade escolhida e seu rank.</small></div><div class="g">${stage[1].map(([label], index) => btn(label, `resolveOrganizationTrial(${index})`)).join("")}</div><div class="row">${btn("Abandonar seleção", "cancelOrganizationApplication()")}</div>`
    : "";
  const options = Object.entries(ORGANIZATIONS)
    .map(([id, organization]) => {
      const req = organization.requirements,
        reason = organizationRequirementReason(id),
        history = (S.organizationHistory || []).some((entry) => entry.id == id),
        requirements = `Requisitos: rank ${RK[req.rank]} · ${req.missions} missões${
          req.renegade ? " · ser renegado" : ""
        } · ${
          req.reputation
            ? `reputação ${req.reputation}+`
            : `reputação até ${req.maxReputation}`
        } · carisma ${req.charisma}+ · seleção em ${L[organization.location][1]}.`,
        note =
          application?.id == id &&
          application.failed &&
          application.cooldownUntil > S.day
            ? `<br><small>Nova tentativa disponível no dia ${application.cooldownUntil}.</small>`
            : "",
        action = reason
          ? `log('🔒 ${reason}','sys')`
          : `startOrganizationApplication('${id}')`;
      return `<div class="world"><b>${organization.icon} ${esc(organization.name)}</b><br>${esc(organization.description)}<br><small class="organization-requirements">${requirements}</small>${history ? "<br><small>Você já participou desta organização; seu histórico continua registrado.</small>" : ""}${note}<div class="row">${btn(reason ? "🔒 Requisitos pendentes" : application?.id == id && !application.failed ? "Continuar seleção" : "Apresentar candidatura", action, reason ? "lock" : "p")}</div></div>`;
    })
    .join("");
  return `<h3>🌐 Organizações shinobi</h3><p>Filiações são escolhas narrativas, não apenas bônus. A reputação pode abrir portas em uma organização e fechá-las em outra; passar por uma seleção não garante que você concordará com suas ordens.</p>${activeTrial}<div class="g">${options}</div>${back}`;
}

function vRogue() {
  if (!S.rogue?.active)
    return `<h3>🕊️ Caminho do renegado</h3><div class="world">Você ainda é reconhecido como shinobi de Konoha. Para desertar, vá ao <b>Portão de Konoha</b> e escolha abandonar a aldeia. A deserção reduz sua reputação a zero, encerra sua filiação atual e ativa caçadores de recompensa.</div><div class="world">A Akatsuki recruta renegados no esconderijo. Você precisará alcançar rank Chunin, concluir 5 missões e passar pela seleção.</div>${S.loc != "portao" ? `<div class="row">${btn("🚪 Ir ao Portão de Konoha", "travelTo('portao')", "p")}</div>` : `<div class="row">${btn("🏃 Desertar de Konoha", "becomeRenegade()")}</div>`}${back}`;
  return `<h3>🚨 Ninja renegado · procurado</h3><div class="world alert"><b>Criminoso de Konoha desde o dia ${S.rogue.sinceDay}</b><br>Nível de procurado: ${S.rogue.wantedLevel} · reputação restante: ${Math.floor(S.rep || 0)}.<br>Caçadores podem emboscar você durante viagens, sobretudo em território da antiga aldeia. Derrotá-los dá ryō, mas aumenta sua notoriedade.</div><div class="g">${btn("🌑 Procurar a Akatsuki<small>Viaje ao esconderijo e apresente sua candidatura</small>", "selectLoc('akatsuki');mapTab='places';mode='map';render()", "p")}</div><div class="world">A entrada no esconderijo exige rank Chunin e 5 missões concluídas. A seleção da organização continua sendo necessária.</div>${back}`;
}

function vNpc() {
  ew();
  const id = T,
    n = N[id],
    lv = S.love[id] || 0,
    st = S.rs[id],
    bond = bondOf(id),
    affinity = S.rel[id] || 0;
  const proximoMarco =
    affinity < 15
      ? "treino com orientação (15)"
      : affinity < 20
        ? "formar equipe (20)"
        : affinity < 30
          ? "encontros (30)"
          : affinity < 40
            ? "aprender jutsu básico (40)"
            : affinity < 55
              ? "aprender jutsu avançado (55)"
              : "novos momentos juntos";
  const painelVinculo = `<h4>Vínculo</h4><div class="status-bars">${bar("💞 Afinidade", Math.max(0, Math.min(100, affinity)), 100, "lv")}${bar("🤝 Confiança", Math.max(0, Math.min(10, bond.trust)), 10, "ck")}${bar("⭐ Respeito", Math.max(0, Math.min(10, bond.respect)), 10, "ac")}</div><small style="color:var(--mu)">Afinidade ${affinity}/100 · ${bondLabel(id)} · próximo marco: ${proximoMarco}.</small>`;
  const confiancaNarrativa = worldConsequences().characterTrust[id];
  const painelNarrativo = Number.isFinite(confiancaNarrativa)
    ? `<div class="world">📖 Confiança narrativa após decisões da campanha: ${confiancaNarrativa > 0 ? "+" : ""}${confiancaNarrativa}. Isso pode mudar a forma como a equipe conversa e reage a missões futuras.</div>`
    : "";
  const recuperacao = npcRecovery(id);
  const marketCrisisDays = marketDisruptionDays();
  const painelRecuperacao = recuperacao
    ? `<div class="world">🏥 ${recuperacao.grave ? "O ferimento é grave e a recuperação exige cuidado." : "Ainda está se recuperando no hospital."} A rotina normal deve voltar em cerca de ${recuperacao.days} dia(s).</div>`
    : "";
  const painelMercado = marketCrisisDays
    ? `<div class="world">📦 Os comerciantes estão repondo estoques após “${esc(S.wd.marketDisruptionTitle || "a crise")}”; presentes custam 15% a mais por ${marketCrisisDays} dia(s).</div>`
    : "";
  const botaoEstilo = STYLE_BOOK.some((estilo) => estilo.master == id)
    ? btn(
        "📘 Aprender estilo de combate<small>Treino com mestre · bônus de +2 em uma especialidade</small>",
        "mode='styles';render()",
      )
    : "";
  // Senseis treinam pela tela de aprendizado; os demais ganham a sessão aqui.
  const botaoSessao =
    !SEN[id] && (AWAYR[id] || SENMAX[id])
      ? btn(
          `🥋 Sessão de treino<small>Prática em ${n[5][0].toUpperCase()} com orientação</small>`,
          `session('${id}')`,
          "p",
        )
      : "";
  const botaoEquipe = S.team?.includes(id)
    ? btn("🤝 Remover da equipe", `toggleTeam('${id}')`)
    : btn(
        "🤝 Convidar para a equipe",
        `inviteToTeam('${id}')`,
      );
  const botaoAprendiz =
    id == "konohamaru" &&
    (S.promotionDuties || []).some(
      (duty) => duty.type == "mentorship" && duty.status == "pending",
    )
      ? btn(
          "🎓 Orientar o aprendiz<small>Requer duas sessões em dias diferentes</small>",
          "mentorApprentice()",
          "p",
        )
      : "";
  const relacoes = RELS.filter((r) => r[0] == id || r[1] == id)
    .map((r) => {
      const outro = r[0] == id ? r[1] : r[0];
      return N[outro]
        ? `${N[outro][1]} ${N[outro][0]} (${r[2]}${S.wd.dead[outro] ? " · falecido" : ""})`
        : "";
    })
    .filter(Boolean);
  const detalheRelacoes = relacoes.length
    ? `<details class="chat-more"><summary>Relações de ${n[0]}</summary><p><small>${relacoes.join(" · ")}</small></p></details>`
    : "";
  let h =
    `<h3>${n[1]} ${n[0]}</h3><small style="color:var(--mu)">${ageOf(id)} anos · ${n[2]} · Vínculo: ${bondLabel(id)} · Afinidade ${S.rel[id] || 0} · Confiança ${bond.trust || 0} · Respeito ${bond.respect || 0}</small>${painelVinculo}${painelNarrativo}${painelRecuperacao}<h4>Interações</h4><div class="g">${botaoEstilo}${botaoSessao}${botaoEquipe}${botaoAprendiz}` +
    btn("💬 Conversar<small>Trocar algumas palavras</small>", "dn('talk')") +
    btn(
      "🥋 Treinar juntos<small>Ganha afinidade e prática</small>",
      "dn('train')",
    ) +
    btn(
      "⚔️ Duelo amistoso<small>Combate sem risco de missão</small>",
      "dn('duel')",
    ) +
    btn("🤝 Pedir conselho<small>Requer afinidade 35</small>", "dn('adv')") +
    btn("😈 Provocar<small>Pode começar uma briga</small>", "dn('bully')") +
    (bond.rivalry > 0 || bond.trust < 0
      ? btn("🕊️ Fazer as pazes", `reconcile('${id}')`)
      : "") +
    (SEN[id]
      ? btn(
          "🎓 Aprender técnicas<small>Treino especial com sensei</small>",
          "mode='sen';render()",
          "p",
        )
      : "") +
    back +
    `</div>${painelMercado}<h4>Presentear</h4><div class="g">` +
    Object.keys(G)
      .map((g) =>
        btn(
          `${G[g][0]}<small>${marketPrice(G[g][1])} ryō</small>`,
          `dn('gift','${g}')`,
        ),
      )
      .join("") +
    "</div>";
  const promise = S.promises?.[id];
  if (S.team?.includes(id))
    h +=
      promise?.status == "pending"
        ? `<div class="world">🤞 Promessa pendente: conte com ${n[0]} na próxima missão até o dia ${promise.dueDay}.</div>`
        : btn("🤞 Prometer apoio na próxima missão", `promiseSupport('${id}')`);
  if (S.loc == "ichiraku")
    h += `<h4>Momento compartilhado</h4><div class="g">${btn("🍜 Dividir uma refeição<small>15 ryō · recupera um pouco de energia</small>", `shareMeal('${id}')`)}</div>`;
  h += `<details class="chat-more"><summary>Memórias do vínculo · ${bond.events.length}</summary>${
    bond.events.length
      ? bond.events
          .slice()
          .reverse()
          .map(
            (event) =>
              `<p><small>Dia ${event.day} · ${esc(event.type)}: ${esc(event.detail)}</small></p>`,
          )
          .join("")
      : "<small>Vocês ainda estão começando a se conhecer.</small>"
  }</details>`;
  if (S.socialEvent?.npc == id) {
    const scene = SOCIAL_SCENES[id];
    h += `<div class="world"><b>${n[0]}:</b> ${scene.prompt}</div><div class="g">${scene.choices.map((choice, index) => btn(choice[0], `resolveSocial(${index})`)).join("")}${btn("Ignorar por agora", "ignoreSocial()")}</div>`;
  }
  if (rom(id))
    h +=
      `<h4>Romance${st == "couple" ? " · 💞 Namorando" : st == "date" ? " · 💕 Saindo juntos" : ""}</h4>` +
      bar("💗 Intimidade", lv, 100, "lv") +
      '<div class="g">' +
      btn("😉 Flertar", "flirt()") +
      btn("🌹 Convidar para sair<small>40 ryo</small>", "inv()") +
      (st == "date" ? btn("💍 Pedir em namoro", "ask()") : "") +
      (st == "couple"
        ? btn("🍃 Tempo juntos", "couple('t')") +
          btn("💋 Beijar", "couple('k')") +
          btn("🌙 Noite a dois", "couple('n')") +
          btn("💔 Terminar", "couple('x')")
        : "") +
      "</div>";
  const painel =
    h +
    `<h4>Conversa</h4><div class="g">` +
    btn("📍 Onde estamos?", "say('Onde estamos agora?')") +
    btn("📜 Missões", "say('Como está a missão atual?')") +
    btn("🥋 Treinamento", "say('Como posso melhorar no treinamento?')") +
    btn("🌠 Sonhos", "say('Qual é o seu maior sonho?')") +
    `</div><details class="chat-more"><summary>Mais assuntos</summary><div class="g">` +
    btn("🌦️ Clima e chamados", "say('Como está o clima e as ocorrências?')") +
    btn("🗣️ Rumores", "say('Ouviu algum rumor por aqui?')") +
    btn("🧑‍🤝‍🧑 Equipe", "say('O que faz uma boa equipe?')") +
    btn("🛡️ Princípios", "say('O que você protegeria acima de tudo?')") +
    btn("📖 Sobre você", "say('Me conta algo sobre você.')") +
    btn("🎂 Idade", "say('Quantos anos você tem?')") +
    `</div></details><div class="row"><input type="text" id="fr" maxlength="180" aria-label="Sua mensagem" placeholder="Escreva para ${n[0]}…" onkeydown="if(event.key=='Enter')say()">${btn("Enviar", "say()", "p")}</div>`;
  return painel + detalheRelacoes;
}

const vDate = () =>
  `<h3>🌹 Encontro com ${N[T][0]}</h3><p>Como vocês vão passar o tempo?</p><div class="g">` +
  DT.map((d, i) =>
    btn(`${d[0]}<small>usa ${d[1].toUpperCase()}</small>`, `dt(${i})`),
  ).join("") +
  "</div>";

const teamAction = () => {
  if (!B.team?.length || B.teamUsed) return "";
  let actions = btn(
    "🤝 Ataque conjunto<small>Dano com a equipe · uma vez por combate</small>",
    "act('team')",
  );
  if (B.team.includes("naruto") && B.team.includes("sasuke")) {
    const bond = teamPairBondOf("naruto", "sasuke");
    actions += btn(
      `🌀⚡ Combo: Naruto + Sasuke<small>Dano elevado · expõe a guarda · 10 chakra · vínculo ${bond.trust}/2${bond.trust >= 2 ? ` · bônus de dano +${Math.min(6, bond.trust * 2)}` : ""}</small>`,
      "act('combo','naruto-sasuke')",
      "p",
    );
  }
  TEAM_COMBAT_SYNERGIES.filter(
    (synergy) =>
      synergy.id != "naruto-sasuke" &&
      synergy.members.every((id) => B.team.includes(id)),
  ).forEach((synergy) => {
    const bond = teamPairBondOf(...synergy.members),
      ready = bond.trust >= synergy.bond;
    actions += btn(
      `${synergy.name}<small>${synergy.description} · ${synergy.chakra} chakra · vínculo ${bond.trust}/${synergy.bond} (${bond.missions} missões juntos)${ready ? "" : " · bloqueada"}</small>`,
      ready
        ? `act('combo','${synergy.id}')`
        : `log('${synergy.name} precisa de ${synergy.bond} missões concluídas juntos para desbloquear a técnica.','sys')`,
      ready ? "p" : "lock",
    );
  });
  if (B.team.includes("sakura")) {
    actions += btn(
      "🌸 Apoio médico: Sakura<small>Recupera vida e revela uma abertura</small>",
      "act('combo','sakura')",
    );
  }
  if (B.team.includes("shikamaru")) {
    actions += btn(
      "♟️ Plano de Shikamaru<small>Imobiliza o alvo e abre uma janela · 6 chakra</small>",
      "act('combo','shikamaru')",
    );
  }
  return actions;
};

const vBattle = () =>
  `<h3>${B.boss ? "👹" : "⚔️"} ${B.n} ${B.el ? E[B.el][1] : ""}</h3>` +
  bar(
    B.boss ? (B.ph ? "Chefe · Fase 2" : "Chefe") : "Inimigo",
    B.hp,
    B.mx,
    "hp",
  ) +
  (B.boss
    ? `<div class="world alert"><b>🎯 Padrão: ${(BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy).title}</b><br>${B.ch ? `⚠️ Próximo movimento: ${B.intent}` : "Observe os sinais antes do próximo golpe especial."}<br>${B.weaknessKnown ? `Fraqueza descoberta: <b>${(BOSS_PATTERNS[B.pattern] || BOSS_PATTERNS.heavy).weaknessName}</b>.` : "Fraqueza ainda desconhecida."}${B.exposed || B.open ? "<br>✨ A guarda está aberta: aproveite para atacar!" : ""}</div>`
    : "") +
  (!B.boss
    ? `<div class="world alert"><b>🎯 Tática inimiga:</b> ${B.tactic == "trap" ? "armadilhas — o sinal aparece antes do disparo; defenda-se ou interrompa a preparação." : B.tactic == "guard" ? "proteção — a guarda reduz o próximo dano; espere a postura passar ou ataque mesmo assim com dano reduzido." : "carga de chakra — o golpe forte é anunciado; defenda-se, use barreira ou interrompa com controle."}</div>`
    : "") +
  (B.ch
    ? '<p class="bad"><b>⚠️ Golpe especial no próximo turno!</b></p>'
    : "") +
  (B.burnTurns
    ? `<small class="bad">🔥 Queimadura: ${B.burnTurns} turno(s)</small>`
    : "") +
  (B.stunTurns ? '<small class="ok">⚡ Inimigo paralisado</small>' : "") +
  (B.slowTurns
    ? '<small class="sys">Corrente elétrica enfraqueceu o ataque</small>'
    : "") +
  (B.wallTurns
    ? `<small class="ok">🪨 Parede de Terra: ${B.wallTurns} proteção(ões)</small>`
    : "") +
  (B.poisonTurns
    ? `<small class="bad">☠️ Veneno: ${B.poisonTurns} turno(s) restantes · ${B.poisonDamage} dano por turno</small>`
    : "") +
  (B.playerPinned
    ? '<small class="bad">⏳ Desequilibrado: seu próximo ataque causa menos dano</small>'
    : "") +
  `<small style="color:var(--mu)">Equipe: ${(B.team || []).map((id) => N[id][0]).join(", ") || "sem aliados"}${B.teamUsed ? " · ação cooperativa usada" : ""}</small><h4>Sua ação</h4><div class="g">` +
  btn(
    "👊 Golpe de taijutsu<small>Dano físico, sem custo de chakra</small>",
    "act('tai')",
  ) +
  S.jt
    .map((k) => {
      const effect = JUTSU_EFFECTS[k];
      return btn(
        `${jn(k)}<small>${jc(k)} chakra · Maestria ${mlv(k)}${effect ? ` · ${effect.label}` : ""}</small>`,
        `act('jut','${k}')`,
      );
    })
    .join("") +
  teamAction() +
  btn("🛡️ Defender<small>Reduz dano e recupera chakra</small>", "act('def')") +
  (S.kit
    ? btn(
        `🩹 Kit médico<small>Recupera até ${40 + healingBonus()} HP</small>`,
        "act('kit')",
      )
    : "") +
  (S.pill
    ? btn("💊 Pílula<small>Recupera até 40 chakra</small>", "act('pill')")
    : "") +
  (B.boss && !B.weaknessKnown
    ? btn(
        "🔎 Analisar o chefe<small>Descobre a fraqueza; consome seu turno</small>",
        "act('analyze')",
      )
    : "") +
  btn("💨 Tentar fugir<small>Chefes não permitem fuga</small>", "act('run')") +
  "</div>";

const vMis = () => {
  return (
    `<h3>📜 ${M.m[1]} ${rkb(M.m[0])}</h3><small style="color:var(--mu)">Etapa ${M.s + 1}/${M.n} · ${M.successes || 0} sucessos · ${M.failures || 0} contratempos${M.m[3] && EN[M.m[3]][4] ? " · chefe no final" : ""}</small><p>${M.cur[0]}</p><div class="g">` +
    M.cur[1]
      .map((c, i) => {
        const secondary =
          M.s == 0 && M.i >= 0 && MISSION_OPTIONS[M.i]?.[0] == c[0];
        return btn(
          `${c[0]}<small>${secondary ? "⭐ Objetivo secundário · bônus na conclusão · " : ""}Teste de ${c[1].toUpperCase()}</small>`,
          `pick(${i})`,
        );
      })
      .join("") +
    "</div>"
  );
};

const vGoal = () => {
  return (
    `<h3>🎯 Objetivo da missão: ${M.m[1]}</h3><small style="color:var(--mu)">Etapa final · rank ${M.m[0]} · contratempos anteriores: ${M.failures || 0}. Escolha uma abordagem.</small><p>${M.cur[0]}</p><div class="g">` +
    M.cur[1]
      .map((c, i) =>
        btn(
          `${c[0]}<small>Teste de ${c[1].toUpperCase()}</small>`,
          `pickGoal(${i})`,
        ),
      )
      .join("") +
    "</div>"
  );
};

const MTYPE = {
  deliver: "Entrega",
  retrieve: "Recuperação",
  escort: "Escolta",
  rescue: "Resgate",
  protect: "Proteção",
};

const vBoard = () => {
  const story = storyState(),
    dead = ew().dead,
    wk = Math.floor(S.day / 4),
    completedContracts = new Set(
      (S.missionHistory || [])
        .filter(
          (entry) =>
            Number.isInteger(entry.contractIndex) && entry.week == wk,
        )
        .map((entry) => entry.contractIndex),
    ),
    lst = MS.map((m, i) => ({ m, i })).filter(
      ({ m, i }) =>
        !story.defeatedBosses[m[3]] &&
        !(m[3] && dead[m[3]]) &&
        !completedContracts.has(i) &&
        hs("q", i, wk) < (i < MS0 ? 0.8 : 0.6) &&
        (m[0] != "S" || S.rep >= REP_REQ.S) &&
        (m[0] != "A" || S.rk >= 2) &&
        (S.rep || 0) >= (REP_REQ[m[0]] || 0),
    );
  const ocupado = !!(
    S.activeContract ||
    M ||
    B ||
    X ||
    S.assignment?.status == "active"
  );
  const aviso = ocupado
    ? `<div class="world alert"><b>📜 Você já tem uma atividade em andamento.</b><br><small>Conclua ou retome antes de aceitar outro contrato.</small><div class="row">${S.activeContract ? btn("Retomar operação", "resumeMultiDayMission()", "p") : S.assignment?.status == "active" ? btn("Retomar designação", "mode='assignment';render()", "p") : ""}</div></div>`
    : "";
  const tabs = `<div class="mission-board-tabs" role="tablist" aria-label="Seções do mural de missões"><button class="b ${missionBoardTab == "available" ? "p" : ""}" role="tab" aria-selected="${missionBoardTab == "available"}" onclick="missionBoardTab='available';render()">📜 Disponíveis</button><button class="b ${missionBoardTab == "completed" ? "p" : ""}" role="tab" aria-selected="${missionBoardTab == "completed"}" onclick="missionBoardTab='completed';render()">✅ Concluídas<small>${(S.missionHistory || []).length + STORY_ARCS.filter((arc) => story.completed[arc.id]).length} registro(s)</small></button></div>`;
  if (missionBoardTab == "completed")
    return aviso + tabs + completedMissionBoard() + back;
  return (
    aviso +
    tabs +
    campaignBoard() +
    `<h3>📜 Mural de missões</h3><small style="color:var(--mu)">Rank D leva 1 etapa estratégica; os ranks seguintes aumentam a duração até 4 etapas no rank S. Cada categoria tem desafios próprios antes da etapa final. Reputação global ${Math.floor(S.rep || 0)} · fama regional em ${esc(regionDisplayName(REG[S.loc]))}: ${Math.round(regionalReputation(REG[S.loc]))}/100. Contratos de regiões distantes também exigem boa recepção local.</small><div class="g" style="margin-top:8px">` +
    (lst.length
      ? lst
      .sort((a, b) => MSK.indexOf(a.m[0]) - MSK.indexOf(b.m[0]))
      .map(({ m, i }) => {
        const r = m[0],
          repNeed = REP_REQ[r] || 0,
          region = missionRegion(m),
          regionalNeed = { D: 0, C: 25, B: 30, A: 35, S: 40 }[r] || 0,
          regionalOk = regionalReputation(region) >= regionalNeed,
          ok =
            S.rk >= NEED[r] &&
            S.lv >= LVN[r] &&
            (S.rep || 0) >= repNeed &&
            regionalOk,
          lk = ok
            ? ""
            : `🔒 ${RK[NEED[r]]}, nível ${LVN[r]}${(S.rep || 0) < repNeed ? `, reputação global ${repNeed}+` : ""}${!regionalOk ? `, fama em ${regionDisplayName(region)} ${regionalNeed}+` : ""}`,
          kind = m[6]
            ? MTYPE[m[6]]
            : EN[m[3]]?.[4]
              ? "Combate contra chefe"
              : "Combate",
          style = missionStyle(m);
        return btn(
          `${rkb(r)}${m[1]}<small>${m[2]}</small><small>${missionCategoryLabel(style)} · ${missionDays(r)} etapa(s) estratégica(s) + ${missionFinalStages(r)} etapa(s) final(is) · ${kind} · ${m[4]} ryo · ${m[5]} XP · respeito até ${RCAP[r]}${lk ? " · " + lk : ""}</small>`,
          ok
            ? ocupado
              ? "log('⏳ Conclua ou retome a atividade em andamento antes de aceitar outro contrato.','sys')"
              : `smis(${i})`
            : !regionalOk
              ? `log('🔒 A recepção em ${regionDisplayName(region)} exige fama regional ${regionalNeed}+ (atual ${Math.round(regionalReputation(region))}).','sys')`
              : `log('🔒 Requer ${RK[NEED[r]]}, nível ${LVN[r]} e reputação global ${repNeed}+.' ,'sys')`,
          ok && !ocupado ? "" : "lock",
        );
      })
      .join("")
      : '<div class="world">Nenhum contrato novo disponível neste ciclo. Consulte “Concluídas” ou volte quando o mural for atualizado.</div>') +
    back +
    "</div>"
  );
};

const vShop = () => {
  const disruptionDays = marketDisruptionDays(),
    marketNotice = disruptionDays
      ? `<div class="world">📦 Crise em “${esc(S.wd.marketDisruptionTitle || "Konoha")}”: os preços estão 15% mais altos por mais ${disruptionDays} dia(s), enquanto os estoques são repostos.</div>`
      : "";
  return (
    '<h3>🛒 Loja ninja</h3>' +
    marketNotice +
    '<div class="g">' +
    btn(
      `🩹 Kit médico<small>${marketPrice(25)} ryō · +${40 + healingBonus()} HP</small>`,
      "buy('kit',25)",
    ) +
    btn(
      `💊 Pílula de soldado<small>${marketPrice(30)} ryō · +40 chakra</small>`,
      "buy('pill',30)",
    ) +
    btn(
      `📜 Pergaminho de treino<small>${marketPrice(120)} ryō · +1 atributo</small>`,
      "buy('scr',120)",
    ) +
    Object.entries(GEAR)
      .map(([id, g]) => {
        const owned = (S.gear || []).includes(id),
          equipped = S.equipped?.[g.slot] == id;
        return btn(
          `${g.icon} ${g.name}<small>${owned ? (equipped ? "Equipado · " : "Na mochila · ") : `${marketPrice(g.cost)} ryō · `}${g.description}</small>`,
          owned ? `equipGear('${id}')` : `buyGear('${id}')`,
        );
      })
      .join("") +
    back +
    "</div>"
  );
};

function vInventory() {
  const consumables = [
      {
        id: "kit",
        icon: "🩹",
        name: "Kit médico",
        count: S.kit || 0,
        detail: `Recupera até ${40 + healingBonus()} HP.`,
      },
      {
        id: "pill",
        icon: "💊",
        name: "Pílula de soldado",
        count: S.pill || 0,
        detail: "Recupera até 40 chakra.",
      },
    ],
    carriedGear = (S.gear || []).filter((id) => GEAR[id]),
    specialItems = (S.specialItems || []).filter((id) => SPECIAL_ITEMS[id]);
  return (
    `<h3>🎒 Inventário</h3><div class="world">Ryō disponível: <b>💰 ${S.ryo}</b></div><h4>Consumíveis</h4><div class="g">${consumables
      .map((item) =>
        btn(
          `${item.icon} ${item.name}<small>Quantidade: ${item.count} · ${item.detail}</small>`,
          item.count
            ? `item('${item.id}')`
            : `log('Você não tem ${item.name.toLowerCase()}.','sys')`,
          item.count ? "" : "lock",
        ),
      )
      .join("")}</div><h4>Equipamentos</h4><div class="g">${
      carriedGear.length
        ? carriedGear
            .map((id) => {
              const gear = GEAR[id],
                equipped = S.equipped?.[gear.slot] == id;
              return btn(
                `${gear.icon} ${esc(gear.name)}<small>${equipped ? "Equipado" : "Guardado"} · ${esc(gear.description)}</small>`,
                `equipGear('${id}')`,
                equipped ? "p" : "",
              );
            })
            .join("")
        : '<div class="world">Nenhum equipamento na mochila. Visite a loja ninja no mercado.</div>'
    }</div><h4>Itens especiais</h4>${
      specialItems.length
        ? `<div class="g">${specialItems
            .map(
              (id) =>
                `<div class="world"><b>✨ ${esc(SPECIAL_ITEMS[id].name)}</b><br><small>${esc(SPECIAL_ITEMS[id].description)}</small></div>`,
            )
            .join("")}</div>`
        : '<div class="world">Nenhum item especial encontrado.</div>'
    }<div class="row">${back}</div>`
  );
}

const jn = (k) => {
  const [e, i] = k.split(":");
  return E[e][1] + " " + E[e][3][i];
};

const vJt = () =>
  '<h3>🎯 Praticar jutsu</h3><small style="color:var(--mu)">A cada 8 usos a Maestria sobe (máx. 5): +12% de dano e −7% de custo por nível. Usar em combate e treinar com alguém também conta.</small><div class="g" style="margin-top:8px">' +
  S.jt
    .map((k) => {
      const effect = JUTSU_EFFECTS[k];
      return btn(
        `${jn(k)}<small>Maestria ${mlv(k)}/5 · ${jc(k)} chakra${effect ? ` · ${effect.label}` : ""}</small>`,
        `prac('${k}')`,
      );
    })
    .join("") +
  back +
  "</div>";

const vSen = () => {
  ew();
  const id = T,
    n = N[id],
    offerings = SENMAX[id] || {},
    elements = Object.keys(offerings);
  const cards = elements
    .map(
      (element) =>
        `<h4>${E[element][1]} ${E[element][0]} · até ${E[element][3][offerings[element]]}</h4><div class="g">` +
        [0, 1, 2]
          .filter((level) => level <= offerings[element])
          .map((level) => {
            const key = `${element}:${level}`,
              known = S.jt.includes(key),
              progress = S.lp[key] || 0,
              cost = Math.ceil(TC[level] / TS[level]),
              missing = [];
            if ((S.rel[id] || 0) < TA[level])
              missing.push(`afinidade ${TA[level]}`);
            if (
              level > 0 &&
              !(
                S.jt.includes(`${element}:${level - 1}`) &&
                mlv(`${element}:${level - 1}`) >= level
              )
            )
              missing.push(`maestria ${level} na técnica anterior`);
            if (!els().includes(element) && els().length >= Math.max(1, S.rk))
              missing.push(
                `limite de ${Math.max(1, S.rk)} elemento(s) do seu rank`,
              );
            if (S.lv < TL[level]) missing.push(`nível ${TL[level]}`);
            if (S.nin < TN[level]) missing.push(`Nin ${TN[level]}`);
            if ((S.fatigue || 0) >= 70) missing.push("fadiga abaixo de 70%");
            if (S.ryo < cost) missing.push(`${cost} ryō por sessão`);
            if (S.cd["sen" + id] === slot())
              missing.push("próximo período para treinar");
            const chance = Math.round(
              Math.min(
                0.95,
                0.5 + (n[4][1] / 18) * 0.25 + (S.nin - TN[level]) * 0.03,
              ) * 100,
            );
            const status = known
              ? "✔ Dominado"
              : missing.length
                ? `🔒 Falta ${missing.join(" · ")}`
                : `📖 Pronto · ${progress}/${TS[level]} sessões · chance ${chance}% por sessão`;
            return btn(
              `${known ? "✔ " : ""}${E[element][3][level]}<small>${status}</small><small>${known ? `Maestria ${mlv(key)}/5` : `${cost} ryō por sessão · ${TS[level]} sessão(ões) para dominar`}</small>`,
              known
                ? `log('Você já domina esta técnica.','sys')`
                : `teach('${key}')`,
              known ? "lock" : missing.length ? "lock" : "p",
            );
          })
          .join("") +
        "</div>",
    )
    .join("");
  return `<h3>🎓 Aprender técnicas com ${n[0]}</h3><div class="world">Afinidade ${S.rel[id] || 0} · Nin ${S.nin} · nível ${S.lv} · fadiga ${S.fatigue || 0}% · ryō ${S.ryo}. Cada sessão custa ryō, avança o tempo e pode aumentar o progresso; a chance é exibida em cada técnica.</div><h4>Treino com orientação</h4><div class="g">${btn(`🥋 Sessão de treino<small>Prática em ${n[5][0].toUpperCase()} · 8 chakra, +25 fadiga · limite ${n[5][0] == "mh" ? "vida máxima" : attrCap(n[5][0])}</small>`, `session('${id}')`, "p")}</div>${cards || "<p>Este personagem não tem técnicas para ensinar.</p>"}<div class="row">${btn('<span class="back-icon" aria-hidden="true">←</span><span>Voltar ao personagem</span>', "mode='npc';render()", "back-button")}</div>`;
};

const vEx = () => {
  const g = EXS[X.rk][X.s],
    quiz = g.t == "quiz",
    team = g.t == "team",
    total = quiz ? g.qs.length : team ? g.tasks.length : g.c,
    prompt = quiz ? g.qs[X.i][0] : X.cur[0],
    choices = quiz
      ? g.qs[X.i][1].map((text, j) => [text, j, ""])
      : X.cur[1].map((choice, j) => [choice[0], j, choice[1]]);
  return (
    `<h3>🏟️ ${g.n}</h3><small style="color:var(--mu)">Fase ${X.s + 1}/${EXS[X.rk].length} · tarefa ${X.i + 1}/${total} · acertos ${X.ok} (mínimo ${g.need})</small>` +
    (team
      ? `<div class="world">🤝 Esquadrão: ${X.squad.map((id) => N[id][0]).join(" e ")} · confiança ${X.trust}%</div>`
      : "") +
    `<p>${prompt}</p><div class="g">` +
    choices
      .map(([text, j, stat]) =>
        btn(
          `${text}<small>${team ? `Coordenação · ${stat.toUpperCase()}` : quiz ? "Resposta" : `Usa ${stat.toUpperCase()}`}</small>`,
          `exa(${j})`,
        ),
      )
      .join("") +
    "</div>"
  );
};

const V = {
  map: vMap,
  rogue: vRogue,
  inventory: vInventory,
  saves: vSaves,
  guide: vGuide,
  npc: vNpc,
  date: vDate,
  battle: vBattle,
  mis: vMis,
  goal: vGoal,
  ms: vBoard,
  shop: vShop,
  jt: vJt,
  sen: vSen,
  team: vTeam,
  clan: vClan,
  org: vOrganization,
  ex: vEx,
  assignment: vAssignment,
  contract: vContract,
  styles: vStyles,
  lifePaths: lifePathPanel,
  journal: journalPanel,
};

function render() {
  // Se o personagem em foco já saiu do local (rotina do mundo), volta ao mapa.
  if (
    ["npc", "sen", "date", "styles"].includes(mode) &&
    T &&
    N[T] &&
    where(T) !== S.loc
  ) {
    log(`🚶 ${N[T][0]} já não está mais aqui.`, "sys");
    mode = "map";
  }
  const openDuties = (S.promotionDuties || []).filter(
    (duty) => duty.status == "pending" || duty.status == "review",
  );
  $("#st").innerHTML =
    `<div class="status-heading"><div><span class="status-name">${esc(S.n)}</span><span class="status-sub">${S.a} anos · ${E[S.el][1]} ${E[S.el][0]} · ${CLANS[S.clan]?.name || CLANS.none.name} · ${SPECIALIZATIONS[S.specialization]?.name || SPECIALIZATIONS.balanced.name} · ${S.style || "Equilibrado"} · Estilo de combate: ${combatStyleName()}</span></div><span class="status-rank">${RK[S.rk]} · Nível ${S.lv} · ${S.power || "Regular"}</span></div>` +
    `<div class="status-bars">` +
    bar("❤️ Vida", S.hp, S.mh, "hp") +
    bar("💠 Chakra", S.ck, S.mc, "ck") +
    bar("✨ Experiência", S.xp, S.lv * 40, "ac") +
    respBars() +
    `</div>` +
    `<div class="status-meta"><span><b>Ryō</b><br>💰 ${S.ryo}</span><span><b>Calendário</b><br>Dia ${S.day} · ${TM[S.t]} · Ano ${1 + (S.worldYears || 0)}</span><span><b>Próximo aniversário</b><br>${DAYS_PER_YEAR - (S.ageDays || 0)} dias</span><span><b>Missões</b><br>📜 ${S.done} concluídas</span><span><b>Equipe</b><br>🤝 ${(S.team || []).length}/2 aliados</span>${openDuties.length ? `<span><b>Responsabilidades</b><br>🎖️ ${openDuties.length} pendente(s)</span>` : ""}<span><b>Filiação</b><br>${S.organizations?.length ? esc(ORGANIZATIONS[S.organizations[0]].name) : "Independente"} · renome ${S.clanRenown || 0}</span><span><b>Status</b><br>${S.rogue?.active ? `🚨 Renegado · procurado Nv ${S.rogue.wantedLevel}` : "🏘️ Shinobi de Konoha"}</span><span><b>Condição</b><br>Fadiga ${S.fatigue || 0}% · Reputação ${Math.floor(S.rep || 0)}</span>${saudeResumo()}<span><b>Equipamento</b><br>🩹 ${S.kit} kits · 💊 ${S.pill} pílulas<br>${equippedSummary()}</span></div>` +
    `<div class="status-attributes"><span><small>Ninjutsu</small><b>${S.nin}</b></span><span><small>Taijutsu</small><b>${S.tai}</b></span><span><small>Velocidade</small><b>${S.vel}</b></span><span><small>Inteligência</small><b>${S.int}</b></span><span><small>Carisma</small><b>${S.car}</b></span></div>`;
  $("#pn").innerHTML = V[mode]();
  const modal = $("#urgentModal"),
    wasHidden = modal.hidden,
    urgentPending = !!(
      S.urgent &&
      !S.urgent.response &&
      !S.assignment &&
      !S.activeContract &&
      !M &&
      !B &&
      !X
    );
  modal.hidden = !urgentPending;
  modal.innerHTML = urgentPending
    ? `<div class="urgent-shade"><section class="urgent-dialog" role="alertdialog" aria-modal="true" aria-labelledby="urgentTitle" tabindex="-1"><span class="urgent-kicker">${S.rogue?.active ? "Ocorrência urgente · problema local" : "Decisão urgente · chamado da vila"}</span><h2 id="urgentTitle">${esc(S.urgent.title)}</h2><p>${esc(S.urgent.description)}</p><p>${crisisInfo(S.urgent)}</p><p class="urgent-deadline">Destino: ${esc(L[S.urgent.loc][1])} · prazo restante: ${S.urgent.daysLeft} dia(s)</p><p>Escolha como responder. Atender agora inicia a missão imediatamente; o apoio da equipe tem resultado e riscos próprios.</p><div class="g">${btn("Atender agora<small>Vá direto ao local e inicie a missão.</small>", "chooseUrgent('self')", "p")}${btn("Pedir ajuda à equipe<small>Aliados disponíveis melhoram a chance; uma falha pode feri-los. Sem equipe disponível, uma patrulha local assume.</small>", "askUrgentTeam()")}${btn("Ignorar<small>O prazo continua; reputação e pessoas podem sofrer.</small>", "chooseUrgent('ignored')")}</div></section></div>`
    : "";
  ["#st", "#log", "#pn", "#gm > .row"].forEach((selector) => {
    $(selector).inert = urgentPending;
  });
  document.body.style.overflow = urgentPending ? "hidden" : "";
  if (urgentPending && wasHidden) $("#urgentModal button")?.focus();
}

const crisisInfo = (c) =>
  `<br><small>⚠️ Perigo ${DG[c.rank]} · Se ignorado: ${FL[c.goal] || "a situação piora"}; ${S.rogue?.active ? "as pessoas envolvidas perdem" : "a vila perde"} confiança em você${c.npc && N[c.npc] ? ` e ${N[c.npc][0]} pode se ferir` : ""}.</small>`;

const respBars = () => {
  ew();
  const pers = Math.min(
    100,
    Object.values(S.bonds || {}).reduce((t, b) => t + (b.respect || 0), 0) * 2,
  );
  return (
    bar("🤝 Respeito pessoal", pers, 100, "ac") +
    bar("🏘️ Reputação na vila", S.rep, 100, "ac") +
    bar("🌍 Fama mundial", S.fame || 0, 100, "ac")
  );
};

let selLoc = null;

function selectLoc(k) {
  selLoc = selLoc == k ? null : k;
  render();
}

function mapSVG() {
  const highlighted = new Set(),
    path = selLoc ? routePath(S.loc, selLoc) : null;
  if (path)
    for (let i = 0; i < path.length - 1; i++)
      (highlighted.add(path[i] + ">" + path[i + 1]),
        highlighted.add(path[i + 1] + ">" + path[i]));
  const seen = new Set();
  let edges = "";
  Object.keys(MP).forEach((from) =>
    routeNeighbors(from).forEach((to) => {
      const edgeKey = [from, to].sort().join("|");
      if (!MP[to] || seen.has(edgeKey)) return;
      seen.add(edgeKey);
      const local = REG[from] == REG[to];
      edges += `<line class="me ${local ? "local" : ""} ${highlighted.has(from + ">" + to) ? "hl" : ""}" x1="${MP[from][0]}" y1="${MP[from][1]}" x2="${MP[to][0]}" y2="${MP[to][1]}"/>`;
    }),
  );
  const regions = `<path class="mz" d="M14 125 Q26 60 130 62 L315 74 Q382 102 386 183 L361 296 Q337 393 238 410 L52 418 Q6 362 14 125Z"/><text class="mt" x="28" y="32">KONOHA</text><path class="mz2" d="M388 24 Q485 10 580 30 L704 60 Q727 96 705 185 L667 252 Q611 279 551 253 L451 254 Q407 208 388 24Z"/><text class="mt" x="470" y="24">FRONTEIRAS E PAÍSES</text><path class="mz" d="M378 265 Q461 244 555 267 L716 264 Q737 321 710 410 L548 418 L428 399 Q381 356 378 265Z"/><text class="mt" x="600" y="407">PAÍSES ALIADOS</text>`;
  const nodes = Object.keys(MP)
    .map((key) => {
      const [x, y] = MP[key],
        people = pres(key).length,
        locked = !!lockedLoc(key),
        urgent = !!(S.urgent && S.urgent.loc == key),
        selected = key == selLoc,
        current = key == S.loc;
      const cls = [
        current ? "cur" : "",
        locked ? "lk" : "",
        urgent ? "urg" : "",
        selected ? "sel" : "",
      ].join(" ");
      const label = `${L[key][1]}${current ? " · sua localização atual" : ""}${selected ? " · destino selecionado" : ""}${locked ? " · bloqueado" : ""}${urgent ? " · chamado urgente" : ""} · ${people} pessoa(s)`;
      return `<g class="mn ${cls}" role="button" tabindex="0" aria-label="${label}" onclick="selectLoc('${key}')" onkeydown="if(event.key=='Enter'||event.key==' '){event.preventDefault();selectLoc('${key}')}" aria-pressed="${selected}"><title>${label}</title><circle class="mn-hit" cx="${x}" cy="${y}" r="27"/><circle class="mn-marker" cx="${x}" cy="${y}" r="18"/><text class="em" x="${x}" y="${y + 5}">${L[key][0]}</text><text class="lb" x="${x}" y="${y + 31}">${L[key][1]}</text><circle class="mn-count" cx="${x + 14}" cy="${y - 14}" r="8"/><text class="bd" x="${x + 14}" y="${y - 11}">${people}</text></g>`;
    })
    .join("");
  return `<div class="map-scroll" role="region" aria-label="Mapa interativo; deslize horizontalmente para explorar" tabindex="0"><svg class="wmap" viewBox="0 0 740 430" role="group" aria-label="Mapa interativo do mundo shinobi">${regions}${edges}${nodes}</svg></div>`;
}

function mapLegend() {
  return `<div class="map-legend" aria-label="Legenda do mapa"><span><i class="map-dot current"></i>Você está aqui</span><span><i class="map-dot selected"></i>Destino selecionado</span><span><i class="map-dot urgent"></i>Chamado urgente</span><span><i class="map-dot"></i>Local disponível</span><span><i class="map-dot locked"></i>Bloqueado</span><span>🩷 Número: pessoas presentes</span></div>`;
}

function consequencePanel() {
  const world = worldConsequences(),
    outcomes = Object.entries(world.arcOutcomes),
    decisions = world.decisions.slice(-2).reverse();
  return `<div class="world"><b>🌍 Estado do mundo</b><br>🏘️ Segurança de Konoha: ${Math.round(world.villageSafety)}/100 · confiança da vila: ${Math.round(world.villageTrust)}/100<br>${outcomes.length ? outcomes.map(([id, outcome]) => `<small>${esc(STORY_ARCS.find((arc) => arc.id == id)?.title || id)} · ${esc(outcome.summary)}</small>`).join("<br>") : "<small>Suas decisões importantes aparecerão aqui e poderão alterar missões futuras.</small>"}${decisions.length ? `<br><small>Decisões recentes: ${decisions.map((decision) => esc(decision.choice)).join(" · ")}</small>` : ""}</div>`;
}

function locationConsequencePanel(key) {
  const world = worldConsequences(),
    region = world.regions.onda,
    bridgeMission =
      storyState().completed.ondas &&
      ["delayed", "under_construction"].includes(region.bridge)
        ? `<br><small>${S.assignment?.id == "ponte" ? "A equipe está trabalhando na reconstrução; consulte sua designação na Torre." : "Uma operação para concluir a reconstrução está disponível com Tsunade na Torre."}</small>`
        : "";
  if (key == "ponte" || key == "onda")
    return `<div class="world"><b>🌉 País das Ondas</b><br>Ponte: ${region.bridge == "completed" ? "concluída · rota direta aberta para a fronteira" : region.bridge == "delayed" ? "reconstrução atrasada" : region.bridge == "under_construction" ? "em construção" : "ainda sem desfecho"} · confiança dos moradores: ${Math.round(region.residentTrust)}/100${region.workersInjured ? '<br><small class="bad">Trabalhadores se feriram durante a obra.</small>' : ""}${bridgeMission}</div>`;
  if (key == "torre" || key == "portao" || key == "hospital") {
    const repair = world.reconstruction.konoha,
      repairStatus =
        repair == "needed" || repair == "ongoing"
          ? `<br><small>${S.assignment?.id == "konoha-reconstruction" ? "A equipe está nos reparos; consulte sua designação na Torre." : "Os abrigos precisam de reparos. Tsunade pode liberar uma operação de reconstrução na Torre."}</small>`
          : repair == "completed"
            ? "<br><small>Os abrigos e serviços danificados foram restaurados.</small>"
            : "";
    return `<div class="world">🏘️ Segurança de Konoha: ${Math.round(world.villageSafety)}/100 · confiança da vila: ${Math.round(world.villageTrust)}/100${repairStatus}</div>`;
  }
  return "";
}

function mapPanel() {
  if (!selLoc)
    return `<div class="world"><b>Você está em ${L[S.loc][0]} ${L[S.loc][1]}.</b><br><small>Selecione um ponto do mapa para ver disponibilidade e rota.</small></div>`;
  const key = selLoc,
    route = routePath(S.loc, key),
    requirement = LOC_REQ[key],
    locked = !!lockedLoc(key),
    threat = criminalThreat(key),
    people = pres(key),
    current = key == S.loc,
    unreachable = !route;
  const routeText = current
    ? "Você já está neste local."
    : route
      ? `Rota: ${route.map((location) => L[location][1]).join(" → ")} · ${route.length - 1} trecho(s), ${route.length - 1} período(s) de viagem (aprox. ${Math.ceil((route.length - 1) / 3)} dia(s))`
      : "Não há rota conectada a este local.";
  const accessText =
    locked && requirement
      ? `Acesso bloqueado · requer rank ${RK[requirement.rk]} e ${requirement.done} missão(ões) concluída(s).`
      : current
        ? "Destino atual"
        : unreachable
          ? "Rota indisponível"
          : `Disponível para viagem · ${Math.max(0, people.length)} pessoa(s) no local.`;
  const action = locked
    ? btn(
        `🔒 Requer ${RK[requirement.rk]} · ${requirement.done} missão(ões)`,
        `log('🔒 Este local ainda está bloqueado pelos requisitos de rank e missões.','sys')`,
        "lock",
      )
    : unreachable
      ? btn(
          "Rota indisponível",
          "log('Não há rota conhecida para este local.','sys')",
          "lock",
        )
      : current
        ? btn(
            "Você já está aqui",
            "log('Você já está neste local.','sys')",
            "lock",
          )
        : btn("Viajar para cá", `travelTo('${key}')`, "p");
  const infiltrationAction =
    threat &&
    !threat.nearby &&
    !S.rogue?.active &&
    !current &&
    !locked &&
    !unreachable
      ? btn(
            "🕵️ Infiltrar",
            `travelTo('${key}',true)`,
            "p",
          )
      : "";
  return (
    `<div class="world"><div class="map-heading"><b>${L[key][0]} ${L[key][1]}</b><small>${current ? "📍 Local atual" : locked ? "🔒 Bloqueado" : `👥 ${people.length} pessoa(s)`}</small></div><p><small>${routeText}</small></p><small>${accessText}${route && route.length > 2 && !current ? " · viagem longa: 30% de chance de emboscada" : ""}</small>${threat ? `<div class="world alert">⚠️ ${threat.nearby ? `Criminosos rondam perto de ${threat.name}` : `${threat.name} é uma área criminosa`} · risco de confronto: ${Math.round(threat.chance * 100)}%${infiltrationAction ? " · infiltrar reduz o risco, mas ser descoberto inicia um combate" : ""}.</div>` : ""}${current && S.infiltration?.location == key ? `<div class="world alert">🕵️ Infiltração ativa · suspeita ${S.infiltration.suspicion}/4. Se os inimigos perceberem você, atacarão.</div>` : ""}<div class="row">${action}${infiltrationAction}</div></div>` +
    (key == S.loc ? "" : locationConsequencePanel(key))
  );
}

const actsView = () =>
  `<h3>🎯 Atividades em ${L[S.loc][1]}</h3><small style="color:var(--mu)">Cada atividade pode ser feita uma vez por dia e consome um período.</small><div class="g" style="margin-top:8px">` +
  actHere()
    .map(({ a, i }) =>
      btn(
        `${a[1]}<small>${a[2]}</small><small>${(S.acts || {})[i] == S.day ? "✔ Já feito hoje" : "Disponível"}</small>`,
        `doAct(${i})`,
        (S.acts || {})[i] == S.day ? "lock" : "",
      ),
    )
    .join("") +
  "</div>";

function vStyles() {
  ensureStyleState();
  const style = STYLE_BOOK.find((entry) => entry.id == S.combatStyle);
  const master = N[T];
  const options = STYLE_BOOK.filter((entry) => entry.master == T);
  return `<h3>📘 Estilos de combate</h3><div class="world">Estilo equipado: <b>${style?.name || "Equilibrado"}</b>${style ? ` · +2 ${style.stat.toUpperCase()} em testes de missão` : ""}<br><small>Você pode trocar entre estilos aprendidos sem custo. Para aprender outro, treine com o mestre responsável.</small></div><h4>Aprendizado com ${master?.[0] || "um mestre"}</h4><div class="g">${
    options
      .map((entry) => {
        const known = S.styles.includes(entry.id),
          equipped = S.combatStyle == entry.id,
          ready =
            (S.rel[T] || 0) >= entry.affinity &&
            S.lv >= entry.level &&
            S.done >= entry.missions &&
            S.ryo >= entry.cost &&
            (S.fatigue || 0) < 70;
        const requirement = `Afinidade ${entry.affinity} · nível ${entry.level} · ${entry.missions} missão(ões) · ${entry.cost} ryō`;
        const label = `${equipped ? "✔ " : ""}${entry.name}<small>${entry.description}</small><small>${known ? (equipped ? "Equipado" : "Aprendido · +2 " + entry.stat.toUpperCase()) : `${requirement} · +2 ${entry.stat.toUpperCase()}`}</small>`;
        return btn(
          label,
          equipped
            ? `log('Este estilo já está equipado.','sys')`
            : `styleTraining('${entry.id}')`,
          equipped ? "lock" : known || ready ? "" : "lock",
        );
      })
      .join("") ||
    "<small>Este personagem ainda não ensina um estilo de combate.</small>"
  }</div><div class="row">${btn('<span class="back-icon" aria-hidden="true">←</span><span>Voltar ao personagem</span>', "mode='npc';render()", "back-button")}</div>`;
}
