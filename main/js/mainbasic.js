const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const stats = new Stats();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
stats.domElement.classList.add("fpsC");
document.body.appendChild(stats.domElement);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const groundGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
const grassTexture = new THREE.TextureLoader().load('/js/grass.jpg');
const groundMaterial = new THREE.MeshBasicMaterial({ map: grassTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

const boundary = {
    minX: -45,
    maxX: 45,
    minZ: -45,
    maxZ: 45,
};

const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

const cameraDistance = 5;
const cameraHeight = 2;
camera.position.set(cube.position.x, cube.position.y + cameraHeight, cube.position.z - cameraDistance);
camera.lookAt(cube.position);

const controls = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

let jumping = false;
let jumpHeight = 2;
let jumpVelocity = 0;

document.addEventListener('keydown', (event) => {
    if (event.key in controls) {
        controls[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key in controls) {
        controls[event.key] = false;
    }
});

document.addEventListener('click', () => {
    if (!jumping) {
        jumping = true;
        jumpVelocity = 0.15;
    }
});

const cameraLerpFactor = 0.05;

const moveSpeed = 0.1;

const socket = io();

const playerData = {};
socket.on('setColor', (colorHex) => {
    cube.material.color.set(colorHex);
});

socket.on('playerColorChanged', (data) => {
    if (data.id !== socket.id && playerData[data.id]) {
        playerData[data.id].material.color.set(data.color);
    }
});

socket.on('playerMoved', (data) => {
    const hexi = '#' + Math.floor(Math.random() * 16777215).toString(16);
    if (data.id !== socket.id) {
        let playerCube = playerData[data.id];
        if (!playerCube) {
            const isValidColor = /^#([0-9A-F]{3}){1,2}$/i.test(data.color);
            
            if (!isValidColor) {
                data.color = hexi;
            }

            const playerMaterial = new THREE.MeshBasicMaterial({ color: data.color });
            playerCube = new THREE.Mesh(geometry, playerMaterial);
            scene.add(playerCube);
            playerData[data.id] = playerCube;
        }
        playerCube.position.copy(data.position);
    }
});
socket.on('playerDisconnected', (playerId) => {
    if (playerData[playerId]) {
        scene.remove(playerData[playerId]);
        delete playerData[playerId];
    }
});

const animate = () => {
    requestAnimationFrame(animate);

    if (jumping) {
        cube.position.y += jumpVelocity;
        jumpVelocity -= 0.01;

        if (cube.position.y <= 0.5) {
            cube.position.y = 0.5;
            jumping = false;
        }
    }

    if (controls.ArrowUp && cube.position.z < boundary.maxZ) {
        cube.position.z += moveSpeed;
    }
    if (controls.ArrowDown && cube.position.z > boundary.minZ) {
        cube.position.z -= moveSpeed;
    }
    if (controls.ArrowLeft && cube.position.x < boundary.maxX) {
        cube.position.x += moveSpeed;
    }
    if (controls.ArrowRight && cube.position.x > boundary.minX) {
        cube.position.x -= moveSpeed;
    }

    const targetCameraPosition = new THREE.Vector3(
        cube.position.x,
        cube.position.y + cameraHeight,
        cube.position.z - cameraDistance
    );

    camera.position.lerp(targetCameraPosition, cameraLerpFactor);
    camera.lookAt(cube.position);

    socket.emit('move', { position: cube.position });
    stats.update();

    renderer.render(scene, camera);
};

animate();