// ============================================================
// 우리학교 생활 달력 v1.2.2 Today Header Focus
// 모바일 사용성 정리 업데이트
// ============================================================

const API_CONFIG = {
  useMockOnError: true,
  baseUrl: "https://school-life-calendar-proxy.onrender.com"
};

const STORAGE_KEY = "schoolLifeCalendar.selectedSchool";
const TIMETABLE_CACHE_PREFIX = "schoolLifeTimetableCache";
const TIMETABLE_STORAGE_KEYS = {
  grade: "schoolLifeTimetableGrade",
  className: "schoolLifeTimetableClass",
  semester: "schoolLifeTimetableSemester"
};
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const OFFICE_OPTIONS = [
  { code: "", name: "전체", shortName: "전체" },
  { code: "B10", name: "서울특별시교육청", shortName: "서울" },
  { code: "C10", name: "부산광역시교육청", shortName: "부산" },
  { code: "D10", name: "대구광역시교육청", shortName: "대구" },
  { code: "E10", name: "인천광역시교육청", shortName: "인천" },
  { code: "F10", name: "광주광역시교육청", shortName: "광주" },
  { code: "G10", name: "대전광역시교육청", shortName: "대전" },
  { code: "H10", name: "울산광역시교육청", shortName: "울산" },
  { code: "I10", name: "세종특별자치시교육청", shortName: "세종" },
  { code: "J10", name: "경기도교육청", shortName: "경기" },
  { code: "K10", name: "강원특별자치도교육청", shortName: "강원" },
  { code: "M10", name: "충청북도교육청", shortName: "충북" },
  { code: "N10", name: "충청남도교육청", shortName: "충남" },
  { code: "P10", name: "전북특별자치도교육청", shortName: "전북" },
  { code: "Q10", name: "전라남도교육청", shortName: "전남" },
  { code: "R10", name: "경상북도교육청", shortName: "경북" },
  { code: "S10", name: "경상남도교육청", shortName: "경남" },
  { code: "T10", name: "제주특별자치도교육청", shortName: "제주" }
];

const mockSchools = [
  { schoolName: "서울학돌초등학교", region: "서울특별시교육청", officeCode: "B10", schoolCode: "7010000", schoolType: "초등학교", address: "서울특별시 중구 학돌로 10" },
  { schoolName: "부산학돌중학교", region: "부산광역시교육청", officeCode: "C10", schoolCode: "7020000", schoolType: "중학교", address: "부산광역시 해운대구 학돌로 20" },
  { schoolName: "경기학돌고등학교", region: "경기도교육청", officeCode: "J10", schoolCode: "7030000", schoolType: "고등학교", address: "경기도 수원시 학돌로 30" }
];

const mockSchedules = [
  { schoolCode: "7010000", date: "2026-06-24", title: "학부모 공개수업", content: "학부모 초청 공개수업" },
  { schoolCode: "7010000", date: "2026-06-26", title: "학생자치회", content: "전교 학생자치회" },
  { schoolCode: "7010000", date: "2026-06-30", title: "방학식", content: "1학기 방학식" },
  { schoolCode: "7020000", date: "2026-06-24", title: "기말고사", content: "2·3학년 지필평가" },
  { schoolCode: "7020000", date: "2026-06-25", title: "기말고사", content: "2·3학년 지필평가" },
  { schoolCode: "7030000", date: "2026-06-25", title: "진로체험의 날", content: "전학년 진로체험 프로그램" }
];

const mockMeals = {
  "2026-06-24": { dishes: ["쌀밥", "미역국", "닭갈비", "배추김치", "요구르트"], calorie: "720 Kcal", allergy: "알레르기 정보는 실제 API 연결 후 표시" },
  "2026-06-25": { dishes: ["현미밥", "된장국", "돈육불고기", "깍두기", "과일"], calorie: "690 Kcal", allergy: "알레르기 정보는 실제 API 연결 후 표시" }
};

const mockTimetable = [
  { period: "1", subject: "국어" },
  { period: "2", subject: "수학" },
  { period: "3", subject: "영어" },
  { period: "4", subject: "과학" },
  { period: "5", subject: "체육" }
];

const state = {
  selectedSchool: null,
  currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: formatDateKey(new Date()),
  activeTab: "all",
  schedules: [],
  meals: [],
  mealsByDate: {},
  scheduleStatus: "idle",
  scheduleMessage: "",
  mealStatus: "idle",
  mealMessage: "",
  meal: null,
  todaySchedules: [],
  todayMeal: null,
  timetable: [],
  timetableStatus: "idle",
  timetableMessage: "",
  timetableNotice: "",
  schools: []
};

