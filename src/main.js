import { Actor, log } from 'apify';
import { fetchPageviews } from './wikimedia.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { article, project = 'en.wikipedia', daysBack = 30 } = input;

if (!article) {
    throw new Error('Input "article" is required, e.g. "Bitcoin".');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const PAGEVIEWS_LOOKUP_EVENT = 'pageviews-lookup';

const views = await fetchPageviews({
    article,
    project,
    daysBack: Math.min(daysBack, 180),
});

for (const day of views) {
    await Actor.pushData(day);
}

await Actor.charge({ eventName: PAGEVIEWS_LOOKUP_EVENT });

log.info(`Pushed ${views.length} day(s) of pageview data`);

await Actor.exit();
