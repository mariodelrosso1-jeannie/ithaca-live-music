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

Then open `http://localhost:8000` in your browser.

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

**Cayuga Lake Wine Trail** — [cayugawinetrail.com/events/winery](https://cayugawinetrail.com/events/winery)
- Six Mile Creek Vineyard, Montezuma Winery, Hosmer Estate Winery, Lucas Vineyards

**Buttonwood Grove Winery** — [buttonwoodgrove.com/events](https://www.buttonwoodgrove.com/events)

**Seneca Lake Wine Trail** wineries (via each winery's own site):
- [Ventosa Vineyards](https://www.ventosavineyards.com/events) — weekly Wednesday music
- [The Oasis at Hazlitt 1852 Vineyards](https://hazlitt1852.com/events/) — Friday and Sunday music
- [Wagner Vineyards](https://wagnervineyards.com/events-calendar/upcoming-events-list/) — Summer Sundays Music Series

Facebook event pages couldn't be scraped directly (they require a login), so official
winery/wine-trail websites were used instead — same information, more reliable.

A few entries use a series name (e.g. "Tunes and Tots (rotating artists)", "Oasis Sunday
Music") instead of a specific band — that's because the venue's own listing doesn't name
a performer for that date, not a placeholder.

Two more Finger Lakes wineries host live music but didn't have confirmed upcoming dates
at research time:
- [Sheldrake Point Winery](https://sheldrakepoint.com/events/) — recurring "BBQ Nights with
  Live Music," Wednesdays 5-8 PM in season, specific bands posted closer to each date
- [Americana Vineyards](https://www.americanavineyard.com/) — under new ownership/remodeling
  as of 2026, live music schedule not yet published

Show schedules change and venues sometimes list acts as "tentative." Re-check these
sources periodically and update `shows.json` by hand.
