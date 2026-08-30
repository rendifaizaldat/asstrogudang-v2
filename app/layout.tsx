'use client';
import { useEffect, useState } from 'react';
import './globals.css'; // Pastikan CSS global tetap dipanggil

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState(new Date('2026-09-01T00:00:00').getTime() - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = new Date('2026-09-01T00:00:00').getTime() - new Date().getTime();
      setTimeLeft(remaining);
      
      // Jika waktu hitungan mundur sudah habis, otomatis arahkan ke domain baru
      if (remaining <= 0) {
        window.location.href = 'https://alma-app.vercel.app';
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Asstro Gudang — Pembaharuan Sistem</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

    <script type="importmap">
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    <style>
        :root {
            --bg: #03060d;
            --bg-2: #0a1424;
            --fg: #eaf4ff;
            --muted: #7a8ea3;
            --dim: #3a4a5e;
            --accent: #00f0d0;
            --accent-2: #ff3d9a;
            --accent-3: #6e8cff;
            --glass: rgba(255, 255, 255, 0.035);
            --glass-2: rgba(255, 255, 255, 0.06);
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-border-strong: rgba(255, 255, 255, 0.2);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html,
        body {
            height: 100%;
            overflow: hidden;
        }

        body {
            font-family: 'Space Grotesk', system-ui, sans-serif;
            background: radial-gradient(ellipse at 50% 50%, var(--bg-2), var(--bg) 70%);
            color: var(--fg);
            min-height: 100vh;
            position: relative;
            -webkit-font-smoothing: antialiased;
        }

        /* ===== THREE.JS CANVAS ===== */
        #three-container {
            position: fixed;
            inset: 0;
            z-index: 1;
            overflow: hidden;
        }
        #three-container canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
        }

        /* Vignette gelap di tepi */
        .scene-vignette {
            position: fixed;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            background: radial-gradient(ellipse 80% 70% at center, transparent 25%, rgba(3, 6, 13, 0.5) 70%, rgba(3, 6, 13, 0.85) 100%);
        }

        /* ===== BACKGROUND LAYERS (CSS fallback) ===== */
        .bg-grid {
            position: fixed;
            inset: -50px;
            background-image:
                linear-gradient(rgba(0, 240, 208, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 208, 0.03) 1px, transparent 1px);
            background-size: 64px 64px;
            -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
            mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
            pointer-events: none;
            z-index: 0;
            animation: gridDrift 30s linear infinite;
        }
        @keyframes gridDrift {
            to {
                transform: translate(64px, 64px);
            }
        }

        .bg-noise {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .scanline {
            position: fixed;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--accent), transparent);
            opacity: 0.3;
            z-index: 4;
            pointer-events: none;
            animation: scan 9s linear infinite;
        }
        @keyframes scan {
            0% {
                top: -2px;
                opacity: 0;
            }
            10% {
                opacity: 0.3;
            }
            90% {
                opacity: 0.3;
            }
            100% {
                top: 100vh;
                opacity: 0;
            }
        }

        /* ===== CORNER DECORATIONS ===== */
        .corner {
            position: fixed;
            width: 64px;
            height: 64px;
            z-index: 10;
            pointer-events: none;
        }
        .corner svg {
            width: 100%;
            height: 100%;
        }
        .corner-tl {
            top: 24px;
            left: 24px;
        }
        .corner-tr {
            top: 24px;
            right: 24px;
            transform: scaleX(-1);
        }
        .corner-bl {
            bottom: 24px;
            left: 24px;
            transform: scaleY(-1);
        }
        .corner-br {
            bottom: 24px;
            right: 24px;
            transform: scale(-1, -1);
        }

        /* ===== TOP BAR ===== */
        .top-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 20;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 22px 32px;
            pointer-events: none;
        }
        .top-bar>* {
            pointer-events: auto;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.04em;
            color: rgba(255, 255, 255, 0.85);
            text-shadow: 0 2px 16px rgba(0, 0, 0, 0.7);
        }
        .brand-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 14px var(--accent), 0 0 28px rgba(0, 240, 208, 0.4);
            animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse {
            0%,
            100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.35;
                transform: scale(0.6);
            }
        }
        .brand-version {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 400;
            letter-spacing: 0.12em;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 8px 18px;
            background: var(--glass-2);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 100px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--accent);
            text-shadow: 0 0 16px rgba(0, 240, 208, 0.4);
            position: relative;
            overflow: hidden;
        }
        .status-badge::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(0, 240, 208, 0.14), transparent);
            transform: translateX(-100%);
            animation: shimmer 3.5s ease-in-out infinite;
        }
        @keyframes shimmer {
            50%,
            100% {
                transform: translateX(100%);
            }
        }
        .status-badge-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 10px var(--accent);
            animation: pulse 1.4s ease-in-out infinite;
            position: relative;
            z-index: 1;
        }
        .status-badge span:last-child {
            position: relative;
            z-index: 1;
        }

        /* ===== CENTER CONTENT ===== */
        .center-content {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 15;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            pointer-events: none;
            width: 100%;
            max-width: 720px;
            padding: 0 24px;
        }
        .center-content>* {
            pointer-events: auto;
        }

        .heading {
            font-size: clamp(24px, 3.5vw, 40px);
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.02em;
            margin-bottom: 14px;
            text-shadow: 0 4px 30px rgba(0, 0, 0, 0.9);
        }
        .heading .grad {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-3) 50%, var(--accent-2) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: inline-block;
        }

        .subtitle {
            font-size: 14px;
            color: rgba(234, 244, 255, 0.65);
            max-width: 520px;
            line-height: 1.6;
            margin-bottom: 12px;
            text-shadow: 0 2px 20px rgba(0, 0, 0, 0.9);
        }
        .subtitle strong {
            color: rgba(234, 244, 255, 0.95);
            font-weight: 500;
        }

        .target-domain {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(0, 240, 208, 0.08);
            border: 1px solid rgba(0, 240, 208, 0.22);
            border-radius: 8px;
            color: var(--accent);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            margin-bottom: 16px;
            text-shadow: 0 0 12px rgba(0, 240, 208, 0.25);
        }
        .target-domain svg {
            width: 12px;
            height: 12px;
        }

        /* ===== COUNTDOWN LABELS ===== */
        .countdown-labels {
            display: flex;
            gap: 52px;
            margin-bottom: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: rgba(234, 244, 255, 0.45);
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
            pointer-events: none;
        }
        .countdown-labels span {
            min-width: 36px;
        }

        /* ===== PROGRESS BAR ===== */
        .progress-section {
            width: 100%;
            max-width: 440px;
            margin-top: 16px;
            pointer-events: auto;
        }
        .progress-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
        }
        .progress-info .pct {
            color: var(--accent);
            font-weight: 600;
        }
        .progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent), var(--accent-3));
            border-radius: 2px;
            box-shadow: 0 0 14px var(--accent);
            transition: width 1s ease;
            position: relative;
        }
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 24px;
            height: 100%;
            background: linear-gradient(90deg, transparent, white);
            opacity: 0.6;
            animation: progShine 2s ease-in-out infinite;
        }
        @keyframes progShine {
            0%,
            100% {
                opacity: 0;
            }
            50% {
                opacity: 0.6;
            }
        }

        /* ===== CTA ===== */
        .cta-row {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 18px;
            pointer-events: auto;
        }
        .cta {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 13px 26px;
            background: linear-gradient(135deg, rgba(0, 240, 208, 0.18), rgba(110, 140, 255, 0.18));
            border: 1px solid rgba(0, 240, 208, 0.4);
            border-radius: 100px;
            color: var(--fg);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            transition: all 0.3s ease;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 20px 40px -10px rgba(0, 240, 208, 0.3);
        }
        .cta:hover {
            transform: translateY(-2px);
            border-color: var(--accent);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 30px 60px -10px rgba(0, 240, 208, 0.5);
        }
        .cta svg {
            width: 15px;
            height: 15px;
            transition: transform 0.3s;
        }
        .cta:hover svg {
            transform: translateX(4px);
        }

        .cta-secondary {
            padding: 13px 22px;
            background: var(--glass-2);
            border: 1px solid var(--glass-border);
            border-radius: 100px;
            color: rgba(234, 244, 255, 0.55);
            text-decoration: none;
            font-size: 13px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            transition: all 0.3s;
        }
        .cta-secondary:hover {
            color: var(--fg);
            border-color: var(--glass-border-strong);
            transform: translateY(-2px);
        }

        /* ===== FOOTER ===== */
        .footer {
            position: fixed;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            color: rgba(234, 244, 255, 0.3);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: none;
            white-space: nowrap;
        }
        .footer .dot {
            width: 3px;
            height: 3px;
            background: rgba(234, 244, 255, 0.3);
            border-radius: 50%;
        }
        .footer .live {
            color: rgba(0, 240, 208, 0.65);
        }

        /* ===== REDIRECTING OVERLAY ===== */
        .redirecting {
            position: fixed;
            inset: 0;
            background: rgba(3, 6, 13, 0.92);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            z-index: 100;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 24px;
        }
        .redirecting.active {
            display: flex;
        }
        .redirecting-spinner {
            width: 56px;
            height: 56px;
            border: 2px solid rgba(0, 240, 208, 0.12);
            border-top-color: var(--accent);
            border-right-color: var(--accent-3);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
        .redirecting-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: var(--accent);
            letter-spacing: 0.22em;
            text-transform: uppercase;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .top-bar {
                padding: 16px 18px;
            }
            .brand {
                font-size: 11px;
                gap: 7px;
            }
            .brand-version {
                display: none;
            }
            .status-badge {
                font-size: 8px;
                padding: 6px 12px;
                letter-spacing: 0.16em;
            }
            .heading {
                font-size: clamp(20px, 4vw, 28px);
            }
            .subtitle {
                font-size: 12px;
            }
            .countdown-labels {
                gap: 24px;
                font-size: 8px;
            }
            .corner {
                width: 40px;
                height: 40px;
            }
            .corner-tl,
            .corner-tr {
                top: 14px;
            }
            .corner-bl,
            .corner-br {
                bottom: 14px;
            }
            .corner-tl,
            .corner-bl {
                left: 14px;
            }
            .corner-tr,
            .corner-br {
                right: 14px;
            }
            .footer {
                font-size: 7px;
                gap: 8px;
            }
            .cta {
                padding: 11px 20px;
                font-size: 12px;
            }
            .cta-secondary {
                padding: 11px 16px;
                font-size: 12px;
            }
            .progress-section {
                max-width: 320px;
            }
        }
        @media (max-width: 480px) {
            .countdown-labels {
                gap: 16px;
                font-size: 7px;
                letter-spacing: 0.2em;
            }
            .countdown-labels span {
                min-width: 24px;
            }
            .heading {
                font-size: 18px;
            }
            .subtitle {
                font-size: 11px;
            }
            .target-domain {
                font-size: 10px;
                padding: 5px 10px;
            }
            .progress-section {
                max-width: 260px;
            }
        }
    </style>
