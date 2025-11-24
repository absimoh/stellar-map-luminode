import * as THREE from 'https://cdn.skypack.dev/three';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById("bg");

// 🎯 ـ المشهد + الكاميرا + الرندر
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 60, 200);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 🎮 تتحكم بالكاميرا (الحركة + الزوم + الدوران)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enableZoom = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.minDistance = 20;
controls.maxDistance = 500;

// 💡 إضاءة الكواكب و النجوم
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const sunLight = new THREE.PointLight(0xffffff, 3);
scene.add(sunLight);

// 🪐 تحميل خامات (texture) للكواكب
const loader = new THREE.TextureLoader();

// 🟡 الشمس
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12,32,32),
  new THREE.MeshBasicMaterial({ map: loader.load('img/sun.jpg') })
);
scene.add(sun);

// 📌 بيانات الكواكب
const planetsData = [
  { name:"Mercury", size:2, dist:20, speed:0.02, texture:"mercury.jpg" },
  { name:"Venus", size:4, dist:30, speed:0.015, texture:"venus.jpg" },
  { name:"Earth", size:4.3, dist:40, speed:0.01, texture:"earth.jpg" },
  { name:"Mars", size:3, dist:48, speed:0.008, texture:"mars.jpg" },
  { name:"Jupiter", size:8, dist:70, speed:0.006, texture:"jupiter.jpg" },
  { name:"Saturn", size:7, dist:90, speed:0.004, texture:"saturn.jpg" },
  { name:"Uranus", size:5, dist:110, speed:0.003, texture:"uranus.jpg" },
  { name:"Neptune", size:5, dist:130, speed:0.002, texture:"neptune.jpg" }
];

const planets = [];

// 🔁 إنشاء الكواكب + المدارات
planetsData.forEach(data=>{
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(data.size,32,32),
    new THREE.MeshStandardMaterial({ map: loader.load("img/" + data.texture) })
  );
  mesh.userData = {
    name: data.name,
    orbitalRadius: data.dist,
    orbitalPeriod: (1/data.speed).toFixed(0)+" days",
    description: `${data.name} planet in our Solar System.`
  };
  scene.add(mesh);

  planets.push({mesh, ...data});

  // 🌀 رسم المدار
  const curve = new THREE.EllipseCurve(
    0,0, data.dist, data.dist, 0, 2*Math.PI, false, 0
  );
  const pts = curve.getPoints(128);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const orbit = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0x666666}));
  orbit.rotation.x = Math.PI/2;
  scene.add(orbit);
});

// 🎯 Raycaster لاختيار الكوكب
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const panel = document.getElementById("infoPanel");

window.addEventListener('click', (e)=>{
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  if(intersects.length > 0){
    const obj = intersects[0].object;
    if(obj.userData.name){
      showPanel(obj.userData);
    }
  }
});

// 📌 عرض لوحة المعلومات
function showPanel(data){
  panel.style.display = "block";
  panel.innerHTML = `
    <h3>${data.name}</h3>
    <p><b>Orbit Radius:</b> ${data.orbitalRadius}</p>
    <p><b>Orbit Period:</b> ${data.orbitalPeriod}</p>
    <p>${data.description}</p>
  `;
}

// 🔁 الرسوم المتحركة
function animate(){
  requestAnimationFrame(animate);
  planets.forEach(p=>{
    p.mesh.position.x = Math.cos(Date.now()*p.speed*0.001)*p.dist;
    p.mesh.position.z = Math.sin(Date.now()*p.speed*0.001)*p.dist;
  });
  controls.update();
  renderer.render(scene,camera);
}
animate();

// 📱 استجابة الشاشات
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
