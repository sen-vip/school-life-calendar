(() => {
  "use strict";

  const CORE_VERSION = "0.2.0";
  const CACHE_VERSION = 1;
  const CACHE_PREFIX = `hakdol.neis.v${CACHE_VERSION}:`;
  const STALE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
  const SCHOOL_SEARCH_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
  const memory = new Map();
  const inflight = new Map();

  function now() {
    return Date.now();
  }

  function nextLocalMidnight(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).getTime();
  }

  function fullKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function normalizeEntry(entry) {
    if (!entry || entry.version !== CACHE_VERSION || !("data" in entry)) return null;
    const cachedAt = Number(entry.cachedAt) || 0;
    const expiresAt = Number(entry.expiresAt) || 0;
    if (!cachedAt || !expiresAt) return null;
    return { ...entry, cachedAt, expiresAt };
  }

  function readEntry(key) {
    const storageKey = fullKey(key);
    const memo = normalizeEntry(memory.get(storageKey));
    if (memo) return memo;

    try {
      const stored = normalizeEntry(safeParse(localStorage.getItem(storageKey)));
      if (stored) {
        memory.set(storageKey, stored);
        return stored;
      }
    } catch {
      // localStorage를 사용할 수 없는 환경은 메모리 캐시만 사용합니다.
    }
    return null;
  }

  function get(key, { allowStale = false } = {}) {
    const entry = readEntry(key);
    if (!entry) return { hit: false, stale: false, data: undefined };

    const stale = entry.expiresAt <= now();
    if (stale && !allowStale) {
      return {
        hit: false,
        stale: true,
        data: entry.data,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt
      };
    }

    return {
      hit: true,
      stale,
      data: entry.data,
      cachedAt: entry.cachedAt,
      expiresAt: entry.expiresAt
    };
  }

  function set(key, data, { expiresAt = nextLocalMidnight() } = {}) {
    const storageKey = fullKey(key);
    const entry = {
      version: CACHE_VERSION,
      data,
      cachedAt: now(),
      expiresAt
    };
    memory.set(storageKey, entry);
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {
      // 저장 공간 제한 등이 있어도 메모리 캐시는 유지합니다.
    }
    return entry;
  }

  function remove(key) {
    const storageKey = fullKey(key);
    memory.delete(storageKey);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // noop
    }
  }

  async function getOrFetch(
    key,
    fetcher,
    { forceRefresh = false, allowStaleOnError = true, expiresAt } = {}
  ) {
    if (!forceRefresh) {
      const cached = get(key);
      if (cached.hit) return { data: cached.data, source: "cache", stale: false };
      if (inflight.has(key)) return inflight.get(key);
    }

    const task = (async () => {
      try {
        const data = await fetcher();
        set(key, data, expiresAt ? { expiresAt } : undefined);
        return { data, source: "network", stale: false };
      } catch (error) {
        if (allowStaleOnError) {
          const stale = get(key, { allowStale: true });
          if (stale.hit && stale.stale) {
            return { data: stale.data, source: "stale-cache", stale: true, error };
          }
        }
        throw error;
      } finally {
        if (inflight.get(key) === task) inflight.delete(key);
      }
    })();

    inflight.set(key, task);
    return task;
  }

  function inspectCache({ allVersions = true } = {}) {
    const keyPrefix = allVersions ? "hakdol.neis.v" : CACHE_PREFIX;
    const result = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const storageKey = localStorage.key(index);
        if (storageKey?.startsWith(keyPrefix)) result.push(storageKey);
      }
    } catch {
      // localStorage 접근이 불가능하면 빈 목록을 반환합니다.
    }
    return result;
  }

  function clearCache({ allVersions = true } = {}) {
    const keyPrefix = allVersions ? "hakdol.neis.v" : CACHE_PREFIX;
    const keysToRemove = new Set(inspectCache({ allVersions }));
    for (const storageKey of memory.keys()) {
      if (storageKey.startsWith(keyPrefix)) keysToRemove.add(storageKey);
    }

    const failed = [];
    for (const storageKey of keysToRemove) {
      memory.delete(storageKey);
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        failed.push({
          key: storageKey,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    inflight.clear();
    return { removed: keysToRemove.size - failed.length, failed };
  }

  function cleanup() {
    const cutoff = now() - STALE_RETENTION_MS;
    try {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const storageKey = localStorage.key(index);
        if (!storageKey || !storageKey.startsWith("hakdol.neis.v")) continue;

        if (!storageKey.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(storageKey);
          memory.delete(storageKey);
          continue;
        }

        const entry = normalizeEntry(safeParse(localStorage.getItem(storageKey)));
        if (!entry || entry.expiresAt < cutoff) {
          localStorage.removeItem(storageKey);
          memory.delete(storageKey);
        }
      }
    } catch {
      // localStorage 접근이 불가능하면 정리를 건너뜁니다.
    }
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function daysInMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }

  function compactDate(dateKey = "") {
    return String(dateKey).replaceAll("-", "");
  }

  const keys = Object.freeze({
    schedule(schoolCode, monthKey) {
      return `schedule:${schoolCode}:${monthKey}`;
    },
    meal(schoolCode, dateKey) {
      return `meal:${schoolCode}:${dateKey}`;
    },
    mealMonth(schoolCode, monthKey) {
      return `meal-month:${schoolCode}:${monthKey}`;
    },
    timetable(schoolCode, grade, className, dateKey) {
      return `timetable-v2:${schoolCode}:${grade}:${className}:${dateKey}`;
    }
  });

  function seedMealMonth(schoolCode, monthKey, meals = []) {
    if (!schoolCode || !/^\d{4}-\d{2}$/.test(monthKey)) return;
    const byDate = new Map((Array.isArray(meals) ? meals : []).map((meal) => [meal?.date, meal]));
    const totalDays = daysInMonth(monthKey);
    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${monthKey}-${pad(day)}`;
      set(keys.meal(schoolCode, dateKey), byDate.get(dateKey) ?? null);
    }
  }

  const neisCache = Object.freeze({
    VERSION: CACHE_VERSION,
    keys,
    get,
    set,
    remove,
    getOrFetch,
    cleanup,
    inspect: inspectCache,
    clear: clearCache,
    seedMealMonth,
    nextLocalMidnight
  });

  function createNeisClient({
    baseUrl,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    schoolSearchCacheMs = SCHOOL_SEARCH_CACHE_MS,
    cache = neisCache
  } = {}) {
    const normalizedBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
    if (!normalizedBaseUrl) throw new Error("HakdolCore NEIS client: baseUrl이 필요합니다.");
    if (typeof fetchImpl !== "function") throw new Error("HakdolCore NEIS client: fetch를 사용할 수 없습니다.");

    async function request(path, params, { signal } = {}) {
      const query = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          query.set(key, String(value));
        }
      });
      const response = await fetchImpl(`${normalizedBaseUrl}${path}?${query.toString()}`, { signal });
      if (!response.ok) throw new Error(`NEIS 프록시 요청 실패: ${response.status}`);
      return response.json();
    }

    async function warm({ timeoutMs = 8000 } = {}) {
      const controller = new AbortController();
      const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetchImpl(`${normalizedBaseUrl}/`, { cache: "no-store", signal: controller.signal });
        return true;
      } catch {
        return false;
      } finally {
        globalThis.clearTimeout(timer);
      }
    }

    async function searchSchools(keyword, officeCode = "", { signal, forceRefresh = false } = {}) {
      const cleaned = String(keyword || "").trim();
      const normalizedKeyword = cleaned.replace(/\s+/g, " ").toLowerCase();
      if (!normalizedKeyword) return { data: [], source: "empty", stale: false };

      const cacheKey = `school-search:${officeCode || "ALL"}:${normalizedKeyword}`;
      if (!forceRefresh) {
        const cached = cache.get(cacheKey);
        if (cached.hit && Array.isArray(cached.data)) {
          return { data: cached.data, source: "cache", stale: false };
        }
      }

      try {
        const payload = await request("/api/schools", { keyword: cleaned, officeCode }, { signal });
        const schools = Array.isArray(payload.schools) ? payload.schools : [];
        cache.set(cacheKey, schools, { expiresAt: Date.now() + schoolSearchCacheMs });
        return { data: schools, source: "network", stale: false };
      } catch (error) {
        const stale = cache.get(cacheKey, { allowStale: true });
        if (stale.hit && Array.isArray(stale.data)) {
          return { data: stale.data, source: "stale-cache", stale: true, error };
        }
        throw error;
      }
    }

    async function getSchedules({ officeCode, schoolCode, year, month, forceRefresh = false }) {
      const monthKey = `${year}-${pad(month)}`;
      const cacheKey = cache.keys.schedule(schoolCode, monthKey);
      return cache.getOrFetch(
        cacheKey,
        async () => {
          const payload = await request("/api/schedules", { officeCode, schoolCode, year, month });
          return Array.isArray(payload.schedules) ? payload.schedules : [];
        },
        { forceRefresh }
      );
    }

    async function getMealsMonth({ officeCode, schoolCode, year, month, forceRefresh = false }) {
      const monthKey = `${year}-${pad(month)}`;
      const cacheKey = cache.keys.mealMonth(schoolCode, monthKey);
      const result = await cache.getOrFetch(
        cacheKey,
        async () => {
          const payload = await request("/api/meals", { officeCode, schoolCode, year, month });
          if (Array.isArray(payload.meals)) return payload.meals;
          return payload.meal ? [payload.meal] : [];
        },
        { forceRefresh }
      );
      if (!result.stale) cache.seedMealMonth(schoolCode, monthKey, result.data);
      return result;
    }

    async function getMeal({ officeCode, schoolCode, dateKey, forceRefresh = false }) {
      const cacheKey = cache.keys.meal(schoolCode, dateKey);
      return cache.getOrFetch(
        cacheKey,
        async () => {
          const payload = await request("/api/meals", {
            officeCode,
            schoolCode,
            date: compactDate(dateKey)
          });
          return payload.meal ?? null;
        },
        { forceRefresh }
      );
    }

    async function getTimetable({
      officeCode,
      schoolCode,
      schoolType = "",
      grade,
      className,
      dateKey,
      forceRefresh = false
    }) {
      const cacheKey = cache.keys.timetable(schoolCode, grade, className, dateKey);
      return cache.getOrFetch(
        cacheKey,
        async () => {
          const payload = await request("/api/timetable", {
            officeCode,
            schoolCode,
            schoolType,
            grade,
            className,
            classNm: className,
            date: compactDate(dateKey)
          });
          return Array.isArray(payload.timetable) ? payload.timetable : [];
        },
        { forceRefresh }
      );
    }

    return Object.freeze({
      baseUrl: normalizedBaseUrl,
      warm,
      searchSchools,
      getSchedules,
      getMealsMonth,
      getMeal,
      getTimetable
    });
  }

  function getStorage(name) {
    try {
      return globalThis[name];
    } catch {
      return null;
    }
  }

  function uniqueStrings(values = []) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function listStorageKeys(storage) {
    if (!storage) return [];
    const result = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key) result.push(key);
      }
    } catch {
      return [];
    }
    return result;
  }

  function findOwnedKeys(storage, exactKeys, prefixes) {
    return listStorageKeys(storage).filter(
      (key) => exactKeys.includes(key) || prefixes.some((prefix) => key.startsWith(prefix))
    );
  }

  function removeOwnedKeys(storage, keys, storageName) {
    const removedKeys = [];
    const failed = [];
    for (const key of keys) {
      try {
        storage.removeItem(key);
        removedKeys.push(key);
      } catch (error) {
        failed.push({
          storage: storageName,
          key,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return { removedKeys, failed };
  }

  function createAppDataManager({
    appId,
    localKeys = [],
    localPrefixes = [],
    sessionKeys = [],
    sessionPrefixes = [],
    localStorage: localStore = getStorage("localStorage"),
    sessionStorage: sessionStore = getStorage("sessionStorage"),
    neisCache: managedNeisCache = null
  } = {}) {
    const normalizedAppId = String(appId || "").trim();
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(normalizedAppId)) {
      throw new Error("HakdolCore data manager: appId는 영문·숫자·점·밑줄·하이픈만 사용할 수 있습니다.");
    }

    const canonicalPrefix = `hakdol.app.${normalizedAppId}:`;
    const ownedLocalKeys = uniqueStrings(localKeys);
    const ownedSessionKeys = uniqueStrings(sessionKeys);
    const ownedLocalPrefixes = uniqueStrings([canonicalPrefix, ...localPrefixes]);
    const ownedSessionPrefixes = uniqueStrings([canonicalPrefix, ...sessionPrefixes]);

    function inspect({ includeNeisCache = false, allNeisVersions = true } = {}) {
      return {
        appId: normalizedAppId,
        localStorage: findOwnedKeys(localStore, ownedLocalKeys, ownedLocalPrefixes),
        sessionStorage: findOwnedKeys(sessionStore, ownedSessionKeys, ownedSessionPrefixes),
        neisCache:
          includeNeisCache && typeof managedNeisCache?.inspect === "function"
            ? managedNeisCache.inspect({ allVersions: allNeisVersions })
            : []
      };
    }

    function clear({ includeNeisCache = false, allNeisVersions = true } = {}) {
      const before = inspect({ includeNeisCache, allNeisVersions });
      const localResult = removeOwnedKeys(localStore, before.localStorage, "localStorage");
      const sessionResult = removeOwnedKeys(sessionStore, before.sessionStorage, "sessionStorage");
      const neisResult =
        includeNeisCache && typeof managedNeisCache?.clear === "function"
          ? managedNeisCache.clear({ allVersions: allNeisVersions })
          : { removed: 0, failed: [] };

      return {
        appId: normalizedAppId,
        removed: {
          localStorage: localResult.removedKeys.length,
          sessionStorage: sessionResult.removedKeys.length,
          neisCache: neisResult.removed || 0,
          total:
            localResult.removedKeys.length +
            sessionResult.removedKeys.length +
            (neisResult.removed || 0)
        },
        failed: [...localResult.failed, ...sessionResult.failed, ...(neisResult.failed || [])]
      };
    }

    return Object.freeze({
      appId: normalizedAppId,
      prefix: canonicalPrefix,
      inspect,
      clear
    });
  }

  cleanup();

  const HakdolCore = Object.freeze({
    version: CORE_VERSION,
    neisCache,
    createNeisClient,
    createAppDataManager
  });

  globalThis.HakdolCore = HakdolCore;
  // 기존 오늘학교 코드가 사용하는 별칭을 계속 유지합니다.
  globalThis.NeisCache = neisCache;
})();
