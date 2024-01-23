(function() {
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const stats = new Stats();
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
let isChatInputActive = false;
const socket = io();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
stats.domElement.classList.add("fpsC");
document.body.appendChild(stats.domElement);
document.body.appendChild(renderer.domElement);

let isLightingEnabled = true;

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); 
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
const blockMaterial = new THREE.MeshPhongMaterial({}); 
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const block = new THREE.Mesh(blockGeometry, blockMaterial);

function createBlock(x, y, z, color) {
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshPhongMaterial({ color: color });
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(x, y, z);
    scene.add(block);
}

block.frustumCulled = true;

let findTerrainHeight;

function genWorld() {
const worldSize = 30;
const hillAmplitude = 2.5;
const hillFrequency = 0.1;

    for (let x = -worldSize / 2; x < worldSize / 1; x++) {
        for (let z = -worldSize / 2; z < worldSize / 2; z++) {
            const height = Math.sin(x * hillFrequency) + Math.cos(z * hillFrequency);
            const scaledHeight = height * hillAmplitude;

            let color = 0xFFF;
            if (scaledHeight > 0) {
                color = 0x005500;
            }

            createBlock(x, scaledHeight, z, color);
            findTerrainHeight = function (x, z) {
                const height = Math.sin(x * hillFrequency) + Math.cos(z * hillFrequency);
                const scaledHeight = height * hillAmplitude;
                return scaledHeight;
            };

            const initialX = 0;
            const initialZ = 0;
            const initialY = findTerrainHeight(initialX, initialZ) + 1;
            cube.position.set(initialX, initialY, initialZ);
        }
    }
}

genWorld();

const worldBorder = {
    minX: -15,
    maxX: 29.5,
    minZ: -15,
    maxZ: 14,
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
};
const mouseSensitivity = 0.002;
let isMouseCaptured = false;
let previousMouseX = 0;
let previousMouseY = 0;

let jumping = false;
let jumpHeight = 2;
let jumpVelocity = 0;

function toggleLighting(enable) {
    isLightingEnabled = enable;
    if (enable) {
        scene.add(directionalLight);
        scene.add(ambientLight);
    } else {
        scene.remove(directionalLight);
        scene.remove(ambientLight);
    }
}

function handleDebugCommand(command) {
    const parts = command.split(' ');
    if (parts.length >= 2 && parts[0] === '/debug') {
        const option = parts[1].toLowerCase();
        if (option === 'lighting(true)') {
            toggleLighting(true);
            const debugenlightMessage = document.createElement('div');
            debugenlightMessage.classList.add('debug-enlight-message');
            debugenlightMessage.innerHTML = `
            <div class="debug-help-subtitle">Client lighting <span class="help-header">Enabled!</span></div>
            `;
            chatMessages.appendChild(debugenlightMessage);
        } else if (option === 'lighting(false)') {
            toggleLighting(false);
            const debugdislightMessage = document.createElement('div');
            debugdislightMessage.classList.add('debug-dislight-message');
            debugdislightMessage.innerHTML = `
            <div class="debug-help-subtitle">Client lighting <span class="debug-help-header">Disabled!</span></div>
            `;
            chatMessages.appendChild(debugdislightMessage);
        } else if (option === 'help') {
            const debugHelpMessage = document.createElement('div');
            debugHelpMessage.classList.add('debug-help-message');
            debugHelpMessage.innerHTML = `
            <div class="debug-help-header">Debug Help Menu <span class="debug-help-subtitle">(1/1)</span></div>
            <div class="debug-help-item">1. /debug lighting<span class="trufal">(true|false)</div>
            `;
            
            chatMessages.appendChild(debugHelpMessage);
        }
    }
}

function handleSlashCommand(command) {
    const parts = command.trim().split(' ');
    if (parts.length >= 1 && parts[0].startsWith('/')) {
        const option = parts[0].toLowerCase();
        if (option === '/help' || option === '/help') {
            const helpMessage = document.createElement('div');
            helpMessage.classList.add('help-message');
            helpMessage.innerHTML = `
                <div class="help-header">Help Menu <span class="help-subtitle">(1/1)</span></div>
                <div class="help-item">1. /debug help (See all debug commands)</div>
            `;
            
            chatMessages.appendChild(helpMessage);
        }
    }
}

function toggleMouseCapture() {
    const canvas = renderer.domElement;

    if (!isMouseCaptured) {
        canvas.requestPointerLock =
            canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;

        canvas.requestPointerLock();
    } else {
        document.exitPointerLock();
    }
    isMouseCaptured = !isMouseCaptured;
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
    if (!isChatInputActive) {
        switch (event.key) {
            case 'w':
                controls.ArrowUp = true;
                break;
            case 's':
                controls.ArrowDown = true;
                break;
            case 'a':
                controls.ArrowLeft = true;
                break;
            case 'd':
                controls.ArrowRight = true;
                break;
            case ' ':
                if (!jumping) {
                    jumping = true;
                    jumpVelocity = 0.25;
                }
                break;
            case 't':
                chatInput.focus();
                isChatInputActive = true;
                event.preventDefault();
                break;
        }
    }
});
document.addEventListener('keyup', (event) => {
    if (!isChatInputActive) {
        switch (event.key) {
            case 'w':
                controls.ArrowUp = false;
                break;
            case 's':
                controls.ArrowDown = false;
                break;
            case 'a':
                controls.ArrowLeft = false;
                break;
            case 'd':
                controls.ArrowRight = false;
                break;
            case ' ':
                if (!jumping) {
                    jumping = true;
                    jumpVelocity = 0.25;
                }
                break;
        }
        if (event.keyCode === 32) {
            if (!jumping) {
                jumping = true;
                jumpVelocity = 0.25;
            }
        }
    }
});

