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
- **Distance filter** — the location box defaults to zip code 14850 (Ithaca) on page load, so
  distance badges and the filter are ready immediately with no setup. Type a different zip
  code, town, or address and click "📍 Set Location" (or press Enter) to change it. This looks
  up that place using [OpenStreetMap's free Nominatim geocoding service](https://nominatim.org/)
  to turn it into coordinates, then does all the distance math in your browser using the venue
  coordinates in `venues.json` — no location data is stored anywhere, it just lives in the
  page until you reload (at which point it resets back to the 14850 default). Once set, every
  show gets a distance badge, and the "Any Distance" dropdown next to the location box narrows
  the list to shows within 5/10/15/20/30/50 miles. Clicking "🔄 Refresh" reloads the show data
  without resetting a location you've changed.
- These combine with the search box and venue dropdown, so you can e.g. search "blues",
  filter to next 3 days, and narrow to shows within 15 miles all at once.
- **Favorites (★)** — click the star next to any band/artist name to mark them a favorite
  (saved in your browser). Favorited-band shows always float to the top of the list, ahead
  of everything else, regardless of the current sort or filters, and get a highlighted
  border. They're also starred and moved to the top of the band/artist dropdown.
- **🔄 Refresh** — re-loads `shows.json` and `venues.json` from disk without a full page
  reload, so your search text, filters, sort, and location stay put. Useful after
  `shows.json` gets updated (by hand or by Claude) while the page is already open — a plain
  browser reload works too, but this keeps your current view intact.

## Visitor stats (private)

Two ways to see how many people have visited the live site — neither is visible to visitors,
both are only meaningful to you:

- **GitHub's built-in traffic graph**: go to the repo on GitHub → **Insights** → **Traffic**.
  Shows visits and unique visitors for the last 14 days, plus top referrers and paths. No setup,
  only visible to you (or anyone else with access to the repo).
- **Lifetime running total**: the page silently records one hit per page load (not tied to the
  🔄 Refresh button, so re-checking the app yourself doesn't inflate it) via a free, no-account
  counting service. Check the current total anytime by opening:
  `https://abacus.jasoncameron.dev/get/ithaca-live-music-mdelrosso/visits`
  That returns raw JSON like `{"value": 42}` — not a public page, just a URL only you know to
  check. This depends on a third-party service staying online; GitHub's traffic graph above is
  the more durable option if this one ever goes away.

## Data sources

Every entry in `shows.json` is a real, researched show (no placeholder or made-up data). Two
standing rules for anyone (human or AI) adding to this file:

- **Never fabricate a date, performer, or venue.** If a real source confirms the show but not a
  specific time, use `"See Schedule"` (or similar) for `time` rather than guessing one.
- **Don't trust a blank-looking page.** A plain text fetch of a venue's own site can come back
  nearly empty for a JS-rendered site or one built on Google Sites/Wix/Squarespace — this has
  caused a real miss (Sep 29, 2026: The Boar's Nest 414's own "MUSIC SCHEDULE" page returned
  almost no text via a plain fetch and got wrongly logged as "no calendar found," when a full
  month-by-month schedule was one click away in the nav menu). Before concluding a site has no
  calendar, open it in a real browser, check a screenshot or the accessibility tree, and look
  for a dedicated events/schedule/calendar nav link — schedules are very often on a separate
  page, not the homepage.
- **Verify a recurring source's actual year before trusting it.** Weekly/annual sources (concert
  newsletters, festival listings) often get reused across years with near-identical titles and
  URLs — this has caused a real near-miss (Oct 1, 2026: a Jim Catalano newsletter titled "CNY
  Concert Calendar: Oct. 10-14" looked current but was actually published Oct 10, **2025**; its
  "Saturday, Oct 11" date didn't even match 2026's calendar, where Oct 11 is a Sunday). Before
  trusting a date from this kind of source, confirm its actual publish date/byline, not just the
  month/day in the title.

Pulled from each wine trail's or winery's own event listings as of September 17, 2026:

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

The rest of the page's touring-act promotions (Gregory Alan Isakov, Of Monsters and Men,
Anberlin at Point of the Bluff) already matched existing entries — good cross-confirmation that
those dates are accurate. Everything else on the page (Empower Federal Credit Union
Amphitheater, The Song & Dance, The 443 Social Club, del Lago Resort & Casino, Funk 'n Waffles,
etc.) is Syracuse-area or otherwise outside this app's wine-country/Ithaca scope and was
skipped, same as prior passes.

One correction from this pass: Bandsintown's own event page for Anberlin at Point of the Bluff
Vineyards (Sep 27) also names **Switchfoot** as a co-headliner — `shows.json` now lists that
entry as "Switchfoot & Anberlin" instead of Anberlin alone.

### Deep flxmusic247 calendar audit (September 22, 2026)

