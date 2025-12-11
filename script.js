// ====== THREE.JS SETUP ======
const canvas = document.getElementById("sceneCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
camera.position.set(0, 200, 400);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ====== LIGHTS ======
const light = new THREE.PointLight(0xffffff, 2.2);
light.position.set(0, 0, 0);
scene.add(light);

// ====== SUN ======
const sunGeo = new THREE.SphereGeometry(18, 50, 50);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4a3 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// ====== PLANETS DATA ======
const planetData = [
  { name: "Mercury", radius: 4, orbit: 40, speed: 4.7, color: 0xb5b5b5 },
  { name: "Venus", radius: 6, orbit: 60, speed: 3.5, color: 0xffd79a },
  { name: "Earth", radius: 7, orbit: 80, speed: 2.9, color: 0x4aaeff },
  { name: "Mars", radius: 6, orbit: 100, speed: 2.4, color: 0xff6b47 },
  { name: "Jupiter", radius: 14, orbit: 130, speed: 1.3, color: 0xf1e1c2 },
  { name: "Saturn", radius: 12, orbit: 160, speed: 0.97, color: 0xfbeec0 },
  { name: "Uranus", radius: 10, orbit: 200, speed: 0.68, color: 0xa8eaff },
  { name: "Neptune", radius: 10, orbit: 240, speed: 0.54, color: 0x6f86ff }
];

const planets = {}; // لحفظ الكواكب

// ====== CREATE PLANETS + ORBITS ======
planetData.forEach((p) => {
  // orbit ring
  const orbitGeo = new THREE.RingGeometry(p.orbit - 0.2, p.orbit + 0.2, 80);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x3b5b99,
    side: THREE.DoubleSide,
    opacity: 0.4,
    transparent: true
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  // Create pivot
  const pivot = new THREE.Object3D();
  scene.add(pivot);

  // Create planet
  const geo = new THREE.SphereGeometry(p.radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: p.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(p.orbit, 0, 0);
  pivot.add(mesh);

  // Save object
  planets[p.name.toLowerCase()] = {
    pivot,
    mesh,
    data: p,
    angle: Math.random() * Math.PI * 2
  };
});

// ====== SEARCH FOCUS ======
function focusPlanet(name) {
  const p = planets[name.toLowerCase()];
  if (!p) return;

  // Target position
  const worldPos = p.mesh.getWorldPosition(new THREE.Vector3());
  const newCamPos = worldPos.clone().add(new THREE.Vector3(0, 40, 70));

  // Smooth movement
  gsap.to(camera.position, {
    x: newCamPos.x,
    y: newCamPos.y,
    z: newCamPos.z,
    duration: 1.4,
    ease: "power2.out"
  });

  gsap.to(controls.target, {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    duration: 1.4,
    ease: "power2.out"
  });

  // Show info
  document.getElementById("planetName").textContent = p.data.name;
  document.getElementById("planetSub").textContent =
    `Orbit: ${p.data.orbit} AU • Rotation realistic • Speed: ${p.data.speed}`;
}

// Search button
document.getElementById("searchBtn").addEventListener("click", () => {
  const input = document.getElementById("searchInput").value.trim();
  focusPlanet(input);
});

// Enter key search
document
  .getElementById("searchInput")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") focusPlanet(e.target.value.trim());
  });

// ====== ANIMATION LOOP ======
function animate() {
  requestAnimationFrame(animate);

  // move planets
  planetData.forEach((p) => {
    const obj = planets[p.name.toLowerCase()];
    obj.angle += p.speed * 0.0005; // realistic orbital speed
    const x = Math.cos(obj.angle) * p.orbit;
    const z = Math.sin(obj.angle) * p.orbit;

    obj.mesh.position.set(x, 0, z);

    // rotation around itself
    obj.mesh.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();
