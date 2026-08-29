/* ============================================================
 * api.js — Open-Meteo 数据层
 * geocode : 城市名 → { latitude, longitude, timezone }
 * fetchWeather : 经纬度 → 当前天气 + 未来 5 日预报
 * ============================================================ */

/** 城市地理编码（带内存缓存，避免重复请求） */
const geoCache = new Map();

/** 城市背景图缓存 */
const bgCache = new Map();

/**
 * 获取城市背景图 URL（1920px 缩略图直链，失败返回 null）。
 * @param {string} wikiTitle 直接指定的 Wikipedia 条目名（如 "Seattle"），
 *        未提供时按 cityQuery 查 WIKI_TITLES 映射，再回退到 cityQuery 本身
 */
const BG_IMG_WIDTH = 1920;

/* ===== 中文条目名 → 英文条目名（zh.wikipedia langlinks 跨语言链接） =====
 * 中英资料库对齐的兜底通道：中文搜索的候选在 Open-Meteo en 路查不到时
 * （Open-Meteo 不认中文前缀，交叉匹配失败 → enName 为空），
 * 用 zh.wikipedia 的跨语言链接反查英文条目名再取背景图。
 * 实测：安卡拉→Ankara、伏尔加格勒→Volgograd、新西伯利亚→Novosibirsk、
 * 沈阳→（重定向沈阳市）→Shenyang。带缓存，网络失败返回 null。 */
const WIKI_ZH_API = "https://zh.wikipedia.org/w/api.php";
const langLinkCache = new Map();

async function wikiEnTitleOf(zhTitle) {
  if (langLinkCache.has(zhTitle)) return langLinkCache.get(zhTitle);
  let en = null;
  // 依次尝试原标题与剥掉行政后缀的标题（「安卡拉市」无链接，「安卡拉」有；
  // 「沈阳」靠 redirects=1 自动跳到「沈阳市」）
  const candidates = [zhTitle];
  const bare = zhTitle.replace(/(市|县|縣)$/, "");
  if (bare && bare !== zhTitle) candidates.push(bare);
  for (const t of candidates) {
    try {
      const res = await fetch(
        `${WIKI_ZH_API}?action=query&format=json&prop=langlinks` +
        `&titles=${encodeURIComponent(t)}&lllang=en&redirects=1&origin=*`
      );
      if (!res.ok) continue;
      const d = await res.json();
      const pages = (d.query && d.query.pages) || {};
      for (const p of Object.values(pages)) {
        const ll = p.langlinks && p.langlinks[0] && p.langlinks[0]["*"];
        if (ll) { en = ll; break; }
      }
      if (en) break;
    } catch { /* 网络异常 → 试下一个候选 */ }
  }
  langLinkCache.set(zhTitle, en);
  return en;
}

