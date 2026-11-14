const DEFAULT_PRIMARY_KEY = 'b97222227e0440713868b5d5b71898b0';
const DEFAULT_FALLBACK_KEY = 'c8af09ffecd8ade9a74ba402c4d27485';
const TMDB_API_BASES = [
  'https://api.themoviedb.org/3',
  'https://api.tmdb.org/3'
];
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';
const EDGE_CACHE_ORIGIN = 'https://cache.tmdbvi.internal';
const IDMAP_EDGE_PATH = '/idmap-v3/latest';

const CACHE_TTL_MS = 20 * 60 * 1000;
const MAX_CACHE_SIZE = 400;
const memoryCache = new Map();

const IMDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const IMDB_NULL_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_IMDB_CACHE_SIZE = 2000;
const imdbCache = new Map();
const imdbToTmdbCache = new Map();

const SEED_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SEED_CACHE_SIZE = 1000;
const seedCache = new Map();

const META_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_META_CACHE_SIZE = 500;
const metaCache = new Map();

const MOVIE_GENRES = {
  28: 'Hành Động',
  12: 'Phiêu Lưu',
  16: 'Hoạt Hình',
  35: 'Hài',
  80: 'Hình Sự',
  99: 'Tài Liệu',
  18: 'Chính Kịch',
  10751: 'Gia Đình',
  14: 'Giả Tưởng',
  36: 'Lịch Sử',
  27: 'Kinh Dị',
  10402: 'Nhạc',
  9648: 'Bí Ẩn',
  10749: 'Lãng Mạn',
  878: 'Khoa Học Viễn Tưởng',
  10770: 'Phim Truyền Hình',
  53: 'Gây Cấn',
  10752: 'Chiến Tranh',
  37: 'Miền Tây'
};

const TV_GENRES = {
  10759: 'Hành Động & Phiêu Lưu',
  16: 'Hoạt Hình',
  35: 'Hài',
  80: 'Hình Sự',
  99: 'Tài Liệu',
  18: 'Chính Kịch',
  10751: 'Gia Đình',
  10762: 'Trẻ Em',
  9648: 'Bí Ẩn',
  10763: 'Tin Tức',
  10764: 'Truyền Hình Thực Tế',
  10765: 'Khoa Học Viễn Tưởng & Giả Tưởng',
  10766: 'Phim Dài Tập',
  10767: 'Talk Show',
  10768: 'Chiến Tranh & Chính Trị',
  37: 'Miền Tây'
};

const MOVIE_GENRE_OPTIONS = [
  'Hành Động',
  'Phiêu Lưu',
  'Hoạt Hình',
  'Hài',
  'Hình Sự',
  'Tài Liệu',
  'Chính Kịch',
  'Gia Đình',
  'Giả Tưởng',
  'Lịch Sử',
  'Kinh Dị',
  'Nhạc',
  'Bí Ẩn',
  'Lãng Mạn',
  'Khoa Học Viễn Tưởng',
  'Gây Cấn',
  'Chiến Tranh',
  'Miền Tây'
];

const MOVIE_GENRE_NAME_TO_ID = Object.fromEntries(
  Object.entries(MOVIE_GENRES).map(([id, name]) => [name, Number(id)])
);

const MANIFEST = {
  id: 'community.nothingp.tmdb.vi',
  version: '1.3.0',
  name: 'NothingP • TMDB Tiếng Việt',
  description:
    'Danh mục & Metadata phim từ TMDB với ngôn ngữ Tiếng Việt (vi-VN) cho Stremio & Nuvio: Phim Mới Có Bản Phát Hành (Digital Release), Trending Today Phim Lẻ, Trending Today Phim Bộ.',
  logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
  background: 'https://image.tmdb.org/t/p/original/fqv8v6AycXKsivp1T5yKtLbGXce.jpg',
  resources: [
    'catalog',
    {
      name: 'meta',
      types: ['movie', 'series'],
      idPrefixes: ['tt', 'tmdb:']
    }
  ],
  types: ['movie', 'series'],
  idPrefixes: ['tt', 'tmdb:'],
  catalogs: [
    {
      type: 'movie',
      id: 'tmdb_digital_release',
      name: 'NothingP • Phim Mới Có Bản Phát Hành (Digital)',
      extra: [
        { name: 'search', isRequired: false },
        {
          name: 'genre',
          options: MOVIE_GENRE_OPTIONS,
          isRequired: false
        },
        { name: 'skip', isRequired: false }
      ]
    },
    {
      type: 'movie',
      id: 'tmdb_trending_movie_day',
      name: 'NothingP • Trending Today - Phim Lẻ',
      extra: [
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    },
    {
      type: 'series',
      id: 'tmdb_trending_tv_day',
      name: 'NothingP • Trending Today - Phim Bộ',
      extra: [
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    }
  ],
  behaviorHints: {
    configurable: false,
    configurationRequired: false
  }
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(data, status = 200, cacheControl = 'public, max-age=1800') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl
    }
  });
}

function getCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlMs = CACHE_TTL_MS) {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) {
      memoryCache.delete(oldestKey);
    }
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function buildKeyCandidates(primaryKey) {
  const keys = [];
  if (primaryKey && String(primaryKey).trim()) {
    keys.push(String(primaryKey).trim());
  }
  if (!keys.includes(DEFAULT_PRIMARY_KEY)) {
    keys.push(DEFAULT_PRIMARY_KEY);
  }
  if (!keys.includes(DEFAULT_FALLBACK_KEY)) {
    keys.push(DEFAULT_FALLBACK_KEY);
  }
  return keys;
}

function createRunContext(rawCtx, maxSubrequests = 46) {
  let usedOps = 0;
  let hydratedThisRequest = false;
  return {
    waitUntil(promise) {
      if (rawCtx && typeof rawCtx.waitUntil === 'function') {
        rawCtx.waitUntil(Promise.resolve(promise).catch(() => {}));
      }
    },
    canSpend(count = 1) {
      return usedOps + count <= maxSubrequests;
    },
    spend(count = 1) {
      usedOps += count;
      return usedOps;
    },
    remaining() {
      return Math.max(0, maxSubrequests - usedOps);
    },
    wasHydrated() {
      return hydratedThisRequest;
    },
    markHydrated() {
      hydratedThisRequest = true;
    }
  };
}

function normalizeStremioType(type) {
  return type === 'series' ? 'series' : 'movie';
}

function buildEdgeCacheRequest(cachePathOrUrl) {
  const url = /^https?:\/\//i.test(cachePathOrUrl)
    ? cachePathOrUrl
    : `${EDGE_CACHE_ORIGIN}${cachePathOrUrl.startsWith('/') ? cachePathOrUrl : `/${cachePathOrUrl}`}`;
  return new Request(url, { method: 'GET' });
}

async function readEdgeCache(cachePathOrUrl, ctx = null) {
  try {
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    if (!cache) return null;
    if (ctx && typeof ctx.canSpend === 'function' && !ctx.canSpend(1)) return null;
    ctx?.spend?.(1);
    const hit = await cache.match(buildEdgeCacheRequest(cachePathOrUrl));
    if (!hit) return null;
    return await hit.json();
  } catch {
    return null;
  }
}

