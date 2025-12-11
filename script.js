// === THREE.JS SETUP ===
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

// === LIGHT ===
const sunLight = new THREE.PointLight(0xffffff, 1.8);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// === SUN ===
const sunGeo = new THREE.SphereGeometry(20, 40, 40);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// === PLANET DATA ===
const planetData = [
  { name: "Mercury", radius: 4, orbit: 40, speed: 4.7, color: 0xb5b5b5, info: "Smallest planet." },
  { name: "Venus", radius: 6, orbit: 60, speed: 3.5, color: 0xffd79a, info: "Hot and toxic atmosphere." },
  { name: "Earth", radius: 7, orbit: 80, speed: 2.9, color: 0x4aaeff, info: "Our home planet." },
  { name: "Mars", radius: 6, orbit: 100, speed: 2.4, color: 0xff6b47, info: "The red planet." },
  { name: "Jupiter", radius: 14, orbit: 130, speed: 1.3, color: 0xf1e1c2, info: "Largest planet." },
  { name: "Saturn", radius: 12, orbit: 160, speed: 0.97, color: 0xfbeec0, info: "Has a beautiful ring." },
  { name: "Uranus", radius: 10, orbit: 200, speed: 0.68, color: 0xa8eaff, info: "Tilted sideways." },
  { name: "Neptune", radius: 10, orbit: 240, speed: 0.54, color: 0x6f86ff, info: "Farthest planet." }
];

const planets = {};

// === CREATE PLANETS ===
planetData.forEach(p => {
  // Orbit ring
  const ring = new THREE.RingGeometry(p.orbit - 0.3, p.orbit + 0.3, 80);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x2b4a7f,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const orbit = new THREE.Mesh(ring, ringMat);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  // Planet holder
  const pivot = new THREE.Object3D();
  scene.add(pivot);

  // Planet mesh
  const geo = new THREE.SphereGeometry(p.radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: p.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(p.orbit, 0, 0);
  pivot.add(mesh);

  planets[p.name.toLowerCase()] = {
    pivot,
    mesh,
    angle: Math.random() * Math.PI * 2,
    data: p
  };
});

// === CAMERA FOCUS / SEARCH ===
function focusPlanet(name) {
  const p = planets[name.toLowerCase()];
  if (!p) return;

  const worldPos = p.mesh.getWorldPosition(new THREE.Vector3());
  const camTarget = worldPos.clone().add(new THREE.Vector3(0, 40, 70));

  // Smooth camera fly animation
  gsap.to(camera.position, {
    x: camTarget.x,
    y: camTarget.y,
    z: camTarget.z,
    duration: 1.2,
    ease: "power2.out"
  });

  gsap.to(controls.target, {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    duration: 1.2
  });

  // Update UI info
  document.getElementById("planetName").textContent = p.data.name;
  document.getElementById("planetSub").textContent =
    p.data.info + ` • Orbit: ${p.data.orbit} • Speed: ${p.data.speed}`;
}

// Search button
document.getElementById("searchBtn").onclick = () => {
  focusPlanet(document.getElementById("searchInput").value.trim());
};

// Enter key
document.getElementById("searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") focusPlanet(e.target.value.trim());
});

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);

  planetData.forEach(p => {
    const obj = planets[p.name.toLowerCase()];
    obj.angle += p.speed * 0.0004;

    const x = Math.cos(obj.angle) * p.orbit;
    const z = Math.sin(obj.angle) * p.orbit;

    obj.mesh.position.set(x, 0, z);
    obj.mesh.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();