const els = {
  topSchoolName: document.querySelector("#topSchoolName"),
  officeCode: document.querySelector("#officeCode"),
  schoolKeyword: document.querySelector("#schoolKeyword"),
  schoolSearchForm: document.querySelector("#schoolSearchForm"),
  schoolResults: document.querySelector("#schoolResults"),
  schoolSearchSection: document.querySelector("#search"),
  searchTitle: document.querySelector("#searchTitle"),
  resetBtn: document.querySelector("#resetBtn"),
  selectedSchoolName: document.querySelector("#selectedSchoolName"),
  selectedSchoolMeta: document.querySelector("#selectedSchoolMeta"),
  todaySummaryCard: document.querySelector("#todaySummaryCard"),
  todaySummaryTitle: document.querySelector("#todaySummaryTitle"),
  todaySummaryDate: document.querySelector("#todaySummaryDate"),
  copyTodayBtn: document.querySelector("#copyTodayBtn"),
  selectedCopyDate: document.querySelector("#selectedCopyDate"),
  copySelectedBtn: document.querySelector("#copySelectedBtn"),
  copyToast: document.querySelector("#copyToast"),
  todayScheduleSummary: document.querySelector("#todayScheduleSummary"),
  todayMealSummary: document.querySelector("#todayMealSummary"),
  todayTimetableSummary: document.querySelector("#todayTimetableSummary"),
  monthTitle: document.querySelector("#monthTitle"),
  calendar: document.querySelector("#calendar"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  todayBtn: document.querySelector("#todayBtn"),
  scheduleDetail: document.querySelector("#scheduleDetail"),
  mealDetail: document.querySelector("#mealDetail"),
  timetableDetail: document.querySelector("#timetableDetail"),
  gradeInput: document.querySelector("#gradeInput"),
  classInput: document.querySelector("#classInput"),
  semesterInput: document.querySelector("#semesterInput"),
  loadTimetableBtn: document.querySelector("#loadTimetableBtn"),
  tabs: document.querySelectorAll("[data-tab]"),
  panels: document.querySelectorAll("[data-panel]")
};

function init() {
  renderOfficeOptions();
  loadTimetablePreferences();
  bindEvents();
  const saved = loadSelectedSchool();
  if (saved) {
    state.selectedSchool = saved;
    setSelectedDateToToday();
    loadMonthData().then(() => {
      renderAll();
      requestAnimationFrame(() => scrollToTodaySummary(false));
    });
  } else {
    renderAll();
  }
}


function setSelectedDateToToday() {
  const today = new Date();
  state.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  state.selectedDate = formatDateKey(today);
}

function scrollToTodaySummary(smooth = true) {
  const target = els.todaySummaryCard || document.querySelector("#todaySummaryCard") || document.querySelector("#calendarArea");
  if (!target) return;

  // v1.2.2: 학교 선택/복원 직후 사용자가 가장 먼저 궁금해하는
  // “○○학교 오늘” 제목과 날짜 배지가 화면 위쪽에 바로 보이도록 보정합니다.
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const headerOffset = isMobile ? 72 : 88;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: smooth ? "smooth" : "auto"
  });
}

function renderOfficeOptions() {
  els.officeCode.innerHTML = OFFICE_OPTIONS.map((office) => `<option value="${office.code}">${office.name}</option>`).join("");
}

function bindEvents() {
  els.schoolSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleSchoolSearch();
  });

  document.querySelectorAll(".quick-row button").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.dataset.office !== undefined) els.officeCode.value = button.dataset.office;
      if (button.dataset.keyword) els.schoolKeyword.value = button.dataset.keyword;
      await handleSchoolSearch(button.textContent.trim());
    });
  });

  els.resetBtn.addEventListener("click", () => {
    clearSavedPreferences();
    state.selectedSchool = null;
    state.schedules = [];
    state.meals = [];
    state.mealsByDate = {};
    state.scheduleStatus = "idle";
    state.scheduleMessage = "";
    state.mealStatus = "idle";
    state.mealMessage = "";
    state.meal = null;
    state.todaySchedules = [];
    state.todayMeal = null;
    state.timetable = [];
    state.timetableStatus = "idle";
    state.timetableMessage = "";
    state.timetableNotice = "";
    state.schools = [];
    els.schoolResults.innerHTML = "";
    els.schoolKeyword.value = "";
    els.gradeInput.value = "1";
    els.classInput.value = "1";
    els.semesterInput.value = getTodaySemester(state.selectedDate);
    renderAll();
    showCopyToast("저장된 학교와 학년·반을 초기화했어요.");
    document.querySelector("#search")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.prevMonth.addEventListener("click", async () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    await loadMonthData();
    renderAll();
  });

  els.nextMonth.addEventListener("click", async () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
    await loadMonthData();
    renderAll();
  });

  els.todayBtn.addEventListener("click", async () => {
    setSelectedDateToToday();
    await loadMonthData();
    await loadDayData();
    renderAll();
    scrollToTodaySummary(true);
  });

  els.calendar.addEventListener("click", async (event) => {
    const cell = event.target.closest("[data-date]");
    if (!cell) return;
    state.selectedDate = cell.dataset.date;
    await loadDayData();
    renderAll();
    document.querySelector("#detailArea")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      renderPanels();
      renderTabs();
    });
  });

  [els.gradeInput, els.classInput, els.semesterInput].forEach((input) => {
    input.addEventListener("input", () => {
      saveTimetablePreferences();
      restoreTimetableFromCache();
      renderCalendar();
      renderTodaySummary();
      renderTimetableDetail();
    });
    input.addEventListener("change", () => {
      saveTimetablePreferences();
      restoreTimetableFromCache();
      renderCalendar();
      renderTodaySummary();
      renderTimetableDetail();
    });
  });

  els.loadTimetableBtn.addEventListener("click", async () => {
    saveTimetablePreferences();
    await loadTimetable();
    renderTimetableDetail();
  });

  if (els.copyTodayBtn) {
    els.copyTodayBtn.addEventListener("click", async () => {
      await copyText(buildTodayCopyText(), "오늘 내용을 복사했어요. 메신저에 바로 붙여넣을 수 있어요.");
    });
  }

  if (els.copySelectedBtn) {
    els.copySelectedBtn.addEventListener("click", async () => {
      await copyText(buildSelectedDateCopyText(), "선택 날짜 내용을 복사했어요. 메신저에 바로 붙여넣을 수 있어요.");
    });
  }
}

