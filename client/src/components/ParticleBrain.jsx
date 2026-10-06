import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function buildBrain(count) {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        let dx = Math.sin(phi) * Math.cos(theta);
        const dy = Math.cos(phi);
        const dz = Math.sin(phi) * Math.sin(theta);
        const pick = Math.random();
        let x, y, z;

        if (pick < 0.88) {
            // Left and right hemispheres with wrinkly folds
            const side = i % 2 ? 1 : -1;
            if (dx * side < 0) dx = -dx;
            const fold = 1 + 0.07 * Math.sin(9 * theta + 3 * phi) * Math.sin(7 * phi) + 0.03 * Math.sin(23 * phi);
            const r = (0.94 + Math.random() * 0.06) * fold;
            x = side * 0.06 + dx * 0.95 * r;
            y = dy * 0.95 * r + 0.1;
            z = dz * 1.35 * r;
            if (y < -0.35) y = -0.35 + (y + 0.35) * 0.4;
        } else if (pick < 0.97) {
            // Cerebellum at the back
            const r = 0.42 + Math.random() * 0.03;
            x = dx * r * 1.3;
            y = dy * r * 0.6 - 0.62;
            z = dz * r - 0.85;
        } else {
            // Brainstem
            const t = Math.random();
            x = (Math.random() - 0.5) * 0.25;
            y = -0.5 - t * 0.8;
            z = -0.35 + t * 0.1 + (Math.random() - 0.5) * 0.25;
        }
        points.set([x, y, z], i * 3);
    }
    return points;
}

function BrainPoints({ count, control }) {
    const ref = useRef();
    const base = useMemo(() => buildBrain(count), [count]);
    const positions = useMemo(() => base.slice(), [base]);

    const colors = useMemo(() => {
        const css = getComputedStyle(document.documentElement);
        const a = new THREE.Color(css.getPropertyValue("--hema").trim());
        const b = new THREE.Color(css.getPropertyValue("--eosin").trim());
        const out = new Float32Array(count * 3);
        const c = new THREE.Color();
        for (let i = 0; i < count; i++) {
            const k = (Math.sin(base[i * 3 + 2] * 3 + base[i * 3 + 1] * 2) + 1) / 2;
            c.copy(a).lerp(b, k * 0.8);
            out.set([c.r, c.g, c.b], i * 3);
        }
        return out;
    }, [base, count]);

    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const hit = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        const pts = ref.current;
        if (!pts) return;
        const c = control.current;

        if (!c.dragging && !reduceMotion) {
            c.rotY += 0.0025 + c.spin;
            c.spin *= 0.95;
        }
        pts.rotation.set(0.15, c.rotY, 0);
        const breathe = reduceMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.015;
        pts.scale.setScalar(breathe);
        pts.updateMatrixWorld();

        let mouseNear = false;
        if (c.hovering) {
            state.raycaster.setFromCamera(state.pointer, state.camera);
            if (state.raycaster.ray.intersectPlane(plane, hit)) {
                pts.worldToLocal(hit);
                mouseNear = true;
            }
        }

        const pos = pts.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const j = i * 3;
            let tx = base[j], ty = base[j + 1], tz = base[j + 2];
            if (mouseNear) {
                const dx = tx - hit.x, dy = ty - hit.y, dz = tz - hit.z;
                const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (d < 0.55) {
                    const push = ((0.55 - d) * 0.9) / (d + 0.001);
                    tx += dx * push; ty += dy * push; tz += dz * push;
                }
            }
            pos[j] += (tx - pos[j]) * 0.12;
            pos[j + 1] += (ty - pos[j + 1]) * 0.12;
            pos[j + 2] += (tz - pos[j + 2]) * 0.12;
        }
        pts.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.028}
                vertexColors
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
        </points>
    );
}

export default function ParticleBrain() {
    const count = window.innerWidth < 700 ? 3500 : 7000;
    const control = useRef({ dragging: false, hovering: false, lastX: 0, spin: 0, rotY: 0.6 });

    const handlers = {
        onPointerEnter: () => { control.current.hovering = true; },
        onPointerLeave: () => { control.current.hovering = false; control.current.dragging = false; },
        onPointerDown: (e) => { control.current.dragging = true; control.current.lastX = e.clientX; },
        onPointerUp: () => { control.current.dragging = false; },
        onPointerMove: (e) => {
            const c = control.current;
            if (!c.dragging) return;
            c.spin = (e.clientX - c.lastX) * 0.005;
            c.rotY += c.spin;
            c.lastX = e.clientX;
        },
    };

    return (
        <div className="brain" {...handlers} aria-label="Rotating brain made of particles. Drag to turn it.">
            <Canvas camera={{ position: [0, 0, 6.2], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true }}>
                <BrainPoints count={count} control={control} />
            </Canvas>
        </div>
    );
}