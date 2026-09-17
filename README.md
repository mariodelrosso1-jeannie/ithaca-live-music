# Ithaca Band Shows

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

## Data sources

Every entry in `shows.json` is a real, researched show (no placeholder or made-up data),
pulled from each wine trail's or winery's own event listings as of September 17, 2026:

**Cayuga Lake Wine Trail** — each show links to its own specific event page on
[cayugawinetrail.com](https://cayugawinetrail.com/events/winery), not the general list
- Six Mile Creek Vineyard, Montezuma Winery, Hosmer Estate Winery, Lucas Vineyards

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

A few entries note the recurring series name in parentheses (e.g. "Bobby Rowe (Music and
Mimosas)") because that's how the venue itself labels the event alongside the performer.
Two Six Mile Creek Vineyard dates (Sep 17, Sep 24) list "artist TBA" because the venue's
own event page hadn't announced a performer yet at research time — that's the venue's
wording, not a filler value.

Two more Finger Lakes wineries host live music but didn't have confirmed upcoming dates
at research time:
- [Sheldrake Point Winery](https://sheldrakepoint.com/events/) — recurring "BBQ Nights with
  Live Music," Wednesdays 5-8 PM in season, specific bands posted closer to each date
- [Americana Vineyards](https://www.americanavineyard.com/) — under new ownership/remodeling
  as of 2026, live music schedule not yet published

Show schedules change and venues sometimes list acts as "tentative." Re-check these
sources periodically and update `shows.json` by hand.