async function handleSchoolSearch(fallbackKeyword = "") {
  const keyword = els.schoolKeyword.value.trim() || fallbackKeyword;
  if (!keyword) {
    els.schoolResults.innerHTML = `<div class="empty result-empty">학교명을 입력하거나 아래 빠른 선택 버튼을 눌러주세요.</div>`;
    return;
  }
  els.schoolResults.innerHTML = `<div class="loading">학교를 검색하고 있어요.</div>`;
  try {
    const schools = await fetchSchools(keyword, els.officeCode.value);
    state.schools = schools;
    renderSchoolResults(schools);
  } catch (error) {
    state.schools = searchMockSchools(keyword, els.officeCode.value);
    renderSchoolResults([], "학교 검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

async function fetchSchools(keyword, officeCode) {
  const params = new URLSearchParams({ keyword, officeCode });
  const response = await fetch(`${API_CONFIG.baseUrl}/api/schools?${params.toString()}`);
  if (!response.ok) throw new Error("학교 검색 실패");
  const data = await response.json();
  return data.schools || [];
}

async function fetchSchedules() {
  if (!state.selectedSchool) return [];
  const params = new URLSearchParams({
    officeCode: state.selectedSchool.officeCode,
    schoolCode: state.selectedSchool.schoolCode,
    year: String(state.currentDate.getFullYear()),
    month: String(state.currentDate.getMonth() + 1)
  });
  const response = await fetch(`${API_CONFIG.baseUrl}/api/schedules?${params.toString()}`);
  if (!response.ok) throw new Error("학사일정 조회 실패");
  const data = await response.json();
  return (data.schedules || []).map(normalizeSchedule);
}

async function fetchMeals() {
  if (!state.selectedSchool) return [];
  const params = new URLSearchParams({
    officeCode: state.selectedSchool.officeCode,
    schoolCode: state.selectedSchool.schoolCode,
    year: String(state.currentDate.getFullYear()),
    month: String(state.currentDate.getMonth() + 1)
  });
  const response = await fetch(`${API_CONFIG.baseUrl}/api/meals?${params.toString()}`);
  if (!response.ok) throw new Error("급식 조회 실패");
  const data = await response.json();
  if (Array.isArray(data.meals)) return data.meals.map(normalizeMeal);
  return data.meal ? [normalizeMeal(data.meal)] : [];
}

async function fetchMeal() {
  if (!state.selectedSchool || !state.selectedDate) return null;
  const params = new URLSearchParams({
    officeCode: state.selectedSchool.officeCode,
    schoolCode: state.selectedSchool.schoolCode,
    date: compactDate(state.selectedDate)
  });
  const response = await fetch(`${API_CONFIG.baseUrl}/api/meals?${params.toString()}`);
  if (!response.ok) throw new Error("급식 조회 실패");
  const data = await response.json();
  return data.meal ? normalizeMeal(data.meal) : null;
}

async function fetchTimetable() {
  if (!state.selectedSchool || !state.selectedDate) return [];
  const apiName = getTimetableApiName(state.selectedSchool);
  if (!apiName) {
    throw new Error("지원하지 않는 학교급");
  }

  const params = new URLSearchParams({
    officeCode: state.selectedSchool.officeCode,
    schoolCode: state.selectedSchool.schoolCode,
    schoolType: state.selectedSchool.schoolType || state.selectedSchool.schoolName || "",
    year: String(new Date(`${state.selectedDate}T00:00:00`).getFullYear()),
    semester: els.semesterInput.value || "1",
    grade: els.gradeInput.value || "1",
    className: els.classInput.value || "1",
    classNm: els.classInput.value || "1",
    date: compactDate(state.selectedDate)
  });

  const response = await fetch(`${API_CONFIG.baseUrl}/api/timetable?${params.toString()}`);
  if (!response.ok) throw new Error("시간표 조회 실패");
  const data = await response.json();
  return (data.timetable || []).map(normalizeTimetable).sort((a, b) => Number(a.period) - Number(b.period));
}

function getTimetableApiName(school) {
  const schoolType = `${school?.schoolType || ""} ${school?.schoolName || ""}`;
  if (/초등/.test(schoolType)) return "elsTimetable";
  if (/중학|중학교/.test(schoolType)) return "misTimetable";
  if (/고등|고등학교/.test(schoolType)) return "hisTimetable";
  return "";
}

async function loadMonthData() {
  if (!state.selectedSchool) return;
  state.scheduleStatus = "loading";
  state.scheduleMessage = "학사일정을 불러오는 중입니다.";
  state.mealStatus = "loading";
  state.mealMessage = "급식정보를 불러오는 중입니다.";
  renderCalendar();
  renderScheduleDetail();
  renderMealDetail();

  const monthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;

  try {
    state.schedules = await fetchSchedules();
    state.scheduleStatus = "success";
    state.scheduleMessage = state.schedules.length ? "" : "이 달에 등록된 학사일정이 없습니다.";
  } catch (error) {
    const fallback = mockSchedules
      .filter((item) => item.schoolCode === state.selectedSchool.schoolCode)
      .filter((item) => item.date.startsWith(monthPrefix));

    state.schedules = fallback;
    state.scheduleStatus = fallback.length ? "mock" : "error";
    state.scheduleMessage = fallback.length
      ? "학사일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : "학사일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
  }

  try {
    state.meals = await fetchMeals();
    state.mealsByDate = Object.fromEntries(state.meals.map((meal) => [meal.date, meal]));
    state.mealStatus = "success";
    state.mealMessage = state.meals.length ? "" : "이 달에 등록된 급식정보가 없습니다.";
  } catch (error) {
    const fallbackMeals = Object.entries(mockMeals)
      .filter(([date]) => date.startsWith(monthPrefix))
      .map(([date, meal]) => normalizeMeal({ date, ...meal, mealName: "중식" }));

    state.meals = fallbackMeals;
    state.mealsByDate = Object.fromEntries(fallbackMeals.map((meal) => [meal.date, meal]));
    state.mealStatus = fallbackMeals.length ? "mock" : "error";
    state.mealMessage = fallbackMeals.length
      ? "급식정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : "급식정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
  }

  updateTodaySnapshot();
  await loadDayData();
}

async function loadDayData() {
  state.meal = state.mealsByDate[state.selectedDate] || null;
  restoreTimetableFromCache();
}

async function loadMeal() {
  if (!state.selectedSchool) return;
  try {
    state.meal = await fetchMeal();
  } catch (error) {
    state.meal = mockMeals[state.selectedDate] || null;
  }
}

async function loadTimetable() {
  if (!state.selectedSchool) {
    state.timetableStatus = "idle";
    state.timetableMessage = "학교를 먼저 선택해 주세요.";
    state.timetable = [];
    return;
  }

  const apiName = getTimetableApiName(state.selectedSchool);
  if (!apiName) {
    state.timetableStatus = "unsupported";
    state.timetableMessage = "현재 이 학교급의 시간표 조회는 아직 지원하지 않습니다.";
    state.timetable = [];
    return;
  }

  state.timetableStatus = "loading";
  state.timetableMessage = "시간표를 불러오는 중입니다.";
  state.timetableNotice = "";
  renderTimetableDetail();

  try {
    state.timetable = await fetchTimetable();
    state.timetableStatus = "success";
    state.timetableMessage = state.timetable.length
      ? ""
      : "이 날짜의 시간표 정보가 없습니다. 학년·반·학기를 확인해 주세요.";

    if (state.timetable.length) {
      saveTimetableCache(state.selectedDate, state.timetable);
    } else {
      removeTimetableCache(state.selectedDate);
    }
    renderCalendar();
    renderTodaySummary();
  } catch (error) {
    state.timetable = [];
    state.timetableStatus = "error";
    state.timetableMessage = "시간표 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
  }
}


function renderAll() {
  renderSelectedSchool();
  renderMonthTitle();
  renderCalendar();
  renderTodaySummary();
  renderDetails();
  renderTabs();
  renderPanels();
}

function renderSelectedSchool() {
  const hasSchool = Boolean(state.selectedSchool);
  document.body.classList.toggle("has-selected-school", hasSchool);

  if (!hasSchool) {
    els.topSchoolName.textContent = "우리학교 생활 달력";
    els.selectedSchoolName.textContent = "학교를 선택하면 생활 달력이 열려요.";
    els.selectedSchoolMeta.textContent = "학사일정은 달력에 표시되고, 급식·시간표는 날짜를 누르면 확인할 수 있어요.";
    if (els.searchTitle) els.searchTitle.textContent = "지역과 학교명을 입력해 주세요";
    return;
  }

  els.topSchoolName.textContent = state.selectedSchool.schoolName;
  els.selectedSchoolName.textContent = state.selectedSchool.schoolName;
  els.selectedSchoolMeta.textContent = `${state.selectedSchool.region || ""} · ${state.selectedSchool.schoolType || "학교"} · ${state.selectedSchool.address || ""}`;
  if (els.searchTitle) els.searchTitle.textContent = "다른 학교를 검색할 수 있어요";
}

function renderMonthTitle() {
  els.monthTitle.textContent = `${state.currentDate.getFullYear()}년 ${state.currentDate.getMonth() + 1}월`;
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDate.getDay());
  const todayKey = formatDateKey(new Date());
  const selectedKey = state.selectedDate;

  let html = `<div class="week-row">${WEEKDAYS.map((day) => `<div class="weekday">${day}</div>`).join("")}</div><div class="calendar-grid">`;
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = formatDateKey(date);
    const isCurrentMonth = date.getMonth() === month;
    const daySchedules = state.schedules.filter((item) => item.date === key);
    const dayMeal = state.mealsByDate[key];
    const classes = ["day-cell", !isCurrentMonth ? "muted" : "", key === todayKey ? "today" : "", key === selectedKey ? "selected" : ""].filter(Boolean).join(" ");

    html += `<button type="button" class="${classes}" data-date="${key}" aria-label="${key}">
      <span class="day-number">${date.getDate()}</span>
      <span class="day-markers">${isCurrentMonth ? renderDayMarkers(daySchedules, dayMeal, key) : ""}</span>
    </button>`;
  }
  html += `</div>`;
  if (state.selectedSchool) {
    const messages = [
      state.scheduleMessage ? { text: state.scheduleMessage, status: state.scheduleStatus } : null,
      state.mealMessage ? { text: state.mealMessage, status: state.mealStatus } : null
    ].filter(Boolean);
    messages.forEach((message) => {
      html += `<div class="calendar-status ${message.status}">${escapeHtml(message.text)}</div>`;
    });
  }
  els.calendar.innerHTML = html;
}


function updateTodaySnapshot() {
  const todayKey = formatDateKey(new Date());
  const todayMonthPrefix = todayKey.slice(0, 7);
  const currentMonthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;
  if (todayMonthPrefix !== currentMonthPrefix) return;

  state.todaySchedules = state.schedules.filter((item) => item.date === todayKey);
  state.todayMeal = state.mealsByDate[todayKey] || null;
}

function renderTodaySummary() {
  if (!els.todaySummaryCard) return;

  const todayKey = formatDateKey(new Date());
  els.todaySummaryDate.textContent = formatKoreanDate(todayKey);

  if (!state.selectedSchool) {
    els.todaySummaryTitle.textContent = "오늘 우리학교";
    const todayMealTitle = document.querySelector("#todayMealTitle");
    if (todayMealTitle) todayMealTitle.innerHTML = "🍱 급식";
    const todayTimetableTitle = document.querySelector("#todayTimetableTitle");
    if (todayTimetableTitle) todayTimetableTitle.innerHTML = "🕘 시간표";
    els.todayScheduleSummary.innerHTML = `<p class="empty">학교를 선택하면 오늘 학사일정이 표시됩니다.</p>`;
    els.todayMealSummary.innerHTML = `<p class="empty">학교를 선택하면 오늘 급식정보가 표시됩니다.</p>`;
    els.todayTimetableSummary.innerHTML = `<p class="empty">학년·반을 확인하고 시간표를 불러오면 오늘 시간표가 표시됩니다.</p>`;
    return;
  }

  els.todaySummaryTitle.textContent = `${state.selectedSchool.schoolName} 오늘`;

  const todaySchedules = state.todaySchedules || [];
  if (state.scheduleStatus === "loading") {
    els.todayScheduleSummary.innerHTML = `<p class="empty">학사일정을 불러오는 중입니다.</p>`;
  } else if (todaySchedules.length) {
    els.todayScheduleSummary.innerHTML = `<ul>${todaySchedules.slice(0, 4).map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ul>${todaySchedules.length > 4 ? `<p class="today-more">외 ${todaySchedules.length - 4}건</p>` : ""}`;
  } else {
    els.todayScheduleSummary.innerHTML = `<p class="empty">오늘 등록된 학사일정이 없습니다.</p>`;
  }

  const todayMeal = state.todayMeal;
  const todayMealTitle = document.querySelector("#todayMealTitle");
  if (todayMealTitle) {
    todayMealTitle.innerHTML = todayMeal?.calorie
      ? `🍱 급식 <span class="title-badge meal-kcal">${escapeHtml(todayMeal.calorie)}</span>`
      : "🍱 급식";
  }
  if (state.mealStatus === "loading") {
    els.todayMealSummary.innerHTML = `<p class="empty">급식정보를 불러오는 중입니다.</p>`;
  } else if (todayMeal && todayMeal.dishes?.length) {
    els.todayMealSummary.innerHTML = `<ul>${todayMeal.dishes.map((dish) => `<li>${escapeHtml(dish)}</li>`).join("")}</ul>`;
  } else {
    els.todayMealSummary.innerHTML = `<p class="empty">오늘 급식정보가 없습니다.</p>`;
  }

  const todayGrade = els.gradeInput.value || "1";
  const todayClassName = els.classInput.value || "1";
  const todaySemester = getTodaySemester(todayKey);
  const todayTimetableTitle = document.querySelector("#todayTimetableTitle");
  if (todayTimetableTitle) {
    todayTimetableTitle.innerHTML = `🕘 시간표 <span class="title-badge class-badge">${escapeHtml(todayGrade)}-${escapeHtml(todayClassName)}</span>`;
  }

  const todayTimetable = getTimetableCacheWithOptions(todayKey, todayGrade, todayClassName, todaySemester);
  if (todayTimetable.length) {
    els.todayTimetableSummary.innerHTML = `<ol class="today-timetable-list">${todayTimetable.slice(0, 7).map((item) => `<li><b>${escapeHtml(item.period)}교시</b> ${escapeHtml(item.subject || "-")}</li>`).join("")}</ol>${todayTimetable.length > 7 ? `<p class="today-more">외 ${todayTimetable.length - 7}교시</p>` : ""}`;
  } else {
    els.todayTimetableSummary.innerHTML = `<p class="empty">학년·반을 확인하고 오늘 시간표를 불러오면 표시됩니다.</p>`;
  }
}

function renderDetails() {
  renderSelectedCopyStrip();
  renderScheduleDetail();
  renderMealDetail();
  renderTimetableDetail();
}

function renderSelectedCopyStrip() {
  if (!els.selectedCopyDate) return;
  els.selectedCopyDate.textContent = state.selectedDate ? formatKoreanDate(state.selectedDate) : "날짜를 선택해 주세요.";
}

function renderScheduleDetail() {
  if (!state.selectedSchool) {
    els.scheduleDetail.innerHTML = `<p class="empty">학교를 먼저 선택해 주세요.</p>`;
    return;
  }
  if (state.scheduleStatus === "loading") {
    els.scheduleDetail.innerHTML = `<p class="empty">학사일정을 불러오는 중입니다.</p>`;
    return;
  }

  const items = state.schedules.filter((item) => item.date === state.selectedDate);
  const notice = state.scheduleMessage && state.scheduleStatus !== "success" ? `<p class="detail-notice">${escapeHtml(state.scheduleMessage)}</p>` : "";
  if (!items.length) {
    els.scheduleDetail.innerHTML = `<strong>${formatKoreanDate(state.selectedDate)}</strong>${notice}<p class="empty">이 날짜에 등록된 학사일정이 없습니다.</p>`;
    return;
  }
  els.scheduleDetail.innerHTML = `<strong>${formatKoreanDate(state.selectedDate)}</strong>${notice}<ul>${items.map((item) => `<li><b>${escapeHtml(item.title)}</b>${item.content ? ` <span class="empty">${escapeHtml(item.content)}</span>` : ""}</li>`).join("")}</ul>`;
}

function renderMealDetail() {
  if (!state.selectedSchool) {
    els.mealDetail.innerHTML = `<p class="empty">학교를 먼저 선택해 주세요.</p>`;
    return;
  }
  if (state.mealStatus === "loading") {
    els.mealDetail.innerHTML = `<strong>${formatKoreanDate(state.selectedDate)}</strong><p class="empty">급식정보를 불러오는 중입니다.</p>`;
    return;
  }

  const notice = state.mealMessage && state.mealStatus !== "success" ? `<p class="detail-notice">${escapeHtml(state.mealMessage)}</p>` : "";
  if (!state.meal) {
    els.mealDetail.innerHTML = `<strong>${formatKoreanDate(state.selectedDate)}</strong>${notice}<p class="empty">이 날짜의 급식정보가 없습니다.</p>`;
    return;
  }

  const dishes = state.meal.dishes || [];
  els.mealDetail.innerHTML = `
    <strong>${formatKoreanDate(state.selectedDate)}</strong>
    ${notice}
    <div class="meal-summary">
      <span class="meal-name">${escapeHtml(state.meal.mealName || "급식")}</span>
      ${state.meal.calorie ? `<span class="meal-calorie">${escapeHtml(state.meal.calorie)}</span>` : ""}
    </div>
    ${dishes.length ? `<ul>${dishes.map((dish) => `<li>${escapeHtml(dish)}</li>`).join("")}</ul>` : `<p class="empty">표시할 메뉴가 없습니다.</p>`}
    ${state.meal.allergy ? `<details class="meal-allergy"><summary>알레르기 정보 보기</summary><p>${escapeHtml(state.meal.allergy)}</p></details>` : ""}
  `;
}

function renderTimetableDetail() {
  if (!state.selectedSchool) {
    els.timetableDetail.innerHTML = `<p class="empty">학교를 먼저 선택해 주세요.</p>`;
    return;
  }

  const grade = els.gradeInput.value || "1";
  const className = els.classInput.value || "1";
  const semester = els.semesterInput.value || "1";
  const apiName = getTimetableApiName(state.selectedSchool);
  const notice = state.timetableNotice
    ? `<p class="detail-notice">${escapeHtml(state.timetableNotice)}</p>`
    : "";

  let body = "";
  if (!apiName) {
    body = `<p class="empty">현재 이 학교급의 시간표 조회는 아직 지원하지 않습니다.</p>`;
  } else if (state.timetableStatus === "loading") {
    body = `<p class="empty">시간표를 불러오는 중입니다.</p>`;
  } else if (state.timetableStatus === "success" && state.timetable.length) {
    body = `<ol class="timetable-list">${state.timetable.map((item) => `<li><b>${escapeHtml(item.period)}교시</b> ${escapeHtml(item.subject || "-")}</li>`).join("")}</ol>`;
  } else if (state.timetableMessage) {
    body = `<p class="empty">${escapeHtml(state.timetableMessage)}</p>`;
  } else {
    body = `<p class="empty">학년·반·학기를 입력한 뒤 시간표 불러오기를 눌러 주세요.</p>`;
  }

  els.timetableDetail.innerHTML = `
    <strong>${formatKoreanDate(state.selectedDate)}</strong>
    ${notice}
    <div class="timetable-ready">
      <span>조회 조건</span>
      <b>${escapeHtml(grade)}학년 ${escapeHtml(className)}반 · ${escapeHtml(semester)}학기</b>
      <p>${apiName ? `선택 학교 기준 시간표 API: ${escapeHtml(apiName)}` : "선택 학교의 학교급을 확인할 수 없습니다."}</p>
    </div>
    ${body}
  `;
}
function renderTabs() {
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === state.activeTab));
}

