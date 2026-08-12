(() => {
  const VERSION = 1;
  const PREFIX = `hakdol.neis.v${VERSION}:`;
  const STALE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
  const memory = new Map();
  const inflight = new Map();

  function now() {
    return Date.now();
  }

  function nextLocalMidnight(ts = new Date()) {
    const next = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate() + 1, 0, 0, 0, 0);
    return next.getTime();
  }

  function fullKey(key) {
    return `${PREFIX}${key}`;
  }

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function normalizeEntry(entry) {
    if (!entry || entry.version !== VERSION || !("data" in entry)) return null;
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
    } catch (error) {
      // localStorage 접근이 제한된 환경에서는 메모리 캐시만 사용합니다.
    }
    return null;
  }

  function get(key, { allowStale = false } = {}) {
    const entry = readEntry(key);
    if (!entry) return { hit: false, stale: false, data: undefined };

    const isStale = entry.expiresAt <= now();
    if (isStale && !allowStale) {
      return { hit: false, stale: true, data: entry.data, cachedAt: entry.cachedAt, expiresAt: entry.expiresAt };
    }

    return {
      hit: true,
      stale: isStale,
      data: entry.data,
      cachedAt: entry.cachedAt,
      expiresAt: entry.expiresAt
    };
  }

  function set(key, data, { expiresAt = nextLocalMidnight() } = {}) {
    const storageKey = fullKey(key);
    const entry = {
      version: VERSION,
      data,
      cachedAt: now(),
      expiresAt
    };
    memory.set(storageKey, entry);
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      // 용량 제한 또는 보안 설정으로 저장이 불가능해도 메모리 캐시는 유지합니다.
    }
    return entry;
  }

  function remove(key) {
    const storageKey = fullKey(key);
    memory.delete(storageKey);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      // noop
    }
  }

  async function getOrFetch(key, fetcher, { forceRefresh = false, allowStaleOnError = true } = {}) {
    if (!forceRefresh) {
      const cached = get(key);
      if (cached.hit) return { data: cached.data, source: "cache", stale: false };
    }

    if (!forceRefresh && inflight.has(key)) return inflight.get(key);

    const task = (async () => {
      try {
        const data = await fetcher();
        set(key, data);
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

  function cleanup() {
    const cutoff = now() - STALE_RETENTION_MS;
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const storageKey = localStorage.key(i);
        if (!storageKey || !storageKey.startsWith("hakdol.neis.v")) continue;

        if (!storageKey.startsWith(PREFIX)) {
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
    } catch (error) {
      // localStorage 접근이 불가능한 경우 정리를 건너뜁니다.
    }
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function daysInMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }

  const keys = {
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
  };

  function seedMealMonth(schoolCode, monthKey, meals = []) {
    if (!schoolCode || !/^\d{4}-\d{2}$/.test(monthKey)) return;
    const byDate = new Map((Array.isArray(meals) ? meals : []).map((meal) => [meal?.date, meal]));
    const totalDays = daysInMonth(monthKey);
    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${monthKey}-${pad(day)}`;
      set(keys.meal(schoolCode, dateKey), byDate.get(dateKey) ?? null);
    }
  }

  cleanup();

  window.NeisCache = Object.freeze({
    VERSION,
    keys,
    get,
    set,
    remove,
    getOrFetch,
    cleanup,
    seedMealMonth,
    nextLocalMidnight
  });
})();
