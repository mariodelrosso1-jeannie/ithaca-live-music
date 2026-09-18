# Ithaca Live Music

A simple web calendar of upcoming live music shows and venue info around Ithaca, NY.

## Running it locally

No build tools needed — it's plain HTML, CSS, and JavaScript. Because the page loads
`shows.json` with `fetch`, most browsers require it to be served over `http://` rather
than opened directly as a file. If you have Python installed:

```bash
python -m http.server 8000
```

If not (this machine didn't have Python or Node installed), you can use the included
PowerShell server instead:

```powershell
powershell -ExecutionPolicy Bypass -File .claude/serve.ps1
```

Then open `http://localhost:5500` in your browser. (Port 8000 is blocked by Windows on
some machines as a reserved/excluded port — 5500 avoids that.)

## Editing shows

All show and venue data lives in [`shows.json`](shows.json). Each entry looks like:

```json
{
  "band": "Band Name",
  "venue": "Venue Name",
  "date": "2026-10-15",
  "time": "8:00 PM",
  "genre": "Rock",
  "price": "$10",
  "link": "https://venue-website.com"
}
```

Add, remove, or edit entries in that file and refresh the page — no code changes needed.

Venue locations (for the distance feature below) live in [`venues.json`](venues.json),
keyed by the exact venue name used in `shows.json`:

```json
{
  "Venue Name": {
    "address": "123 Main St, Town, NY 12345",
    "lat": 42.1234,
    "lng": -76.5678
  }
}
```

If you add a show at a venue that isn't in `venues.json` yet, distance sorting will just
skip it (it'll still show up in the list, just without a distance badge).

### Adding a venue from the page itself

Click **"+ Add Venue"** next to the venue dropdown, enter a venue name and an address, town,
or zip code, and click "Save Venue" (or press Enter). It geocodes the address the same way
the location search does, then adds the venue to the dropdown so you can filter by it.

This is meant for registering a venue's location quickly — it does **not** save to
`venues.json` in the repo. It's stored in your browser's `localStorage`, so it sticks
around on reloads but only on that one browser/device, and won't show up for anyone else
who opens the site. To make a venue permanent for everyone, add it to `venues.json` by hand
(or ask whoever maintains the site to). You'll still need to add an entry in `shows.json`
for any actual show at that venue — adding the venue alone doesn't create a show.

## Filtering and distance

- **Date dropdown** — "All Dates" (default) or "Next 1 day" through "Next 7 days," which
  filters to shows happening between today and that many days out.
- **Sort: Distance (nearest first)** — type a zip code, town, or address into the location
  box and click "📍 Set Location" (or press Enter). This looks up that place using
  [OpenStreetMap's free Nominatim geocoding service](https://nominatim.org/) to turn it
  into coordinates, then does all the distance math in your browser using the venue
  coordinates in `venues.json` — no location data is stored anywhere, it just lives in the
  page until you reload. Once set, every show gets a distance badge and this sort option
  ranks the nearest first.
- These combine with the search box and venue dropdown, so you can e.g. search "blues",
  filter to next 3 days, and sort by distance all at once.

## Data sources

Every entry in `shows.json` is a real, researched show (no placeholder or made-up data),
pulled from each wine trail's or winery's own event listings as of September 17, 2026:

**Six Mile Creek Vineyard** — [its own live music calendar](https://sixmilecreek.com/live-music-%26-events),
which is more current than the wine trail aggregator and names a specific act each week

**Cayuga Lake Wine Trail** — each show links to its own specific event page on
[cayugawinetrail.com](https://cayugawinetrail.com/events/winery), not the general list
- Montezuma Winery, Hosmer Estate Winery, Lucas Vineyards

**Buttonwood Grove Winery** — [buttonwoodgrove.com/events](https://www.buttonwoodgrove.com/events)

**Seneca Lake Wine Trail** wineries (via each winery's own site):
- [Ventosa Vineyards](https://www.ventosavineyards.com/events) — weekly Wednesday music
- [The Oasis at Hazlitt 1852 Vineyards](https://hazlitt1852.com/events/) — Friday and Sunday music
- [Wagner Vineyards](https://wagnervineyards.com/events-calendar/upcoming-events-list/) — Summer Sundays Music Series

**Breweries** (all three are on Seneca Lake, in Burdett/Hector, NY — not Cayuga Lake):
- [Grist Iron Brewing Company](https://www.gristironbrewing.com/events-live-music) — own site, full weekly schedule
- [Two Goats Brewing](https://twogoatsbrewing.com/music-events) — own site, full weekly schedule
- Scale House Brewery — their own site (scalehousebrews.com/events) didn't return
  readable event listings, so only one date could be confirmed, sourced from
  [a local concert-calendar column](https://jimcat.substack.com/p/cny-concert-calendar-sept-17-22)
  instead of the venue directly. Check their site or Facebook page for anything beyond that.

Facebook event pages generally couldn't be scraped directly (they require a login), so
official winery/brewery/wine-trail websites were used instead wherever possible — same
information, more reliable.

**Ithaca Times / ithaca.com Live Music calendar** — [ithaca.com/local-events (Live Music filter)](https://www.ithaca.com/local-events/?_evDiscoveryPath=%2Flive-music).
Each show links to its own specific event page on that site. This source covers a much
wider area than just Ithaca (it stretches into Syracuse, Binghamton, and Owego), so only
shows within Tompkins County and the Cayuga/Seneca/Keuka Lake wine country were pulled in —
farther-out cities were skipped as outside this app's "around Ithaca" scope. This added:
- Ithaca venues: Hangar Theatre, Night Eagle Cafe (actually now hosted at the Lansing
  Performing Arts Center, not in Ithaca proper), Cornell University (a contra dance, not a
  band, but tagged as Live Music by the source)
- Cayuga Lake area: Bright Leaf Vineyard, O'Malley's Lakeside Tavern, Finger Lakes Cider
  House, Bet the Farm Winery
- Seneca Lake area: F2T Kitchen & Bar, Idol Ridge Winery & Alder Creek Distillery,
  Temperance FLX
- Keuka Lake (a third Finger Lake, newly added — roughly 35-45 min from Ithaca): Keuka
  Spring Vineyards, Keuka Brewing Co., Point of the Bluff Vineyards, Laurentide Beer Company
- More Ithaca/Geneva venues added on a second, deeper pass: Angry Mom Records (Ithaca),
  The North Farm, Smith Opera House, and Geneva On The Lake (all Geneva, on Seneca Lake's
  north end), and Quarry Ridge Winery (Union Springs, on Cayuga Lake's east shore)

(Ithaca Porchfest was considered but left out — it's 174 performers across 109 porches in
one afternoon, which doesn't fit this app's one-band-per-show model well. Check
[porchfest.org](https://www.porchfest.org/) directly if you want that lineup.)

Five entries (Sugar Bomb, Lotus Land - A Tribute to Rush, Mark Nanni Music at Geneva On The
Lake, and Just Joe at Quarry Ridge Winery) link to the general Live Music search page rather
than their own event page — the site's search widget became unresponsive while trying to
grab their specific links. The band, venue, date, and time are still confirmed accurate,
just the link is one step less precise for those four.

Only a snapshot of what was listed for the next couple of weeks was pulled — this source
adds new events constantly, so it's worth re-checking periodically for more. Its own
calendar also has date-range filters (This Weekend, Next Week, etc.) if you want to pull
further out yourself.

A few entries note the recurring series name in parentheses (e.g. "Bobby Rowe (Music and
Mimosas)") because that's how the venue itself labels the event alongside the performer.

Two more Finger Lakes wineries host live music but didn't have confirmed upcoming dates
at research time:
- [Sheldrake Point Winery](https://sheldrakepoint.com/events/) — recurring "BBQ Nights with
  Live Music," Wednesdays 5-8 PM in season, specific bands posted closer to each date
- [Americana Vineyards](https://www.americanavineyard.com/) — under new ownership/remodeling
  as of 2026, live music schedule not yet published

Show schedules change and venues sometimes list acts as "tentative." Re-check these
sources periodically and update `shows.json` by hand.
