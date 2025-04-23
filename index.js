const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("gameCanvas").appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Create some objects
function createGroup(numItems) {
  const group = new THREE.Group();

  for (let i = 0; i < numItems; i++) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({
      color: Math.random() * 0xffffff,
    });
    const cube = new THREE.Mesh(geometry, material);

    // Position items around center
    const angle = (Math.PI * 2) / numItems;
    cube.position.x = Math.cos(i * angle) * 1.5;
    cube.position.z = Math.sin(i * angle) * 1.5;
    cube.position.y = 0.5;

    group.add(cube);
  }

  return group;
}

// Add some groups
const group3 = createGroup(3);
group3.position.set(-2, 0, 0);
scene.add(group3);

const group2 = createGroup(2);
group2.position.set(2, 0, 0);
scene.add(group2);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
