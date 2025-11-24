// ================= IMPORTS (GitHub-safe CDN) =====================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/RenderPass.js";

// ==================== SCENE / CAMERA / RENDERER ====================
const canvas = document.getElementById("bg");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 65, 200);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// ==================== ORBIT CONTROLS ==============================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;
controls.enableZoom = true;

// ==================== LIGHTS ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const sunLight = new THREE.PointLight(0xffffff, 4);
scene.add(sunLight);

// ==================== TEXTURES =====================
const loader = new THREE.TextureLoader();

// ==================== SUN + GLOW =====================
const sunTexture = loader.load("img/sun.jpg");
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({ map: sunTexture })
);
scene.add(sun);

// Halo (glow plane)
const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: loader.load("img/glow.png"),
    color: 0xffd000,
    blending: THREE.AdditiveBlending,
    transparent: true
  })
);
sunGlow.scale.set(70, 70, 1);
scene.add(sunGlow);

// =================== BLOOM EFFECT ===================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0));

// ==================== PLANETS ======================
const planetsData = [
  { name:"Mercury", size:2, dist:20, speed:0.018, texture:"mercury.jpg" },
  { name:"Venus", size:3.5, dist:30, speed:0.014, texture:"venus.jpg" },
  { 
    name:"Earth", size:4, dist:40, speed:0.011, texture:"earth.jpg",
    moons: [
      { name:"Moon", size:0.8, dist:6, speed:0.03, texture:"moon.jpg" }
    ]
  },
  { name:"Mars", size:3, dist:50, speed:0.009, texture:"mars.jpg" },
  { 
    name:"Jupiter", size:8, dist:70, speed:0.007, texture:"jupiter.jpg",
    moons: [
      { name:"Io", size:0.9, dist:10, speed:0.018, texture:"moon.jpg" },
      { name:"Europa", size:0.9, dist:12, speed:0.016, texture:"moon.jpg" }
    ]
  },
  { 
    name:"Saturn", size:7, dist:90, speed:0.005, texture:"saturn.jpg",
    moons: [
      { name:"Titan", size:1.2, dist:9, speed:0.02, texture:"moon.jpg" }
    ]
  },
  { name:"Uranus", size:5, dist:110, speed:0.0035, texture:"uranus.jpg" },
  { name:"Neptune", size:5, dist:130, speed:0.0025, texture:"neptune.jpg" }
];


const planets = [];

planetsData.forEach(data => {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(data.size, 32, 32),
    new THREE.MeshStandardMaterial({ map: loader.load("img/" + data.texture) })
  );

  planet.userData = {
    name: data.name,
    orbitalRadius: data.dist,
    description: `${data.name}: Planet in the Solar System`
  };

  scene.add(planet);
  planets.push({ mesh: planet, ...data });

  // HALO for planets
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: loader.load("img/glow.png"),
      color: 0x88cfff,
      blending: THREE.AdditiveBlending,
      transparent: true
    })
  );
  halo.scale.set(data.size * 4, data.size * 4, 1);
  planet.add(halo);

  // Orbit Line
  const curve = new THREE.EllipseCurve(0, 0, data.dist, data.dist);
  const points = curve.getPoints(128);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x888888 });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);
});

// ==================== RAYCASTER (INFO PANEL) =====================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const panel = document.getElementById("infoPanel");

window.addEventListener("click", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(scene.children, true);
  if (hit.length > 0 && hit[0].object.userData.name) {
    const d = hit[0].object.userData;
    panel.style.display = "block";
    panel.innerHTML = `<h3>${d.name}</h3>
    <p><b>Orbit:</b> ${d.orbitalRadius}</p>
    <p>${d.description}</p>`;
  }
});

// ==================== ANIMATION LOOP =====================
function animate() {
  planets.forEach(p => {
    p.mesh.position.x = Math.cos(Date.now() * p.speed * 0.001) * p.dist;
    p.mesh.position.z = Math.sin(Date.now() * p.speed * 0.001) * p.dist;
  });

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

// ===================== RESIZE ======================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
