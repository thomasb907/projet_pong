"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  AmbientLight,
  SphereGeometry,
  Clock,
  MeshPhongMaterial,
  PointLight,
  Object3D,
  GridHelper,
  BackSide,
  TextureLoader,
  MeshLambertMaterial,
  Vector2,
  Raycaster,
  CylinderGeometry,
  Vector3
} from 'three';

// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'

// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  

// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es
import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import { pass } from 'three/src/nodes/TSL.js';

import {ZZFX, zzfx} from './ZzFX-master/ZzFX.js'

// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/r173/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';


// INSERT CODE HERE

let audioContext = null;
let audioInitialized = false;

const initAudio = () => {
  if (!audioInitialized) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
  }
};


const mouse = new Vector2(1, 1);
const raycaster = new Raycaster();

let speed_ball_x = 0.08;
let speed_ball_y = 0.08;
let speed_ball_z = 0.06;
const ball_size = 0.1;
const raquet_size_x = 0.7;
const raquet_size_y = 0.7;
let score = 0;
let targetVisible = true;
let targetRespawnTimeout = null;

const texture = new TextureLoader().load("./assets/models/space_image.jpg");
const borderTexture = new TextureLoader().load("./assets/models/kenney_fantasy-ui-borders/PNG/Double/Border/panel-border-002.png");

// Création du conteneur pour le score avec le style Kenney fantasy UI
const scoreContainer = document.createElement('div');
scoreContainer.style.position = 'absolute';
scoreContainer.style.top = '20px';
scoreContainer.style.left = '10px';
scoreContainer.style.width = '100px';
scoreContainer.style.height = '70px';
scoreContainer.style.backgroundImage = `url('./assets/models/kenney_fantasy-ui-borders/PNG/Double/Border/panel-border-002.png')`;
scoreContainer.style.backgroundSize = 'contain';
scoreContainer.style.backgroundRepeat = 'no-repeat';
scoreContainer.style.display = 'flex';
scoreContainer.style.justifyContent = 'left';
scoreContainer.style.alignItems = 'center';
scoreContainer.style.backgroundSize = '100% 100%';
document.body.appendChild(scoreContainer);

// Création du texte du score
const scoreDiv = document.createElement('div');
scoreDiv.style.color = 'white';
scoreDiv.style.fontFamily = 'Arial, sans-serif';
scoreDiv.style.fontSize = '17px';
scoreDiv.style.fontWeight = 'bold';
scoreDiv.style.padding = '0 7px';
scoreDiv.style.textShadow = '1px 1px 2px black';
scoreDiv.textContent = 'Score: 0';
scoreContainer.appendChild(scoreDiv);




const radius = 1;
const widthSegments = 6;
const heightSegments = 6;
const sphereGeometry = new SphereGeometry(
  radius, widthSegments, heightSegments);

const radiustop = 5;
const radiusbottom = 5;
const height_disk = 0.1;
const radius_seg = 36;

const cylinderGeometry = new CylinderGeometry(
  radiustop, radiusbottom, height_disk, radius_seg);


const scene = new Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new PerspectiveCamera(75, aspect, 0.1, 1000);

const light = new AmbientLight(0xffffff, 1.0); // soft white light
scene.add(light);

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // optional

const space_boxgeometry = new BoxGeometry(5, 5, 5);
const space_box_material = new MeshLambertMaterial({ side: BackSide, map: texture });
const space_box = new Mesh(space_boxgeometry, space_box_material);

const raquet_boxgeometry = new BoxGeometry(1, 1, 0.1);
const raquet_box_material = new MeshLambertMaterial();
const raquet = new Mesh(raquet_boxgeometry, raquet_box_material);
raquet.position.z = 1.5


/** 
const size = 10;
const divisions = 10;

const gridHelper = new GridHelper(size, divisions);
scene.add(gridHelper);
**/


const ball_material = new MeshNormalMaterial();
const ball = new Mesh(sphereGeometry, ball_material)
ball.scale.set(0.2, 0.2, 0.2);



