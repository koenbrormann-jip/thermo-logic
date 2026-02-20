const splitTemplate = {
  Monday: "Lower Body",
  Tuesday: "Mobility / Recovery",
  Wednesday: "Core + Conditioning",
  Thursday: "Upper Body",
  Friday: "Cardio + Recovery",
  Saturday: "Total Body",
  Sunday: "Rest"
};

const storageKey = "workout_coach_data_v2";

const defaultEquipment = {
  barbell: true,
  dumbbell: true,
  cable: true,
  kettlebell: true,
  bodyweight: true,
  machine: true
};

const exerciseLibrary = {
  "Upper Body": [
    { name: "Barbell Bench Press", bodyPart: "Chest", type: "strength", movement: "push", equipment: ["barbell"], avoid: ["shoulder"], met: 6.0, base: { beginner: 25, intermediate: 45, advanced: 65 } },
    { name: "Dumbbell Shoulder Press", bodyPart: "Shoulders", type: "strength", movement: "push", equipment: ["dumbbell"], avoid: ["shoulder"], met: 5.8, base: { beginner: 12, intermediate: 18, advanced: 24 } },
    { name: "Bent-Over Row", bodyPart: "Back", type: "strength", movement: "pull", equipment: ["barbell"], avoid: ["lower back"], met: 6.2, base: { beginner: 20, intermediate: 35, advanced: 50 } },
    { name: "Pull-Up (Weighted if needed)", bodyPart: "Back", type: "strength", movement: "pull", equipment: ["bodyweight"], avoid: ["shoulder"], met: 7.0, base: { beginner: 0, intermediate: 5, advanced: 12 } },
    { name: "Incline Dumbbell Press", bodyPart: "Chest", type: "strength", movement: "push", equipment: ["dumbbell"], avoid: ["shoulder"], met: 5.8, base: { beginner: 10, intermediate: 16, advanced: 22 } },
    { name: "Cable Face Pull", bodyPart: "Rear Delts", type: "accessory", movement: "pull", equipment: ["cable"], avoid: [], met: 4.8, base: { beginner: 12, intermediate: 20, advanced: 30 } },
    { name: "Triceps Rope Pressdown", bodyPart: "Triceps", type: "accessory", movement: "push", equipment: ["cable"], avoid: ["elbow"], met: 4.5, base: { beginner: 10, intermediate: 16, advanced: 24 } },
    { name: "Hammer Curl", bodyPart: "Biceps", type: "accessory", movement: "pull", equipment: ["dumbbell"], avoid: ["elbow"], met: 4.5, base: { beginner: 8, intermediate: 12, advanced: 18 } }
  ],
  "Lower Body": [
    { name: "Back Squat", bodyPart: "Quads/Glutes", type: "strength", movement: "squat", equipment: ["barbell"], avoid: ["knee", "lower back"], met: 7.0, base: { beginner: 35, intermediate: 60, advanced: 90 } },
    { name: "Romanian Deadlift", bodyPart: "Hamstrings", type: "strength", movement: "hinge", equipment: ["barbell", "dumbbell"], avoid: ["lower back", "hamstring"], met: 6.8, base: { beginner: 30, intermediate: 55, advanced: 80 } },
    { name: "Walking Lunges", bodyPart: "Quads", type: "strength", movement: "lunge", equipment: ["dumbbell", "bodyweight"], avoid: ["knee"], met: 6.0, base: { beginner: 8, intermediate: 14, advanced: 20 } },
    { name: "Leg Press", bodyPart: "Quads", type: "strength", movement: "squat", equipment: ["machine"], avoid: ["knee"], met: 6.5, base: { beginner: 70, intermediate: 130, advanced: 190 } },
    { name: "Hip Thrust", bodyPart: "Glutes", type: "strength", movement: "hinge", equipment: ["barbell", "dumbbell"], avoid: ["lower back"], met: 6.2, base: { beginner: 35, intermediate: 70, advanced: 110 } },
    { name: "Calf Raise", bodyPart: "Calves", type: "accessory", movement: "calves", equipment: ["machine", "bodyweight"], avoid: [], met: 4.2, base: { beginner: 20, intermediate: 35, advanced: 50 } },
    { name: "Hamstring Curl", bodyPart: "Hamstrings", type: "accessory", movement: "hinge", equipment: ["machine"], avoid: ["hamstring"], met: 4.6, base: { beginner: 15, intermediate: 25, advanced: 40 } },
    { name: "Goblet Squat", bodyPart: "Quads/Core", type: "strength", movement: "squat", equipment: ["dumbbell", "kettlebell"], avoid: ["knee"], met: 5.5, base: { beginner: 12, intermediate: 20, advanced: 30 } }
  ],
  "Total Body": [
    { name: "Deadlift", bodyPart: "Posterior Chain", type: "strength", movement: "hinge", equipment: ["barbell"], avoid: ["lower back"], met: 7.4, base: { beginner: 40, intermediate: 70, advanced: 110 } },
    { name: "Thruster", bodyPart: "Total Body", type: "strength", movement: "squat", equipment: ["barbell", "dumbbell"], avoid: ["shoulder", "knee"], met: 7.6, base: { beginner: 15, intermediate: 25, advanced: 35 } },
    { name: "Kettlebell Swing", bodyPart: "Hips/Core", type: "conditioning", movement: "hinge", equipment: ["kettlebell"], avoid: ["lower back"], met: 8.0, base: { beginner: 12, intermediate: 20, advanced: 28 } },
    { name: "Renegade Row", bodyPart: "Core/Back", type: "strength", movement: "pull", equipment: ["dumbbell"], avoid: ["shoulder"], met: 6.8, base: { beginner: 8, intermediate: 12, advanced: 18 } },
    { name: "Push Press", bodyPart: "Shoulders", type: "strength", movement: "push", equipment: ["barbell", "dumbbell"], avoid: ["shoulder"], met: 6.8, base: { beginner: 20, intermediate: 35, advanced: 50 } },
    { name: "Front Squat", bodyPart: "Quads/Core", type: "strength", movement: "squat", equipment: ["barbell"], avoid: ["knee", "lower back"], met: 6.9, base: { beginner: 25, intermediate: 45, advanced: 70 } },
    { name: "Burpee to Broad Jump", bodyPart: "Conditioning", type: "conditioning", movement: "conditioning", equipment: ["bodyweight"], avoid: ["knee", "shoulder"], met: 8.5, base: { beginner: 0, intermediate: 0, advanced: 0 } },
    { name: "Farmer Carry", bodyPart: "Grip/Core", type: "conditioning", movement: "carry", equipment: ["dumbbell", "kettlebell"], avoid: ["lower back"], met: 6.0, base: { beginner: 16, intermediate: 24, advanced: 34 } }
  ]
};

