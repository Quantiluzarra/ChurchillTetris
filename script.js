// Game Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCKS = [
    { color: 'cyan', shapes: [[[0,0],[1,0],[2,0],[3,0]], [[1,0],[1,1],[1,2],[1,3]]] }, // I
    { color: 'yellow', shapes: [[[0,0],[1,0],[0,1],[1,1]]] }, // O
    { color: 'purple', shapes: [[[0,0],[1,0],[2,0],[1,1]], [[1,0],[1,1],[1,2],[0,1]], [[0,1],[1,1],[2,1],[1,0]], [[0,0],[0,1],[0,2],[1,1]]] }, // T
    { color: 'green', shapes: [[[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]]] }, // S
    { color: 'red', shapes: [[[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]]] }, // Z
    { color: 'blue', shapes: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,0],[1,0],[2,0],[2,1]], [[1,0],[1,1],[0,2],[1,2]]] }, // J
    { color: 'orange', shapes: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[0,2]], [[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[1,1],[1,2]]] }  // L
];

// Game State
let board = Array.from({length: BOARD_HEIGHT}, () => Array(BOARD_WIDTH).fill(null));
let currentBlock = null;
let nextBlockIdx = 0;
let score = 0;
let gameInterval = null;
let isPaused = false;
let difficulty = 'medium';

// DOM Elements
const gameBoard = document.getElementById('game-board');
const nextBlockGrid = document.getElementById('next-block');
const scoreDisplay = document.getElementById('score');

// Initialize Board and Next Block Grid
for (let i = 0; i < BOARD_HEIGHT * BOARD_WIDTH; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    gameBoard.appendChild(cell);
}
for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    nextBlockGrid.appendChild(cell);
}

document.addEventListener('DOMContentLoaded', () => {
    // Load Settings
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedDifficulty = localStorage.getItem('difficulty') || 'medium';
    document.getElementById('theme-select').value = savedTheme;
    document.getElementById('difficulty-select').value = savedDifficulty;
    difficulty = savedDifficulty;
    applyTheme(savedTheme);

    // Background Animation
    const background = document.getElementById('background');
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.animationDuration = (Math.random() * 30 + 20) + 's';
        background.appendChild(star);
    }
    for (let i = 0; i < 5; i++) {
        const comet = document.createElement('div');
        comet.className = 'comet';
        comet.style.left = Math.random() * 100 + 'vw';
        comet.style.top = Math.random() * 100 + 'vh';
        comet.style.animationDuration = (Math.random() * 20 + 10) + 's';
        background.appendChild(comet);
    }

    // Navigation
    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        startGame();
    });
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('settings').style.display = 'block';
    });
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('settings').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    });
    document.getElementById('theme-select').addEventListener('change', (e) => {
        localStorage.setItem('theme', e.target.value);
        applyTheme(e.target.value);
    });
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
        difficulty = e.target.value;
        localStorage.setItem('difficulty', difficulty);
    });

    // Controls
    setupControls();
});

function applyTheme(theme) {
    document.body.className = theme;
}

function startGame() {
    board = Array.from({length: BOARD_HEIGHT}, () => Array(BOARD_WIDTH).fill(null));
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    isPaused = false;
    nextBlockIdx = chooseNextBlock();
    spawnBlock();
    const speed = { easy: 800, medium: 500, hard: 300, ai: 500 }[difficulty];
    gameInterval = setInterval(step, speed);
}

function spawnBlock() {
    currentBlock = {
        type: nextBlockIdx,
        x: 3,
        y: 0,
        rotation: 0
    };
    if (checkCollision()) {
        gameOver();
        return;
    }
    nextBlockIdx = chooseNextBlock();
    renderNextBlock();
    renderBoard();
}

function step() {
    if (!isPaused && !moveDown()) {
        landBlock();
        spawnBlock();
    }
}

function renderBoard() {
    const cells = gameBoard.children;
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            const idx = row * BOARD_WIDTH + col;
            cells[idx].className = 'cell' + (board[row][col] ? ` block-${board[row][col]}` : '');
        }
    }
    if (currentBlock) {
        const shape = BLOCKS[currentBlock.type].shapes[currentBlock.rotation];
        shape.forEach(([dx, dy]) => {
            const x = currentBlock.x + dx;
            const y = currentBlock.y + dy;
            if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
                const idx = y * BOARD_WIDTH + x;
                cells[idx].className = `cell block-${BLOCKS[currentBlock.type].color}`;
            }
        });
    }
}

