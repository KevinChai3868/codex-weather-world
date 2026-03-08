// ===============================
// DOM 元件
// ===============================
const dom = {
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  loadingBox: document.getElementById("loadingBox"),
  loadingText: document.getElementById("loadingText"),
  statusMessage: document.getElementById("statusMessage"),
  mapHint: document.getElementById("mapHint"),
  initialCard: document.getElementById("initialCard"),
  recentList: document.getElementById("recentList"),
  compareCityInput: document.getElementById("compareCityInput"),
  compareAddBtn: document.getElementById("compareAddBtn"),
  compareRefreshBtn: document.getElementById("compareRefreshBtn"),
  compareStatus: document.getElementById("compareStatus"),
  compareGrid: document.getElementById("compareGrid"),
  addCurrentToCompareBtn: document.getElementById("addCurrentToCompareBtn"),
  resultsCard: document.getElementById("resultsCard"),
  cityResults: document.getElementById("cityResults"),
  currentWeatherCard: document.getElementById("currentWeatherCard"),
  forecastCard: document.getElementById("forecastCard"),
  currentIcon: document.getElementById("currentIcon"),
  currentDesc: document.getElementById("currentDesc"),
  currentCityTitle: document.getElementById("currentCityTitle"),
  metaCity: document.getElementById("metaCity"),
  metaCountry: document.getElementById("metaCountry"),
  metaAdmin: document.getElementById("metaAdmin"),
  metaTime: document.getElementById("metaTime"),
  metaTimezone: document.getElementById("metaTimezone"),
  metaCoord: document.getElementById("metaCoord"),
  currentTemp: document.getElementById("currentTemp"),
  currentFeelsLike: document.getElementById("currentFeelsLike"),
  currentWind: document.getElementById("currentWind"),
  currentHumidity: document.getElementById("currentHumidity"),
  forecastList: document.getElementById("forecastList"),
};

// ===============================
// 狀態管理
// ===============================
const STORAGE_KEYS = {
  RECENT_CITIES: "recent_weather_cities_v2",
  COMPARE_CITIES: "compare_weather_cities_v2",
  THEME: "weather_theme_mode",
};

const MAX_RECENT = 5;
const MAX_COMPARE = 5;

const defaultCompareCities = [
  { name: "Taipei", country: "臺灣", latitude: 25.03, longitude: 121.57, timezone: "Asia/Taipei" },
  { name: "Tokyo", country: "日本", latitude: 35.68, longitude: 139.76, timezone: "Asia/Tokyo" },
  { name: "London", country: "英國", latitude: 51.51, longitude: -0.13, timezone: "Europe/London" },
  { name: "New York", country: "美國", latitude: 40.71, longitude: -74.01, timezone: "America/New_York" },
];

const state = {
  recentCities: [],
  compareCities: [],
  selectedCity: null,
  isLoading: false,
  map: null,
  marker: null,
};

function setStatus(message = "") {
  dom.statusMessage.textContent = message;
}

function setMapHint(message = "") {
  dom.mapHint.textContent = message;
}

function setLoading(isLoading, message = "讀取中...") {
  state.isLoading = isLoading;
  dom.searchBtn.disabled = isLoading;
  dom.locationBtn.disabled = isLoading;

  if (isLoading) {
    dom.loadingText.textContent = message;
    dom.loadingBox.classList.remove("hidden");
  } else {
    dom.loadingBox.classList.add("hidden");
  }
}

function normalizeCity(city) {
  return {
    key: `${city.name || "未知城市"}-${city.country || "未知國家"}-${Number(city.latitude).toFixed(2)}-${Number(city.longitude).toFixed(2)}`,
    name: city.name || "未知城市",
    country: city.country || "未知國家",
    admin1: city.admin1 || "",
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    timezone: city.timezone || "auto",
  };
}

function loadRecentCities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_CITIES);
    const parsed = raw ? JSON.parse(raw) : [];
    state.recentCities = Array.isArray(parsed) ? parsed.map((city) => normalizeCity(city)) : [];
  } catch (error) {
    state.recentCities = [];
  }
}

function saveRecentCities() {
  localStorage.setItem(STORAGE_KEYS.RECENT_CITIES, JSON.stringify(state.recentCities.slice(0, MAX_RECENT)));
}