function writeEdgeCache(cachePathOrUrl, data, maxAgeSec, ctx = null) {
  try {
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    if (!cache) return Promise.resolve(false);
    if (ctx && typeof ctx.canSpend === 'function' && !ctx.canSpend(1)) {
      return Promise.resolve(false);
    }
    ctx?.spend?.(1);
    const res = new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${maxAgeSec}, s-maxage=${maxAgeSec}`
      }
    });
    const promise = cache
      .put(buildEdgeCacheRequest(cachePathOrUrl), res)
      .then(() => true)
      .catch(() => false);
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(promise);
    }
    return promise;
  } catch {
    return Promise.resolve(false);
  }
}

function setBoundedMap(map, key, value, maxSize) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= maxSize) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
  map.set(key, value);
}

function rememberIdMapping(mediaType, tmdbId, imdbId) {
  if (!tmdbId || !imdbId) return;
  const cleanImdb = String(imdbId).trim().toLowerCase();
  const cleanTmdb = String(tmdbId).trim();
  if (!/^tt\d+$/i.test(cleanImdb) || !/^\d+$/.test(cleanTmdb)) return;

  for (const key of [`${mediaType}:${cleanImdb}`, cleanImdb]) {
    setBoundedMap(imdbToTmdbCache, key, cleanTmdb, MAX_IMDB_CACHE_SIZE);
  }
  setBoundedMap(
    imdbCache,
    `${mediaType}:${cleanTmdb}`,
    {
      value: cleanImdb,
      expiresAt: Date.now() + IMDB_CACHE_TTL_MS
    },
    MAX_IMDB_CACHE_SIZE
  );
}

function getImdbFromMemory(mediaType, tmdbId) {
  const entry = imdbCache.get(`${mediaType}:${tmdbId}`);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    imdbCache.delete(`${mediaType}:${tmdbId}`);
    return null;
  }
  return entry.value;
}

function getSeed(type, tmdbId) {
  const mediaType = normalizeStremioType(type);
  const key = `${mediaType}:${tmdbId}`;
  const entry = seedCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    seedCache.delete(key);
    return null;
  }
  return entry.value;
}

function setSeed(type, tmdbId, seed) {
  if (!tmdbId || !seed) return;
  const mediaType = normalizeStremioType(type);
  const compact = {
    tmdbId: Number(seed.tmdbId || tmdbId),
    type: mediaType,
    name: seed.name || '',
    description: seed.description || '',
    poster: seed.poster || null,
    background: seed.background || null,
    releaseInfo: seed.releaseInfo,
    imdbRating: seed.imdbRating,
    genres: Array.isArray(seed.genres) ? seed.genres : []
  };
  if (seed.imdb_id) compact.imdb_id = seed.imdb_id;
  setBoundedMap(
    seedCache,
    `${mediaType}:${tmdbId}`,
    {
      value: compact,
      expiresAt: Date.now() + SEED_CACHE_TTL_MS
    },
    MAX_SEED_CACHE_SIZE
  );
}

async function hydrateIdMapFromEdge(ctx = null) {
  if (ctx?.wasHydrated?.()) return;
  ctx?.markHydrated?.();
  const snap = await readEdgeCache(IDMAP_EDGE_PATH, ctx);
  if (!snap || typeof snap !== 'object') return;

  if (snap.imdbToTmdb && typeof snap.imdbToTmdb === 'object') {
    for (const [k, tmdbId] of Object.entries(snap.imdbToTmdb)) {
      if (!tmdbId) continue;
      setBoundedMap(imdbToTmdbCache, k, String(tmdbId), MAX_IMDB_CACHE_SIZE);
      const colonIdx = k.indexOf(':');
      if (colonIdx > 0) {
        const epType = k.slice(0, colonIdx);
        const imdb = k.slice(colonIdx + 1);
        if (!imdbCache.has(`${epType}:${tmdbId}`)) {
          setBoundedMap(
            imdbCache,
            `${epType}:${tmdbId}`,
            { value: imdb, expiresAt: Date.now() + IMDB_CACHE_TTL_MS },
            MAX_IMDB_CACHE_SIZE
          );
        }
      }
    }
  }

  if (snap.seeds && typeof snap.seeds === 'object') {
    const now = Date.now();
    for (const [key, seed] of Object.entries(snap.seeds)) {
      if (!seed || !seed.tmdbId) continue;
      if (!seedCache.has(key)) {
        setBoundedMap(
          seedCache,
          key,
          { value: seed, expiresAt: now + SEED_CACHE_TTL_MS },
          MAX_SEED_CACHE_SIZE
        );
      }
      if (seed.imdb_id) {
        const epType = seed.type === 'series' ? 'tv' : 'movie';
        rememberIdMapping(epType, String(seed.tmdbId), seed.imdb_id);
      }
    }
  }
}

function saveIdMapSnapshot(ctx = null) {
  const idEntries = Array.from(imdbToTmdbCache.entries()).slice(-300);
  const now = Date.now();
  const seedEntries = [];
  for (const [k, entry] of seedCache.entries()) {
    if (entry && entry.expiresAt > now) {
      seedEntries.push([k, entry.value]);
    }
  }
  const compactSeeds = Object.fromEntries(seedEntries.slice(-150));
  const payload = {
    updatedAt: now,
    imdbToTmdb: Object.fromEntries(idEntries),
    seeds: compactSeeds
  };
  return writeEdgeCache(IDMAP_EDGE_PATH, payload, 21600, ctx);
}

function getCachedMeta(mediaType, keyPart) {
  const key = `${mediaType}:${String(keyPart).toLowerCase()}`;
  const entry = metaCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    metaCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedMeta(mediaType, keyPart, meta) {
  if (!keyPart || !meta) return;
  const key = `${mediaType}:${String(keyPart).toLowerCase()}`;
  setBoundedMap(
    metaCache,
    key,
    {
      value: meta,
      expiresAt: Date.now() + META_CACHE_TTL_MS
    },
    MAX_META_CACHE_SIZE
  );
}

async function tmdbFetch(path, params = {}, primaryKey = DEFAULT_PRIMARY_KEY, ctx = null) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const queryEntries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && String(v) !== ''
  );
  const queryStr = new URLSearchParams(
    queryEntries.map(([k, v]) => [k, String(v)])
  ).toString();
  const cacheKey = `${cleanPath}?${queryStr}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const keys = buildKeyCandidates(primaryKey);
  let lastError = null;

  for (const key of keys) {
    for (const base of TMDB_API_BASES) {
      const sep = queryStr ? '&' : '';
      const url = `${base}${cleanPath}?${queryStr}${sep}api_key=${encodeURIComponent(key)}`;
      try {
        ctx?.spend?.(1);
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'NothingP-TMDB-Vi/1.3'
          },
          cf: {
            cacheTtl: 3600,
            cacheEverything: true
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCache(cacheKey, data);
          return data;
        }
        lastError = new Error(`TMDB HTTP ${res.status} on ${base}${cleanPath}`);
        if (res.status === 404) {
          return null;
        }
        if (res.status === 401 || res.status === 429) {
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error(`TMDB fetch failed for ${cleanPath}`);
}

function toIsoDate(dateStr) {
  if (!dateStr) return undefined;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function mapGenres(genreIds, type) {
  if (!Array.isArray(genreIds)) return [];
  const table = type === 'series' ? { ...MOVIE_GENRES, ...TV_GENRES } : MOVIE_GENRES;
  return genreIds.map((id) => table[id]).filter(Boolean);
}

async function resolveImdbIdForTmdb(tmdbId, type, apiKey, ctx = null) {
  const mediaType = type === 'series' ? 'tv' : 'movie';
  const cacheKey = `${mediaType}:${tmdbId}`;
  const cached = imdbCache.get(cacheKey);
  if (cached && Date.now() <= cached.expiresAt) {
    if (cached.value) rememberIdMapping(mediaType, tmdbId, cached.value);
    return cached.value;
  }
  if (cached) {
    imdbCache.delete(cacheKey);
  }

  try {
    const data = await tmdbFetch(`/${mediaType}/${tmdbId}/external_ids`, {}, apiKey, ctx);
    const imdbId =
      typeof data?.imdb_id === 'string' && /^tt\d+$/i.test(data.imdb_id.trim())
        ? data.imdb_id.trim()
        : null;

    setBoundedMap(
      imdbCache,
      cacheKey,
      {
        value: imdbId,
        expiresAt: Date.now() + (imdbId ? IMDB_CACHE_TTL_MS : IMDB_NULL_CACHE_TTL_MS)
      },
      MAX_IMDB_CACHE_SIZE
    );
    if (imdbId) {
      rememberIdMapping(mediaType, tmdbId, imdbId);
    }
    return imdbId;
  } catch {
    return null;
  }
}

function mapCatalogItem(item, type, imdbId = null) {
  const mediaType = type === 'series' ? 'series' : 'movie';
  const rawDate = item.release_date || item.first_air_date || '';
  const name =
    item.title ||
    item.name ||
    item.original_title ||
    item.original_name ||
    `TMDB #${item.id}`;

  const preview = {
    id: imdbId || `tmdb:${item.id}`,
    tmdbId: item.id,
    type: mediaType,
    name,
    poster: item.poster_path ? `${TMDB_IMG_BASE}/w500${item.poster_path}` : null,
    background: item.backdrop_path ? `${TMDB_IMG_BASE}/original${item.backdrop_path}` : null,
    landscapePoster: item.backdrop_path ? `${TMDB_IMG_BASE}/w780${item.backdrop_path}` : null,
    posterShape: 'poster',
    description: item.overview || '',
    releaseInfo: rawDate ? rawDate.slice(0, 4) : undefined,
    genres: mapGenres(item.genre_ids, mediaType)
  };

  if (imdbId) preview.imdb_id = imdbId;
  const released = toIsoDate(rawDate);
  if (released) preview.released = released;
  if (item.vote_average > 0) {
    preview.imdbRating = Number(item.vote_average).toFixed(1);
  }
  return preview;
}

function parseExtra(extraStr) {
  const extra = {};
  if (!extraStr) return extra;
  const cleaned = extraStr.replace(/\.json$/i, '');
  for (const part of cleaned.split('&')) {
    if (!part) continue;
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) {
      extra[decodeURIComponent(part)] = '';
    } else {
      const k = decodeURIComponent(part.slice(0, eqIdx));
      const v = decodeURIComponent(part.slice(eqIdx + 1));
      extra[k] = v;
    }
  }
  return extra;
}

async function getCatalog(type, catalogId, extra, apiKey, ctx = null) {
  const skip = Math.max(0, parseInt(extra.skip, 10) || 0);
  const page = Math.floor(skip / 20) + 1;
  const search = typeof extra.search === 'string' ? extra.search.trim() : '';

  let data = null;

  if (search) {
    const endpoint = type === 'series' ? '/search/tv' : '/search/movie';
    data = await tmdbFetch(
      endpoint,
      {
        query: search,
        language: 'vi-VN',
        include_adult: 'false',
        page
      },
      apiKey,
      ctx
    );
  } else if (catalogId === 'tmdb_digital_release' && type === 'movie') {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const past90 = new Date(now.getTime() - 90 * 86400 * 1000)
      .toISOString()
      .slice(0, 10);

    const params = {
      language: 'vi-VN',
      include_adult: 'false',
      with_release_type: '4',
      'release_date.lte': today,
      'release_date.gte': past90,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
      page
    };

    if (extra.genre && MOVIE_GENRE_NAME_TO_ID[extra.genre]) {
      params.with_genres = String(MOVIE_GENRE_NAME_TO_ID[extra.genre]);
    }

    data = await tmdbFetch('/discover/movie', params, apiKey, ctx);
  } else if (catalogId === 'tmdb_trending_movie_day' && type === 'movie') {
    data = await tmdbFetch(
      '/trending/movie/day',
      { language: 'vi-VN', page },
      apiKey,
      ctx
    );
  } else if (catalogId === 'tmdb_trending_tv_day' && type === 'series') {
    data = await tmdbFetch(
      '/trending/tv/day',
      { language: 'vi-VN', page },
      apiKey,
      ctx
    );
  } else {
    return [];
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length > 0) {
    await hydrateIdMapFromEdge(ctx);
  }
  const imdbIds = await Promise.all(
    results.map((item) => resolveImdbIdForTmdb(item.id, type, apiKey, ctx))
  );
  const metas = results.map((item, idx) => {
    const mapped = mapCatalogItem(item, type, imdbIds[idx]);
    setSeed(mapped.type, String(item.id), mapped);
    return mapped;
  });
  if (metas.length > 0) {
    await saveIdMapSnapshot(ctx);
  }
  return metas;
}

function selectClearLogo(logos) {
  if (!Array.isArray(logos) || logos.length === 0) return undefined;
  const pick = (lang) =>
    logos.find((l) => l.file_path && l.iso_639_1 === lang);
  const chosen = pick('vi') || pick('en') || pick(null) || logos[0];
  return chosen?.file_path ? `${TMDB_IMG_BASE}/w500${chosen.file_path}` : undefined;
}

async function resolveTmdbId(rawId, type, apiKey, ctx = null) {
  const cleaned = String(rawId || '').trim();
  if (!cleaned) return null;

  if (/^tmdb:/i.test(cleaned)) {
    const num = cleaned.slice(5).split(':')[0].trim();
    return /^\d+$/.test(num) ? num : null;
  }
  if (/^\d+$/.test(cleaned)) {
    return cleaned;
  }
  if (/^tt\d+/i.test(cleaned)) {
    const imdbId = cleaned.split(':')[0].toLowerCase();
    const mediaEndpointType = type === 'series' ? 'tv' : 'movie';
    let mapped =
      imdbToTmdbCache.get(`${mediaEndpointType}:${imdbId}`) ||
      imdbToTmdbCache.get(imdbId);
    if (mapped) return mapped;

    await hydrateIdMapFromEdge(ctx);
    mapped =
      imdbToTmdbCache.get(`${mediaEndpointType}:${imdbId}`) ||
      imdbToTmdbCache.get(imdbId);
    if (mapped) return mapped;

    const found = await tmdbFetch(
      `/find/${encodeURIComponent(imdbId)}`,
      { external_source: 'imdb_id', language: 'vi-VN' },
      apiKey,
      ctx
    );
    if (!found) return null;

    if (type === 'series') {
      const matched = found.tv_results?.[0] || found.movie_results?.[0];
      if (matched?.id) {
        const matchedEndpoint = found.tv_results?.[0] ? 'tv' : 'movie';
        const matchedStremio = matchedEndpoint === 'tv' ? 'series' : 'movie';
        rememberIdMapping(matchedEndpoint, String(matched.id), imdbId);
        setSeed(matchedStremio, String(matched.id), mapCatalogItem(matched, matchedStremio, imdbId));
        return String(matched.id);
      }
      return null;
    }

    const matched = found.movie_results?.[0] || found.tv_results?.[0];
    if (matched?.id) {
      const matchedEndpoint = found.movie_results?.[0] ? 'movie' : 'tv';
      const matchedStremio = matchedEndpoint === 'tv' ? 'series' : 'movie';
      rememberIdMapping(matchedEndpoint, String(matched.id), imdbId);
      setSeed(matchedStremio, String(matched.id), mapCatalogItem(matched, matchedStremio, imdbId));
      return String(matched.id);
    }
    return null;
  }
  return null;
}

function parseDirectCacheKey(rawId) {
  const cleaned = String(rawId || '').trim();
  if (/^tmdb:(\d+)/i.test(cleaned)) {
    const num = cleaned.slice(5).split(':')[0].trim();
    return /^\d+$/.test(num) ? { key: num, tmdbId: num } : { key: null, tmdbId: null };
  }
  if (/^\d+$/.test(cleaned)) {
    return { key: cleaned, tmdbId: cleaned };
  }
  if (/^tt\d+/i.test(cleaned)) {
    return { key: cleaned.split(':')[0].toLowerCase(), tmdbId: null };
  }
  return { key: null, tmdbId: null };
}

function syncCacheAliases(mediaType, tmdbEndpointType, meta) {
  if (!meta) return;
  const canonicalId = meta.imdb_id || `tmdb:${meta.tmdbId}`;
  const storedBase = { ...meta, id: canonicalId };
  setCachedMeta(mediaType, String(meta.tmdbId), storedBase);
  if (meta.imdb_id) {
    rememberIdMapping(tmdbEndpointType, String(meta.tmdbId), meta.imdb_id);
    setCachedMeta(mediaType, meta.imdb_id.toLowerCase(), { ...meta, id: meta.imdb_id });
  }
}

async function getMeta(type, id, apiKey, ctx = null, options = {}) {
  const mediaType = normalizeStremioType(type);
  const tmdbEndpointType = mediaType === 'series' ? 'tv' : 'movie';
  const requestedMetaId = /^(tmdb:|tt)/i.test(id) ? id : null;
  const { key: directKey, tmdbId: directTmdbId } = parseDirectCacheKey(id);

  if (directKey) {
    const memDirect = getCachedMeta(mediaType, directKey);
    if (memDirect) {
      return requestedMetaId ? { ...memDirect, id: requestedMetaId } : memDirect;
    }
    if (!options.skipEdgeRead) {
      const edgeDirect = await readEdgeCache(`/meta-v3/${mediaType}/${directKey}`, ctx);
      if (edgeDirect) {
        syncCacheAliases(mediaType, tmdbEndpointType, edgeDirect);
        return requestedMetaId ? { ...edgeDirect, id: requestedMetaId } : edgeDirect;
      }
    }
  }

  const tmdbId = directTmdbId || (await resolveTmdbId(id, mediaType, apiKey, ctx));
  if (!tmdbId) return null;

  if (directKey !== tmdbId) {
    const memByTmdb = getCachedMeta(mediaType, tmdbId);
    if (memByTmdb) {
      if (directKey) setCachedMeta(mediaType, directKey, memByTmdb);
      return requestedMetaId ? { ...memByTmdb, id: requestedMetaId } : memByTmdb;
    }
    if (!options.skipEdgeRead) {
      const edgeByTmdb = await readEdgeCache(`/meta-v3/${mediaType}/${tmdbId}`, ctx);
      if (edgeByTmdb) {
        syncCacheAliases(mediaType, tmdbEndpointType, edgeByTmdb);
        return requestedMetaId ? { ...edgeByTmdb, id: requestedMetaId } : edgeByTmdb;
      }
    }
  }

  const seed = getSeed(mediaType, tmdbId);
  const knownImdbId =
    (/^tt\d+/i.test(id) ? id.split(':')[0] : null) ||
    seed?.imdb_id ||
    getImdbFromMemory(tmdbEndpointType, tmdbId) ||
    null;
  const hasViDescription = Boolean(seed?.description && seed.description.trim());

  const appendParts = ['credits', 'videos', 'images'];
  if (!knownImdbId) {
    appendParts.unshift('external_ids');
  }
  if (!hasViDescription) {
    appendParts.push('translations');
  }
  if (mediaType === 'series') {
    appendParts.push('season/1', 'season/2', 'season/3');
  }
  const appendFields = appendParts.join(',');

  const viData = await tmdbFetch(
    `/${tmdbEndpointType}/${tmdbId}`,
    {
      language: 'vi-VN',
      append_to_response: appendFields,
      include_image_language: 'vi,en,null'
    },
    apiKey,
    ctx
  );
  if (!viData) return null;

  const translations = Array.isArray(viData.translations?.translations)
    ? viData.translations.translations
    : [];
  const viTrans = translations.find((t) => t.iso_639_1 === 'vi')?.data;
  const enTrans =
    translations.find((t) => t.iso_639_1 === 'en' && t.iso_3166_1 === 'US')?.data ||
    translations.find((t) => t.iso_639_1 === 'en')?.data;

  const imdbId =
    viData.external_ids?.imdb_id ||
    knownImdbId ||
    undefined;
  if (imdbId) {
    rememberIdMapping(tmdbEndpointType, tmdbId, imdbId);
  }

  const title =
    viData.title ||
    viData.name ||
    viTrans?.title ||
    viTrans?.name ||
    enTrans?.title ||
    enTrans?.name ||
    seed?.name ||
    viData.original_title ||
    viData.original_name ||
    `TMDB #${tmdbId}`;

  const description =
    (viData.overview && viData.overview.trim()) ||
    (viTrans?.overview && viTrans.overview.trim()) ||
    (enTrans?.overview && enTrans.overview.trim()) ||
    (seed?.description && seed.description.trim()) ||
    '';

  const rawDate = viData.release_date || viData.first_air_date || '';
  const releaseYear = rawDate ? rawDate.slice(0, 4) : undefined;
  let releaseInfo = releaseYear;
  if (mediaType === 'series' && releaseYear) {
    const lastYear = viData.last_air_date ? viData.last_air_date.slice(0, 4) : '';
    const ended = viData.status === 'Ended' || viData.status === 'Canceled';
    releaseInfo = ended && lastYear && lastYear !== releaseYear
      ? `${releaseYear}-${lastYear}`
      : ended
        ? releaseYear
        : `${releaseYear}-`;
  }

  const genres = Array.isArray(viData.genres)
    ? viData.genres.map((g) => g.name).filter(Boolean)
    : [];

  const crew = Array.isArray(viData.credits?.crew) ? viData.credits.crew : [];
  const castList = Array.isArray(viData.credits?.cast)
    ? viData.credits.cast.slice(0, 10).map((c) => c.name).filter(Boolean)
    : [];

  let directors = crew
    .filter((c) => c.job === 'Director')
    .map((c) => c.name)
    .filter(Boolean);
  if (directors.length === 0 && Array.isArray(viData.created_by)) {
    directors = viData.created_by.map((c) => c.name).filter(Boolean);
  }

  const writers = [
    ...new Set(
      crew
        .filter((c) => ['Writer', 'Screenplay', 'Story'].includes(c.job))
        .map((c) => c.name)
        .filter(Boolean)
    )
  ];

  const trailers = Array.isArray(viData.videos?.results)
    ? viData.videos.results
        .filter((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key)
        .map((v) => ({ source: v.key, type: 'Trailer' }))
    : [];

  const runtimeMinutes =
    viData.runtime ||
    (Array.isArray(viData.episode_run_time) ? viData.episode_run_time[0] : null);

  const metaId = requestedMetaId || imdbId || `tmdb:${tmdbId}`;

  const meta = {
    id: metaId,
    tmdbId: Number(tmdbId),
    type: mediaType,
    name: title,
    poster: viData.poster_path ? `${TMDB_IMG_BASE}/w500${viData.poster_path}` : null,
    background: viData.backdrop_path
      ? `${TMDB_IMG_BASE}/original${viData.backdrop_path}`
      : null,
    landscapePoster: viData.backdrop_path
      ? `${TMDB_IMG_BASE}/w780${viData.backdrop_path}`
      : null,
    posterShape: 'poster',
    description,
    genres,
    cast: castList,
    director: directors,
    writer: writers,
    trailers
  };

  if (imdbId) meta.imdb_id = imdbId;
  const logo = selectClearLogo(viData.images?.logos);
  if (logo) meta.logo = logo;
  if (releaseInfo) meta.releaseInfo = releaseInfo;
  const releasedIso = toIsoDate(rawDate);
  if (releasedIso) meta.released = releasedIso;
  if (viData.last_air_date) meta.lastAirDate = viData.last_air_date;
  if (viData.status) meta.status = viData.status;
  if (viData.vote_average > 0) meta.imdbRating = Number(viData.vote_average).toFixed(1);
  if (runtimeMinutes > 0) meta.runtime = `${runtimeMinutes} min`;
  if (Array.isArray(viData.production_countries) && viData.production_countries.length > 0) {
    meta.country = viData.production_countries.map((c) => c.name).join(', ');
  }
  if (viData.original_language) meta.language = viData.original_language;
  if (viData.homepage) meta.website = viData.homepage;

  if (mediaType === 'series') {
    const seasons = (Array.isArray(viData.seasons) ? viData.seasons : [])
      .filter((s) => Number(s.season_number) > 0)
      .slice(0, 8);

    const extraSeasonsNeeded = seasons.filter((s) => {
      const embedded = viData[`season/${s.season_number}`];
      if (embedded && Array.isArray(embedded.episodes)) return false;
      return !getCache(`/tv/${tmdbId}/season/${s.season_number}?language=vi-VN`);
    }).length;

    if (options.isPrewarm && ctx && typeof ctx.canSpend === 'function' && !ctx.canSpend(extraSeasonsNeeded + 1)) {
      return null;
    }

    const seasonResults = await Promise.all(
      seasons.map((s) => {
        const embedded = viData[`season/${s.season_number}`];
        if (embedded && Array.isArray(embedded.episodes)) {
          return Promise.resolve(embedded);
        }
        return tmdbFetch(
          `/tv/${tmdbId}/season/${s.season_number}`,
          { language: 'vi-VN' },
          apiKey,
          ctx
        ).catch(() => null);
      })
    );

    const epPrefix = imdbId || `tmdb:${tmdbId}`;
    const videos = [];
    for (const seasonData of seasonResults) {
      if (!seasonData || !Array.isArray(seasonData.episodes)) continue;
      for (const ep of seasonData.episodes) {
        const epTitle = ep.name || `Tập ${ep.episode_number}`;
        const video = {
          id: `${epPrefix}:${ep.season_number}:${ep.episode_number}`,
          title: epTitle,
          name: epTitle,
          season: ep.season_number,
          episode: ep.episode_number,
          overview: ep.overview || '',
          description: ep.overview || ''
        };
        if (ep.still_path) {
          video.thumbnail = `${TMDB_IMG_BASE}/w500${ep.still_path}`;
        }
        const epReleased = toIsoDate(ep.air_date);
        if (epReleased) {
          video.released = epReleased;
        }
        videos.push(video);
      }
    }
    meta.videos = videos;
    meta.behaviorHints = {
      hasScheduledVideos: true
    };
  } else {
    meta.behaviorHints = {
      defaultVideoId: imdbId || `tmdb:${tmdbId}`,
      hasScheduledVideos: false
    };
  }

  syncCacheAliases(mediaType, tmdbEndpointType, meta);
  const storedBase = { ...meta, id: imdbId || `tmdb:${tmdbId}` };
  if (imdbId) {
    writeEdgeCache(`/meta-v3/${mediaType}/${imdbId.toLowerCase()}`, { ...storedBase, id: imdbId }, 21600, ctx);
    if (!options.isPrewarm) {
      writeEdgeCache(`/meta-v3/${mediaType}/${tmdbId}`, storedBase, 21600, ctx);
    }
  } else {
    writeEdgeCache(`/meta-v3/${mediaType}/${tmdbId}`, storedBase, 21600, ctx);
  }
  return requestedMetaId ? { ...meta, id: requestedMetaId } : meta;
}

async function prewarmMetas(items, apiKey, reqCtx) {
  if (!Array.isArray(items) || items.length === 0) return;
  const isSeriesBatch = items[0]?.type === 'series';
  const chunkSize = isSeriesBatch ? 1 : 4;

  for (let i = 0; i < items.length; i += chunkSize) {
    if (!reqCtx.canSpend(2)) break;
    const maxAffordable = Math.min(chunkSize, Math.floor(reqCtx.remaining() / 2));
    if (maxAffordable <= 0) break;

    const slice = items.slice(i, i + maxAffordable);
    await Promise.allSettled(
      slice.map((m) =>
        getMeta(m.type, m.id, apiKey, reqCtx, {
          isPrewarm: true,
          skipEdgeRead: true
        }).catch(() => null)
      )
    );
  }
}

function renderLandingHtml(origin) {
  const manifestUrl = `${origin}/manifest.json`;
  const stremioUrl = `stremio://${origin.replace(/^https?:\/\//, '')}/manifest.json`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NothingP • TMDB Tiếng Việt - Stremio & Nuvio Addon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top, #132a4a 0%, #090d16 70%);
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 640px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 18px;
      padding: 32px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    }
    .badge {
      display: inline-block;
      background: rgba(1, 180, 228, 0.16);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 14px;
    }
    h1 { font-size: 26px; margin-bottom: 10px; color: #fff; }
    p.desc { color: #94a3b8; line-height: 1.6; margin-bottom: 22px; font-size: 15px; }
    .catalogs {
      background: rgba(30, 41, 59, 0.65);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .catalogs h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 10px; }
    .catalogs ul { list-style: none; display: grid; gap: 8px; font-size: 14px; color: #e2e8f0; }
    .manifest-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      color: #7dd3fc;
      word-break: break-all;
      margin-bottom: 18px;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; }
    .btn {
      flex: 1;
      min-width: 180px;
      text-align: center;
      text-decoration: none;
      padding: 13px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:hover { transform: translateY(-1px); opacity: 0.94; }
    .btn-primary { background: linear-gradient(135deg, #01b4e4, #90cea1); color: #031525; }
    .btn-secondary { background: #1e293b; color: #f8fafc; border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">TMDB Tiếng Việt (vi-VN) • v${MANIFEST.version}</span>
    <h1>${MANIFEST.name}</h1>
    <p class="desc">${MANIFEST.description}</p>
    <div class="catalogs">
      <h2>3 Danh Mục Tích Hợp</h2>
      <ul>
        <li>🎬 <strong>Phim Mới Có Bản Phát Hành (Digital Release)</strong> — Hỗ trợ lọc thể loại & tìm kiếm</li>
        <li>🔥 <strong>Trending Today - Phim Lẻ</strong> — Xu hướng phim lẻ trong ngày</li>
        <li>📺 <strong>Trending Today - Phim Bộ</strong> — Xu hướng phim bộ trong ngày</li>
      </ul>
    </div>
    <div class="manifest-box" id="manifestUrl">${manifestUrl}</div>
    <div class="actions">
      <a class="btn btn-primary" href="${stremioUrl}">Cài 1-Chạm Vào Stremio</a>
      <button class="btn btn-secondary" onclick="copyUrl(this)">Copy Manifest URL (Nuvio)</button>
    </div>
  </div>
  <script>
    function copyUrl(btn) {
      const text = document.getElementById('manifestUrl').textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Đã Copy Link Manifest!';
        setTimeout(() => btn.textContent = orig, 2000);
      });
    }
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const apiKey = env?.TMDB_API_KEY || DEFAULT_PRIMARY_KEY;

    try {
      if (pathname === '/manifest.json') {
        return jsonResponse(MANIFEST, 200, 'public, max-age=3600');
      }

      if (pathname === '/' || pathname === '/index.html') {
        const accept = request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          return new Response(renderLandingHtml(url.origin), {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=600'
            }
          });
        }
        return jsonResponse(MANIFEST, 200, 'public, max-age=3600');
      }

      const catalogMatch = pathname.match(
        /^\/catalog\/([^/]+)\/([^/.]+?)(?:\/([^/]+?))?(?:\.json)?$/
      );
      if (catalogMatch) {
        const reqCtx = createRunContext(ctx, 46);
        const cache = typeof caches !== 'undefined' ? caches.default : null;
        const routeCacheReq = cache ? new Request(url.toString(), { method: 'GET' }) : null;
        if (cache && routeCacheReq) {
          try {
            reqCtx.spend(1);
            const cachedRes = await cache.match(routeCacheReq);
            if (cachedRes) return cachedRes;
          } catch {}
        }

        const type = decodeURIComponent(catalogMatch[1]);
        const catalogId = decodeURIComponent(catalogMatch[2]);
        const extra = parseExtra(catalogMatch[3] || '');
        for (const [k, v] of url.searchParams.entries()) {
          extra[k] = v;
        }
        const metas = await getCatalog(type, catalogId, extra, apiKey, reqCtx);
        const response = jsonResponse({ metas }, 200, 'public, max-age=900, s-maxage=900');
        if (cache && routeCacheReq && reqCtx.canSpend(1)) {
          reqCtx.spend(1);
          reqCtx.waitUntil(cache.put(routeCacheReq, response.clone()));
        }
        const toPrewarm = metas
          .filter((m) => m.tmdbId && !getCachedMeta(m.type, String(m.tmdbId)))
          .slice(0, 8);
        if (toPrewarm.length > 0 && reqCtx.canSpend(2)) {
          reqCtx.waitUntil(prewarmMetas(toPrewarm, apiKey, reqCtx));
        }
        return response;
      }

      const metaMatch = pathname.match(/^\/meta\/([^/]+)\/([^/]+)\.json$/);
      if (metaMatch) {
        const reqCtx = createRunContext(ctx, 46);
        const cache = typeof caches !== 'undefined' ? caches.default : null;
        const routeCacheReq = cache ? new Request(url.toString(), { method: 'GET' }) : null;
        if (cache && routeCacheReq) {
          try {
            reqCtx.spend(1);
            const cachedRes = await cache.match(routeCacheReq);
            if (cachedRes) return cachedRes;
          } catch {}
        }

        const type = decodeURIComponent(metaMatch[1]);
        const id = decodeURIComponent(metaMatch[2]);
        const meta = await getMeta(type, id, apiKey, reqCtx);
        if (!meta) {
          return jsonResponse({ meta: null }, 404, 'no-cache');
        }
        const response = jsonResponse({ meta }, 200, 'public, max-age=1800, s-maxage=1800');
        if (cache && routeCacheReq && reqCtx.canSpend(1)) {
          reqCtx.spend(1);
          reqCtx.waitUntil(cache.put(routeCacheReq, response.clone()));
        }
        return response;
      }

      return jsonResponse({ error: 'Not Found' }, 404, 'no-cache');
    } catch (err) {
      return jsonResponse(
        { error: String(err?.message || err) },
        500,
        'no-cache'
      );
    }
  }
};
