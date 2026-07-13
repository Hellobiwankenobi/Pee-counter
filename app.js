const STORAGE_KEY = "pee-counter.entries.v1";
const WATER_STORAGE_KEY = "pee-counter.water.v1";
const SETTINGS_KEY = "pee-counter.settings.v1";

const els = {
  form: document.getElementById("entryForm"),
  dialog: document.getElementById("entryDialog"),
  openEntry: document.getElementById("openEntry"),
  closeEntry: document.getElementById("closeEntry"),
  time: document.getElementById("entryTime"),
  urgency: document.getElementById("urgency"),
  volume: document.getElementById("volume"),
  comfort: document.getElementById("comfort"),
  note: document.getElementById("note"),
  todayDate: document.getElementById("todayDate"),
  todayCount: document.getElementById("todayCount"),
  todayMessage: document.getElementById("todayMessage"),
  dropMeter: document.getElementById("dropMeter"),
  waterTotal: document.getElementById("waterTotal"),
  waterGoalText: document.getElementById("waterGoalText"),
  waterProgress: document.getElementById("waterProgress"),
  undoWater: document.getElementById("undoWater"),
  dailyGoal: document.getElementById("dailyGoal"),
  waterGoal: document.getElementById("waterGoal"),
  dailyTip: document.getElementById("dailyTip"),
  range: document.getElementById("rangeSelect"),
  rangeCount: document.getElementById("rangeCount"),
  avgPerDay: document.getElementById("avgPerDay"),
  avgInterval: document.getElementById("avgInterval"),
  longestInterval: document.getElementById("longestInterval"),
  streakDays: document.getElementById("streakDays"),
  dayChart: document.getElementById("dayChart"),
  history: document.getElementById("historyList"),
  search: document.getElementById("search"),
  exportCsv: document.getElementById("exportCsv"),
  clearAll: document.getElementById("clearAll")
};

const tips = [
  "Pij po malo skozi dan, ne vsega naenkrat.",
  "Opombe so tvoj najboljši zemljevid: kava, stres, spanec, vadba.",
  "Če se intervali nenadoma spremenijo, si zapiši tudi počutje.",
  "Pred spanjem je posebej koristno zapisati čas in opombo.",
  "Primerjaj dni z več kave in dni brez nje."
];

let entries = loadEntries();
let waterEntries = loadWaterEntries();
let settings = loadSettings();

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      .filter((entry) => entry && entry.time)
      .map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        time: entry.time,
        urgency: Number(entry.urgency || 3),
        volume: entry.volume || "srednje",
        comfort: entry.comfort || "ok",
        note: entry.note || ""
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch {
    return [];
  }
}