function pushRecentCity(city) {
  const normalized = normalizeCity(city);
  state.recentCities = state.recentCities.filter((item) => item.key !== normalized.key);
  state.recentCities.unshift(normalized);
  state.recentCities = state.recentCities.slice(0, MAX_RECENT);
  saveRecentCities();
}

function loadCompareCitiesState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPARE_CITIES);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length) {
      state.compareCities = parsed.map((city) => normalizeCity(city)).slice(0, MAX_COMPARE);
      return;
    }
  } catch (error) {
    // 若資料格式有誤則回退預設值
  }
  state.compareCities = defaultCompareCities.map((city) => normalizeCity(city));
}

function saveCompareCitiesState() {
  localStorage.setItem(STORAGE_KEYS.COMPARE_CITIES, JSON.stringify(state.compareCities.slice(0, MAX_COMPARE)));
}

function upsertCompareCity(city) {
  const normalized = normalizeCity(city);
  state.compareCities = state.compareCities.filter((item) => item.key !== normalized.key);
  state.compareCities.unshift(normalized);
  state.compareCities = state.compareCities.slice(0, MAX_COMPARE);
  saveCompareCitiesState();
}

function removeCompareCity(cityKey) {
  state.compareCities = state.compareCities.filter((city) => city.key !== cityKey);
  if (!state.compareCities.length) {
    state.compareCities = defaultCompareCities.map((city) => normalizeCity(city));
  }
  saveCompareCitiesState();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  dom.themeToggleBtn.textContent = isDark ? "切換淺色模式" : "切換深色模式";
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  applyTheme(nextTheme);
}

// ===============================
// 資料轉換
// ===============================
const weatherCodeMap = {
  0: { text: "晴朗", emoji: "☀️" },
  1: { text: "大致晴朗", emoji: "⛅" },
  2: { text: "局部多雲", emoji: "⛅" },
  3: { text: "陰天", emoji: "☁️" },
  45: { text: "霧", emoji: "🌫️" },
  48: { text: "霧凇", emoji: "🌫️" },
  51: { text: "毛毛雨（弱）", emoji: "🌦️" },
  53: { text: "毛毛雨（中）", emoji: "🌦️" },
  55: { text: "毛毛雨（強）", emoji: "🌧️" },
  56: { text: "凍毛毛雨（弱）", emoji: "🌧️" },
  57: { text: "凍毛毛雨（強）", emoji: "🌧️" },
  61: { text: "小雨", emoji: "🌧️" },
  63: { text: "中雨", emoji: "🌧️" },
  65: { text: "大雨", emoji: "🌧️" },
  66: { text: "凍雨（弱）", emoji: "🌧️" },
  67: { text: "凍雨（強）", emoji: "🌧️" },
  71: { text: "小雪", emoji: "❄️" },
  73: { text: "中雪", emoji: "❄️" },
  75: { text: "大雪", emoji: "❄️" },
  77: { text: "雪粒", emoji: "❄️" },
  80: { text: "陣雨（弱）", emoji: "🌦️" },
  81: { text: "陣雨（中）", emoji: "🌧️" },
  82: { text: "陣雨（強）", emoji: "🌧️" },
  85: { text: "陣雪（弱）", emoji: "❄️" },
  86: { text: "陣雪（強）", emoji: "❄️" },
  95: { text: "雷雨", emoji: "⛈️" },
  96: { text: "雷雨伴隨小冰雹", emoji: "⛈️" },
  99: { text: "雷雨伴隨大冰雹", emoji: "⛈️" },
};

function weatherInfoFromCode(code) {
  return weatherCodeMap[code] || { text: "未知天氣", emoji: "🌡️" };
}

function formatWeekday(dateStr) {
  return new Intl.DateTimeFormat("zh-TW", { weekday: "long" }).format(new Date(dateStr));
}

function formatLocalTime(isoLocalString) {
  if (!isoLocalString) return "--";
  return isoLocalString.replace("T", " ");
}

function formatCoord(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") return "--";
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

// ===============================
// API 函式
// ===============================
async function fetchJson(url, errorPrefix) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${errorPrefix}（HTTP ${response.status}）`);
  }
  return response.json();
}

async function searchCities(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=zh&format=json`;
  const data = await fetchJson(url, "城市搜尋失敗");
  return data.results || [];
}

