// =======================
//   THREE.JS SETUP
// =======================

const canvas = document.getElementById("sky");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 3);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

const effect = new THREE.OutlineEffect(renderer);

// سماء خارجية
const skyGeo = new THREE.SphereGeometry(50, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({
  color: 0x050505,
  side: THREE.BackSide
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// =======================
//   OBJECTS & LABELS
// =======================

let starsList = [];
let planetsList = [];
let allLabels = [];
let allObjects = [];

function createLabel(text, position) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(text, 10, 30);

  const texture = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 1.2, 1);
  sprite.position.copy(position.clone().normalize().multiplyScalar(53));

  allLabels.push(sprite);
  scene.add(sprite);
  return sprite;
}

function generateStars() {
  const NUM = 600;

  for (let i = 0; i < NUM; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = (Math.random() - 0.5) * Math.PI;
    const r = 50;

    const pos = new THREE.Vector3(
      r * Math.cos(phi) * Math.cos(theta),
      r * Math.sin(phi),
      r * Math.cos(phi) * Math.sin(theta)
    );

    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35
      })
    );

    star.position.copy(pos);
    glow.position.copy(pos);

    scene.add(star, glow);
    starsList.push({ star, glow });

    allObjects.push({
      mesh: star,
      data: { name: `Star ${i + 1}`, type: "star", ra: theta, dec: phi }
    });
  }
}

function generatePlanets() {
  const planets = [
    { name: "Mercury", color: 0xffcc66, theta: 0.2, phi: 0.15 },
    { name: "Venus",   color: 0xffe6a3, theta: 1.0, phi: 0.05 },
    { name: "Earth",   color: 0x66aaff, theta: 1.8, phi: 0.00 },
    { name: "Mars",    color: 0xff5533, theta: 2.5, phi: -0.10 },
    { name: "Jupiter", color: 0xffddaa, theta: 3.2, phi: 0.12 }
  ];

  const r = 45;

  planets.forEach((p) => {
    const pos = new THREE.Vector3(
      r * Math.cos(p.phi) * Math.cos(p.theta),
      r * Math.sin(p.phi),
      r * Math.cos(p.phi) * Math.sin(p.theta)
    );

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 20),
      new THREE.MeshBasicMaterial({ color: p.color })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 20, 20),
      new THREE.MeshBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.4
      })
    );

    planet.position.copy(pos);
    glow.position.copy(pos);

    scene.add(planet, glow);
    planetsList.push({ star: planet, glow });

    createLabel(p.name, pos);

    allObjects.push({
      mesh: planet,
      data: { name: p.name, type: "planet", ra: p.theta, dec: p.phi }
    });
  });
}

generateStars();
generatePlanets();

// =======================
//   CAMERA ANIMATION
// =======================

let cameraAnimating = false;
let camFrom = new THREE.Vector3();
let camTo = new THREE.Vector3();
let targetFrom = new THREE.Vector3();
let targetTo = new THREE.Vector3();
let camStartTime = 0;
const CAM_DURATION = 900; // ms

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function startCameraMove(targetMesh) {
  cameraAnimating = true;
  camStartTime = performance.now();

  camFrom.copy(camera.position);

  const dir = targetMesh.position.clone().normalize();
  const camDistance = 20; // صغّر الرقم لو تبي زوم أقوى
  camTo.copy(dir.multiplyScalar(camDistance));

  targetFrom.copy(controls.target);
  targetTo.copy(targetMesh.position);
}

// =======================
//   MAIN ANIMATION LOOP
// =======================

