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
camera.position.z = 3;

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

// ====== GLOW OUTLINE EFFECT ======
const effect = new THREE.OutlineEffect(renderer);

// ====== FUNCTION TO CREATE LABELS ======
function createLabel(text, position) {
    const labelCanvas = document.createElement("canvas");
    const ctx = labelCanvas.getContext("2d");

    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, 30);

    const texture = new THREE.CanvasTexture(labelCanvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(3, 1.2, 1);
    sprite.position.copy(position.clone().normalize().multiplyScalar(53));

    return sprite;
}

// ====== FETCH ASTRONOMICAL DATA ======
fetch("https://api.stellarium.org/api/objects")
    .then(res => res.json())
    .then(data => {
        data.forEach(obj => {
            let color;

            if (obj.type === "star") {
                color = 0xffffff;
            } else if (obj.type === "planet") {
                color = 0xffdd00;
            } else return;

            const star = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 16, 16),
                new THREE.MeshBasicMaterial({ color })
            );

            const ra = obj.ra * (Math.PI / 180);
            const dec = obj.dec * (Math.PI / 180);
            const r = 50;

            const pos = new THREE.Vector3(
                r * Math.cos(dec) * Math.cos(ra),
                r * Math.sin(dec),
                r * Math.cos(dec) * Math.sin(ra)
            );

            star.position.copy(pos);
            scene.add(star);

            if (obj.name) {
                const label = createLabel(obj.name, pos);
                scene.add(label);
            }
        });
    });

// ====== ANIMATION LOOP ======
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    effect.render(scene, camera);  // <<<< اللمعان هنا

}

animate();

// ====== RESIZE HANDLER ======
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
