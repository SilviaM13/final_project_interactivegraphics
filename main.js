import './style.css';
import * as THREE from 'three';
import { FontLoader } from '../node_modules/three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from '../node_modules/three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; //zoom, rotazione
import { depth } from 'three/examples/jsm/nodes/Nodes.js';

//crea scena
const scene = new THREE.Scene();

//creazione camera ortografica
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 25;
const camera = new THREE.PerspectiveCamera(
  70, window.innerWidth/window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);

//renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);
//supporti per le ombre
renderer.shadowMap.enabled = true;
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.target.set(0, 0, 0); //punto intorno al quale ruota 

//luce direzionale 
const directionalLight = new THREE.DirectionalLight(0xffffff, 30);
directionalLight.position.set(10, 20, 10);
directionalLight.target.position.set(0, -5 ,0) //orientamento luce
directionalLight.castShadow = true; //per le ombre
scene.add(directionalLight);
scene.add(directionalLight.target);

//const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(helper);

renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
scene.add(directionalLight);

//const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(shadowCameraHelper);

function updateLight() { //aggiornare la luce

  directionalLight.target.updateMatrixWorld();
  //helper.update();
}
updateLight();


//background (image HP) 
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/src/Hogwarts.jpg', (texture) => {
  scene.background = texture;
  console.log('Background texture loaded.');
});

//letters of the game 
const allLetters = [
  'A', 'A','B', 'C', 'D','D', 'E','E', 'F', 'G', 'H', 'I','I', 'J', 'K', 'L', 'M',
  'N','N', 'O','O', 'P', 'Q', 'R','R','S', 'T','T', 'U', 'V', 'W', 'X','X', 'Y', 'Z'
];

//exibithor letters
function createRack(width, height, depth, color) {
  const rackGeometry = new THREE.BoxGeometry(width, height, depth);
  const rackMaterial = new THREE.MeshBasicMaterial({ color: color });
  const rack = new THREE.Mesh(rackGeometry, rackMaterial);
  //rack.rotation.x = -Math.PI / 2;
  return rack;
}
//position (creazione rack 3D) exibitor
const rackWidth = 12;
const rackHeight = 0.5;
const rackDepth = 1;
const rackColor = 0x808080;

//creazione espositori per i giocatori
const player1Rack = createRack(rackWidth, rackHeight, rackDepth, rackColor);
player1Rack.position.set(0, rackHeight / 2, -10); 
scene.add(player1Rack);

const player2Rack = createRack(rackWidth, rackHeight, rackDepth, rackColor);
player2Rack.position.set(0, rackHeight / 2, 10); 
scene.add(player2Rack);

// dati tabellone
const boardSize = 15;
const boardState = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

//font per creare geometrie testo 3D
const loader = new FontLoader();
let loadedFont = null;

loader.load('/src/fonts/helvetiker_regular.typeface.json', (font) => {
  loadedFont = font;
  console.log('Font loaded:', font);

  //testo 3D per player 1 
  player1NameMesh = createPlayerNameMesh('Player 1', { x: -6, y: 2, z: -12 }, 0x000000);
  scene.add(player1NameMesh);

  //testo 3D per player 2
  player2NameMesh = createPlayerNameMesh('Player 2', { x: -6, y: 2, z: 12 }, 0x000000);
  scene.add(player2NameMesh);

  addRotatingText(); //aggiungere il testo 3D una volta caricato il font
});


//per creare e aggiungere il testo 3D
function addRotatingText() {
  if (!loadedFont) {
    console.error('Font not loaded yet');
    return;
  }

  const textGeometry = new TextGeometry('Wizard Words', {
    font: loadedFont,
    size: 1,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5
  });

  const textMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

  textMesh.position.x = centerOffset;
  textMesh.position.y = 0;
  textMesh.position.z = -10;

  textMesh.rotation.x = 0;
  textMesh.rotation.y = 0;

  scene.add(textMesh);


//animazione nome del gioco (movimento lungo percorso sfondo)
  let angle = 0;
  const radius = 10; 

  function animateText() {
    requestAnimationFrame(animateText);
    angle += 0.01; //velocità rotazione

    //creazione movimento circolare
    textMesh.position.x = radius * Math.cos(angle);
    textMesh.position.y = radius * Math.sin(angle);
    textMesh.position.z = radius * Math.sin(angle * 0.5);
    //rotazione
    textMesh.rotation.x += 0.01; 
    textMesh.rotation.y += 0.01; 

    renderer.render(scene, camera);
  }

  animateText();
}

//tasselli in 3D
const tileSize = 1; 
const tileHeight = 0.7; 

//funzione per creare un tassello con la lettera
function createLetterTile(letter) {
  const tileSize = 1; 
  const tileHeight = 0.6; 
  //geometria per il tassello
  const tileGeometry = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);

  //materiale del tassello (bianco per tutte le facce)
  const tileMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xffffff }), //right face
    new THREE.MeshBasicMaterial({ color: 0xffffff }), //left
    new THREE.MeshBasicMaterial({ color: 0xffffff }), //top 
    new THREE.MeshBasicMaterial({ color: 0xffffff }), //bottom
    new THREE.MeshBasicMaterial({ color: 0xffffff }), //front 
    new THREE.MeshBasicMaterial({ color: 0xffffff })  //back
  ];

  const tile = new THREE.Mesh(tileGeometry, tileMaterials);

  // proiezione e ricezione delle ombre per il tassello
  tile.castShadow = true;
  tile.receiveShadow = true;

  //caricamento texture della lettera per faccia anteriore
  const textureLoader = new THREE.TextureLoader();
  const texturePath = `/letters/${letter}.png`;
  textureLoader.load(texturePath, (texture) => {
    tile.material[2].map = texture; //faccia frontale con texture della lettera
    tile.material[2].needsUpdate = true;
    scene.add(tile);
    console.log(`Tessera con texture creata per la lettera: ${letter}`);
  }, undefined, (err) => {
    console.error('Errore nel caricamento della texture:', err);
  });

  tile.userData = {
    isTile: true,
    letter: letter
  };
  console.log(`tessera creata per la lettera: ${letter}`);
  return tile;
}


