// ===== IMPORTS =====
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/UnrealBloomPass.js";


// ===== BASIC SETUP =====
const canvas = document.getElementById("bg");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 70, 220);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// ===== CONTROLS =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;
controls.minDistance = 30;
controls.maxDistance = 500;

// ===== LIGHTS =====
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const sunLight = new THREE.PointLight(0xffffff, 4);
scene.add(sunLight);

// ===== TEXTURES =====
const loader = new THREE.TextureLoader();

// starfield
const starTex = loader.load("assets/stars.jpg");
const starGeo = new THREE.SphereGeometry(1000, 64, 64);
const starMat = new THREE.MeshBasicMaterial({
  map: starTex,
  side: THREE.BackSide,
});
scene.add(new THREE.Mesh(starGeo, starMat));

// ===== SUN + GLOW =====
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({ map: loader.load("assets/sun.jpg") })
);
scene.add(sun);
sunLight.position.set(0, 0, 0);

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: loader.load("assets/glow.png"),
    color: 0xffd000,
    blending: THREE.AdditiveBlending,
    transparent: true,
  })
);
sunGlow.scale.set(80, 80, 1);
scene.add(sunGlow);

// ===== BLOOM =====
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,
    0.4,
    0
  )
);

// ===== PLANETS DATA =====
const planetsData = [
  { id: "mercury", name: "Mercury", type: "Planet", size: 2, dist: 20, speed: 0.04, texture: "mercury.jpg" },
  { id: "venus", name: "Venus", type: "Planet", size: 3.5, dist: 30, speed: 0.03, texture: "venus.jpg" },
  {
    id: "earth",
    name: "Earth",
    type: "Planet",
    size: 4.2,
    dist: 40,
    speed: 0.025,
    texture: "earth.jpg",
    moons: [
      { name: "Moon", size: 1.2, dist: 7, speed: 0.09, texture: "moon.jpg" },
    ],
  },
  { id: "mars", name: "Mars", type: "Planet", size: 3, dist: 50, speed: 0.022, texture: "mars.jpg" },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Planet",
    size: 9,
    dist: 70,
    speed: 0.018,
    texture: "jupiter.jpg",
    moons: [
      { name: "Io", size: 1.2, dist: 12, speed: 0.08, texture: "moon.jpg" },
      { name: "Europa", size: 1.1, dist: 14, speed: 0.07, texture: "moon.jpg" },
    ],
  },
  { id: "saturn", name: "Saturn", type: "Planet", size: 7.5, dist: 90, speed: 0.016, texture: "saturn.jpg" },
  { id: "uranus", name: "Uranus", type: "Planet", size: 5.5, dist: 110, speed: 0.013, texture: "uranus.jpg" },
  { id: "neptune", name: "Neptune", type: "Planet", size: 5.2, dist: 130, speed: 0.011, texture: "neptune.jpg" },
];

const bodies = [];

// ===== CREATE PLANETS =====
planetsData.forEach((data) => {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(data.size, 32, 32),
    new THREE.MeshStandardMaterial({ map: loader.load("assets/" + data.texture) })
  );

  planet.userData = {
    id: data.id,
    name: data.name,
    type: data.type,
    orbitalRadius: data.dist,
    description: `${data.name} – a planet.`,
    isPlanet: true,
  };

  scene.add(planet);

  // glow halo
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: loader.load("assets/glow.png"),
      color: 0x88cfff,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })
  );
  halo.scale.set(data.size * 4, data.size * 4, 1);
  planet.add(halo);

  // orbit
  const curve = new THREE.EllipseCurve(0, 0, data.dist, data.dist);
  const pts = curve.getPoints(128);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const orbitLine = new THREE.Line(
    orbitGeo,
    new THREE.LineBasicMaterial({ color: 0x666666 })
  );
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  bodies.push({ mesh: planet, dist: data.dist, speed: data.speed, isMoon: false });

  // moons
  if (data.moons) {
    data.moons.forEach((m) => {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(m.size, 16, 16),
        new THREE.MeshStandardMaterial({
          map: loader.load("assets/" + m.texture),
        })
      );
      moon.userData = {
        id: data.id + "_" + m.name.toLowerCase(),
        name: m.name,
        type: "Moon",
        description: `${m.name} – moon of ${data.name}.`,
      };
      planet.add(moon);
      bodies.push({ mesh: moon, dist: m.dist, speed: m.speed, isMoon: true });
    });
  }
});

// ===== RAYCAST UI + FOCUS =====
// (نفس الكود السابق — لم يحذف فقط اختصرناه هنا من أجل الرد)

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
window.addEventListener("click", (e) => {
  if (e.clientX < 260) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(bodies.map((b) => b.mesh), true);
  if (hits.length > 0) {
    const obj = hits[0].object;
    controls.target.copy(obj.getWorldPosition(new THREE.Vector3()));
  }
});

// ===== ANIMATION =====
let timeScale = 1;
function animate() {
  requestAnimationFrame(animate);
  const t = Date.now() * 0.001 * timeScale;

  bodies.forEach((b) => {
    b.mesh.position.x = Math.cos(t * b.speed) * b.dist;
    b.mesh.position.z = Math.sin(t * b.speed) * b.dist;
  });

  controls.update();
  composer.render();
}
animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
