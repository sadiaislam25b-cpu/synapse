import { XMLParser } from "fast-xml-parser";
import pool from "./db.js";
import { getTags } from "./tags.js";

const clean = (s = "") => String(s).replace(/\s+/g, " ").trim();
const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

async function savePaper(p) {
    const result = await pool.query(
        `INSERT INTO papers (title, url, authors, abstract, source, published_at, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (url) DO NOTHING`,
        [p.title, p.url, p.authors, p.abstract, p.source, p.published_at, getTags(`${p.title} ${p.abstract || ""}`)]
    );
    return result.rowCount;
}

async function fetchArxiv() {
    const query = 'all:"brain computer interface" OR all:"neural interface" OR all:neurotechnology';
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`arXiv responded ${res.status}`);

    const data = new XMLParser().parse(await res.text());
    let saved = 0;
    for (const e of toArray(data.feed?.entry)) {
        saved += await savePaper({
            title: clean(e.title),
            url: clean(e.id),
            authors: toArray(e.author).map((a) => a.name).join(", "),
            abstract: clean(e.summary),
            source: "arXiv",
            published_at: e.published ? new Date(e.published) : null,
        });
    }
    return saved;
}

async function fetchPubmed() {
    const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    const term = '"brain-computer interface" OR neurotechnology OR "neural implant"';

    const search = await fetch(`${base}/esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=20&term=${encodeURIComponent(term)}`);
    if (!search.ok) throw new Error(`PubMed search responded ${search.status}`);
    const ids = (await search.json()).esearchresult?.idlist || [];
    if (!ids.length) return 0;

    const summary = await fetch(`${base}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
    if (!summary.ok) throw new Error(`PubMed summary responded ${summary.status}`);
    const result = (await summary.json()).result || {};

    let saved = 0;
    for (const id of ids) {
        const p = result[id];
        if (!p) continue;
        const date = new Date(p.sortpubdate || p.pubdate);
        saved += await savePaper({
            title: clean(p.title),
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            authors: toArray(p.authors).map((a) => a.name).join(", "),
            abstract: null,
            source: "PubMed",
            published_at: isNaN(date) ? null : date,
        });
    }
    return saved;
}

export async function fetchPapers() {
    const arxiv = await fetchArxiv().catch((err) => {
        console.error("arXiv fetch failed:", err.message);
        return 0;
    });
    const pubmed = await fetchPubmed().catch((err) => {
        console.error("PubMed fetch failed:", err.message);
        return 0;
    });
    console.log(`Papers saved: ${arxiv} from arXiv, ${pubmed} from PubMed`);
}

if (process.argv[1].endsWith("fetchPapers.js")) {
    await fetchPapers();
    await pool.end();
}