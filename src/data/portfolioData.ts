export type Vec3Tuple = [number, number, number];

export interface CosmicSector {
  id: string;
  indexLabel: string;
  shortNavLabel: string;
  title: string;
  headline: string;
  narrative: string;
  highlights: string[];
  range: [number, number];
  anchorProgress: number;
  accentHex: string;
  featuredProjectId?: string;
}

export interface CreativeProject {
  id: string;
  title: string;
  category: string;
  platform: string;
  year: string;
  summary: string;
  description: string;
  architectureNotes: string[];
  metrics: { label: string; value: string }[];
  techStack: string[];
  accentHex: string;
  orbitalProgress: number;
  worldPosition: Vec3Tuple;
  artifactKind: 'rpg-monolith' | 'android-core' | 'synth-resonator' | 'gesture-astrolabe';
}

export interface CosmicLandmark {
  id: string;
  name: string;
  sectorId: string;
  position: Vec3Tuple;
  radius: number;
}

export type GalaxyMorphology = 'spiral' | 'barred' | 'ring' | 'elliptical';

export interface GalaxyCatalogItem {
  id: string;
  name: string;
  position: Vec3Tuple;
  scale: number;
  morphology: GalaxyMorphology;
  arms: number;
  twist: number;
  tilt: Vec3Tuple;
  coreHex: string;
  midHex: string;
  outerHex: string;
  spinSpeed: number;
}

export interface ZodiacConstellation {
  id: string;
  name: string;
  latin: string;
  azimuthDeg: number;
  elevationDeg: number;
  scaleDeg: number;
  accentHex: string;
  stars: Array<[number, number]>; // normalized [-1..1, -1..1]
  edges: Array<[number, number]>; // pairs of star indices
}

export const ONE_HOUR_CRUISE_DURATION_SEC = 3600;

export const EARTH_ORIGIN: Vec3Tuple = [0, 0, -90000];

// Sweeping ~38,200-unit curved cosmic arc culminating straight inside Gargantua Black Hole
export const FLIGHT_PATH_CONTROL_POINTS: Vec3Tuple[] = [
  [0, 14, 400],
  [110, 26, -1900],
  [-140, 12, -4400],
  [160, 28, -7000],
  [-150, 14, -9600],
  [175, 22, -12200],
  [-145, 10, -14900],
  [185, 28, -17600],
  [-165, 16, -20500],
  [155, 24, -23400],
  [-175, 14, -26400],
  [170, 26, -29400],
  [-150, 18, -32400],
  [75, 22, -34900],
  [10, 28, -36500],
  [0, 32, -37800],
];

export const TOP_NAV_SECTOR_IDS = ['origin', 'projects', 'nebula', 'cygnus', 'contact'] as const;

