// ================== SCENE, CAMERA, RENDERER =====================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 60, 160);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// =================== LIGHT & SUN ================================
const texLoader = new THREE.TextureLoader();
const sunTexture = texLoader.load("assets/sun.jpg");

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({ map: sunTexture })
);
scene.add(sun);

const sunLight = new THREE.PointLight(0xffffff, 3, 5000);
scene.add(sunLight);

// =================== PLANET CREATOR ============================
function createPlanet(name, size, distance, speed, texture) {
  const material = new THREE.MeshStandardMaterial({
    map: texLoader.load(`assets/${texture}`),
    roughness: 0.8,
    metalness: 0.15
  });

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(size, 64, 64),
    material
  );

  const orbit = new THREE.Object3D();
  orbit.add(planet);
  planet.position.x = distance;

  scene.add(orbit);

  return { mesh: planet, orbit: orbit, speed: speed, name: name };
}

// ================== PLANETS LIST ===============================
const planets = [
  createPlanet("Mercury", 1.5, 15, 0.015, "mercury.jpg"),
  createPlanet("Venus",   2.5, 22, 0.012, "venus.jpg"),
  createPlanet("Earth",   3.0, 30, 0.010, "earth.jpg"),
  createPlanet("Mars",    2.4, 38, 0.008, "mars.jpg"),
  createPlanet("Jupiter", 7.0, 50, 0.005, "jupiter.jpg"),
  createPlanet("Saturn",  6.0, 65, 0.004, "saturn.jpg"),
  createPlanet("Uranus",  4.5, 78, 0.003, "uranus.jpg"),
  createPlanet("Neptune", 4.3, 90, 0.002, "neptune.jpg")
];

// ==================== STARS BACKGROUND ==========================
scene.background = texLoader.load("assets/stars.jpg");

// ==================== LABEL NAME ON HOVER =======================
const label = document.getElementById("label");
const mouse = new THREE.Vector2();
const rayCaster = new THREE.Raycaster();

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function showLabel() {
  rayCaster.setFromCamera(mouse, camera);
  const intersects = rayCaster.intersectObjects(planets.map(p => p.mesh));
  if (intersects.length > 0) {
    const planet = planets.find(p => p.mesh === intersects[0].object);
    label.style.display = "block";
    label.textContent = planet.name;
    label.style.left = (event.clientX + 10) + "px";
    label.style.top = (event.clientY + 10) + "px";
  } else {
    label.style.display = "none";
  }
}

// =================== ANIMATION ================================
function animate() {
  planets.forEach(p => {
    p.orbit.rotation.y += p.speed;
    p.mesh.rotation.y += 0.005;
  });

  showLabel();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// ================= RESIZE HANDLER ==============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