Asked directly whether this app had *all* the local info flxmusic247.com carries, and the
honest answer was no: earlier passes only fetched the site's homepage highlight boxes (a
handful of genre-sorted teasers), never its actual interactive event calendar, which only
renders its full day-by-day contents in the browser (a WordPress "Stachethemes Event
Calendar" widget) — a plain fetch tool can't see it. Opened it in a real browser instead and
clicked into every day with hidden "+N more" events from **Sep 21 through Oct 10, 2026**,
reading each event's real venue name, street address, and time directly from the calendar's
own data (not just the homepage teasers).

### John Simon follow-up: full calendar check (September 24, 2026)

User reported following "John Simon" but not seeing some of his dates. Root cause was two-fold:

1. **Missing data** — earlier passes only spot-checked johnsimonmusic.com's gig page rather than
   paging through its full calendar. Went through all four calendar pages this time and found
   several real, confirmed dates not yet in `shows.json`: John Simon & Der Walters at the
   **Ithaca Farmers' Market** (Oct 7, Green Star Co-op's annual meeting), **Radio London** at
   **The Inn at Taughannock** (Oct 13 — this also resolves the earlier "no confirmed date found
   for Radio London" gap from the Sep 19 audit), **The Yardvarks** at a new venue **Kendal at
   Ithaca** (Oct 22), John Simon & Der Walters again at **Homer Phillips Free Library** in Homer
   (Nov 20), a Busking For Justice benefit at **Cafe DeWitt in the DeWitt Mall** (Dec 4), and a
   holiday benefit concert with Dee Specker, Mark Rust, and Russ Posegate at **First Unitarian
   Church Society** (Dec 19). One entry, "The Band Called Revival" (Oct 31, Trumansburg American
   Legion), was left out — nothing on the page or elsewhere confirms it's actually a John Simon
   project, and "Immigrant Solidarity Benefit" (Oct 16, CSMA) was also skipped since it lists
   "multiple acts" with no specific performer named.
2. **A real bug** — the band filter dropdown only matched shows by *exact* name equality, so
   following "John Simon" could never match variant billings like "John Simon & Der Walters" or
   "John Simon, Dee Specker & Friends...". Fixed in `script.js` so the band filter now does a
   case-insensitive substring match, same as the search box already did. This should also help
   other followed acts that play under rotating group names (The Yardvarks, Radio London, etc.).

### Shared automatic band tracking (September 24, 2026)

Previously, bands followed via "+ Add Band" were saved only in the browser's `localStorage`,
which meant the scheduled every-3-days refresh task couldn't see them and never searched for
their shows automatically — it only re-checked venues already in `venues.json`. Added a new
shared file, `followed-bands.json` (a flat JSON array of names), which the app now fetches
alongside `shows.json`/`venues.json` and merges into the followed-bands list on every page load.
The scheduled task's instructions were also updated to search each name in this file for new
confirmed shows every run, the same way it already does for venues.

This does **not** make "+ Add Band" itself trigger a search — that's still impossible from a
static site's client-side JS (confirmed earlier via a real CORS error testing Bandsintown's
API). A band added through the button is still local-only and dropdown-visible, but won't be
covered by the automatic refresh until it's added to `followed-bands.json` — currently done by
asking for it directly, same as how new venues get promoted into `venues.json`. Seeded the file
with the four bands already established as followed in this app: John Simon, The Yardvarks, The
Dart Brothers, and Radio London.

The "⚙ Manage" panel's band list was also scoped to only show bands from `localStorage` (not the
merged shared list), since renaming/deleting a shared, automatically-tracked band there wouldn't
actually update `followed-bands.json` and would just cause it to reappear duplicated on the next
refresh.

### Venue check: 5 & Dime and Americana Winery (September 24, 2026)

User asked to add both — both were already in the app. Checked each for anything not yet listed:

- **5 & Dime** (619 W State St, Ithaca) already had one show (London McDaniel & Lava, Sep 24).
  Found one more real, dated show via Jim Catalano's syndicated CNY concert calendar:
  **Mosaic Foundation**, Sep 25, 9-11 PM.
- **Americana Winery** (Interlaken) still has zero confirmed shows. Checked its own site
  (americanavineyards.com/events.html — no events listed), its booking agency's page
  (Kevin Black Presents, which only confirms they book the venue generally, no dates), and its
  Facebook page (Events tab requires login to view, so nothing could be confirmed from it).
  Same result as the original audit — this venue's music calendar isn't published anywhere
  publicly accessible right now.

This also prompted a scope cleanup: flxmusic247 organizes its coverage into 9 color-coded
sub-regions. This app had already been including 7 of them (Ithaca, Cayuga Lake, Between the
Lakes, Seneca Lake-Geneva, Keuka Lake, Watkins Glen) plus Homer/Cortland as a one-off precedent,
while excluding only 2 as genuinely different lake regions (Canandaigua Lake area and Wayne
County/Lake Ontario) alongside Skaneateles Lake, Syracuse proper, Tully, and Phelps. The
remaining sub-region, "Top of the Lakes" (Seneca Falls/Waterloo/Auburn — the north end of
Cayuga Lake), had been treated inconsistently in earlier passes (Parker's 129 in Auburn was
skipped as "too far" even though Quarry Ridge Winery, a similar distance away on Cayuga's east
shore, was already included). That inconsistency is now resolved: Waterloo and Auburn are
in-scope like the rest of Cayuga Lake, since they're the same lake and the same general
distance as venues already covered. Canandaigua/Honeoye/Skaneateles/Wayne County/Syracuse
remain excluded as genuinely different lakes/areas outside this app's Finger Lakes wine-country
triangle.

