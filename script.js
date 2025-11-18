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

// Create label
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

    createLabel(p.name, pos);

    allObjects.push({
      mesh: planet,
      data: { name: p.name, type: "planet", ra: p.theta, dec: p.phi },
    });
  });
}

// Init scene
generateStars();
generatePlanets();

// Raycaster
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

    document.getElementById("objName").textContent = obj.data.name;
    document.getElementById("objType").textContent =
      "Type: " + obj.data.type;
    document.getElementById("objRA").textContent =
      "RA: " + obj.data.ra.toFixed(3);
    document.getElementById("objDEC").textContent =
      "DEC: " + obj.data.dec.toFixed(3);
  }
});

// Buttons
document.getElementById("resetView").onclick = () => {
  camera.position.set(0, 0, 3);
  controls.reset();
};

let labelsVisible = true;
document.getElementById("toggleLabels").onclick = () => {
  labelsVisible = !labelsVisible;
  allLabels.forEach((l) => (l.visible = labelsVisible));
};

document.getElementById("showStars").onclick = () => {
  starsList.forEach((s) => {
    s.star.visible = true;
    s.glow.visible = true;
  });
  planetsList.forEach((p) => {
    p.star.visible = false;
    p.glow.visible = false;
  });
};

document.getElementById("showPlanets").onclick = () => {
  starsList.forEach((s) => {
    s.star.visible = false;
    s.glow.visible = false;
  });
  planetsList.forEach((p) => {
    p.star.visible = true;
    p.glow.visible = true;
  });
};

document.getElementById("showAll").onclick = () => {
  starsList.forEach((s) => {
    s.star.visible = true;
    s.glow.visible = true;
  });
  planetsList.forEach((p) => {
    p.star.visible = true;
    p.glow.visible = true;
  });
};

let themeIndex = 0;
document.getElementById("themeSwitch").onclick = () => {
  themeIndex = (themeIndex + 1) % 3;

  if (themeIndex === 0)
    document.body.style.background =
      "radial-gradient(circle at top, #202442, #050713, #000000)";
  if (themeIndex === 1)
    document.body.style.background =
      "radial-gradient(circle at top, #111827, #020617, #000000)";
  if (themeIndex === 2)
    document.body.style.background =
      "radial-gradient(circle at top, #1f2937, #020617, #000000)";
};

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
//   SIMPLE ML DEMO
// =======================

// Build model: 3 inputs → 3 outputs (Star, Planet, Galaxy)
const mlModel = tf.sequential();
mlModel.add(
  tf.layers.dense({ units: 8, activation: "relu", inputShape: [3] })
);
mlModel.add(tf.layers.dense({ units: 3, activation: "softmax" }));
mlModel.compile({
  optimizer: tf.train.adam(0.05),
  loss: "categoricalCrossentropy",
});

// Training data (synthetic)
const trainX = tf.tensor2d([
  [2, 30, 0.3], // star
  [5, 60, 0.8], // star
  [8, 400, 1.2], // galaxy
  [10, 800, 1.5], // galaxy
  [3, 10, 0.4], // planet
  [4, 15, 0.6], // planet
  [1, 80, 0.2], // star
  [6, 500, 1.0], // galaxy
  [2, 5, 0.7], // planet
  [7, 100, 0.9], // star
]);

const trainY = tf.tensor2d([
  [1, 0, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
]);

async function trainMLModel() {
  try {
    await mlModel.fit(trainX, trainY, {
      epochs: 80,
      shuffle: true,
      verbose: 0,
    });
    console.log("ML model trained");
  } catch (e) {
    console.error("ML training error:", e);
  }
}
trainMLModel();

async function predictObjectClass() {
  const b = parseFloat(document.getElementById("ml-brightness").value);
  const d = parseFloat(document.getElementById("ml-distance").value);
  const c = parseFloat(document.getElementById("ml-color").value);

  const input = tf.tensor2d([[b, d, c]]);
  const probs = mlModel.predict(input);
  const data = await probs.data();

  input.dispose();
  probs.dispose();

  const classes = ["Star", "Planet", "Galaxy"];
  let maxIndex = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] > data[maxIndex]) maxIndex = i;
  }

  const resultText = `Predicted: ${classes[maxIndex]} (p = ${data[
    maxIndex
  ].toFixed(2)})`;
  document.getElementById("ml-output").textContent = resultText;
}

// Hook button
const mlBtn = document.getElementById("ml-predict-btn");
if (mlBtn) {
  mlBtn.addEventListener("click", predictObjectClass);
}
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

    // ابحث بالاسم (case-insensitive)
    const found = allObjects.find(o => o.data.name.toLowerCase() === q);

    if (!found) {
      searchMessage.textContent = "No object found with that name.";
      return;
    }

    // حرك الكاميرا ناحيته
    const targetPos = found.mesh.position.clone().normalize().multiplyScalar(3);
    camera.position.copy(targetPos);
    camera.lookAt(found.mesh.position);

    // حدث لوحة المعلومات
    document.getElementById("objName").textContent = found.data.name;
    document.getElementById("objType").textContent = "Type: " + found.data.type;
    document.getElementById("objRA").textContent = "RA: " + found.data.ra.toFixed(3);
    document.getElementById("objDEC").textContent = "DEC: " + found.data.dec.toFixed(3);

    searchMessage.textContent = "Focused on " + found.data.name;
  });
}