function renderPanels() {
  els.panels.forEach((panel) => {
    panel.style.display = state.activeTab === "all" || panel.dataset.panel === state.activeTab ? "block" : "none";
  });
}

function renderSchoolResults(schools, notice = "") {
  if (!schools.length) {
    els.schoolResults.innerHTML = `<div class="empty result-empty">검색 결과가 없습니다. 학교명을 조금 줄여서 다시 검색해 주세요.</div>`;
    return;
  }

  const normalizedSchools = schools.map(normalizeSchool).filter((school) => school.schoolName && school.schoolCode);
  state.schools = normalizedSchools;

  els.schoolResults.innerHTML = `
    ${notice ? `<div class="error">${notice}</div>` : ""}
    <div class="result-summary">검색 결과 ${normalizedSchools.length}개</div>
    ${normalizedSchools.map((school, index) => `
      <article class="school-card">
        <div>
          <h3>${escapeHtml(school.schoolName)}</h3>
          <p>${escapeHtml(school.region || "")} · ${escapeHtml(school.schoolType || "학교")}</p>
          <p>${escapeHtml(school.address || "주소 정보 없음")}</p>
        </div>
        <button type="button" data-school-index="${index}" aria-label="${escapeHtml(school.schoolName)} 선택">선택</button>
      </article>
    `).join("")}
  `;

  els.schoolResults.querySelectorAll("[data-school-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      const selected = state.schools[Number(button.dataset.schoolIndex)];
      state.selectedSchool = selected;
      saveSelectedSchool(selected);
      setSelectedDateToToday();
      await loadMonthData();
      renderAll();
      scrollToTodaySummary(true);
    });
  });
}

