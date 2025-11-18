// =======================
//   THREE.JS SETUP
// =======================

const canvas = document.getElementById("sky");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
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

// Sky sphere
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
  const camDistance = 20; // قلّله (مثلاً 15) لو تبي زوم أقوى
  camTo.copy(dir.multiplyScalar(camDistance));

  targetFrom.copy(controls.target);
  targetTo.copy(targetMesh.position);
}

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
//   UI HELPERS
// =======================

const objNameEl = document.getElementById("objName");
const objTypeEl = document.getElementById("objType");
const objRAEl   = document.getElementById("objRA");
const objDECEl  = document.getElementById("objDEC");
const searchMessage = document.getElementById("searchMessage");

function updateObjectInfo(found) {
  const ra = found.data.ra.toFixed(3);
  const dec = found.data.dec.toFixed(3);
  const typeUpper = found.data.type.toUpperCase();
  const objName = found.data.name;

  // Panel العلوي
  objNameEl.textContent = objName;
  objTypeEl.textContent = "Type: " + typeUpper;
  objRAEl.textContent   = "RA: " + ra;
  objDECEl.textContent  = "DEC: " + dec;

  // نص تحت البحث
  const info = planetInfo[objName];

  if (found.data.type === "planet" && info) {
    searchMessage.innerHTML = `
      <strong>${info.title}</strong><br>
      Name: ${objName}<br>
      Type: ${typeUpper}<br>
      RA: ${ra} · DEC: ${dec}<br><br>
      ${info.moons}<br>
      ${info.gravity}<br>
      Orbit: ${info.orbit}<br>
      ${info.day}<br>
      ${info.year}<br><br>
      ${info.note}
    `;
  } else {
    searchMessage.innerHTML = `
      <strong>${objName}</strong><br>
      Type: ${typeUpper}<br>
      RA: ${ra} · DEC: ${dec}<br><br>
      No detailed physical data stored for this object, but it is part of the simulated stellar field.
    `;
  }
}

// =======================
//   RAYCAST: CLICK ON OBJECT
// =======================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(allObjects.map(o => o.mesh));

  if (hits.length > 0) {
    const found = allObjects.find(o => o.mesh === hits[0].object);
    if (!found) return;
    startCameraMove(found.mesh);
    updateObjectInfo(found);
  }
});

// =======================
//   SEARCH BY NAME
// =======================

const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");

if (searchBtn && searchInput && searchMessage) {
  function performSearch() {
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

    startCameraMove(found.mesh);
    updateObjectInfo(found);
  }

  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
  });
}

// =======================
//   NAVBAR BUTTONS
// =======================

const resetViewBtn   = document.getElementById("resetView");
const toggleLabelsBtn= document.getElementById("toggleLabels");
const showStarsBtn   = document.getElementById("showStars");
const showPlanetsBtn = document.getElementById("showPlanets");
const showAllBtn     = document.getElementById("showAll");
const themeSwitchBtn = document.getElementById("themeSwitch");

let labelsVisible = true;
let themeIndex = 0;

if (resetViewBtn) {
  resetViewBtn.onclick = () => {
    camera.position.set(0, 0, 3);
    controls.target.set(0, 0, 0);
    cameraAnimating = false;
  };
}

if (toggleLabelsBtn) {
  toggleLabelsBtn.onclick = () => {
    labelsVisible = !labelsVisible;
    allLabels.forEach(l => l.visible = labelsVisible);
  };
}

if (showStarsBtn) {
  showStarsBtn.onclick = () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = false; p.glow.visible = false; });
  };
}

if (showPlanetsBtn) {
  showPlanetsBtn.onclick = () => {
    starsList.forEach(s => { s.star.visible = false; s.glow.visible = false; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
  };
}

if (showAllBtn) {
  showAllBtn.onclick = () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
  };
}

if (themeSwitchBtn) {
  themeSwitchBtn.onclick = () => {
    themeIndex = (themeIndex + 1) % 3;
    if (themeIndex === 0)
      document.body.style.background = "radial-gradient(circle at top, #202442, #050713, #000000)";
    if (themeIndex === 1)
      document.body.style.background = "radial-gradient(circle at top, #0b1220, #020617, #000000)";
    if (themeIndex === 2)
      document.body.style.background = "radial-gradient(circle at top, #1f2937, #020617, #000000)";
  };
}

// =======================
//   MAIN LOOP & RESIZE
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
