let allShows = [];
let venues = {};
let currentMonth = new Date();
let userLocation = null;
let quickFilterDays = null;
let sortBy = "date";

const listView = document.getElementById("listView");
const calendarView = document.getElementById("calendarView");
const listViewBtn = document.getElementById("listViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");
const searchInput = document.getElementById("search");
const venueFilter = document.getElementById("venueFilter");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const quickFilterAllBtn = document.getElementById("quickFilterAll");
const daysFilterSelect = document.getElementById("daysFilter");
const sortBySelect = document.getElementById("sortBy");
const locateBtn = document.getElementById("locateBtn");
const locationStatus = document.getElementById("locationStatus");

Promise.all([
  fetch("shows.json").then((res) => res.json()),
  fetch("venues.json").then((res) => res.json()),
])
  .then(([showsData, venuesData]) => {
    allShows = showsData.sort((a, b) => new Date(a.date) - new Date(b.date));
    venues = venuesData;
    populateVenueFilter();
    renderList();
    renderCalendar();
  })
  .catch((err) => {
    listView.innerHTML = `<p class="empty-state">Couldn't load show data (${err.message})</p>`;
  });

function populateVenueFilter() {
  const venueNames = [...new Set(allShows.map((s) => s.venue))].sort();
  for (const venue of venueNames) {
    const option = document.createElement("option");
    option.value = venue;
    option.textContent = venue;
    venueFilter.appendChild(option);
  }
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

    if (!matchesQuery || !matchesVenue) return false;

    if (quickFilterDays !== null) {
      const showDate = new Date(show.date + "T00:00:00");
      if (showDate < today || showDate > rangeEnd) return false;
    }

    return true;
  });

  if (sortBy === "distance" && userLocation) {
    shows = shows
      .map((show) => ({ show, dist: distanceToShow(show) }))
      .sort((a, b) => {
        if (a.dist === null) return 1;
        if (b.dist === null) return -1;
        return a.dist - b.dist;
      })
      .map((entry) => entry.show);
  }

  return shows;
}

function renderList() {
  const shows = getFilteredShows();
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

      return `
        <article class="show-card">
          <div class="show-date">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          <div class="show-info">
            <h3>${show.band}</h3>
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

quickFilterAllBtn.addEventListener("click", () => {
  quickFilterDays = null;
  daysFilterSelect.value = "";
  quickFilterAllBtn.classList.add("active");
  refresh();
});

daysFilterSelect.addEventListener("change", () => {
  if (!daysFilterSelect.value) {
    quickFilterDays = null;
    quickFilterAllBtn.classList.add("active");
    refresh();
    return;
  }
  quickFilterDays = parseInt(daysFilterSelect.value, 10);
  quickFilterAllBtn.classList.remove("active");
  listViewBtn.click();
  refresh();
});

sortBySelect.addEventListener("change", () => {
  sortBy = sortBySelect.value;
  if (sortBy === "distance" && !userLocation) {
    locationStatus.textContent = "Click \"Use My Location\" first to sort by distance.";
  }
  refresh();
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Geolocation isn't supported by your browser.";
    return;
  }
  locationStatus.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locationStatus.textContent = "Location found. Distances now shown.";
      refresh();
    },
    (err) => {
      locationStatus.textContent = `Couldn't get your location (${err.message}).`;
    }
  );
});