This pass added by far the most in a single session: **20 new venues** and roughly **60 new
shows**. New venues, all confirmed in-scope by address:

- **Ithaca proper**: Liquid State Brewing Company, South Hill Cider, 5 & Dime, Danby Food &
  Drink (this resolves a real gap — Ithaca's own city venues were thin in this app before)
- **Brooktondale** (just south of Ithaca): Brookton's Market
- **Burdett/Hector** (already-covered Seneca Lake brewery cluster): Atwater Winery, Solera Tap
  House, Either Oar Wine, Whiskey, & Cheese Bar, Keg & Barrel Brewing Co. (Dundee)
- **Hammondsport/Keuka Lake**: Weis Winery, Steuben Brewing Company, Domaine Leseurre Winery,
  Bully Hill Winery, Living Roots Wine & Co.
- **Penn Yan/Keuka Lake**: Abandon Brewing Company, Seneca Stag Brewing Co.
- **Geneva/Seneca Lake**: WeBe Brewing Company
- **Himrod/Seneca Lake**: Showboat Motel, Restaurant & Bar
- **Watkins Glen**: Kookalaroc's Bar and Grill
- **Waterloo** (Cayuga Lake, newly in-scope): Muranda Barn
- **King Ferry** (Cayuga Lake, near already-covered Bright Leaf Vineyard): Aurora Brewing Co.
- **Cortland/Homer** (same precedent as Homer Center for the Arts): Homer Hops

A few notable single shows surfaced along the way: **Samara Joy and her Septet** (a
Grammy-winning jazz vocalist) at Smith Opera House Oct 7, and the **Rochester Metropolitan
Jazz Orchestra** at Domaine Leseurre Winery Oct 3. Also, La Tourelle — previously audited as
having "no upcoming events scheduled" per its own site — turns out to have a regular live-music
series (billed as "Firelight Camps + La Tourelle Hotel, Bistro + Spa") that just wasn't on its
own website; flxmusic247 had it. Two shows there were added (10 Square Miles Sep 22, Carl &
Jack Sep 29).

One conflict surfaced and was resolved conservatively: flxmusic247 listed "Quona Hudson" playing
Ventosa Vineyards on Sep 23, 6 PM — the exact same date/time/venue Bandsintown had just listed
for "River Lynch" (added earlier this same session). Two different named performers for one
slot is a real contradiction, not a rounding error, and Ventosa's own site still marks that date
"TBD." Rather than guess which aggregator is right, the River Lynch/Ventosa entry was removed;
that date is left unconfirmed until Ventosa's own site names someone.

Generic listings without a named performer (recurring "Open Mic" nights, unnamed "Live Music"
placeholders, "Jazz Night!") were skipped throughout, per this app's standing rule against
placeholder entries.

This audit covered Sep 21 – Oct 10 in full calendar detail. flxmusic247's calendar runs weeks
further out than that with similar density — a future pass should continue the same day-by-day
click-through for the rest of October and into November before the outdoor wine-country season
winds down.

### flxmusic247 audit, continued to 60 days out (through November 21, 2026)

Picked up exactly where the previous pass left off and clicked through every remaining day from
**Oct 11 through Nov 21, 2026** (60 days from this audit's start date), completing the same
day-by-day calendar read for the full window. Event density drops off noticeably past
mid-November as the outdoor wine-country season winds down — many days in that stretch had no
events at all, which is expected, not a sign anything was missed.

This pass added **1 new venue** and **28 new shows**:

- **Ryan Vineyards** (8990 Boyd Hill Rd, Pulteney, NY — Keuka Lake area, a fourth-generation
  grape farm that only opened its winery in 2025) turned up repeatedly under the odd address
  label "Ryan Vineyards Rd" on flxmusic247, which made it look like an ambiguous or
  unverifiable location at first. A web search confirmed it's a real, named venue, not a
  formatting glitch — it now has 7 shows across the audited window (Ed Sawester, Frank Madonia,
  Jim E Leggs Trio, Brad Ordway, Better Halves, Evan Dillon Band, States Apart, Tony Serdula).
  Its exact coordinates couldn't be geocoded (no street-level match), so it uses Town of
  Pulteney's center point as a fallback, same as a couple of other entries already do.
- One followed-band gap closed: **Radio London** — noted in an earlier pass as having "nothing
  dated confirmed" — is playing Inn at Taughannock Oct 13, 5 PM.
- The rest of the new shows are mostly single dates at venues already in this app (Idol Ridge,
  Seneca Stag Brewing, Solera Tap House, Geneva On The Lake, Landon's Pub, Trumansburg Farmers
  Market, Temperance FLX, The North Farm, Hosmer Estate Winery, Point of the Bluff Vineyards,
  Living Roots Wine & Co., Muranda Barn).
- One backfill: Sep 28's "Tim Braley" (previously skipped for lack of a location) turned out to
  be at Abandon Brewing Company — added retroactively once the venue was confirmed.

As before, generic listings without a named performer, and anything in Canandaigua/Honeoye/
Skaneateles/Wayne County/Syracuse/Tully/Phelps, were skipped. With this pass, the flxmusic247
calendar has now been read in full day-by-day detail from Sep 21 through Nov 21, 2026 — the
entire 60-day window from this audit's start date.

### Two new venues: Bike Bar and Stone Bend Farm (September 24, 2026)

User asked to add both by name. Neither was in the app yet; both turned out to be real,
active live-music venues.

- **Bike Bar** (314 E State St Ste 100, Ithaca) — a bicycle-themed taproom in downtown Ithaca.
  Its own site has no calendar, but Jim Catalano's syndicated CNY concert calendar confirmed
  **Joe Hayward and Friends** (old-time tunes), Sep 29, 7 PM.
- **Stone Bend Farm** (196 Porter Hill Rd, Newfield) — a small farm-to-table venue in a
  geothermal greenhouse just outside Ithaca that books live music weekly, Fri-Sun. Its own site
  (stonebend.com) has a full events calendar; clicked into each individual event page rather
  than trusting the summary list, since an earlier pass (Timeriders) showed the same event title
  can be reused across different dates/years — the summary card's date doesn't always match the
  linked page without checking. Added 11 confirmed shows through Dec 18, plus one out in
  April 2027: FLX Squares (Community Square Dance, recurring monthly), Freight/Wise Bones/Radio
  Saints, The Timeriders, Cielle on Solid Ground, Vicious Fishes & Friends, Skeleton Hands &
  Practice At (Halloween), Bluegrass Alley, The Small Kings w/ Ded Ballz, Louiston (ticketed,
  $15), and Practice At again for a 4/20 event. Two listed events were skipped: "Halloween Gala
  w/ Suicide Prevention Services" names no performer, and "Protest Show featuring tbd" explicitly
  has no confirmed act yet.

### Dynamic "last updated" date (September 24, 2026)

The header's "Events last updated" line was previously a hardcoded string in `index.html` that
had to be manually edited (and had already gone stale — it said Sep 22 while data had since
changed). Replaced it with a real data file, `last-updated.json` (`{"date": "YYYY-MM-DD"}`),
which the app now fetches and formats on every load. This file's date gets bumped to the current
date any time a real new show, venue, or followed band is added — whether by a manual request
in a chat session or by the scheduled refresh task, whose instructions were also updated to bump
it after any run that actually finds something new (a no-op run leaves it untouched).

### New venue: Garrett's Brewing Company (September 27, 2026)

User asked to add this by name. Real venue at 1 W Main St, Trumansburg — a microbrewery open
since 2019. Its own site (garrettsbrewing.com/events) has a full dated calendar; added 4
confirmed shows with named performers: Peregrine (Oct 2), Working Folks String Band (Oct 9),
Cast Iron Quartet (Oct 16), and TOiVO for a "Sock Hop Sunday" (Oct 18). Skipped the recurring
weekly open mic (no specific performer), a "Songwriter's Workshop" (a class, not a performance),
and a Halloween costume party (no band named).

### Completeness audit: scanning for entirely missing venues/bands (September 27, 2026)

Asked to scan the whole Finger Lakes region (not just refresh dates at venues already known)
for real venues or acts missing from the app entirely. This pass prioritized breadth over
re-confirming what prior passes already covered.

**Two pre-existing data bugs fixed first:** `shows.json` already had 4 real shows at **Solera
Tap House** and 1 at **Either Oar Wine, Whiskey, & Cheese Bar** (both added to the Burdett/Hector
brewery cluster in an earlier pass), but neither venue actually existed in `venues.json` — a
copy/paste gap that silently broke their distance badges ever since. Both addresses were
found (4393 NY-414, Burdett and 6075 NY-414, Hector) and geocoded; they're now in `venues.json`
correctly.

**New venues found and added, each with at least one real, named, dated show confirmed from
the venue's own site or ticketing page:**

- **Auburn Public Theater** (8 Exchange Street, Auburn, NY — Cayuga Lake, "Top of the Lakes"
  area) — a real, active performing-arts venue this app had never included, despite Auburn
  being in-scope since the Sep 24 scope cleanup. Its own events page lists a mix of theater,
  cinema, and music; pulled 5 confirmed music dates (skipping the theater/cinema/class listings
  and a generic "Hamilton Karaoke and Sing Along"): Ethan Setiawan & Fine Ground (Oct 9, a
  Boston bluegrass quintet), tribute act Tony Kishman performing "Live and Let Die: The Music
  of Paul McCartney" (Oct 15), Mark Doyle and the Maniacs performing a Rolling Stones tribute
  set (Oct 18), and two "Sunday Music Series" installments naming specific local acts, Lake
  Affect (Oct 25) and Because Dinosaurs (Nov 22). Times/dates cross-confirmed via the venue's
  own SeatFun ticketing pages, not just its event-listing page.
- **del Lago Resort & Casino** (1133 NY-414, Waterloo, NY — same "Top of the Lakes" area as the
  already-listed Muranda Barn) — a large casino venue with a full confirmed touring-act
  schedule on its own site (dellagoresort.com/entertainment), missed entirely until now despite
  Waterloo being explicitly in-scope. Added 17 shows running Oct 3, 2026 through Mar 13, 2027,
  all in "The Vine Showroom": Dokken w/ Lynch Mob, Daughtry, 2 Chainz, Night Ranger, Kansas,
  Three Dog Night, and several named tribute acts (a Neil Diamond experience, Bad Sneakers/
  Steely Dan, ZOSO/Led Zeppelin, Almost Queen, Thunderstruck/AC-DC, Tusk/Fleetwood Mac, The
  Simon & Garfunkel Story), among others. This is by far the biggest single venue this app has
  added — skipped one non-music listing on the same page (RuPaul's Drag Race Werq the World
  tour).
- **The Cherry Arts** (102 Cherry Street, Ithaca) — a real Ithaca performing-arts venue; one
  confirmed show, Tom Jolu (Oct 2), found via Bandsintown's Ithaca city page and cross-confirmed
  by a second independent search.
- **The Watering Hole** (1307 E Lake Rd, Cortland, NY — Homer/Cortland precedent) — a real bar;
  one confirmed show, MODAFFERI (Oct 17).
- **Prison City North Street Brewery** and **Prison City Pub & Brewery** (251 North Street and
  28 State St, Auburn — the same brewery company operates two separate addresses, confirmed as
  genuinely different locations, so both were added) — found via the brewery's own detailed
  events calendar. Added Shawn Halloran's "Summer Music at the Farm" set (Sep 27, North Street
  location) and Mojo Combo at "The Armory," a speakeasy under the State St. location, as part of
  a Halloween "Spookeasy" event (Oct 30). Skipped an "Allman Brothers Tribute Night" at the same
  venue — the listing names the tribute theme but never names the actual performing band, so it
  didn't clear this app's no-generic-listings bar.

**Two bonus shows found at already-listed venues** while cross-referencing Bandsintown's Ithaca
city page (left in since they were already found, though this app's separate 3-day refresh task
normally handles this): Brian Lindsay Band at Muranda Barn (Sep 27 — Bandsintown lists this
address under "Muranda Cheese Company," the shop next door on the same property, but it's the
same venue already in `venues.json`), and a second, later-dated Lone Gonzo show at Geneva On The
Lake (Nov 25, "Thanksgiving Eve" — the existing Sep 29 Lone Gonzo entry there is a different date,
not a duplicate).

**Checked and deliberately excluded:**
- **Cortland Beer Company** (16 Court Street, Cortland) — a real, active venue with live music
  most Fridays (confirmed named acts throughout September: In Too Deep, 4 Fellas & A 5th, Aiken
  Nadge, Crystal Vision, Modafferi, etc., all via its own site), but every one of those confirmed
  dates had already passed by Sep 27, and its interactive events calendar only shows dots for
  October with no way to see performer names without a booking/API access this session didn't
  have. Not added — per this app's zero-fabrication rule, a real venue isn't enough without a
  confirmed upcoming named act. Worth a follow-up check once its October flyers post to Facebook.
- **Outlet 111** (Penn Yan) — real bar with a "summer music series," but that season had ended
  and nothing dated/named was posted for fall.
- **Buried Acorn FLX Taproom** — turned out to be the same physical address (196 Porter Hill Rd,
  Newfield) as the already-listed Stone Bend Farm, just a different name Bandsintown uses for
  it; confirmed by the fact that its one listed show (Freight the Band, Oct 2) is the exact show
  already in `shows.json` under "Freight, Wise Bones & Radio Saints" at Stone Bend Farm. Not a
  new venue.
- **The Song & Dance**, despite showing up repeatedly on Bandsintown's "Ithaca, NY" city page
  with many confirmed acts, is actually located in Syracuse — same false-radius issue this app
  has run into before with that source. Also skipped from the same page for being Syracuse/
  Buffalo-area, not Finger Lakes: The 443 Social Club & Lounge, Funk 'n Waffles, Sharkey's Event
  Center, The Oncenter Crouse Hinds Theater, Kegs Canalside, Landmark Theatre.
- Also confirmed out of this app's established scope (Canandaigua/Naples area, already
  excluded): Levi Gangi and The Buddhahood, both playing the Naples Grape Festival; and 1911
  Tasting Room, which is actually in LaFayette, NY, near Syracuse, not the Finger Lakes.