//posizionamento lettere sugli espositori
function positionLetterOnRack(letterTile, rack, index) {
  const spacing = 1.2; //spazio tra i tasselli
  letterTile.position.set(
    rack.position.x - rackWidth / 2 + tileSize / 2 + index * spacing,
    rack.position.y + rackHeight / 2 + tileHeight / 2,
    rack.position.z
  );
  letterTile.userData.rackIndex = index; 
  rack.add(letterTile); 
}

function restoreRackTile(letter, rack) {
  const letterTile = createLetterTile(letter);
  const index = rack.children.length;
  positionLetterOnRack(letterTile, rack, index);
}


let selectedCell = null; 
let selectedTile = null;

//funzione gestione pressione dei tasti
function onDocumentKeyDown(event) {
  const key = event.key.toUpperCase();
  console.log(`Tasto premuto: ${key}`);
  let playerLetters = currentPlayer === 1 ? player1Letters : player2Letters;
  let playerRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const player = currentPlayer === 1 ? 'player1' : 'player2';
  if (event.key === 'Delete' || event.key === 'Backspace') {
    //rimozione lettera dal tabellone (se è stato selezionato un tassello)
    if (selectedTile) {
      const cell = selectedTile.userData.cell;
      const row = cell.userData.row;
      const col = cell.userData.col;
      const letter = boardState[row][col];
      boardState[row][col] = null;
      removeLetterFromCell(selectedTile);

      if (letter) {
        playerLetters.push(letter);
        console.log('Rimozione lettera:', letter);
        restoreRackTile(letter, playerRack); 
      }
      selectedTile = null;
    }
  } else if (selectedCell) {
    const row = selectedCell.row;
    const col = selectedCell.col;
    if (playerLetters.includes(key)) {
      // aggiungo lettera alla cella se non è occupata
      if (!boardState[row][col]) {
        boardState[row][col] = key;
        updateCellDisplay(selectedCell.cell, key);

        const letterIndex = playerLetters.indexOf(key);
        if (letterIndex !== -1) {
          playerLetters.splice(letterIndex, 1);
          
          
          const tile = createLetterTile(key);
          tile.position.set(
            col * (tileSize + 0.1) - (boardSize * (tileSize + 0.1)) / 2,
            tileHeight / 2,
            row * (tileSize + 0.1) - (boardSize * (tileSize + 0.1)) / 2
          );
          
          //ombre
          tile.castShadow = true; 
          tile.receiveShadow = true; 

          scene.add(tile); 
        }
        selectedCell = null;
      }
    }
  }
}
document.addEventListener('keydown', onDocumentKeyDown); //association function-key pression

//remove only the letter not the color of the cell
function removeLetterFromCell(tile) {
  if (tile.userData && tile.userData.letter) {
    const cell = tile.userData.cell;
    const letter = tile.userData.letter;
    console.log(`Rimozione della tessera: lettera ${letter}`);
    scene.remove(tile); //rimuove tassello 3D

    if (tile.geometry) {
      tile.geometry.dispose();
    }
    if (tile.material) {
      if (Array.isArray(tile.material)) {
        tile.material.forEach(material => {
          if (material.map && typeof material.map.dispose === 'function') {
            material.map.dispose();
          }
          material.dispose();
        });
      } else {
        //se c'è un solo materiale
        if (tile.material.map && typeof tile.material.map.dispose === 'function') {
          tile.material.map.dispose(); 
        }
        tile.material.dispose();
      }
    }
    cell.userData.letter = null;
    boardState[cell.userData.row][cell.userData.col] = null; //resetto stato della cella
  } else {
    console.log('nessuna tessera da rimuovere in questa cella');
  }
}


//update with letter 3D
function updateCellDisplay(cell, letter) {
  console.log(`Aggiornamento cella con lettera: ${letter}`);
  const existingLetter = cell.userData.letter;
  const letterTile = createLetterTile(letter);
  letterTile.position.set(cell.position.x, cell.position.y + 0.80, cell.position.z); //tassello sopra la cella
  letterTile.userData.cell = cell; //salvataggio cella a cui appartiene
  scene.add(letterTile);
  cell.userData.letter = letterTile;
  cell.userData.letter = letterTile; 
  renderer.render(scene, camera);
}


//adapts the 3D scene to the browser window
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = frustumSize * aspect / -2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//table letterpoints
const letterPoints = {
  'A': 1, 'B': 1, 'C': 1, 'D': 1, 'E': 1,
  'F': 1, 'G': 1, 'H': 2, 'I': 1, 'J': 1,
  'K': 2, 'L': 1, 'M': 1, 'N': 1, 'O': 1,
  'P': 1, 'Q': 1, 'R': 1, 'S': 1, 'T': 2,
  'U': 2, 'V': 1, 'W': 3, 'X': 4, 'Y': 3, 'Z': 4,
};

