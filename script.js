import * as THREE from "https://unpkg.com/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { OutlineEffect } from "https://unpkg.com/three@0.152.2/examples/jsm/effects/OutlineEffect.js";

// ====== SETUP RENDERER ======
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

// ====== CONTROLS ======
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ====== SKY SPHERE ======
const skyGeometry = new THREE.SphereGeometry(50, 64, 64);
const skyMaterial = new THREE.MeshBasicMaterial({
  color: 0x050505,
  side: THREE.BackSide
});
scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

// ====== OUTLINE EFFECT ======
const effect = new OutlineEffect(renderer);

// ====== LISTS ======
let starsList = [];
let planetsList = [];
let allLabels = [];
let allObjects = [];

// ====== LABEL CREATOR ======
function createLabel(text, position) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(text, 10, 30);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 1.2, 1);
  sprite.position.copy(position.clone().normalize().multiplyScalar(53));

  allLabels.push(sprite);
  return sprite;
}

// ====== GENERATE STARS ======
function generateStars() {
  const NUM = 600;

  for (let i = 0; i < NUM; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    const r = 50;

    const pos = new THREE.Vector3(
      r * Math.cos(phi) * Math.cos(theta),
      r * Math.sin(phi),
      r * Math.cos(phi) * Math.sin(theta)
    );

    const color = 0xffffff;

    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshBasicMaterial({ color })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
    );

    star.position.copy(pos);
    glow.position.copy(pos);

    scene.add(glow, star);
    starsList.push({ star, glow });

    const objData = {
      name: `Star ${i + 1}`,
      type: "star",
      ra: theta,
      dec: phi
    };

    allObjects.push({ mesh: star, data: objData });
  }
}

// ====== GENERATE PLANETS ======
function generatePlanets() {
  const planets = [
    { name: "Mercury", color: 0xffcc66, theta: 0.2, phi: 0.1 },
    { name: "Venus",   color: 0xffe6a3, theta: 1.0, phi: 0.05 },
    { name: "Earth",   color: 0x66aaff, theta: 1.8, phi: 0.0 },
    { name: "Mars",    color: 0xff5533, theta: 2.4, phi: -0.05 },
    { name: "Jupiter", color: 0xffddaa, theta: 3.1, phi: 0.12 }
  ];

  const r = 45;

  planets.forEach(p => {
    const pos = new THREE.Vector3(
      r * Math.cos(p.phi) * Math.cos(p.theta),
      r * Math.sin(p.phi),
      r * Math.cos(p.phi) * Math.sin(p.theta)
    );

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 20, 20),
      new THREE.MeshBasicMaterial({ color: p.color })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.45 })
    );

    planet.position.copy(pos);
    glow.position.copy(pos);

    scene.add(planet, glow);
    planetsList.push({ star: planet, glow });

    const label = createLabel(p.name, pos);
    scene.add(label);

    allObjects.push({
      mesh: planet,
      data: { name: p.name, type: "planet", ra: p.theta, dec: p.phi }
    });
  });
}

// ====== INIT ======
generateStars();
generatePlanets();

// ====== RAYCASTER ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(allObjects.map(o => o.mesh));

  if (intersects.length > 0) {
    const found = allObjects.find(o => o.mesh === intersects[0].object);
    if (found) {
      document.getElementById("objName").textContent = found.data.name;
      document.getElementById("objType").textContent = "Type: " + found.data.type;
      document.getElementById("objRA").textContent = "RA: " + found.data.ra.toFixed(3);
      document.getElementById("objDEC").textContent = "DEC: " + found.data.dec.toFixed(3);
    }
  }
});

// ====== ANIMATE ======
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  effect.render(scene, camera);
}
animate();

// ====== RESIZE ======
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