export const COSMIC_SECTORS: CosmicSector[] = [
  {
    id: 'origin',
    indexLabel: '01',
    shortNavLabel: 'Mulai',
    title: 'Matahari Awal',
    headline: 'Perkenalkan, saya Rasya Ardiansyah',
    narrative:
      'Saya adalah Game & App Developer yang berpengalaman merancang pengalaman interaktif 3D, aplikasi Android berperforma tinggi, dan semesta digital yang luas serta memukau mata.',
    highlights: ['Game Developer', 'Android & APK Engineer', 'Interactive 3D'],
    range: [0, 0.09],
    anchorProgress: 0.015,
    accentHex: '#f59e0b',
  },
  {
    id: 'profile',
    indexLabel: '02',
    shortNavLabel: 'Profil',
    title: 'Planet Arsitektur',
    headline: 'Presisi Kode, Fisika & Pencahayaan Nyata',
    narrative:
      'Setiap aplikasi dan game saya dibangun dengan keseimbangan antara optimasi 60fps Android-first, shader PBR realistis, bayangan tajam, dan gestur sentuh yang intuitif.',
    highlights: ['Kotlin & Jetpack', 'Three.js & GLSL', '60fps Mobile Pipeline'],
    range: [0.09, 0.185],
    anchorProgress: 0.13,
    accentHex: '#38bdf8',
  },
  {
    id: 'projects',
    indexLabel: '03',
    shortNavLabel: 'Proyek',
    title: 'Galaksi Proyek Kreatif',
    headline: 'Karya Interaktif di Sepanjang Orbit',
    narrative:
      'Telusuri empat artefak proyek unggulan saya mulai dari RPG 3D lintas platform, utilitas APK Android real-time, hingga mesin audio-visual berbasis WebGL.',
    highlights: ['4 Proyek Pilihan', 'Ketuk Artefak 3D', 'Geser Kiri/Kanan'],
    range: [0.185, 0.34],
    anchorProgress: 0.24,
    accentHex: '#a78bfa',
    featuredProjectId: 'aethelgard-rpg',
  },
  {
    id: 'nebula',
    indexLabel: '04',
    shortNavLabel: 'Nebula',
    title: 'Nebula Carina & Rasi Zodiak',
    headline: 'Awan Ionisasi, Zodiak & Ribuan Partikel Kosmik',
    narrative:
      'Menembus awan nebula raksasa di bawah naungan 12 rasi bintang zodiak bercahaya yang membentang di seluruh kubah langit antargalaksi.',
    highlights: ['12 Rasi Zodiak', 'Partikel Padat', 'Volumetric Nebula'],
    range: [0.34, 0.47],
    anchorProgress: 0.40,
    accentHex: '#e879f9',
  },
  {
    id: 'cygnus',
    indexLabel: '05',
    shortNavLabel: 'Cygnus',
    title: 'Sistem Biner Cygnus X-1',
    headline: 'Superraksasa Biru & Gugusan 34 Galaksi',
    narrative:
      'Di sektor Cygnus, aliran plasma berkecepatan tinggi terhisap dari bintang superraksasa biru sembari dikelilingi gugusan puluhan galaksi kolosal di kejauhan.',
    highlights: ['Cygnus X-1 Binary', '34 Galaksi Raksasa', 'Dynamic Rim Light'],
    range: [0.47, 0.59],
    anchorProgress: 0.52,
    accentHex: '#22d3ee',
  },
  {
    id: 'craft',
    indexLabel: '06',
    shortNavLabel: 'Asteroid',
    title: 'Sabuk Asteroid & Pleiades',
    headline: 'Ribuan Geometri & Bintang Tanpa Lag',
    narrative:
      'Melintasi gugus bintang muda Pleiades dan ratusan asteroid bertekstur kawah menggunakan LOD bertingkat dan GPU Instancing.',
    highlights: ['GPU Instancing', 'Pleiades Cluster', 'Touch Inertia'],
    range: [0.59, 0.69],
    anchorProgress: 0.64,
    accentHex: '#34d399',
  },
  {
    id: 'andromeda',
    indexLabel: '07',
    shortNavLabel: 'Andromeda',
    title: '34 Galaksi & Andromeda',
    headline: 'Menembus Lengan Spiral Raksasa Menuju Singularitas',
    narrative:
      'Tiga puluh empat galaksi raksasa membentang luas di segala penjuru semesta sebelum jalur kosmik mengarah langsung masuk ke jantung Lubang Hitam Gargantua.',
    highlights: ['34 Galaksi Kolosal', 'Spiral & Cincin', '360° Free Flight'],
    range: [0.69, 0.79],
    anchorProgress: 0.74,
    accentHex: '#818cf8',
  },
  {
    id: 'contact',
    indexLabel: '08',
    shortNavLabel: 'Bumi',
    title: 'Lubang Hitam & Bumi (Gunung → Pantai)',
    headline: 'Menembus Singularitas ke Puncak Gunung Hingga Tepian Pantai',
    narrative:
      'Masuk ke dalam Lubang Hitam hingga gelap gulita, lalu muncul di puncak gunung Bumi yang indah dan menuruni lereng sejauh 10x lipat sampai tiba di pantai berpasir dan ombak laut.',
    highlights: ['Masuk Gargantua', 'Puncak Gunung → Darat', 'Tepian Pantai Bumi'],
    range: [0.79, 1.0],
    anchorProgress: 0.88,
    accentHex: '#fb923c',
  },
];