- A "Calvary's Love" listing at a "First Baptist Church" was skipped — several churches with
  that name exist across this app's coverage area and the specific one couldn't be confirmed
  confidently, plus it reads more like a church choir program than a band booking.
- flxmusic247's calendar was spot-checked from where the last full day-by-day pass left off
  (Nov 22, 2026) through mid-December: event density has dropped sharply for the winter
  off-season, and everything found in that window (Ventosa Vineyards, Geneva On The Lake) was
  already confirmed in `shows.json` from earlier passes. No need for another full day-by-day
  read this cycle.

This pass added **6 new venues** (Auburn Public Theater, del Lago Resort & Casino, The Cherry
Arts, The Watering Hole, Prison City North Street Brewery, Prison City Pub & Brewery) plus fixed
2 pre-existing venues that were missing geocoding (Solera Tap House, Either Oar), and **29 new
shows** in total.

### New followed band: Bob Keefe and the Surf Renegades (September 28, 2026)

User asked to follow "Surf Renegades" and find their dates. The real band is **Bob Keefe and
the Surf Renegades**, a Finger Lakes-based surf rock act active since 2010. Their own site
(surf-renegades.com/where-we-re-playing) publishes a full year-by-year, hand-maintained tour
history going back to 2017 — an authoritative source that isn't on any aggregator this app has
checked (flxmusic247, Bandsintown, the CNY concert calendar). Added 4 confirmed upcoming shows:
Oct 2 at a new venue, **Iron Flamingo Barrel House** (Corning), Oct 10 at a new venue, **Knapp
Winery** (Romulus, Seneca Lake), Oct 17 at the already-listed Abandon Brewing Company, and Oct 24
at a new venue, **K-House Karaoke and Arts Hub** (Ithaca, a recently reopened downtown venue).
Skipped one listing, a private recording session with no public audience, dated "TBD."

