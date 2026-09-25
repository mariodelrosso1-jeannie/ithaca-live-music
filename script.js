let allShows = [];
let venues = {};
let currentMonth = new Date();
let userLocation = null;
let quickFilterDays = null;
let sortBy = "date";
let distanceFilterMiles = null;

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
const showCount = document.getElementById("showCount");
const lastUpdated = document.getElementById("lastUpdated");

const CUSTOM_VENUES_KEY = "ithacaBandShows.customVenues";
const FOLLOWED_BANDS_KEY = "ithacaBandShows.followedBands";
const FAVORITE_BANDS_KEY = "ithacaBandShows.favoriteBands";

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
  if (bandFilter.value === oldName) bandFilter.value = "";
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
  venues = { ...venuesData, ...loadCustomVenues() };
  followedBands = [...new Set([...sharedFollowedBands, ...loadFollowedBands()])];
  favoriteBands = loadFavoriteBands();
  if (lastUpdatedData && lastUpdatedData.date) {
    const formatted = new Date(lastUpdatedData.date + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    lastUpdated.textContent = `Events last updated: ${formatted}`;
  }
  populateVenueFilter();
  populateBandFilter();
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

    if (!matchesQuery || !matchesVenue || !matchesBand) return false;

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
  showCount.textContent = `Showing ${shows.length} of ${allShows.length} shows`;
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
            <div class="meta">${show.time} &middot; ${show.genre} &middot; ${show.price} ${linkHtml ? "&middot; " + linkHtml : ""}</div>
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
      .map((s) => `<div class="cell-show" title="${s.band} @ ${s.venue}">${s.band}</div>`)
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
venueFilter.addEventListener("change", refresh);
bandFilter.addEventListener("change", refresh);

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

let manageVenueMode = {}; // name -> "editing" | "confirmDelete"
let manageBandMode = {};

function renderManagePanel() {
  const customVenues = loadCustomVenues();
  const venueNames = Object.keys(customVenues).sort();

  manageVenuesList.innerHTML = venueNames.length
    ? venueNames
        .map((name) => {
          const v = customVenues[name];
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
                <button class="manage-rename-btn">Rename / Fix Address</button>
                <button class="manage-delete-btn">Delete</button>
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="empty-state">No custom venues added yet.</p>';

  const bandNames = [...loadFollowedBands()].sort();
  manageBandsList.innerHTML = bandNames.length
    ? bandNames
        .map((name) => {
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
              <div class="manage-row-actions">
                <button class="manage-rename-btn">Rename</button>
                <button class="manage-delete-btn">Delete</button>
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="empty-state">No followed bands added yet.</p>';
}

manageToggleBtn.addEventListener("click", () => {
  manageForm.classList.toggle("hidden");
  if (!manageForm.classList.contains("hidden")) {
    manageVenueMode = {};
    manageBandMode = {};
    manageStatus.textContent = "";
    renderManagePanel();
  }
});

closeManageBtn.addEventListener("click", () => {
  manageForm.classList.add("hidden");
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
  }
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