function populatePointsTable() {
  const tableBody = document.getElementById('points-table-body');
  if (!tableBody) {
    console.error("Element with id 'points-table-body' not found.");
    return;
  }
  const letters = Object.keys(letterPoints);
  const midpoint = Math.ceil(letters.length / 2);

  for (let i = 0; i < midpoint; i++) {
    const row = document.createElement('tr');
    const letterCell1 = document.createElement('td');
    const pointsCell1 = document.createElement('td');
    const letterCell2 = document.createElement('td');
    const pointsCell2 = document.createElement('td');

    letterCell1.textContent = letters[i];
    pointsCell1.textContent = letterPoints[letters[i]];

    if (letters[midpoint + i]) {
      letterCell2.textContent = letters[midpoint + i];
      pointsCell2.textContent = letterPoints[letters[midpoint + i]];
    }
    row.appendChild(letterCell1);
    row.appendChild(pointsCell1);
    row.appendChild(letterCell2);
    row.appendChild(pointsCell2);
    tableBody.appendChild(row);
  }
}
populatePointsTable();


//create random set of letters
function getRandomLetters(num) {
  const shuffled = allLetters.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}
//give letters to the player
const player1Letters = getRandomLetters(10);
const player2Letters = getRandomLetters(10);


player1Letters.forEach((letter, index) => {
  const letterTile = createLetterTile(letter);
  positionLetterOnRack(letterTile, player1Rack, index);
});

player2Letters.forEach((letter, index) => {
  const letterTile = createLetterTile(letter);
  positionLetterOnRack(letterTile, player2Rack, index);
});


let rackTiles = [];

//visualizzazione delle lettere sugli espositori
function updateRackDisplay(rack, playerLetters) {
  
  //aggiunta lettere aggiornate al rack
  playerLetters.forEach((letter, index) => {
    const letterTile = createLetterTile(letter);
    positionLetterOnRack(letterTile, rack, index);
    rackTiles.push(letterTile); 
    console.log('Aggiungo tassello:', letter);
  });

  console.log('Rack aggiornato con le lettere:', playerLetters);
  renderer.render(scene, camera);
}



//timer and round
let currentRound = 1;
let player1Time = 90; 
let player2Time = 90; 
let currentPlayer = 1;
let timerInterval;
//html
const roundDisplay = document.getElementById('round-display');
const player1TimerDisplay = document.getElementById('player1-timer');
const player2TimerDisplay = document.getElementById('player2-timer');
const startButton = document.getElementById('start-button');

//start game 
window.startGame = function () {
  console.log("Game started");

  //per chiedere casata ai giocatori, legato all'html
  let player1House = prompt("Player 1: Choose your house (Gryffindor, Slytherin, Ravenclaw, Hupplepuff):");
  player1House = player1House ? player1House.trim().toLowerCase() : 'gryffindor';
  document.getElementById('player1-name-display').dataset.house = player1House;

  let player2House = prompt("Player 2: Choose your house (Gryffindor, Slytherin, Ravenclaw, Hupplepuff):");
  player2House = player2House ? player2House.trim().toLowerCase() : 'gryffindor';
  document.getElementById('player2-name-display').dataset.house = player2House;
  setPlayerHouse('player1', player1House);
  setPlayerHouse('player2', player2House);
  document.getElementById('start-button').disabled = true;
  player1Time = 90;
  player2Time = 90;
  updateDisplays();
  startTimer();

  //file audio
  const harryPotterSound = document.getElementById('harry-potter-sound');
  harryPotterSound.play().catch(error => {
    console.error('Error playing sound:', error);
  });
}

//per il pulsante start, e abilitare il click
document.addEventListener('DOMContentLoaded', (event) => {
  const startButton = document.getElementById('start-button');
  startButton.addEventListener('click', startGame);
});
document.addEventListener('click', onCellClick, false);


//avviare il timer
function startTimer() {
  clearInterval(timerInterval); 
  timerInterval = setInterval(() => {
    if (currentPlayer === 1) {
      player1Time--;
      if (player1Time <= 0) {
        clearInterval(timerInterval);
        switchPlayer();
      }
    } else {
      player2Time--;
      if (player2Time <= 0) {
        clearInterval(timerInterval);
        switchPlayer();
      }
    }
    updateDisplays();
  }, 1000);
}


//per passare al prossimo giocatore o al prossimo round
function switchPlayer() {
  clearInterval(timerInterval); // ferma(pulisce) il timer corrente

  if (currentPlayer === 1) {
    currentPlayer = 2; 
  } else {
    currentPlayer = 1; 
    currentRound++;
    if (currentRound > 3) { 
      endGame();
      return;
    }
    endRound();
    return;
  }
  updateDisplays();
  startTimer(); //inizia il timer del prossimo giocatore
}

//legato all'html
function updateDisplays() {
  const player1Name = document.getElementById('player1-name').innerText;
  const player2Name = document.getElementById('player2-name').innerText;
  roundDisplay.innerText = `Round: ${currentRound}`;
  player1TimerDisplay.innerText = `${player1Name} Timer: ${player1Time}`;
  player2TimerDisplay.innerText = `${player2Name} Timer: ${player2Time}`;
}

