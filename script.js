let allShows = [];
let venues = {};
let currentMonth = new Date();
let userLocation = null;
let quickFilterDays = null;
let sortBy = "date";
let distanceFilterMiles = null;
let genreFilterCategory = null;

const listView = document.getElementById("listView");
const calendarView = document.getElementById("calendarView");
const listViewBtn = document.getElementById("listViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");
const searchInput = document.getElementById("search");
const venueFilter = document.getElementById("venueFilter");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const daysFilterSelect = document.getElementById("daysFilter");
const sortBySelect = document.getElementById("sortBy");
const distanceFilterSelect = document.getElementById("distanceFilter");
const locationInput = document.getElementById("locationInput");
const setLocationBtn = document.getElementById("setLocationBtn");
const locationStatus = document.getElementById("locationStatus");
const addVenueToggleBtn = document.getElementById("addVenueToggleBtn");
const addVenueForm = document.getElementById("addVenueForm");
const newVenueName = document.getElementById("newVenueName");
const newVenueAddress = document.getElementById("newVenueAddress");
const saveVenueBtn = document.getElementById("saveVenueBtn");
const cancelVenueBtn = document.getElementById("cancelVenueBtn");
const addVenueStatus = document.getElementById("addVenueStatus");
const venueSuggestions = document.getElementById("venueSuggestions");
const bandFilter = document.getElementById("bandFilter");
const addBandToggleBtn = document.getElementById("addBandToggleBtn");
const addBandForm = document.getElementById("addBandForm");
const newBandName = document.getElementById("newBandName");
const saveBandBtn = document.getElementById("saveBandBtn");
const cancelBandBtn = document.getElementById("cancelBandBtn");
const addBandStatus = document.getElementById("addBandStatus");
const refreshBtn = document.getElementById("refreshBtn");
const printBtn = document.getElementById("printBtn");
const refreshStatus = document.getElementById("refreshStatus");
const manageToggleBtn = document.getElementById("manageToggleBtn");
const manageForm = document.getElementById("manageForm");
const manageVenuesList = document.getElementById("manageVenuesList");
const manageBandsList = document.getElementById("manageBandsList");
const closeManageBtn = document.getElementById("closeManageBtn");
const manageStatus = document.getElementById("manageStatus");
const manageVenueSearch = document.getElementById("manageVenueSearch");
const manageBandSearch = document.getElementById("manageBandSearch");
const showCount = document.getElementById("showCount");
const lastUpdated = document.getElementById("lastUpdated");
const genreLegendList = document.getElementById("genreLegendList");

const IS_LOCAL_DEV = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
if (!IS_LOCAL_DEV) {
  addVenueToggleBtn.classList.add("hidden");
  addBandToggleBtn.classList.add("hidden");
  manageToggleBtn.classList.add("hidden");
  const adminFooterNote = document.getElementById("adminFooterNote");
  if (adminFooterNote) adminFooterNote.classList.add("hidden");
}

const CUSTOM_VENUES_KEY = "ithacaBandShows.customVenues";
const FOLLOWED_BANDS_KEY = "ithacaBandShows.followedBands";
const FAVORITE_BANDS_KEY = "ithacaBandShows.favoriteBands";
const BAND_GENRE_OVERRIDES_KEY = "ithacaBandShows.bandGenreOverrides";
const VENUE_ADDRESS_OVERRIDES_KEY = "ithacaBandShows.venueAddressOverrides";

function loadCustomVenues() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_VENUES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCustomVenue(name, venue) {
  const customVenues = loadCustomVenues();
  customVenues[name] = venue;
  try {
    localStorage.setItem(CUSTOM_VENUES_KEY, JSON.stringify(customVenues));
  } catch {
    // localStorage unavailable (private browsing, etc.) - venue still works for this session
  }
}

function deleteCustomVenue(name) {
  const customVenues = loadCustomVenues();
  delete customVenues[name];
  try {
    localStorage.setItem(CUSTOM_VENUES_KEY, JSON.stringify(customVenues));
  } catch {
    // localStorage unavailable
  }
  if (venueFilter.value === name) venueFilter.value = "";
}

function renameCustomVenue(oldName, newName, venueData) {
  const customVenues = loadCustomVenues();
  delete customVenues[oldName];
  customVenues[newName] = venueData;
  try {
    localStorage.setItem(CUSTOM_VENUES_KEY, JSON.stringify(customVenues));
  } catch {
    // localStorage unavailable
  }
  if (venueFilter.value === oldName) venueFilter.value = "";
}

let followedBands = [];