export const CREATIVE_PROJECTS: CreativeProject[] = [
  {
    id: 'aethelgard-rpg',
    title: 'Aethelgard Chronicles',
    category: 'Game Aksi RPG 3D',
    platform: 'Android APK & Desktop',
    year: '2026',
    summary:
      'Game aksi RPG open-zone dengan sistem pertarungan real-time, pencahayaan PBR dinamis, dan kontrol analog sentuh yang mulus di perangkat Android.',
    description:
      'Dirancang untuk menghadirkan kualitas visual konsol ke layar smartphone. Menggabungkan shader air prosedural, sistem kombo berbasis frame, dan LOD adaptif agar suhu perangkat tetap dingin pada 60fps.',
    architectureNotes: [
      'Pipeline bayangan cascad tunggal yang dioptimalkan untuk GPU Adreno & Mali',
      'Sistem kamera chase-cam dengan peredaman pegas orde kedua',
      'Efek partikel tebasan dan debu volumetrik menggunakan GPU instancing',
    ],
    metrics: [
      { label: 'Frame Rate Target', value: '60 FPS' },
      { label: 'Ukuran APK', value: '48 MB' },
      { label: 'Unduhan Komunitas', value: '120K+' },
    ],
    techStack: ['Unity / C#', 'GLSL Shaders', 'Android NDK', 'Procedural Audio'],
    accentHex: '#f59e0b',
    orbitalProgress: 0.196,
    worldPosition: [-120, 18, -8400],
    artifactKind: 'rpg-monolith',
  },
  {
    id: 'pulseflow-apk',
    title: 'PulseFlow APK Studio',
    category: 'Aplikasi Mobile Produktivitas',
    platform: 'Android Native (Kotlin)',
    year: '2026',
    summary:
      'Aplikasi pemantau performa & manajemen tugas berbasis gestur dengan transisi 120Hz, notifikasi real-time, dan arsitektur offline-first.',
    description:
      'Dibangun untuk pengguna Android yang menginginkan kecepatan seketika. Mendukung navigasi satu tangan di zona ibu jari, sinkronisasi aktivitas instan, dan animasi fisik berbasis kecepatan jari.',
    architectureNotes: [
      'Jetpack Compose dengan custom physics-based swipe-to-action sheet',
      'Arsitektur reaktif untuk pembaruan notifikasi progres di bawah 16ms',
      'Desain adaptif untuk layar 360dp hingga tablet lipat',
    ],
    metrics: [
      { label: 'Cold Start', value: '310 ms' },
      { label: 'Rating Pengguna', value: '4.9 / 5' },
      { label: 'Crash-Free', value: '99.94%' },
    ],
    techStack: ['Kotlin', 'Jetpack Compose', 'Coroutines Flow', 'Material You'],
    accentHex: '#38bdf8',
    orbitalProgress: 0.245,
    worldPosition: [185, 22, -10400],
    artifactKind: 'android-core',
  },
  {
    id: 'nebula-synth',
    title: 'Nebula Synth Engine',
    category: 'Eksperimen Audio-Visual WebGL',
    platform: 'WebGL & Mobile Browser',
    year: '2025',
    summary:
      'Instrumen musik spasial 3D di browser yang mengubah frekuensi suara Web Audio menjadi gelombang cahaya dan cincin nebula interaktif.',
    description:
      'Menyatukan sintesis suara prosedural tanpa file audio eksternal dengan material PBR reflektif yang bergetar mengikuti spektrum FFT secara langsung.',
    architectureNotes: [
      'Custom vertex displacement pada MeshPhysicalMaterial via onBeforeCompile',
      'Analisis spektrum FFT real-time tanpa alokasi memori per frame',
      'Kontrol multi-sentuh untuk modulasi filter langsung di layar ponsel',
    ],
    metrics: [
      { label: 'Latensi Audio', value: '< 12 ms' },
      { label: 'Partikel Aktif', value: '4.500' },
      { label: 'Ketergantungan Aset', value: '0 File' },
    ],
    techStack: ['Three.js', 'TypeScript', 'Web Audio API', 'Custom GLSL'],
    accentHex: '#a78bfa',
    orbitalProgress: 0.286,
    worldPosition: [55, 20, -12800],
    artifactKind: 'synth-resonator',
  },
  {
    id: 'astrolabe-gesture',
    title: 'Astrolabe Gesture Kit',
    category: 'Library Navigasi & Interaksi',
    platform: 'Cross-Platform Touch Engine',
    year: '2025',
    summary:
      'Mesin pengenal gestur geser, inersia scroll virtual, dan transisi antar-tampilan yang dirancang khusus untuk antarmuka web dan hybrid Android.',
    description:
      'Menjembatani rasa halus aplikasi native ke dalam web modern. Memisahkan fisika inersia sentuhan dari siklus render UI agar tetap mulus meski beban GPU sedang tinggi.',
    architectureNotes: [
      'Deteksi vektor sentuhan X/Y adaptif untuk membedakan scroll dan swipe sektor',
      'Peredaman eksponensial independen frame-rate untuk kamera dan HUD',
      'Aksesibilitas penuh dengan dukungan keyboard dan reduced-motion',
    ],
    metrics: [
      { label: 'Bundle Size', value: '6.4 KB' },
      { label: 'Input Latency', value: '4 ms' },
      { label: 'Adopsi Proyek', value: '18 App' },
    ],
    techStack: ['TypeScript', 'Pointer Events', 'Exponential Damping', 'Node Test'],
    accentHex: '#34d399',
    orbitalProgress: 0.327,
    worldPosition: [-85, 16, -14800],
    artifactKind: 'gesture-astrolabe',
  },
];

