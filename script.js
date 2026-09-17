let allShows = [];
let currentMonth = new Date();

const listView = document.getElementById("listView");
const calendarView = document.getElementById("calendarView");
const listViewBtn = document.getElementById("listViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");
const searchInput = document.getElementById("search");
const venueFilter = document.getElementById("venueFilter");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");

fetch("shows.json")
  .then((res) => res.json())
  .then((data) => {
    allShows = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    populateVenueFilter();
    renderList();
    renderCalendar();
  })
  .catch((err) => {
    listView.innerHTML = `<p class="empty-state">Couldn't load shows.json (${err.message})</p>`;
  });

function populateVenueFilter() {
  const venues = [...new Set(allShows.map((s) => s.venue))].sort();
  for (const venue of venues) {
    const option = document.createElement("option");
    option.value = venue;
    option.textContent = venue;
    venueFilter.appendChild(option);
  }
}

function getFilteredShows() {
  const query = searchInput.value.trim().toLowerCase();
  const venue = venueFilter.value;
  return allShows.filter((show) => {
    const matchesQuery =
      !query ||
      show.band.toLowerCase().includes(query) ||
      show.venue.toLowerCase().includes(query);
    const matchesVenue = !venue || show.venue === venue;
    return matchesQuery && matchesVenue;
  });
}

function renderList() {
  const shows = getFilteredShows();
  if (shows.length === 0) {
    listView.innerHTML = `<p class="empty-state">No shows match your search.</p>`;
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

      return `
        <article class="show-card">
          <div class="show-date">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          <div class="show-info">
            <h3>${show.band}</h3>
            <div class="venue">${show.venue}</div>
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

searchInput.addEventListener("input", () => {
  renderList();
  renderCalendar();
});

venueFilter.addEventListener("change", () => {
  renderList();
  renderCalendar();
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
