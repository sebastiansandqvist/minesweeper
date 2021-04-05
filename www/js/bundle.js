(function () {
  'use strict';

  function newCell() {
      return {
          isOpen: false,
          isFlagged: false,
          hasMine: false,
          neighborMineCount: 0
      };
  }
  function placeMines(board) {
      for (var i = 0; i < board.mineCount; i++) {
          board.cells[i].hasMine = true;
      }
  }
  /** fisher-yates shuffle */
  function shuffle(arr) {
      var n = arr.length;
      var temp;
      while (n) { // while there remain elements to shuffle...
          var i = Math.floor(Math.random() * n--); // pick a remaining element...
          temp = arr[n]; // ...and swap it with the current element.
          arr[n] = arr[i];
          arr[i] = temp;
      }
      return arr;
  }
  /** given 2d coordinates, get the 1d equivalent */
  function getIndex(board, row, col) {
      return (board.cols * row) + col;
  }
  /** given 1d coordinate (index), get 2d row/col */
  function getCoords(board, index) {
      var row = Math.trunc(index / board.cols);
      var col = index % board.cols;
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
  function isInBounds(row, col, board) {
      if (row < 0 || col < 0)
          return false;
      if (row >= board.rows || col >= board.cols)
          return false;
      return true;
  }
  /**
    get 1d locations of every cell touching the cell at `index`,
    filtering out neighbors out of bounds
  */
  function getNeighbors(board, index) {
      var _a = getCoords(board, index), row = _a[0], col = _a[1];
      var neighbors = [
          [row - 1, col - 1], [row - 1, col], [row - 1, col + 1],
          [row, col - 1], /*  (self)   */ [row, col + 1],
          [row + 1, col - 1], [row + 1, col], [row + 1, col + 1]
      ];
      return neighbors
          .filter(function (_a) {
          var x = _a[0], y = _a[1];
          return isInBounds(x, y, board);
      })
          .map(function (_a) {
          var x = _a[0], y = _a[1];
          return getIndex(board, x, y);
      });
  }
  function countMines(board) {
      for (var i = 0; i < board.cells.length; i++) {
          var neighbors = getNeighbors(board, i);
          var mineCount = 0;
          for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
              var index = neighbors_1[_i];
              if (board.cells[index].hasMine)
                  mineCount++;
          }
          board.cells[i].neighborMineCount = mineCount;
      }
  }
  function makeBoard(rows, cols, mineCount) {
      var board = {
          rows: rows,
          cols: cols,
          mineCount: mineCount,
          cells: new Array(rows * cols)
      };
      for (var i = 0; i < rows * cols; i++) {
          board.cells[i] = newCell();
      }
      placeMines(board); // place mines on first `board.mineCount` cells in  order...
      shuffle(board.cells); // then shuffle the board
      countMines(board);
      // log(board);
      return board;
  }
  function makeCellElement() {
      var el = document.createElement('div');
      el.className = 'cell';
      return el;
  }
  function setZoomLevel() {
      var hZoom = (window.innerWidth / (board.clientWidth + H_MARGIN));
      var vZoom = (window.innerHeight / (board.clientHeight + V_MARGIN));
      board.style.zoom = Math.min(hZoom, vZoom).toString();
  }
  var isNewGame = true;
  var isGameOver = false;
  var V_MARGIN = 70;
  var H_MARGIN = 40;
  var MINE_PROPORTION = 0.15;
  function newGame(rows, cols) {
      isNewGame = true;
      isGameOver = false;
      var mines = Math.round(rows * cols * MINE_PROPORTION);
      var board = makeBoard(rows, cols, mines);
      // clear the board element's contents on each new game
      var parent = document.getElementById('board');
      if (!parent)
          throw new Error('Board element not found');
      while (parent.firstChild)
          parent.removeChild(parent.firstChild);
      var elements = board.cells.map(function () { return makeCellElement(); });
      elements.forEach(function (el, i) {
          var handleClick = function (index) {
              var cell = board.cells[index];
              if (isGameOver)
                  return newGame(rows, cols);
              isNewGame = false;
              if (cell.isOpen)
                  return; // do nothing since cell was already clicked
              if (cell.hasMine) {
                  isGameOver = true;
                  for (var j = 0; j < board.cells.length; j++) {
                      if (board.cells[j].hasMine)
                          elements[j].classList.add('mine');
                  }
              }
              else {
                  cell.isOpen = true;
                  elements[index].classList.add("cell-" + cell.neighborMineCount);
                  if (cell.neighborMineCount === 0) {
                      var neighbors = getNeighbors(board, index);
                      for (var _i = 0, neighbors_2 = neighbors; _i < neighbors_2.length; _i++) {
                          var neighborIndex = neighbors_2[_i];
                          // when clicking on a cell with 0 neighboring mines,
                          // recursively simulate a "click" on each neighboring cell that is not open
                          if (!board.cells[neighborIndex].isOpen)
                              handleClick(neighborIndex);
                      }
                  }
                  // count the number of "hidden" (ie. not yet clicked) cells
                  // if it's the same as the number of mines, trigger gameOver (win)
                  var hiddenCount = 0;
                  for (var j = 0; j < board.cells.length; j++) {
                      if (!board.cells[j].isOpen)
                          hiddenCount++;
                  }
                  if (hiddenCount === board.mineCount) {
                      isGameOver = true;
                      for (var j = 0; j < board.cells.length; j++) {
                          if (!board.cells[j].isOpen)
                              elements[j].classList.add('flag');
                      }
                  }
              }
          };
          el.onclick = function () { return handleClick(i); };
      });
      // add elements to the board dom node, and add a <br> at the end of each row
      for (var i = 0; i < elements.length; i++) {
          parent.appendChild(elements[i]);
          var _a = getCoords(board, i), row = _a[0], col = _a[1];
          if (col === cols - 1)
              parent.appendChild(document.createElement('br'));
      }
      setZoomLevel();
  }
  var board = document.getElementById('board');
  var setRows = document.getElementById('set-rows');
  var setCols = document.getElementById('set-cols');
  var newGameButton = document.getElementById('new-game');
  var CELL_DEFAULT_SIZE = 32;
  var size = {
      rows: Math.floor((window.innerHeight - V_MARGIN) / CELL_DEFAULT_SIZE),
      cols: Math.floor((window.innerWidth - H_MARGIN) / CELL_DEFAULT_SIZE)
  };
  newGameButton.onclick = function () {
      if (!isNewGame && !isGameOver) {
          if (!confirm('This will end the current game. Continue?'))
              return;
      }
      newGame(size.rows, size.cols);
  };
  /** set rows to be used for the *next* new game via input: */
  setRows.oninput = function () {
      var n = parseInt(setRows.value, 10);
      if (n > 0) {
          size.rows = n;
      }
  };
  /** set cols to be used for the *next* new game via input: */
  setCols.oninput = function () {
      var n = parseInt(setCols.value, 10);
      if (n > 0) {
          size.cols = n;
      }
  };
  window.addEventListener('resize', function () {
      setZoomLevel();
  });
  /** at startup, set row/col inputs' values and initialize a new game: */
  (function init() {
      setRows.value = size.rows.toString();
      setCols.value = size.cols.toString();
      newGame(size.rows, size.cols);
  })();

}());