const target_material = new MeshNormalMaterial();
const target = new Mesh(cylinderGeometry, target_material);
target.scale.set(0.05, 0.05, 0.05);
target.rotateX(Math.PI / 2);
target.position.z = -2.499;



scene.add(space_box);
scene.add(ball);
scene.add(raquet);
scene.add(target);

ball.position.x = 0.2;
ball.position.y = 0.2;
ball.position.z = 0.2;

function create_target() {
  // Générer une position aléatoire pour la cible
  const x = (Math.random() - 0.5) * 4;
  const y = (Math.random() - 0.5) * 4;
  
  target.position.x = x;
  target.position.y = y;
  target.position.z = -2.499; // Positionnement sur la paroi arrière
  
  targetVisible = true;
}

function hide_target() {
  target.position.z = -3;
  targetVisible = false;
  
  // Programmer la réapparition de la cible après 3 secondes
  clearTimeout(targetRespawnTimeout);
  targetRespawnTimeout = setTimeout(() => {
    create_target();
  }, 3000);
  
  // Augmenter le score
  score += 10;
  updateScoreDisplay();
}

function updateScoreDisplay() {
  scoreDiv.textContent = `Score: ${score}`;
}


function playBounceSound() {
  if (audioInitialized) {
    zzfx(...[1,,200,,.05,.2,4,2,,.5,,,,,,6,,.1,.01]); 
  }
}
window.addEventListener('click', initAudio);
window.addEventListener('keydown', initAudio);
window.addEventListener('touchstart', initAudio);






function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('test.glb', gltfReader);
}

function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

//loadData();


camera.position.z = 3;


const clock = new Clock();

// Main loop
const animation = () => {

  renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 
  controls.update();

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  // can be used in shaders: uniforms.u_time.value = elapsed;



  raycaster.setFromCamera(mouse, camera);

  const intersection = raycaster.intersectObject(space_box);
  if (intersection[0]) {
    raquet.position.x = intersection[0].point.x
    raquet.position.y = intersection[0].point.y
    //raquet.position.z = intersection[0].point.z

  }
  //ball maj pos
  ball.position.x = ball.position.x + speed_ball_x;
  ball.position.y = ball.position.y + speed_ball_y;
  ball.position.z = ball.position.z + speed_ball_z;

  //ball raquet col
  const is_in_x = ball.position.x + ball_size < raquet.position.x + raquet_size_x && ball.position.x - ball_size > raquet.position.x - raquet_size_x;
  const is_in_y = ball.position.y + ball_size < raquet.position.y + raquet_size_y && ball.position.y - ball_size > raquet.position.y - raquet_size_y;

  if (is_in_x && is_in_y && Math.abs(Math.abs(ball.position.z) - Math.abs(raquet.position.z)) < 0.2) {
    speed_ball_z = - speed_ball_z
  }


  //rebondir

  if (ball.position.x + ball_size > 2.5 || ball.position.x - ball_size < -2.5) {
    speed_ball_x = - speed_ball_x;
    playBounceSound();
  }
  if (ball.position.y + ball_size > 2.5 || ball.position.y - ball_size < -2.5) {
    speed_ball_y = - speed_ball_y;
    playBounceSound();
  }
  if (ball.position.z + ball_size > 2.5 || ball.position.z - ball_size < -2.5) {
    speed_ball_z = - speed_ball_z;
    playBounceSound();
  }

  // Collision balle-cible améliorée
  if (targetVisible) {
    const ballToTarget = new Vector3(
      ball.position.x - target.position.x,
      ball.position.y - target.position.y,
      ball.position.z - target.position.z
    );
    
    if (ballToTarget.length() < ball_size + 0.25) {
      hide_target();
    }
  }


  //cube.rotation.x = elapsed / 2;
  //cube.rotation.y = elapsed / 1;

  renderer.render(scene, camera);
};
function onMouseMove(event) {

  event.preventDefault();


  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

animation();



window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousemove', onMouseMove);

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}