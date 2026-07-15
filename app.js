const STORAGE_KEY = "pee-counter.entries.v1";
const SLEEP_STORAGE_KEY = "pee-counter.sleep.v1";
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
  startSleep: document.getElementById("startSleep"),
  logNightPee: document.getElementById("logNightPee"),
  endSleep: document.getElementById("endSleep"),
  sleepStatus: document.getElementById("sleepStatus"),
  sleepDetail: document.getElementById("sleepDetail"),
  dailyGoal: document.getElementById("dailyGoal"),
  dailyTip: document.getElementById("dailyTip"),
  range: document.getElementById("rangeSelect"),
  todayInterval: document.getElementById("todayInterval"),
  statsAvgPee: document.getElementById("statsAvgPee"),
  weeklyInterval: document.getElementById("weeklyInterval"),
  allTimeInterval: document.getElementById("allTimeInterval"),
  avgNightInterval: document.getElementById("avgNightInterval"),
  streakDays: document.getElementById("streakDays"),
  dayChart: document.getElementById("dayChart"),
  monthlyReportTitle: document.getElementById("monthlyReportTitle"),
  monthTotalPee: document.getElementById("monthTotalPee"),
  monthAvgPee: document.getElementById("monthAvgPee"),
  monthActiveDays: document.getElementById("monthActiveDays"),
  history: document.getElementById("historyList"),
  search: document.getElementById("search"),
  exportCsv: document.getElementById("exportCsv"),
  clearAll: document.getElementById("clearAll")
};

const tips = [
  "Opombe so tvoj najboljši zemljevid: kava, stres, spanec, vadba ali dolgotrajno sedenje.",
  "Ko lulaš, ne potiskaj. Sedi ali stoj sproščeno, izdihni in pusti, da mehur opravi svoje.",
  "Kofein, alkohol in gazirane pijače lahko pri nekaterih ljudeh dražijo mehur. Opazuj svoj vzorec.",
  "Zaprtje lahko poveča pritisk na medenično dno in mehur. Redna prebava je tudi urološka navada.",
  "Če te zagrabi nenadna nuja, najprej umiri dih in sprosti ramena. Panika pogosto poveča občutek nuje.",
  "Bladder training pomeni postopno podaljševanje intervala, ne trpljenja. Majhni koraki so boljši od sile.",
  "Medenično dno ni samo stiskanje. Pomembna je tudi sposobnost sproščanja, posebej med uriniranjem.",
  "Če pogosto lulaš ponoči, Night mode pomaga ločiti spanec od dnevnega ritma.",
  "Bolečina, pekoč občutek, kri v urinu ali nenadna velika sprememba ritma so razlog za posvet z zdravnikom.",
  "Hoja, lahka vadba in manj dolgega sedenja lahko pomagajo cirkulaciji in sproščenosti medeničnega predela.",
  "Pri vajah za medenično dno šteje kvaliteta, ne moč na silo. Če nisi prepričan, pomaga fizioterapevt za medenično dno.",
  "Ne hodi preventivno vsakič 'za vsak slučaj'. Prepogosto praznjenje lahko pri nekaterih ljudeh utrjuje občutek nuje.",
  "Pred spanjem si zapiši zadnji WC in uporabi Night mode. Tako bo jutranja statistika bolj realna.",
  "Stres, slab spanec in napet trebuh lahko vplivajo na občutek nuje. Opombe naj ujamejo tudi počutje.",
  "Če je interval danes slabši, ni poraz. En dan je podatek, vzorec se pokaže šele skozi več dni."
];

let entries = loadEntries();
let sleepSessions = loadSleepSessions();
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
        note: entry.note || "",
        isNight: Boolean(entry.isNight),
        sleepSessionId: entry.sleepSessionId || ""
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch {
    return [];
  }
}

