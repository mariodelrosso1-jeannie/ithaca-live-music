// Each source turns its own API's results into the same show shape:
// { artist, lineup, venue: { name, city, lat, lng, ids }, date, time, url, price, genre, source }
// A source exposes area(ctx) for the radius scan, plus artist(ctx, a) / venue(ctx, v) for
// the targeted lookups done for everything the user follows.

const PROXY_HOSTS = ["localhost", "127.0.0.1"];

// Try the API directly; if the browser blocks it (CORS), retry through the local server's
// /proxy route, which exists when the app is run with .claude/serve-radar.ps1.
async function fetchJSON(url, headers = {}) {
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    if (!PROXY_HOSTS.includes(location.hostname)) {
      throw new Error("blocked by the browser (run the app with serve-radar.ps1 to relay it)");
    }
    res = await fetch("/proxy?url=" + encodeURIComponent(url), { headers });
  }
  if (res.status === 401 || res.status === 403) throw new Error("key rejected (" + res.status + ")");
  if (res.status === 429) throw new Error("rate limited, try again in a minute");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isoDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// "19:30:00" or "2026-10-03T19:30:00" -> "7:30 PM"
function formatTime(t) {
  if (!t) return "";
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m[2] + " " + ampm;
}

function num(x) {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : null;
}

/* ---------------- Ticketmaster (Discovery API v2) ---------------- */

const ticketmaster = {
  id: "ticketmaster",
  label: "Ticketmaster",
  keyName: "ticketmaster",
  base: "https://app.ticketmaster.com/discovery/v2/",

  params(ctx, extra) {
    const p = new URLSearchParams({
      apikey: ctx.keys.ticketmaster,
      classificationName: "Music",
      startDateTime: ctx.start.toISOString().replace(/\.\d{3}Z$/, "Z"),
      endDateTime: ctx.end.toISOString().replace(/\.\d{3}Z$/, "Z"),
      size: "200",
      sort: "date,asc",
      ...extra,
    });
    return p;
  },

  normalize(e) {
    const v = (e._embedded && e._embedded.venues && e._embedded.venues[0]) || {};
    const attractions = (e._embedded && e._embedded.attractions) || [];
    const lineup = attractions.map((a) => a.name);
    const price = e.priceRanges && e.priceRanges[0];
    const cls = e.classifications && e.classifications[0];
    return {
      artist: lineup[0] || e.name,
      title: e.name,
      lineup,
      artistIds: attractions.map((a) => ({ name: a.name, tm: a.id })),
      venue: {
        name: v.name || "Unknown venue",
        city: [v.city && v.city.name, v.state && v.state.stateCode].filter(Boolean).join(", "),
        lat: num(v.location && v.location.latitude),
        lng: num(v.location && v.location.longitude),
        ids: { tm: v.id },
      },
      date: e.dates && e.dates.start && e.dates.start.localDate,
      time: formatTime(e.dates && e.dates.start && e.dates.start.localTime),
      url: e.url,
      price: price ? "$" + Math.round(price.min) + (price.max > price.min ? "–$" + Math.round(price.max) : "") : "",
      genre: cls && cls.genre && cls.genre.name !== "Undefined" ? cls.genre.name : "",
      source: "Ticketmaster",
    };
  },

  async pages(ctx, extra, maxPages = 3) {
    const out = [];
    for (let page = 0; page < maxPages; page++) {
      const data = await fetchJSON(this.base + "events.json?" + this.params(ctx, { ...extra, page: String(page) }));
      const events = (data._embedded && data._embedded.events) || [];
      out.push(...events.map((e) => this.normalize(e)));
      const totalPages = data.page ? data.page.totalPages : 1;
      if (page + 1 >= totalPages) break;
      await sleep(250); // stay under 5 requests/second
    }
    return out;
  },

  area(ctx) {
    return this.pages(ctx, {
      latlong: ctx.lat + "," + ctx.lng,
      radius: String(ctx.radius),
      unit: "miles",
    }, 5);
  },

  async artist(ctx, a) {
    if (a.ids && a.ids.tm) return this.pages(ctx, { attractionId: a.ids.tm }, 1);
    return this.pages(ctx, { keyword: a.name, latlong: ctx.lat + "," + ctx.lng, radius: String(ctx.radius), unit: "miles" }, 1);
  },

  async venue(ctx, v) {
    if (v.ids && v.ids.tm) return this.pages(ctx, { venueId: v.ids.tm }, 2);
    return [];
  },
};

