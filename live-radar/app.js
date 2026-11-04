/* ---------------- Saved state (this device only) ---------------- */

function load(key, fallback) {
  try {
    const raw = localStorage.getItem("radar." + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem("radar." + key, JSON.stringify(value));
  } catch {
    // storage full or blocked; the app still works for this session
  }
}

const settings = load("settings", { keys: {}, includeLocal: true, radius: 50, days: 30 });
let place = load("place", null); // { lat, lng, label }
const followed = load("followed", { artists: [], venues: [] });
let results = load("results", null); // { shows, scannedAt, sourceStatus, radius, place }

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- Matching helpers ---------------- */

// "The Dart Brothers!" -> "dartbrothers"; used to spot the same artist/venue across sources.
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

function namesMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return short.length >= 5 && long.includes(short);
}

function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sameVenue(a, b) {
  if (a.lat != null && b.lat != null && milesBetween(a.lat, a.lng, b.lat, b.lng) < 0.15) return true;
  for (const k of ["tm", "sg", "jb"]) if (a.ids[k] && a.ids[k] === b.ids[k]) return true;
  return namesMatch(a.name, b.name);
}

function sameArtist(a, b) {
  if (namesMatch(a.artist, b.artist)) return true;
  return a.lineup.some((x) => b.lineup.some((y) => namesMatch(x, y)));
}

/* ---------------- Merging shows from every source ---------------- */

function mergeInto(target, show) {
  if (!target.sources.some((s) => s.name === show.source)) {
    target.sources.push({ name: show.source, url: show.url });
  }
  for (const name of show.lineup) {
    if (!target.lineup.some((n) => namesMatch(n, name))) target.lineup.push(name);
  }
  for (const a of show.artistIds || []) {
    const existing = target.artistIds.find((x) => namesMatch(x.name, a.name));
    if (existing) Object.assign(existing, { ...a, name: existing.name });
    else target.artistIds.push({ ...a });
  }
  target.venue.ids = { ...show.venue.ids, ...target.venue.ids };
  if (target.venue.lat == null && show.venue.lat != null) {
    target.venue.lat = show.venue.lat;
    target.venue.lng = show.venue.lng;
  }
  if (!target.venue.city) target.venue.city = show.venue.city;
  for (const k of ["time", "price", "genre"]) if (!target[k] && show[k]) target[k] = show[k];
}

function mergeShows(raw, ctx) {
  const today = isoDate(ctx.start);
  const last = isoDate(ctx.end);
  const byDate = new Map();

  for (const show of raw) {
    if (!show.date || show.date < today || show.date > last) continue;
    if (show.venue.lat != null) {
      show.distance = milesBetween(ctx.lat, ctx.lng, show.venue.lat, show.venue.lng);
      if (show.distance > ctx.radius) continue; // tour dates for followed artists can be anywhere
    } else if (show.source === "Bandsintown" || show.source === "Ithaca calendar") {
      continue; // can't confirm these are within range
    }
    if (!show.lineup.length) show.lineup = [show.artist];

    const list = byDate.get(show.date) || [];
    const match = list.find((s) => sameArtist(s, show) && sameVenue(s.venue, show.venue));
    if (match) {
      mergeInto(match, show);
    } else {
      list.push({
        ...show,
        lineup: [...show.lineup],
        artistIds: (show.artistIds || []).map((a) => ({ ...a })),
        venue: { ...show.venue, ids: { ...show.venue.ids } },
        sources: [{ name: show.source, url: show.url }],
      });
      byDate.set(show.date, list);
    }
  }

  const merged = [...byDate.values()].flat();
  for (const s of merged) {
    if (s.venue.lat != null) s.distance = milesBetween(ctx.lat, ctx.lng, s.venue.lat, s.venue.lng);
    delete s.source;
    delete s.url;
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date) || timeValue(a.time) - timeValue(b.time));
}