document.addEventListener('click', toggleMouseCapture);

document.addEventListener('mousemove', (event) => {
    if (isMouseCaptured) {
        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        cube.rotation.y -= deltaX * mouseSensitivity;
        camera.rotation.x -= deltaY * mouseSensitivity;

        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;

        socket.emit('rotate', { rotationY: cube.rotation.y });
    }
});
socket.on('playerRotated', (data) => {
    const playerCube = playerData[data.playerId];
    if (playerCube) {
        playerCube.rotation.y = data.rotationY;
    }
});

const cameraLerpFactor = 0.05;

const moveSpeed = 0.1;
let lastFrameTime = 0;
const targetFrameRate = 100;
const frameTime = 1000 / targetFrameRate;


function appendMessage(message, color) {
    const messageElement = document.createElement('div');
    messageElement.style.color = color || 'white';
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}
chatInput.addEventListener('focus', () => {
    isChatInputActive = true;
    controls.ArrowUp = false;
    controls.ArrowDown = false;
    controls.ArrowLeft = false;
    controls.ArrowRight = false;
});

chatInput.addEventListener('blur', () => {
    isChatInputActive = false;
});

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message !== '') {
        if (message.startsWith('/debug')) {
            handleDebugCommand(message);
        } else if (message.startsWith('/')) {
            handleSlashCommand(message);
        } else {
            socket.emit('chatMessage', { message });
            appendMessage(`You: ${message}`);
        }

        chatInput.value = '';
        chatInput.blur();
        isChatInputActive = false;
    }
}


socket.on('chatMessage', (data) => {
    appendMessage(`Player: ${data.message}`);
});

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
    
            const playerMaterial = new THREE.MeshPhongMaterial({ color: data.color });
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

function checkCollision() {
    const playerX = cube.position.x;
    const playerZ = cube.position.z;
    const terrainHeight = findTerrainHeight(playerX, playerZ) + 1.1;

    if (cube.position.y <= terrainHeight) {
        cube.position.y = terrainHeight;
        jumping = false;
    } else if (cube.position.y > terrainHeight) {
        cube.position.y -= 0.1;
        if (cube.position.y < terrainHeight) {
            cube.position.y = terrainHeight;
            jumping = false;
        }
    }

    if (cube.position.x < worldBorder.minX) {
        cube.position.x = worldBorder.minX;
    } else if (cube.position.x > worldBorder.maxX) {
        cube.position.x = worldBorder.maxX;
    }

    if (cube.position.z < worldBorder.minZ) {
        cube.position.z = worldBorder.minZ;
    } else if (cube.position.z > worldBorder.maxZ) {
        cube.position.z = worldBorder.maxZ;
    }
}

const frustum = new THREE.Frustum();
const cameraViewMatrix = new THREE.Matrix4();
const playerRotationSpeed = 0.02;
const playerSpeed = 0.1;

const animate = (timestamp) => {
    if (timestamp - lastFrameTime >= frameTime) {
        lastFrameTime = timestamp;
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.visible = true;
            }
        });
        if (jumping) {
            cube.position.y += jumpVelocity;
            jumpVelocity -= 0.01;

            if (cube.position.y <= 0.5) {
                cube.position.y = 0.5;
                jumping = false;
            }
        }
        const movementDirection = new THREE.Vector3(0, 0, 0);
        
        if (controls.ArrowUp) {
            movementDirection.z = 1;
        }
        if (controls.ArrowDown) {
            movementDirection.z = -1;
        }
        if (controls.ArrowLeft) {
            movementDirection.x = 1;
        }
        if (controls.ArrowRight) {
            movementDirection.x = -1;
        }

        checkCollision();

        const cameraDistance = 5;
        const cameraHeight = 2;
        const playerRotationY = cube.rotation.y;
        
        const playerX = cube.position.x;
        const playerY = cube.position.y;
        const playerZ = cube.position.z;

        const offsetX = Math.sin(playerRotationY) * cameraDistance;
        const offsetZ = Math.cos(playerRotationY) * cameraDistance;
        const offsetY = cameraHeight;

        const targetCameraPosition = new THREE.Vector3(
            playerX - offsetX,
            playerY + offsetY,
            playerZ - offsetZ
        );
        const rotatedDirection = movementDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotationY);
        cube.position.add(rotatedDirection.multiplyScalar(playerSpeed));
        
        camera.position.lerp(targetCameraPosition, cameraLerpFactor);
        if (controls.ArrowLeft || controls.ArrowRight) {
            cube.rotation.y += (controls.ArrowLeft ? 1 : -1) * playerRotationSpeed;
        }
        camera.rotation.copy(cube.rotation);
        camera.lookAt(cube.position);

        socket.emit('move', { position: cube.position });

        renderer.render(scene, camera);
        camera.updateMatrixWorld();
        cameraViewMatrix.copy(camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, cameraViewMatrix));

        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (frustum.intersectsObject(object)) {
                    object.visible = true;
                } else {
                    object.visible = false;
                }
            }
        });
        stats.update();
        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
    
};

animate();
})();