/* ---------------- SeatGeek (platform API v2) ---------------- */

const seatgeek = {
  id: "seatgeek",
  label: "SeatGeek",
  keyName: "seatgeek",
  base: "https://api.seatgeek.com/2/events?",

  params(ctx, extra) {
    return new URLSearchParams({
      client_id: ctx.keys.seatgeek,
      "taxonomies.name": "concert",
      "datetime_local.gte": isoDate(ctx.start),
      "datetime_local.lte": isoDate(ctx.end) + "T23:59:59",
      per_page: "100",
      sort: "datetime_local.asc",
      ...extra,
    });
  },

  normalize(e) {
    const v = e.venue || {};
    const performers = e.performers || [];
    const primary = performers.find((p) => p.primary) || performers[0];
    return {
      artist: primary ? primary.name : e.title,
      title: e.title,
      lineup: performers.map((p) => p.name),
      artistIds: performers.map((p) => ({ name: p.name, sg: p.slug })),
      venue: {
        name: v.name || "Unknown venue",
        city: [v.city, v.state].filter(Boolean).join(", "),
        lat: num(v.location && v.location.lat),
        lng: num(v.location && v.location.lon),
        ids: { sg: v.id },
      },
      date: (e.datetime_local || "").slice(0, 10),
      time: e.time_tbd ? "" : formatTime(e.datetime_local),
      url: e.url,
      price: e.stats && e.stats.lowest_price ? "from $" + e.stats.lowest_price : "",
      genre: primary && primary.genres && primary.genres[0] ? primary.genres[0].name : "",
      source: "SeatGeek",
    };
  },

  async pages(ctx, extra, maxPages = 3) {
    const out = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await fetchJSON(this.base + this.params(ctx, { ...extra, page: String(page) }));
      out.push(...(data.events || []).map((e) => this.normalize(e)));
      const total = data.meta ? data.meta.total : 0;
      if (page * 100 >= total) break;
    }
    return out;
  },

  area(ctx) {
    return this.pages(ctx, { lat: String(ctx.lat), lon: String(ctx.lng), range: ctx.radius + "mi" }, 5);
  },

  artist(ctx, a) {
    if (a.ids && a.ids.sg) return this.pages(ctx, { "performers.slug": a.ids.sg }, 1);
    return this.pages(ctx, { q: a.name, lat: String(ctx.lat), lon: String(ctx.lng), range: ctx.radius + "mi" }, 1);
  },

  venue(ctx, v) {
    if (v.ids && v.ids.sg) return this.pages(ctx, { "venue.id": String(v.ids.sg) }, 2);
    return Promise.resolve([]);
  },
};

/* ---------------- JamBase (Data API v3) ---------------- */

