import { useEffect, useRef } from "react";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CompanyMap({ companies, selected, filter, onSelect }) {
    const canvasRef = useRef(null);
    const live = useRef({ selected, filter, onSelect, hover: -1 });
    live.current.selected = selected;
    live.current.filter = filter;
    live.current.onSelect = onSelect;

    useEffect(() => {
        const cv = canvasRef.current;
        if (!cv || companies.length === 0) return;
        const ctx = cv.getContext("2d");
        let W = 0, H = 0, frame;

        // One node per company, starting in a circle
        const nodes = companies.map((c, i) => ({
            c, x: 0, y: 0, vx: 0, vy: 0, angle: (i / companies.length) * Math.PI * 2,
        }));

        // Connect companies that share at least one tag
        const edges = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const shared = nodes[i].c.tags.filter((t) => nodes[j].c.tags.includes(t));
                if (shared.length) edges.push({ a: i, b: j, shared });
            }
        }
        const pulses = [];

        function resize() {
            const r = cv.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const first = W === 0;
            W = r.width; H = r.height;
            cv.width = W * dpr; cv.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (first) {
                nodes.forEach((n) => {
                    n.x = W / 2 + Math.cos(n.angle) * W * 0.3;
                    n.y = H / 2 + Math.sin(n.angle) * H * 0.3;
                });
            }
        }
        resize();
        window.addEventListener("resize", resize);

        const mousePos = (e) => {
            const r = cv.getBoundingClientRect();
            return [e.clientX - r.left, e.clientY - r.top];
        };
        const nodeAt = (x, y) => nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < 16);
        const onClick = (e) => {
            const i = nodeAt(...mousePos(e));
            if (i >= 0) live.current.onSelect(nodes[i].c.id);
        };
        const onMove = (e) => {
            live.current.hover = nodeAt(...mousePos(e));
            cv.style.cursor = live.current.hover >= 0 ? "pointer" : "default";
        };
        cv.addEventListener("click", onClick);
        cv.addEventListener("mousemove", onMove);

        const css = getComputedStyle(document.documentElement);
        const hema = css.getPropertyValue("--hema").trim();
        const eosin = css.getPropertyValue("--eosin").trim();
        const ink = css.getPropertyValue("--ink").trim();
        const muted = css.getPropertyValue("--muted").trim();

        function draw() {
            frame = requestAnimationFrame(draw);
            const { selected, filter, hover } = live.current;
            const isActive = (n) => filter === "All" || n.c.tags.includes(filter);

            // Physics: nodes push apart, connected nodes pull together
            for (const n of nodes) {
                for (const m of nodes) {
                    if (n === m) continue;
                    const dx = n.x - m.x, dy = n.y - m.y, d2 = dx * dx + dy * dy + 1;
                    n.vx += (dx / d2) * 60;
                    n.vy += (dy / d2) * 60;
                }
                n.vx += (W / 2 - n.x) * 0.002;
                n.vy += (H / 2 - n.y) * 0.002;
            }
            for (const e of edges) {
                const a = nodes[e.a], b = nodes[e.b];
                const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
                const f = (d - Math.min(W, H) * 0.32) * 0.0015 * e.shared.length * 0.01;
                a.vx += dx * f; a.vy += dy * f;
                b.vx -= dx * f; b.vy -= dy * f;
            }
            for (const n of nodes) {
                n.vx *= 0.82; n.vy *= 0.82;
                n.x = Math.max(70, Math.min(W - 70, n.x + n.vx));
                n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
            }

            ctx.clearRect(0, 0, W, H);

            // Lines
            for (const e of edges) {
                const a = nodes[e.a], b = nodes[e.b];
                const on = filter === "All" || e.shared.includes(filter);
                const touches = a.c.id === selected || b.c.id === selected;
                ctx.globalAlpha = on ? (touches ? 0.8 : 0.3) : 0.06;
                ctx.strokeStyle = touches ? eosin : hema;
                ctx.lineWidth = touches ? 1.6 : 1;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Signals traveling along lines
            if (!reduceMotion && Math.random() < 0.05 && edges.length) {
                pulses.push({ e: edges[Math.floor(Math.random() * edges.length)], t: 0, reverse: Math.random() < 0.5 });
            }
            for (let k = pulses.length - 1; k >= 0; k--) {
                const p = pulses[k];
                p.t += 0.02;
                if (p.t >= 1) { pulses.splice(k, 1); continue; }
                if (filter !== "All" && !p.e.shared.includes(filter)) continue;
                const from = nodes[p.reverse ? p.e.b : p.e.a], to = nodes[p.reverse ? p.e.a : p.e.b];
                ctx.fillStyle = eosin;
                ctx.beginPath();
                ctx.arc(from.x + (to.x - from.x) * p.t, from.y + (to.y - from.y) * p.t, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Company dots and names
            ctx.font = "600 13px 'Bricolage Grotesque', system-ui, sans-serif";
            ctx.textAlign = "center";
            nodes.forEach((n, i) => {
                const isSel = n.c.id === selected;
                const r = isSel ? 11 : i === hover ? 9 : 7;
                ctx.globalAlpha = isActive(n) ? 1 : 0.2;
                ctx.fillStyle = isSel ? eosin : hema;
                ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = isSel ? ink : muted;
                ctx.fillText(n.c.name, n.x, n.y + r + 16);
            });
            ctx.globalAlpha = 1;
        }
        draw();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            cv.removeEventListener("click", onClick);
            cv.removeEventListener("mousemove", onMove);
        };
    }, [companies]);

    return <canvas ref={canvasRef} className="map" aria-label="Network map of neurotech companies" />;
}