function renderDayMarkers(scheduleItems, meal, dateKey) {
  const markers = [];
  const scheduleMarker = renderScheduleMarkers(scheduleItems);
  if (scheduleMarker) markers.push(scheduleMarker);
  if (meal) markers.push(`<span class="marker meal">🍱 급식</span>`);
  if (hasTimetableCache(dateKey)) markers.push(`<span class="marker timetable">🕘 시간표</span>`);
  return markers.join("");
}

function renderScheduleMarkers(items) {
  if (!state.selectedSchool || !items.length) return "";

  const mainLabel = getScheduleMarkerLabel(items);
  const extraCount = items.length > 1 ? ` +${items.length - 1}` : "";
  return `<span class="marker schedule">${mainLabel}${extraCount}</span>`;
}

function getScheduleMarkerLabel(items) {
  const titles = items.map((item) => item.title).join(" ");
  if (/방학|개학|휴업|재량휴업|휴교/.test(titles)) return "📅 방학/휴업";
  if (/시험|평가|고사|모의고사/.test(titles)) return "📅 시험";
  if (/체험|행사|축제|운동회|공개수업|자치회/.test(titles)) return "📅 행사";
  if (items.length > 1) return `📅 일정 ${items.length}`;
  return `📅 ${items[0].title}`;
}


