// Live WebGL backdrop: drifting 3D rose petals and light particles.
// Runs behind the glass UI on #scene-canvas.
import * as THREE from 'three';
import { RoomEnvironment } from 'https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

const canvas = document.getElementById('scene-canvas');
if (canvas && window.WebGLRenderingContext) {
    initScene(canvas);
}

function initScene(canvas) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCompact = window.matchMedia('(max-width: 820px)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfbe1e8, 0.045);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Soft studio-style reflections for the metal/glass materials below —
    // without this, metalness/transmission render as near-black.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // -----------------------------------------------------------
    // Lighting — soft blush key + dusty-rose rim, bright fill for a light backdrop
    // -----------------------------------------------------------
    scene.add(new THREE.HemisphereLight(0xfff3f5, 0xf3b8c8, 1.4));
    scene.add(new THREE.AmbientLight(0xfff0f2, 0.8));

    const keyLight = new THREE.PointLight(0xffeef2, 6, 40, 2);
    keyLight.position.set(6, 5, 8);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xc2355a, 4, 40, 2);
    rimLight.position.set(-7, -3, 4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffffff, 1, 40, 2);
    fillLight.position.set(0, 6, -6);
    scene.add(fillLight);

    // -----------------------------------------------------------
    // Hero group — everything parallaxes together
    // -----------------------------------------------------------
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // -----------------------------------------------------------
    // Falling 3D rose petals — tumbling, gently swaying as they drift down
    // -----------------------------------------------------------
    function createPetalGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.bezierCurveTo(0.52, 0.14, 0.58, 0.72, 0, 1.08);
        shape.bezierCurveTo(-0.58, 0.72, -0.52, 0.14, 0, 0);
        const geometry = new THREE.ShapeGeometry(shape, 12);
        geometry.translate(0, -0.5, 0);
        return geometry;
    }

    const petalGeometry = createPetalGeometry();
    const petalColors = [0xd94f70, 0xe8879e, 0xf3b6c4, 0xc2355a, 0xf6d3da];
    const petalMaterials = petalColors.map((color) => new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
        emissive: color,
        emissiveIntensity: 0.06,
    }));

    const petalCount = isCompact ? 48 : 90;
    const petals = [];
    const petalSpread = { x: 15, yTop: 10, yBottom: -10, z: 8 };

    for (let i = 0; i < petalCount; i++) {
        const material = petalMaterials[i % petalMaterials.length];
        const petal = new THREE.Mesh(petalGeometry, material);
        const scale = 0.22 + Math.random() * 0.24;
        petal.scale.set(scale, scale * (0.85 + Math.random() * 0.3), scale);

        const baseX = (Math.random() - 0.5) * petalSpread.x;
        petal.position.set(
            baseX,
            petalSpread.yTop - Math.random() * (petalSpread.yTop - petalSpread.yBottom),
            (Math.random() - 0.5) * petalSpread.z - 3,
        );
        petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        petals.push({
            mesh: petal,
            baseX,
            fallSpeed: 0.35 + Math.random() * 0.55,
            swayAmp: 0.6 + Math.random() * 1.4,
            swayFreq: 0.25 + Math.random() * 0.35,
            swayPhase: Math.random() * Math.PI * 2,
            spin: {
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 0.6,
            },
        });
        scene.add(petal);
    }

    // -----------------------------------------------------------
    // Drifting light particles (sparkle dust)
    // -----------------------------------------------------------
    const particleCount = isCompact ? 260 : 520;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
        speeds[i] = 0.15 + Math.random() * 0.35;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleTexture = makeSparkleTexture();
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.12,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        color: 0xffffff,
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    function makeSparkleTexture() {
        const size = 64;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(240,180,195,0.95)');
        gradient.addColorStop(0.45, 'rgba(240,180,195,0.55)');
        gradient.addColorStop(1, 'rgba(240,180,195,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(c);
    }

    // -----------------------------------------------------------
    // Pointer parallax + scroll-driven motion
    // -----------------------------------------------------------
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let scrollProgress = 0;

    if (!isCompact && !prefersReducedMotion) {
        window.addEventListener('pointermove', (e) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            targetRotY = nx * 0.22;
            targetRotX = ny * 0.14;
        });
    }

    function readScrollProgress() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    window.addEventListener('scroll', readScrollProgress, { passive: true });
    readScrollProgress();

    // -----------------------------------------------------------
    // Resize handling
    // -----------------------------------------------------------
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    // -----------------------------------------------------------
    // Animation loop
    // -----------------------------------------------------------
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        currentRotX += (targetRotX - currentRotX) * 0.04;
        currentRotY += (targetRotY - currentRotY) * 0.04;

        heroGroup.rotation.x = currentRotX;
        heroGroup.rotation.y = currentRotY + scrollProgress * 0.9;
        heroGroup.position.y = -scrollProgress * 2.4;

        for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            const m = p.mesh;
            m.position.y -= p.fallSpeed * 0.016;
            if (m.position.y < petalSpread.yBottom) {
                m.position.y = petalSpread.yTop;
                p.baseX = (Math.random() - 0.5) * petalSpread.x;
                m.position.z = (Math.random() - 0.5) * petalSpread.z - 3;
            }
            m.position.x = p.baseX + Math.sin(elapsed * p.swayFreq + p.swayPhase) * p.swayAmp;
            m.rotation.x += p.spin.x * 0.016;
            m.rotation.y += p.spin.y * 0.016;
            m.rotation.z += p.spin.z * 0.016;
        }

        const posAttr = particleGeometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            let y = posAttr.getY(i) + speeds[i] * 0.01;
            if (y > 9) y = -9;
            posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
        particles.rotation.y = elapsed * 0.015;
        particleMaterial.opacity = 0.78 + Math.sin(elapsed * 0.6) * 0.08;

        camera.position.x = currentRotY * 1.4;
        camera.position.y = -currentRotX * 1.2;
        camera.position.z = 11 - scrollProgress * 2.2;
        camera.lookAt(0, -scrollProgress * 1.2, 0);

        renderer.render(scene, camera);
    }

    if (prefersReducedMotion) {
        renderer.render(scene, camera);
    } else {
        animate();
    }
}