//termine round e iniziare il prossimo
function endRound() {
  clearInterval(timerInterval); 
  currentPlayer = 1;
  player1Time = 90;
  player2Time = 90;
  player1Letters = getRandomLetters(10);
  player2Letters = getRandomLetters(10);
  updateRackDisplay(player1Rack, player1Letters);
  updateRackDisplay(player2Rack, player2Letters);
  updateDisplays();
  startTimer(); 
}
//per lettera della casata
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function endGame() {
  clearInterval(timerInterval);
  //punteggi dei giocatori
  const player1Score = parseInt(document.getElementById('player1-score').innerText, 10);
  const player2Score = parseInt(document.getElementById('player2-score').innerText, 10);

  //vincitore
  let winnerMessage;
  if (player1Score > player2Score) {
    const player1Name = document.getElementById('player1-name').innerText;
    const player1House = document.getElementById('player1-name-display').dataset.house;
    winnerMessage = `The Winner is Player 1: ${player1Name}\n"100 points to ${capitalizeFirstLetter(player1House)}!" - Albus Dumbledore`;
  } else if (player2Score > player1Score) {
    const player2Name = document.getElementById('player2-name').innerText;
    const player2House = document.getElementById('player2-name-display').dataset.house;
    winnerMessage = `The Winner is Player 2: ${player2Name}\n"100 points to ${capitalizeFirstLetter(player2House)}!" - Albus Dumbledore`;
  } else {
    winnerMessage = "It's a Tie!";
  }
  alert(winnerMessage);
 
  startButton.disabled = false;
  currentRound = 1;
  player1Time = 90;
  player2Time = 90;
  currentPlayer = 1;
  updateDisplays();
}


window.changePlayerName = function (tableId, displayId) {
  const playerName = prompt(`Insert name of ${tableId.includes('player1') ? 'Player 1' : 'Player 2'}`);
  if (playerName) {
    const upperPlayerName = playerName.toUpperCase();

    const tableElement = document.getElementById(tableId);
    const displayElement = document.getElementById(displayId);
    if (tableElement && displayElement) {
      tableElement.innerText = upperPlayerName;
      displayElement.innerText = upperPlayerName;

      //cambia il colore in base alla casata di appartenenza
      if (tableId.includes('player1')) {
        const house = getCurrentPlayerHouse('player1');
        const color = getHouseColor(house);
        updatePlayerNameMesh(player1NameMesh, upperPlayerName, color);
      } else {
        const house = getCurrentPlayerHouse('player2'); 
        const color = getHouseColor(house);
        updatePlayerNameMesh(player2NameMesh, upperPlayerName, color);
      }

      updateDisplays();
    } else {
      console.error('Elements not found:', tableId, displayId);
    }
  }
}


function getHouseColor(house) {
  if (!house) {
    return 0x000000; //default color nero se la casata non è definita
  }
  
  switch (house.toLowerCase()) {
    case 'gryffindor':
      return 0xff0000; //rosso
    case 'hufflepuff':
      return 0xffff00; //giallo
    case 'ravenclaw':
      return 0x0000ff; //blu
    case 'slytherin':
      return 0x00ff00; //verde
    
  }
}
updateDisplays();


//colore casata Hogwarts
function setPlayerHouse(playerId, house) {
  let color = getHouseColor(house);

  if (playerId === 'player1') {
    if (player1NameMesh) {
      const playerName = document.getElementById('player1-name').innerText;
      updatePlayerNameMesh(player1NameMesh, playerName, color);
    }
  } else if (playerId === 'player2') {
    if (player2NameMesh) {
      const playerName = document.getElementById('player2-name').innerText;
      updatePlayerNameMesh(player2NameMesh, playerName, color);
    }
  }
}




//stile del tabellone
const colors = {
  G: 0xff0000, // Gryffindor (red)
  S: 0x00ff00, // Slytherin (green)
  H: 0xffff00, // Hupplepuff (yellow)
  R: 0x0000ff, // Ravenclaw (blue)
  B: 0xffffff, // Basic (white)
  Ho: 0xFF00FF, // Hogwarts (fucsia)
};
//array per creazione delle caselle del tabellone
const colorSchema = [
  ['G', 'B', 'B','B', 'G', 'B','R', 'Ho', 'H','B', 'S', 'B','B', 'B', 'S'],
  ['B', 'S', 'B','S', 'B', 'Ho','B', 'B', 'B','G', 'B','Ho','B', 'H', 'B'],
  ['B', 'B', 'H','B', 'B', 'S','B', 'Ho', 'B','G', 'B', 'B','R', 'B', 'S'],
  ['B', 'S', 'B','R', 'B', 'Ho','B', 'Ho', 'B','Ho', 'B', 'G','B', 'Ho', 'B'], 
  ['G', 'B', 'B','B', 'G', 'B','Ho', 'B', 'Ho','B', 'S', 'B','B', 'B', 'S'],
  ['B', 'R', 'R','Ho', 'B', 'G','B', 'Ho', 'B','S', 'B', 'Ho','H', 'H', 'B'],
  ['S', 'B', 'B','B', 'Ho', 'B','S', 'B', 'H','B', 'Ho', 'B','B', 'B', 'G'],
  ['Ho', 'B', 'Ho','Ho', 'B', 'Ho','B', 'Ho', 'B','Ho', 'B', 'Ho','Ho', 'B', 'Ho'],
  ['H', 'B', 'B','B', 'Ho', 'B','G', 'B', 'R','B', 'Ho', 'B','B', 'B', 'R'],
  ['B', 'G', 'G','Ho', 'B', 'R','B', 'Ho', 'B','H', 'B', 'Ho','S', 'S', 'B'],
  ['R', 'B', 'B','B', 'R', 'B','Ho', 'B', 'Ho','B', 'H', 'B','B', 'B', 'H'],
  ['B', 'Ho', 'B','H', 'B', 'Ho','B', 'Ho', 'B','Ho', 'B', 'S','B', 'Ho', 'B'],
  ['B', 'B', 'S','B', 'B', 'H','B', 'Ho', 'B','R', 'B', 'B','G', 'B', 'B'],
  ['B', 'G', 'B','Ho', 'B', 'H','B', 'B', 'B','R', 'B', 'Ho','B', 'R', 'B'],	
  ['R', 'B', 'B','B', 'R', 'B','G', 'Ho', 'S','B', 'H', 'B','B', 'B', 'H'],
  
];