function renderNextBlock() {
    const cells = nextBlockGrid.children;
    for (let i = 0; i < 16; i++) cells[i].className = 'cell';
    const shape = BLOCKS[nextBlockIdx].shapes[0];
    shape.forEach(([x, y]) => {
        const idx = y * 4 + x;
        cells[idx].className = `cell block-${BLOCKS[nextBlockIdx].color}`;
    });
}

function checkCollision(dx = 0, dy = 0, dr = 0) {
    const newX = currentBlock.x + dx;
    const newY = currentBlock.y + dy;
    const newRotation = (currentBlock.rotation + dr + BLOCKS[currentBlock.type].shapes.length) % BLOCKS[currentBlock.type].shapes.length;
    const shape = BLOCKS[currentBlock.type].shapes[newRotation];
    return shape.some(([dx, dy]) => {
        const x = newX + dx;
        const y = newY + dy;
        return x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && board[y][x]);
    });
}

function moveDown() {
    if (!checkCollision(0, 1)) {
        currentBlock.y++;
        renderBoard();
        return true;
    }
    return false;
}

function landBlock() {
    const shape = BLOCKS[currentBlock.type].shapes[currentBlock.rotation];
    shape.forEach(([dx, dy]) => {
        const x = currentBlock.x + dx;
        const y = currentBlock.y + dy;
        if (y >= 0) board[y][x] = BLOCKS[currentBlock.type].color;
    });
    clearLines();
    currentBlock = null;
}

function clearLines() {
    let linesCleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row].every(cell => cell)) {
            board.splice(row, 1);
            board.unshift(Array(BOARD_WIDTH).fill(null));
            linesCleared++;
            row++;
        }
    }
    if (linesCleared) {
        score += [0, 100, 300, 500, 800][linesCleared];
        scoreDisplay.textContent = `Score: ${score}`;
    }
}

function chooseNextBlock() {
    if (difficulty !== 'ai') return Math.floor(Math.random() * BLOCKS.length);
    let minMaxLines = Infinity;
    let candidates = [];
    const tempBoard = board.map(row => [...row]);
    BLOCKS.forEach((block, idx) => {
        let maxLines = 0;
        block.shapes.forEach((shape, r) => {
            for (let x = 0; x <= BOARD_WIDTH - shape.reduce((max, [dx]) => Math.max(max, dx), 0); x++) {
                let y = 0;
                while (!shape.some(([dx, dy]) => {
                    const newX = x + dx;
                    const newY = y + dy;
                    return newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && tempBoard[newY][newX]);
                })) y++;
                y--;
                const testBoard = tempBoard.map(row => [...row]);
                shape.forEach(([dx, dy]) => {
                    if (y + dy >= 0) testBoard[y + dy][x + dx] = block.color;
                });
                let lines = 0;
                for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
                    if (testBoard[r].every(cell => cell)) lines++;
                }
                maxLines = Math.max(maxLines, lines);
            }
        });
        if (maxLines < minMaxLines) {
            minMaxLines = maxLines;
            candidates = [idx];
        } else if (maxLines === minMaxLines) {
            candidates.push(idx);
        }
    });
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function setupControls() {
    const actions = {
        'left-btn': () => { if (!isPaused && !checkCollision(-1, 0)) { currentBlock.x--; renderBoard(); } },
        'right-btn': () => { if (!isPaused && !checkCollision(1, 0)) { currentBlock.x++; renderBoard(); } },
        'rotate-btn': () => { if (!isPaused && !checkCollision(0, 0, 1)) { currentBlock.rotation = (currentBlock.rotation + 1) % BLOCKS[currentBlock.type].shapes.length; renderBoard(); } },
        'down-btn': () => { if (!isPaused) moveDown() || landBlock() && spawnBlock(); },
        'pause-btn': () => {
            isPaused = !isPaused;
            document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
        }
    };
    Object.entries(actions).forEach(([id, action]) => {
        const btn = document.getElementById(id);
        let interval;
        btn.addEventListener('pointerdown', () => {
            action();
            interval = setInterval(action, 100);
        });
        btn.addEventListener('pointerup', () => clearInterval(interval));
        btn.addEventListener('pointerleave', () => clearInterval(interval));
    });
}

function gameOver() {
    clearInterval(gameInterval);
    alert(`Game Over! Score: ${score}`);
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
}
