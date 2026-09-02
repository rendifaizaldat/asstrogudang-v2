'use client';
import './globals.css';
import { useEffect } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function Page() {
useEffect(() => {
// ==================== SETUP ====================
const container = document.getElementById('three-container');
if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 170);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdcebf5, 0.5);
    dirLight2.position.set(-10, -5, 15);
    scene.add(dirLight2);

    const pointLightCyan = new THREE.PointLight(0x00f0d0, 1.6, 130);
    pointLightCyan.position.set(28, 14, 38);
    scene.add(pointLightCyan);

    const pointLightMagenta = new THREE.PointLight(0xff3d9a, 1.1, 110);
    pointLightMagenta.position.set(-28, -14, 32);
    scene.add(pointLightMagenta);

    const pointLightBlue = new THREE.PointLight(0x6e8cff, 0.9, 90);
    pointLightBlue.position.set(0, 38, 22);
    scene.add(pointLightBlue);

    // Glass materials
    const glassMaterialName = new THREE.MeshPhysicalMaterial({
      color: 0xf0f4f8,
      metalness: 0,
      roughness: 0.06,
      transmission: 0.72,
      ior: 1.45,
      thickness: 16,
      specularIntensity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.75,
      attenuationColor: new THREE.Color(0xb0d8e8),
      attenuationDistance: 40,
      transparent: true,
      opacity: 1,
    });

    const glassMaterialCountdown = new THREE.MeshPhysicalMaterial({
      color: 0xf0f4f8,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.82,
      ior: 1.52,
      thickness: 24,
      specularIntensity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.75,
      attenuationColor: new THREE.Color(0xc8e0f0),
      attenuationDistance: 55,
      transparent: true,
      opacity: 1,
    });

    const glassMaterialDeco = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.68,
      ior: 1.45,
      thickness: 8,
      specularIntensity: 0.85,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 0.65,
      attenuationColor: new THREE.Color(0xdcebf5),
      attenuationDistance: 28,
      transparent: true,
      opacity: 0.9,
    });

    const glassMaterialRing = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.6,
      ior: 1.45,
      thickness: 5,
      specularIntensity: 0.7,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.55,
      transparent: true,
      opacity: 0.45,
    });

    // Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const nameGroup = new THREE.Group();
    nameGroup.position.set(0, 30, 0);
    mainGroup.add(nameGroup);

    const countdownGroup = new THREE.Group();
    countdownGroup.position.set(0, -38, 0);
    mainGroup.add(countdownGroup);

    // Countdown logic
    const targetDate = new Date('2026-09-03T00:00:00');
    const redirectUrl = 'https://alma-client-unv.vercel.app/';
    const startTime = Date.now();
    const totalDuration = Math.max(1, targetDate.getTime() - startTime);

    function getCountdownParts() {
      const now = new Date();
      const diff = Math.max(0, targetDate.getTime() - now.getTime());
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        diff,
      };
    }

    function getCountdownString() {
      const { days, hours, minutes, seconds } = getCountdownParts();
      return `${String(days).padStart(3, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
    }

    // Font loading
    const fontLoader = new FontLoader();
    let loadedFont = null;
    let countdownMesh = null;
    let lastCountdownString = '';
    let wobbleStartTime = 0;
    let redirected = false;
    let particleSystem = null;

    function centerGeometry(geometry) {
      geometry.computeBoundingBox();
      const cx = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
      const cy = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
      const cz = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
      geometry.translate(-cx, -cy, -cz);
      return geometry;
    }

    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        loadedFont = font;

        // Name
        const nameGeometry = centerGeometry(
          new TextGeometry('ASSTRO GUDANG', {
            font,
            size: 11,
            height: 4.5,
            curveSegments: 24,
            bevelEnabled: true,
            bevelThickness: 1.5,
            bevelSize: 0.8,
            bevelSegments: 10,
          })
        );
        const nameMesh = new THREE.Mesh(nameGeometry, glassMaterialName);
        nameGroup.add(nameMesh);

        // Countdown initial
        lastCountdownString = getCountdownString();
        const countdownGeometry = centerGeometry(
          new TextGeometry(lastCountdownString, {
            font,
            size: 7.5,
            height: 3.5,
            curveSegments: 14,
            bevelEnabled: true,
            bevelThickness: 1.2,
            bevelSize: 0.6,
            bevelSegments: 6,
          })
        );
        countdownMesh = new THREE.Mesh(countdownGeometry, glassMaterialCountdown);
        countdownGroup.add(countdownMesh);

        // Deco spheres
        const sphereGeo = new THREE.SphereGeometry(1.8, 32, 32);
        const spherePositions = [
          [-32, 20, -8], [30, -22, -12], [38, 10, -18],
          [-30, -28, -10], [2, 42, -16], [44, 28, -6],
          [-42, 8, -22], [-15, -38, -14],
        ];
        spherePositions.forEach((pos) => {
          const sphere = new THREE.Mesh(sphereGeo, glassMaterialDeco);
          sphere.position.set(...pos);
          sphere.scale.setScalar(0.4 + Math.random() * 0.8);
          sphere.userData = {
            floatSpeed: 0.25 + Math.random() * 0.4,
            floatOffset: Math.random() * Math.PI * 2,
            rotSpeed: 0.004 + Math.random() * 0.01,
            basePos: [...pos],
          };
          mainGroup.add(sphere);
        });

        // Octahedrons
        const octGeo = new THREE.OctahedronGeometry(2.8, 0);
        const octPositions = [
          [22, 32, -14], [-26, -16, -20], [40, -30, -8], [-38, 28, -18],
        ];
        octPositions.forEach((pos) => {
          const oct = new THREE.Mesh(octGeo, glassMaterialDeco);
          oct.position.set(...pos);
          oct.scale.setScalar(0.5 + Math.random() * 0.4);
          oct.userData = {
            floatSpeed: 0.18 + Math.random() * 0.3,
            floatOffset: Math.random() * Math.PI * 2,
            rotSpeed: 0.006 + Math.random() * 0.01,
            basePos: [...pos],
          };
          mainGroup.add(oct);
        });

        // Torus rings
        const torus1 = new THREE.Mesh(new THREE.TorusGeometry(46, 0.6, 16, 100), glassMaterialRing);
        torus1.position.set(0, 0, -30);
        torus1.rotation.x = Math.PI * 0.3;
        torus1.rotation.y = Math.PI * 0.1;
        mainGroup.add(torus1);

        const torus2Mat = glassMaterialRing.clone();
        torus2Mat.opacity = 0.3;
        const torus2 = new THREE.Mesh(new THREE.TorusGeometry(52, 0.4, 16, 100), torus2Mat);
        torus2.position.set(0, 0, -38);
        torus2.rotation.x = Math.PI * 0.5;
        torus2.rotation.z = Math.PI * 0.15;
        mainGroup.add(torus2);

        const torus3Mat = glassMaterialRing.clone();
        torus3Mat.opacity = 0.2;
        const torus3 = new THREE.Mesh(new THREE.TorusGeometry(40, 0.3, 16, 100), torus3Mat);
        torus3.position.set(0, 0, -25);
        torus3.rotation.x = Math.PI * 0.15;
        torus3.rotation.y = Math.PI * 0.4;
        mainGroup.add(torus3);

        // Shards
        const shardGeo = new THREE.BoxGeometry(0.3, 4, 4);
        const shardPositions = [
          [-46, -8, -12], [48, 15, -15], [-22, 40, -10],
          [25, -38, -16], [50, -10, -20],
        ];
        shardPositions.forEach((pos) => {
          const shard = new THREE.Mesh(shardGeo, glassMaterialDeco);
          shard.position.set(...pos);
          shard.rotation.z = Math.random() * Math.PI;
          shard.rotation.x = Math.random() * Math.PI;
          shard.scale.setScalar(0.5 + Math.random() * 0.6);
          shard.userData = {
            floatSpeed: 0.15 + Math.random() * 0.2,
            floatOffset: Math.random() * Math.PI * 2,
            rotSpeed: 0.003 + Math.random() * 0.005,
            basePos: [...pos],
          };
          mainGroup.add(shard);
        });

        // Particles
        const particleCount = 280;
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(particleCount * 3);
        const pColors = new Float32Array(particleCount * 3);
        const colorOptions = [
          [0, 0.94, 0.82], [1, 0.24, 0.6],
          [0.43, 0.55, 1], [1, 1, 1],
        ];
        for (let i = 0; i < particleCount; i++) {
          pPositions[i * 3] = (Math.random() - 0.5) * 260;
          pPositions[i * 3 + 1] = (Math.random() - 0.5) * 150;
          pPositions[i * 3 + 2] = (Math.random() - 0.5) * 130 - 15;
          const c = colorOptions[Math.floor(Math.random() * colorOptions.length)];
          pColors[i * 3] = c[0];
          pColors[i * 3 + 1] = c[1];
          pColors[i * 3 + 2] = c[2];
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
        const pMat = new THREE.PointsMaterial({
          size: 0.7,
          vertexColors: true,
          transparent: true,
          opacity: 0.55,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        particleSystem = new THREE.Points(pGeo, pMat);
        scene.add(particleSystem);
      },
      undefined,
      (error) => console.error('Font gagal dimuat:', error)
    );

    function updateCountdownMesh() {
      if (!loadedFont || !countdownMesh) return;
      const currentString = getCountdownString();
      if (currentString === lastCountdownString) return;
      lastCountdownString = currentString;
      const newGeometry = centerGeometry(
        new TextGeometry(currentString, {
          font: loadedFont,
          size: 7.5,
          height: 3.5,
          curveSegments: 14,
          bevelEnabled: true,
          bevelThickness: 1.2,
          bevelSize: 0.6,
          bevelSegments: 6,
        })
      );
      countdownMesh.geometry.dispose();
      countdownMesh.geometry = newGeometry;
      wobbleStartTime = Date.now();
    }

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function pad(n) { return String(n).padStart(2, '0'); }
    function updateProgressBar() {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const fill = document.getElementById('progressFill');
      const pctLabel = document.getElementById('progressPct');
      if (fill) fill.style.width = pct.toFixed(2) + '%';
      if (pctLabel) pctLabel.textContent = pct.toFixed(1) + '%';
    }
    function updateClock() {
      const d = new Date();
      const clock = document.getElementById('liveClock');
      if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function animate() {
      requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      camera.position.x = mouseX * 6;
      camera.position.y = -mouseY * 4;
      camera.lookAt(0, 0, 0);

      nameGroup.position.y = 30 + Math.sin(t * 0.4) * 0.6;
      nameGroup.rotation.y = Math.sin(t * 0.2) * 0.025;

      countdownGroup.rotation.y = Math.cos(t * 0.3) * 0.06;
      countdownGroup.rotation.x = Math.sin(t * 0.25) * 0.025;
      countdownGroup.position.y = -38 + Math.cos(t * 0.45) * 0.8;

      if (wobbleStartTime > 0) {
        const elapsed = Date.now() - wobbleStartTime;
        const duration = 650;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const decay = 1 - progress;
          const wobble = Math.sin(progress * Math.PI * 3.5) * decay;
          countdownGroup.scale.y = 1 + wobble * 0.13;
          countdownGroup.scale.x = 1 - wobble * 0.07;
          countdownGroup.scale.z = 1 - wobble * 0.07;
          countdownGroup.rotation.z = Math.sin(progress * Math.PI * 2.5) * decay * 0.025;
        } else {
          countdownGroup.scale.set(1, 1, 1);
          countdownGroup.rotation.z = 0;
          wobbleStartTime = 0;
        }
      }

      updateCountdownMesh();
      const { diff } = getCountdownParts();
      if (diff <= 0 && !redirected) {
        redirected = true;
        const overlay = document.getElementById('redirecting');
        if (overlay) overlay.classList.add('active');
        setTimeout(() => (window.location.href = redirectUrl), 1800);
      }
      updateProgressBar();

      pointLightCyan.position.x = Math.sin(t * 0.5) * 35;
      pointLightCyan.position.z = Math.cos(t * 0.5) * 35 + 20;
      pointLightCyan.position.y = Math.sin(t * 0.7) * 12 + 5;
      pointLightMagenta.position.x = Math.cos(t * 0.4) * 30;
      pointLightMagenta.position.z = Math.sin(t * 0.4) * 30 + 20;
      pointLightMagenta.position.y = Math.cos(t * 0.6) * 10 - 5;
      pointLightBlue.position.y = Math.sin(t * 0.8) * 18 + 20;
      pointLightBlue.position.x = Math.cos(t * 0.3) * 15;

      mainGroup.children.forEach((child) => {
        if (child.userData?.basePos) {
          const ud = child.userData;
          child.position.y = ud.basePos[1] + Math.sin(t * ud.floatSpeed + ud.floatOffset) * 2.5;
          child.rotation.x += ud.rotSpeed;
          child.rotation.y += ud.rotSpeed * 1.3;
        }
        if (child.isMesh && child.geometry?.type === 'TorusGeometry') {
          child.rotation.z += 0.0012;
          child.rotation.x += 0.0006;
        }
      });

      if (particleSystem) {
        particleSystem.rotation.y = t * 0.015;
        particleSystem.rotation.x = Math.sin(t * 0.1) * 0.05;
      }

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    updateClock();
    setInterval(updateClock, 1000);

    return () => {
      // Cleanup
      renderer.dispose();
      pmremGenerator.dispose();
      // Hentikan animasi
      // (bisa simpan id requestAnimationFrame)
    };

}, []);

return (
<>
{/_ Konten HTML seperti sebelumnya _/}

<div id="three-container" />
<div className="scene-vignette" />
<div className="bg-grid" />
<div className="bg-noise" />
<div className="scanline" />

      {/* Corner brackets */}
      <div className="corner corner-tl">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,240,208,0.4)" strokeWidth="1">
          <path d="M 12 26 L 12 12 L 26 12" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="rgba(0,240,208,0.6)" stroke="none" />
          <path d="M 18 12 L 22 12" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="corner corner-tr">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(255,61,154,0.4)" strokeWidth="1">
          <path d="M 12 26 L 12 12 L 26 12" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="rgba(255,61,154,0.6)" stroke="none" />
          <path d="M 18 12 L 22 12" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="corner corner-bl">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(110,140,255,0.4)" strokeWidth="1">
          <path d="M 12 26 L 12 12 L 26 12" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="rgba(110,140,255,0.6)" stroke="none" />
          <path d="M 18 12 L 22 12" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="corner corner-br">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,240,208,0.4)" strokeWidth="1">
          <path d="M 12 26 L 12 12 L 26 12" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="rgba(0,240,208,0.6)" stroke="none" />
          <path d="M 18 12 L 22 12" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Top bar */}
      <div className="top-bar">
        <div className="brand">
          <div className="brand-dot" />
          <span>ASSTRO GUDANG</span>
          <span className="brand-version">/ v2.4</span>
        </div>
        <div className="status-badge">
          <span className="status-badge-dot" />
          <span>System Update In Progress</span>
        </div>
      </div>

      {/* Center content */}
      <div className="center-content">
        <h1 className="heading">
          Sistem sedang menjalani<br />
          <span className="grad">pembaharuan menyeluruh</span>
        </h1>
        <p className="subtitle">
          Kami sedang melakukan mutasi database. Aplikasi lama telah ditutup dan akan dialihkan otomatis ke domain baru <strong>alma-app.vercel.app</strong>.
        </p>
        <div className="target-domain">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          alma-app.vercel.app
        </div>
        <div className="countdown-labels">
          <span>Hari</span><span>Jam</span><span>Menit</span><span>Detik</span>
        </div>
        <div className="progress-section">
          <div className="progress-info">
            <span>Progress Menuju Launch</span>
            <span className="pct" id="progressPct">0%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" id="progressFill" style={{ width: '0%' }} />
          </div>
        </div>
        <div className="cta-row">
          <a href="https://alma-client-unv.vercel.app/" className="cta">
            <span>Kunjungi Alma Sekarang</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a href="mailto:rendifaizaldat@gmail.com" className="cta-secondary">Hubungi Tim Support</a>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span>© 2026 ASSTRO GUDANG</span>
        <span className="dot" />
        <span>POWERED BY ALMA @Rendifaizaldat</span>
        <span className="dot" />
        <span className="live" id="liveClock">--:--:--</span>
      </div>

      {/* Redirecting overlay */}
      <div className="redirecting" id="redirecting">
        <div className="redirecting-spinner" />
        <div className="redirecting-text">Mengalihkan ke domain baru...</div>
      </div>
    </>

);
}