// 34 Colossal Galaxies spread across deep space (scale 62..118 = 5,500..10,600 units diameter each)
const GALAXY_SPECS: Array<{
  name: string;
  morphology: GalaxyMorphology;
  arms: number;
  coreHex: string;
  midHex: string;
  outerHex: string;
  z: number;
  x: number;
  y: number;
  scale: number;
}> = [
  { name: 'Galaksi Spiral Andromeda (M31)', morphology: 'spiral', arms: 3, coreHex: '#fef08a', midHex: '#93c5fd', outerHex: '#c084fc', z: -33800, x: -1650, y: 420, scale: 112 },
  { name: 'Galaksi Triangulum (M33)', morphology: 'spiral', arms: 3, coreHex: '#fde68a', midHex: '#38bdf8', outerHex: '#818cf8', z: -2600, x: 1150, y: 390, scale: 76 },
  { name: 'Galaksi Whirlpool (M51)', morphology: 'spiral', arms: 2, coreHex: '#fffbeb', midHex: '#60a5fa', outerHex: '#e879f9', z: -4100, x: -1250, y: -320, scale: 82 },
  { name: 'Galaksi Sombrero (M104)', morphology: 'ring', arms: 2, coreHex: '#fed7aa', midHex: '#fbbf24', outerHex: '#7dd3fc', z: -5600, x: 1380, y: 310, scale: 78 },
  { name: 'Galaksi Pinwheel (M101)', morphology: 'spiral', arms: 4, coreHex: '#fef9c3', midHex: '#67e8f9', outerHex: '#a78bfa', z: -7000, x: -1350, y: 460, scale: 88 },
  { name: 'Galaksi Bode (M81)', morphology: 'spiral', arms: 2, coreHex: '#fde047', midHex: '#93c5fd', outerHex: '#f472b6', z: -8300, x: 1480, y: -290, scale: 80 },
  { name: 'Galaksi Cigar (M82)', morphology: 'barred', arms: 2, coreHex: '#fb923c', midHex: '#f472b6', outerHex: '#38bdf8', z: -9600, x: -1520, y: -380, scale: 72 },
  { name: 'Galaksi Centaurus A', morphology: 'elliptical', arms: 2, coreHex: '#fef08a', midHex: '#fdba74', outerHex: '#818cf8', z: -10800, x: 1350, y: 520, scale: 90 },
  { name: 'Galaksi Sunflower (M63)', morphology: 'spiral', arms: 4, coreHex: '#fde68a', midHex: '#38bdf8', outerHex: '#c084fc', z: -12100, x: -1450, y: 340, scale: 80 },
  { name: 'Galaksi Black Eye (M64)', morphology: 'ring', arms: 2, coreHex: '#fed7aa', midHex: '#f87171', outerHex: '#a855f7', z: -13300, x: 1620, y: -340, scale: 76 },
  { name: 'Galaksi Cartwheel', morphology: 'ring', arms: 3, coreHex: '#e0f2fe', midHex: '#22d3ee', outerHex: '#e879f9', z: -14500, x: -1380, y: -440, scale: 84 },
  { name: 'Galaksi Southern Pinwheel (M83)', morphology: 'barred', arms: 3, coreHex: '#fef08a', midHex: '#34d399', outerHex: '#60a5fa', z: -15750, x: 1320, y: 440, scale: 82 },
  { name: 'Objek Hoag (Ring Galaxy)', morphology: 'ring', arms: 2, coreHex: '#fbbf24', midHex: '#7dd3fc', outerHex: '#c4b5fd', z: -16900, x: -1680, y: 290, scale: 78 },
  { name: 'Galaksi Sculptor (NGC 253)', morphology: 'barred', arms: 2, coreHex: '#fde68a', midHex: '#fb923c', outerHex: '#818cf8', z: -18100, x: 1550, y: -420, scale: 88 },
  { name: 'Galaksi Tadpole (UGC 10214)', morphology: 'spiral', arms: 2, coreHex: '#e0f2fe', midHex: '#38bdf8', outerHex: '#f472b6', z: -19300, x: -1420, y: 510, scale: 82 },
  { name: 'Galaksi Antennae (NGC 4038)', morphology: 'spiral', arms: 4, coreHex: '#fef08a', midHex: '#e879f9', outerHex: '#22d3ee', z: -20450, x: 1450, y: 360, scale: 94 },
  { name: 'Galaksi Circinus', morphology: 'spiral', arms: 3, coreHex: '#fffbeb', midHex: '#67e8f9', outerHex: '#a78bfa', z: -21600, x: -1580, y: -350, scale: 78 },
  { name: 'Galaksi Needle (NGC 4565)', morphology: 'barred', arms: 2, coreHex: '#fed7aa', midHex: '#60a5fa', outerHex: '#c084fc', z: -22750, x: 1680, y: 480, scale: 96 },
  { name: 'Galaksi Silver Coin', morphology: 'spiral', arms: 3, coreHex: '#e0f2fe', midHex: '#93c5fd', outerHex: '#34d399', z: -23900, x: -1350, y: 420, scale: 76 },
  { name: 'Galaksi NGC 1300', morphology: 'barred', arms: 2, coreHex: '#fef08a', midHex: '#fbbf24', outerHex: '#60a5fa', z: -25000, x: 1420, y: -380, scale: 92 },
  { name: 'Galaksi Maffei 1', morphology: 'elliptical', arms: 2, coreHex: '#fde68a', midHex: '#fb923c', outerHex: '#f472b6', z: -26100, x: -1620, y: 310, scale: 86 },
  { name: 'Galaksi Condor (NGC 6872)', morphology: 'barred', arms: 2, coreHex: '#e0f2fe', midHex: '#22d3ee', outerHex: '#818cf8', z: -27200, x: 1580, y: 420, scale: 104 },
  { name: 'Galaksi Fireworks (NGC 6946)', morphology: 'spiral', arms: 4, coreHex: '#fef08a', midHex: '#f472b6', outerHex: '#38bdf8', z: -28300, x: -1450, y: -410, scale: 88 },
  { name: 'Galaksi NGC 474', morphology: 'ring', arms: 3, coreHex: '#fde68a', midHex: '#c084fc', outerHex: '#67e8f9', z: -29400, x: 1380, y: 520, scale: 84 },
  { name: 'Galaksi Malin 1', morphology: 'spiral', arms: 3, coreHex: '#fffbeb', midHex: '#38bdf8', outerHex: '#a855f7', z: -30500, x: -1750, y: 360, scale: 114 },
  { name: 'Galaksi Messier 106', morphology: 'spiral', arms: 2, coreHex: '#fef08a', midHex: '#f87171', outerHex: '#818cf8', z: -31550, x: 1520, y: -340, scale: 88 },
  { name: 'Galaksi Messier 74 (Phantom)', morphology: 'spiral', arms: 3, coreHex: '#e0f2fe', midHex: '#a78bfa', outerHex: '#22d3ee', z: -32600, x: -1380, y: 490, scale: 90 },
  { name: 'Galaksi IC 1101 Supergiant', morphology: 'elliptical', arms: 2, coreHex: '#fef9c3', midHex: '#fbbf24', outerHex: '#fb923c', z: -33500, x: 1780, y: 410, scale: 118 },
  { name: 'Galaksi Messier 94', morphology: 'ring', arms: 2, coreHex: '#e0f2fe', midHex: '#67e8f9', outerHex: '#c084fc', z: -34600, x: 1280, y: -400, scale: 82 },
  { name: 'Galaksi Rubin (UGC 2885)', morphology: 'spiral', arms: 3, coreHex: '#fef08a', midHex: '#60a5fa', outerHex: '#e879f9', z: -35600, x: -1580, y: -320, scale: 106 },
  { name: 'Galaksi NGC 6744', morphology: 'barred', arms: 3, coreHex: '#fde68a', midHex: '#93c5fd', outerHex: '#a78bfa', z: -36600, x: 1480, y: 450, scale: 96 },
  { name: 'Galaksi Messier 87', morphology: 'elliptical', arms: 2, coreHex: '#fffbeb', midHex: '#fbbf24', outerHex: '#38bdf8', z: -37600, x: -1320, y: 390, scale: 102 },
  { name: 'Galaksi NGC 4414', morphology: 'spiral', arms: 3, coreHex: '#e0f2fe', midHex: '#38bdf8', outerHex: '#f472b6', z: -38600, x: 1450, y: -320, scale: 90 },
  { name: 'Galaksi Viengine Prime', morphology: 'spiral', arms: 4, coreHex: '#fef08a', midHex: '#22d3ee', outerHex: '#fb923c', z: -39500, x: -1250, y: 440, scale: 108 },
];

