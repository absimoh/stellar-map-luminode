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

// starfield (خلفية نجوم)
const starTex = loader.load("img/starfield.jpg");
const starGeo = new THREE.SphereGeometry(1000, 64, 64);
const starMat = new THREE.MeshBasicMaterial({
  map: starTex,
  side: THREE.BackSide,
});
const starField = new THREE.Mesh(starGeo, starMat);
scene.add(starField);

// ===== SUN + GLOW =====
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({ map: loader.load("img/sun.jpg") })
);
scene.add(sun);
sunLight.position.set(0, 0, 0);

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: loader.load("img/glow.png"),
    color: 0xffd000,
    blending: THREE.AdditiveBlending,
    transparent: true,
  })
);
sunGlow.scale.set(80, 80, 1);
scene.add(sunGlow);

// ===== BLOOM / POSTPROCESS =====
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
  {
    id: "mercury",
    name: "Mercury",
    type: "Planet",
    size: 2,
    dist: 20,
    speed: 0.04,
    texture: "mercury.jpg",
  },
  {
    id: "venus",
    name: "Venus",
    type: "Planet",
    size: 3.5,
    dist: 30,
    speed: 0.03,
    texture: "venus.jpg",
  },
  {
    id: "earth",
    name: "Earth",
    type: "Planet",
    size: 4.2,
    dist: 40,
    speed: 0.025,
    texture: "earth_day.jpg",
    nightTexture: "earth_night.jpg",
    cloudsTexture: "earth_clouds.png",
    moons: [
      {
        name: "Moon",
        size: 1.2,
        dist: 7,
        speed: 0.09,
        texture: "moon.jpg",
      },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    type: "Planet",
    size: 3,
    dist: 50,
    speed: 0.022,
    texture: "mars.jpg",
  },
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
  {
    id: "saturn",
    name: "Saturn",
    type: "Planet",
    size: 7.5,
    dist: 90,
    speed: 0.016,
    texture: "saturn.jpg",
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Planet",
    size: 5.5,
    dist: 110,
    speed: 0.013,
    texture: "uranus.jpg",
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Planet",
    size: 5.2,
    dist: 130,
    speed: 0.011,
    texture: "neptune.jpg",
  },
];

const bodies = []; // planets + moons

// ===== CREATE PLANETS =====
planetsData.forEach((data) => {
  let material;
  if (data.id === "earth") {
    const dayTex = loader.load("img/" + data.texture);
    const nightTex = loader.load("img/" + data.nightTexture);
    material = new THREE.MeshPhongMaterial({
      map: dayTex,
      emissiveMap: nightTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.35,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      map: loader.load("img/" + data.texture),
    });
  }

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(data.size, 32, 32),
    material
  );
  planet.userData = {
    id: data.id,
    name: data.name,
    type: data.type,
    orbitalRadius: data.dist,
    description: `${data.name} – a planet in the LUMINODE solar system.`,
    isPlanet: true,
  };

  scene.add(planet);

  // glow halo
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: loader.load("img/glow.png"),
      color: 0x88cfff,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })
  );
  halo.scale.set(data.size * 4, data.size * 4, 1);
  planet.add(halo);

  // orbits
  const curve = new THREE.EllipseCurve(0, 0, data.dist, data.dist);
  const pts = curve.getPoints(128);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const orbitLine = new THREE.Line(
    orbitGeo,
    new THREE.LineBasicMaterial({ color: 0x666666 })
  );
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  const bodyObj = {
    mesh: planet,
    dist: data.dist,
    speed: data.speed,
    isMoon: false,
    data,
  };
  bodies.push(bodyObj);

  // Earth clouds
  if (data.id === "earth") {
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(data.size * 1.03, 32, 32),
      new THREE.MeshPhongMaterial({
        map: loader.load("img/" + data.cloudsTexture),
        transparent: true,
        depthWrite: false,
      })
    );
    planet.add(clouds);
    bodyObj.clouds = clouds;
  }

  // Moons
  if (data.moons) {
    data.moons.forEach((m) => {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(m.size, 16, 16),
        new THREE.MeshStandardMaterial({
          map: loader.load("img/" + m.texture),
        })
      );
      moon.userData = {
        id: data.id + "_" + m.name.toLowerCase(),
        name: m.name,
        type: "Moon",
        orbitalRadius: m.dist,
        description: `${m.name} – moon of ${data.name}.`,
        isPlanet: false,
      };
      planet.add(moon);

      bodies.push({
        mesh: moon,
        dist: m.dist,
        speed: m.speed,
        isMoon: true,
        parent: planet,
      });
    });
  }
});

