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
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// ====== OUTLINE EFFECT ======
const effect = new THREE.OutlineEffect(renderer);

// ====== SKY SPHERE ======
const skyGeo = new THREE.SphereGeometry(50, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide });
scene.add(new THREE.Mesh(skyGeo, skyMat));

// ====== DATA LISTS ======
let starsList = [];
let planetsList = [];
let allLabels = [];
let allObjects = [];

// ====== LABEL CREATOR ======
function createLabel(text, position) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");

    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, 30);

    const texture = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 1.2, 1);
    sprite.position.copy(position.clone().normalize().multiplyScalar(53));

    allLabels.push(sprite);
    return sprite;
}

// ====== GENERATE STARS ======
function generateStars() {
    const NUM = 600;

    for (let i = 0; i < NUM; i++) {
        const theta = Math.random() * 2 * Math.PI;
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

        allObjects.push({
            mesh: star,
            data: { name: `Star ${i + 1}`, type: "star", ra: theta, dec: phi }
        });
    }
}

// ====== GENERATE PLANETS ======
function generatePlanets() {
    const planets = [
        { name: "Mercury", color: 0xffcc66, theta: 0.2, phi: 0.15 },
        { name: "Venus",   color: 0xffe6a3, theta: 1.0, phi: 0.05 },
        { name: "Earth",   color: 0x66aaff, theta: 1.8, phi: 0.00 },
        { name: "Mars",    color: 0xff5533, theta: 2.5, phi: -0.05 },
        { name: "Jupiter", color: 0xffddaa, theta: 3.2, phi: 0.10 }
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

// ====== RAYCAST ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allObjects.map(o => o.mesh));

    if (hits.length > 0) {
        const obj = allObjects.find(o => o.mesh === hits[0].object);
        document.getElementById("objName").textContent = obj.data.name;
        document.getElementById("objType").textContent = "Type: " + obj.data.type;
        document.getElementById("objRA").textContent   = "RA: " + obj.data.ra.toFixed(3);
        document.getElementById("objDEC").textContent  = "DEC: " + obj.data.dec.toFixed(3);
    }
});

// ====== BUTTONS ======
document.getElementById("resetView").onclick = () => {
    camera.position.set(0, 0, 3);
    controls.reset();
};

let labelsVisible = true;
document.getElementById("toggleLabels").onclick = () => {
    labelsVisible = !labelsVisible;
    allLabels.forEach(l => l.visible = labelsVisible);
};

document.getElementById("showStars").onclick = () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = false; p.glow.visible = false; });
};

document.getElementById("showPlanets").onclick = () => {
    starsList.forEach(s => { s.star.visible = false; s.glow.visible = false; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
};

document.getElementById("showAll").onclick = () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
};

let themeIndex = 0;
document.getElementById("themeSwitch").onclick = () => {
    themeIndex = (themeIndex + 1) % 3;

    if (themeIndex === 0)
        document.body.style.background = "linear-gradient(#0c1224, #050712)";
    if (themeIndex === 1)
        document.body.style.background = "linear-gradient(#141a2f, #060910)";
    if (themeIndex === 2)
        document.body.style.background = "linear-gradient(#1b2238, #080b13)";
};

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