export const GALAXY_CATALOG: GalaxyCatalogItem[] = GALAXY_SPECS.map((spec, idx) => ({
  id: idx === 0 ? 'andromeda' : `galaxy-${idx + 1}`,
  name: spec.name,
  position: [spec.x, spec.y, spec.z],
  scale: spec.scale,
  morphology: spec.morphology,
  arms: spec.arms,
  twist: 0.2 + (idx % 5) * 0.035,
  tilt: [
    0.45 + ((idx * 0.31) % 0.7),
    ((idx % 2 === 0 ? 1 : -1) * (0.2 + (idx % 4) * 0.14)),
    ((idx % 3) - 1) * 0.28,
  ],
  coreHex: spec.coreHex,
  midHex: spec.midHex,
  outerHex: spec.outerHex,
  spinSpeed: (idx % 2 === 0 ? 1 : -1) * (0.028 + (idx % 4) * 0.008),
}));

// 12 Zodiac Constellations arching across visible celestial sky angles (forward & upper-side sky)
export const ZODIAC_CONSTELLATIONS: ZodiacConstellation[] = [
  {
    id: 'aries',
    name: 'Aries',
    latin: 'Domba Jantan',
    azimuthDeg: 238,
    elevationDeg: 14,
    scaleDeg: 10,
    accentHex: '#7dd3fc',
    stars: [[-0.8, 0.2], [-0.1, 0.25], [0.55, 0.05], [0.85, -0.3]],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: 'taurus',
    name: 'Taurus',
    latin: 'Banteng',
    azimuthDeg: 268,
    elevationDeg: 16,
    scaleDeg: 11,
    accentHex: '#fde68a',
    stars: [[-0.9, 0.5], [-0.25, 0.1], [-0.15, -0.25], [0.3, 0.0], [0.85, 0.45], [0.75, -0.55]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3], [3, 5]],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    latin: 'Si Kembar',
    azimuthDeg: 298,
    elevationDeg: 12,
    scaleDeg: 11,
    accentHex: '#93c5fd',
    stars: [[-0.5, 0.85], [0.45, 0.8], [-0.45, 0.25], [0.4, 0.2], [-0.6, -0.55], [0.5, -0.6], [-0.1, -0.8]],
    edges: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3], [4, 6]],
  },
  {
    id: 'cancer',
    name: 'Cancer',
    latin: 'Kepiting',
    azimuthDeg: 328,
    elevationDeg: 15,
    scaleDeg: 10,
    accentHex: '#67e8f9',
    stars: [[0.0, 0.75], [0.0, 0.1], [-0.65, -0.55], [0.6, -0.6], [-0.2, 0.35]],
    edges: [[0, 1], [1, 2], [1, 3], [0, 4]],
  },
  {
    id: 'leo',
    name: 'Leo',
    latin: 'Singa',
    azimuthDeg: 358,
    elevationDeg: 18,
    scaleDeg: 12,
    accentHex: '#fbbf24',
    stars: [[-0.75, 0.45], [-0.55, 0.75], [-0.25, 0.55], [-0.35, 0.1], [-0.6, -0.35], [0.35, 0.15], [0.75, -0.3], [0.15, -0.4]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], [7, 4]],
  },
  {
    id: 'virgo',
    name: 'Virgo',
    latin: 'Sang Perawan',
    azimuthDeg: 28,
    elevationDeg: 14,
    scaleDeg: 12,
    accentHex: '#c4b5fd',
    stars: [[-0.75, 0.5], [-0.2, 0.35], [0.25, 0.65], [0.05, -0.05], [-0.55, -0.45], [0.6, -0.35], [0.85, -0.7]],
    edges: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6]],
  },
  {
    id: 'libra',
    name: 'Libra',
    latin: 'Neraca',
    azimuthDeg: 58,
    elevationDeg: 16,
    scaleDeg: 10,
    accentHex: '#38bdf8',
    stars: [[0.0, 0.7], [-0.65, 0.1], [0.65, 0.15], [-0.35, -0.65], [0.4, -0.6]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]],
  },
  {
    id: 'scorpio',
    name: 'Scorpius',
    latin: 'Kalajengking',
    azimuthDeg: 88,
    elevationDeg: 12,
    scaleDeg: 12,
    accentHex: '#fb7185',
    stars: [[-0.75, 0.65], [-0.65, 0.3], [-0.55, -0.05], [-0.25, 0.25], [0.1, -0.1], [0.35, -0.55], [0.7, -0.65], [0.82, -0.35]],
    edges: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    latin: 'Pemanah',
    azimuthDeg: 118,
    elevationDeg: 18,
    scaleDeg: 11,
    accentHex: '#f472b6',
    stars: [[-0.55, 0.55], [0.0, 0.7], [0.4, 0.2], [0.05, -0.2], [-0.5, -0.2], [-0.7, 0.1], [0.75, -0.45]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [2, 6]],
  },
  {
    id: 'capricorn',
    name: 'Capricornus',
    latin: 'Kambing Laut',
    azimuthDeg: 148,
    elevationDeg: 15,
    scaleDeg: 10,
    accentHex: '#34d399',
    stars: [[-0.8, 0.3], [0.0, 0.35], [0.75, 0.45], [0.35, -0.3], [-0.15, -0.55], [-0.55, -0.15]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    latin: 'Pembawa Air',
    azimuthDeg: 178,
    elevationDeg: 17,
    scaleDeg: 11,
    accentHex: '#22d3ee',
    stars: [[-0.65, 0.65], [-0.15, 0.55], [0.35, 0.75], [-0.25, 0.05], [0.25, -0.05], [0.65, -0.5], [-0.35, -0.65]],
    edges: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [3, 6]],
  },
  {
    id: 'pisces',
    name: 'Pisces',
    latin: 'Ikan Kembar',
    azimuthDeg: 208,
    elevationDeg: 13,
    scaleDeg: 11,
    accentHex: '#a78bfa',
    stars: [[-0.75, 0.55], [-0.5, 0.15], [-0.2, -0.25], [0.1, -0.65], [0.45, -0.2], [0.75, 0.35], [0.6, 0.65]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
];

export const COSMIC_LANDMARKS: CosmicLandmark[] = [
  { id: 'sun', name: 'Matahari Raksasa Awal', sectorId: 'origin', position: [-520, 95, -180], radius: 420 },
  { id: 'aegis', name: 'Eksoplanet Es Aegis', sectorId: 'origin', position: [440, -35, -1950], radius: 280 },
  { id: 'planet', name: 'Planet Arsitektur', sectorId: 'profile', position: [-510, 70, -4150], radius: 340 },
  { id: 'titan', name: 'Raksasa Gas Titan', sectorId: 'profile', position: [590, -75, -6300], radius: 360 },
  { id: 'rpg', name: 'Aethelgard Chronicles', sectorId: 'projects', position: [-120, 18, -8400], radius: 220 },
  { id: 'apk', name: 'PulseFlow APK Studio', sectorId: 'projects', position: [185, 22, -10400], radius: 220 },
  { id: 'pyre', name: 'Planet Vulkanik Pyre', sectorId: 'projects', position: [-720, 105, -11800], radius: 320 },
  { id: 'synth', name: 'Nebula Synth Engine', sectorId: 'projects', position: [55, 20, -12800], radius: 220 },
  { id: 'astrolabe', name: 'Astrolabe Gesture Kit', sectorId: 'projects', position: [-85, 16, -14800], radius: 220 },
  { id: 'chronos', name: 'Raksasa Cincin Chronos', sectorId: 'nebula', position: [760, -70, -16600], radius: 380 },
  { id: 'carina', name: 'Nebula Carina & Rasi Zodiak', sectorId: 'nebula', position: [-420, 85, -18900], radius: 620 },
  { id: 'vesper', name: 'Planet Es Bercincin Vesper', sectorId: 'nebula', position: [680, -85, -21400], radius: 340 },
  { id: 'cygnus-x1', name: 'Sistem Biner Cygnus X-1', sectorId: 'cygnus', position: [-480, 78, -24200], radius: 580 },
  { id: 'solaris', name: 'Super-Jupiter Solaris II', sectorId: 'craft', position: [810, 110, -26900], radius: 380 },
  { id: 'pleiades', name: 'Gugus Bintang Pleiades', sectorId: 'craft', position: [-560, 120, -29100], radius: 460 },
  { id: 'basalt', name: 'Dunia Kawah Basalt', sectorId: 'craft', position: [690, -80, -31200], radius: 340 },
  { id: 'andromeda', name: 'Galaksi Spiral Andromeda (34 Galaksi)', sectorId: 'andromeda', position: [-1650, 420, -33800], radius: 2400 },
  { id: 'kronos', name: 'Titan Violet Kronos', sectorId: 'andromeda', position: [820, 75, -35400], radius: 380 },
  { id: 'gargantua', name: 'Horizon Lubang Hitam Gargantua', sectorId: 'contact', position: [0, 32, -37800], radius: 900 },
  { id: 'earth-mountain', name: 'Puncak Gunung Bumi', sectorId: 'contact', position: [0, 1220, -90000], radius: 1400 },
  { id: 'earth-valley', name: 'Lembah & Daratan Hijau', sectorId: 'contact', position: [0, 220, -95500], radius: 1400 },
  { id: 'earth-beach', name: 'Pantai & Samudra Bumi', sectorId: 'contact', position: [0, 6, -98900], radius: 1500 },
];

export type MotionPreset =
  | 'sweep-left'
  | 'kinetic-rise'
  | 'glitch-decode'
  | 'horizon-expand';

export interface CosmicStoryBeat {
  id: string;
  indexLabel: string;
  tag: string;
  text: string;
  progress: number;
  range: [number, number];
  accentHex: string;
  motionStyle: MotionPreset;
  sideOffset: [number, number];
}

const RAW_STORY_LINES: Array<{
  tag: string;
  text: string;
  accentHex: string;
  motionStyle: MotionPreset;
}> = [
  {
    tag: 'ORIGIN · JAWA TENGAH',
    text: 'Viana Rasya',
    accentHex: '#fbbf24',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'VIENGINE · AAA ANDROID',
    text: 'aku developer Viengine dan berhasil membuat game AAA pertama di android',
    accentHex: '#38bdf8',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'TAMATAN KHUSUS',
    text: 'lalu Rasya pernah belajar di Jawa Tengah sebagai tamatan khusus',
    accentHex: '#60a5fa',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: '2023 · OPSEC',
    text: '2023 menjadi OpSec tingkat tinggi',
    accentHex: '#22d3ee',
    motionStyle: 'glitch-decode',
  },
  {
    tag: '12 DESEMBER 2023',
    text: '2023 tanggal 12 Desember menjadi kepala tim red',
    accentHex: '#f87171',
    motionStyle: 'glitch-decode',
  },
  {
    tag: '2024 · SHADOW UNIT',
    text: '2024 masuk black ops',
    accentHex: '#a78bfa',
    motionStyle: 'glitch-decode',
  },
  {
    tag: 'JANUARI 2026',
    text: '2026 januari hampir ditangkap lawan',
    accentHex: '#fb7185',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'FEBRUARI 2026 · LAND OF DAWN',
    text: '2026 februari ketemu cewe di ml',
    accentHex: '#f472b6',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: 'ORBIT HATI',
    text: 'namanya Viana',
    accentHex: '#f9a8d4',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'MARET 2026',
    text: '2026 Maret jadian',
    accentHex: '#fb7185',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'AGUSTUS 2026',
    text: '2026 Agustus lamaran',
    accentHex: '#fbbf24',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'NOVEMBER 2026',
    text: '2026 November turu hehehehe',
    accentHex: '#34d399',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: 'PESAN KODING',
    text: 'belajar lah mulai dari python, setelah itu kamu boleh tentukan jalan kamu sendiri',
    accentHex: '#38bdf8',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'KONSISTENSI HARIAN',
    text: 'jangan terlalu bersemangat belajar, anggap aja biasa aja menjadi rutinitas setiap hari agar tetap konsisten',
    accentHex: '#67e8f9',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: 'FOKUS MENDALAM',
    text: 'jangan mudah tertarik apapun sebelum menguasai nya',
    accentHex: '#c084fc',
    motionStyle: 'glitch-decode',
  },
  {
    tag: 'REHAT SEJENAK',
    text: 'abis itu kamu boleh turu aowkaowkw',
    accentHex: '#34d399',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: 'ENERGI KOSMIK',
    text: 'selagi masih sanggup gass, semangat',
    accentHex: '#fbbf24',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'BINTANG KEMBAR',
    text: 'Rasya Viana',
    accentHex: '#f472b6',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'DEEP SPACE',
    text: 'ayoo menjelajah lebih jauh...',
    accentHex: '#818cf8',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'KEHENDAK BEBAS',
    text: 'didunia ini kamu adalah yang menentukan jalan sendiri',
    accentHex: '#38bdf8',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'REFLEKSI',
    text: 'ntah aku berfikir begitu, rata rata setiap orang bakal mengikuti apa yang orang lain ikuti',
    accentHex: '#a78bfa',
    motionStyle: 'kinetic-rise',
  },
  {
    tag: 'MODE HEMAT ENERGI',
    text: 'mending turu, enak',
    accentHex: '#34d399',
    motionStyle: 'horizon-expand',
  },
  {
    tag: 'TENGAH MALAM',
    text: 'susah turu? nonton dracin seru jir',
    accentHex: '#f472b6',
    motionStyle: 'sweep-left',
  },
  {
    tag: 'MYTHICAL IMMORTAL',
    text: 'aku main mole dengan high tier atau high rank immortal',
    accentHex: '#fbbf24',
    motionStyle: 'glitch-decode',
  },
  {
    tag: 'EPILOG PANTAI BUMI',
    text: 'hehehe masih epic untuk sekarang, sibuk sama bini.',
    accentHex: '#fb923c',
    motionStyle: 'horizon-expand',
  },
];

export const COSMIC_STORY_BEATS: CosmicStoryBeat[] = RAW_STORY_LINES.map(
  (entry, idx, arr) => {
    const step = 1 / arr.length;
    const start = idx * step;
    const end = idx === arr.length - 1 ? 1.0 : (idx + 1) * step;
    const progress = Math.min(0.985, start + step * 0.42);
    const sideX = idx % 2 === 0 ? -24 : 24;
    const sideY = idx % 3 === 0 ? 8 : idx % 3 === 1 ? -4 : 5;
    return {
      id: `beat-${idx + 1}`,
      indexLabel: String(idx + 1).padStart(2, '0'),
      tag: entry.tag,
      text: entry.text,
      progress,
      range: [start, end],
      accentHex: entry.accentHex,
      motionStyle: entry.motionStyle,
      sideOffset: [sideX, sideY],
    };
  }
);

export const DEVELOPER_PROFILE = {
  name: 'Rasya Ardiansyah',
  role: 'Game & App Developer · Viengine',
  location: 'Jawa Tengah, Indonesia',
  email: 'rasya.ardiansyah.dev@example.com',
  experienceYears: '5+ Tahun',
  shippedCount: '24+ Game & APK',
  focus: 'Viengine AAA Android, OpSec, & Pengalaman Interaktif 3D',
};
