// ====== SETUP RENDERER & SCENE ======
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

// ====== ORBIT CONTROLS ======
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;

// ====== OUTLINE EFFECT ======
const effect = new THREE.OutlineEffect(renderer);

// ====== SKY SPHERE ======
const skyGeometry = new THREE.SphereGeometry(50, 64, 64);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// ====== DATA LISTS ======
let starsList = [];
let planetsList = [];
let allLabels = [];
let allObjects = [];

// ====== LABEL CREATOR ======
function createLabel(text, position) {
    const labelCanvas = document.createElement("canvas");
    const ctx = labelCanvas.getContext("2d");

    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, 30);

    const texture = new THREE.CanvasTexture(labelCanvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 1.2, 1);
    sprite.position.copy(position.clone().normalize().multiplyScalar(53));

    allLabels.push(sprite);
    return sprite;
}

// ====== GENERATE RANDOM STARS ======
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

        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 12, 12),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35
            })
        );

        star.position.copy(pos);
        glow.position.copy(pos);

        scene.add(star, glow);
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
        { name: "Mercury", color: 0xffcc66, theta: 0.3, phi: 0.1 },
        { name: "Venus",   color: 0xffe6a3, theta: 1.0, phi: 0.05 },
        { name: "Earth",   color: 0x66aaff, theta: 1.8, phi: 0.0 },
        { name: "Mars",    color: 0xff5533, theta: 2.5, phi: -0.1 },
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
            new THREE.MeshBasicMaterial({
                color: p.color,
                transparent: true,
                opacity: 0.35
            })
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

// ====== RAYCASTER FOR CLICKS ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(allObjects.map(o => o.mesh));
    if (hits.length > 0) {
        const obj = allObjects.find(o => o.mesh === hits[0].object);
        if (obj) {
            document.getElementById("objName").textContent = obj.data.name;
            document.getElementById("objType").textContent = "Type: " + obj.data.type;
            document.getElementById("objRA").textContent   = "RA: " + obj.data.ra.toFixed(3);
            document.getElementById("objDEC").textContent  = "DEC: " + obj.data.dec.toFixed(3);
        }
    }
});

// ====== UI BUTTONS ======
document.getElementById("resetView").addEventListener("click", () => {
    camera.position.set(0, 0, 3);
    controls.reset();
});

let labelsVisible = true;
document.getElementById("toggleLabels").addEventListener("click", () => {
    labelsVisible = !labelsVisible;
    allLabels.forEach(l => l.visible = labelsVisible);
});

document.getElementById("showStars").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = false; p.glow.visible = false; });
});

document.getElementById("showPlanets").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = false; s.glow.visible = false; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
});

document.getElementById("showAll").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
});

let themeIndex = 0;
document.getElementById("themeSwitch").addEventListener("click", () => {
    themeIndex = (themeIndex + 1) % 3;
    if (themeIndex === 0)
        document.body.style.background = "radial-gradient(circle at top, #202442, #050713, #000000)";
    if (themeIndex === 1)
        document.body.style.background = "radial-gradient(circle at top, #111827, #020617, #000000)";
    if (themeIndex === 2)
        document.body.style.background = "radial-gradient(circle at top, #1f2937, #020617, #000000)";
});

// ====== ANIMATION LOOP ======
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    effect.render(scene, camera);
}
animate();

// ====== HANDLE RESIZE ======
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