async function reverseGeocode(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=zh&format=json`;
  const data = await fetchJson(url, "反向地理查詢失敗");
  return (data.results && data.results[0]) || null;
}

async function fetchWeather(lat, lon, timezone = "auto") {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(timezone)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7`;
  return fetchJson(url, "天氣資料取得失敗");
}

// ===============================
// 地圖功能
// ===============================
function setMapMarker(lat, lon, label = "") {
  if (!state.map || !window.L) return;

  if (!state.marker) {
    state.marker = window.L.marker([lat, lon]).addTo(state.map);
  } else {
    state.marker.setLatLng([lat, lon]);
  }

  if (label) {
    state.marker.bindPopup(label);
  }
}

function focusMap(lat, lon, label = "") {
  if (!state.map) return;
  state.map.flyTo([lat, lon], 8, { duration: 0.6 });
  setMapMarker(lat, lon, label);
}

async function handleMapClick(lat, lon) {
  try {
    setStatus("");
    setLoading(true, "查詢地圖位置天氣中...");

    let cityInfo = null;
    try {
      cityInfo = await reverseGeocode(lat, lon);
    } catch (error) {
      cityInfo = null;
    }

    const city = normalizeCity({
      name: cityInfo?.name || "地圖選取位置",
      country: cityInfo?.country || "未知國家",
      admin1: cityInfo?.admin1 || "",
      latitude: lat,
      longitude: lon,
      timezone: cityInfo?.timezone || "auto",
    });

    await queryWeatherByCity(city, { saveRecent: true, updateMap: true });
    setMapHint(`已選擇座標：${formatCoord(lat, lon)}`);
  } catch (error) {
    setStatus(`地圖查詢失敗：${error.message}`);
  } finally {
    setLoading(false);
  }
}

function initMap() {
  if (!window.L) {
    setMapHint("地圖資源載入失敗，請重新整理頁面。");
    return;
  }

  state.map = window.L.map("worldMap", { worldCopyJump: true }).setView([20, 0], 2);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(state.map);

  state.map.on("click", (event) => {
    handleMapClick(event.latlng.lat, event.latlng.lng);
  });
}

// ===============================
// 畫面渲染
// ===============================
function clearElementChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function createTextElement(tagName, text, className = "") {
  const node = document.createElement(tagName);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderInitialPrompt(show) {
  dom.initialCard.classList.toggle("hidden", !show);
}

function renderRecentCities() {
  clearElementChildren(dom.recentList);

  if (!state.recentCities.length) {
    dom.recentList.appendChild(createTextElement("p", "尚無查詢紀錄", "empty-text"));
    return;
  }

  state.recentCities.forEach((city) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip-btn";
    btn.textContent = `${city.name}（${city.country}）`;
    btn.addEventListener("click", () => {
      queryWeatherByCity(city);
    });
    dom.recentList.appendChild(btn);
  });
}

