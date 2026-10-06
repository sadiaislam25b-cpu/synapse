import pool from "./db.js";
import { getTags } from "./tags.js";
import "dotenv/config";

const stripHtml = (s = "") => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export async function fetchNews() {
    const key = process.env.GUARDIAN_API_KEY;
    if (!key) {
        console.error("News fetch skipped: GUARDIAN_API_KEY is missing in .env");
        return;
    }

    const query = '"brain-computer interface" OR neurotechnology OR "brain implant" OR "neural interface" OR "brain chip" OR neuroscience';
    const params = new URLSearchParams({
        q: query,
        section: "science|technology|society",
        "order-by": "newest",
        "page-size": "50",
        "show-fields": "trailText,thumbnail",
        "api-key": key,
    });

    try {
        const res = await fetch(`https://content.guardianapis.com/search?${params}`);
        if (!res.ok) throw new Error(`Guardian responded ${res.status}`);
        const results = (await res.json()).response?.results || [];

        let saved = 0;
        let skipped = 0;
        for (const a of results) {
            const summary = stripHtml(a.fields?.trailText);
            const tags = getTags(`${a.webTitle} ${summary}`);

            if (tags.length === 0) {
                skipped++;
                continue;
            }

            const result = await pool.query(
                `INSERT INTO articles (title, url, source, summary, image_url, published_at, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (url) DO NOTHING`,
                [a.webTitle, a.webUrl, "The Guardian", summary, a.fields?.thumbnail || null, a.webPublicationDate, tags]
            );
            saved += result.rowCount;
        }
        console.log(`News saved: ${saved} new, ${skipped} skipped as off-topic`);
    } catch (err) {
        console.error("News fetch failed:", err.message);
        console.error("FULL ERROR DEBUG:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        console.error("CAUSE DEBUG:", err.cause);
    }
}

if (process.argv[1].endsWith("fetchNews.js")) {
    await fetchNews();
    await pool.end();
}