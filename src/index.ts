interface Cell {
  isOpen: boolean;
  isFlagged: boolean;
  hasMine: boolean;
  neighborMineCount: number;
}

function newCell(): Cell {
  return {
    isOpen: false,
    isFlagged: false,
    hasMine: false,
    neighborMineCount: 0
  };
}


interface Board {
  rows: number;
  cols: number;
  mineCount: number;
  cells: Cell[]; // a flattened 2d array
}


function placeMines(board: Board) {
  for (let i = 0; i < board.mineCount; i++) {
    board.cells[i].hasMine = true;
  }
}

// fisher-yates shuffle
function shuffle<T>(arr: T[]) {
  let n = arr.length;
  let temp;
  while (n) { // while there remain elements to shuffle...
    const i = Math.floor(Math.random() * n--); // pick a remaining element...
    temp = arr[n]; // ...and swap it with the current element.
    arr[n] = arr[i];
    arr[i] = temp;
  }
  return arr;
}

function getIndex(board: Board, row: number, col: number) {
  return (board.cols * row) + col;
}

type Coords = [number, number];

function getCoords(board: Board, index: number): Coords {
  const row = Math.trunc(index / board.cols);
  const col = index % board.cols;
  return [row, col];
}


function log(board: Board) {
  console.log('-'.repeat(board.cols));
  let rowStr = ''
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i];
    rowStr += cell.hasMine ? '*' : cell.neighborMineCount;
    const [row, col] = getCoords(board, i);
    if (col === board.cols - 1) {
      console.log(rowStr)
      rowStr = '';
    }
  }
  console.log('-'.repeat(board.cols));
}

function isInBounds(row: number, col: number, board: Board) {
  if (row < 0 || col < 0) return false;
  if (row >= board.rows || col >= board.cols) return false;
  return true;
}

function getNeighbors(board: Board, index: number) {
  const [row, col] = getCoords(board, index);
  const neighbors: Coords[] = [
    [row - 1, col - 1],
    [row - 1, col],
    [row - 1, col + 1],
    [row, col - 1],
    [row, col + 1],
    [row + 1, col - 1],
    [row + 1, col],
    [row + 1, col + 1]
  ];
  return neighbors
    .filter(([x, y]) => isInBounds(x, y, board))
    .map(([x, y]) => getIndex(board, x, y));
}

function countMines(board: Board) {
  for (let i = 0; i < board.cells.length; i++) {
    const neighbors = getNeighbors(board, i);
    let mineCount = 0;
    for (const index of neighbors) {
      if (board.cells[index].hasMine) mineCount++;
    }
    board.cells[i].neighborMineCount = mineCount;
  }
}

function makeBoard(rows: number, cols: number, mineCount: number) {
  const board: Board = {
    rows,
    cols,
    mineCount,
    cells: (new Array(rows * cols))
  };

  for (let i = 0; i < rows * cols; i++) {
    board.cells[i] = newCell();
  }
  placeMines(board);
  shuffle(board.cells);
  countMines(board);
  // log(board);
  return board;
}

const neighborCountColors = ['#777', '#008100', '#ff1300', '#000083', '#810500', '#2a9494', '#000'];

function makeCellElement() {
  const el = document.createElement('div');
  el.className = 'cell';
  return el;
}

let isNewGame = true;
let isGameOver = false;

function newGame(zoom: number) {
  isNewGame = true;
  isGameOver = false;
  const cellSize = Math.round(32 * zoom);
  const vMargin = 70;
  const hMargin = 40;
  const mineProportion = 0.15;
  const rows = Math.floor((window.innerHeight - vMargin) / cellSize);
  const cols = Math.floor((window.innerWidth - hMargin) / cellSize);
  const mines = Math.round(rows * cols * mineProportion);
  const board = makeBoard(rows, cols, mines);
  const parent = document.getElementById('board');
  if (!parent) throw new Error('Board element not found');
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  const elements = board.cells.map(() => makeCellElement());

  elements.forEach((el, i) => {
    const handleClick = (index: number) => {
      const cell = board.cells[index];
      if (isGameOver) return newGame(zoom);
      isNewGame = false;
      if (cell.isOpen) return;
      if (cell.hasMine) {
        isGameOver = true;
        for (let j = 0; j < board.cells.length; j++) {
          if (board.cells[j].hasMine) elements[j].classList.add('mine');
        }
      }
      else {
        cell.isOpen = true;
        elements[index].classList.add(`cell-${cell.neighborMineCount}`);
        if (cell.neighborMineCount === 0) {
          const neighbors = getNeighbors(board, index);
          for (const neighborIndex of neighbors) {
            if (!board.cells[neighborIndex].isOpen) handleClick(neighborIndex);
          }
        }
        let hiddenCount = 0;
        for (let j = 0; j < board.cells.length; j++) {
          if (!board.cells[j].isOpen) hiddenCount++;
        }
        if (hiddenCount === board.mineCount) {
          isGameOver = true;
          for (let j = 0; j < board.cells.length; j++) {
            if (!board.cells[j].isOpen) {
              elements[j].classList.add('flag');
            }
          }
        }
      }
    };

    el.onclick = () => handleClick(i);
  });

  for (let i = 0; i < elements.length; i++) {
    parent.appendChild(elements[i]);
    const [row, col] = getCoords(board, i);
    if (col === cols - 1) parent.appendChild(document.createElement('br'));
  }
}

let zoomLevel = parseFloat(localStorage.getItem('zoom') || '1');
const board = document.getElementById('board');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');

if (board && zoomIn && zoomOut) {
  board.style.zoom = zoomLevel.toString();
  zoomIn.onclick = () => {
    if (!isNewGame && !isGameOver) {
      if (!confirm('Changing zoom will reset the current game. Continue?')) return;
    }
    zoomLevel += 0.25;
    board.style.zoom = zoomLevel.toString();
    newGame(zoomLevel);
    localStorage.setItem('zoom', zoomLevel.toString());
  };
  zoomOut.onclick = () => {
    if (!isNewGame && !isGameOver) {
      if (!confirm('Changing zoom will reset the current game. Continue?')) return;
    }
    if (zoomLevel <= 0.25) return alert('Already at minimum zoom!');
    zoomLevel -= 0.25;
    board.style.zoom = zoomLevel.toString();
    newGame(zoomLevel);
    localStorage.setItem('zoom', zoomLevel.toString());
  };
}

newGame(zoomLevel);

