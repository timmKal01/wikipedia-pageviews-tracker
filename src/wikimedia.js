const BASE_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const REQUEST_TIMEOUT_MS = 30_000;

function formatDate(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Wikimedia's API is occasionally slow or 429s/5xxs under load — retry with backoff rather
 *  than ever treating a throttle or timeout as "no data." */
async function fetchWithRetry(url, { retries = 4, baseDelayMs = 1500 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                headers: {
                    Connection: 'close',
                    // Wikimedia's API etiquette policy asks for an identifying User-Agent on all requests.
                    'User-Agent': 'apify-wikipedia-pageviews-tracker/0.1 (https://apify.com/m_ctim)',
                },
                signal: controller.signal,
            });
            if (res.status === 404) return res; // no data for this article/project — not retryable
            if (res.ok) return res;
            if (![429, 500, 502, 503, 504].includes(res.status)) {
                throw new Error(`Wikimedia API request failed: ${res.status} ${res.statusText}`);
            }
            lastErr = new Error(`Wikimedia API returned ${res.status}`);
        } catch (err) {
            lastErr = err.name === 'AbortError' ? new Error('Wikimedia API request timed out') : err;
        } finally {
            clearTimeout(timeout);
        }
        if (attempt < retries) {
            await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
        }
    }
    throw lastErr;
}

export async function fetchPageviews({ article, project, daysBack }) {
    // Wikimedia's pipeline has a short reporting lag, so "today" isn't reliably available yet —
    // count back from yesterday instead.
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (daysBack - 1));

    const encodedArticle = encodeURIComponent(article.trim().replace(/ /g, '_'));
    const url = `${BASE_URL}/${project}/all-access/all-agents/${encodedArticle}/daily/${formatDate(start)}/${formatDate(end)}`;

    const res = await fetchWithRetry(url);
    if (res.status === 404) {
        throw new Error(`No pageview data found for "${article}" on ${project} — check the exact title and project.`);
    }
    const body = await res.json();

    const results = [];
    for (const item of body.items ?? []) {
        try {
            results.push({
                article: item.article,
                project: item.project,
                date: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`,
                views: item.views,
            });
        } catch (err) {
            // Skip a malformed day-record rather than losing the whole date range.
        }
    }
    return results;
}
