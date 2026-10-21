# Cheers OC — Orange County Happy Hour Finder

**Cheers OC** helps happy hour fans find their next spot in Orange County, California. It's the sister site to [Cheers ILM](https://cheersilm.com).

Search by city, bar, restaurant, or zip and hit **"It's 5 O'Clock Somewhere"**, or tap a city chip (Newport Beach, Huntington Beach, Costa Mesa, Irvine, Laguna Beach, Dana Point, San Clemente, Anaheim, Fullerton, Santa Ana, Tustin). Results show on an interactive map (teal pins for bars, coral pins for restaurants) next to cards with each spot's days, times, and deals.

## Features
- Live Pacific time and a **Happening now** badge/filter based on Orange County time
- Filters for day of week and deal type (beer, wine, cocktails, shots, food)
- "Use my location" sorting by distance
- Each card links to the venue's happy hour page ("See happy hour deals") or its site ("Visit venue site"), plus the source used
- Spots we couldn't fully confirm are tagged **verify**

> Deals and hours change often. Always check the venue's website for accurate deals before you go.

## Tech
Plain HTML, CSS, and JavaScript. Map by [Leaflet](https://leafletjs.com/) with Esri World Light Gray Canvas tiles (© Esri, HERE, Garmin, © OpenStreetMap contributors). Spot data lives in `data/spots.json`; addresses were geocoded with the US Census geocoder and OpenStreetMap Nominatim.

When `data/spots.json` changes, rerun `python3 scripts/build-areas.py`. It rewrites the browse-by-city section and the JSON-LD block in `index.html` (between the `AREAS` and `JSONLD` marker comments).

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000. Deploy with GitHub Pages (branch `main`, folder `/ (root)`).

Repository: [5pm-OC](https://github.com/johnnycchapman/5pm-OC). Live site: https://cheersoc.com