//luce direzionale aggiuntiva dal basso (per illuminare il tabellone da sotto)
const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5);
bottomLight.position.set(0, -20, 0); 
bottomLight.target.position.set(0, 0, 0); //direzionamento verso il centro
scene.add(bottomLight);
scene.add(bottomLight.target);

//tabellone in 3D
function createBoard() {
  const boardSize = 15;
  const cellSize = 1;
  const cellHeight = 1; //altezza celle per 3D
  const board = [];
  const gridHelper = new THREE.Group();

  for (let i = 0; i < boardSize; i++) {
    const row = [];
    for (let j = 0; j < boardSize; j++) {
      //BoxGeometry per creare celle 3D
      const cellGeometry = new THREE.BoxGeometry(cellSize, cellHeight, cellSize);
      const cellMaterial = new THREE.MeshStandardMaterial({
        //color: 0x808080,
        roughness: 0.5, // proprietà di illuminazione per la rugosità
        metalness: 0.5  // proprietà di illuminazione per la metallicità
      });
      const cell = new THREE.Mesh(cellGeometry, cellMaterial);

      //posizionamento
      cell.position.set(j * cellSize - (boardSize * cellSize) / 2, cellHeight / 2, i * cellSize - (boardSize * cellSize) / 2);
      cell.castShadow = true;
      cell.receiveShadow = true;

      //dati della cella per riconoscere la selezione e memorizzare le lettere
      cell.userData = {
        isCell: true,
        row: i,
        col: j,
        letter: null
      };

      //imposta colore della cella
      const colorKey = colorSchema[i][j];
      cellMaterial.color.set(colors[colorKey]);

      scene.add(cell);
      row.push(cell);

      //bordi alle celle
      const edges = new THREE.EdgesGeometry(cellGeometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
      line.position.copy(cell.position);
      gridHelper.add(line);
    }
    board.push(row);
  }
  scene.add(gridHelper);
}

createBoard();



//caricamento dizionario per check delle parole
let validWords = [];
//dizionario generale
fetch('/src/Dictionary.txt')
  .then(response => response.text())
  .then(text => {
    validWords = text.split('\n').map(word => word.trim().toUpperCase());
    console.log('Dictionary loaded:', validWords); 
  })
  .catch(error => {
    console.error('Error loading dictionary:', error);
  });

//dizionario Harry potter
let hpWords = [];

fetch('/src/HPwords.txt')
  .then(response => response.text())
  .then(text => {
    hpWords = text.split('\n').map(word => word.trim().toUpperCase());
    console.log('Harry Potter words loaded:', hpWords); // Debug
  })
  .catch(error => {
    console.error('Error loading Harry Potter words:', error);
  });

// check from dictionaries
function isValidWord(word) {
  return validWords.includes(word) || hpWords.includes(word);
}


let previousTotalScore = 0;
let saveRoundScore1 = 0

//logica del pulsante ok 
document.getElementById('ok-button').addEventListener('click', onOkButtonClick);

function onOkButtonClick() {
  clearInterval(timerInterval); 
  validateCurrentWord(); //check 
  //aggiornamento dei punteggi 
  if (currentPlayer === 1) {
    let effectivePlayer1RoundScore = player1RoundScore;
    if (currentRound > 1) {
      effectivePlayer1RoundScore -= previousTotalScore;
    }
    player1Score += effectivePlayer1RoundScore;
    console.log(`Player 1 total score: ${player1Score}`);
    saveRoundScore1 = player1RoundScore
    player1RoundScore = 0;

    currentPlayer = 2;
    player1Time = 90; 
    startTimer(); 
  } else {
    let effectivePlayer2RoundScore = player2RoundScore - saveRoundScore1;
    if (currentRound > 1) {
      effectivePlayer2RoundScore -= previousTotalScore;
    }
    player2Score += effectivePlayer2RoundScore;
    console.log(`Player 2 total score: ${player2Score}`);
    
    player2RoundScore = 0;
    saveRoundScore1 = 0;

    if (currentRound === 3) { 
      endGame(); 
      return;
    } else {
      currentPlayer = 1; 
      player2Time = 90; 
      currentRound++;
      previousTotalScore = player1Score + player2Score;
      updatePlayerLetters(); 
      startTimer(); 
    }
  }
  updateScoreDisplay();
  updateDisplays();
}
function updatePlayerLetters() {
  player1Letters = getRandomLetters(10);
  player2Letters = getRandomLetters(10);
  updateLettersDisplay(player1Letters, player1LettersDisplay);
  updateLettersDisplay(player2Letters, player2LettersDisplay);
}


//logic of the pass button
document.getElementById('pass-button').addEventListener('click', onPassButtonClick);

function onPassButtonClick() {
  clearInterval(timerInterval); 
  console.log(`Player ${currentPlayer} pressed Pass`);

  if (currentPlayer === 1) {
    //player 1 pass turn, no score added
    player1RoundScore = 0;
    currentPlayer = 2; 
    player1Time = 90; 
    startTimer(); 
  } else {
    //player 2 pass
    player2RoundScore = 0;

    if (currentRound === 3) { 
      endGame(); 
      return;
    } else {
      currentPlayer = 1; 
      player2Time = 90; 
      currentRound++;
      startTimer(); 
    }
  }
  updateScoreDisplay();
  updateDisplays();
}

//several functions for check,extract and evaluate the words
let player1RoundScore = 0;
let player2RoundScore = 0;
let player1Score = 0;
let player2Score = 0;

//analise the word create on the game board
function validateCurrentWord() {
  const newWords = extractWordsFromBoard(); 
  let roundScore = 0;

  newWords.forEach(word => {
    const positions = getLetterPositions(word);
    if (isValidWord(word)) {
      const score = calculateWordScore(word, positions, getCurrentPlayerHouse());
      roundScore += score;
      console.log(`Valid word: ${word}, score: ${score}`);
      // Genera bolle se la parola è un incantesimo
      if (spells.includes(word)) {
        generateSpellBubbles(getCurrentPlayerHouse());
      }
    } else {
      console.log(`Invalid word: ${word}`);
    }
  });

  if (currentPlayer === 1) {
    player1RoundScore = roundScore;
    console.log(`Player 1 round score: ${player1RoundScore}`);
  } else {
    player2RoundScore = roundScore;
    console.log(`Player 2 round score: ${player2RoundScore}`);
  }
}

//extract the word  from the grid
function extractWordsFromBoard() {
  const words = [];
  const size = boardState.length;
  //horizontal
  for (let row = 0; row < size; row++) {
    let word = '';
    for (let col = 0; col < size; col++) {
      if (boardState[row][col]) {
        word += boardState[row][col];
      } else {
        if (word.length > 1) words.push(word);
        word = '';
      }
    }
    if (word.length > 1) words.push(word);
  }
  //verticals
  for (let col = 0; col < size; col++) {
    let word = '';
    for (let row = 0; row < size; row++) {
      if (boardState[row][col]) {
        word += boardState[row][col];
      } else {
        if (word.length > 1) words.push(word);
        word = '';
      }
    }
    if (word.length > 1) words.push(word);
  }
  return words;
}
//searches word on the board and returns array of coordinates (positions) for each letter of the word found
function getLetterPositions(word) {
  const positions = [];
  const size = boardState.length;
  // horizontals
  for (let row = 0; row < size; row++) {
    let currentWord = '';
    let startCol = null;
    for (let col = 0; col < size; col++) {
      if (boardState[row][col]) {
        if (currentWord === '') startCol = col;
        currentWord += boardState[row][col];
      } else {
        if (currentWord === word) {
          for (let i = 0; i < word.length; i++) {
            positions.push([row, startCol + i]);
          }
          return positions;
        }
        currentWord = '';
      }
    }
    if (currentWord === word) {
      for (let i = 0; i < word.length; i++) {
        positions.push([row, startCol + i]);
      }
      return positions;
    }
  }
  //vertcials
  for (let col = 0; col < size; col++) {
    let currentWord = '';
    let startRow = null;
    for (let row = 0; row < size; row++) {
      if (boardState[row][col]) {
        if (currentWord === '') startRow = row;
        currentWord += boardState[row][col];
      } else {
        if (currentWord === word) {
          for (let i = 0; i < word.length; i++) {
            positions.push([startRow + i, col]);
          }
          return positions;
        }
        currentWord = '';
      }
    }
    if (currentWord === word) {
      for (let i = 0; i < word.length; i++) {
        positions.push([startRow + i, col]);
      }
      return positions;
    }
  }

  return positions;
}


// make possibile the click on the cell
function onCellClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const intersectedObject = intersects[i].object;

    if (intersectedObject.userData && intersectedObject.userData.isCell) {
      // Seleziona la cella
      selectedCell = {
        cell: intersectedObject,
        row: intersectedObject.userData.row,
        col: intersectedObject.userData.col
      };
      console.log(`Cella selezionata: riga ${selectedCell.row}, colonna ${selectedCell.col}`);
      
      return;
    }
  }
}
//document.addEventListener('click', onCellClick, false);