function renderCityCandidates(cities) {
  clearElementChildren(dom.cityResults);
  dom.resultsCard.classList.remove("hidden");

  if (!cities.length) {
    const item = document.createElement("li");
    item.className = "empty-text";
    item.textContent = "查無結果，請改用英文、完整地名，或嘗試附近大城市。";
    dom.cityResults.appendChild(item);
    return;
  }

  cities.forEach((rawCity) => {
    const city = normalizeCity(rawCity);
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${city.name}${city.admin1 ? `, ${city.admin1}` : ""}, ${city.country}`;
    btn.addEventListener("click", () => {
      queryWeatherByCity(city);
    });
    li.appendChild(btn);
    dom.cityResults.appendChild(li);
  });
}

function setLocationMeta(city, weatherData) {
  dom.metaCity.textContent = city.name || "--";
  dom.metaCountry.textContent = city.country || "--";
  dom.metaAdmin.textContent = city.admin1 || "無";
  dom.metaTime.textContent = formatLocalTime(weatherData.current?.time);
  dom.metaTimezone.textContent = weatherData.timezone || city.timezone || "--";
  dom.metaCoord.textContent = formatCoord(Number(city.latitude), Number(city.longitude));
}

function renderForecast(dailyData) {
  clearElementChildren(dom.forecastList);
  const days = dailyData.time || [];

  days.forEach((dateStr, index) => {
    const info = weatherInfoFromCode(dailyData.weather_code?.[index]);
    const max = Math.round(dailyData.temperature_2m_max?.[index] ?? 0);
    const min = Math.round(dailyData.temperature_2m_min?.[index] ?? 0);

    const card = document.createElement("article");
    card.className = "forecast-item";
    card.appendChild(createTextElement("p", dateStr));
    card.appendChild(createTextElement("p", formatWeekday(dateStr)));
    card.appendChild(createTextElement("p", info.emoji, "forecast-icon"));
    card.appendChild(createTextElement("p", info.text));
    card.appendChild(createTextElement("p", `最高溫：${max}°C`));
    card.appendChild(createTextElement("p", `最低溫：${min}°C`));

    dom.forecastList.appendChild(card);
  });
}

function renderCurrentWeather(city, weatherData) {
  const current = weatherData.current || {};
  const info = weatherInfoFromCode(current.weather_code);

  state.selectedCity = city;
  renderInitialPrompt(false);

  dom.currentWeatherCard.classList.remove("hidden");
  dom.forecastCard.classList.remove("hidden");

  dom.currentIcon.textContent = info.emoji;
  dom.currentDesc.textContent = info.text;
  dom.currentCityTitle.textContent = `${city.name} · ${city.country}`;
  dom.currentTemp.textContent = `${Math.round(current.temperature_2m ?? 0)}°C`;
  dom.currentFeelsLike.textContent = `${Math.round(current.apparent_temperature ?? 0)}°C`;
  dom.currentHumidity.textContent = `${Math.round(current.relative_humidity_2m ?? 0)}%`;
  dom.currentWind.textContent = `${Math.round(current.wind_speed_10m ?? 0)} km/h`;

  setLocationMeta(city, weatherData);
  renderForecast(weatherData.daily || {});
}

function renderComparePlaceholder(message) {
  clearElementChildren(dom.compareGrid);
  dom.compareStatus.textContent = message;
}

function createCompareCard(city, weatherData) {
  const current = weatherData.current || {};
  const daily = weatherData.daily || {};
  const info = weatherInfoFromCode(current.weather_code);
  const tMax = Math.round(daily.temperature_2m_max?.[0] ?? 0);
  const tMin = Math.round(daily.temperature_2m_min?.[0] ?? 0);

  const card = document.createElement("article");
  card.className = "compare-item";

  const head = document.createElement("div");
  head.className = "compare-head";
  head.appendChild(createTextElement("h3", city.name));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "compare-remove-btn";
  removeBtn.textContent = "移除";
  removeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    removeCompareCity(city.key);
    loadCompareWeather().catch(() => {
      dom.compareStatus.textContent = "比較資料載入失敗，請稍後重試。";
    });
  });

  head.appendChild(removeBtn);
  card.appendChild(head);
  card.appendChild(createTextElement("p", city.country, "compare-country"));

  const main = document.createElement("div");
  main.className = "compare-main";
  main.appendChild(createTextElement("p", info.emoji, "forecast-icon"));
  main.appendChild(createTextElement("p", `${Math.round(current.temperature_2m ?? 0)}°C`, "compare-temp"));
  card.appendChild(main);

  card.appendChild(createTextElement("p", `最高溫 / 最低溫：${tMax}°C / ${tMin}°C`, "compare-range"));
  card.appendChild(createTextElement("p", `天氣狀態：${info.text}`, "compare-desc"));

  card.addEventListener("click", () => {
    queryWeatherByCity(city);
  });

  return card;
}

async function loadCompareWeather() {
  renderComparePlaceholder("載入比較城市天氣中...");

  const results = await Promise.allSettled(
    state.compareCities.map(async (city) => {
      const weather = await fetchWeather(city.latitude, city.longitude, city.timezone);
      return { city, weather };
    }),
  );

  clearElementChildren(dom.compareGrid);

  let successCount = 0;
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      successCount += 1;
      dom.compareGrid.appendChild(createCompareCard(result.value.city, result.value.weather));
    }
  });

  if (successCount === 0) {
    dom.compareStatus.textContent = "比較資料載入失敗，請稍後重試。";
    return;
  }

  if (successCount < state.compareCities.length) {
    dom.compareStatus.textContent = "部分比較城市載入失敗，可重新整理比較。";
    return;
  }

  dom.compareStatus.textContent = `已載入 ${successCount} 個比較城市（上限 ${MAX_COMPARE} 個）。`;
}

// ===============================
// 事件與流程
// ===============================
async function queryWeatherByCity(rawCity, options = {}) {
  const city = normalizeCity(rawCity);

  try {
    setStatus("");
    setLoading(true, "讀取天氣資料中...");
    const weatherData = await fetchWeather(city.latitude, city.longitude, city.timezone || "auto");
    renderCurrentWeather(city, weatherData);

    if (options.saveRecent !== false) {
      pushRecentCity(city);
      renderRecentCities();
    }

    if (options.updateMap !== false) {
      focusMap(city.latitude, city.longitude, `${city.name}, ${city.country}`);
    }
  } catch (error) {
    setStatus(`查詢失敗：${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function handleCitySearch() {
  const query = dom.cityInput.value.trim();
  if (!query) {
    setStatus("請先輸入城市名稱。");
    dom.resultsCard.classList.add("hidden");
    return;
  }

  try {
    setStatus("");
    setLoading(true, "搜尋城市中...");
    const cities = await searchCities(query);
    renderCityCandidates(cities);
    if (!cities.length) {
      setStatus("查無城市，請嘗試輸入英文名稱或加入州/國家。");
    }
  } catch (error) {
    dom.resultsCard.classList.add("hidden");
    setStatus(`API 錯誤：${error.message}，請稍後再試。`);
  } finally {
    setLoading(false);
  }
}

async function handleCompareCityAdd() {
  const query = dom.compareCityInput.value.trim();
  if (!query) {
    dom.compareStatus.textContent = "請先輸入要加入比較的城市名稱。";
    return;
  }

  try {
    dom.compareStatus.textContent = "搜尋比較城市中...";
    const cities = await searchCities(query);
    if (!cities.length) {
      dom.compareStatus.textContent = "找不到可加入比較的城市，請換個關鍵字。";
      return;
    }

    upsertCompareCity(cities[0]);
    dom.compareCityInput.value = "";
    await loadCompareWeather();
  } catch (error) {
    dom.compareStatus.textContent = `加入比較城市失敗：${error.message}`;
  }
}

function getUserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("此瀏覽器不支援定位功能"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

async function handleUseLocation() {
  try {
    setStatus("");
    setLoading(true, "取得你的位置中...");

    const position = await getUserPosition();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    let cityInfo = null;
    try {
      cityInfo = await reverseGeocode(lat, lon);
    } catch (error) {
      cityInfo = null;
    }

    const city = normalizeCity({
      name: cityInfo?.name || "目前位置",
      country: cityInfo?.country || "未知國家",
      admin1: cityInfo?.admin1 || "",
      latitude: lat,
      longitude: lon,
      timezone: cityInfo?.timezone || "auto",
    });

    await queryWeatherByCity(city);
  } catch (error) {
    if (error.code === 1) {
      setStatus("你已拒絕定位授權，請允許定位或改用城市名稱搜尋。");
    } else {
      setStatus(`無法使用定位：${error.message}`);
    }
  } finally {
    setLoading(false);
  }
}

async function handleAddCurrentToCompare() {
  if (!state.selectedCity) {
    setStatus("目前尚未選擇城市，請先查詢任一城市。");
    return;
  }

  upsertCompareCity(state.selectedCity);
  await loadCompareWeather();
  dom.compareStatus.textContent = `已加入「${state.selectedCity.name}」到比較清單。`;
}

function bindEvents() {
  dom.searchBtn.addEventListener("click", handleCitySearch);
  dom.cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleCitySearch();
    }
  });

  dom.locationBtn.addEventListener("click", handleUseLocation);
  dom.themeToggleBtn.addEventListener("click", toggleTheme);
  dom.addCurrentToCompareBtn.addEventListener("click", handleAddCurrentToCompare);

  dom.compareRefreshBtn.addEventListener("click", () => {
    loadCompareWeather().catch(() => {
      dom.compareStatus.textContent = "比較資料載入失敗，請稍後重試。";
    });
  });

  dom.compareAddBtn.addEventListener("click", handleCompareCityAdd);
  dom.compareCityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleCompareCityAdd();
    }
  });
}

function init() {
  loadTheme();
  loadRecentCities();
  loadCompareCitiesState();
  renderRecentCities();
  renderInitialPrompt(true);
  initMap();
  bindEvents();

  loadCompareWeather().catch(() => {
    dom.compareStatus.textContent = "比較資料載入失敗，請稍後重試。";
  });
}

init();