async function copyText(text, successMessage) {
  if (!text || !state.selectedSchool) {
    showCopyToast("학교를 먼저 선택해 주세요.", true);
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showCopyToast(successMessage || "복사했어요.");
  } catch (error) {
    showCopyToast("복사에 실패했어요. 다시 시도해 주세요.", true);
  }
}

function showCopyToast(message, isError = false) {
  if (!els.copyToast) return;
  els.copyToast.textContent = message;
  els.copyToast.classList.toggle("error", isError);
  els.copyToast.classList.add("show");
  window.clearTimeout(showCopyToast.timer);
  showCopyToast.timer = window.setTimeout(() => {
    els.copyToast.classList.remove("show");
  }, 2400);
}

function buildTodayCopyText() {
  if (!state.selectedSchool) return "";
  const todayKey = formatDateKey(new Date());
  const grade = els.gradeInput.value || "1";
  const className = els.classInput.value || "1";
  const semester = getTodaySemester(todayKey);
  const todaySchedules = state.todaySchedules || [];
  const todayMeal = state.todayMeal;
  const todayTimetable = getTimetableCacheWithOptions(todayKey, grade, className, semester);

  return buildDayCopyText({
    title: `[${state.selectedSchool.schoolName} 오늘]`,
    dateKey: todayKey,
    schedules: todaySchedules,
    meal: todayMeal,
    timetable: todayTimetable,
    timetableTitle: `🕘 시간표 ${grade}학년 ${className}반`,
    noTimetableText: "- 아직 불러온 시간표가 없습니다."
  });
}