const fallbackExercises = [
  { name: "Bodyweight Squat", bodyPart: "Legs", type: "strength", movement: "squat", equipment: ["bodyweight"], avoid: ["knee"], met: 4.8, base: { beginner: 0, intermediate: 0, advanced: 0 } },
  { name: "Wall Push-Up", bodyPart: "Chest", type: "strength", movement: "push", equipment: ["bodyweight"], avoid: ["shoulder"], met: 4.5, base: { beginner: 0, intermediate: 0, advanced: 0 } },
  { name: "Bird Dog", bodyPart: "Core", type: "accessory", movement: "core", equipment: ["bodyweight"], avoid: [], met: 3.8, base: { beginner: 0, intermediate: 0, advanced: 0 } },
  { name: "Glute Bridge", bodyPart: "Glutes", type: "strength", movement: "hinge", equipment: ["bodyweight"], avoid: [], met: 4.2, base: { beginner: 0, intermediate: 0, advanced: 0 } }
];

const appState = {
  currentPlan: null,
  timerQueue: [],
  timerId: null,
  timerSeconds: 0,
  queueIndex: 0,
  activeStep: null,
  store: null
};

const ui = {
  profileSelect: document.getElementById("profileSelect"),
  installAppBtn: document.getElementById("installAppBtn"),
  qaBuild: document.getElementById("qaBuild"),
  qaStart: document.getElementById("qaStart"),
  qaSave: document.getElementById("qaSave"),
  qaAi: document.getElementById("qaAi"),
  newProfileName: document.getElementById("newProfileName"),
  addProfile: document.getElementById("addProfile"),
  deleteProfile: document.getElementById("deleteProfile"),
  bodyWeight: document.getElementById("bodyWeight"),
  sessionDate: document.getElementById("sessionDate"),
  level: document.getElementById("level"),
  injuries: document.getElementById("injuries"),
  eqBarbell: document.getElementById("eqBarbell"),
  eqDumbbell: document.getElementById("eqDumbbell"),
  eqCable: document.getElementById("eqCable"),
  eqKettlebell: document.getElementById("eqKettlebell"),
  eqBodyweight: document.getElementById("eqBodyweight"),
  eqMachine: document.getElementById("eqMachine"),
  exportData: document.getElementById("exportData"),
  importDataBtn: document.getElementById("importDataBtn"),
  importDataFile: document.getElementById("importDataFile"),
  buildPlan: document.getElementById("buildPlan"),
  weeklySplit: document.getElementById("weeklySplit"),
  planOutput: document.getElementById("planOutput"),
  calorieOutput: document.getElementById("calorieOutput"),
  completionOutput: document.getElementById("completionOutput"),
  getAiSuggestion: document.getElementById("getAiSuggestion"),
  aiSuggestionOutput: document.getElementById("aiSuggestionOutput"),
  timerLabel: document.getElementById("timerLabel"),
  timerValue: document.getElementById("timerValue"),
  startTimer: document.getElementById("startTimer"),
  skipStep: document.getElementById("skipStep"),
  logOutput: document.getElementById("logOutput"),
  saveLog: document.getElementById("saveLog")
};