//click per i tasselli 
function onTileClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    const intersectedObject = intersects[i].object;

    if (intersectedObject.userData && intersectedObject.userData.isTile) {
      // Seleziona il tassello e rimuovilo
      selectedTile = intersectedObject;
      console.log(`Tassello selezionato: lettera ${intersectedObject.userData.letter}`);
      return;
    }
  }
}
//document.addEventListener('click', onTileClick, false);

//listener separati per celle e tasselli 
document.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let isTileClick = false;

  for (let i = 0; i < intersects.length; i++) {
    const intersectedObject = intersects[i].object;

    //verifica se l'oggetto ha un materiale
    if (intersectedObject.material) {
      //più materiali
      if (Array.isArray(intersectedObject.material)) {
        for (let j = 0; j < intersectedObject.material.length; j++) {
          if (intersectedObject.material[j].map && intersectedObject.material[j].color.getHex() === 0xffffff) {
            onTileClick(event);
            isTileClick = true;
            break;
          }
        }
      } else {
        //solo uno
        if (intersectedObject.material.map && intersectedObject.material.color.getHex() === 0xffffff) {
          onTileClick(event);
          isTileClick = true;
          break;
        }
      }
    }
  }

  if (!isTileClick) {
    onCellClick(event);
  }
}, false);


