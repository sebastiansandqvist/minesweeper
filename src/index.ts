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
  cells: Cell[]; /** a flattened 2d array */
}


function placeMines(board: Board) {
  for (let i = 0; i < board.mineCount; i++) {
    board.cells[i].hasMine = true;
  }
}

/** fisher-yates shuffle */
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

/** given 2d coordinates, get the 1d equivalent */
function getIndex(board: Board, row: number, col: number) {
  return (board.cols * row) + col;
}

type Coords = [number, number];

/** given 1d coordinate (index), get 2d row/col */
function getCoords(board: Board, index: number): Coords {
  const row = Math.trunc(index / board.cols);
  const col = index % board.cols;
  return [row, col];
}


/*
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
*/

function isInBounds(row: number, col: number, board: Board) {
  if (row < 0 || col < 0) return false;
  if (row >= board.rows || col >= board.cols) return false;
  return true;
}

/**
  get 1d locations of every cell touching the cell at `index`,
  filtering out neighbors out of bounds
*/
function getNeighbors(board: Board, index: number) {
  const [row, col] = getCoords(board, index);
  const neighbors: Coords[] = [
    [row - 1, col - 1], [row - 1, col], [row - 1, col + 1],
    [row,     col - 1], /*  (self)   */ [row,     col + 1],
    [row + 1, col - 1], [row + 1, col], [row + 1, col + 1]
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
    cells: new Array(rows * cols)
  };

  for (let i = 0; i < rows * cols; i++) {
    board.cells[i] = newCell();
  }
  placeMines(board); // place mines on first `board.mineCount` cells in  order...
  shuffle(board.cells); // then shuffle the board
  countMines(board);
  // log(board);
  return board;
}

function makeCellElement() {
  const el = document.createElement('div');
  el.className = 'cell';
  return el;
}

function setZoomLevel() {
  const hZoom = (window.innerWidth / (board.clientWidth + H_MARGIN));
  const vZoom = (window.innerHeight / (board.clientHeight + V_MARGIN));
  board.style.zoom = Math.min(hZoom, vZoom).toString();
}

let isNewGame = true;
let isGameOver = false;

const V_MARGIN = 70;
const H_MARGIN = 40;
const MINE_PROPORTION = 0.15;

function newGame(rows: number, cols: number) {
  isNewGame = true;
  isGameOver = false;

  const mines = Math.round(rows * cols * MINE_PROPORTION);
  const board = makeBoard(rows, cols, mines);

  // clear the board element's contents on each new game
  const parent = document.getElementById('board');
  if (!parent) throw new Error('Board element not found');
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  const elements = board.cells.map(() => makeCellElement());

  elements.forEach((el, i) => {
    const handleClick = (index: number) => {
      const cell = board.cells[index];
      if (isGameOver) return newGame(rows, cols);
      isNewGame = false;
      if (cell.isOpen) return; // do nothing since cell was already clicked
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
            // when clicking on a cell with 0 neighboring mines,
            // recursively simulate a "click" on each neighboring cell that is not open
            if (!board.cells[neighborIndex].isOpen) handleClick(neighborIndex);
          }
        }
        // count the number of "hidden" (ie. not yet clicked) cells
        // if it's the same as the number of mines, trigger gameOver (win)
        let hiddenCount = 0;
        for (let j = 0; j < board.cells.length; j++) {
          if (!board.cells[j].isOpen) hiddenCount++;
        }
        if (hiddenCount === board.mineCount) {
          isGameOver = true;
          for (let j = 0; j < board.cells.length; j++) {
            if (!board.cells[j].isOpen) elements[j].classList.add('flag');
          }
        }
      }
    };

    el.onclick = () => handleClick(i);
  });

  // add elements to the board dom node, and add a <br> at the end of each row
  for (let i = 0; i < elements.length; i++) {
    parent.appendChild(elements[i]);
    const [row, col] = getCoords(board, i);
    if (col === cols - 1) parent.appendChild(document.createElement('br'));
  }

  setZoomLevel();
}


const board = document.getElementById('board') as HTMLDivElement;
const setRows = document.getElementById('set-rows') as HTMLButtonElement;
const setCols = document.getElementById('set-cols') as HTMLButtonElement;
const newGameButton = document.getElementById('new-game') as HTMLButtonElement;

const CELL_DEFAULT_SIZE = 32;
const size = {
  rows: Math.floor((window.innerHeight - V_MARGIN) / CELL_DEFAULT_SIZE),
  cols: Math.floor((window.innerWidth - H_MARGIN) / CELL_DEFAULT_SIZE)
};


newGameButton.onclick = () => {
  if (!isNewGame && !isGameOver) {
    if (!confirm('This will end the current game. Continue?')) return;
  }
  newGame(size.rows, size.cols);
};

/** set rows to be used for the *next* new game via input: */
setRows.oninput = () => {
  const n = parseInt(setRows.value, 10);
  if (n > 0) {
    size.rows = n;
  }
};

/** set cols to be used for the *next* new game via input: */
setCols.oninput = () => {
  const n = parseInt(setCols.value, 10);
  if (n > 0) {
    size.cols = n;
  }
};


window.addEventListener('resize', () => {
  setZoomLevel();
});

/** at startup, set row/col inputs' values and initialize a new game: */
(function init() {
  setRows.value = size.rows.toString();
  setCols.value = size.cols.toString();
  newGame(size.rows, size.cols);
})();