Worth noting for future passes: this is a real gap-closing pattern, not a one-off. Small/local
acts that maintain their own detailed tour page rather than relying on aggregators are
effectively invisible to venue- or aggregator-based searches, however thorough — they can only
be found by searching for that act by name once someone names it.

### New followed band: 90 Proof (September 28, 2026)

User asked to add "90 Proof." This is a real, very active classic rock cover band (60s-90s) that
plays constantly around the southern Cayuga/Seneca Lake area — flxmusic247 alone turned up over
a dozen past bookings at Grist Iron Brewing, Homer Hops, O'Malley's Lakeside Tavern, The Inn at
Taughannock, The Boar's Nest 414, Tiki Bar North, Diamond on Seneca, Scale House Brewery, and
several venues not yet in this app (Birdseye Hollow Farm and Distillery, Stivers Seneca Marine,
Summerhill Brewing, Cedarwood, Lake Street Station). Despite that, **no confirmed upcoming date**
could be found: every dated listing turned up (flxmusic247, a direct web search, Grist Iron's own
current events page) was already in the past as of today. Their Facebook page's Events tab only
shows past events without logging in — the same access limit hit before with other bands' pages.
Added to `followed-bands.json` anyway so the scheduled refresh task keeps checking; no show added
yet since nothing dated could be confirmed.