//calcoli per i punteggi e bonus
const colorBonus = {
  'G': 2, // bonus Gryffindor
  'S': 2, // bonus Slytherin
  'R': 2, // bonus Ravenclaw
  'H': 2, // bonus Hupplepuff
  'Ho': 2 // bonus per tutte le casate
};

const houseColors = {
  'gryffindor': 'G',
  'slytherin': 'S',
  'ravenclaw': 'R',
  'hupplepuff': 'H'
};

//funzioni per calcolo punteggio 
function calculateWordScore(word, positions, playerHouse) {
  let score = 0;

  //punteggio per ogni lettera
  for (let i = 0; i < word.length; i++) {
    let letter = word[i];
    let position = positions[i];
    let baseScore = letterPoints[letter] || 0;
    
    //bonus casella
    let cellColor = getCellColor(position);
    let bonus = 1;
    if (cellColor === 'Ho') {
      bonus = colorBonus['Ho'];
    } else if (cellColor === houseColors[playerHouse]) {
      bonus = colorBonus[cellColor];
    }
    //bonus per parole di HP
    if (hpWords.includes(word)) {
      score += 3; 
    }
    console.log(`Letter: ${letter}, Base score: ${baseScore}, Cell color: ${cellColor}, Bonus: ${bonus}`); 
    score += baseScore * bonus; //la singola lettera viene moltiplicata per il bonus della casella
  }
  // lunghezza della parola
  if (word.length === 2) {
    score += 3;
  } else if (word.length >= 3 && word.length <= 4) {
    score += 5;
  } else if (word.length >= 5 && word.length <= 6) {
    score += 8;
  } else if (word.length > 6) {
    score += 10;
  }
  console.log(`Total score for word "${word}": ${score}`);
  return score;
}
function updateScoreDisplay() {
  document.getElementById('player1-score').innerText = player1Score;
  document.getElementById('player2-score').innerText = player2Score;
}

//restituisce colore della specifica cella 
function getCellColor(position) {
  const row = position[0];
  const col = position[1];
  return colorSchema[row][col];
}

//per ottenere la casata del giocatore corrente
function getCurrentPlayerHouse(playerId) {
  if (playerId === 'player1') {
    return document.getElementById('player1-name-display').dataset.house;
  } else if (playerId === 'player2') {
    return document.getElementById('player2-name-display').dataset.house;
  } else {
    return undefined; // Se il giocatore non è definito
  }
}

//implementazione pulsanti help 
let player1HelpUsed = 0;
let player2HelpUsed = 0;
const maxHelps = 2;

// logica per gesture clic del pulsante help
document.getElementById('player1-help').addEventListener('click', () => {
  if (player1HelpUsed < maxHelps) {
    const letter = prompt("Player 1, enter a letter:");
    if (letter && letter.length === 1 && /[A-Z]/i.test(letter)) {
      player1Letters.push(letter.toUpperCase());
      updateRackDisplay(player1Rack, player1Letters);
      player1HelpUsed++;
      if (player1HelpUsed >= maxHelps) {
        document.getElementById('player1-help').disabled = true;
      }
    }
  }
});
//player2
document.getElementById('player2-help').addEventListener('click', () => {
  if (player2HelpUsed < maxHelps) {
    const letter = prompt("Player 2, enter a letter:");
    if (letter && letter.length === 1 && /[A-Z]/i.test(letter)) {
      player2Letters.push(letter.toUpperCase());
      updateRackDisplay(player2Rack, player2Letters);
      player2HelpUsed++;
      if (player2HelpUsed >= maxHelps) {
        document.getElementById('player2-help').disabled = true;
      }
    }
  }
});


// caricamento regolamento gioco
function loadRules() {
  fetch('/src/Rules.txt')
    .then(response => response.text())
    .then(text => {
      document.getElementById('rules-content').innerText = text;
      openModal();
    })
    .catch(error => {
      console.error('error loading rules:', error);
    });
}

//per il pop up delle rules 
function openModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'block';
}

//per chiudere il pop up 
function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
}

//event listener per aprire e chiudere il pulsante info 
document.getElementById('info-button').addEventListener('click', loadRules);
document.querySelector('.close-button').addEventListener('click', closeModal);

//se clicco fuori si chiude il pop up 
window.addEventListener('click', function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    closeModal();
  }
});

//nuove funzionalità 

const spells = ["NOX", "LUMOS","ACCIO", "FINITE", "EXPECTO", "PATRONUM"];

//texture degli stemmi delle casate
const houseTextures = {
  "GRYFFINDOR": "/src/textures/gryffindor.png",
  "SLYTHERIN": "/src/textures/slytherin.png",
  "RAVENCLAW": "/src/textures/ravenclaw.png",
  "HUPPLEPUFF": "/src/textures/hupplepuff.png"
};

// Cannon.js = libreria fisica 
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Imposta la gravità


//ombre per il terreno
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.7 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.5; 
ground.receiveShadow = true;
scene.add(ground);

