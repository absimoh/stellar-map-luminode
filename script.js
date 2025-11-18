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

// ====== LABEL SYSTEM ======
let labelsVisible = true;
let allLabels = [];

// Lists for filters
let starsList = [];
let planetsList = [];

// ====== RAYCASTER (for clicking) ======
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let allObjects = [];   // store clickable objects (stars + planets)

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

// ====== FETCH ASTRONOMICAL OBJECTS ======
fetch("https://api.stellarium.org/api/objects")
    .then(res => res.json())
    .then(data => {
        data.forEach(obj => {
            let color;

            if (obj.type === "star") color = 0xffffff;
            else if (obj.type === "planet") color = 0xffdd00;
            else return;

            const ra = obj.ra * (Math.PI / 180);
            const dec = obj.dec * (Math.PI / 180);
            const r = 50;

            const pos = new THREE.Vector3(
                r * Math.cos(dec) * Math.cos(ra),
                r * Math.sin(dec),
                r * Math.cos(dec) * Math.sin(ra)
            );

            // ====== MAIN STAR / PLANET ======
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 16, 16),
                new THREE.MeshBasicMaterial({ color })
            );

            // ====== GLOW SPHERE ======
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.35
            });

            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 16, 16),
                glowMaterial
            );

            glow.position.copy(pos);
            star.position.copy(pos);

            scene.add(glow);
            scene.add(star);

            // store for filters
            if (obj.type === "star") starsList.push({ star, glow });
            if (obj.type === "planet") planetsList.push({ star, glow });

            // store for click selection
            allObjects.push({
                mesh: star,
                data: obj
            });

            // ====== LABELS ======
            if (obj.name) {
                const label = createLabel(obj.name, pos);
                scene.add(label);
            }
        });
    });

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
