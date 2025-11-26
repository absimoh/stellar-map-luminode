import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("bg");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 40, 120);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// نجوم خلفية بسيطة
const loader = new THREE.TextureLoader();
const starsTex = loader.load("assets/stars.jpg");
const starsGeo = new THREE.SphereGeometry(400, 32, 32);
const starsMat = new THREE.MeshBasicMaterial({ map: starsTex, side: THREE.BackSide });
scene.add(new THREE.Mesh(starsGeo, starsMat));

// إضاءة
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const sunLight = new THREE.PointLight(0xffffff, 2);
scene.add(sunLight);

// الشمس
const sunTex = loader.load("assets/sun.jpg");
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ map: sunTex })
);
scene.add(sun);
sunLight.position.copy(sun.position);

// كواكب بسيطة
const planetData = [
  { name: "Mercury", tex: "mercury.jpg", dist: 20, size: 2, speed: 0.02 },
  { name: "Venus",   tex: "venus.jpg",   dist: 30, size: 3, speed: 0.015 },
  { name: "Earth",   tex: "earth.jpg",   dist: 40, size: 3.2, speed: 0.012 },
  { name: "Mars",    tex: "mars.jpg",    dist: 50, size: 2.5, speed: 0.01 },
  { name: "Jupiter", tex: "jupiter.jpg", dist: 70, size: 7, speed: 0.008 },
  { name: "Saturn",  tex: "saturn.jpg",  dist: 90, size: 6, speed: 0.006 },
  { name: "Uranus",  tex: "uranus.jpg",  dist:110, size: 4, speed: 0.004 },
  { name: "Neptune", tex: "neptune.jpg", dist:130, size: 4, speed: 0.003 }
];

const planets = [];

planetData.forEach(p => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.size, 24, 24),
    new THREE.MeshStandardMaterial({ map: loader.load("assets/" + p.tex) })
  );
  mesh.userData = { name: p.name, dist: p.dist, speed: p.speed };
  scene.add(mesh);
  planets.push(mesh);

  // مدار
  const curve = new THREE.EllipseCurve(0,0,p.dist,p.dist);
  const pts = curve.getPoints(64);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x555555 })
  );
  line.rotation.x = Math.PI / 2;
  scene.add(line);
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
  requestAnimationFrame(animate);
  const t = Date.now() * 0.001;

  planets.forEach(mesh => {
    const { dist, speed } = mesh.userData;
    mesh.position.x = Math.cos(t * speed) * dist;
    mesh.position.z = Math.sin(t * speed) * dist;
    mesh.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