let deferredInstallPrompt = null;

const DataAgent = {
  loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (parsed && parsed.profiles && parsed.activeProfileId) return parsed;
    } catch {
      // use fallback
    }
    const id = this.generateId();
    return {
      activeProfileId: id,
      profiles: {
        [id]: {
          id,
          name: "Default User",
          bodyWeightKg: 75,
          level: "intermediate",
          injuries: [],
          equipment: { ...defaultEquipment },
          progress: {},
          logs: []
        }
      }
    };
  },
  saveStore(store) {
    localStorage.setItem(storageKey, JSON.stringify(store));
  },
  generateId() {
    return `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
};

const ProfileAgent = {
  getActiveProfile() {
    return appState.store.profiles[appState.store.activeProfileId];
  },
  renderProfileSelect() {
    const options = Object.values(appState.store.profiles)
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join("");
    ui.profileSelect.innerHTML = options;
    ui.profileSelect.value = appState.store.activeProfileId;
  },
  syncProfileToForm() {
    const profile = this.getActiveProfile();
    ui.bodyWeight.value = profile.bodyWeightKg;
    ui.level.value = profile.level;
    ui.injuries.value = profile.injuries.join(", ");
    ui.eqBarbell.checked = Boolean(profile.equipment.barbell);
    ui.eqDumbbell.checked = Boolean(profile.equipment.dumbbell);
    ui.eqCable.checked = Boolean(profile.equipment.cable);
    ui.eqKettlebell.checked = Boolean(profile.equipment.kettlebell);
    ui.eqBodyweight.checked = Boolean(profile.equipment.bodyweight);
    ui.eqMachine.checked = Boolean(profile.equipment.machine);
  },
  syncFormToProfile() {
    const profile = this.getActiveProfile();
    profile.bodyWeightKg = Number(ui.bodyWeight.value || 75);
    profile.level = ui.level.value;
    profile.injuries = ui.injuries.value
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    profile.equipment = {
      barbell: ui.eqBarbell.checked,
      dumbbell: ui.eqDumbbell.checked,
      cable: ui.eqCable.checked,
      kettlebell: ui.eqKettlebell.checked,
      bodyweight: ui.eqBodyweight.checked,
      machine: ui.eqMachine.checked
    };
    DataAgent.saveStore(appState.store);
  },
  addProfile(name) {
    const profileName = (name || "").trim() || `User ${Object.keys(appState.store.profiles).length + 1}`;
    const id = DataAgent.generateId();
    appState.store.profiles[id] = {
      id,
      name: profileName,
      bodyWeightKg: 75,
      level: "intermediate",
      injuries: [],
      equipment: { ...defaultEquipment },
      progress: {},
      logs: []
    };
    appState.store.activeProfileId = id;
    DataAgent.saveStore(appState.store);
    this.renderProfileSelect();
    this.syncProfileToForm();
    ui.newProfileName.value = "";
  },
  deleteActiveProfile() {
    const ids = Object.keys(appState.store.profiles);
    if (ids.length <= 1) {
      ui.completionOutput.textContent = "At least one profile is required.";
      return;
    }
    delete appState.store.profiles[appState.store.activeProfileId];
    appState.store.activeProfileId = Object.keys(appState.store.profiles)[0];
    DataAgent.saveStore(appState.store);
    this.renderProfileSelect();
    this.syncProfileToForm();
    ui.completionOutput.textContent = "Profile deleted.";
  },
  exportData() {
    const blob = new Blob([JSON.stringify(appState.store, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const now = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `workout-coach-export-${now}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
  importData(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      ui.completionOutput.textContent = "Import failed: invalid JSON file.";
      return;
    }
    if (!parsed || typeof parsed !== "object" || !parsed.profiles || !parsed.activeProfileId) {
      ui.completionOutput.textContent = "Import failed: unexpected data format.";
      return;
    }

    appState.store = parsed;
    if (!appState.store.profiles[appState.store.activeProfileId]) {
      appState.store.activeProfileId = Object.keys(appState.store.profiles)[0];
    }
    DataAgent.saveStore(appState.store);
    this.renderProfileSelect();
    this.syncProfileToForm();
    ui.completionOutput.textContent = "Data imported successfully.";
  }
};

