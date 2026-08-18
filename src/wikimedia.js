const BASE_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';

function formatDate(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
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

    // Wikimedia's API etiquette policy asks for an identifying User-Agent on all requests.
    const res = await fetch(url, {
        headers: {
            Connection: 'close',
            'User-Agent': 'apify-wikipedia-pageviews-tracker/0.1 (https://apify.com/m_ctim)',
        },
    });

    if (res.status === 404) {
        throw new Error(`No pageview data found for "${article}" on ${project} — check the exact title and project.`);
    }
    if (!res.ok) {
        throw new Error(`Wikimedia API request failed: ${res.status} ${res.statusText}`);
    }
    const body = await res.json();

    return (body.items ?? []).map((item) => ({
        article: item.article,
        project: item.project,
        date: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`,
        views: item.views,
    }));
}