### Night Eagle Cafe had zero shows (September 29, 2026)

User flagged that Night Eagle Cafe shows weren't appearing. Its only prior listings had been
past-dated ones removed in the Sep 27 cleanup, and nothing new had been found since — a real gap,
not a bug. The venue itself relaunched this year at a new location, the Lansing Area Performance
Hall (same address already in `venues.json`), under new management ("Night Eagle Productions").
Its own site (nighteaglecafe.org) publishes a full, dated 2026-2027 season with ticket links for
every show. Added 7 confirmed upcoming shows: Reverie Road (Oct 5), Cantrip (Oct 11), Vance
Gilbert (Oct 23), The Refugees (Nov 13), Connie Kaldor (Jan 30, 2027), and Garnet Rogers (Mar 5,
2027), all at Night Eagle Cafe — plus one show, a Celtic Christmas concert with Doyle, Ryan &
McAuley (Dec 10), that Night Eagle is producing at a different venue, the already-listed First
Unitarian Church Society. One listed show, The Kennedys' CD release date, was explicitly marked
"cancelled" on the site and skipped.

### The Boar's Nest 414 was missing entirely (September 29, 2026)

User asked why Boar's Nest shows weren't appearing. Root cause: this venue first surfaced during
the "90 Proof" band search (Sep 28) as one of that band's regular stops, but only that band's
angle was checked at the time — all its dates there were past, so the pass moved on without ever
auditing the venue itself. That's a real methodology gap worth flagging: finding a venue while
researching a specific band doesn't mean the venue's own full calendar gets checked. Added The
Boar's Nest 414 (5806 NY-414, Hector) as a venue.

First pass at finding a current show also missed the mark: flxmusic247, CNY Alive, Jim Catalano's
current-week calendar, and Facebook (blocked without login) all came up empty, and a first look
at the venue's own site (theboarsnest414.com) seemed to show no calendar at all — its homepage
barely renders any text on a plain fetch. That was wrong. The user pushed back, a second look with
a screenshot (not just a text scrape) found a "MUSIC SCHEDULE" nav link leading to a full
month-by-month calendar through November 2026, built as a Google Sites page whose content only
shows up in the accessibility tree, not a plain text scrape — the same class of miss as
flxmusic247's JS-rendered calendar documented earlier. Lesson: a page that looks empty on a first
check needs a screenshot or accessibility-tree read before concluding there's nothing there.