const ProgressionAgent = {
  getProgressForExercise(profile, exercise) {
    return profile.progress[exercise.name] || { sessions: 0, successStreak: 0, failStreak: 0, lastAvgRpe: 0, lastAvgReps: 0, weight: 0 };
  },
  getTargetWeight(profile, exercise, level) {
    const base = exercise.base[level] ?? exercise.base.intermediate ?? 0;
    if (base <= 0) return 0;

    const history = this.getProgressForExercise(profile, exercise);
    return Number((history.weight || base).toFixed(1));
  },
  updateFromSetLog(profile, entries) {
    entries.forEach((entry) => {
      if (!entry.exercise || entry.targetWeight <= 0) return;

      const item = this.getProgressForExercise(profile, entry.exercise);
      const reps = entry.sets.map((s) => s.reps).filter((v) => Number.isFinite(v));
      const rpes = entry.sets.map((s) => s.rpe).filter((v) => Number.isFinite(v));
      const avgReps = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
      const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 9.5;
      const successful = avgReps >= 8 && avgRpe <= 9.2;

      let nextWeight = entry.targetWeight;
      if (successful && avgRpe <= 8.0) {
        nextWeight = roundToPlate(entry.targetWeight * 1.03);
        item.successStreak += 1;
        item.failStreak = 0;
      } else if (successful) {
        nextWeight = item.successStreak >= 1 ? roundToPlate(entry.targetWeight * 1.015) : entry.targetWeight;
        item.successStreak += 1;
        item.failStreak = 0;
      } else {
        nextWeight = roundToPlate(entry.targetWeight * 0.975);
        item.successStreak = 0;
        item.failStreak += 1;
      }

      item.weight = Math.max(nextWeight, 2.5);
      item.sessions += 1;
      item.lastAvgReps = Number(avgReps.toFixed(2));
      item.lastAvgRpe = Number(avgRpe.toFixed(2));
      profile.progress[entry.exercise.name] = item;
    });
  }
};

