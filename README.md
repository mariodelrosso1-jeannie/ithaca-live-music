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

### Managing what you've added

Click **"⚙ Manage"** to see everything you've added yourself (venues and followed bands) in
one place, with **Rename** and **Delete** for each. Renaming a venue lets you fix its address
too (it re-geocodes if you change it) without losing or re-typing anything.

This only lists your own local additions — not the shared data in `shows.json`/`venues.json`.
If something there is wrong, ask to have it corrected instead of trying to edit it here.

(Note for anyone extending this app: the management UI intentionally avoids `prompt()`,
`confirm()`, and `alert()` — in at least this app's own testing environment they either threw
an error or silently returned `false`/did nothing, so they can't be relied on. Everything uses
inline HTML forms instead.)

## Filtering and distance

- **Date dropdown** — "All Dates" (default) or "Next 1 day" through "Next 7 days," which
  filters to shows happening between today and that many days out.
- **Sort: Performer/Artist (A-Z)** — alphabetical by band/artist name.
- **Sort: Distance (nearest first)** — type a zip code, town, or address into the location
  box and click "📍 Set Location" (or press Enter). This looks up that place using
  [OpenStreetMap's free Nominatim geocoding service](https://nominatim.org/) to turn it
  into coordinates, then does all the distance math in your browser using the venue
  coordinates in `venues.json` — no location data is stored anywhere, it just lives in the
  page until you reload. Once set, every show gets a distance badge and this sort option
  ranks the nearest first.
- These combine with the search box and venue dropdown, so you can e.g. search "blues",
  filter to next 3 days, and sort by distance all at once.
- **Favorites (★)** — click the star next to any band/artist name to mark them a favorite
  (saved in your browser). Favorited-band shows always float to the top of the list, ahead
  of everything else, regardless of the current sort or filters, and get a highlighted
  border. They're also starred and moved to the top of the band/artist dropdown.
- **🔄 Refresh** — re-loads `shows.json` and `venues.json` from disk without a full page
  reload, so your search text, filters, sort, and location stay put. Useful after
  `shows.json` gets updated (by hand or by Claude) while the page is already open — a plain
  browser reload works too, but this keeps your current view intact.

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

**Homer Center for the Arts** — [its Bandsintown venue page](https://www.bandsintown.com/v/10018890-center-for-the-arts-of-homer),
which listed its full confirmed schedule (36 shows, Sep 2026 through Apr 2027) in one
place. This venue (72 South Main Street, Homer, NY, about 25 min northeast of Ithaca near
Cortland) is a bit farther out than this app's usual Cayuga/Seneca/Keuka Lake scope, but it
was added because a user specifically registered it with the "+ Add Venue" button — a
reminder that adding a venue there only saves its name and location for filtering/distance,
it does **not** automatically pull in shows; those still have to be researched and added to
`shows.json` by hand (or asked for), which is what happened here. A couple of same-time
listings on Bandsintown (e.g. two acts both shown at 8 PM the same night) were merged into
one entry where they looked like the same show described two ways, rather than assumed to
be two simultaneous events.

### Venue audit: three venues with no shows (checked, not overlooked)

Three other user-added venues — **Americana Winery**, **La Tourelle**, and **The Boatyard
Grill** — show up in the dropdown but have zero entries in `shows.json`. That's not an
oversight; each was checked and none currently has a confirmed upcoming show:
- **Americana Winery** (4367 East Covert Road, Interlaken) — under new ownership and
  mid-remodel; no reliable current schedule
- **La Tourelle** (1150 Danby Rd, Ithaca) — its own listing says "no upcoming events scheduled"
- **The Boatyard Grill** (525 Taughannock Blvd, Ithaca) — runs a real "Summer Music Series"
  (confirmed lineup of ~13 bands), but the 2026 season already ended Sept 4; nothing
  scheduled again until presumably next summer

All three also had imprecise saved locations (all three had defaulted to the same generic
"Town of Ithaca" point because whatever was typed when adding them didn't geocode cleanly)
— that's now fixed with their real addresses in `venues.json`. Re-check these periodically;
if a real show gets announced, add it to `shows.json` the normal way.

**Hopshire Farm and Brewery** (1771 Dryden Rd, Freeville, NY, about 15 min north of Ithaca)
— another user-added venue, this one did have a real, current schedule: [its own events
page](https://hopshire.com/hopshire-events/) lists a confirmed Thursday-night lineup through
November. Added 11 shows (Sep 18 – Nov 20); a couple from earlier in September had already
passed and were left out. Its saved location was also imprecise (village-level, not the
actual farm address) and has been corrected in `venues.json`.

**The Inn at Taughannock** (2030 Gorge Rd, Trumansburg, on Cayuga Lake near Taughannock Falls)
— a real venue running "Tuesdays at Taughannock" (live music, $25 burger-and-a-drink, 5-8 PM
in their Enchantment Garden, now in its 4th season). This was initially left with no shows
added — every date found via inntfalls.com, Tompkins Weekly, and Downtown Ithaca listings was
already in the past, and none of those sources named a performer past Sept 1. It was
[flxmusic247.com](https://flxmusic247.com/) that finally confirmed the series is still
running: 3 shows added (Sep 22, Sep 29, Oct 6) with named performers, time inferred as 5:00 PM
to match the series' own stated start time since flxmusic247's calendar view didn't repeat the
time for each date.

**[flxmusic247.com](https://flxmusic247.com/)** — a calendar aggregator covering the *entire*
Finger Lakes region (it explicitly includes Canandaigua, Honeoye, and Skaneateles Lakes, plus
Lake Ontario and Wayne County — all well outside this app's scope). Only entries clearly
within Cayuga/Seneca/Keuka Lake country or already-covered venues were pulled in. Added, besides
the Inn at Taughannock shows above:
- Gerard Burke and Shin Hollow at the **Trumansburg Farmers Market** (new venue — Wednesdays
  4-7 PM in season at Trumansburg Village Park; exact park coordinates weren't separately
  geocoded, so its location is village-level)
- Cisco & The Soul Benders at O'Malley's Lakeside Tavern
- Jim Kerins and River Lynch at Idol Ridge Winery & Alder Creek Distillery (time inferred from
  that venue's other listed shows, since flxmusic247's calendar cell didn't repeat it)
- Mike & Angie and ROC Street, both part of an "Idol Ridge Hot Air Balloon Weekend" event

This aggregator's calendar view also cross-confirmed several existing entries as accurate
(Tate Williams, Liam Lawson, Major Keys Trio, the Hosmer Harvest Fest show), and listed several
more bands without naming a venue clearly enough to add confidently — those were left out
rather than guessed.

**Airy Acres Vineyard** (8011 Footes Corners Rd, Interlaken, on Cayuga Lake) — another
user-added venue with a real, complete schedule on [its own site](https://airyacresvineyard.com/upcoming-events/):
a Saturday-afternoon music series running June through September. Only the two dates still
upcoming (Sep 19, Sep 26) were added; everything from June through mid-September had already
passed. Its saved location was also imprecise and has been corrected via the new "⚙ Manage"
rename tool (see below) instead of by hand — a good real-world test of that feature.

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

### Refresh pass (September 19, 2026)

Re-checked every venue's original source for anything newer than what was already listed.
Most had nothing new (their schedules simply hadn't been updated since the last check) —
two genuinely had more:
- **Montezuma Winery** — one more "Tunes and Tots" date, Nov 13 (Major Keys Trio)
- **Two Goats Brewing** — 12 more shows running Nov 6 through Dec 18, extending its schedule
  well into December

One near-miss worth noting: Ventosa Vineyards' page appeared to show a December schedule
extending to Dec 30, but on closer inspection those specific dates were leftover from
**December 2024**, not 2026 — the page hadn't been updated for this year that far out. Nothing
was added from that; a source showing a date range isn't the same as it being confirmed for
the current year, so it's always worth checking the year explicitly, not just the month/day.

**[Bandsintown's Ithaca city page](https://www.bandsintown.com/c/ithaca-ny)** — checked for
the first time this pass (previously only individual venue pages on Bandsintown had been used,
never this broader city view). Like flxmusic247, its "Ithaca" radius pulls in Syracuse,
Auburn, and other clearly-too-far cities, so only in-scope venues were pulled from it. This
revealed a real gap: **State Theatre of Ithaca** (107 West State Street, downtown Ithaca) — a
real, sizable venue this app had somehow never included. Added 5 shows there, mixing music and
music-adjacent events consistent with how Homer Center for the Arts already handles it
(Of Monsters and Men, The Beatlemaniacs, Judy Collins, and — following the same judgment call
as Garrison Keillor and Welcome to Night Vale at Homer — Ira Glass and Fred Armisen's
music-themed show). Two pure stand-up sets (Brad Williams, Aziz Ansari) and two Ithaca Ballet
dance performances were left out as outside a live-*music* app's scope.

This same check also surfaced touring acts at venues already in the list: **Anberlin** and
**Gregory Alan Isakov** at Point of the Bluff Vineyards, **Lettuce** at Smith Opera House, and
**Rituals of Mine** at Homer Center for the Arts — all confirmed via their own ticketing pages,
not just the aggregator listing.

### Followed-band audit

Checked every band followed via "+ Add Band" for real upcoming shows. One found a real date:
**The Yardvarks** are playing Ithaca Porchfest tomorrow (Sep 20) at a specific porch — 917 N
Cayuga Street, 3:00 PM — confirmed via [John Simon's own gig calendar](http://www.johnsimonmusic.com/gig/).
This is an exception to skipping Porchfest as a whole: unlike the festival's 174 other acts,
this one has a specific address, time, and was directly relevant to a followed band, so it got
its own venue entry rather than being lumped into the festival-wide exclusion.

Two follow-ups worth knowing about:
- The followed entry is spelled **"The Yaardvarks"** (extra "a"), but the real band's name is
  **"The Yardvarks"** — that's how it's spelled in `shows.json` now, so the follow won't match
  this show until the followed entry is corrected. Use "⚙ Manage" → Rename to fix it.
- **John Simon** is also a real, followed band with zero *directly* matching shows — but he's
  the same performer already appearing as "John Simon, Dee Specker & Friends (Sunset Music
  Series)" at Six Mile Creek Vineyard (Sep 24). Local Finger Lakes musicians often play under
  several rotating group names (John Simon also plays in Radio London), so an exact-name match
  can miss real overlap like this.

No confirmed upcoming date was found for **The Dart Brothers** or **Radio London** — both are
real, active local bands, but nothing dated could be confirmed from their own channels or
listings at research time.

### Refresh pass (September 20, 2026)

Re-checked every venue's own source (Six Mile Creek, Buttonwood Grove, Ventosa, Wagner, Grist
Iron, Two Goats, Hazlitt, cayugawinetrail wineries, State Theatre of Ithaca, Hopshire) plus the
flxmusic247 aggregator, one day after the previous refresh. Nearly everything matched exactly
what was already listed — expected, given how recent the last pass was — but two things were
worth acting on:

- **Landon's Pub & Pizza** (110 W 4th St, Watkins Glen, NY — south end of Seneca Lake, well
  within this app's existing wine-country coverage) is a new venue, found via flxmusic247: 2
  confirmed shows, **Yayle Hues** (Oct 3) and **Bad Bear** (Oct 10), both 8:00 PM. Its exact
  street address didn't geocode cleanly, so it uses village-level coordinates for Watkins Glen
  instead (same fallback used for Trumansburg Farmers Market).
- The Sep 27 "Oasis Sunday Music" slot at The Oasis at Hazlitt 1852 Vineyards was confirmed by
  flxmusic247 to have a named performer, **Tink Bennett**, that Hazlitt's own site didn't spell
  out — updated in `shows.json` to "Tink Bennett (Oasis Sunday Music)" to match how other
  recurring-series entries in this file already name the actual performer.

Three other flxmusic247 leads were checked and left out as out of scope, consistent with this
app's existing radius: **ONCO Fermentations** (Tully, NY — near Syracuse, not Finger Lakes wine
country), **Smokin' Tails Distillery** (Phelps, NY — Canandaigua-area, already an excluded
region), and **The Trestle** (Sodus Point, NY — Lake Ontario, already an excluded region).

State Theatre of Ithaca's own calendar added two new dates since the last check — **Brad
Williams** (Oct 8) and **Chris Fleming** (Oct 23) — but both are stand-up comedy, not music, so
they were left out for the same reason Aziz Ansari's set there already was.

Bandsintown's Ithaca city page and ithaca.com's live-music listing didn't return usable event
details this pass (both returned only page chrome, no event data, to the fetch tool used) —
worth trying again manually next time if a fuller check is needed.

### Refresh pass (September 22, 2026)

Re-checked the venues most likely to have updated on a short, 2-day cycle: Six Mile Creek,
Buttonwood Grove, Ventosa, Wagner, Grist Iron, Two Goats, Hazlitt, Hopshire, the
cayugawinetrail wineries (Montezuma, Hosmer, Lucas), flxmusic247, State Theatre of Ithaca, and
Airy Acres. Most matched what was already listed — two real additions:

- **Ventosa Vineyards** — its lineup page now runs a confirmed December schedule (previously,
  the Sep 20 refresh found what looked like December dates but were suspected leftovers from
  2024). This time the December dates were verified by checking the page directly in a browser:
  they continue the same unbroken weekly-Wednesday sequence as the already-confirmed
  September–November dates (each entry exactly 7 days after the last, correct for Wednesdays),
  so they're a real 2026 schedule, not stale data. Added 5 shows, Dec 2 – Dec 30: Jon Lamanna,
  Just Joe, Mr. Monkey Band, Cami Clune (a Voice contestant and the Buffalo Sabres' anthem
  singer), and The Other Side of Normal.
- **Montezuma Winery** — one more Cayuga Wine Trail date beyond what was listed, Nov 20 (John
  Lamanna), confirmed via its own event page on cayugawinetrail.com.

flxmusic247 also surfaced a few leads outside this app's scope and were left out: ONCO
Fermentations (Tully, near Syracuse), Smokin' Tails Distillery (Phelps, Canandaigua area), The
Trestle (Sodus Point, Lake Ontario), and Birdhouse Brewing (Honeoye, Honeoye Lake — one of the
regions flxmusic247 itself says is outside Cayuga/Seneca/Keuka wine country).

Bandsintown (both the Ithaca city page and the Homer Center for the Arts venue page) returned
HTTP 403 to the fetch tool this pass — it's started blocking the automated fetcher outright,
not just returning empty chrome like before. ithaca.com's live-music listing again returned
only page chrome, no event data. Both are worth checking manually or via a browser next time.

### Bandsintown, signed in (September 22, 2026)

Bandsintown's automated-fetch block above was worked around by signing into the site directly
in a browser (with the site owner's own account, at their request) instead of the fetch tool,
which unblocked the full Ithaca-area city page — a much richer source than the individual
venue pages used previously, surfacing touring acts and local bookings this app's usual
sources don't carry yet. Checked everything on the page dated through Sep 25, 2026 and kept
only what's confirmed with a real date, performer, and venue address, and falls within the
existing Cayuga/Seneca/Keuka Lake scope:

- **Graham Nash** at Smith Opera House (listed on Bandsintown as "Smith Center for the Arts,"
  same address, 82 Seneca St, Geneva) — Sep 23
- **River Lynch** at Ventosa Vineyards, Sep 23, 6 PM — this resolves what Ventosa's own site
  still lists as a "TBD" slot for that date; Bandsintown's own listing names the performer and
  matches the venue's address and time exactly, so it's added as confirmed
- **River Lynch** (solo) at Point of the Bluff Vineyards, Sep 24, 5 PM — for their Farmers
  Market
- **River Lynch** (solo) at a new venue, **Keuka Lake Vineyards** (8872 County Route 76,
  Hammondsport — a short distance from the already-listed Point of the Bluff Vineyards, same
  road), Sep 25, 5 PM
- **Caleb Liber** at a new venue, **Glenora Wine Cellars** (5435 NY-14, Dundee — a well-known
  Seneca Lake Wine Trail winery this app had never included), Sep 23, 5 PM
- **Marye Lobb** at a new venue, **Tabora Farm & Winery** (4978 Lakemont-Himrod Rd, Dundee, on
  Seneca Lake's west side), Sep 24, 5:30 PM
- **Nate Michaels Music** at two new venues: **Lake Life Brewery** (Penn Yan, on Keuka Lake)
  Sep 23, 6 PM, and **Watershed Brewing Company** (Geneva, on Seneca Lake) Sep 25, 5 PM

A handful of other Bandsintown leads from the same date range were checked and left out as
out of scope, consistent with this app's existing radius: The Cider Mill (Syracuse, despite
the name sounding like a Finger Lakes spot), The Neat Whiskey Bar (Jamesville, Syracuse area),
JD at Danzer's Pizza Pub (Syracuse), and Clifton Springs Country Club (Canandaigua area).
Parker's 129 (Auburn, north end of Cayuga Lake) was also left out — plausibly close enough to
belong, but farther out than this app has gone without a specific reason to include it, so it
was treated as a judgment call to skip rather than guess.

The rest of the page's touring-act promotions (Gregory Alan Isakov, Of Monsters and Men,
Anberlin at Point of the Bluff) already matched existing entries — good cross-confirmation that
those dates are accurate. Everything else on the page (Empower Federal Credit Union
Amphitheater, The Song & Dance, The 443 Social Club, del Lago Resort & Casino, Funk 'n Waffles,
etc.) is Syracuse-area or otherwise outside this app's wine-country/Ithaca scope and was
skipped, same as prior passes.