Added 3 confirmed October shows: **Dean Goble Band** (Oct 3), **Heartstrings** (Oct 10), and
**Bad Alibi** for a Halloween party (Oct 31). Skipped recurring Karaoke nights (not live
performers) and "The Dean's List," explicitly marked "CANCELLED" on the schedule. None of these
three had a specific start time published anywhere found, so `time` is set to "See Schedule"
rather than guessing — a first for this app, but consistent with never fabricating a specific
detail that isn't actually confirmed.

Bonus find while checking that week's Jim Catalano calendar: **Hillick & Hobbs Winery** (Burdett,
Seneca Lake) was also missing despite being in an already-covered cluster. Added with one
confirmed show, Fabi (Oct 1, 5-8 PM). Its exact street address didn't geocode to a precise point,
so it uses Burdett's town-level coordinates as a fallback, same as a few other entries already do.

### Bike Bar was missing a real show (October 1, 2026)

User flagged that Bike Bar's own site showed events not in the app. Applying the newly-documented
rule paid off: the homepage's "Events/Info & Hours" section doesn't render via a plain text fetch
(same JS-dependent-content issue as before, caught this time with a screenshot first instead of
concluding there was nothing there). Found a real show: **Jesse Collins Quartet**, Oct 1 (today),
7 PM — the site itself misspells it "Jesse Coliins," corrected here after independently confirming
the real band name and its existing track record playing Ithaca (South Hill Cider, Mix Art
Gallery). Everything else listed on the page (Sept 10-29) was already past. The site's list also
hadn't been updated past Oct 1 — nothing further out was listed — so Bike Bar will need another
check once their next batch of dates goes up.

### New venue: Ithaca Beer Company (October 1, 2026)

User asked to add this venue and its Sunday jam session. Ithaca Beer's own site
(122 Ithaca Beer Dr) has no events/calendar page at all — checked the full nav menu directly,
nothing there beyond a taproom food/drink menu. The recurring Sunday afternoon slot is real,
though: flxmusic247 and Jim Catalano's current-week concert calendar both confirm a standing
Sunday jazz gig at the Taproom, usually billed as the Jesse Collins Quartet (also seen as the
McCallip-Collins Trio) — this is "the Sunday jam session." Added the next confirmed date, Oct 4,
2:30 PM, via Jim Catalano's calendar.

### Liquid State Brewing Company was missing almost everything (October 1, 2026)

User asked why Oct 1/Oct 2 weren't showing — this venue only had a single show (NEO Project,
Oct 3) despite having a full, dedicated `/upcoming-events` page on its own site with a real
calendar running through December. A plain fetch of the summary list gives dates and titles but
no times, so each event's own page was opened individually (WebFetch worked fine here, unlike the
Boar's Nest/Google-Sites case) to confirm exact times, genres, and prices.

Added **16 confirmed shows** running Oct 1 through Nov 21: Veedabee, Honker, Cast Iron Cowboys w/
Dirt Turtles and Bottle Shop Boys, Today Is The Day/Wandering Oak (a metal/hardcore quadruple
bill), Irish Sessions with Six Mile Craic, Porch Couch & Alejandra Marie Diemecke, Rigometrics,
Ruby, New Planets, Ragged Sole, The Amalgamators, Fall Creek Brass Band, a Halloween dance party
with DJ Tuggle & DJ Logs, Posture w/ Timothy and Wise Bones, Eric Carlin's Half Dead (a Grateful
Dead Cornell '77 tribute), and a benefit night with Metasequoia, The Notorious Stringbusters, Bob
Roberts Calamity & Kitestring.

Skipped as out of scope (real events, but not live music with a named performer): Books and
Brews (a book fair), Old Time Jam and Bluegrass Night (open jams with no named performer, same
treatment as recurring Open Mic nights elsewhere), Improv Night, Trivia Night, Astronomy on Tap,
Comedy Open Mic, Comedy Flops, and Story House Ithaca's storytelling "Presentation Night" series.
Also skipped Krampusnacht (Dec 5) — explicitly billed as a "save the date" with no confirmed
lineup yet beyond one mentioned DJ.

### Aurora Brewing Co. renamed for clarity (October 1, 2026)

User asked to confirm "Aurora Beer Company" was only the Aurora-area venue, not mixed up with
another location. Real finding: **Aurora Brewing Co. operates three physical taprooms** —
Aurora (whose actual mailing address is in the hamlet of King Ferry, just south of Aurora
village, on Cayuga Lake), Rochester/Pittsford, and Syracuse — each with its own separate events
calendar on the brewery's own site (brewaurora.com/events, /events-2, /syracuse-location-1).
Checked both existing shows (Take 2, Billy & The Therapists) directly against the Aurora-specific
calendar and confirmed both are correct. Found one more real show there: **Benny and the Mix**
(Oct 24, 5 PM).

