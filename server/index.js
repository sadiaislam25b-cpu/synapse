import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import pool from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const PostgresStore = pgSession(session);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(
    session({
        name: "synapse.sid",
        secret: process.env.SESSION_SECRET || "synapse-dev-secret",
        resave: false,
        saveUninitialized: false,
        store: new PostgresStore({
            pool,
            tableName: "session",
            createTableIfMissing: true,
        }),
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    })
);

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Please log in to continue." });
    }
    next();
};

async function initializeDatabase() {
    const schema = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);
}

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Synapse server is running" });
});

app.post("/api/auth/signup", async (req, res) => {
    const username = (req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || password.length < 6) {
        return res.status(400).json({ error: "Username and a 6+ character password are required." });
    }

    try {
        const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
        if (existing.rowCount > 0) {
            return res.status(409).json({ error: "That username is already in use." });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const { rows: [user] } = await pool.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [username, passwordHash]
        );

        req.session.userId = user.id;
        req.session.username = user.username;

        return res.status(201).json({ user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error("Signup failed:", error);
        return res.status(500).json({ error: "Could not create account." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const username = (req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const { rows: [user] } = await pool.query(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        return res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({ error: "Could not log in." });
    }
});

app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ error: "Could not log out." });
        }

        res.clearCookie("synapse.sid");
        return res.json({ ok: true });
    });
});

app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
        return res.json({ user: null });
    }

    try {
        const { rows: [user] } = await pool.query(
            "SELECT id, username FROM users WHERE id = $1",
            [req.session.userId]
        );

        return res.json({ user: user ? { id: user.id, username: user.username } : null });
    } catch (error) {
        console.error("Get current user failed:", error);
        return res.status(500).json({ error: "Could not load user." });
    }
});

app.get("/api/companies", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM companies ORDER BY name");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load companies" });
    }
});

app.get("/api/papers", async (req, res) => {
    try {
        const { tag } = req.query;
        const { rows } = tag
            ? await pool.query(
                "SELECT * FROM papers WHERE $1 = ANY(tags) ORDER BY published_at DESC NULLS LAST LIMIT 50",
                [tag]
            )
            : await pool.query(
                "SELECT * FROM papers ORDER BY published_at DESC NULLS LAST LIMIT 50"
            );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load papers" });
    }
});

app.get("/api/news", async (req, res) => {
    try {
        const { tag } = req.query;
        const { rows } = tag
            ? await pool.query(
                "SELECT * FROM articles WHERE $1 = ANY(tags) ORDER BY published_at DESC NULLS LAST LIMIT 50",
                [tag]
            )
            : await pool.query(
                "SELECT * FROM articles ORDER BY published_at DESC NULLS LAST LIMIT 50"
            );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load news" });
    }
});

app.get("/api/search", async (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ companies: [], news: [], papers: [] });

    try {
        const term = `%${q}%`;
        const [companies, news, papers] = await Promise.all([
            pool.query(
                "SELECT * FROM companies WHERE name ILIKE $1 OR description ILIKE $1 OR $2 = ANY(tags) ORDER BY name LIMIT 20",
                [term, q]
            ),
            pool.query(
                "SELECT * FROM articles WHERE title ILIKE $1 OR summary ILIKE $1 ORDER BY published_at DESC LIMIT 20",
                [term]
            ),
            pool.query(
                "SELECT * FROM papers WHERE title ILIKE $1 OR abstract ILIKE $1 ORDER BY published_at DESC NULLS LAST LIMIT 20",
                [term]
            ),
        ]);
        res.json({ companies: companies.rows, news: news.rows, papers: papers.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Search failed" });
    }
});

app.post("/api/saves", requireAuth, async (req, res) => {
    const itemType = String(req.body.type || "").toLowerCase();
    const itemId = Number(req.body.item_id ?? req.body.itemId);

    if (!Number.isInteger(itemId) || itemId < 1) {
        return res.status(400).json({ error: "A valid item ID is required." });
    }

    if (itemType === "article") {
        const article = await pool.query("SELECT id FROM articles WHERE id = $1", [itemId]);
        if (article.rowCount === 0) {
            return res.status(404).json({ error: "Article not found." });
        }

        await pool.query(
            "INSERT INTO saves (user_id, article_id) VALUES ($1, $2) ON CONFLICT (user_id, article_id) WHERE article_id IS NOT NULL DO NOTHING",
            [req.session.userId, itemId]
        );

        return res.status(201).json({ saved: true });
    }

    if (itemType === "paper") {
        const paper = await pool.query("SELECT id FROM papers WHERE id = $1", [itemId]);
        if (paper.rowCount === 0) {
            return res.status(404).json({ error: "Paper not found." });
        }

        await pool.query(
            "INSERT INTO saves (user_id, paper_id) VALUES ($1, $2) ON CONFLICT (user_id, paper_id) WHERE paper_id IS NOT NULL DO NOTHING",
            [req.session.userId, itemId]
        );

        return res.status(201).json({ saved: true });
    }

    return res.status(400).json({ error: "Item type must be 'article' or 'paper'." });
});

app.delete("/api/saves/:type/:itemId", requireAuth, async (req, res) => {
    const itemType = String(req.params.type || "").toLowerCase();
    const itemId = Number(req.params.itemId);

    if (!Number.isInteger(itemId) || itemId < 1) {
        return res.status(400).json({ error: "A valid item ID is required." });
    }

    if (itemType === "article") {
        await pool.query("DELETE FROM saves WHERE user_id = $1 AND article_id = $2", [req.session.userId, itemId]);
        return res.json({ saved: false });
    }

    if (itemType === "paper") {
        await pool.query("DELETE FROM saves WHERE user_id = $1 AND paper_id = $2", [req.session.userId, itemId]);
        return res.json({ saved: false });
    }

    return res.status(400).json({ error: "Item type must be 'article' or 'paper'." });
});

app.get("/api/saves", requireAuth, async (req, res) => {
    try {
        const [articles, papers] = await Promise.all([
            pool.query(
                "SELECT a.*, s.id AS save_id, s.created_at AS saved_at FROM saves s JOIN articles a ON a.id = s.article_id WHERE s.user_id = $1 ORDER BY s.created_at DESC",
                [req.session.userId]
            ),
            pool.query(
                "SELECT p.*, s.id AS save_id, s.created_at AS saved_at FROM saves s JOIN papers p ON p.id = s.paper_id WHERE s.user_id = $1 ORDER BY s.created_at DESC",
                [req.session.userId]
            ),
        ]);

        return res.json({
            articles: articles.rows.map((item) => ({ ...item, type: "article" })),
            papers: papers.rows.map((item) => ({ ...item, type: "paper" })),
        });
    } catch (error) {
        console.error("Get saved items failed:", error);
        return res.status(500).json({ error: "Could not load saved items." });
    }
});

if (isProduction) {
    const clientDist = path.join(__dirname, "../client/dist");
    app.use(express.static(clientDist));
    app.use((req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

async function start() {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

start().catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
});