async function fetchCityBackground(cityQuery, wikiTitle = null) {
  // 条目名解析优先级：显式指定 > 消歧义修正 > 预置映射 > 词典(cityQuery本身可能是中文) > 原样
  let title = wikiTitle || WIKI_TITLES[cityQuery] || CITY_ZH_EN[cityQuery] || cityQuery;
  // 中文名兜底：en.wikipedia 无中文条目。词典未收录的城市（安卡拉/伏尔加格勒等）
  // 走 zh.wikipedia langlinks 反查英文条目名，对齐中英资料库后再取图
  if (/[\u4e00-\u9fff]/.test(title)) {
    title = (await wikiEnTitleOf(title)) || "";
  }
  if (!title) return null;
  if (WIKI_DISAMBIG[title]) title = WIKI_DISAMBIG[title];
  const cacheKey = `${cityQuery}|${title}`;
  if (bgCache.has(cacheKey)) return bgCache.get(cacheKey);

  let url = null;
  try {
    const res = await fetch(`${WIKI_API_BASE}/${encodeURIComponent(title)}`);
    if (res.ok) {
      const d = await res.json();
      const src = (d.originalimage && d.originalimage.source) ||
                  (d.thumbnail && d.thumbnail.source);
      if (src) {
        // 旗帜/徽章/地图类主图不算城市街景（Hong Kong/Macau 等条目主图是区旗 SVG），
        // 视为无图走渐变兜底，避免把国旗当背景
        const fn = decodeURIComponent(src.split("?")[0].split("/").pop() || "");
        if (/^(Flag|Coat_of_arms|Seal|Logo|Emblem|Map)_of|\.svg(\.png)?$/i.test(fn)) {
          url = null;
        } else if (src.includes("/thumb/")) {
          // 缩略图路径：把现成的宽度段替换为 1920px
          // /thumb/a/ab/File.jpg/3840px-File.jpg → /thumb/a/ab/File.jpg/1920px-File.jpg
          url = src.replace(/\/\d+px-([^/]+)$/, `/${BG_IMG_WIDTH}px-$1`).split("?")[0];
        } else if (src.includes("/commons/")) {
          // commons 原图（无 thumb 段）：手动构造缩略图路径省流量
          // /commons/a/ab/File.jpg → /commons/thumb/a/ab/File.jpg/1920px-File.jpg
          // 注意先去掉 ?utm 参数再匹配，否则污染文件名
          const clean = src.split("?")[0];
          const m = clean.match(/\/commons\/([^/]+\/[^/]+\/[^/]+)$/);
          url = m
            ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${BG_IMG_WIDTH}px-${m[1].split("/")[2]}`
            : clean;
        } else {
          // wikipedia/en 短链（fair-use 图，无缩略图服务），直接用原图
          url = src.split("?")[0];
        }
      }
    }
  } catch {
    url = null;
  }
  bgCache.set(cacheKey, url);
  return url;
}

/* 常用中文城市字头 → 英文名前缀（拼音对国际城市命中率不足：
 * 「东京」全拼 dongjing 命中的都是国内小地名，而英文前缀 Tok 直达東京） */
const ZH_PREFIX_MAP = {
  "北": ["Beij"], "东": ["Tok", "Don"], "西": ["Xi"], "南": ["Nan"],
  "悉": ["Syd"], "巴": ["Bar", "Bah"], "香": ["Hong"], "新": ["Sin", "Sinj"],
  "伦": ["Lon"], "首": ["Seo"], "柏": ["Ber"], "莫": ["Mos", "Mosc"],
  "迪": ["Dub"], "曼": ["Bang"], "上": ["Shang"], "京": ["Beij", "Kyoto"],
  "马": ["Mad", "Man"], "慕": ["Mun"], "罗": ["Rom"], "温": ["Ven", "Van"],
  "芝": ["Chi"], "洛": ["Los"], "多": ["Tor"], "渥": ["Ott"], "墨": ["Mex"],
  "圣": ["San", "Saint"], "布": ["Bris", "Bue"], "阿": ["Ath", "Ams"],
  "维": ["Vie"], "苏": ["Zur"], "哥": ["Cop", "Cai"], "雅": ["Athe"],
  "里": ["Lis", "Riy"], "河": ["Han"], "胡": ["Hu"], "吉": ["Kua"],
  "纽": ["New York", "New"], "紐": ["New York", "New"], "约": ["New York"],
  "舊": ["San Fr"], "港": ["Hong"], "台": ["Tai"], "第": ["Dub"], "利": ["Riy", "Lib"],
};

/**
 * 搜索联想：四路并行查询后合并去重，按人口降序优先知名城市 ——
 *   ① 原文直查（英文前缀 / 中文）
 *   ② 简体→繁体转换（Open-Meteo 中文数据混杂：西雅圖/東京只有繁体条目）
 *   ③ 中文转拼音前缀（pinyin-pro：「北」→ bei 命中北京）
 *   ④ 本地映射表展开英文前缀（「东」→ Tok 命中東京，拼音盲区兜底）
 * Open-Meteo 只支持名称前缀匹配，中文单字（如「北」）不是有效前缀，
 * 必须转换后查询；英文输入只走 ①，行为不变。
 */
async function searchCities(prefix) {
  const queries = new Set([prefix]);

  if (/[\u4e00-\u9fff]/.test(prefix)) {
    // ⓪ 词典强查询路：完整中文城市名命中 CITY_ZH_EN → 直接查英文官方名（100% 命中）
    //    「市」后缀剥离：「纽约市」「東京市」等口语写法 → 纽约/東京
    const bare = prefix.replace(/(市|省|州)$/, "");
    const en = CITY_ZH_EN[prefix] || CITY_ZH_EN[bare];
    if (en) queries.add(en);

    // ② 简转繁：opencc-js 由 CDN 引入，全局暴露 OpenCC
    if (typeof OpenCC !== "undefined") {
      try {
        const t = OpenCC.Converter({ from: "cn", to: "t" })(prefix);
        if (t && t !== prefix) {
          queries.add(t);
          const enT = CITY_ZH_EN[t]; // 繁体写法也过一遍词典（東京/華沙…）
          if (enT) queries.add(enT);
        }
      } catch { /* 转换失败忽略 */ }
    }
    // ③ 拼音路
    if (typeof pinyinPro !== "undefined") {
      const py = pinyinPro.pinyin(prefix, {
        toneType: "none", type: "array", nonZh: "consecutive",
      }).join("").toLowerCase();
      if (py) queries.add(py);
    }
    // ④ 映射路：短输入按首字展开英文前缀
    if (prefix.length <= 2) {
      const first = prefix[0];
      (ZH_PREFIX_MAP[first] || []).forEach((p) => queries.add(p));
    }
  }

  // 并行查询所有路（count 提高到 8，排序后取头部更准）
  const lists = await Promise.all([...queries].map(async (q) => {
    try {
      // zh + en 双语言并行：zh 给中文显示名，en 给英文官方名（Wikipedia 条目用）
      const [resZh, resEn] = await Promise.all([
        fetch(`${GEOCODING_API_BASE}?name=${encodeURIComponent(q)}&count=8&language=zh&format=json`),
        fetch(`${GEOCODING_API_BASE}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`),
      ]);
      if (!resZh.ok) return [];
      const dz = await resZh.json();
      const de = resEn.ok ? await resEn.json() : {};
      const enById = new Map((de.results || []).map((r) => [r.id, r.name]));
      const enPopById = new Map((de.results || []).map((r) => [r.id, r.population || 0]));
      const zhList = (dz.results || []).map((r) => ({
        name: r.name,
        enName: enById.get(r.id) || r.name, // 英文官方名（GeoNames id 跨语言一致）
        country: r.country || "",
        admin1: r.admin1 || "",
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone || "auto",
        // zh 条目人口缺失时用 en 同 id 条目补（zh 路 NYC pop=0 而 en=8804190）
        population: r.population || enPopById.get(r.id) || 0,
        flag: countryFlag(r.country_code),
      }));
      // en 结果独立成候选：zh 数据缺失时（如 NYC 的 zh 条目名是拉丁转写且 pop=0），
      // en 路的 880 万人口大城市否则会被完全丢弃。显示名优先用词典反译成中文。
      const enList = (de.results || []).map((r) => ({
        name: CITY_ZH_EN_REV[r.name] || r.name,
        enName: r.name,
        country: r.country || "",
        admin1: r.admin1 || "",
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone || "auto",
        population: r.population || 0,
        flag: countryFlag(r.country_code),
      }));
      return [...zhList, ...enList];
    } catch {
      return [];
    }
  }));

  // 合并去重（城市名+国家+经纬度识别同一条目），保持查询路顺序（原文优先）
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const it of list) {
      const key = `${it.name}|${it.country}|${it.latitude.toFixed(2)},${it.longitude.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        // enName 兜底：只有「含中文字符的 enName」才需要处理（en.wikipedia 无中文条目）。
        // 英文名等于中文显示名是正常的（如 enName="New York"），绝不能置空
        if (it.enName && /[\u4e00-\u9fff]/.test(it.enName)) {
          it.enName = CITY_ZH_EN[it.enName] || "";
        } else if (!it.enName) {
          it.enName = CITY_ZH_EN[it.name] || "";
        }
        merged.push(it);
      }
    }
  }
  // 人口降序：优先知名城市（springfield → 伊利诺伊州 17万 而非偏远小镇）
  merged.sort((a, b) => b.population - a.population);
  return merged.slice(0, 6);
}

/** ISO 国家码 → 国旗 emoji */
function countryFlag(cc) {
  if (!cc || cc.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

async function geocodeCity(query) {
  if (geoCache.has(query)) return geoCache.get(query);

  const url = `${GEOCODING_API_BASE}?name=${encodeURIComponent(query)}&count=1&language=zh&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`找不到城市：${query}`);
  }

  const r = data.results[0];
  const info = {
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone || "auto",
    name: r.name,
    country: r.country,
  };
  geoCache.set(query, info);
  return info;
}

/**
 * 拉取天气。
 * @returns {Promise<{
 *   current: { temp, feelsLike, humidity, windSpeed, pressure, code, isDay },
 *   daily: [{ date, code, max, min }],
 *   timezone: string
 * }}
 */
async function fetchWeather(lat, lon, timezone = "auto") {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone, // Open-Meteo 会按城市时区返回当地时间
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "6", // 今天 + 未来 5 天
  });

  const res = await fetch(`${WEATHER_API_BASE}?${params}`);
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const d = await res.json();

  // 城市当地时间的 UTC 偏移（秒）——供钟面/日期条跟随城市时区
  const utcOffsetSeconds = d.utc_offset_seconds ?? 0;

  const c = d.current;
  const daily = d.daily.time.map((t, i) => ({
    date: t,
    code: d.daily.weather_code[i],
    max: Math.round(d.daily.temperature_2m_max[i]),
    min: Math.round(d.daily.temperature_2m_min[i]),
  }));

  return {
    current: {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      pressure: Math.round(c.surface_pressure),
      code: c.weather_code,
      isDay: c.is_day === 1,
    },
    daily,
    timezone: d.timezone,
    utcOffsetSeconds,
  };
}

/* WMO weather code → 描述 & emoji（白天/夜晚） */
const WMO_MAP = {
  0:  { text: "晴",           day: "☀️", night: "🌙" },
  1:  { text: "基本晴",       day: "🌤️", night: "🌙" },
  2:  { text: "局部多云",     day: "⛅",  night: "☁️" },
  3:  { text: "阴",           day: "☁️", night: "☁️" },
  45: { text: "雾",           day: "🌫️", night: "🌫️" },
  48: { text: "冻雾",         day: "🌫️", night: "🌫️" },
  51: { text: "小毛毛雨",     day: "🌦️", night: "🌧️" },
  53: { text: "毛毛雨",       day: "🌦️", night: "🌧️" },
  55: { text: "大毛毛雨",     day: "🌧️", night: "🌧️" },
  56: { text: "冻毛毛雨",     day: "🌧️", night: "🌧️" },
  57: { text: "强冻毛毛雨",   day: "🌧️", night: "🌧️" },
  61: { text: "小雨",         day: "🌦️", night: "🌧️" },
  63: { text: "中雨",         day: "🌧️", night: "🌧️" },
  65: { text: "大雨",         day: "🌧️", night: "🌧️" },
  66: { text: "冻雨",         day: "🌧️", night: "🌧️" },
  67: { text: "强冻雨",       day: "🌧️", night: "🌧️" },
  71: { text: "小雪",         day: "🌨️", night: "🌨️" },
  73: { text: "中雪",         day: "🌨️", night: "🌨️" },
  75: { text: "大雪",         day: "❄️", night: "❄️" },
  77: { text: "雪粒",         day: "❄️", night: "❄️" },
  80: { text: "小阵雨",       day: "🌦️", night: "🌧️" },
  81: { text: "阵雨",         day: "🌧️", night: "🌧️" },
  82: { text: "强阵雨",       day: "⛈️", night: "⛈️" },
  85: { text: "小阵雪",       day: "🌨️", night: "🌨️" },
  86: { text: "大阵雪",       day: "❄️", night: "❄️" },
  95: { text: "雷暴",         day: "⛈️", night: "⛈️" },
  96: { text: "雷暴伴冰雹",   day: "⛈️", night: "⛈️" },
  99: { text: "强雷暴伴冰雹", day: "⛈️", night: "⛈️" },
};

/** 解析 WMO code → { text, icon, isDefault } */
function describeWeather(code, isDay = true) {
  const entry = WMO_MAP[code] || { text: "未知", day: "🌡️", night: "🌡️" };
  return {
    text: entry.text,
    icon: isDay ? entry.day : entry.night,
  };
}