function timeValue(t) {
  const m = String(t || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 9999;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

/* ---------------- Venue and artist indexes built from the shows ---------------- */

function buildVenues(shows) {
  const venues = [];
  for (const s of shows) {
    let v = venues.find((x) => sameVenue(x, s.venue));
    if (!v) {
      v = { ...s.venue, ids: { ...s.venue.ids }, count: 0, next: s.date, distance: s.distance };
      venues.push(v);
    }
    v.ids = { ...s.venue.ids, ...v.ids };
    v.count++;
  }
  return venues.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildArtists(shows) {
  const map = new Map();
  for (const s of shows) {
    for (const name of s.lineup) {
      const key = norm(name);
      if (!key) continue;
      const a = map.get(key) || { name, ids: {}, count: 0, next: s.date };
      const idInfo = s.artistIds.find((x) => namesMatch(x.name, name));
      if (idInfo) for (const k of ["tm", "sg", "jb"]) if (idInfo[k] && !a.ids[k]) a.ids[k] = idInfo[k];
      a.count++;
      map.set(key, a);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/* ---------------- Following ---------------- */

function isFollowedArtistName(name) {
  return followed.artists.some((a) => namesMatch(a.name, name));
}

function isFollowedVenue(venue) {
  return followed.venues.some((f) => sameVenue({ ...f, ids: f.ids || {} }, venue));
}

function showIsFollowed(s) {
  return s.lineup.some(isFollowedArtistName) || isFollowedVenue(s.venue);
}

function toggleArtist(artist) {
  const i = followed.artists.findIndex((a) => namesMatch(a.name, artist.name));
  if (i >= 0) followed.artists.splice(i, 1);
  else followed.artists.push({ name: artist.name, ids: artist.ids || {} });
  save("followed", followed);
  renderAll();
}

function toggleVenue(venue) {
  const i = followed.venues.findIndex((f) => sameVenue({ ...f, ids: f.ids || {} }, venue));
  if (i >= 0) followed.venues.splice(i, 1);
  else followed.venues.push({ name: venue.name, city: venue.city, lat: venue.lat, lng: venue.lng, ids: venue.ids || {} });
  save("followed", followed);
  renderAll();
}

// A venue typed in by name: look it up on Ticketmaster/SeatGeek near the set location so
// scans can query it by ID.
async function resolveVenue(name) {
  const venue = { name, ids: {}, lat: null, lng: null, city: "" };
  if (!place) return venue;
  const keys = settings.keys;
  if (keys.ticketmaster) {
    try {
      const p = new URLSearchParams({ apikey: keys.ticketmaster, keyword: name, latlong: place.lat + "," + place.lng, radius: String(settings.radius), unit: "miles", size: "5" });
      const data = await fetchJSON("https://app.ticketmaster.com/discovery/v2/venues.json?" + p);
      const v = data._embedded && data._embedded.venues && data._embedded.venues[0];
      if (v) {
        venue.ids.tm = v.id;
        venue.name = v.name;
        venue.lat = num(v.location && v.location.latitude);
        venue.lng = num(v.location && v.location.longitude);
        venue.city = [v.city && v.city.name, v.state && v.state.stateCode].filter(Boolean).join(", ");
      }
    } catch { /* fall through to other sources */ }
  }
  if (keys.seatgeek) {
    try {
      const p = new URLSearchParams({ client_id: keys.seatgeek, q: name, lat: String(place.lat), lon: String(place.lng), range: settings.radius + "mi", per_page: "5" });
      const data = await fetchJSON("https://api.seatgeek.com/2/venues?" + p);
      const v = (data.venues || [])[0];
      if (v) {
        venue.ids.sg = v.id;
        if (venue.lat == null) {
          venue.lat = num(v.location && v.location.lat);
          venue.lng = num(v.location && v.location.lon);
          venue.city = [v.city, v.state].filter(Boolean).join(", ");
        }
      }
    } catch { /* keep what we have */ }
  }
  return venue;
}

/* ---------------- Location ---------------- */

async function geocode(query) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=us&q=" + encodeURIComponent(query);
  const results = await fetchJSON(url);
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), label: placeLabel(results[0]) };
}

function placeLabel(r) {
  const a = r.address || {};
  const town = a.city || a.town || a.village || a.hamlet || a.suburb || a.county;
  const label = [town, [a.state, a.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return label || r.display_name.split(",").slice(0, 2).join(",");
}

function setPlace(p) {
  place = p;
  save("place", place);
  $("locationInput").value = "";
  $("locationInput").placeholder = place.label;
  $("locationStatus").textContent = "📍 " + place.label;
}

async function setLocationFromInput() {
  const q = $("locationInput").value.trim();
  if (!q) {
    $("locationStatus").textContent = "Type a zip code, town, or address.";
    return;
  }
  $("locationStatus").textContent = "Finding " + q + "…";
  try {
    const p = await geocode(q);
    if (!p) {
      $("locationStatus").textContent = "Couldn't find \"" + q + "\". Try a zip code.";
      return;
    }
    setPlace(p);
    scan();
  } catch (err) {
    $("locationStatus").textContent = "Location lookup failed: " + err.message;
  }
}

function useGps() {
  if (!navigator.geolocation) {
    $("locationStatus").textContent = "This device can't share its location; type a zip code instead.";
    return;
  }
  $("locationStatus").textContent = "Getting your location…";
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    let label = lat.toFixed(3) + ", " + lng.toFixed(3);
    try {
      const r = await fetchJSON("https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=10&lat=" + lat + "&lon=" + lng);
      if (r && r.address) label = placeLabel(r);
    } catch { /* coordinates are fine as a label */ }
    setPlace({ lat, lng, label });
    scan();
  }, (err) => {
    $("locationStatus").textContent = "Couldn't get your location (" + err.message + "). Type a zip code instead.";
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
}

/* ---------------- Scanning every source ---------------- */

let scanning = false;

async function runSource(src, ctx, status) {
  const out = [];
  const errors = [];
  const attempt = async (fn) => {
    try {
      out.push(...(await fn()));
    } catch (err) {
      errors.push(err.message);
    }
  };
  if (!src.followOnly) await attempt(() => src.area(ctx));
  for (const a of followed.artists) await attempt(() => src.artist(ctx, a));
  for (const v of followed.venues) await attempt(() => src.venue(ctx, v));

  if (errors.length && !out.length) status[src.id] = { state: "error", text: errors[0] };
  else status[src.id] = { state: "ok", text: out.length + " found" + (errors.length ? " (some lookups failed)" : "") };
  renderSourceStatus(status);
  return out;
}

async function scan() {
  if (scanning) return;
  if (!place) {
    $("locationStatus").textContent = "Set a location first.";
    return;
  }
  scanning = true;
  $("scanBtn").disabled = true;
  $("scanBtn").textContent = "Scanning…";

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + settings.days);
  end.setHours(23, 59, 59, 0);
  const ctx = { lat: place.lat, lng: place.lng, radius: settings.radius, keys: settings.keys, start, end };

  const status = {};
  const active = [];
  for (const src of SOURCES) {
    if (src.id === "local" && !settings.includeLocal) continue;
    if (src.keyName && !settings.keys[src.keyName]) {
      status[src.id] = { state: "off", text: "no key" };
      continue;
    }
    if (src.followOnly && !followed.artists.length) {
      status[src.id] = { state: "off", text: "follow artists to use" };
      continue;
    }
    status[src.id] = { state: "busy", text: "searching…" };
    active.push(src);
  }
  renderSourceStatus(status);

  const raw = (await Promise.all(active.map((src) => runSource(src, ctx, status)))).flat();
  const shows = mergeShows(raw, ctx);

  results = { shows, scannedAt: new Date().toISOString(), sourceStatus: status, radius: ctx.radius, days: settings.days, place };
  save("results", results);

  scanning = false;
  $("scanBtn").disabled = false;
  $("scanBtn").textContent = "Scan";
  if (!active.some((s) => s.keyName)) {
    $("locationStatus").textContent = "📍 " + place.label + " · add API keys in ⚙ to search the big listing sites";
  } else {
    $("locationStatus").textContent = "📍 " + place.label;
  }
  renderAll();
}

/* ---------------- Rendering ---------------- */

function renderSourceStatus(status) {
  $("sourceStatus").innerHTML = SOURCES.filter((s) => status[s.id]).map((s) => {
    const st = status[s.id];
    return '<span class="chip chip-' + st.state + '" title="' + escapeHtml(st.text) + '">' +
      escapeHtml(s.label) + ": " + escapeHtml(st.text) + "</span>";
  }).join("");
}

function formatDateHeading(iso) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const label = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  if (diff === 0) return "Tonight · " + label;
  if (diff === 1) return "Tomorrow · " + label;
  return label;
}

function miles(d) {
  return d == null ? "" : (d < 10 ? d.toFixed(1) : Math.round(d)) + " mi";
}

function currentShows() {
  if (!results) return [];
  const q = $("showSearch").value.trim().toLowerCase();
  const onlyFollowing = $("onlyFollowing").checked;
  let list = results.shows.filter((s) => {
    if (onlyFollowing && !showIsFollowed(s)) return false;
    if (!q) return true;
    return (s.lineup.join(" ") + " " + s.venue.name + " " + s.venue.city + " " + s.genre).toLowerCase().includes(q);
  });
  if ($("sortShows").value === "distance") {
    list = [...list].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999) || a.date.localeCompare(b.date));
  }
  return list;
}

function renderShows() {
  const el = $("showList");
  if (!results) {
    el.innerHTML = '<p class="empty">Set your location and tap <b>Scan</b>.</p>';
    $("showCount").textContent = "";
    return;
  }
  const list = currentShows();
  const when = new Date(results.scannedAt);
  $("showCount").textContent = list.length + " of " + results.shows.length + " shows within " + results.radius +
    " mi · scanned " + when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (!list.length) {
    el.innerHTML = '<p class="empty">No shows match.</p>';
    return;
  }

  const byDistance = $("sortShows").value === "distance";
  let html = "";
  let lastDate = null;
  list.forEach((s) => {
    if (!byDistance && s.date !== lastDate) {
      html += '<h2 class="date-heading">' + escapeHtml(formatDateHeading(s.date)) + "</h2>";
      lastDate = s.date;
    }
    html += showCard(s, byDistance);
  });
  el.innerHTML = html;
}

function showCard(s, withDate) {
  const idx = results.shows.indexOf(s);
  const artistFollowed = isFollowedArtistName(s.artist);
  const venueFollowed = isFollowedVenue(s.venue);
  const others = s.lineup.filter((n) => !namesMatch(n, s.artist));
  const meta = [withDate ? new Date(s.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "", s.time, s.price, s.genre].filter(Boolean);
  const badges = s.sources.map((src) =>
    src.url
      ? '<a class="badge" href="' + escapeHtml(src.url) + '" target="_blank" rel="noopener">' + escapeHtml(src.name) + "</a>"
      : '<span class="badge">' + escapeHtml(src.name) + "</span>"
  ).join("");
  return '<article class="show' + (artistFollowed || venueFollowed ? " followed" : "") + '">' +
    '<div class="show-main">' +
      '<h3>' + escapeHtml(s.artist) + "</h3>" +
      (others.length ? '<p class="lineup">with ' + escapeHtml(others.slice(0, 4).join(", ")) + (others.length > 4 ? " +" + (others.length - 4) : "") + "</p>" : "") +
      '<p class="venue">' + escapeHtml(s.venue.name) + (s.venue.city ? ' <span class="muted">· ' + escapeHtml(s.venue.city) + "</span>" : "") +
        (s.distance != null ? ' <span class="dist">' + miles(s.distance) + "</span>" : "") + "</p>" +
      (meta.length ? '<p class="meta">' + escapeHtml(meta.join(" · ")) + "</p>" : "") +
      '<div class="badges">' + badges + "</div>" +
    "</div>" +
    '<div class="show-actions">' +
      '<button class="star' + (artistFollowed ? " on" : "") + '" data-follow-artist="' + idx + '" title="Follow artist">' + (artistFollowed ? "★" : "☆") + " Artist</button>" +
      '<button class="star' + (venueFollowed ? " on" : "") + '" data-follow-venue="' + idx + '" title="Follow venue">' + (venueFollowed ? "★" : "☆") + " Venue</button>" +
    "</div>" +
  "</article>";
}

let venueIndex = [];
let artistIndex = [];

function renderVenues() {
  venueIndex = results ? buildVenues(results.shows) : [];
  const q = $("venueSearch").value.trim().toLowerCase();
  const list = venueIndex.filter((v) => !q || (v.name + " " + v.city).toLowerCase().includes(q));
  $("venueList").innerHTML = list.length ? list.map((v) => {
    const on = isFollowedVenue(v);
    return '<div class="item"><div><b>' + escapeHtml(v.name) + '</b><br><span class="muted">' +
      escapeHtml([v.city, miles(v.distance), v.count + (v.count === 1 ? " show" : " shows")].filter(Boolean).join(" · ")) +
      '</span></div><button class="star' + (on ? " on" : "") + '" data-venue-index="' + venueIndex.indexOf(v) + '">' + (on ? "★ Following" : "☆ Follow") + "</button></div>";
  }).join("") : '<p class="empty">' + (results ? "No venues match." : "Scan first to discover venues.") + "</p>";
}

function renderArtists() {
  artistIndex = results ? buildArtists(results.shows) : [];
  const q = $("artistSearch").value.trim().toLowerCase();
  const list = artistIndex.filter((a) => !q || a.name.toLowerCase().includes(q));
  $("artistList").innerHTML = list.length ? list.map((a) => {
    const on = isFollowedArtistName(a.name);
    return '<div class="item"><div><b>' + escapeHtml(a.name) + '</b><br><span class="muted">' +
      escapeHtml(a.count + (a.count === 1 ? " show" : " shows") + " · next " + new Date(a.next + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })) +
      '</span></div><button class="star' + (on ? " on" : "") + '" data-artist-index="' + artistIndex.indexOf(a) + '">' + (on ? "★ Following" : "☆ Follow") + "</button></div>";
  }).join("") : '<p class="empty">' + (results ? "No artists match." : "Scan first to discover artists.") + "</p>";
}

function upcomingFor(test) {
  if (!results) return 0;
  return results.shows.filter(test).length;
}

function renderFollowing() {
  $("followedArtists").innerHTML = followed.artists.length ? followed.artists.map((a, i) => {
    const n = upcomingFor((s) => s.lineup.some((x) => namesMatch(x, a.name)));
    return '<div class="item"><div><b>' + escapeHtml(a.name) + '</b><br><span class="muted">' + n + " upcoming within range</span></div>" +
      '<button data-unfollow-artist="' + i + '">Unfollow</button></div>';
  }).join("") : '<p class="empty">None yet. Tap ☆ on a show or in the Artists tab.</p>';

  $("followedVenues").innerHTML = followed.venues.length ? followed.venues.map((v, i) => {
    const fv = { ...v, ids: v.ids || {} };
    const n = upcomingFor((s) => sameVenue(fv, s.venue));
    const linked = Object.keys(fv.ids).filter((k) => fv.ids[k]).length;
    return '<div class="item"><div><b>' + escapeHtml(v.name) + '</b><br><span class="muted">' +
      escapeHtml([v.city, n + " upcoming", linked ? "linked to " + linked + " source" + (linked > 1 ? "s" : "") : "matched by name"].filter(Boolean).join(" · ")) +
      '</span></div><button data-unfollow-venue="' + i + '">Unfollow</button></div>';
  }).join("") : '<p class="empty">None yet. Tap ☆ on a show or in the Venues tab.</p>';
}

function renderAll() {
  renderShows();
  renderVenues();
  renderArtists();
  renderFollowing();
}

/* ---------------- Settings ---------------- */

function fillSettings() {
  for (const src of SOURCES) {
    if (src.keyName) $("key-" + src.keyName).value = settings.keys[src.keyName] || "";
  }
  $("includeLocal").checked = settings.includeLocal;
  $("radiusSelect").value = String(settings.radius);
  $("daysSelect").value = String(settings.days);
}

function saveSettings() {
  for (const src of SOURCES) {
    if (src.keyName) settings.keys[src.keyName] = $("key-" + src.keyName).value.trim();
  }
  settings.includeLocal = $("includeLocal").checked;
  save("settings", settings);
  $("settingsStatus").textContent = "Saved. Tap Scan to search with these sources.";
}

function exportShows() {
  if (!results) return;
  // Same shape as the Ithaca Live Music app's shows.json, so entries can be copied across.
  const rows = results.shows.map((s) => ({
    band: s.artist,
    venue: s.venue.name,
    date: s.date,
    time: s.time || "See Schedule",
    genre: s.genre || "Live Music",
    price: s.price || "",
    link: s.sources[0] && s.sources[0].url || "",
  }));
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "marios-local-live-music-" + isoDate(new Date()) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------- Wiring ---------------- */

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("hidden", t.id !== "tab-" + btn.dataset.tab));
  });
});

