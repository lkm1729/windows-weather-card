/* ============================================================
 * weather.js — 天气卡片渲染 + 昼夜主题
 * 白天：马卡龙色透明毛玻璃；夜晚：深色毛玻璃
 * ============================================================ */

const WeatherCard = (() => {
  const $ = (id) => document.getElementById(id);

  /** 主渲染入口 */
  function render(data, cityMeta) {
    const cur = data.current;
    const desc = describeWeather(cur.code, cur.isDay);

    // 主区
    $("weatherIcon").textContent = desc.icon;
    $("weatherTemp").textContent = cur.temp;
    $("weatherDesc").textContent = desc.text;

    // 元数据
    $("metaFeels").textContent = `${cur.feelsLike}°`;
    $("metaHumidity").textContent = `${cur.humidity}%`;
    $("metaWind").textContent = `${cur.windSpeed} km/h`;
    $("metaPressure").textContent = `${cur.pressure} hPa`;

    // 未来 5 日（跳过今天）
    const row = $("forecastRow");
    row.innerHTML = "";
    const upcoming = data.daily.slice(1, 6);
    const weekNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    upcoming.forEach((day) => {
      const dt = new Date(day.date + "T00:00:00");
      const icon = describeWeather(day.code, true).icon;
      const item = document.createElement("div");
      item.className = "forecast-item";
      item.innerHTML = `
        <div class="forecast-day">${weekNames[dt.getDay()]}</div>
        <div class="forecast-icon">${icon}</div>
        <div class="forecast-temps">
          <span class="max">${day.max}°</span><span class="min">${day.min}°</span>
        </div>
      `;
      row.appendChild(item);
    });

    // 主题 + 背景 + 动画
    applyTheme(cur.isDay);
    applyBackground(cur.code, cur.isDay);
    // 注意：顶层 const 声明不会挂到 window 上，必须直接引用 BGAnimate
    if (typeof BGAnimate !== "undefined") BGAnimate.start(cur.code, cur.isDay);
  }

  /* ---------- 昼夜主题：body.day / body.night 切换 CSS 变量 ---------- */
  function applyTheme(isDay) {
    document.body.classList.toggle("day", isDay);
    document.body.classList.toggle("night", !isDay);
  }

  /** 背景渐变（马卡龙 / 深色）随昼夜和天气切换 */
  function applyBackground(code, isDay) {
    const bg = document.getElementById("bgLayer");
    let grad;

    if (isDay) {
      // 马卡龙色系：粉 / 薄荷 / 奶油 / 淡紫
      if (code === 0 || code === 1) {
        grad = "linear-gradient(160deg, #ffd9e8 0%, #fff3d6 45%, #d4f0f7 100%)"; // 晴：粉→奶油→浅蓝
      } else if (code >= 51 && code <= 86) {
        grad = "linear-gradient(160deg, #c9d6e8 0%, #e8d9f0 50%, #d6e6f0 100%)"; // 雨雪：灰紫→淡紫
      } else if (code >= 95) {
        grad = "linear-gradient(160deg, #d8c9e8 0%, #c9d2e8 50%, #e8d0d0 100%)"; // 雷暴：紫灰粉
      } else {
        grad = "linear-gradient(160deg, #ffe9d9 0%, #ffd9e8 50%, #d9f0e8 100%)"; // 多云：橙粉薄荷
      }
    } else {
      // 夜晚深色系
      if (code === 0 || code === 1) {
        grad = "linear-gradient(160deg, #0f1b3d 0%, #1c2a55 55%, #101830 100%)"; // 晴夜：深蓝星空
      } else if (code >= 51 && code <= 86) {
        grad = "linear-gradient(160deg, #1a2233 0%, #2a3450 50%, #161d2e 100%)"; // 雨雪夜
      } else if (code >= 95) {
        grad = "linear-gradient(160deg, #241a33 0%, #332650 50%, #1a1428 100%)"; // 雷暴夜：暗紫
      } else {
        grad = "linear-gradient(160deg, #131c30 0%, #22304e 50%, #121828 100%)"; // 多云夜
      }
    }

    bg.style.background = grad;
  }

  return { render, applyBackground, applyTheme };
})();