function animate() {
  requestAnimationFrame(animate);

  if (cameraAnimating) {
    const now = performance.now();
    let t = (now - camStartTime) / CAM_DURATION;
    if (t >= 1) {
      t = 1;
      cameraAnimating = false;
    }
    const e = easeInOut(t);

    camera.position.lerpVectors(camFrom, camTo, e);
    controls.target.lerpVectors(targetFrom, targetTo, e);
  }

  controls.update();
  effect.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// =======================
//   PLANET PHYSICAL INFO
// =======================

const planetInfo = {
  Mercury: {
    title: "Mercury – Inner Rocky Planet",
    moons: "Moons: 0 known moons",
    gravity: "Surface gravity ≈ 3.7 m/s²",
    orbit: "Average distance from Sun ≈ 0.39 AU",
    day: "Day length: ≈ 59 Earth days (slow rotation)",
    year: "Year length: ≈ 88 Earth days",
    note: "Small, airless, heavily cratered world and the closest planet to the Sun."
  },
  Venus: {
    title: "Venus – Earth’s Hot Twin",
    moons: "Moons: 0 known moons",
    gravity: "Surface gravity ≈ 8.9 m/s²",
    orbit: "Average distance from Sun ≈ 0.72 AU",
    day: "Day length: ≈ 243 Earth days (retrograde rotation)",
    year: "Year length: ≈ 225 Earth days",
    note: "Thick CO₂ atmosphere, extreme greenhouse effect, and very high surface temperature."
  },
  Earth: {
    title: "Earth – Our Home World",
    moons: "Moons: 1 natural moon",
    gravity: "Surface gravity ≈ 9.8 m/s²",
    orbit: "Average distance from Sun ≈ 1.00 AU",
    day: "Day length: 24 hours",
    year: "Year length: ≈ 365 days",
    note: "Only known planet with surface liquid water and complex life."
  },
  Mars: {
    title: "Mars – The Red Planet",
    moons: "Moons: 2 small moons (Phobos & Deimos)",
    gravity: "Surface gravity ≈ 3.7 m/s²",
    orbit: "Average distance from Sun ≈ 1.52 AU",
    day: "Day length: ≈ 24.6 Earth hours (one sol)",
    year: "Year length: ≈ 687 Earth days",
    note: "Cold desert world with polar ice caps and evidence of ancient rivers and lakes."
  },
  Jupiter: {
    title: "Jupiter – Giant of the Solar System",
    moons: "Moons: ≈95 known moons",
    gravity: "Cloud-top gravity ≈ 24.8 m/s²",
    orbit: "Average distance from Sun ≈ 5.20 AU",
    day: "Day length: ≈ 10 Earth hours (very fast rotation)",
    year: "Year length: ≈ 11.9 Earth years",
    note: "Massive gas giant with a strong magnetic field and the famous Great Red Spot storm."
  }
};

// =======================
//   SEARCH BY NAME
// =======================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchMessage = document.getElementById("searchMessage");

if (searchBtn && searchInput && searchMessage) {
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchMessage.textContent = "Enter a name first (e.g., Earth, Mars, Jupiter, Star 10).";
      return;
    }

    const found = allObjects.find((o) => {
      const name = o.data.name.toLowerCase();
      return name === q || name.includes(q);
    });

    if (!found) {
      searchMessage.textContent = "No object found with that name.";
      return;
    }

    // حرّك الكاميرا إلى الجسم
    startCameraMove(found.mesh);

    const ra = found.data.ra.toFixed(3);
    const dec = found.data.dec.toFixed(3);
    const typeUpper = found.data.type.toUpperCase();
    const objName = found.data.name;

    const info = planetInfo[objName];

    // لو كوكب وله بيانات
    if (found.data.type === "planet" && info) {
      searchMessage.innerHTML = `
        <strong>${info.title}</strong><br>
        Name: ${objName}<br>
        Type: ${typeUpper}<br>
        RA: ${ra} · DEC: ${dec}<br>
        ${info.moons}<br>
        ${info.gravity}<br>
        Orbit: ${info.orbit}<br>
        ${info.day}<br>
        ${info.year}<br>
        Notes: ${info.note}
      `;
    } else {
      // نجوم أو أشياء ما عندها جدول معلومات
      searchMessage.innerHTML = `
        <strong>${objName}</strong><br>
        Type: ${typeUpper}<br>
        RA: ${ra} · DEC: ${dec}<br>
        No detailed physical data available for this object.
      `;
    }
  });
}
