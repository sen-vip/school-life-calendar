import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const NEIS_BASE_URL = "https://open.neis.go.kr/hub";
const API_KEY = process.env.NEIS_API_KEY;
const neisMemoryCache = new Map();
const neisInflight = new Map();
const NEIS_CACHE_TTL_MS = {
  schoolInfo: 12 * 60 * 60 * 1000,
  SchoolSchedule: 15 * 60 * 1000,
  mealServiceDietInfo: 15 * 60 * 1000,
  elsTimetable: 5 * 60 * 1000,
  misTimetable: 5 * 60 * 1000,
  hisTimetable: 5 * 60 * 1000,
  spsTimetable: 5 * 60 * 1000
};

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ ok: true, service: "school-life-calendar-proxy" });
});

app.get("/api/schools", async (req, res) => {
  try {
    const { keyword = "", officeCode = "" } = req.query;
    if (!keyword.trim()) return res.json({ schools: [] });

    const data = await neisFetch("schoolInfo", {
      ATPT_OFCDC_SC_CODE: officeCode,
      SCHUL_NM: keyword.trim()
    });

    const schools = getRows(data, "schoolInfo").map((row) => ({
      schoolName: row.SCHUL_NM,
      region: row.ATPT_OFCDC_SC_NM,
      officeCode: row.ATPT_OFCDC_SC_CODE,
      schoolCode: row.SD_SCHUL_CODE,
      schoolType: row.SCHUL_KND_SC_NM,
      address: row.ORG_RDNMA || row.ORG_RDNDA || ""
    }));

    res.json({ schools });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/schedules", async (req, res) => {
  try {
    const { officeCode, schoolCode, year, month } = req.query;
    const monthNumber = String(month).padStart(2, "0");
    const startDate = `${year}${monthNumber}01`;
    const endDate = `${year}${monthNumber}${lastDayOfMonth(Number(year), Number(month))}`;

    const data = await neisFetch("SchoolSchedule", {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      AA_FROM_YMD: startDate,
      AA_TO_YMD: endDate
    });

    const schedules = getRows(data, "SchoolSchedule").map((row) => ({
      schoolCode: row.SD_SCHUL_CODE,
      date: toDateKey(row.AA_YMD),
      title: row.EVENT_NM || "학사일정",
      content: row.EVENT_CNTNT || "",
      gradeInfo: {
        one: row.ONE_GRADE_EVENT_YN,
        two: row.TW_GRADE_EVENT_YN,
        three: row.THREE_GRADE_EVENT_YN,
        four: row.FR_GRADE_EVENT_YN,
        five: row.FIV_GRADE_EVENT_YN,
        six: row.SIX_GRADE_EVENT_YN
      }
    }));

    res.json({ schedules });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/meals", async (req, res) => {
  try {
    const { officeCode, schoolCode, date, year, month } = req.query;
    const params = {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode
    };

    if (date) {
      params.MLSV_YMD = date;
    } else if (year && month) {
      const monthNumber = String(month).padStart(2, "0");
      params.MLSV_FROM_YMD = `${year}${monthNumber}01`;
      params.MLSV_TO_YMD = `${year}${monthNumber}${lastDayOfMonth(Number(year), Number(month))}`;
    }

    const data = await neisFetch("mealServiceDietInfo", params);
    const meals = getRows(data, "mealServiceDietInfo").map((row) => ({
      date: toDateKey(row.MLSV_YMD),
      mealName: row.MMEAL_SC_NM || "급식",
      dishes: cleanHtmlLine(row.DDISH_NM).split("\n").filter(Boolean),
      calorie: row.CAL_INFO || "",
      nutrition: cleanHtmlLine(row.NTR_INFO),
      origin: cleanHtmlLine(row.ORPLC_INFO),
      allergy: "식단명 숫자는 알레르기 유발 식재료 번호입니다."
    }));

    if (date) return res.json({ meal: meals[0] || null });
    res.json({ meals });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/timetable", async (req, res) => {
  try {
    const { officeCode, schoolCode, schoolType = "", grade, className, classNm, date } = req.query;
    const endpoint = getTimetableEndpoint(schoolType);
    if (!endpoint) return res.status(400).json({ error: "현재 이 학교급의 시간표 조회는 지원 준비 중입니다." });

    const data = await neisFetch(endpoint, {
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      GRADE: grade,
      CLASS_NM: className || classNm,
      ALL_TI_YMD: date
    });

    const timetable = getRows(data, endpoint)
      .map((row) => ({
        period: row.PERIO,
        subject: row.ITRT_CNTNT || row.CLSRM_NM || "-",
        date: toDateKey(row.ALL_TI_YMD)
      }))
      .sort((a, b) => Number(a.period) - Number(b.period));

    res.json({ timetable });
  } catch (error) {
    sendError(res, error);
  }
});

async function neisFetch(endpoint, params) {
  if (!API_KEY) throw new Error("NEIS_API_KEY 환경변수가 없습니다.");

  const normalizedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => [key, String(value)])
    .sort(([a], [b]) => a.localeCompare(b));
  const cacheKey = `${endpoint}?${new URLSearchParams(normalizedEntries).toString()}`;
  const cached = neisMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (neisInflight.has(cacheKey)) return neisInflight.get(cacheKey);

  const task = (async () => {
    try {
      const url = new URL(`${NEIS_BASE_URL}/${endpoint}`);
      url.searchParams.set("KEY", API_KEY);
      url.searchParams.set("Type", "json");
      url.searchParams.set("pIndex", "1");
      url.searchParams.set("pSize", "100");

      normalizedEntries.forEach(([key, value]) => url.searchParams.set(key, value));

      const response = await fetch(url);
      if (!response.ok) throw new Error(`NEIS 요청 실패: ${response.status}`);
      const data = await response.json();
      const ttl = NEIS_CACHE_TTL_MS[endpoint] || 5 * 60 * 1000;
      neisMemoryCache.set(cacheKey, { data, expiresAt: Date.now() + ttl });

      if (neisMemoryCache.size > 500) {
        const now = Date.now();
        for (const [key, entry] of neisMemoryCache) {
          if (entry.expiresAt <= now) neisMemoryCache.delete(key);
        }
        while (neisMemoryCache.size > 500) {
          const oldestKey = neisMemoryCache.keys().next().value;
          neisMemoryCache.delete(oldestKey);
        }
      }
      return data;
    } finally {
      neisInflight.delete(cacheKey);
    }
  })();

  neisInflight.set(cacheKey, task);
  return task;
}

function getRows(data, rootName) {
  const root = data?.[rootName];
  if (!Array.isArray(root)) return [];
  const body = root.find((item) => item.row);
  return body?.row || [];
}

function getTimetableEndpoint(schoolType) {
  if (schoolType.includes("초")) return "elsTimetable";
  if (schoolType.includes("중")) return "misTimetable";
  if (schoolType.includes("고")) return "hisTimetable";
  if (schoolType.includes("특수")) return "spsTimetable";
  return "";
}

function cleanHtmlLine(value = "") {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .trim();
}

function toDateKey(value = "") {
  const text = String(value);
  if (text.length !== 8) return text;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function lastDayOfMonth(year, month) {
  return String(new Date(year, month, 0).getDate()).padStart(2, "0");
}

function sendError(res, error) {
  res.status(500).json({ error: error.message || "서버 오류" });
}

app.listen(PORT, () => {
  console.log(`school-life-calendar-proxy listening on ${PORT}`);
});
