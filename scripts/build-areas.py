#!/usr/bin/env python3
"""Regenerate the browse-by-city section and JSON-LD in index.html.

Reads data/spots.json and rewrites the blocks between the AREAS and JSONLD
marker comments. Run from anywhere:

    python3 scripts/build-areas.py
"""

import html
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPOTS_PATH = ROOT / "data" / "spots.json"
INDEX_PATH = ROOT / "index.html"

AREAS_START = "<!-- AREAS:START -->"
AREAS_END = "<!-- AREAS:END -->"
JSONLD_START = "<!-- JSONLD:START -->"
JSONLD_END = "<!-- JSONLD:END -->"

INTRO_EVERY = (
    "Prefer a list to a map? Pick a city to see every spot we track there, "
    "with days, times and deals."
)
INTRO_SOME = (
    "Prefer a list to a map? Pick a city to see the spots we track there, "
    "with days, times and deals."
)


def norm_url(url):
    return str(url or "").strip().rstrip("/").lower()


def venue_links(spot):
    """Same links as js/app.js venueLinks, without the map Directions link."""
    primary = spot.get("linkLabel") or (
        "See happy hour deals" if spot.get("happyHourDedicated") else "Visit venue site"
    )
    items = []
    if spot.get("happyHourUrl"):
        items.append((spot["happyHourUrl"], primary))
    if spot.get("source"):
        items.append((spot["source"], "Source"))
    seen = set()
    kept = []
    for href, label in items:
        key = norm_url(href)
        if not key or key in seen:
            continue
        seen.add(key)
        kept.append((href, label))
    return kept


def link_html(links):
    parts = []
    for href, label in links:
        parts.append(
            f'<a href="{html.escape(href, quote=True)}" target="_blank" rel="noopener">{html.escape(label)}</a>'
        )
    return "".join(parts)


def city_of(spot):
    return str(spot.get("neighborhood") or "").strip()


def grouped(spots):
    groups = defaultdict(list)
    left_out = []
    for spot in spots:
        city = city_of(spot)
        if not city:
            left_out.append(spot)
            continue
        groups[city].append(spot)
    cities = sorted(groups, key=lambda name: (-len(groups[name]), name))
    return cities, groups, left_out


def areas_html(spots):
    cities, groups, left_out = grouped(spots)
    intro = INTRO_SOME if left_out else INTRO_EVERY
    lines = [
        '<section class="areas" id="browse-by-city">',
        "<h2>Browse Orange County happy hours by city</h2>",
        f'<p class="areas-intro">{html.escape(intro)}</p>',
    ]
    for city in cities:
        rows = groups[city]
        n = len(rows)
        noun = "spot" if n == 1 else "spots"
        lines.append('<details class="area">')
        lines.append(f"<summary>{html.escape(city)} happy hours ({n} {noun})</summary>")
        lines.append('<ul class="area-spots">')
        for spot in rows:
            bits = [f'<span class="area-name">{html.escape(spot.get("name") or "")}</span>']
            when = str(spot.get("hoursText") or "").strip()
            if when:
                bits.append(f'<span class="area-when">{html.escape(when)}</span>')
            deals = [str(d).strip() for d in (spot.get("deals") or []) if str(d).strip()]
            if deals:
                bits.append(f'<span class="area-deal">{html.escape(" · ".join(deals))}</span>')
            links = venue_links(spot)
            if links:
                bits.append(f'<span class="area-links">{link_html(links)}</span>')
            lines.append(f'<li class="area-spot">{"".join(bits)}</li>')
        lines.append("</ul>")
        lines.append("</details>")
    lines.append("</section>")
    return "\n".join(lines), cities, groups, left_out


def schema_type(spot):
    kind = str(spot.get("venueType") or "").strip().lower()
    if kind == "bar":
        return "BarOrPub"
    if kind == "restaurant":
        return "Restaurant"
    return "LocalBusiness"


def business(spot):
    item = {"@type": schema_type(spot), "name": spot.get("name") or ""}
    links = venue_links(spot)
    if links:
        item["url"] = links[0][0]
    address = {}
    street = str(spot.get("address") or "").strip()
    locality = city_of(spot)
    postal = str(spot.get("zip") or "").strip()
    if street:
        address["streetAddress"] = street
    if locality:
        address["addressLocality"] = locality
    if postal:
        address["postalCode"] = postal
    if address:
        item["address"] = {"@type": "PostalAddress", **address}
    return item


def jsonld(spots):
    cities, groups, left_out = grouped(spots)
    ordered = [spot for city in cities for spot in groups[city]]
    ordered.extend(left_out)
    data = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "numberOfItems": len(ordered),
        "itemListElement": [
            {"@type": "ListItem", "position": i, "item": business(spot)}
            for i, spot in enumerate(ordered, start=1)
        ],
    }
    text = json.dumps(data, indent=2, ensure_ascii=False)
    text = text.replace("<", "\\u003c")
    return f'<script type="application/ld+json">\n{text}\n</script>'


def replace_block(page, start, end, inner):
    a = page.find(start)
    b = page.find(end)
    if a < 0 or b < 0 or b < a:
        sys.exit(f"Missing {start} / {end} markers in {INDEX_PATH}")
    return page[: a + len(start)] + "\n" + inner.strip() + "\n" + page[b:]


def main():
    spots = json.loads(SPOTS_PATH.read_text(encoding="utf-8"))["spots"]
    page = INDEX_PATH.read_text(encoding="utf-8")
    areas, cities, groups, left_out = areas_html(spots)
    page = replace_block(page, AREAS_START, AREAS_END, areas)
    page = replace_block(page, JSONLD_START, JSONLD_END, jsonld(spots))
    INDEX_PATH.write_text(page, encoding="utf-8")
    print(f"spots: {len(spots)}")
    print("wording:", "the spots we track" if left_out else "every spot we track")
    if left_out:
        print("left out:", ", ".join(s.get("name") or "?" for s in left_out))
    for city in cities:
        print(f"{city}: {len(groups[city])}")


if __name__ == "__main__":
    main()
