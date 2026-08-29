/* ============================================================
 * app.js — 应用入口
 * 职责：装配时钟（跟随城市时区）、拉取天气、城市切换、
 *       搜索任意城市（带联想预测）
 * ============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  let currentCity = null;
  let searchTimer = null;     // 搜索防抖
  let cityOffsetMs = null;    // 城市相对 UTC 的偏移（毫秒）；null = 用本机时区

  /* ---------- 时间：跟随城市时区 ---------- */
  function cityNow() {
    const localOffsetMs = -new Date().getTimezoneOffset() * 60000; // 本机相对 UTC
    const offset = cityOffsetMs === null ? localOffsetMs : cityOffsetMs;
    // 结果：一个"本地字段恰好等于城市墙钟时间"的 Date
    return new Date(Date.now() + offset - localOffsetMs);
  }

  /* ---------- 翻页时钟 ---------- */
  function startClock() {
    FlipClock.init($("flipclock"));

    const tick = () => {
      const now = cityNow();
      const pad = (n) => String(n).padStart(2, "0");
      FlipClock.update(`${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`);

      // 日期条（跟随时区的年月日星期）
      $("dateYear").textContent = `${now.getFullYear()}年`;
      $("dateMonth").textContent = `${now.getMonth() + 1}月`;
      $("dateDay").textContent = `${now.getDate()}日`;
      $("dateWeek").textContent = "星期" + "日一二三四五六"[now.getDay()];
    };
    tick();
    setInterval(tick, CLOCK_TICK_MS);
  }

  /* ---------- 天气加载 ---------- */
  let bgLoadedForCity = null; // 已成功加载背景图的城市，避免刷新重复拉取

  async function loadWeather(city, geoOverride = null, opts = {}) {
    const { refreshBg = true } = opts;
    $("cityFlag").textContent = city.flag;
    $("cityName").textContent = "加载中…";
    $("cityCountry").textContent = "";

    try {
      const geo = geoOverride || (await geocodeCity(city.query));
      const data = await fetchWeather(geo.latitude, geo.longitude, geo.timezone);

      currentCity = city;
      // 城市相对 UTC 的偏移（毫秒）—— 供翻页时钟/日期条显示城市墙钟时间
      cityOffsetMs = data.utcOffsetSeconds * 1000;

      $("cityName").textContent = city.name;
      $("cityCountry").textContent = geo.country || city.country || "";
      WeatherCard.render(data, city);
      const fxName = BGAnimate.getModeName ? BGAnimate.getModeName() : "";
      $("statusBar").textContent =
        `${data.timezone} · 背景动画: ${fxName} · 数据源 Open-Meteo · 更新于 ${new Date().toLocaleTimeString("zh-CN")}`;

      // 城市背景图：仅切换城市时加载；定时刷新跳过（图已显示）
      if (refreshBg || bgLoadedForCity !== city.id) {
        loadCityBackground(city.query, city.wikiTitle);
      }
    } catch (err) {
      console.error(err);
      $("cityName").textContent = city.name;
      $("weatherDesc").textContent = `天气加载失败：${err.message}`;
      $("statusBar").textContent = "网络异常 · 请检查连接后点 ⟳ 或重新搜索";
    }
  }

  /* ---------- 城市背景图（Wikipedia，预加载成功才切换） ---------- */
  let bgRequestId = 0; // 防止快速切换城市时旧图晚到覆盖新图

  async function loadCityBackground(cityQuery, wikiTitle = null) {
    const photo = $("bgPhoto");
    const reqId = ++bgRequestId;

    const url = await fetchCityBackground(cityQuery, wikiTitle);
    if (reqId !== bgRequestId) return; // 已切换到别的城市，丢弃

    if (!url) {
      photo.classList.remove("show"); // 无图 → 露出渐变兜底
      return;
    }

    // Image 预加载：加载完成才淡入，避免闪现半张图；8s 超时降级渐变
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = ""; // 中止加载
      if (reqId === bgRequestId) photo.classList.remove("show");
    }, 8000);
    const done = () => clearTimeout(timer);

    img.onload = () => {
      done();
      if (reqId !== bgRequestId) return;
      photo.style.backgroundImage = `url("${url}")`;
      photo.classList.add("show");
      bgLoadedForCity = currentCity ? currentCity.id : null;
    };
    img.onerror = () => {
      done();
      if (reqId !== bgRequestId) return;
      photo.classList.remove("show");
    };
    img.src = url;
  }

  /* ---------- 城市下拉（预置列表） ---------- */
  function populateCitySelect() {
    const sel = $("citySelect");
    sel.innerHTML = "";
    CITIES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.flag} ${c.name}`;
      sel.appendChild(opt);
    });

    const saved = localStorage.getItem(LS_CITY_KEY);
    sel.value = saved && CITIES.some((c) => c.id === saved) ? saved : CITIES[0].id;

    sel.addEventListener("change", () => {
      localStorage.setItem(LS_CITY_KEY, sel.value);
      const city = CITIES.find((c) => c.id === sel.value);
      hideSuggestions();
      loadWeather(city);
    });
  }

  /* ---------- 搜索任意城市（联想预测） ---------- */
  const suggBox = () => $("searchSuggest");

  function hideSuggestions() {
    suggBox().innerHTML = "";
    suggBox().classList.remove("show");
  }

  function showSuggestions(items) {
    const box = suggBox();
    box.innerHTML = "";
    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "suggest-item";
      const region = [it.admin1, it.country].filter(Boolean).join(" · ");
      div.innerHTML = `<span class="s-flag">${it.flag}</span>
        <span class="s-name">${it.name}</span>
        <span class="s-region">${region}</span>`;
      div.addEventListener("click", () => {
        hideSuggestions();
        $("searchInput").value = "";
        // 把搜索到的城市临时加入下拉并选中
        const sel = $("citySelect");
        const tempId = "custom_" + Date.now();
        const opt = document.createElement("option");
        opt.value = tempId;
        opt.textContent = `${it.flag} ${it.name}`;
        sel.appendChild(opt);
        sel.value = tempId;
        localStorage.setItem(LS_CITY_KEY, tempId);
        // wikiTitle: 用英文官方名查 Wikipedia 背景（繁体/中文名在 en.wikipedia 常无条目）
        loadWeather(
          { id: tempId, name: it.name, query: it.name, flag: it.flag, wikiTitle: it.enName },
          it
        );
      });
      box.appendChild(div);
    });
    box.classList.add("show");
  }

  function bindSearch() {
    const input = $("searchInput");

    input.addEventListener("input", () => {
      const q = input.value.trim();
      clearTimeout(searchTimer);
      if (q.length < 1) { hideSuggestions(); return; }
      searchTimer = setTimeout(async () => {
        try {
          const items = await searchCities(q);
          items.length ? showSuggestions(items) : hideSuggestions();
        } catch {
          hideSuggestions();
        }
      }, 250); // 250ms 防抖
    });

    // 失焦收起（点击候选项由 mousedown 先触发）
    input.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideSuggestions();
    });
  }

  /* ---------- 初始化 ---------- */
  function boot() {
    startClock();
    populateCitySelect();
    bindSearch();
    BGAnimate.setCanvas($("bgFx"));

    $("refreshBtn").addEventListener("click", () => {
      if (currentCity) loadWeather(currentCity);
    });

    const savedId = localStorage.getItem(LS_CITY_KEY);
    const first = CITIES.find((c) => c.id === savedId) || CITIES[0];
    loadWeather(first);

    setInterval(() => {
      if (currentCity) loadWeather(currentCity, null, { refreshBg: false }); // 定时刷新不重拉背景图
    }, WEATHER_REFRESH_MS);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