$("setLocationBtn").addEventListener("click", setLocationFromInput);
$("locationInput").addEventListener("keydown", (e) => { if (e.key === "Enter") setLocationFromInput(); });
$("gpsBtn").addEventListener("click", useGps);
$("scanBtn").addEventListener("click", scan);
$("radiusSelect").addEventListener("change", () => { settings.radius = parseInt($("radiusSelect").value, 10); save("settings", settings); });
$("daysSelect").addEventListener("change", () => { settings.days = parseInt($("daysSelect").value, 10); save("settings", settings); });

$("showSearch").addEventListener("input", renderShows);
$("onlyFollowing").addEventListener("change", renderShows);
$("sortShows").addEventListener("change", renderShows);
$("venueSearch").addEventListener("input", renderVenues);
$("artistSearch").addEventListener("input", renderArtists);

$("showList").addEventListener("click", (e) => {
  const a = e.target.closest("[data-follow-artist]");
  const v = e.target.closest("[data-follow-venue]");
  if (a) {
    const s = results.shows[+a.dataset.followArtist];
    const ids = s.artistIds.find((x) => namesMatch(x.name, s.artist)) || {};
    toggleArtist({ name: s.artist, ids: { tm: ids.tm, sg: ids.sg, jb: ids.jb } });
  } else if (v) {
    toggleVenue(results.shows[+v.dataset.followVenue].venue);
  }
});

