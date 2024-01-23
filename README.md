# Stupid lil Cube Game

## Description

This project implements a multiplayer cube world using the Three.js library. Players can explore the world, chat with each other, and see each other's movements in real-time.

## Features

- Real-time multiplayer interactions
- Player movement and rotation synchronization
- Chat functionality
- Dynamic terrain generation
- Lighting control with debug commands

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/dvsloth/Cube-Game.git
    cd Cube-Game
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Run the server:

    ```bash
    node server.js
    ```

4. Open your browser and navigate to http://localhost:<port> to see the cube world in action.

## How to Play

- Use W, A, S, D keys for movement.
- Spacebar to jump.
- T key to activate chat input.
- Move the mouse to rotate the camera.
- Chat with other players using the chat input.

## Commands

- `/debug lighting(true)` - Enable lighting
- `/debug lighting(false)` - Disable lighting
- `/debug help` - Display debug commands help

## Server

The server is implemented using Express and Socket.io. It handles player connections, chat messages, rotations, movements, and disconnections.

## Client

The client uses Three.js for rendering the 3D environment. It includes a cube representing the player, dynamic terrain generation, lighting effects, and chat functionality.

## Credits

- Three.js: [https://threejs.org/](https://threejs.org/)
- Express: [https://expressjs.com/](https://expressjs.com/)
- Socket.io: [https://socket.io/](https://socket.io/)

## License

This project is licensed under the MIT License.