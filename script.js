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

// ====== CREATE SKY SPHERE ======
const skyGeometry = new THREE.SphereGeometry(50, 64, 64);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// ====== FETCH ASTRONOMY DATA FROM STELLARIUM API ======
fetch("https://api.stellarium.org/api/objects")
    .then(res => res.json())
    .then(data => {
        data.forEach(obj => {
            let color;

            if (obj.type === "star") {
                color = 0xffffff; // white stars
            } else if (obj.type === "planet") {
                color = 0xffdd00; // yellow planets
            } else {
                return;
            }

            const starGeometry = new THREE.SphereGeometry(0.03, 16, 16);
            const starMaterial = new THREE.MeshBasicMaterial({ color });
            const star = new THREE.Mesh(starGeometry, starMaterial);

            // convert RA/DEC from Stellarium to 3D globe position
            const ra = obj.ra * (Math.PI / 180);
            const dec = obj.dec * (Math.PI / 180);

            const r = 50; // radius of sky sphere
            star.position.set(
                r * Math.cos(dec) * Math.cos(ra),
                r * Math.sin(dec),
                r * Math.cos(dec) * Math.sin(ra)
            );

            scene.add(star);
        });
    });

// ====== ANIMATION LOOP ======
function animate() {
    requestAnimationFrame(animate);

    // slow rotation
    scene.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

animate();

// ====== HANDLE WINDOW RESIZE ======
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
