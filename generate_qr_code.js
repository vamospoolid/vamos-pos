const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateQRCodes() {
    const downloadUrl = 'https://app.vamospool.id/VamosPlayer.apk';
    const artifactDir = 'C:\\Users\\Balanipastudio\\.gemini\\antigravity-ide\\brain\\26196b6b-420d-4e9c-8683-197da8a85834';
    const publicDir = path.join(__dirname, 'vamos-player-app', 'public');
    const distDir = path.join(__dirname, 'vamos-player-app', 'dist');

    // 1. High Resolution Standalone QR Code (PNG) - 1200x1200px
    const qrPngBuffer = await QRCode.toBuffer(downloadUrl, {
        type: 'png',
        width: 1200,
        margin: 2,
        color: {
            dark: '#070b14', // Deep Navy
            light: '#ffffff' // Crisp White
        },
        errorCorrectionLevel: 'H'
    });

    const qrCyanPngBuffer = await QRCode.toBuffer(downloadUrl, {
        type: 'png',
        width: 1200,
        margin: 2,
        color: {
            dark: '#06b6d4', // Cyan
            light: '#070b14' // Dark Navy
        },
        errorCorrectionLevel: 'H'
    });

    // 2. SVG QR Code for embedding inside Poster
    const qrSvgString = await QRCode.toString(downloadUrl, {
        type: 'svg',
        margin: 1,
        color: {
            dark: '#06b6d4',
            light: '#0a1020'
        },
        errorCorrectionLevel: 'H'
    });

    // 3. Create a stunning SVG Standee / Poster
    const posterSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="50%" stop-color="#0d1628"/>
      <stop offset="100%" stop-color="#070b14"/>
    </linearGradient>

    <!-- Cyan Glow Gradient -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>

    <!-- Card Background -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#111d35"/>
      <stop offset="100%" stop-color="#09101f"/>
    </linearGradient>

    <!-- Filter for Glow -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="1150" fill="url(#bgGrad)" />

  <!-- Ambient Glow Circles -->
  <circle cx="150" cy="150" r="200" fill="#06b6d4" opacity="0.12" filter="url(#softGlow)" />
  <circle cx="650" cy="1000" r="250" fill="#3b82f6" opacity="0.12" filter="url(#softGlow)" />
  <circle cx="400" cy="600" r="280" fill="#06b6d4" opacity="0.08" filter="url(#softGlow)" />

  <!-- Outer Border Frame -->
  <rect x="30" y="30" width="740" height="1090" rx="36" fill="none" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="2" />
  <rect x="40" y="40" width="720" height="1070" rx="30" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1" />

  <!-- Top Logo & Badge -->
  <g transform="translate(400, 110)">
    <!-- Logo Symbol -->
    <g transform="translate(0, 0)">
      <rect x="-42" y="-42" width="84" height="84" rx="24" fill="#06b6d4" fill-opacity="0.1" stroke="#06b6d4" stroke-width="2" stroke-opacity="0.4" />
      <!-- Minimalist Sharp V -->
      <path d="M-24,-24 L0,28 L24,-24 L8,-24 L0,-6 L-8,-24 Z" fill="#06b6d4" />
    </g>

    <!-- Title -->
    <text y="75" text-anchor="middle" font-family="'Outfit', 'Segoe UI', Arial, sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="2" font-style="italic">
      VAMOS<tspan fill="#06b6d4">POOL</tspan>
    </text>
    <text y="102" text-anchor="middle" font-family="'Outfit', 'Segoe UI', Arial, sans-serif" font-weight="800" font-size="12" fill="#06b6d4" letter-spacing="5" font-style="italic">
      OFFICIAL PLAYER APP
    </text>
  </g>

  <!-- Middle Banner: Instruction -->
  <g transform="translate(400, 280)">
    <text y="0" text-anchor="middle" font-family="'Outfit', 'Segoe UI', Arial, sans-serif" font-weight="900" font-size="38" fill="#ffffff" font-style="italic">
      SCAN UNTUK DOWNLOAD
    </text>
    <text y="34" text-anchor="middle" font-family="'Outfit', 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="16" fill="#94a3b8" letter-spacing="1">
      Aplikasi Android Versi Terbaru (v5)
    </text>
  </g>

  <!-- QR Code Container Card -->
  <g transform="translate(160, 360)">
    <!-- Card Frame -->
    <rect width="480" height="480" rx="36" fill="url(#cardGrad)" stroke="#06b6d4" stroke-width="2" stroke-opacity="0.5" filter="url(#glow)" />
    
    <!-- Inner White QR Background Box for maximum readability -->
    <rect x="35" y="35" width="410" height="410" rx="24" fill="#ffffff" />
    
    <!-- Embedded High-Quality QR Code (Scalable SVG) -->
    <g transform="translate(50, 50)">
      <!-- Render QR image inside white box -->
      <image href="data:image/png;base64,${qrPngBuffer.toString('base64')}" x="0" y="0" width="380" height="380" />
    </g>

    <!-- Corner Accents -->
    <path d="M 20 50 L 20 20 L 50 20" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
    <path d="M 460 50 L 460 20 L 430 20" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
    <path d="M 20 430 L 20 460 L 50 460" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
    <path d="M 460 430 L 460 460 L 430 460" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" />
  </g>

  <!-- Features Highlight Pills -->
  <g transform="translate(400, 900)">
    <g transform="translate(-250, 0)">
      <rect width="150" height="42" rx="21" fill="#06b6d4" fill-opacity="0.12" stroke="#06b6d4" stroke-opacity="0.3" stroke-width="1.5" />
      <text x="75" y="26" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-weight="800" font-size="13" fill="#06b6d4" font-style="italic">⚡ BOOKING PAKET</text>
    </g>
    <g transform="translate(-75, 0)">
      <rect width="150" height="42" rx="21" fill="#06b6d4" fill-opacity="0.12" stroke="#06b6d4" stroke-opacity="0.3" stroke-width="1.5" />
      <text x="75" y="26" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-weight="800" font-size="13" fill="#06b6d4" font-style="italic">🎁 TUKAR POIN</text>
    </g>
    <g transform="translate(100, 0)">
      <rect width="150" height="42" rx="21" fill="#06b6d4" fill-opacity="0.12" stroke="#06b6d4" stroke-opacity="0.3" stroke-width="1.5" />
      <text x="75" y="26" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-weight="800" font-size="13" fill="#06b6d4" font-style="italic">🏆 TOURNAMENT</text>
    </g>
  </g>

  <!-- URL Link Footer -->
  <g transform="translate(400, 995)">
    <rect x="-260" y="-22" width="520" height="44" rx="22" fill="#09101f" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1" />
    <text y="6" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-weight="700" font-size="15" fill="#38bdf8" letter-spacing="1">
      https://app.vamospool.id/VamosPlayer.apk
    </text>
  </g>

  <!-- Footer Tagline -->
  <text x="400" y="1070" text-anchor="middle" font-family="'Outfit', Arial, sans-serif" font-weight="700" font-size="11" fill="#64748b" letter-spacing="3">
    TANGKAS • TANDING • TAKLUKKAN
  </text>
</svg>
`;

    // Save standalone QR files
    const qrWhitePngPath = path.join(__dirname, 'vamos_apk_qr_white.png');
    const qrCyanPngPath = path.join(__dirname, 'vamos_apk_qr_cyan.png');
    const posterSvgPath = path.join(__dirname, 'vamos_apk_download_poster.svg');

    fs.writeFileSync(qrWhitePngPath, qrPngBuffer);
    fs.writeFileSync(qrCyanPngPath, qrCyanPngBuffer);
    fs.writeFileSync(posterSvgPath, posterSvg);

    // Save to brain/artifacts dir
    if (fs.existsSync(artifactDir)) {
        fs.writeFileSync(path.join(artifactDir, 'vamos_apk_qr_white.png'), qrPngBuffer);
        fs.writeFileSync(path.join(artifactDir, 'vamos_apk_qr_cyan.png'), qrCyanPngBuffer);
        fs.writeFileSync(path.join(artifactDir, 'vamos_apk_download_poster.svg'), posterSvg);
    }

    // Save to public & dist directories for online hosting
    if (fs.existsSync(publicDir)) {
        fs.writeFileSync(path.join(publicDir, 'vamos_apk_qr.png'), qrPngBuffer);
        fs.writeFileSync(path.join(publicDir, 'vamos_apk_poster.svg'), posterSvg);
    }
    if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'vamos_apk_qr.png'), qrPngBuffer);
        fs.writeFileSync(path.join(distDir, 'vamos_apk_poster.svg'), posterSvg);
    }

    console.log('✅ QR Code PNG Standalone (White BG) generated: ' + qrWhitePngPath);
    console.log('✅ QR Code PNG Standalone (Cyan/Navy) generated: ' + qrCyanPngPath);
    console.log('✅ QR Code Poster SVG generated: ' + posterSvgPath);
}

generateQRCodes().catch(console.error);
