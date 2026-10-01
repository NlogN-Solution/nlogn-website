"use client";

import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";
import { HeroCorePoster } from "@/components/home/hero-stack-poster";

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The AI Growth Core.
 *
 * A faceted glass core lit from inside, wrapped in a node lattice, orbited by
 * data-stream rings and a few glass modules. Read outward it tells the same
 * story the company sells: data becomes intelligence, intelligence becomes
 * automation, automation becomes growth.
 *
 * Three.js is imported lazily so it never blocks the headline, and the CSS
 * poster underneath covers reduced-motion, absent WebGL, and the moments
 * before the module arrives.
 */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !webglAvailable() || !host.current) return;

    let cancelled = false;
    let teardown = () => {};

    (async () => {
      const THREE = await import("three");
      const { EffectComposer } = await import(
        "three/examples/jsm/postprocessing/EffectComposer.js"
      );
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import(
        "three/examples/jsm/postprocessing/UnrealBloomPass.js"
      );
      const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");

      const mount = host.current;
      if (cancelled || !mount) return;

      const width = () => mount.clientWidth || 1;
      const height = () => mount.clientHeight || 1;
      const lite = window.innerWidth < 900;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
      renderer.setSize(width(), height());
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width() / height(), 0.1, 100);
      camera.position.set(0, 0.5, 9.4);
      camera.lookAt(0, 0, 0);

      // Painted equirect: the bright blobs are what the glass refracts.
      const envCanvas = document.createElement("canvas");
      envCanvas.width = 256;
      envCanvas.height = 128;
      const ctx = envCanvas.getContext("2d")!;
      const sky = ctx.createLinearGradient(0, 0, 0, 128);
      sky.addColorStop(0, "#ddd0ff");
      sky.addColorStop(0.36, "#4a3690");
      sky.addColorStop(0.74, "#150d26");
      sky.addColorStop(1, "#05030a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 256, 128);
      const blob = (x: number, y: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      blob(176, 24, 46, "rgba(255,255,255,0.95)");
      blob(54, 46, 58, "rgba(232,121,249,0.5)");
      blob(120, 80, 44, "rgba(124,92,255,0.5)");
      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromEquirectangular(envTex).texture;
      scene.environment = envMap;

      const world = new THREE.Group();
      scene.add(world);

      const VIOLET = 0x7c5cff;
      const LILAC = 0xa78bfa;

      // ── the core: faceted glass with a lit heart ─────────────────────────
      const coreMat = lite
        ? new THREE.MeshPhysicalMaterial({
            color: 0x8b6cff,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: 0.55,
            emissive: new THREE.Color(0x5b32e0),
            emissiveIntensity: 0.5,
            envMapIntensity: 1.4,
          })
        : new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1,
            thickness: 0.9,
            roughness: 0.04,
            ior: 1.55,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            iridescence: 0.45,
            iridescenceIOR: 1.32,
            attenuationColor: new THREE.Color(0x6d28d9),
            attenuationDistance: 4.0,
            envMapIntensity: 1.5,
            transparent: true,
          });
      const coreGeo = new THREE.IcosahedronGeometry(1.05, 0);
      const core = new THREE.Mesh(coreGeo, coreMat);
      world.add(core);

      // Lit facet edges: what separates a crystal from a blob.
      const coreEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(coreGeo),
        new THREE.LineBasicMaterial({ color: 0xd8ccff, transparent: true, opacity: 0.75 }),
      );
      core.add(coreEdges);

      const heartMat = new THREE.MeshBasicMaterial({
        color: 0xe7dfff,
        transparent: true,
        opacity: 0.95,
      });
      const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 2), heartMat);
      world.add(heart);

      const coreLight = new THREE.PointLight(VIOLET, 20, 11);
      world.add(coreLight);

      // ── node lattice: the connected-data shell ───────────────────────────
      const latticeGeo = new THREE.IcosahedronGeometry(1.95, 1);
      const lattice = new THREE.LineSegments(
        new THREE.EdgesGeometry(latticeGeo),
        new THREE.LineBasicMaterial({ color: LILAC, transparent: true, opacity: 0.45 }),
      );
      world.add(lattice);

      // One glowing node per unique lattice vertex.
      const raw = latticeGeo.attributes.position.array as ArrayLike<number>;
      const seen = new Set<string>();
      const verts: ThreeNS.Vector3[] = [];
      for (let i = 0; i < raw.length; i += 3) {
        const key = `${raw[i].toFixed(3)},${raw[i + 1].toFixed(3)},${raw[i + 2].toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        verts.push(new THREE.Vector3(raw[i], raw[i + 1], raw[i + 2]));
      }
      const nodeGeo = new THREE.SphereGeometry(0.038, 10, 10);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xe4dcff });
      const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, verts.length);
      const dummy = new THREE.Object3D();
      verts.forEach((v, i) => {
        dummy.position.copy(v);
        dummy.updateMatrix();
        nodes.setMatrixAt(i, dummy.matrix);
      });
      nodes.instanceMatrix.needsUpdate = true;
      world.add(nodes);

      // ── data-stream rings, each with a travelling packet ─────────────────
      const ringDefs = [
        { r: 2.32, tilt: [1.25, 0.2, 0.35], speed: 0.30, color: VIOLET },
        { r: 2.7, tilt: [0.55, 0.9, -0.25], speed: -0.22, color: 0xd06bf0 },
        { r: 3.05, tilt: [1.5, -0.5, 0.9], speed: 0.16, color: LILAC },
      ];
      const rings = ringDefs.map((def) => {
        const g = new THREE.Group();
        g.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(def.r, 0.009, 6, 180),
          new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 }),
        );
        g.add(ring);
        const packet = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        g.add(packet);
        world.add(g);
        return { group: g, packet, radius: def.r, speed: def.speed };
      });

      // ── orbiting glass modules ───────────────────────────────────────────
      const moduleMat = new THREE.MeshPhysicalMaterial({
        color: 0xb9a6ff,
        roughness: 0.12,
        metalness: 0.05,
        transparent: true,
        opacity: 0.3,
        emissive: new THREE.Color(0x4c1fd6),
        emissiveIntensity: 0.28,
        envMapIntensity: 1.3,
        side: THREE.DoubleSide,
      });
      const modules = [0, 1, 2].map((i) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.028), moduleMat);
        m.userData.phase = (i / 3) * Math.PI * 2;
        m.userData.radius = 2.5 + i * 0.16;
        m.userData.tilt = -0.35 + i * 0.3;
        world.add(m);
        return m;
      });

      // ── particle field ───────────────────────────────────────────────────
      const COUNT = lite ? 200 : 380;
      const pos = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        const r = 2.1 + Math.random() * 2.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi) * 0.7;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0xc4b5fd,
          size: 0.022,
          transparent: true,
          opacity: 0.5,
          sizeAttenuation: true,
          depthWrite: false,
        }),
      );
      world.add(particles);

      // ── lighting ─────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0x3b2f63, 0.6));
      const key = new THREE.PointLight(LILAC, 24, 24);
      key.position.set(3.2, 3.4, 4);
      scene.add(key);
      const rim = new THREE.PointLight(0xe879f9, 12, 22);
      rim.position.set(-4, -1.4, -3);
      scene.add(rim);
      const top = new THREE.DirectionalLight(0xffffff, 0.7);
      top.position.set(1, 5, 3);
      scene.add(top);

      const rt = new THREE.WebGLRenderTarget(width(), height(), {
        type: THREE.HalfFloatType,
        samples: lite ? 0 : 4,
      });
      const composer = new EffectComposer(renderer, rt);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
      composer.setSize(width(), height());
      const renderPass = new RenderPass(scene, camera);
      renderPass.clearAlpha = 0;
      composer.addPass(renderPass);
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(width(), height()),
        0.78,
        0.6,
        0.5,
      );
      composer.addPass(bloom);
      composer.addPass(new OutputPass());

      // ── interaction ──────────────────────────────────────────────────────
      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = mount.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      const onLeave = () => {
        target.x = 0;
        target.y = 0;
      };
      // Track across the whole hero so the core responds to the copy side too.
      const surface = mount.closest("[data-hero-surface]") ?? mount;
      surface.addEventListener("pointermove", onMove as EventListener);
      surface.addEventListener("pointerleave", onLeave);

      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
        threshold: 0,
      });
      io.observe(mount);

      const onResize = () => {
        camera.aspect = width() / height();
        camera.updateProjectionMatrix();
        renderer.setSize(width(), height());
        composer.setSize(width(), height());
        bloom.setSize(width(), height());
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(mount);

      const clock = new THREE.Clock();
      let raf = 0;

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        const t = clock.getElapsedTime();

        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;

        world.rotation.y = t * 0.055 + pointer.x * 0.3;
        world.rotation.x = pointer.y * 0.16;

        core.rotation.y = -t * 0.1;
        core.rotation.x = t * 0.05;
        heart.rotation.y = t * 0.24;
        lattice.rotation.y = -t * 0.09;
        nodes.rotation.y = -t * 0.09;
        particles.rotation.y = t * 0.02;

        // Core breathes; the pulse also drives the internal lamp.
        const pulse = 0.5 + Math.sin(t * 1.1) * 0.5;
        heartMat.opacity = 0.7 + pulse * 0.3;
        heart.scale.setScalar(1 + pulse * 0.06);
        coreLight.intensity = 16 + pulse * 9;

        rings.forEach((ring, i) => {
          const a = t * ring.speed + i * 2.1;
          ring.packet.position.set(Math.cos(a) * ring.radius, Math.sin(a) * ring.radius, 0);
          ring.group.rotation.z = t * ring.speed * 0.35;
        });

        modules.forEach((m) => {
          const a = t * 0.14 + m.userData.phase;
          m.position.set(
            Math.cos(a) * m.userData.radius,
            Math.sin(a * 0.7) * 0.7 + m.userData.tilt,
            Math.sin(a) * m.userData.radius,
          );
          m.rotation.y = a + Math.PI / 2;
          m.rotation.z = Math.sin(a * 0.5) * 0.25;
        });

        composer.render();
      };
      tick();
      setLive(true);

      teardown = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        surface.removeEventListener("pointermove", onMove as EventListener);
        surface.removeEventListener("pointerleave", onLeave);
        composer.dispose();
        rt.dispose();
        renderer.dispose();
        pmrem.dispose();
        envTex.dispose();
        envMap.dispose();
        scene.traverse((obj) => {
          const mesh = obj as ThreeNS.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = (mesh as unknown as { material?: ThreeNS.Material | ThreeNS.Material[] }).material;
          if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
        });
        renderer.domElement.remove();
      };
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return (
    <div className="relative aspect-square w-full">
      <HeroCorePoster
        className={`transition-opacity duration-1000 ${live ? "opacity-0" : "opacity-100"}`}
      />
      <div
        ref={host}
        className={`absolute inset-0 transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