</head>
<body>

    <!-- Three.js canvas container -->
    <div id="three-container"></div>

    <!-- Vignette overlay -->
    <div class="scene-vignette"></div>

    <!-- CSS Background layers -->
    <div class="bg-grid"></div>
    <div class="bg-noise"></div>
    <div class="scanline"></div>

    <!-- Corner brackets -->
    <div class="corner corner-tl">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,240,208,0.4)" stroke-width="1">
            <path d="M 12 26 L 12 12 L 26 12" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2.5" fill="rgba(0,240,208,0.6)" stroke="none"/>
            <path d="M 18 12 L 22 12" stroke-width="1.5"/>
        </svg>
    </div>
    <div class="corner corner-tr">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(255,61,154,0.4)" stroke-width="1">
            <path d="M 12 26 L 12 12 L 26 12" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2.5" fill="rgba(255,61,154,0.6)" stroke="none"/>
            <path d="M 18 12 L 22 12" stroke-width="1.5"/>
        </svg>
    </div>
    <div class="corner corner-bl">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(110,140,255,0.4)" stroke-width="1">
            <path d="M 12 26 L 12 12 L 26 12" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2.5" fill="rgba(110,140,255,0.6)" stroke="none"/>
            <path d="M 18 12 L 22 12" stroke-width="1.5"/>
        </svg>
    </div>
    <div class="corner corner-br">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,240,208,0.4)" stroke-width="1">
            <path d="M 12 26 L 12 12 L 26 12" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2.5" fill="rgba(0,240,208,0.6)" stroke="none"/>
            <path d="M 18 12 L 22 12" stroke-width="1.5"/>
        </svg>
    </div>

    <!-- Top bar -->
    <div class="top-bar">
        <div class="brand">
            <div class="brand-dot"></div>
            <span>ASSTRO GUDANG</span>
            <span class="brand-version">/ v2.4</span>
        </div>
        <div class="status-badge">
            <span class="status-badge-dot"></span>
            <span>System Update In Progress</span>
        </div>
    </div>

    <!-- Center content -->
    <div class="center-content">
        <h1 class="heading">
            Sistem sedang menjalani<br/>
            <span class="grad">pembaharuan menyeluruh</span>
        </h1>

        <p class="subtitle">
            Kami sedang melakukan mutasi database. Aplikasi lama telah ditutup dan akan dialihkan otomatis ke domain baru <strong>alma-app.vercel.app</strong>.
        </p>

        <div class="target-domain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            alma-app.vercel.app
        </div>

        <div class="countdown-labels">
            <span>Hari</span>
            <span>Jam</span>
            <span>Menit</span>
            <span>Detik</span>
        </div>

        <div class="progress-section">
            <div class="progress-info">
                <span>Progress Menuju Launch</span>
                <span class="pct" id="progressPct">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
            </div>
        </div>

        <div class="cta-row">
            <a href="https://alma-app.vercel.app" class="cta">
                <span>Kunjungi Alma Sekarang</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
            <a href="mailto:support@alma-app.vercel.app" class="cta-secondary">Hubungi Tim Support</a>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <span>© 2026 ASSTRO GUDANG</span>
        <span class="dot"></span>
        <span>POWERED BY ALMA</span>
        <span class="dot"></span>
        <span class="live" id="liveClock">--:--:--</span>
    </div>

    <!-- Redirecting overlay -->
    <div class="redirecting" id="redirecting">
        <div class="redirecting-spinner"></div>
        <div class="redirecting-text">Mengalihkan ke domain baru...</div>
    </div>

    <script type="module">
        import * as THREE from "three";
        import { FontLoader } from "three/addons/loaders/FontLoader.js";
        import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
        import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

        // ==================== SETUP ====================
        const container = document.getElementById("three-container");
        const scene = new THREE.Scene();

        // Background - dark gradient color (matches CSS theme)
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

        // Environment map untuk pantulan kaca
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(
            new RoomEnvironment(),
            0.04
        ).texture;
        scene.environmentIntensity = 0.45;

        // ==================== LIGHTING ====================
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(15, 25, 20);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xdcebf5, 0.5);
        dirLight2.position.set(-10, -5, 15);
        scene.add(dirLight2);

        // Point lights berwarna untuk pantulan dinamis
        const pointLightCyan = new THREE.PointLight(0x00f0d0, 1.6, 130);
        pointLightCyan.position.set(28, 14, 38);
        scene.add(pointLightCyan);

        const pointLightMagenta = new THREE.PointLight(0xff3d9a, 1.1, 110);
        pointLightMagenta.position.set(-28, -14, 32);
        scene.add(pointLightMagenta);

        const pointLightBlue = new THREE.PointLight(0x6e8cff, 0.9, 90);
        pointLightBlue.position.set(0, 38, 22);
        scene.add(pointLightBlue);

        // ==================== GLASS MATERIALS ====================
        const glassMaterialName = new THREE.MeshPhysicalMaterial({
            color: 0xf0f4f8,
            metalness: 0.0,
            roughness: 0.06,
            transmission: 0.72,
            ior: 1.45,
            thickness: 16.0,
            specularIntensity: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            envMapIntensity: 0.75,
            attenuationColor: new THREE.Color(0xb0d8e8),
            attenuationDistance: 40.0,
            transparent: true,
            opacity: 1.0,
        });

        const glassMaterialCountdown = new THREE.MeshPhysicalMaterial({
            color: 0xf0f4f8,
            metalness: 0.0,
            roughness: 0.04,
            transmission: 0.82,
            ior: 1.52,
            thickness: 24.0,
            specularIntensity: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.06,
            envMapIntensity: 0.75,
            attenuationColor: new THREE.Color(0xc8e0f0),
            attenuationDistance: 55.0,
            transparent: true,
            opacity: 1.0,
        });

        const glassMaterialDeco = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.04,
            transmission: 0.68,
            ior: 1.45,
            thickness: 8.0,
            specularIntensity: 0.85,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            envMapIntensity: 0.65,
            attenuationColor: new THREE.Color(0xdcebf5),
            attenuationDistance: 28.0,
            transparent: true,
            opacity: 0.9,
        });

        const glassMaterialRing = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.05,
            transmission: 0.6,
            ior: 1.45,
            thickness: 5.0,
            specularIntensity: 0.7,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.55,
            transparent: true,
            opacity: 0.45,
        });

        // ==================== GROUPS ====================
        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        const nameGroup = new THREE.Group();
        nameGroup.position.set(0, 30, 0);
        mainGroup.add(nameGroup);

        const countdownGroup = new THREE.Group();
        countdownGroup.position.set(0, -38, 0);
        mainGroup.add(countdownGroup);

        // ==================== COUNTDOWN LOGIC ====================
        const targetDate = new Date("2026-09-01T00:00:00");
        const redirectUrl = "https://alma-app.vercel.app";
        const startTime = Date.now();
        const totalDuration = Math.max(1, targetDate.getTime() - startTime);

        function getCountdownParts() {
            const now = new Date();
            const diff = Math.max(0, targetDate - now);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            return { days, hours, minutes, seconds, diff };
        }

        function getCountdownString() {
            const { days, hours, minutes, seconds } = getCountdownParts();
            const dStr = String(days).padStart(3, "0");
            return `${dStr} : ${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;
        }

        // ==================== FONT LOADING & MESH CREATION ====================
        const fontLoader = new FontLoader();
        let loadedFont = null;
        let countdownMesh = null;
        let lastCountdownString = "";
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
            "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json",
            function(font) {
                loadedFont = font;

                // ---- TEKS NAMA "ASSTRO GUDANG" ----
                const nameGeometry = centerGeometry(
                    new TextGeometry("ASSTRO GUDANG", {
                        font: loadedFont,
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

                // ---- COUNTDOWN AWAL ----
                lastCountdownString = getCountdownString();
                const countdownGeometry = centerGeometry(
                    new TextGeometry(lastCountdownString, {
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
                countdownMesh = new THREE.Mesh(countdownGeometry, glassMaterialCountdown);
                countdownGroup.add(countdownMesh);

                // ---- DEKORASI: GLASS SPHERES ----
                const sphereGeo = new THREE.SphereGeometry(1.8, 32, 32);
                const spherePositions = [
                    [-32, 20, -8],
                    [30, -22, -12],
                    [38, 10, -18],
                    [-30, -28, -10],
                    [2, 42, -16],
                    [44, 28, -6],
                    [-42, 8, -22],
                    [-15, -38, -14],
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

                // ---- DEKORASI: GLASS OCTAHEDRONS ----
                const octGeo = new THREE.OctahedronGeometry(2.8, 0);
                const octPositions = [
                    [22, 32, -14],
                    [-26, -16, -20],
                    [40, -30, -8],
                    [-38, 28, -18],
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

                // ---- DEKORASI: GLASS TORUS RINGS ----
                const torus1 = new THREE.Mesh(
                    new THREE.TorusGeometry(46, 0.6, 16, 100),
                    glassMaterialRing
                );
                torus1.position.set(0, 0, -30);
                torus1.rotation.x = Math.PI * 0.3;
                torus1.rotation.y = Math.PI * 0.1;
                mainGroup.add(torus1);

                const torus2Mat = glassMaterialRing.clone();
                torus2Mat.opacity = 0.3;
                const torus2 = new THREE.Mesh(
                    new THREE.TorusGeometry(52, 0.4, 16, 100),
                    torus2Mat
                );
                torus2.position.set(0, 0, -38);
                torus2.rotation.x = Math.PI * 0.5;
                torus2.rotation.z = Math.PI * 0.15;
                mainGroup.add(torus2);

                const torus3Mat = glassMaterialRing.clone();
                torus3Mat.opacity = 0.2;
                const torus3 = new THREE.Mesh(
                    new THREE.TorusGeometry(40, 0.3, 16, 100),
                    torus3Mat
                );
                torus3.position.set(0, 0, -25);
                torus3.rotation.x = Math.PI * 0.15;
                torus3.rotation.y = Math.PI * 0.4;
                mainGroup.add(torus3);

                // ---- DEKORASI: GLASS SHARDS ----
                const shardGeo = new THREE.BoxGeometry(0.3, 4, 4);
                const shardPositions = [
                    [-46, -8, -12],
                    [48, 15, -15],
                    [-22, 40, -10],
                    [25, -38, -16],
                    [50, -10, -20],
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

                // ---- PARTICLE SYSTEM ----
                const particleCount = 280;
                const pGeo = new THREE.BufferGeometry();
                const pPositions = new Float32Array(particleCount * 3);
                const pColors = new Float32Array(particleCount * 3);

                const colorOptions = [
                    [0, 0.94, 0.82],
                    [1, 0.24, 0.6],
                    [0.43, 0.55, 1],
                    [1, 1, 1],
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
            (error) => {
                console.error("Font gagal dimuat:", error);
            }
        );

        // ==================== UPDATE COUNTDOWN ====================
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

            if (countdownMesh.geometry) {
                countdownMesh.geometry.dispose();
            }
            countdownMesh.geometry = newGeometry;

            // Efek jelly/wobble
            wobbleStartTime = Date.now();
        }

        // ==================== MOUSE PARALLAX ====================
        let mouseX = 0,
            mouseY = 0;
        let targetMouseX = 0,
            targetMouseY = 0;

        window.addEventListener("mousemove", (e) => {
            targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // ==================== PROGRESS BAR & CLOCK UPDATE ====================
        function pad(n, len = 2) {
            return String(n).padStart(len, '0');
        }

        function updateProgressBar() {
            const now = Date.now();
            const remaining = targetDate.getTime() - now;
            const elapsed = now - startTime;
            const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            document.getElementById('progressFill').style.width = pct.toFixed(2) + '%';
            document.getElementById('progressPct').textContent = pct.toFixed(1) + '%';
        }

        function updateLiveClock() {
            const d = new Date();
            document.getElementById('liveClock').textContent =
                pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }

        // ==================== ANIMATION LOOP ====================
        function animate() {
            requestAnimationFrame(animate);

            const t = Date.now() * 0.001;

            // Smooth mouse parallax
            mouseX += (targetMouseX - mouseX) * 0.04;
            mouseY += (targetMouseY - mouseY) * 0.04;
            camera.position.x = mouseX * 6;
            camera.position.y = -mouseY * 4;
            camera.lookAt(0, 0, 0);

            // Animasi name group
            if (nameGroup) {
                nameGroup.position.y = 30 + Math.sin(t * 0.4) * 0.6;
                nameGroup.rotation.y = Math.sin(t * 0.2) * 0.025;
            }

            // Animasi countdown group
            if (countdownGroup) {
                countdownGroup.rotation.y = Math.cos(t * 0.3) * 0.06;
                countdownGroup.rotation.x = Math.sin(t * 0.25) * 0.025;
                countdownGroup.position.y = -38 + Math.cos(t * 0.45) * 0.8;

                // Efek squash & stretch (jelly)
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
            }

            // Update countdown mesh
            updateCountdownMesh();

            // Cek redirect
            const { diff } = getCountdownParts();
            if (diff <= 0 && !redirected) {
                redirected = true;
                document.getElementById("redirecting").classList.add("active");
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1800);
            }

            // Update progress bar
            updateProgressBar();

            // Animasi point lights
            pointLightCyan.position.x = Math.sin(t * 0.5) * 35;
            pointLightCyan.position.z = Math.cos(t * 0.5) * 35 + 20;
            pointLightCyan.position.y = Math.sin(t * 0.7) * 12 + 5;

            pointLightMagenta.position.x = Math.cos(t * 0.4) * 30;
            pointLightMagenta.position.z = Math.sin(t * 0.4) * 30 + 20;
            pointLightMagenta.position.y = Math.cos(t * 0.6) * 10 - 5;

            pointLightBlue.position.y = Math.sin(t * 0.8) * 18 + 20;
            pointLightBlue.position.x = Math.cos(t * 0.3) * 15;

            // Animasi dekorasi
            mainGroup.children.forEach((child) => {
                if (child.userData && child.userData.basePos) {
                    const ud = child.userData;
                    child.position.y = ud.basePos[1] + Math.sin(t * ud.floatSpeed + ud.floatOffset) * 2.5;
                    child.rotation.x += ud.rotSpeed;
                    child.rotation.y += ud.rotSpeed * 1.3;
                }
                if (child.isMesh && child.geometry && child.geometry.type === "TorusGeometry") {
                    child.rotation.z += 0.0012;
                    child.rotation.x += 0.0006;
                }
            });

            // Particles rotation
            if (particleSystem) {
                particleSystem.rotation.y = t * 0.015;
                particleSystem.rotation.x = Math.sin(t * 0.1) * 0.05;
            }

            renderer.render(scene, camera);
        }
        animate();

        // ==================== RESIZE ====================
        window.addEventListener("resize", () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

        // ==================== LIVE CLOCK INTERVAL ====================
        updateLiveClock();
        setInterval(updateLiveClock, 1000);
    </script>
</body>
</html>
  );
}