// ===== UI ELEMENTS =====
const planetList = document.getElementById("planetList");
const timeRange = document.getElementById("timeRange");
const pauseBtn = document.getElementById("pauseBtn");
const playBtn = document.getElementById("playBtn");
const focusBtn = document.getElementById("focusBtn");

const infoName = document.getElementById("infoName");
const infoType = document.getElementById("infoType");
const infoOrbit = document.getElementById("infoOrbit");
const infoDesc = document.getElementById("infoDesc");

let selectedBody = null;
let timeScale = 1;
let paused = false;

// build planet list (only planets)
planetsData.forEach((p) => {
  const li = document.createElement("li");
  li.textContent = p.name;
  li.dataset.id = p.id;
  li.addEventListener("click", () => {
    selectBodyById(p.id);
  });
  planetList.appendChild(li);
});

function updateListSelection(id) {
  [...planetList.children].forEach((li) => {
    li.classList.toggle("active", li.dataset.id === id);
  });
}

function selectBodyById(id) {
  const body = bodies.find((b) => b.mesh.userData.id === id);
  if (!body) return;
  selectedBody = body.mesh;
  const u = selectedBody.userData;
  updateListSelection(id);
  showInfo(u);
  focusBtn.disabled = false;
}

function showInfo(u) {
  infoName.textContent = u.name;
  infoType.textContent = `Type: ${u.type}`;
  infoOrbit.textContent = `Orbit radius: ${u.orbitalRadius || "–"}`;
  infoDesc.textContent = u.description || "";
}

// Time control
timeRange.addEventListener("input", () => {
  timeScale = parseFloat(timeRange.value);
  controls.autoRotate = timeScale > 0;
});

pauseBtn.addEventListener("click", () => {
  paused = true;
  timeScale = 0;
  timeRange.value = 0;
  controls.autoRotate = false;
});

playBtn.addEventListener("click", () => {
  paused = false;
  if (timeScale === 0) {
    timeScale = 1;
    timeRange.value = 1;
  }
  controls.autoRotate = true;
});

// focus on selected
focusBtn.addEventListener("click", () => {
  if (!selectedBody) return;
  // move controls target smoothly
  const target = selectedBody.position.clone();
  controls.target.copy(target);
});

// ===== RAYCAST (click in 3D) =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (e) => {
  if (e.clientX < 260) return; // ignore clicks on sidebar
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(
    bodies.map((b) => b.mesh),
    true
  );
  if (hits.length > 0) {
    const obj = hits[0].object;
    selectedBody = obj;
    const u = obj.userData;
    showInfo(u);
    focusBtn.disabled = false;
    updateListSelection(u.isPlanet ? u.id : null);
  }
});

// ===== ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);

  const t = Date.now() * 0.001 * timeScale;

  bodies.forEach((b) => {
    if (b.isMoon && b.parent) {
      b.mesh.position.x = Math.cos(t * b.speed) * b.dist;
      b.mesh.position.z = Math.sin(t * b.speed) * b.dist;
    } else if (!b.isMoon) {
      b.mesh.position.x = Math.cos(t * b.speed) * b.dist;
      b.mesh.position.z = Math.sin(t * b.speed) * b.dist;
    }

    // earth clouds rotation
    if (b.clouds) {
      b.clouds.rotation.y += 0.001 * timeScale;
    }

    // self rotation
    if (b.mesh && b.mesh.userData.isPlanet) {
      b.mesh.rotation.y += 0.02 * timeScale;
    }
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
