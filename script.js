// ====== SETUP CANVAS & RENDERER ======
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
controls.enableRotate = true;
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.enablePan = false;

// ====== SKY SPHERE ======
const skyGeometry = new THREE.SphereGeometry(50, 64, 64);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// ====== OUTLINE (Glow Engine) ======
const effect = new THREE.OutlineEffect(renderer);

// ====== LABEL / FILTER SYSTEM ======
let labelsVisible = true;
let allLabels = [];
let starsList = [];
let planetsList = [];

// ====== RAYCASTER (for clicking) ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let allObjects = [];   // clickable objects (stars + planets)

// ====== CREATE LABELS ======
function createLabel(text, position) {
    const labelCanvas = document.createElement("canvas");
    const ctx = labelCanvas.getContext("2d");

    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, 30);

    const texture = new THREE.CanvasTexture(labelCanvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3, 1.2, 1);
    sprite.position.copy(position.clone().normalize().multiplyScalar(53));

    allLabels.push(sprite);
    return sprite;
}

// ====== GENERATE RANDOM STARS (NO EXTERNAL API) ======
function generateStars() {
    const NUM_STARS = 600;

    for (let i = 0; i < NUM_STARS; i++) {
        const color = 0xffffff;

        // random angles (like RA / DEC)
        const theta = Math.random() * Math.PI * 2;     // 0..2π
        const phi   = (Math.random() - 0.5) * Math.PI; // -π/2..π/2
        const r = 50;

        const pos = new THREE.Vector3(
            r * Math.cos(phi) * Math.cos(theta),
            r * Math.sin(phi),
            r * Math.cos(phi) * Math.sin(theta)
        );

        // main star
        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 12, 12),
            new THREE.MeshBasicMaterial({ color })
        );

        // glow
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.35
        });

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 12, 12),
            glowMaterial
        );

        star.position.copy(pos);
        glow.position.copy(pos);

        scene.add(glow);
        scene.add(star);

        // خزنهم عشان الفلاتر
        starsList.push({ star, glow });

        // خزن بعض النجوم بأسماء
        let labelName = null;
        if (i === 10) labelName = "Star A";
        if (i === 40) labelName = "Star B";
        if (i === 100) labelName = "Star C";
        if (i === 200) labelName = "Star D";
        if (i === 300) labelName = "Star E";

        const dataObj = {
            name: labelName || `Star ${i + 1}`,
            type: "star",
            ra: theta,
            dec: phi
        };

        allObjects.push({
            mesh: star,
            data: dataObj
        });

        if (labelName) {
            const label = createLabel(labelName, pos);
            scene.add(label);
        }
    }
}

// ====== GENERATE PLANETS (LOCAL DATA) ======
function generatePlanets() {
    const planetsData = [
        { name: "Mercury", color: 0xffcc66, theta: 0.2,  phi: 0.1 },
        { name: "Venus",   color: 0xffe6a3, theta: 1.0,  phi: 0.05 },
        { name: "Earth",   color: 0x66aaff, theta: 1.8,  phi: 0.0 },
        { name: "Mars",    color: 0xff5533, theta: 2.4,  phi: -0.05 },
        { name: "Jupiter", color: 0xffddaa, theta: 3.1,  phi: 0.12 },
        { name: "Saturn",  color: 0xffdd88, theta: 4.0,  phi: -0.1 },
        { name: "Uranus",  color: 0x88ddff, theta: 4.8,  phi: 0.15 },
        { name: "Neptune", color: 0x5588ff, theta: 5.6,  phi: -0.12 }
    ];

    const r = 45;

    planetsData.forEach(p => {
        const pos = new THREE.Vector3(
            r * Math.cos(p.phi) * Math.cos(p.theta),
            r * Math.sin(p.phi),
            r * Math.cos(p.phi) * Math.sin(p.theta)
        );

        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 20, 20),
            new THREE.MeshBasicMaterial({ color: p.color })
        );

        const glowMaterial = new THREE.MeshBasicMaterial({
            color: p.color,
            transparent: true,
            opacity: 0.45
        });

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 20, 20),
            glowMaterial
        );

        planet.position.copy(pos);
        glow.position.copy(pos);

        scene.add(glow);
        scene.add(planet);

        planetsList.push({ star: planet, glow });

        const dataObj = {
            name: p.name,
            type: "planet",
            ra: p.theta,
            dec: p.phi
        };

        allObjects.push({
            mesh: planet,
            data: dataObj
        });

        const label = createLabel(p.name, pos);
        scene.add(label);
    });
}

// شغّل التوليد
generateStars();
generatePlanets();

// ====== BUTTONS ======

// Reset View
document.getElementById("resetView").addEventListener("click", () => {
    camera.position.set(0, 0, 3);
    controls.reset();
});

// Toggle Labels
document.getElementById("toggleLabels").addEventListener("click", () => {
    labelsVisible = !labelsVisible;
    allLabels.forEach(label => { label.visible = labelsVisible; });
});

// Show Stars Only
document.getElementById("showStars").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = false; p.glow.visible = false; });
});

// Show Planets Only
document.getElementById("showPlanets").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = false; s.glow.visible = false; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
});

// Show All
document.getElementById("showAll").addEventListener("click", () => {
    starsList.forEach(s => { s.star.visible = true; s.glow.visible = true; });
    planetsList.forEach(p => { p.star.visible = true; p.glow.visible = true; });
});

// Theme Switch
let theme = 0;
document.getElementById("themeSwitch").addEventListener("click", () => {
    theme = (theme + 1) % 3;

    if (theme === 0)
        document.body.style.backgroundImage = "url('https://i.imgur.com/zY3n7U8.jpg')";
    if (theme === 1)
        document.body.style.backgroundImage = "url('https://i.imgur.com/8o9dKBl.jpg')";
    if (theme === 2)
        document.body.style.backgroundImage = "url('https://i.imgur.com/FrDqPMi.jpg')";
});

// ====== MOUSE CLICK EVENT (INFO PANEL) ======
window.addEventListener("click", event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
        allObjects.map(o => o.mesh)
    );

    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const found = allObjects.find(o => o.mesh === clickedMesh);

        if (found) {
            const d = found.data;
            document.getElementById("objName").textContent = d.name || "Unknown object";
            document.getElementById("objType").textContent = "Type: " + (d.type || "N/A");
            document.getElementById("objRA").textContent   = "RA: " + (d.ra  ? d.ra.toFixed(3)  : "N/A");
            document.getElementById("objDEC").textContent  = "DEC: " + (d.dec ? d.dec.toFixed(3) : "N/A");
        }
    }
});

// ====== ANIMATION LOOP ======
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