"Aurora" and "King Ferry" are the same single venue, not two different ones — the brand calls it
the "Aurora location" since it's the well-known landmark nearby, even though the postal address
says King Ferry. To make that unambiguous going forward (so a future pass never confuses this
with Rochester or Syracuse, and so it reads clearly in the app's venue list), renamed it from
"Aurora Brewing Co." to **"Aurora Brewing Co. (King Ferry)"** in both `venues.json` and every
`shows.json` entry that references it.

### Ithaca Beer's Sunday series is "Jazz for Everyone" (October 1, 2026)

User corrected the Oct 4 Ithaca Beer entry's name — the recurring Sunday series (2:30-5:30 PM,
free) is officially called **"Jazz for Everyone,"** usually featuring the **McCalip-Collins
Quartet**. Renamed the band field from a guessed "Jesse Collins Quartet (Sunday Jazz Jam)" to
"McCalip-Collins Quartet (Jazz for Everyone)" to match.

A near-miss while re-confirming this: a search for more Ithaca Beer/Aurora Brewing dates
surfaced what looked like two more real confirmed shows (90 Proof at the Newfield Covered Bridge
Fall Festival, and The Ambre Lynae Project at Aurora Brewing, both "Saturday, Oct 11") from a Jim
Catalano newsletter titled "CNY Concert Calendar: Oct. 10-14." Checking the actual event listing
caught the problem: Oct 11, 2026 is a Sunday, not a Saturday, and the festival's own event page
showed it as already "EVENT ENDED." Fetching that newsletter's byline directly confirmed it was
published **Oct 10, 2025** — a full year stale, found only because its URL/title format happened
to match the current week's naming pattern. Neither show was added. **New standing rule**: when a
source is reused across years with similar URLs/titles (recurring newsletters, annual festival
listings), confirm the actual publish date or year before trusting a date from it, not just the
article title's month/day.

### New venue: Argos Warehouse (October 1, 2026)

User asked to add this venue. It's the event space at The Argos Inn (408 E State St, Ithaca) —
the inn's own site has a dedicated `/public-events` page with a real, dated, month-by-month
calendar. Scoped strictly to events tagged **"Argos Warehouse"** specifically, since the same
page also lists events at "Bar Argos," a different room at the same inn, which wasn't asked for
and wasn't added here. Most listed Argos Warehouse events (Yet to Be Gold, an open poetry mic
night, a vinyl DJ night) were already past as of Oct 1. Added the one confirmed upcoming show:
**"The Thing,"** a blacklight body dance party presented by BODYPAINT.ME, Oct 3, 9 PM.

### New venue: Bar Argos (October 1, 2026)

User asked to add this one too — same inn (408 E State St, Ithaca), different room from Argos
Warehouse. Checked both `/public-events` and the dedicated `/bar` page: the one named performer
listed there, Kyra Gordon (Sept 28), was already past. The only other listed Bar Argos item is a
weekly "Jazz Trio Performance" (Wednesdays, 5:30-7:30 PM) with no specific group credited by
name — skipped for the same reason Old Time Jam and Bluegrass Night were skipped at Liquid State:
a generic recurring slot, not a named act. Added the venue with no shows for now; revisit once a
named performer is confirmed there.

### New venue: Cornell's Midday Music series (October 1, 2026)

User asked to add this. Cornell's own events calendar (events.cornell.edu/music) rendered fully
via a plain fetch this time (no JS-rendering issue) and lists a real, dated schedule. Scoped
strictly to shows explicitly branded **"Midday Music"**, not Cornell's broader music calendar
(Composers' Forum talks, the Wind Symphony/Chorus/Symphony Orchestra concerts, etc. — real events,
but a different series than what was asked for). The existing generic "Cornell University" venue
entry wasn't used since it's centered on the whole campus; instead added two new precise venues
for the actual buildings: **Lincoln Hall** and **Anabel Taylor Hall**, each geocoded to its real
street address rather than a campus-wide point. Three confirmed shows: Stephen Prutsman
(Oct 1, Lincoln Hall), David Yearsley on organ (Oct 7, Anabel Taylor Hall — a different sub-venue
for the organ-specific installment of the series), and Linda Ruan (Oct 22, Lincoln Hall).

### Atwater Winery was missing tonight's show (October 1, 2026)

User flagged that tonight's event wasn't showing. Atwater Winery had zero shows in the data at
all. Its own site's events page (atwatervineyards.com/events, reached via the `/events` nav link
— a couple of guessed URLs like `/news` and `/Atwater-After-Hours` 404'd first) has a real,
dated calendar. Added 3 confirmed shows from its Singer-Songwriter Series: **Sarah Noell**
(Oct 1 — tonight), **Robert Beck and Clara Virginia** (Oct 8), and **Louiston** (Oct 15). Skipped
several listed "Pub Night" themed events (BYOVinyl, Cork Ornaments, Spin and Sip, Hats or Wigs)
and "Howl-O-Ween 2026" — real events, but none name a specific musical performer.