const PlanningAgent = {
  getDayName(dateText) {
    const date = new Date(`${dateText}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  },
  getFocusForDay(dayName) {
    return splitTemplate[dayName] || "Total Body";
  },
  isExerciseAllowed(exercise, profile) {
    const hasEquipment = exercise.equipment.some((item) => profile.equipment[item]);
    if (!hasEquipment) return false;

    const injuryConflict = exercise.avoid.some((flag) => profile.injuries.includes(flag));
    return !injuryConflict;
  },
  substituteExercise(exercise, focus, profile) {
    if (this.isExerciseAllowed(exercise, profile)) return { ...exercise, substitutedFrom: null };

    const candidates = [...(exerciseLibrary[focus] || []), ...exerciseLibrary["Total Body"], ...fallbackExercises];
    const replacement = candidates.find((item) => {
      return item.name !== exercise.name
        && this.isExerciseAllowed(item, profile)
        && (item.movement === exercise.movement || item.type === exercise.type);
    });

    if (replacement) {
      return { ...replacement, substitutedFrom: exercise.name };
    }

    return { ...fallbackExercises.find((item) => this.isExerciseAllowed(item, profile)) || fallbackExercises[0], substitutedFrom: exercise.name };
  },
  pickExercises(focus, profile, rounds = 4) {
    const pool = [...(exerciseLibrary[focus] || exerciseLibrary["Total Body"])];
    const selected = [];

    while (selected.length < rounds * 2) {
      if (!pool.length) {
        selected.push(this.substituteExercise(fallbackExercises[selected.length % fallbackExercises.length], focus, profile));
        continue;
      }

      const idx = Math.floor(Math.random() * pool.length);
      const original = pool.splice(idx, 1)[0];
      selected.push(this.substituteExercise(original, focus, profile));
    }

    return selected;
  },
  buildPlan(profile) {
    const dayName = this.getDayName(ui.sessionDate.value);
    let focus = this.getFocusForDay(dayName);
    if (["Mobility / Recovery", "Core + Conditioning", "Cardio + Recovery", "Rest"].includes(focus)) {
      focus = "Total Body";
    }

    const selected = this.pickExercises(focus, profile, 4);
    const rounds = [];
    for (let r = 0; r < 4; r += 1) {
      const exA = selected[r * 2];
      const exB = selected[r * 2 + 1];
      rounds.push({
        name: `Round ${r + 1}`,
        mode: r % 2 === 0 ? "Superset" : "Alternating",
        exercises: [exA, exB].map((ex, idx) => ({
          ...ex,
          instanceId: `r${r + 1}_e${idx + 1}_${ex.name}`,
          sets: 3,
          reps: ex.type === "conditioning" ? "40s work" : "8-12 reps",
          restSeconds: ex.type === "conditioning" ? 40 : 60,
          targetWeight: ProgressionAgent.getTargetWeight(profile, ex, profile.level)
        }))
      });
    }

    return {
      id: `session_${Date.now()}`,
      date: ui.sessionDate.value,
      dayName,
      focus,
      warmup: ["5 min easy cardio", "Dynamic mobility: hips, shoulders, thoracic spine", "2 ramp-up sets for first exercise"],
      cooldown: ["3 min slow breathing", "5 min full-body stretch", "Light walk to normalize heart rate"],
      rounds
    };
  }
};

const AIAgent = {
  async getWorkoutSuggestion(profile, plan) {
    const recentLogs = profile.logs.slice(-5);
    const payload = {
      profile: {
        name: profile.name,
        bodyWeightKg: profile.bodyWeightKg,
        level: profile.level,
        injuries: profile.injuries,
        equipment: profile.equipment
      },
      plan,
      recentLogs
    };

    const response = await fetch("/api/ai/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to get AI suggestion.");
    }

    const data = await response.json();
    return data.suggestion || "No suggestion returned.";
  }
};

function roundToPlate(value) {
  return Math.max(2.5, Math.round(value / 2.5) * 2.5);
}

function estimateCalories(weightKg, met, minutes) {
  return (met * 3.5 * weightKg * minutes) / 200;
}

function renderWeeklySplit() {
  const wrap = document.createElement("div");
  wrap.className = "split-grid";
  Object.entries(splitTemplate).forEach(([day, split]) => {
    const item = document.createElement("div");
    item.className = "split-day";
    item.innerHTML = `<strong>${day}</strong><span>${split}</span>`;
    wrap.appendChild(item);
  });
  ui.weeklySplit.innerHTML = "";
  ui.weeklySplit.appendChild(wrap);
}

function renderPlan(plan) {
  const top = document.createElement("div");
  top.innerHTML = `<p><strong>${plan.dayName}</strong> focus: <strong>${plan.focus}</strong> | Profile: <strong>${ProfileAgent.getActiveProfile().name}</strong></p>`;

  const warmup = document.createElement("div");
  warmup.innerHTML = `<h3>Warm-up</h3><p>${plan.warmup.join(" • ")}</p>`;

  const roundsWrap = document.createElement("div");
  plan.rounds.forEach((round) => {
    const card = document.createElement("div");
    card.className = "plan-round";
    const rows = round.exercises
      .map((ex) => {
        const load = ex.targetWeight > 0 ? `${ex.targetWeight} kg` : "Bodyweight / pace";
        const subText = ex.substitutedFrom ? ` (substituted for ${ex.substitutedFrom})` : "";
        return `<li><strong>${ex.name}</strong>${subText} - ${ex.sets} sets x ${ex.reps}, target: ${load}, rest: ${ex.restSeconds}s</li>`;
      })
      .join("");
    card.innerHTML = `<h3>${round.name} (${round.mode})</h3><ul>${rows}</ul>`;
    roundsWrap.appendChild(card);
  });

  const cooldown = document.createElement("div");
  cooldown.innerHTML = `<h3>Cooldown</h3><p>${plan.cooldown.join(" • ")}</p>`;

  ui.planOutput.innerHTML = "";
  ui.planOutput.append(top, warmup, roundsWrap, cooldown);
}

function renderCalories(plan, profile) {
  const weightKg = Number(profile.bodyWeightKg || 75);
  let total = estimateCalories(weightKg, 4.0, 10);

  plan.rounds.forEach((round) => {
    round.exercises.forEach((ex) => {
      total += estimateCalories(weightKg, ex.met || 6.0, 9);
    });
  });
  total += estimateCalories(weightKg, 2.8, 8);

  ui.calorieOutput.textContent = `Estimated burn: ${Math.round(total)} kcal (weight ${weightKg} kg, interval + exercise intensity model).`;
}

function renderLogTable(plan) {
  const exercises = plan.rounds.flatMap((r) => r.exercises);
  const rows = exercises
    .map((ex) => {
      const load = ex.targetWeight > 0 ? `${ex.targetWeight} kg` : "BW/pace";
      return `<tr>
        <td>${ex.name}</td>
        <td>${load}</td>
        <td><input type="number" min="0" id="${ex.instanceId}_reps_1" /></td>
        <td><input type="number" min="1" max="10" step="0.5" id="${ex.instanceId}_rpe_1" /></td>
        <td><input type="number" min="0" id="${ex.instanceId}_reps_2" /></td>
        <td><input type="number" min="1" max="10" step="0.5" id="${ex.instanceId}_rpe_2" /></td>
        <td><input type="number" min="0" id="${ex.instanceId}_reps_3" /></td>
        <td><input type="number" min="1" max="10" step="0.5" id="${ex.instanceId}_rpe_3" /></td>
      </tr>`;
    })
    .join("");

  ui.logOutput.innerHTML = `<div class="log-table-wrap"><table class="log-table">
    <thead>
      <tr>
        <th>Exercise</th><th>Target</th>
        <th>S1 Reps</th><th>S1 RPE</th>
        <th>S2 Reps</th><th>S2 RPE</th>
        <th>S3 Reps</th><th>S3 RPE</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table></div>`;
  ui.saveLog.disabled = false;
}

function collectSetLogEntries(plan) {
  return plan.rounds
    .flatMap((r) => r.exercises)
    .map((ex) => {
      const sets = [1, 2, 3].map((setNo) => ({
        reps: Number(document.getElementById(`${ex.instanceId}_reps_${setNo}`).value),
        rpe: Number(document.getElementById(`${ex.instanceId}_rpe_${setNo}`).value)
      }));
      return { exercise: ex, targetWeight: ex.targetWeight, sets };
    });
}

function createTimerQueue(plan) {
  const steps = [{ label: "Warm-up", seconds: 10 * 60 }];
  plan.rounds.forEach((round, i) => {
    steps.push({ label: `${round.name} setup`, seconds: 30 });
    for (let set = 1; set <= 3; set += 1) {
      round.exercises.forEach((ex) => {
        const work = ex.type === "conditioning" ? 40 : 45;
        steps.push({ label: `${round.name} - ${ex.name} (Set ${set}/3)`, seconds: work });
        steps.push({ label: "Rest", seconds: ex.restSeconds });
      });
    }
    if (i < plan.rounds.length - 1) steps.push({ label: "Round break", seconds: 60 });
  });
  steps.push({ label: "Cooldown", seconds: 8 * 60 });
  return steps;
}

function formatSeconds(total) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function startTimerFlow() {
  if (!appState.timerQueue.length) return;
  if (appState.timerId) clearInterval(appState.timerId);
  startStep(appState.queueIndex);
}

function startStep(index) {
  if (index >= appState.timerQueue.length) {
    finalizeSession();
    return;
  }

  appState.activeStep = appState.timerQueue[index];
  appState.timerSeconds = appState.activeStep.seconds;
  ui.timerLabel.textContent = appState.activeStep.label;
  ui.timerValue.textContent = formatSeconds(appState.timerSeconds);

  appState.timerId = setInterval(() => {
    appState.timerSeconds -= 1;
    ui.timerValue.textContent = formatSeconds(Math.max(appState.timerSeconds, 0));
    if (appState.timerSeconds <= 0) {
      clearInterval(appState.timerId);
      appState.queueIndex += 1;
      startStep(appState.queueIndex);
    }
  }, 1000);
}

function skipCurrentStep() {
  if (!appState.timerQueue.length) return;
  if (appState.timerId) clearInterval(appState.timerId);
  appState.queueIndex += 1;
  startStep(appState.queueIndex);
}

function finalizeSession() {
  ui.timerLabel.textContent = "Session complete";
  ui.timerValue.textContent = "00:00";
  ui.startTimer.disabled = true;
  ui.skipStep.disabled = true;
  ui.completionOutput.textContent = "Session complete. Save set performance to update next weight targets.";
}

function handleBuildPlan() {
  ProfileAgent.syncFormToProfile();
  const profile = ProfileAgent.getActiveProfile();
  const plan = PlanningAgent.buildPlan(profile);
  appState.currentPlan = plan;
  appState.timerQueue = createTimerQueue(plan);
  appState.queueIndex = 0;

  renderPlan(plan);
  renderCalories(plan, profile);
  renderLogTable(plan);

  ui.startTimer.disabled = false;
  ui.skipStep.disabled = false;
  ui.getAiSuggestion.disabled = false;
  ui.completionOutput.textContent = "Plan built. Run session and save set performance for smarter progression.";
  ui.aiSuggestionOutput.textContent = "Plan ready. Click 'Get AI Suggestion' for personalized adjustments.";
}

function savePerformanceLog() {
  if (!appState.currentPlan) return;

  const profile = ProfileAgent.getActiveProfile();
  const entries = collectSetLogEntries(appState.currentPlan);

  profile.logs.push({
    sessionId: appState.currentPlan.id,
    date: appState.currentPlan.date,
    focus: appState.currentPlan.focus,
    entries: entries.map((entry) => ({
      exerciseName: entry.exercise.name,
      targetWeight: entry.targetWeight,
      sets: entry.sets
    }))
  });

  ProgressionAgent.updateFromSetLog(profile, entries);
  DataAgent.saveStore(appState.store);
  ui.completionOutput.textContent = "Set performance saved. Next workouts will adapt weights by reps and RPE.";
}

async function requestAiSuggestion() {
  if (!appState.currentPlan) {
    ui.aiSuggestionOutput.textContent = "Build a workout plan first.";
    return;
  }

  ProfileAgent.syncFormToProfile();
  const profile = ProfileAgent.getActiveProfile();

  ui.getAiSuggestion.disabled = true;
  ui.aiSuggestionOutput.textContent = "Generating AI suggestion...";
  try {
    const suggestion = await AIAgent.getWorkoutSuggestion(profile, appState.currentPlan);
    ui.aiSuggestionOutput.textContent = suggestion;
  } catch (error) {
    ui.aiSuggestionOutput.textContent = `AI suggestion failed: ${error.message}`;
  } finally {
    ui.getAiSuggestion.disabled = false;
  }
}

function bindEvents() {
  ui.buildPlan.addEventListener("click", handleBuildPlan);
  ui.getAiSuggestion.addEventListener("click", requestAiSuggestion);
  ui.startTimer.addEventListener("click", startTimerFlow);
  ui.skipStep.addEventListener("click", skipCurrentStep);
  ui.saveLog.addEventListener("click", savePerformanceLog);

  ui.profileSelect.addEventListener("change", () => {
    appState.store.activeProfileId = ui.profileSelect.value;
    DataAgent.saveStore(appState.store);
    ProfileAgent.syncProfileToForm();
    ui.completionOutput.textContent = "Switched active profile.";
  });

  ui.addProfile.addEventListener("click", () => ProfileAgent.addProfile(ui.newProfileName.value));
  ui.deleteProfile.addEventListener("click", () => ProfileAgent.deleteActiveProfile());

  [ui.bodyWeight, ui.level, ui.injuries, ui.eqBarbell, ui.eqDumbbell, ui.eqCable, ui.eqKettlebell, ui.eqBodyweight, ui.eqMachine]
    .forEach((el) => el.addEventListener("change", () => ProfileAgent.syncFormToProfile()));

  ui.exportData.addEventListener("click", () => ProfileAgent.exportData());
  ui.importDataBtn.addEventListener("click", () => ui.importDataFile.click());
  ui.importDataFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    ProfileAgent.importData(text);
    event.target.value = "";
  });

  ui.qaBuild.addEventListener("click", handleBuildPlan);
  ui.qaStart.addEventListener("click", startTimerFlow);
  ui.qaSave.addEventListener("click", savePerformanceLog);
  ui.qaAi.addEventListener("click", requestAiSuggestion);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    ui.installAppBtn.hidden = false;
  });

  ui.installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    ui.installAppBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    ui.installAppBtn.hidden = true;
  });
}

function init() {
  appState.store = DataAgent.loadStore();
  const today = new Date();
  ui.sessionDate.value = today.toISOString().split("T")[0];
  ui.getAiSuggestion.disabled = true;
  ProfileAgent.renderProfileSelect();
  ProfileAgent.syncProfileToForm();
  renderWeeklySplit();
  bindEvents();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      ui.completionOutput.textContent = "Service worker registration failed. App still works online.";
    });
  }
}

init();
