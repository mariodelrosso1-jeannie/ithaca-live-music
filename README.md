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

The first 5 entries in `shows.json` (The Haunt, Argos Warehouse, The Range, State Theatre
of Ithaca, Coltivare) are **made-up placeholder examples**, marked with a `"note"` field —
they are not real scheduled shows.

The winery entries below them are **real, researched shows** for Fall 2026, pulled from:

- [Cayuga Lake Wine Trail events calendar](https://cayugawinetrail.com/events/winery) —
  Six Mile Creek Vineyard, Montezuma Winery, Hosmer Estate Winery, Lucas Vineyards
- [Buttonwood Grove Winery's own events page](https://www.buttonwoodgrove.com/events)

Facebook event pages couldn't be scraped directly (they require a login), so official
winery/wine-trail websites were used instead — same information, more reliable.

Two more Finger Lakes wineries host live music but didn't have confirmed upcoming dates
at research time — worth checking directly if you want to add them:
- [Sheldrake Point Winery](https://sheldrakepoint.com/events/) — recurring "BBQ Nights with
  Live Music," Wednesdays 5-8 PM in season, specific bands posted closer to each date
- [Americana Vineyards](https://www.americanavineyard.com/) — under new ownership/remodeling
  as of 2026, live music schedule not yet published

Since show schedules change, re-check these sources periodically and update `shows.json`
by hand.