function loadWaterEntries() {
  try {
    return JSON.parse(localStorage.getItem(WATER_STORAGE_KEY) || "[]")
      .filter((entry) => entry && entry.time && Number(entry.amountMl) > 0)
      .map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        time: entry.time,
        amountMl: Number(entry.amountMl)
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return { dailyGoal: 8, waterGoalMl: 2000, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { dailyGoal: 8, waterGoalMl: 2000 };
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function saveWaterEntries() {
  localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(waterEntries));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDatetimeLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setEntryTimeByHourShift(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  els.time.value = toDatetimeLocal(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("sl-SI", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat("sl-SI", { day: "2-digit", month: "2-digit" }).format(value);
}

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "-";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole <= 0) return `${minutes} min`;
  if (minutes === 0) return `${whole} h`;
  return `${whole} h ${minutes} min`;
}

function resetForm() {
  els.time.value = toDatetimeLocal(new Date());
  els.urgency.value = "3";
  els.volume.value = "srednje";
  els.comfort.value = "ok";
  els.note.value = "";
}

function getRangeEntries() {
  const days = Number(els.range.value);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return entries.filter((entry) => new Date(entry.time) >= cutoff);
}

function withIntervals(list) {
  const ascending = [...list].sort((a, b) => new Date(a.time) - new Date(b.time));
  return ascending.map((entry, index) => {
    const previous = ascending[index - 1];
    const previousIntervalHours = previous ? (new Date(entry.time) - new Date(previous.time)) / 36e5 : null;
    return { ...entry, previousIntervalHours };
  });
}

function daysWithEntries() {
  return new Set(entries.map((entry) => startOfDay(new Date(entry.time)).getTime()));
}

function calculateStreak() {
  const days = daysWithEntries();
  let streak = 0;
  const cursor = startOfDay(new Date());

  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function addWater(amountMl) {
  waterEntries = [
    {
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      amountMl
    },
    ...waterEntries
  ].sort((a, b) => new Date(b.time) - new Date(a.time));
  saveWaterEntries();
  render();
}

function undoLastWater() {
  const today = new Date();
  const index = waterEntries.findIndex((entry) => sameDay(new Date(entry.time), today));
  if (index === -1) return;
  waterEntries.splice(index, 1);
  saveWaterEntries();
  render();
}

function renderWater() {
  const today = new Date();
  const todayWater = waterEntries.filter((entry) => sameDay(new Date(entry.time), today));
  const total = todayWater.reduce((sum, entry) => sum + entry.amountMl, 0);
  const goal = Math.max(250, Number(settings.waterGoalMl || 2000));
  const progress = Math.min(100, Math.round((total / goal) * 100));

  els.waterTotal.textContent = total;
  els.waterGoalText.textContent = `cilj ${goal} ml`;
  els.waterProgress.style.width = `${progress}%`;
  els.undoWater.disabled = todayWater.length === 0;
}

function renderDrops(todayCount) {
  const goal = Math.max(1, Number(settings.dailyGoal || 8));
  els.dropMeter.innerHTML = Array.from({ length: goal }, (_, index) => {
    const filled = index < todayCount ? " is-filled" : "";
    return `<span class="meter-drop${filled}"></span>`;
  }).join("");
}

function renderToday(todayEntries) {
  const count = todayEntries.length;
  const goal = Math.max(1, Number(settings.dailyGoal || 8));
  els.todayCount.textContent = count;
  document.querySelector(".goal-text").textContent = `/${goal}`;
  renderDrops(count);

  if (count === 0) {
    els.todayMessage.textContent = "Dodaj prvi zapis za danes.";
  } else if (count < goal) {
    els.todayMessage.textContent = "Dobro. Samo opazuj ritem, brez panike.";
  } else {
    els.todayMessage.textContent = "Super, današnji cilj evidence je dosežen.";
  }
}

function renderMetrics(rangeEntries) {
  const days = Number(els.range.value);
  const intervalRows = withIntervals(rangeEntries).filter((entry) => entry.previousIntervalHours !== null);
  const intervals = intervalRows.map((entry) => entry.previousIntervalHours);
  const avg = intervals.length ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : null;
  const longest = intervals.length ? Math.max(...intervals) : null;

  els.rangeCount.textContent = rangeEntries.length;
  els.avgPerDay.textContent = (rangeEntries.length / days).toFixed(1);
  els.avgInterval.textContent = formatHours(avg);
  els.longestInterval.textContent = formatHours(longest);
  els.streakDays.textContent = calculateStreak();
}

function renderChart(rangeEntries) {
  const days = Math.min(Number(els.range.value), 14);
  const today = startOfDay(new Date());
  const buckets = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    buckets.push({ day, count: 0 });
  }

  rangeEntries.forEach((entry) => {
    const entryDay = startOfDay(new Date(entry.time)).getTime();
    const bucket = buckets.find((item) => item.day.getTime() === entryDay);
    if (bucket) bucket.count += 1;
  });

  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  els.dayChart.innerHTML = buckets.map((bucket) => {
    const height = Math.max(5, Math.round((bucket.count / max) * 132));
    return `
      <div class="bar" title="${formatDay(bucket.day)}: ${bucket.count}">
        <div class="bar-fill" style="height:${height}px"></div>
        <label>${formatDay(bucket.day)}</label>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const query = els.search.value.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    const haystack = [entry.note, entry.volume, entry.comfort].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });

  if (!filtered.length) {
    els.history.innerHTML = '<div class="empty">Ni zapisov za prikaz.</div>';
    return;
  }

  els.history.innerHTML = filtered.map((entry) => `
    <article class="history-item">
      <div class="history-row">
        <div>
          <strong>${formatDateTime(entry.time)}</strong>
          <p class="muted">Nujnost ${entry.urgency}/5 · ${entry.volume} · ${entry.comfort}</p>
        </div>
        <button class="delete-entry" type="button" data-id="${entry.id}">Izbriši</button>
      </div>
      ${entry.note ? `<p>${entry.note}</p>` : ""}
    </article>
  `).join("");
}

function setScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
  document.querySelectorAll("[data-screen-button]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenButton === name);
  });
}

function openEntryDialog() {
  resetForm();
  if (typeof els.dialog.showModal === "function") {
    els.dialog.showModal();
  } else {
    els.dialog.setAttribute("open", "");
  }
}

function closeEntryDialog() {
  els.dialog.close();
}

function render() {
  const now = new Date();
  const todayEntries = entries.filter((entry) => sameDay(new Date(entry.time), now));
  const rangeEntries = getRangeEntries();
  const tipIndex = startOfDay(now).getDate() % tips.length;

  els.todayDate.textContent = new Intl.DateTimeFormat("sl-SI", { weekday: "long", day: "2-digit", month: "long" }).format(now);
  els.dailyTip.textContent = tips[tipIndex];
  els.dailyGoal.value = settings.dailyGoal;
  els.waterGoal.value = settings.waterGoalMl;
  renderToday(todayEntries);
  renderWater();
  renderMetrics(rangeEntries);
  renderChart(rangeEntries);
  renderHistory();
}

els.openEntry.addEventListener("click", () => openEntryDialog());
els.closeEntry.addEventListener("click", closeEntryDialog);

document.querySelectorAll("[data-water-amount]").forEach((button) => {
  button.addEventListener("click", () => addWater(Number(button.dataset.waterAmount)));
});

els.undoWater.addEventListener("click", undoLastWater);

document.querySelectorAll("[data-time-shift]").forEach((button) => {
  button.addEventListener("click", () => setEntryTimeByHourShift(Number(button.dataset.timeShift)));
});

document.querySelector("[data-focus-time]").addEventListener("click", () => {
  els.time.focus();
  if (typeof els.time.showPicker === "function") els.time.showPicker();
});

document.querySelectorAll("[data-screen-button]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.screenButton));
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const entryDate = new Date(els.time.value);
  if (!Number.isFinite(entryDate.getTime())) {
    els.time.focus();
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    time: entryDate.toISOString(),
    urgency: Number(els.urgency.value),
    volume: els.volume.value,
    comfort: els.comfort.value,
    note: els.note.value.trim()
  };

  entries = [entry, ...entries].sort((a, b) => new Date(b.time) - new Date(a.time));
  saveEntries();
  closeEntryDialog();
  resetForm();
  render();
});

els.history.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-entry");
  if (!button) return;
  entries = entries.filter((entry) => entry.id !== button.dataset.id);
  saveEntries();
  render();
});

els.range.addEventListener("change", render);
els.search.addEventListener("input", renderHistory);

els.dailyGoal.addEventListener("change", () => {
  settings.dailyGoal = Math.min(20, Math.max(1, Number(els.dailyGoal.value || 8)));
  saveSettings();
  render();
});

els.waterGoal.addEventListener("change", () => {
  settings.waterGoalMl = Math.min(6000, Math.max(250, Number(els.waterGoal.value || 2000)));
  saveSettings();
  render();
});

els.clearAll.addEventListener("click", () => {
  if (!entries.length && !waterEntries.length) return;
  if (confirm("Res pobrišem vse lokalne zapise?")) {
    entries = [];
    waterEntries = [];
    saveEntries();
    saveWaterEntries();
    render();
    setScreen("home");
  }
});

els.exportCsv.addEventListener("click", () => {
  const header = ["type", "time", "urgency", "volume", "comfort", "amount_ml", "note"];
  const peeRows = entries.map((entry) => [
    "pee",
    entry.time,
    entry.urgency,
    entry.volume,
    entry.comfort,
    "",
    entry.note
  ]);
  const waterRows = waterEntries.map((entry) => [
    "water",
    entry.time,
    "",
    "",
    "",
    entry.amountMl,
    ""
  ]);
  const csv = [header, ...peeRows, ...waterRows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pee-counter-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

resetForm();
render();
