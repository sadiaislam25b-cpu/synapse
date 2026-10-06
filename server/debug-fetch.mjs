import pool from "./db.js";
import { getTags } from "./tags.js";
const key = process.env.GUARDIAN_API_KEY;
const query = '"brain-computer interface" OR neurotechnology OR "brain implant" OR "neural interface" OR "brain chip" OR neuroscience';
const params = new URLSearchParams({
    q: query,
    section: "science|technology|society",
    "order-by": "newest",
    "page-size": "50",
    "show-fields": "trailText,thumbnail",
    "api-key": key,
});
const url = `https://content.guardianapis.com/search?${params}`;
console.log("URL HOST PART", new URL(url).hostname);
try {
    const res = await fetch(url);
    console.log("status", res.status);
} catch (err) {
    console.log("FULL ERROR", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.log("CAUSE", err.cause);
}
await pool.end();
