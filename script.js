import * as THREE from "https://unpkg.com/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { OutlineEffect } from "https://unpkg.com/three@0.152.2/examples/jsm/effects/OutlineEffect.js";

// ====== SETUP ======
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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const effect = new OutlineEffect(renderer);

// ====== SKY SPHERE ======
const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide })
);
scene.add(sky);

// ====== OBJECT LISTS ======
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
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
    );

    sprite.scale.set(3, 1.2, 1);
    sprite.position.copy(position.clone().normalize().multiplyScalar(53));

    allLabels.push(sprite);
    return sprite;
}

// ====== STARS ======
function generateStars() {
    const COUNT = 600;

    for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const r = 50;

        const pos = new THREE.Vector3(
            r * Math.cos(phi) * Math.cos(theta),
            r * Math.sin(phi),
            r * Math.cos(phi) * Math.sin(theta)
        );

        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
        );

        star.position.copy(pos);
        glow.position.copy(pos);

        scene.add(star, glow);
        starsList.push({ star, glow });

        allObjects.push({
            mesh: star,
            data: { name: `Star ${i}`, type: "star", ra: theta, dec: phi }
        });
    }
}

// ====== PLANETS ======
function generatePlanets() {
    const planets = [
        { name: "Mercury", color: 0xffcc66, theta: 0.3, phi: 0.1 },
        { name: "Venus", color: 0xffe6a3, theta: 1.0, phi: 0.05 },
        { name: "Earth", color: 0x66aaff, theta: 1.8, phi: 0 },
        { name: "Mars", color: 0xff5533, theta: 2.5, phi: -0.1 },
        { name: "Jupiter", color: 0xffddaa, theta: 3.2, phi: 0.15 }
    ];

    const r = 45;

    planets.forEach(p => {
        const pos = new THREE.Vector3(
            r * Math.cos(p.phi) * Math.cos(p.theta),
            r * Math.sin(p.phi),
            r * Math.cos(p.phi) * Math.sin(p.theta)
        );

        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 20, 20),
            new THREE.MeshBasicMaterial({ color: p.color })
        );

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 20, 20),
            new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.35 })
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

// ====== INTERACTION ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", ev => {
    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hit = raycaster.intersectObjects(allObjects.map(o => o.mesh));
    if (hit.length > 0) {
        const found = allObjects.find(o => o.mesh === hit[0].object);

        document.getElementById("objName").textContent = found.data.name;
        document.getElementById("objType").textContent = "Type: " + found.data.type;
        document.getElementById("objRA").textContent = "RA: " + found.data.ra.toFixed(3);
        document.getElementById("objDEC").textContent = "DEC: " + found.data.dec.toFixed(3);
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