function buildSelectedDateCopyText() {
  if (!state.selectedSchool) return "";
  const selectedSchedules = state.schedules.filter((item) => item.date === state.selectedDate);
  const selectedMeal = state.mealsByDate[state.selectedDate] || state.meal || null;
  const selectedTimetable = getTimetableCache(state.selectedDate);

  return buildDayCopyText({
    title: `[${state.selectedSchool.schoolName}]`,
    dateKey: state.selectedDate,
    schedules: selectedSchedules,
    meal: selectedMeal,
    timetable: selectedTimetable,
    timetableTitle: "🕘 시간표",
    noTimetableText: "- 시간표를 불러온 기록이 없습니다."
  });
}

function buildDayCopyText({ title, dateKey, schedules, meal, timetable, timetableTitle, noTimetableText }) {
  const lines = [title, "", formatKoreanDate(dateKey), ""];

  lines.push("📅 학사일정");
  if (schedules?.length) {
    schedules.forEach((item) => {
      lines.push(`- ${plainText(item.title)}${item.content ? `: ${plainText(item.content)}` : ""}`);
    });
  } else {
    lines.push("- 등록된 학사일정이 없습니다.");
  }

  lines.push("", "🍱 급식");
  if (meal?.dishes?.length) {
    meal.dishes.forEach((dish) => lines.push(`- ${plainText(dish)}`));
    if (meal.calorie) lines.push(`칼로리: ${plainText(meal.calorie)}`);
  } else {
    lines.push("- 급식정보가 없습니다.");
  }

  lines.push("", timetableTitle || "🕘 시간표");
  if (timetable?.length) {
    timetable.forEach((item) => lines.push(`${plainText(item.period)}교시 ${plainText(item.subject || "-")}`));
  } else {
    lines.push(noTimetableText || "- 아직 불러온 시간표가 없습니다.");
  }

  return lines.join("\n");
}

function plainText(value = "") {
  if (value === null || value === undefined) return "";
  const div = document.createElement("div");
  div.innerHTML = String(value).replace(/<br\s*\/?\s*>/gi, "\n");
  return div.textContent.replace(/\s+/g, " ").trim();
}

function normalizeSchool(school = {}) {
  return {
    schoolName: school.schoolName || school.SCHUL_NM || "",
    region: school.region || school.ATPT_OFCDC_SC_NM || "",
    officeCode: school.officeCode || school.ATPT_OFCDC_SC_CODE || "",
    schoolCode: school.schoolCode || school.SD_SCHUL_CODE || "",
    schoolType: school.schoolType || school.SCHUL_KND_SC_NM || "학교",
    address: school.address || school.ORG_RDNMA || school.ORG_RDNDA || ""
  };
}

function searchMockSchools(keyword, officeCode) {
  const lowered = keyword.toLowerCase();
  return mockSchools.filter((school) => {
    const text = `${school.schoolName} ${school.region} ${school.schoolType} ${school.address}`.toLowerCase();
    return text.includes(lowered) && (!officeCode || school.officeCode === officeCode);
  });
}