$("venueList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-venue-index]");
  if (b) toggleVenue(venueIndex[+b.dataset.venueIndex]);
});

$("artistList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-artist-index]");
  if (b) toggleArtist(artistIndex[+b.dataset.artistIndex]);
});

$("tab-following").addEventListener("click", (e) => {
  const a = e.target.closest("[data-unfollow-artist]");
  const v = e.target.closest("[data-unfollow-venue]");
  if (a) followed.artists.splice(+a.dataset.unfollowArtist, 1);
  else if (v) followed.venues.splice(+v.dataset.unfollowVenue, 1);
  else return;
  save("followed", followed);
  renderAll();
});

$("followArtistBtn").addEventListener("click", () => {
  const name = $("followInput").value.trim();
  if (!name || isFollowedArtistName(name)) return;
  const known = artistIndex.find((a) => namesMatch(a.name, name));
  toggleArtist(known || { name, ids: {} });
  $("followInput").value = "";
});

$("followVenueBtn").addEventListener("click", async () => {
  const name = $("followInput").value.trim();
  if (!name) return;
  const known = venueIndex.find((v) => namesMatch(v.name, name));
  const btn = $("followVenueBtn");
  btn.disabled = true;
  btn.textContent = "Looking up…";
  const venue = known || (await resolveVenue(name));
  btn.disabled = false;
  btn.textContent = "+ Venue";
  if (!isFollowedVenue({ ...venue, ids: venue.ids || {} })) toggleVenue(venue);
  $("followInput").value = "";
});

$("saveSettingsBtn").addEventListener("click", saveSettings);
$("exportBtn").addEventListener("click", exportShows);
$("clearCacheBtn").addEventListener("click", () => {
  results = null;
  save("results", null);
  $("sourceStatus").innerHTML = "";
  renderAll();
  $("settingsStatus").textContent = "Saved results cleared.";
});

fillSettings();
if (place) {
  $("locationInput").placeholder = place.label;
  $("locationStatus").textContent = "📍 " + place.label;
} else {
  $("locationStatus").textContent = "Start with your location: type a zip code or tap 📍.";
}
if (results && results.sourceStatus) renderSourceStatus(results.sourceStatus);
renderAll();
