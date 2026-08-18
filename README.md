# Wikipedia Pageviews Tracker

Get the daily pageview history for any Wikipedia article via the
official [Wikimedia REST API](https://wikimedia.org/api/rest_v1/): spot
traffic spikes, gauge public attention on a topic, or track interest
over time.

Built for PR, media-monitoring, and research teams who want a quick
attention signal without pulling Wikimedia's raw dump files.

## Input

```json
{
  "article": "Bitcoin",
  "project": "en.wikipedia",
  "daysBack": 30
}
```

| Field | Type | Description |
|---|---|---|
| `article` | string (required) | The exact Wikipedia article title, e.g. `"Bitcoin"` or `"Elon Musk"` (spaces are fine). |
| `project` | string | The Wikipedia language edition, e.g. `"en.wikipedia"`, `"de.wikipedia"`, `"ja.wikipedia"`. Default `"en.wikipedia"`. |
| `daysBack` | number | How many days of daily history to return, counting back from yesterday. Default `30`, max `180`. |

## Output

One record per day:

```json
{
  "article": "Bitcoin",
  "project": "en.wikipedia",
  "date": "2026-08-17",
  "views": 4608
}
```

A nonexistent article/project combination returns a clear error
rather than an empty result set. Wikimedia's pipeline typically lags
1-2 days behind real time, so the most recent day or two may not be
included yet even when `daysBack` asks for them — this is normal, not
missing data.

## How it works

Direct calls to the official [Wikimedia Pageviews
API](https://wikimedia.org/api/rest_v1/#/Pageviews%20data) — no
proxy, no key, no scraping. This is the same aggregated pageview data
Wikimedia publishes for public reuse.

## Pricing note

Billed per **lookup** (one run), not per day returned — one charge
whether you request 1 day or 180.

## Related products

- [Wikipedia Page Watcher](https://github.com/timmKal01/wikipedia-page-watcher) — tracks edit history, not pageviews