//creazione terreno fisico
function createGround() {
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.position.set(0, 1, 0); //prima era 0.5
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);
  
}
createGround();

//funzione per generare bolle quando una parola magica viene formata
function generateSpellBubbles(playerHouse) {
  const bubbleRadius = 1; 
  const startY = 10; 
  const loader = new THREE.TextureLoader();
  const houses = Object.keys(houseTextures);

  houses.forEach((house) => {
    const texture = loader.load(houseTextures[house]);
    const bubbleGeometry = new THREE.SphereGeometry(bubbleRadius, 32, 32);
    const bubbleMaterial = new THREE.MeshStandardMaterial({ map: texture }); 

    //numero di bolle 
    const numBubbles = 3;
    
    for (let i = 0; i < numBubbles; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.castShadow = true;
      //posiziona le bolle in posizioni casuali sopra il tabellone
      const posX = (Math.random() - 0.5) * 15;
      const posZ = (Math.random() - 0.5) * 15;
      bubble.position.set(posX, startY + i * 2, posZ);
      bubble.userData = { house, playerHouse };
      scene.add(bubble);

    //corpo fisico per la bolla (utilizzo libreria cannon)
    const bubbleShape = new CANNON.Sphere(bubbleRadius);
    const bubbleBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(bubble.position.x, bubble.position.y, bubble.position.z),
      material: new CANNON.Material({ restitution: 0.9 }) //imposta il rimbalzo
    });
    bubbleBody.addShape(bubbleShape);
    world.addBody(bubbleBody);
   
    bubble.userData.body = bubbleBody;

    //animazione caduta bolle
    function animateBubble() {
      requestAnimationFrame(animateBubble);
      //posizione del mesh in base al corpo fisico
      bubble.position.copy(bubbleBody.position);
      bubble.quaternion.copy(bubbleBody.quaternion);
      if (bubble.position.y < -10) {
        scene.remove(bubble);
        world.removeBody(bubbleBody);
      }
    }
    animateBubble();
  }
});
}

//funzione per rimuovere alcune bolle in maniera casuale
function removeRandomBubbles() {
  const bubbles = scene.children.filter(child => child.userData && child.userData.house);
  const numberOfBubblesToRemove = Math.floor(Math.random() * (bubbles.length - 1)) + 1;

  for (let i = 0; i < numberOfBubblesToRemove; i++) {
    const bubble = bubbles[i];
    scene.remove(bubble);
    if (bubble.userData.body) {
      world.removeBody(bubble.userData.body);
    }
  }
}

//click sulle sfere
window.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    if (intersectedObject.userData && intersectedObject.userData.house) {
      const house = intersectedObject.userData.house;
      const currentPlayerHouse = getCurrentPlayerHouse();
      let points = house.toLowerCase() === currentPlayerHouse ? Math.floor(Math.random() * 9) + 3 : Math.floor(Math.random() * 3) + 2;

      if (house.toLowerCase() === getCurrentPlayerHouse())  {
        console.log(`Player clicked on their own house: ${house}. Gained ${points} points!`);
        //aggiungo punti al giocatore
        if (currentPlayer === 1) {
          player1Score += points;
          updateScoreDisplay(1, player1Score);
        } else {
          player2Score += points;
          updateScoreDisplay(2, player2Score);
        }
      } else {
        console.log(`Player clicked on a different house: ${house}. Lost ${points} points!`);
        //sottraggo
        if (currentPlayer === 1) {
          player1Score -= points;
          updateScoreDisplay(1, player1Score);
        } else {
          player2Score -= points;
          updateScoreDisplay(2, player2Score);
        }
      }
      removeRandomBubbles();
    }
  }
});

//for update and re design the 3D scene
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  world.step(1 / 60); //update cannon.js
  renderer.render(scene, camera); 
}
animate();


//nomi dei giocatori in 3D
let player1NameMesh, player2NameMesh;
//creazione testo 3D
function createPlayerNameMesh(name, position, color) {
  if (!loadedFont) {
    console.error('Font not loaded yet');
    return null;
  }
  const textGeometry = new TextGeometry(name, {
    font: loadedFont,
    size: 1,
    depth: 0.2, // Usa depth invece di height
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5
  });

  const textMaterial = new THREE.MeshStandardMaterial({ color: color });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

  textMesh.position.set(position.x + centerOffset, position.y, position.z);
  textMesh.castShadow = true;
  textMesh.receiveShadow = true;
  return textMesh;
}


function updatePlayerNameMesh(playerMesh, newName, color) {
  if (!loadedFont) {
    console.error('font not loaded');
    return;
  }

  if (!newName) {
    console.error('name is undefined or null');
    return;
  }

  const textGeometry = new TextGeometry(newName, {
    font: loadedFont,
    size: 1,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5
  });

  textGeometry.computeBoundingBox();
  const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

  playerMesh.geometry.dispose();
  playerMesh.geometry = textGeometry;
  playerMesh.position.x = centerOffset; // per la posizione
  playerMesh.material.color.set(color); //cambio il colore
  playerMesh.material.needsUpdate = true;
}

//clic per i nomi dei giocatori
window.addEventListener('click', function (event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    if (intersectedObject === player1NameMesh) {
      changePlayerName('player1-name', 'player1-name-display');
    } else if (intersectedObject === player2NameMesh) {
      changePlayerName('player2-name', 'player2-name-display');
    }
  }
});




