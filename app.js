// ============================================================
// 우리학교 생활 달력 v0.5
// 시간표 입력 UI 및 입력값 저장 준비
// ============================================================

const API_CONFIG = {
  useMockOnError: true,
  baseUrl: "https://school-life-calendar-proxy.onrender.com"
};

const STORAGE_KEY = "schoolLifeCalendar.selectedSchool";
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
  timetable: [],
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
    loadMonthData().then(renderAll);
  } else {
    renderAll();
  }
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
    localStorage.removeItem(STORAGE_KEY);
    state.selectedSchool = null;
    state.schedules = [];
    state.meals = [];
    state.mealsByDate = {};
    state.scheduleStatus = "idle";
    state.scheduleMessage = "";
    state.mealStatus = "idle";
    state.mealMessage = "";
    state.meal = null;
    state.timetable = [];
    state.schools = [];
    els.schoolResults.innerHTML = "";
    els.schoolKeyword.value = "";
    renderAll();
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
    const today = new Date();
    state.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    state.selectedDate = formatDateKey(today);
    await loadMonthData();
    await loadDayData();
    renderAll();
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
      state.timetableNotice = "";
      renderTimetableDetail();
    });
    input.addEventListener("change", () => {
      saveTimetablePreferences();
      state.timetableNotice = "";
      renderTimetableDetail();
    });
  });

  els.loadTimetableBtn.addEventListener("click", () => {
    saveTimetablePreferences();
    const apiName = getTimetableApiName(state.selectedSchool);
    state.timetableNotice = apiName
      ? `시간표 API 연결은 v0.6에서 진행할 예정입니다. 현재는 학년·반·학기 입력값 저장까지만 지원합니다. 준비된 API: ${apiName}`
      : "시간표 API 연결은 v0.6에서 진행할 예정입니다. 현재는 학년·반·학기 입력값 저장까지만 지원합니다.";
    renderTimetableDetail();
  });
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
    renderSchoolResults(state.schools, "프록시 서버 연결이 안 되어 예시 데이터로 보여드려요.");
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
      ? "프록시 서버 연결이 안 되어 예시 학사일정으로 보여드려요."
      : "학사일정을 불러오지 못했어요. 프록시 서버 주소와 NEIS API 키를 확인해 주세요.";
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
      ? "프록시 서버 연결이 안 되어 예시 급식정보로 보여드려요."
      : "급식정보를 불러오지 못했어요. 프록시 서버 주소와 NEIS API 키를 확인해 주세요.";
  }

  await loadDayData();
}

async function loadDayData() {
  state.meal = state.mealsByDate[state.selectedDate] || null;
  state.timetable = [];
}

async function loadMeal() {
  if (!state.selectedSchool) return;
  try {
    state.meal = await fetchMeal();
  } catch (error) {
    state.meal = mockMeals[state.selectedDate] || null;
  }
}


function renderAll() {
  renderSelectedSchool();
  renderMonthTitle();
  renderCalendar();
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
      <span class="day-markers">${isCurrentMonth ? renderDayMarkers(daySchedules, dayMeal) : ""}</span>
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

function renderDetails() {
  renderScheduleDetail();
  renderMealDetail();
  renderTimetableDetail();
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
    ${state.meal.allergy ? `<p class="meal-note">${escapeHtml(state.meal.allergy)}</p>` : ""}
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

  els.timetableDetail.innerHTML = `
    <strong>${formatKoreanDate(state.selectedDate)}</strong>
    ${notice}
    <div class="timetable-ready">
      <span>저장된 조건</span>
      <b>${escapeHtml(grade)}학년 ${escapeHtml(className)}반 · ${escapeHtml(semester)}학기</b>
      <p>${apiName ? `선택 학교 기준 준비 API: ${escapeHtml(apiName)}` : "선택 학교의 학교급을 확인한 뒤 v0.6에서 시간표 API를 연결할 예정입니다."}</p>
    </div>
    <p class="empty">현재는 시간표 조회 전 단계입니다. 입력값 저장까지만 지원합니다.</p>
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
      const today = new Date();
      if (state.currentDate.getFullYear() === today.getFullYear() && state.currentDate.getMonth() === today.getMonth()) {
        state.selectedDate = formatDateKey(today);
      } else {
        state.selectedDate = formatDateKey(new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1));
      }
      await loadMonthData();
      renderAll();
      document.querySelector("#calendarArea")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderDayMarkers(scheduleItems, meal) {
  const markers = [];
  const scheduleMarker = renderScheduleMarkers(scheduleItems);
  if (scheduleMarker) markers.push(scheduleMarker);
  if (meal) markers.push(`<span class="marker meal">🍱 급식</span>`);
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
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return null;
  }
}


function saveTimetablePreferences() {
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.grade, els.gradeInput.value || "1");
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.className, els.classInput.value || "1");
  localStorage.setItem(TIMETABLE_STORAGE_KEYS.semester, els.semesterInput.value || "1");
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