function loadSleepSessions() {
  try {
    return JSON.parse(localStorage.getItem(SLEEP_STORAGE_KEY) || "[]")
      .filter((session) => session && session.start)
      .map((session) => ({
        id: session.id || crypto.randomUUID(),
        start: session.start,
        end: session.end || null
      }))
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return { dailyGoal: 8, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { dailyGoal: 8 };
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function saveSleepSessions() {
  localStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(sleepSessions));
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

function formatTime(value) {
  return new Intl.DateTimeFormat("sl-SI", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat("sl-SI", { day: "2-digit", month: "2-digit" }).format(value);
}

function formatMonth(value) {
  return new Intl.DateTimeFormat("sl-SI", { month: "long", year: "numeric" }).format(value);
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

function getRangeSleepSessions() {
  const days = Number(els.range.value);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return sleepSessions.filter((session) => {
    const sessionEnd = new Date(session.end || session.start);
    return sessionEnd >= cutoff;
  });
}

function getMonthEntries(list, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return list.filter((entry) => {
    const entryDate = new Date(entry.time);
    return entryDate >= start && entryDate < end;
  });
}

function getAverageWindowDays(rangeEntries) {
  const days = Number(els.range.value);
  if (!rangeEntries.length) return days;

  const today = startOfDay(new Date());
  const firstDay = rangeEntries
    .map((entry) => startOfDay(new Date(entry.time)))
    .reduce((earliest, day) => (day < earliest ? day : earliest), today);
  const elapsedDays = Math.floor((today - firstDay) / 86400000) + 1;

  return Math.max(1, Math.min(days, elapsedDays));
}

function withIntervals(list) {
  const ascending = [...list].sort((a, b) => new Date(a.time) - new Date(b.time));
  return ascending.map((entry, index) => {
    const previous = ascending[index - 1];
    const previousIntervalHours = previous ? (new Date(entry.time) - new Date(previous.time)) / 36e5 : null;
    return { ...entry, previousIntervalHours, previousTime: previous ? previous.time : null };
  });
}

function getActiveSleepSession() {
  return sleepSessions.find((session) => !session.end) || null;
}

function getSessionNightPees(sessionId) {
  return entries.filter((entry) => entry.sleepSessionId === sessionId);
}

function intervalOverlapsSleep(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  return sleepSessions.some((session) => {
    const sessionStart = new Date(session.start);
    const sessionEnd = new Date(session.end || new Date());
    return start < sessionEnd && end > sessionStart;
  });
}

function getDayIntervalRows(list) {
  return withIntervals(list).filter((entry) => (
    entry.previousIntervalHours !== null &&
    !entry.isNight &&
    !intervalOverlapsSleep(entry.previousTime, entry.time)
  ));
}

function averageInterval(list) {
  const intervals = getDayIntervalRows(list).map((entry) => entry.previousIntervalHours);
  if (!intervals.length) return null;
  return intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
}

function getTodayIntervalRows() {
  const today = new Date();
  return getDayIntervalRows(entries).filter((entry) => (
    sameDay(new Date(entry.time), today) &&
    sameDay(new Date(entry.previousTime), today)
  ));
}

function getLastTodayInterval() {
  const rows = getTodayIntervalRows();
  const latest = rows.at(-1);
  return latest ? latest.previousIntervalHours : null;
}

function getLastDaysEntries(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return entries.filter((entry) => new Date(entry.time) >= cutoff);
}

function calculateAverageNightInterval() {
  const completed = getRangeSleepSessions()
    .filter((session) => session.end)
    .map((session) => (new Date(session.end) - new Date(session.start)) / 36e5)
    .filter((hours) => Number.isFinite(hours) && hours > 0);

  if (!completed.length) return null;
  return completed.reduce((sum, hours) => sum + hours, 0) / completed.length;
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

function startSleep() {
  if (getActiveSleepSession()) return;
  sleepSessions = [
    {
      id: crypto.randomUUID(),
      start: new Date().toISOString(),
      end: null
    },
    ...sleepSessions
  ];
  saveSleepSessions();
  render();
}

function logNightPee() {
  const session = getActiveSleepSession();
  if (!session) return;
  const entry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    urgency: 3,
    volume: "srednje",
    comfort: "ok",
    note: "Nočni WC",
    isNight: true,
    sleepSessionId: session.id
  };

  entries = [entry, ...entries].sort((a, b) => new Date(b.time) - new Date(a.time));
  saveEntries();
  render();
}

function endSleep() {
  const session = getActiveSleepSession();
  if (!session) return;
  sleepSessions = sleepSessions.map((item) => (
    item.id === session.id ? { ...item, end: new Date().toISOString() } : item
  ));
  saveSleepSessions();
  render();
}

function renderNightMode() {
  const activeSession = getActiveSleepSession();
  const lastCompleted = sleepSessions.find((session) => session.end);

  els.startSleep.disabled = Boolean(activeSession);
  els.logNightPee.disabled = !activeSession;
  els.endSleep.disabled = !activeSession;

  if (activeSession) {
    const nightPees = getSessionNightPees(activeSession.id).length;
    els.sleepStatus.textContent = `Spanje teče od ${formatTime(activeSession.start)}.`;
    els.sleepDetail.textContent = `Nočni WC med tem spanjem: ${nightPees}. Ko se zbudiš, zaključi spanje.`;
    return;
  }

  els.sleepStatus.textContent = "Ko greš spat, vklopi nočni način.";
  if (lastCompleted) {
    const hours = (new Date(lastCompleted.end) - new Date(lastCompleted.start)) / 36e5;
    const nightPees = getSessionNightPees(lastCompleted.id).length;
    els.sleepDetail.textContent = `Zadnji nočni interval: ${formatHours(hours)} · nočni WC: ${nightPees}.`;
  } else {
    els.sleepDetail.textContent = "Nočni WC se shrani ločeno in ne pokvari dnevnega intervala.";
  }
}

function renderDrops(todayCount) {
  const goal = Math.max(1, Number(settings.dailyGoal || 8));
  els.dropMeter.innerHTML = Array.from({ length: goal }, (_, index) => {
    const filled = index < todayCount ? " is-filled" : "";
    return `<span class="meter-drop${filled}"></span>`;
  }).join("");
}

function getLatestIntervalMessage() {
  const todayRows = getTodayIntervalRows();

  if (!todayRows.length) {
    return "Prvi zapis je shranjen. Zdaj ga odmisli in normalno nadaljuj z dnevom.";
  }

  const latest = todayRows.at(-1);
  const previousRows = getDayIntervalRows(entries).filter((entry) => entry.time !== latest.time);

  if (previousRows.length < 2) {
    return `Zadnji interval je bil ${formatHours(latest.previousIntervalHours)}. Samo opazuj, brez zaključkov iz enega podatka.`;
  }

  const baseline = previousRows.reduce((sum, entry) => sum + entry.previousIntervalHours, 0) / previousRows.length;

  if (latest.previousIntervalHours < baseline * 0.7) {
    return "Interval je precej krajši kot običajno. Umiri se, zadihaj in premisli, kaj se je spremenilo.";
  }

  if (latest.previousIntervalHours > baseline * 1.35) {
    return "Interval je daljši kot običajno. Lepo, samo zapiši vzorec in nadaljuj normalno z dnevom.";
  }

  return "Super, interval je v tvojem običajnem ritmu. Zdaj to odmisli in nadaljuj normalno z dnevom.";
}

function renderToday(todayEntries) {
  const count = todayEntries.length;
  const goal = Math.max(1, Number(settings.dailyGoal || 8));
  els.todayCount.textContent = count;
  document.querySelector(".goal-text").textContent = `/${goal}`;
  els.todayInterval.textContent = formatHours(getLastTodayInterval());
  renderDrops(count);

  if (count === 0) {
    els.todayMessage.textContent = "Dodaj prvi zapis za danes.";
  } else {
    els.todayMessage.textContent = getLatestIntervalMessage();
  }
}

function renderMetrics(rangeEntries) {
  const days = getAverageWindowDays(rangeEntries);
  const weeklyAvg = averageInterval(getLastDaysEntries(7));
  const allTimeAvg = averageInterval(entries);
  const nightAvg = calculateAverageNightInterval();
  const avgPee = (rangeEntries.length / days).toFixed(1);

  els.statsAvgPee.textContent = avgPee;
  els.weeklyInterval.textContent = formatHours(weeklyAvg);
  els.allTimeInterval.textContent = formatHours(allTimeAvg);
  els.avgNightInterval.textContent = formatHours(nightAvg);
  els.streakDays.textContent = calculateStreak();
}

function renderChart(rangeEntries) {
  const days = Number(els.range.value);
  const today = startOfDay(new Date());
  const buckets = [];

  els.dayChart.style.setProperty("--chart-days", days);
  els.dayChart.style.gridTemplateColumns = `repeat(${days}, minmax(28px, 1fr))`;

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

function renderMonthlyReport() {
  const now = new Date();
  const monthEntries = getMonthEntries(entries, now);
  const elapsedDays = now.getDate();
  const activeDays = new Set(monthEntries.map((entry) => startOfDay(new Date(entry.time)).getTime())).size;

  els.monthlyReportTitle.textContent = `${formatMonth(now)} do danes`;
  els.monthTotalPee.textContent = monthEntries.length;
  els.monthAvgPee.textContent = (monthEntries.length / elapsedDays).toFixed(1);
  els.monthActiveDays.textContent = activeDays;
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
          <p class="muted">Nujnost ${entry.urgency}/5 · ${entry.volume} · ${entry.comfort}${entry.isNight ? " · nočni WC" : ""}</p>
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
  renderToday(todayEntries);
  renderNightMode();
  renderMetrics(rangeEntries);
  renderChart(rangeEntries);
  renderMonthlyReport();
  renderHistory();
}

els.openEntry.addEventListener("click", () => openEntryDialog());
els.closeEntry.addEventListener("click", closeEntryDialog);

els.startSleep.addEventListener("click", startSleep);
els.logNightPee.addEventListener("click", logNightPee);
els.endSleep.addEventListener("click", endSleep);

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

els.clearAll.addEventListener("click", () => {
  if (!entries.length && !sleepSessions.length) return;
  if (confirm("Res pobrišem vse lokalne zapise?")) {
    entries = [];
    sleepSessions = [];
    saveEntries();
    saveSleepSessions();
    render();
    setScreen("home");
  }
});

els.exportCsv.addEventListener("click", () => {
  const header = ["type", "time", "end_time", "urgency", "volume", "comfort", "is_night", "sleep_session_id", "note"];
  const peeRows = entries.map((entry) => [
    "pee",
    entry.time,
    "",
    entry.urgency,
    entry.volume,
    entry.comfort,
    entry.isNight ? "yes" : "no",
    entry.sleepSessionId || "",
    entry.note
  ]);
  const sleepRows = sleepSessions.map((session) => [
    "sleep",
    session.start,
    session.end || "",
    "",
    "",
    "",
    "",
    session.id,
    ""
  ]);
  const csv = [header, ...peeRows, ...sleepRows]
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
