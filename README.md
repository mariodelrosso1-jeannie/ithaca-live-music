# Ithaca Band Shows

A simple web calendar of upcoming live music shows and venue info around Ithaca, NY.

## Running it locally

No build tools needed — it's plain HTML, CSS, and JavaScript. Because the page loads
`shows.json` with `fetch`, most browsers require it to be served over `http://` rather
than opened directly as a file. Easiest way:

```bash
python -m http.server 8000
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

The sample shows included are placeholders. Real show listings would need to come from
somewhere like each venue's website, Bandsintown, or Songkick.
