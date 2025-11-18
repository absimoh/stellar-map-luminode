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

  // نخلي الكاميرا داخل الكرة (قريبة) والجسم أبعد منها
  const dir = targetMesh.position.clone().normalize();
  const camDistance = 20;        // كل ما قلّ الرقم زاد الزوم
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
//   SEARCH BY NAME
// =======================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchMessage = document.getElementById("searchMessage");

if (searchBtn && searchInput && searchMessage) {
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchMessage.textContent = "Enter a name first.";
      return;
    }

    // نسمح بالمطابقة الكاملة أو الاحتواء (earth / Ear / star 10)
    const found = allObjects.find((o) => {
      const name = o.data.name.toLowerCase();
      return name === q || name.includes(q);
    });

    if (!found) {
      searchMessage.textContent = "No object found with that name.";
      return;
    }

    // حرك الكاميرا + اكتب المعلومات
    startCameraMove(found.mesh);

    const ra = found.data.ra.toFixed(3);
    const dec = found.data.dec.toFixed(3);
    const typeUpper = found.data.type.toUpperCase();

    searchMessage.textContent =
      `Focused on ${found.data.name} · Type: ${typeUpper} · RA: ${ra} · DEC: ${dec}`;
  });
}
