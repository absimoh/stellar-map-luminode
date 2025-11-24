// ======= IMPORTS (Suitable for GitHub Pages) =======
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/postprocessing/RenderPass.js";

// ====== SCENE + CAMERA + RENDERER ======
const canvas = document.getElementById("bg");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 65, 200);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// ====== ORBIT CONTROLS ======
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;

// ====== LIGHTS ======
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const sunLight = new THREE.PointLight(0xffffff, 4);
scene.add(sunLight);

// ====== TEXTURES ======
const loader = new THREE.TextureLoader();

// ====== STARFIELD BACKGROUND ======
const starTexture = loader.load("img/starfield.jpg");
const starGeo = new THREE.SphereGeometry(1000, 64, 64);
const starMat = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide });
scene.add(new THREE.Mesh(starGeo, starMat));

// ====== SUN + GLOW ======
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({ map: loader.load("img/sun.jpg") })
);
scene.add(sun);

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: loader.load("img/glow.png"),
    color: 0xffd000,
    blending: THREE.AdditiveBlending,
    transparent: true
  })
);
sunGlow.scale.set(70,70,1);
scene.add(sunGlow);

// ====== BLOOM EFFECT ======
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0));

// ====== PLANETS + MOONS ======
const planetsData = [
  { name:"Mercury", size:2, dist:20, speed:0.018, texture:"mercury.jpg" },
  { name:"Venus", size:3.5, dist:30, speed:0.014, texture:"venus.jpg" },
  { 
    name:"Earth", size:4, dist:40, speed:0.011, texture:"earth.jpg",
    moons: [
      { name:"Moon", size:1, dist:6, speed:0.03, texture:"moon.jpg" }
    ]
  },
  { name:"Mars", size:3, dist:50, speed:0.009, texture:"mars.jpg" },
  { 
    name:"Jupiter", size:8, dist:70, speed:0.007, texture:"jupiter.jpg",
    moons: [
      { name:"Io", size:1.2, dist:10, speed:0.018, texture:"moon.jpg" },
      { name:"Europa", size:1.1, dist:12, speed:0.016, texture:"moon.jpg" }
    ]
  },
  { 
    name:"Saturn", size:7, dist:90, speed:0.005, texture:"saturn.jpg",
    moons: [
      { name:"Titan", size:1.5, dist:9, speed:0.02, texture:"moon.jpg" }
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
  planet.userData = { name: data.name };
  scene.add(planet);
  planets.push({ mesh: planet, ...data });

  // Planet Glow
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

  // Orbits
  const curve = new THREE.EllipseCurve(0,0,data.dist,data.dist);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(128));
  const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({color:0x777777}));
  orbitLine.rotation.x = Math.PI/2;
  scene.add(orbitLine);

  // Moons
  if (data.moons) {
    data.moons.forEach(m => {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(m.size, 16, 16),
        new THREE.MeshStandardMaterial({ map: loader.load("img/" + m.texture) })
      );
      moon.userData = { name: m.name };
      planet.add(moon);
      planets.push({ mesh: moon, dist:m.dist, speed:m.speed, isMoon:true });
    });
  }
});

// ====== RAYCASTER (INFO PANEL) ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const panel = document.getElementById("infoPanel");

window.addEventListener("click", e => {
  mouse.x = (e.clientX/window.innerWidth)*2 - 1;
  mouse.y = -(e.clientY/window.innerHeight)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(scene.children, true);
  if (hit.length && hit[0].object.userData.name){
    panel.style.display = "block";
    panel.innerHTML = `<h3>${hit[0].object.userData.name}</h3>`;
  }
});

// ====== ANIMATION ======
function animate(){
  planets.forEach(p => {
    if (p.isMoon){
      p.mesh.position.x = Math.cos(Date.now()*p.speed*0.001)*p.dist;
      p.mesh.position.z = Math.sin(Date.now()*p.speed*0.001)*p.dist;
    } else {
      p.mesh.position.x = Math.cos(Date.now()*p.speed*0.001)*p.dist;
      p.mesh.position.z = Math.sin(Date.now()*p.speed*0.001)*p.dist;
    }
  });
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

// ====== RESIZE ======
window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
