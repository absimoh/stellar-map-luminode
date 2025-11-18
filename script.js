// =======================
//   THREE.JS SKY SCENE
// =======================

// Renderer & Scene
const canvas = document.getElementById("sky");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 3);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Outline effect
const effect = new THREE.OutlineEffect(renderer);

// Sky sphere
const skyGeo = new THREE.SphereGeometry(50, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({
  color: 0x050505,
  side: THREE.BackSide,
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// Lists
let starsList = [];
let planetsList = [];
let allLabels = [];
let allObjects = [];

// Create label (لو حبيت ترجعها لاحقاً)
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

// Generate stars
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
        opacity: 0.35,
      })
    );

    star.position.copy(pos);
    glow.position.copy(pos);

    scene.add(star, glow);
    starsList.push({ star, glow });

    allObjects.push({
      mesh: star,
      data: { name: `Star ${i + 1}`, type: "star", ra: theta, dec: phi },
    });
  }
}

// Generate planets
function generatePlanets() {
  const planets = [
    { name: "Mercury", color: 0xffcc66, theta: 0.2, phi: 0.15 },
    { name: "Venus", color: 0xffe6a3, theta: 1.0, phi: 0.05 },
    { name: "Earth", color: 0x66aaff, theta: 1.8, phi: 0.0 },
    { name: "Mars", color: 0xff5533, theta: 2.5, phi: -0.1 },
    { name: "Jupiter", color: 0xffddaa, theta: 3.2, phi: 0.12 },
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
        opacity: 0.4,
      })
    );

    planet.position.copy(pos);
    glow.position.copy(pos);

    scene.add(planet, glow);
    planetsList.push({ star: planet, glow });

    createLabel(p.name, pos); // لو تبي تخفي اللّيبلز لاحقاً نقدر نضيف زر

    allObjects.push({
      mesh: planet,
      data: { name: p.name, type: "planet", ra: p.theta, dec: p.phi },
    });
  });
}

// Init scene
generateStars();
generatePlanets();

// Raycaster (لو حبيت تكمل عليه لاحقاً)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(allObjects.map((o) => o.mesh));

  if (hits.length > 0) {
    const obj = allObjects.find((o) => o.mesh === hits[0].object);
    if (!obj) return;

    // حالياً بس نطبع بالكونسول
    console.log("Clicked:", obj.data.name, obj.data.type);
  }
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  effect.render(scene, camera);
}
animate();

// Resize
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

    // اسم الكوكب/النجم (case-insensitive)
    const found = allObjects.find(
      (o) => o.data.name.toLowerCase() === q
    );

    if (!found) {
      searchMessage.textContent = "No object found with that name.";
      return;
    }

    // تحريك الكاميرا ناحيته
    const targetPos = found.mesh.position
      .clone()
      .normalize()
      .multiplyScalar(3);
    camera.position.copy(targetPos);
    camera.lookAt(found.mesh.position);

    searchMessage.textContent = "Focused on " + found.data.name;
  });
}