function normalizeMeal(meal = {}) {
  const rawDate = meal.date || meal.MLSV_YMD || "";
  const date = rawDate.includes("-") ? rawDate : `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  const dishes = Array.isArray(meal.dishes)
    ? meal.dishes
    : cleanTextLines(meal.DDISH_NM || meal.menu || "");

  return {
    date,
    mealName: meal.mealName || meal.MMEAL_SC_NM || "급식",
    dishes,
    calorie: meal.calorie || meal.CAL_INFO || "",
    nutrition: meal.nutrition || meal.NTR_INFO || "",
    origin: meal.origin || meal.ORPLC_INFO || "",
    allergy: meal.allergy || "식단명 숫자는 알레르기 유발 식재료 번호입니다."
  };
}

function normalizeTimetable(item = {}) {
  return {
    period: item.period || item.PERIO || "",
    subject: item.subject || item.ITRT_CNTNT || item.CLSRM_NM || "-",
    date: item.date || item.ALL_TI_YMD || state.selectedDate
  };
}

function normalizeSchedule(item) {
  const date = item.date || item.AA_YMD || item.aaYmd || "";
  return {
    schoolCode: item.schoolCode || item.SD_SCHUL_CODE || "",
    date: date.includes("-") ? date : `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    title: item.title || item.EVENT_NM || item.eventName || "학사일정",
    content: item.content || item.EVENT_CNTNT || item.eventContent || ""
  };
}

function saveSelectedSchool(school) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(school));
}

function loadSelectedSchool() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return null;
    const school = normalizeSchool(saved);
    if (!school.schoolName || !school.officeCode || !school.schoolCode) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return school;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function clearSavedPreferences() {
  localStorage.removeItem(STORAGE_KEY);
  Object.values(TIMETABLE_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

function getTimetableCacheKey(dateKey = state.selectedDate) {
  return getTimetableCacheKeyWithOptions(
    dateKey,
    els.gradeInput.value || "1",
    els.classInput.value || "1",
    els.semesterInput.value || "1"
  );
}

function getTimetableCacheKeyWithOptions(dateKey, grade, className, semester) {
  if (!state.selectedSchool || !dateKey) return "";
  const schoolCode = state.selectedSchool.schoolCode || "unknown";
  return `${TIMETABLE_CACHE_PREFIX}_${schoolCode}_${dateKey.replaceAll("-", "")}_${grade || "1"}_${className || "1"}_${semester || "1"}`;
}

function saveTimetableCache(dateKey, items) {
  const key = getTimetableCacheKey(dateKey);
  if (!key || !items?.length) return;
  localStorage.setItem(key, JSON.stringify(items));
}

function removeTimetableCache(dateKey) {
  const key = getTimetableCacheKey(dateKey);
  if (key) localStorage.removeItem(key);
}

function getTimetableCache(dateKey = state.selectedDate) {
  return getTimetableCacheWithOptions(
    dateKey,
    els.gradeInput.value || "1",
    els.classInput.value || "1",
    els.semesterInput.value || "1"
  );
}

function getTimetableCacheWithOptions(dateKey, grade, className, semester) {
  const key = getTimetableCacheKeyWithOptions(dateKey, grade, className, semester);
  if (!key) return [];
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(items) ? items : [];
  } catch (error) {
    return [];
  }
}

function hasTimetableCache(dateKey) {
  return getTimetableCache(dateKey).length > 0;
}

function restoreTimetableFromCache() {
  const cached = getTimetableCache(state.selectedDate);
  state.timetable = cached;
  state.timetableStatus = cached.length ? "success" : "idle";
  state.timetableMessage = "";
  state.timetableNotice = cached.length ? "저장된 시간표 조회 결과를 보여드려요." : "";
}

function getTodaySemester(dateKey = formatDateKey(new Date())) {
  const date = new Date(`${dateKey}T00:00:00`);
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 6) return "1";
  if (month >= 9 || month <= 2) return "2";

  // 7~8월은 여름방학 전/후가 학교마다 달라서 학사일정 기준으로 판단합니다.
  const schedules = state.schedules || [];
  const hasSecondSemesterStart = schedules.some((item) => {
    const text = `${item.title || ""} ${item.content || ""}`;
    return item.date <= dateKey && /(2학기|개학|개학식|2학기 시작)/.test(text);
  });
  if (hasSecondSemesterStart) return "2";

  const savedSemester = localStorage.getItem(TIMETABLE_STORAGE_KEYS.semester);
  if (savedSemester === "1" || savedSemester === "2") return savedSemester;

  return "1";
}

function saveTimetablePreferences() {
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.grade, String(els.gradeInput.value || "1"));
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.className, String(els.classInput.value || "1"));
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.semester, String(els.semesterInput.value || "1"));
}

function loadTimetablePreferences() {
  const savedGrade = localStorage.getItem(TIMETABLE_STORAGE_KEYS.grade);
  const savedClass = localStorage.getItem(TIMETABLE_STORAGE_KEYS.className);
  const savedSemester = localStorage.getItem(TIMETABLE_STORAGE_KEYS.semester);
  if (savedGrade) els.gradeInput.value = savedGrade;
  if (savedClass) els.classInput.value = savedClass;
  if (savedSemester) els.semesterInput.value = savedSemester;
}

function cleanTextLines(value = "") {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function compactDate(dateKey) { return dateKey.replaceAll("-", ""); }
function pad(value) { return String(value).padStart(2, "0"); }
function formatKoreanDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

init();
