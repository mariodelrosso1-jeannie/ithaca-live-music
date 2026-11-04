# Mario's Local Live Music

A phone-friendly app that lists every live music show within a set distance of any location.
It's based on the Ithaca Live Music calendar one folder up, but instead of hand-researched
data it pulls listings automatically from the big music listing sites and merges them.

## How it works

1. **Location first.** Type a zip code or town, or tap 📍 to use the phone's location
   (looked up through OpenStreetMap).
2. **Fixed radius.** Choose 10, 25, 50, 75 or 100 miles and a date window of 7 to 90 days.
3. **Scan.** Every source is searched around that point. Duplicate listings of the same
   show (same date, same venue, overlapping artists) are merged into one card, with a link
   badge for each source that listed it.
4. **Track venues and artists.** The Venues and Artists tabs list everything the scan
   found. Follow any of them (or tap ☆ on a show). After that, every scan also looks up
   each followed artist and venue directly, which catches shows a general area search
   can miss. Results are still limited to the chosen radius.

## Sources

| Source | What it adds | Key |
|---|---|---|
| Ticketmaster Discovery API | Largest catalog: Ticketmaster, Live Nation, TicketWeb, Universe | Free, [developer.ticketmaster.com](https://developer.ticketmaster.com/) |
| SeatGeek API | Its own and resale listings, plus venue coordinates | Free, [seatgeek.com/account/develop](https://seatgeek.com/account/develop) |
| JamBase Data API | Strong on clubs, bars and smaller rooms | Free developer plan, 1,000 calls/month, [data.jambase.com](https://data.jambase.com/) |
| Bandsintown API | Tour dates for **followed artists** only (no area search) | By request from Bandsintown |
| Ithaca Live Music calendar | The hand-researched `../shows.json` (wineries, breweries, small venues the big sites miss) | None |

Keys go in the ⚙ tab and are saved on that device only. Any source without a key is skipped.

Songkick (paid license only) and Eventbrite (public search shut off in 2020) were looked at
and left out because they no longer offer open location search.

## Running it

```powershell
powershell -ExecutionPolicy Bypass -File .claude/serve-radar.ps1
```

Then open `http://localhost:5600/live-radar/`. This server also adds a `/proxy` route: some
APIs (Ticketmaster and Bandsintown in testing) block requests made straight from a browser,
so the app falls back to relaying them through the local server. The proxy only forwards to
the listing APIs above.

On a phone, open the page and use "Add to Home Screen" to install it like an app.