function loadFollowedBands() {
  try {
    return JSON.parse(localStorage.getItem(FOLLOWED_BANDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFollowedBand(name) {
  followedBands.push(name);
  try {
    localStorage.setItem(FOLLOWED_BANDS_KEY, JSON.stringify(followedBands));
  } catch {
    // localStorage unavailable (private browsing, etc.) - band still works for this session
  }
}

function deleteFollowedBand(name) {
  followedBands = followedBands.filter((b) => b !== name);
  try {
    localStorage.setItem(FOLLOWED_BANDS_KEY, JSON.stringify(followedBands));
  } catch {
    // localStorage unavailable
  }
  favoriteBands.delete(name);
  saveFavoriteBands();
  setBandGenreOverride(name, null);
  if (bandFilter.value === name) bandFilter.value = "";
}

function renameFollowedBand(oldName, newName) {
  followedBands = followedBands.map((b) => (b === oldName ? newName : b));
  try {
    localStorage.setItem(FOLLOWED_BANDS_KEY, JSON.stringify(followedBands));
  } catch {
    // localStorage unavailable
  }
  if (favoriteBands.has(oldName)) {
    favoriteBands.delete(oldName);
    favoriteBands.add(newName);
    saveFavoriteBands();
  }
  if (bandGenreOverrides[oldName]) {
    bandGenreOverrides[newName] = bandGenreOverrides[oldName];
    delete bandGenreOverrides[oldName];
    saveBandGenreOverrides();
  }
  if (bandFilter.value === oldName) bandFilter.value = "";
}

let bandGenreOverrides = {};

function loadBandGenreOverrides() {
  try {
    return JSON.parse(localStorage.getItem(BAND_GENRE_OVERRIDES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBandGenreOverrides() {
  try {
    localStorage.setItem(BAND_GENRE_OVERRIDES_KEY, JSON.stringify(bandGenreOverrides));
  } catch {
    // localStorage unavailable (private browsing, etc.) - override still works for this session
  }
}

function setBandGenreOverride(name, category) {
  if (category) {
    bandGenreOverrides[name] = category;
  } else {
    delete bandGenreOverrides[name];
  }
  saveBandGenreOverrides();
}

function getEffectiveGenreCategory(show) {
  return bandGenreOverrides[show.band] || getGenreCategory(show.genre);
}

function getEffectiveGenreLabel(show) {
  const override = bandGenreOverrides[show.band];
  return override ? GENRE_CATEGORY_LABELS[override] : show.genre;
}

let venueAddressOverrides = {};

function loadVenueAddressOverrides() {
  try {
    return JSON.parse(localStorage.getItem(VENUE_ADDRESS_OVERRIDES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveVenueAddressOverrides() {
  try {
    localStorage.setItem(VENUE_ADDRESS_OVERRIDES_KEY, JSON.stringify(venueAddressOverrides));
  } catch {
    // localStorage unavailable (private browsing, etc.) - override still works for this session
  }
}

function setVenueAddressOverride(name, venueData) {
  venueAddressOverrides[name] = venueData;
  saveVenueAddressOverrides();
}

let favoriteBands = new Set();

function loadFavoriteBands() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITE_BANDS_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveFavoriteBands() {
  try {
    localStorage.setItem(FAVORITE_BANDS_KEY, JSON.stringify([...favoriteBands]));
  } catch {
    // localStorage unavailable (private browsing, etc.) - favorites still work for this session
  }
}

function toggleFavoriteBand(name) {
  if (favoriteBands.has(name)) {
    favoriteBands.delete(name);
  } else {
    favoriteBands.add(name);
  }
  saveFavoriteBands();
}

function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const GENRE_CATEGORY_RULES = [
  [/spoken word|comedy/, "comedy"],
  [/dance/, "dance"],
  [/grateful dead|jam/, "jam"],
  [/jazz/, "jazz"],
  [/blues/, "blues"],
  [/bluegrass/, "bluegrass"],
  [/zydeco|soul|r&b|funk|hip.?hop/, "soul"],
  [/folk|americana|celtic|contra|old-time|country/, "folk"],
  [/electronic|experimental|indie/, "indie"],
  [/pop/, "pop"],
  [/rock/, "rock"],
];

function getGenreCategory(genre) {
  const lower = (genre || "").toLowerCase();
  for (const [pattern, category] of GENRE_CATEGORY_RULES) {
    if (pattern.test(lower)) return category;
  }
  return "other";
}

const GENRE_CATEGORY_LABELS = {
  comedy: "Comedy/Spoken Word",
  dance: "Dance",
  jam: "Jam Band",
  jazz: "Jazz",
  blues: "Blues",
  bluegrass: "Bluegrass",
  soul: "Soul/Funk",
  folk: "Folk/Americana",
  indie: "Indie/Electronic",
  pop: "Pop",
  rock: "Rock",
  other: "Live Music/Other",
};

function renderGenreLegend() {
  const order = [...new Set(GENRE_CATEGORY_RULES.map(([, cat]) => cat).concat("other"))].sort(
    (a, b) => GENRE_CATEGORY_LABELS[a].localeCompare(GENRE_CATEGORY_LABELS[b])
  );
  const showAllBtn = `<button type="button" class="genre-badge legend-swatch legend-swatch-all ${genreFilterCategory === null ? "legend-swatch-active" : ""}" data-category="all">Show All</button>`;
  const genreBtns = order
    .map(
      (cat) =>
        `<button type="button" class="genre-badge genre-${cat} legend-swatch ${genreFilterCategory === cat ? "legend-swatch-active" : ""}" data-category="${cat}">${GENRE_CATEGORY_LABELS[cat]}</button>`
    )
    .join("");
  genreLegendList.innerHTML = showAllBtn + genreBtns;
}

async function loadData() {
  const [showsData, venuesData, sharedFollowedBands, lastUpdatedData] = await Promise.all([
    fetch("shows.json", { cache: "no-store" }).then((res) => res.json()),
    fetch("venues.json", { cache: "no-store" }).then((res) => res.json()),
    fetch("followed-bands.json", { cache: "no-store" })
      .then((res) => res.json())
      .catch(() => []),
    fetch("last-updated.json", { cache: "no-store" })
      .then((res) => res.json())
      .catch(() => null),
  ]);
  allShows = showsData.sort((a, b) => new Date(a.date) - new Date(b.date));
  venueAddressOverrides = loadVenueAddressOverrides();
  venues = { ...venuesData, ...venueAddressOverrides, ...loadCustomVenues() };
  followedBands = [...new Set([...sharedFollowedBands, ...loadFollowedBands()])];
  favoriteBands = loadFavoriteBands();
  bandGenreOverrides = loadBandGenreOverrides();
  if (lastUpdatedData && lastUpdatedData.date) {
    const formatted = new Date(lastUpdatedData.date + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    lastUpdated.textContent = `Events last updated: ${formatted}`;
  } else if (!lastUpdated.textContent) {
    lastUpdated.textContent = "Events last updated: unknown";
  }
  populateVenueFilter();
  populateBandFilter();
  renderGenreLegend();
  renderList();
  renderCalendar();
}

const DEFAULT_LOCATION_QUERY = "14850";

loadData()
  .then(() => {
    locationInput.value = DEFAULT_LOCATION_QUERY;
    return setLocationFromInput();
  })
  .catch((err) => {
    listView.innerHTML = `<p class="empty-state">Couldn't load show data (${err.message})</p>`;
  });

// Records one hit per page load (not tied to loadData, so the Refresh button doesn't inflate
// this). No count is shown on the page - it's a private running total, checked via the URL
// documented in README.md.
fetch("https://abacus.jasoncameron.dev/hit/ithaca-live-music-mdelrosso/visits").catch(() => {
  // Visit counting is best-effort only; failures here should never affect the app itself.
});

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  refreshStatus.textContent = "Refreshing...";
  try {
    await loadData();
    const now = new Date().toLocaleTimeString();
    refreshStatus.textContent = `Updated as of ${now}.`;
  } catch (err) {
    refreshStatus.textContent = `Couldn't refresh (${err.message}).`;
  } finally {
    refreshBtn.disabled = false;
  }
});

printBtn.addEventListener("click", () => {
  if (calendarView.classList.contains("hidden")) {
    window.print();
  } else {
    listViewBtn.click();
    window.print();
  }
});

function getAllVenueNames() {
  return [...new Set([...allShows.map((s) => s.venue), ...Object.keys(venues)])].sort();
}

function getAllBandNames() {
  return [...new Set([...allShows.map((s) => s.band), ...followedBands])].sort();
}

function populateSearchSuggestions() {
  const names = [...new Set([...getAllVenueNames(), ...getAllBandNames()])].sort();
  venueSuggestions.innerHTML = names.map((name) => `<option value="${name}"></option>`).join("");
}

function populateVenueFilter() {
  const currentValue = venueFilter.value;
  const venueNames = getAllVenueNames();

  venueFilter.innerHTML = '<option value="">All venues</option>';
  for (const venue of venueNames) {
    const option = document.createElement("option");
    option.value = venue;
    option.textContent = venue;
    venueFilter.appendChild(option);
  }
  if (venueNames.includes(currentValue)) {
    venueFilter.value = currentValue;
  }

  populateSearchSuggestions();
}

function populateBandFilter() {
  const currentValue = bandFilter.value;
  const bandNames = getAllBandNames();
  const sortedBandNames = [
    ...bandNames.filter((b) => favoriteBands.has(b)),
    ...bandNames.filter((b) => !favoriteBands.has(b)),
  ];

  bandFilter.innerHTML = '<option value="">All bands/artists</option>';
  for (const band of sortedBandNames) {
    const option = document.createElement("option");
    option.value = band;
    option.textContent = favoriteBands.has(band) ? `★ ${band}` : band;
    bandFilter.appendChild(option);
  }
  if (bandNames.includes(currentValue)) {
    bandFilter.value = currentValue;
  }

  populateSearchSuggestions();
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceToShow(show) {
  if (!userLocation) return null;
  const venue = venues[show.venue];
  if (!venue) return null;
  return milesBetween(userLocation.lat, userLocation.lng, venue.lat, venue.lng);
}

function getUpcomingShowCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return allShows.filter((show) => new Date(show.date + "T00:00:00") >= today).length;
}

function getFilteredShows() {
  const query = searchInput.value.trim().toLowerCase();
  const venue = venueFilter.value;
  const band = bandFilter.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today);
  if (quickFilterDays !== null) {
    rangeEnd.setDate(rangeEnd.getDate() + quickFilterDays);
  }

  let shows = allShows.filter((show) => {
    const matchesQuery =
      !query ||
      show.band.toLowerCase().includes(query) ||
      show.venue.toLowerCase().includes(query);
    const matchesVenue = !venue || show.venue === venue;
    const matchesBand = !band || show.band.toLowerCase().includes(band.toLowerCase());
    const matchesGenre = !genreFilterCategory || getEffectiveGenreCategory(show) === genreFilterCategory;

    if (!matchesQuery || !matchesVenue || !matchesBand || !matchesGenre) return false;

    const showDate = new Date(show.date + "T00:00:00");
    if (showDate < today) return false;
    if (quickFilterDays !== null && showDate > rangeEnd) return false;

    if (distanceFilterMiles !== null) {
      const dist = distanceToShow(show);
      if (dist === null || dist > distanceFilterMiles) return false;
    }

    return true;
  });

  if (sortBy === "band") {
    shows = shows
      .slice()
      .sort((a, b) => a.band.toLowerCase().localeCompare(b.band.toLowerCase()));
  }

  shows = shows
    .map((show, index) => ({ show, index }))
    .sort((a, b) => {
      const aFav = favoriteBands.has(a.show.band) ? 0 : 1;
      const bFav = favoriteBands.has(b.show.band) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.index - b.index;
    })
    .map((entry) => entry.show);

  return shows;
}

function renderList() {
  const shows = getFilteredShows();
  showCount.textContent = `Showing ${shows.length} of ${getUpcomingShowCount()} shows`;
  if (shows.length === 0) {
    listView.innerHTML = `<p class="empty-state">No shows match your filters.</p>`;
    return;
  }

  listView.innerHTML = shows
    .map((show) => {
      const dateObj = new Date(show.date + "T00:00:00");
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("default", { month: "short" });
      const linkHtml = show.link
        ? `<a href="${show.link}" target="_blank" rel="noopener">Details</a>`
        : "";
      const dist = distanceToShow(show);
      const distHtml = dist !== null ? `<span class="distance-badge">${dist.toFixed(1)} mi</span>` : "";
      const isFavorite = favoriteBands.has(show.band);

      return `
        <article class="show-card ${isFavorite ? "favorite" : ""}">
          <div class="show-date">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          <div class="show-info">
            <h3>
              <label class="favorite-toggle" title="Mark ${escapeAttr(show.band)} as a favorite">
                <input type="checkbox" class="favorite-checkbox" data-band="${escapeAttr(show.band)}" ${isFavorite ? "checked" : ""}>
                <span aria-hidden="true">${isFavorite ? "★" : "☆"}</span>
              </label>
              ${show.band}
            </h3>
            <div class="venue">${show.venue} ${distHtml}</div>
            <div class="meta">${show.time} &middot; <span class="genre-badge genre-${getEffectiveGenreCategory(show)}">${getEffectiveGenreLabel(show)}</span> &middot; ${show.price} ${linkHtml ? "&middot; " + linkHtml : ""}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  calendarMonthLabel.textContent = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const shows = getFilteredShows();

  const showsByDay = {};
  for (const show of shows) {
    const d = new Date(show.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      (showsByDay[dayNum] = showsByDay[dayNum] || []).push(show);
    }
  }

  let cellsHtml = "";
  for (let i = 0; i < firstDay; i++) {
    cellsHtml += `<div class="calendar-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayShows = showsByDay[day] || [];
    const showsHtml = dayShows
      .map(
        (s) =>
          `<div class="cell-show genre-${getEffectiveGenreCategory(s)}" title="${s.band} @ ${s.venue} (${getEffectiveGenreLabel(s)})">${s.band}</div>`
      )
      .join("");
    cellsHtml += `
      <div class="calendar-cell">
        <div class="cell-day">${day}</div>
        ${showsHtml}
      </div>
    `;
  }

  calendarGrid.innerHTML = cellsHtml;
}

function refresh() {
  renderList();
  renderCalendar();
}

searchInput.addEventListener("input", refresh);
venueFilter.addEventListener("change", () => {
  if (venueFilter.value === "") searchInput.value = "";
  refresh();
});
bandFilter.addEventListener("change", () => {
  if (bandFilter.value === "") searchInput.value = "";
  refresh();
});

listView.addEventListener("change", (e) => {
  if (e.target.classList.contains("favorite-checkbox")) {
    toggleFavoriteBand(e.target.dataset.band);
    populateBandFilter();
    refresh();
  }
});

listViewBtn.addEventListener("click", () => {
  listViewBtn.classList.add("active");
  calendarViewBtn.classList.remove("active");
  listView.classList.remove("hidden");
  calendarView.classList.add("hidden");
});

calendarViewBtn.addEventListener("click", () => {
  calendarViewBtn.classList.add("active");
  listViewBtn.classList.remove("active");
  calendarView.classList.remove("hidden");
  listView.classList.add("hidden");
});

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

daysFilterSelect.addEventListener("change", () => {
  quickFilterDays = daysFilterSelect.value === "all" ? null : parseInt(daysFilterSelect.value, 10);
  if (quickFilterDays !== null) {
    listViewBtn.click();
  }
  refresh();
});

sortBySelect.addEventListener("change", () => {
  sortBy = sortBySelect.value;
  refresh();
});

distanceFilterSelect.addEventListener("change", () => {
  distanceFilterMiles =
    distanceFilterSelect.value === "any" ? null : parseInt(distanceFilterSelect.value, 10);
  if (distanceFilterMiles !== null && !userLocation) {
    locationStatus.textContent = "Enter a zip code, town, or address first to filter by distance.";
  }
  refresh();
});

async function geocode(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
    encodeURIComponent(query);
  const res = await fetch(url);
  const results = await res.json();
  if (!results.length) return null;
  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

async function setLocationFromInput() {
  const query = locationInput.value.trim();
  if (!query) {
    locationStatus.textContent = "Type a zip code, town, or address first.";
    return;
  }

  locationStatus.textContent = "Looking up that location...";
  try {
    const result = await geocode(query);
    if (!result) {
      locationStatus.textContent = `Couldn't find "${query}". Try a more specific town, zip code, or address.`;
      return;
    }

    userLocation = { lat: result.lat, lng: result.lng };
    locationStatus.textContent = `Location set to ${result.displayName}.`;
    refresh();
  } catch (err) {
    locationStatus.textContent = `Couldn't look up that location (${err.message}).`;
  }
}

setLocationBtn.addEventListener("click", setLocationFromInput);
locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setLocationFromInput();
});

addVenueToggleBtn.addEventListener("click", () => {
  addVenueForm.classList.toggle("hidden");
  addVenueStatus.textContent = "";
});

cancelVenueBtn.addEventListener("click", () => {
  addVenueForm.classList.add("hidden");
  newVenueName.value = "";
  newVenueAddress.value = "";
  addVenueStatus.textContent = "";
});

async function saveNewVenue() {
  const name = newVenueName.value.trim();
  const address = newVenueAddress.value.trim();

  if (!name || !address) {
    addVenueStatus.textContent = "Enter both a venue name and an address, town, or zip code.";
    return;
  }
  if (venues[name]) {
    addVenueStatus.textContent = `"${name}" is already in the venue list.`;
    return;
  }

  addVenueStatus.textContent = "Looking up that address...";
  try {
    const result = await geocode(address);
    if (!result) {
      addVenueStatus.textContent = `Couldn't find "${address}". Try a more specific address.`;
      return;
    }

    const venue = { address: result.displayName, lat: result.lat, lng: result.lng };
    venues[name] = venue;
    saveCustomVenue(name, venue);
    populateVenueFilter();

    newVenueName.value = "";
    newVenueAddress.value = "";
    addVenueStatus.textContent = `Added "${name}". Add another, or click Cancel when done.`;
    newVenueName.focus();
    refresh();
  } catch (err) {
    addVenueStatus.textContent = `Couldn't look up that address (${err.message}).`;
  }
}

saveVenueBtn.addEventListener("click", saveNewVenue);
newVenueAddress.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveNewVenue();
});

addBandToggleBtn.addEventListener("click", () => {
  addBandForm.classList.toggle("hidden");
  addBandStatus.textContent = "";
});

cancelBandBtn.addEventListener("click", () => {
  addBandForm.classList.add("hidden");
  newBandName.value = "";
  addBandStatus.textContent = "";
});

function saveNewBand() {
  const name = newBandName.value.trim();

  if (!name) {
    addBandStatus.textContent = "Enter a band or artist name.";
    return;
  }
  if (getAllBandNames().includes(name)) {
    addBandStatus.textContent = `"${name}" is already in the band list.`;
    return;
  }

  saveFollowedBand(name);
  populateBandFilter();

  newBandName.value = "";
  addBandStatus.textContent = `Added "${name}". Add another, or click Cancel when done.`;
  newBandName.focus();
  refresh();
}

saveBandBtn.addEventListener("click", saveNewBand);
newBandName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveNewBand();
});

let manageVenueMode = {}; // name -> "editing" | "editingAddress" | "confirmDelete"
let manageBandMode = {};
let manageVenueFilterText = "";
let manageBandFilterText = "";

function genreSelectOptionsHtml(selectedCategory) {
  const categories = Object.keys(GENRE_CATEGORY_LABELS).sort((a, b) =>
    GENRE_CATEGORY_LABELS[a].localeCompare(GENRE_CATEGORY_LABELS[b])
  );
  const defaultOption = `<option value=""${selectedCategory ? "" : " selected"}>— Use show's genre —</option>`;
  const categoryOptions = categories
    .map(
      (cat) =>
        `<option value="${cat}"${selectedCategory === cat ? " selected" : ""}>${GENRE_CATEGORY_LABELS[cat]}</option>`
    )
    .join("");
  return defaultOption + categoryOptions;
}

function renderManagePanel() {
  const customVenues = loadCustomVenues();
  const allVenueNames = Object.keys(venues)
    .filter((name) => name.toLowerCase().includes(manageVenueFilterText.toLowerCase()))
    .sort();

  manageVenuesList.innerHTML = allVenueNames.length
    ? allVenueNames
        .map((name) => {
          const v = venues[name];
          const isCustom = Object.prototype.hasOwnProperty.call(customVenues, name);
          const hasAddressOverride = Object.prototype.hasOwnProperty.call(
            venueAddressOverrides,
            name
          );
          const mode = manageVenueMode[name];

          if (mode === "editing") {
            return `
              <div class="manage-row manage-row-editing" data-name="${escapeAttr(name)}">
                <div class="manage-edit-fields">
                  <input type="text" class="manage-edit-name" value="${escapeAttr(name)}" placeholder="Venue name">
                  <input type="text" class="manage-edit-address" value="${escapeAttr(v.address)}" placeholder="Address, town, or zip code">
                </div>
                <div class="manage-row-actions">
                  <button class="manage-save-edit-btn">Save</button>
                  <button class="manage-cancel-edit-btn">Cancel</button>
                </div>
              </div>
            `;
          }
          if (mode === "editingAddress") {
            return `
              <div class="manage-row manage-row-editing" data-name="${escapeAttr(name)}">
                <strong>${name}</strong>
                <div class="manage-edit-fields">
                  <input type="text" class="manage-edit-address" value="${escapeAttr(v.address)}" placeholder="Address, town, or zip code">
                </div>
                <div class="manage-row-actions">
                  <button class="manage-save-address-btn">Save</button>
                  <button class="manage-cancel-edit-btn">Cancel</button>
                </div>
              </div>
            `;
          }
          if (mode === "confirmDelete") {
            return `
              <div class="manage-row manage-row-confirm" data-name="${escapeAttr(name)}">
                <div class="manage-row-info"><strong>Delete "${name}"?</strong></div>
                <div class="manage-row-actions">
                  <button class="manage-confirm-delete-btn">Yes, Delete</button>
                  <button class="manage-cancel-delete-btn">Cancel</button>
                </div>
              </div>
            `;
          }
          return `
            <div class="manage-row" data-name="${escapeAttr(name)}">
              <div class="manage-row-info">
                <strong>${name}</strong>
                <span class="manage-row-address">${v.address}</span>
              </div>
              <div class="manage-row-actions">
                ${
                  isCustom
                    ? `<button class="manage-rename-btn">Rename / Fix Address</button>
                       <button class="manage-delete-btn">Delete</button>`
                    : `<button class="manage-fix-address-btn">Fix Address</button>
                       ${hasAddressOverride ? '<button class="manage-reset-address-btn">Reset Address</button>' : ""}`
                }
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="empty-state">No venues match that search.</p>';

  const localFollowed = loadFollowedBands();
  const allBandNames = getAllBandNames()
    .filter((name) => name.toLowerCase().includes(manageBandFilterText.toLowerCase()))
    .sort();

  manageBandsList.innerHTML = allBandNames.length
    ? allBandNames
        .map((name) => {
          const isFollowedLocal = localFollowed.includes(name);
          const mode = manageBandMode[name];

          if (mode === "editing") {
            return `
              <div class="manage-row manage-row-editing" data-name="${escapeAttr(name)}">
                <div class="manage-edit-fields">
                  <input type="text" class="manage-edit-name" value="${escapeAttr(name)}" placeholder="Band/artist name">
                </div>
                <div class="manage-row-actions">
                  <button class="manage-save-edit-btn">Save</button>
                  <button class="manage-cancel-edit-btn">Cancel</button>
                </div>
              </div>
            `;
          }
          if (mode === "confirmDelete") {
            return `
              <div class="manage-row manage-row-confirm" data-name="${escapeAttr(name)}">
                <div class="manage-row-info"><strong>Stop following "${name}"?</strong></div>
                <div class="manage-row-actions">
                  <button class="manage-confirm-delete-btn">Yes, Delete</button>
                  <button class="manage-cancel-delete-btn">Cancel</button>
                </div>
              </div>
            `;
          }
          return `
            <div class="manage-row" data-name="${escapeAttr(name)}">
              <div class="manage-row-info"><strong>${name}</strong></div>
              <select class="manage-genre-select" data-name="${escapeAttr(name)}">
                ${genreSelectOptionsHtml(bandGenreOverrides[name])}
              </select>
              <div class="manage-row-actions">
                ${
                  isFollowedLocal
                    ? `<button class="manage-rename-btn">Rename</button>
                       <button class="manage-delete-btn">Delete</button>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="empty-state">No bands match that search.</p>';
}

manageToggleBtn.addEventListener("click", () => {
  manageForm.classList.toggle("hidden");
  if (!manageForm.classList.contains("hidden")) {
    manageVenueMode = {};
    manageBandMode = {};
    manageVenueFilterText = "";
    manageBandFilterText = "";
    manageVenueSearch.value = "";
    manageBandSearch.value = "";
    manageStatus.textContent = "";
    renderManagePanel();
  }
});

manageVenueSearch.addEventListener("input", () => {
  manageVenueFilterText = manageVenueSearch.value.trim();
  renderManagePanel();
});

manageBandSearch.addEventListener("input", () => {
  manageBandFilterText = manageBandSearch.value.trim();
  renderManagePanel();
});

closeManageBtn.addEventListener("click", () => {
  manageForm.classList.add("hidden");
});

genreLegendList.addEventListener("click", (e) => {
  const swatch = e.target.closest(".legend-swatch");
  if (!swatch) return;
  const category = swatch.dataset.category;
  genreFilterCategory =
    category === "all" ? null : genreFilterCategory === category ? null : category;
  renderGenreLegend();
  renderList();
  renderCalendar();
});

manageVenuesList.addEventListener("click", async (e) => {
  const row = e.target.closest(".manage-row");
  if (!row) return;
  const name = row.dataset.name;

  if (e.target.classList.contains("manage-delete-btn")) {
    manageVenueMode = { [name]: "confirmDelete" };
    renderManagePanel();
  } else if (e.target.classList.contains("manage-cancel-delete-btn")) {
    delete manageVenueMode[name];
    renderManagePanel();
  } else if (e.target.classList.contains("manage-confirm-delete-btn")) {
    delete manageVenueMode[name];
    deleteCustomVenue(name);
    manageStatus.textContent = `Deleted "${name}".`;
    await loadData();
    renderManagePanel();
  } else if (e.target.classList.contains("manage-rename-btn")) {
    manageVenueMode = { [name]: "editing" };
    renderManagePanel();
  } else if (e.target.classList.contains("manage-cancel-edit-btn")) {
    delete manageVenueMode[name];
    renderManagePanel();
  } else if (e.target.classList.contains("manage-save-edit-btn")) {
    const newName = row.querySelector(".manage-edit-name").value.trim();
    const newAddress = row.querySelector(".manage-edit-address").value.trim();
    if (!newName || !newAddress) {
      manageStatus.textContent = "Enter both a venue name and an address, town, or zip code.";
      return;
    }

    const customVenues = loadCustomVenues();
    const current = customVenues[name];
    let venueData = current;
    if (newAddress !== current.address) {
      e.target.disabled = true;
      e.target.textContent = "Looking up...";
      const result = await geocode(newAddress);
      if (!result) {
        manageStatus.textContent = `Couldn't find "${newAddress}". Kept the previous location for now - try again with a more specific address.`;
        e.target.disabled = false;
        e.target.textContent = "Save";
        return;
      }
      venueData = { address: result.displayName, lat: result.lat, lng: result.lng };
    }

    delete manageVenueMode[name];
    renameCustomVenue(name, newName, venueData);
    manageStatus.textContent = newName === name ? `Updated "${name}".` : `Renamed "${name}" to "${newName}".`;
    await loadData();
    renderManagePanel();
  } else if (e.target.classList.contains("manage-fix-address-btn")) {
    manageVenueMode = { [name]: "editingAddress" };
    renderManagePanel();
  } else if (e.target.classList.contains("manage-reset-address-btn")) {
    delete venueAddressOverrides[name];
    saveVenueAddressOverrides();
    manageStatus.textContent = `Reset "${name}" back to its original address.`;
    await loadData();
    renderManagePanel();
  } else if (e.target.classList.contains("manage-save-address-btn")) {
    const newAddress = row.querySelector(".manage-edit-address").value.trim();
    if (!newAddress) {
      manageStatus.textContent = "Enter an address, town, or zip code.";
      return;
    }
    e.target.disabled = true;
    e.target.textContent = "Looking up...";
    const result = await geocode(newAddress);
    if (!result) {
      manageStatus.textContent = `Couldn't find "${newAddress}". Try a more specific address.`;
      e.target.disabled = false;
      e.target.textContent = "Save";
      return;
    }
    setVenueAddressOverride(name, { address: result.displayName, lat: result.lat, lng: result.lng });
    delete manageVenueMode[name];
    manageStatus.textContent = `Updated the address for "${name}" (this browser only).`;
    await loadData();
    renderManagePanel();
  }
});

manageBandsList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("manage-genre-select")) return;
  const name = e.target.dataset.name;
  setBandGenreOverride(name, e.target.value || null);
  renderList();
  renderCalendar();
  manageStatus.textContent = e.target.value
    ? `"${name}" will now show as ${GENRE_CATEGORY_LABELS[e.target.value]} (this browser only).`
    : `"${name}" will use each show's own genre again.`;
});

manageBandsList.addEventListener("click", async (e) => {
  const row = e.target.closest(".manage-row");
  if (!row) return;
  const name = row.dataset.name;

  if (e.target.classList.contains("manage-delete-btn")) {
    manageBandMode = { [name]: "confirmDelete" };
    renderManagePanel();
  } else if (e.target.classList.contains("manage-cancel-delete-btn")) {
    delete manageBandMode[name];
    renderManagePanel();
  } else if (e.target.classList.contains("manage-confirm-delete-btn")) {
    delete manageBandMode[name];
    deleteFollowedBand(name);
    manageStatus.textContent = `Stopped following "${name}".`;
    await loadData();
    renderManagePanel();
  } else if (e.target.classList.contains("manage-rename-btn")) {
    manageBandMode = { [name]: "editing" };
    renderManagePanel();
  } else if (e.target.classList.contains("manage-cancel-edit-btn")) {
    delete manageBandMode[name];
    renderManagePanel();
  } else if (e.target.classList.contains("manage-save-edit-btn")) {
    const newName = row.querySelector(".manage-edit-name").value.trim();
    if (!newName) {
      manageStatus.textContent = "Enter a band or artist name.";
      return;
    }

    delete manageBandMode[name];
    if (newName !== name) {
      renameFollowedBand(name, newName);
      manageStatus.textContent = `Renamed "${name}" to "${newName}".`;
    } else {
      manageStatus.textContent = "";
    }
    await loadData();
    renderManagePanel();
  }
});