const jambase = {
  id: "jambase",
  label: "JamBase",
  keyName: "jambase",
  base: "https://api.data.jambase.com/v3/events?",

  params(ctx, extra) {
    return new URLSearchParams({
      eventType: "concerts",
      eventDateFrom: isoDate(ctx.start),
      eventDateTo: isoDate(ctx.end),
      perPage: "100",
      ...extra,
    });
  },

  normalize(e) {
    const loc = e.location || {};
    const geo = loc.geo || {};
    const addr = loc.address || {};
    const region = addr.addressRegion && (addr.addressRegion.alternateName || addr.addressRegion.name || addr.addressRegion);
    const performers = e.performer || [];
    const offer = (e.offers || [])[0];
    return {
      artist: performers[0] ? performers[0].name : e.name,
      title: e.name,
      lineup: performers.map((p) => p.name),
      artistIds: performers.map((p) => ({ name: p.name, jb: p.identifier })),
      venue: {
        name: loc.name || "Unknown venue",
        city: [addr.addressLocality, typeof region === "string" ? region : ""].filter(Boolean).join(", "),
        lat: num(geo.latitude),
        lng: num(geo.longitude),
        ids: { jb: loc.identifier },
      },
      date: (e.startDate || "").slice(0, 10),
      time: formatTime((e.startDate || "").slice(11)),
      url: (offer && offer.url) || e.url,
      price: "",
      genre: performers[0] && performers[0].genre && performers[0].genre[0] ? performers[0].genre[0] : "",
      source: "JamBase",
    };
  },

  async pages(ctx, extra, maxPages = 3) {
    const headers = { Authorization: "Bearer " + ctx.keys.jambase };
    const out = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await fetchJSON(this.base + this.params(ctx, { ...extra, page: String(page) }), headers);
      out.push(...(data.events || []).map((e) => this.normalize(e)));
      const pagination = data.pagination || {};
      const totalPages = pagination.totalPages || (pagination.nextPage ? page + 1 : page);
      if (page >= totalPages) break;
    }
    return out;
  },

  area(ctx) {
    return this.pages(ctx, {
      geoLatitude: String(ctx.lat),
      geoLongitude: String(ctx.lng),
      geoRadiusAmount: String(ctx.radius),
      geoRadiusUnits: "mi",
    }, 3); // free plan is 1,000 calls a month, so keep paging modest
  },

  artist(ctx, a) {
    if (a.ids && a.ids.jb) return this.pages(ctx, { artistId: a.ids.jb }, 1);
    return this.pages(ctx, { artistName: a.name }, 1);
  },

  venue(ctx, v) {
    if (v.ids && v.ids.jb) return this.pages(ctx, { venueId: v.ids.jb }, 1);
    return this.pages(ctx, { venueName: v.name, geoLatitude: String(ctx.lat), geoLongitude: String(ctx.lng), geoRadiusAmount: String(ctx.radius), geoRadiusUnits: "mi" }, 1);
  },
};

/* ---------------- Bandsintown (artist events only) ---------------- */

const bandsintown = {
  id: "bandsintown",
  label: "Bandsintown",
  keyName: "bandsintown",
  followOnly: true, // its API has no area search, only per-artist lookups

  area() {
    return Promise.resolve([]);
  },

  async artist(ctx, a) {
    const url = "https://rest.bandsintown.com/artists/" + encodeURIComponent(a.name) +
      "/events?app_id=" + encodeURIComponent(ctx.keys.bandsintown) +
      "&date=" + isoDate(ctx.start) + "," + isoDate(ctx.end);
    const data = await fetchJSON(url);
    if (!Array.isArray(data)) return [];
    return data.map((e) => {
      const v = e.venue || {};
      const offer = (e.offers || [])[0];
      return {
        artist: a.name,
        title: e.title || a.name,
        lineup: e.lineup || [a.name],
        artistIds: [{ name: a.name }],
        venue: {
          name: v.name || "Unknown venue",
          city: [v.city, v.region].filter(Boolean).join(", "),
          lat: num(v.latitude),
          lng: num(v.longitude),
          ids: {},
        },
        date: (e.datetime || "").slice(0, 10),
        time: formatTime((e.datetime || "").slice(11)),
        url: (offer && offer.url) || e.url,
        price: "",
        genre: "",
        source: "Bandsintown",
      };
    });
  },

  venue() {
    return Promise.resolve([]);
  },
};

/* ---------------- The hand-researched Ithaca Live Music calendar ---------------- */

const localCalendar = {
  id: "local",
  label: "Ithaca calendar",
  keyName: null,

  async area(ctx) {
    let shows, venues;
    try {
      [shows, venues] = await Promise.all([
        fetch("../shows.json", { cache: "no-store" }).then((r) => r.json()),
        fetch("../venues.json", { cache: "no-store" }).then((r) => r.json()),
      ]);
    } catch {
      return []; // not deployed next to the Ithaca app; just skip it
    }
    return shows.map((s) => {
      const v = venues[s.venue] || {};
      return {
        artist: s.band,
        title: s.band,
        lineup: [s.band],
        artistIds: [{ name: s.band }],
        venue: { name: s.venue, city: (v.address || "").split(",").slice(-2, -1).join("").trim(), lat: num(v.lat), lng: num(v.lng), ids: {} },
        date: s.date,
        time: /\d/.test(s.time || "") ? s.time : "",
        url: s.link,
        price: s.price || "",
        genre: s.genre && s.genre !== "Live Music" ? s.genre : "",
        source: "Ithaca calendar",
      };
    });
  },

  artist() {
    return Promise.resolve([]);
  },

  venue() {
    return Promise.resolve([]);
  },
};

const SOURCES = [ticketmaster, seatgeek, jambase, bandsintown, localCalendar];
