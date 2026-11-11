// ========================================================
// Snake & Ladders - Casual Hobby Game
// Phase 7: Random Layout Generator with Equal Pairs (6-8) & Preview
// ========================================================

/**
 * Handcrafted Balanced Classic Layouts for 6, 7, and 8 pairs.
 * Snakes & Ladders counts are always EQUAL, all squares are disjoint,
 * no square 1 or 100, and jump lengths are between 10 and 60.
 */
const CLASSIC_LAYOUTS = {
  6: {
    ladders: [
      { start: 4, end: 25 },
      { start: 13, end: 46 },
      { start: 33, end: 49 },
      { start: 42, end: 63 },
      { start: 50, end: 69 },
      { start: 62, end: 81 },
    ],
    snakes: [
      { start: 27, end: 5, color: '#10b981' },
      { start: 40, end: 3, color: '#ef4444' },
      { start: 54, end: 31, color: '#f59e0b' },
      { start: 66, end: 45, color: '#06b6d4' },
      { start: 89, end: 53, color: '#84cc16' },
      { start: 99, end: 41, color: '#dc2626' },
    ],
  },
  7: {
    ladders: [
      { start: 4, end: 25 },
      { start: 13, end: 46 },
      { start: 33, end: 49 },
      { start: 42, end: 63 },
      { start: 50, end: 69 },
      { start: 62, end: 81 },
      { start: 74, end: 92 },
    ],
    snakes: [
      { start: 27, end: 5, color: '#10b981' },
      { start: 40, end: 3, color: '#ef4444' },
      { start: 43, end: 18, color: '#8b5cf6' },
      { start: 54, end: 31, color: '#f59e0b' },
      { start: 66, end: 45, color: '#06b6d4' },
      { start: 89, end: 53, color: '#84cc16' },
      { start: 99, end: 41, color: '#dc2626' },
    ],
  },
  8: {
    ladders: [
      { start: 4, end: 25 },
      { start: 13, end: 46 },
      { start: 19, end: 38 },
      { start: 33, end: 49 },
      { start: 42, end: 63 },
      { start: 50, end: 69 },
      { start: 62, end: 81 },
      { start: 74, end: 92 },
    ],
    snakes: [
      { start: 27, end: 5, color: '#10b981' },
      { start: 40, end: 3, color: '#ef4444' },
      { start: 43, end: 18, color: '#8b5cf6' },
      { start: 54, end: 31, color: '#f59e0b' },
      { start: 66, end: 45, color: '#06b6d4' },
      { start: 76, end: 58, color: '#ec4899' },
      { start: 89, end: 53, color: '#84cc16' },
      { start: 99, end: 41, color: '#dc2626' },
    ],
  },
};

// Curated palette of distinct colors for player pegs
const PRESET_COLORS = [
  '#ef4444', // 1: Red
  '#3b82f6', // 2: Blue
  '#10b981', // 3: Green
  '#f59e0b', // 4: Amber
  '#8b5cf6', // 5: Purple
  '#ec4899', // 6: Pink
  '#06b6d4', // 7: Cyan
  '#f97316', // 8: Orange
  '#6366f1', // 9: Indigo
  '#84cc16', // 10: Lime
  '#14b8a6', // 11: Teal
  '#e11d48', // 12: Rose
];

// 3D Dice rotation angles for faces 1 to 6
const DICE_ROTATIONS = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 0, y: -180 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

/**
 * Active Layout Configuration (Equal Snakes & Ladders: 6 to 8)
 */
let selectedPairCount = 7;
let activeLadders = [...CLASSIC_LAYOUTS[7].ladders];
let activeSnakes = [...CLASSIC_LAYOUTS[7].snakes];

// Fast O(1) lookups rebuilt on every layout change
let laddersByStart = new Map();
let laddersByEnd = new Map();
let snakesByStart = new Map();
let snakesByEnd = new Map();

function updateLayoutMaps() {
  laddersByStart = new Map(activeLadders.map(l => [l.start, l]));
  laddersByEnd = new Map(activeLadders.map(l => [l.end, l]));
  snakesByStart = new Map(activeSnakes.map(s => [s.start, s]));
  snakesByEnd = new Map(activeSnakes.map(s => [s.end, s]));
}
updateLayoutMaps();

/**
 * Active Tournament & Game State
 * Preconfigured with Player 1 (Human) & Robot 1 (Robot) for immediate testing!
 */
let players = [
  { id: 1, name: 'Player 1', type: 'human', color: '#ef4444', position: 1, isFinished: false, rank: null },
  { id: 2, name: 'Robot 1', type: 'robot', color: '#3b82f6', position: 1, isFinished: false, rank: null },
];
let nextPlayerId = 3;
let nextHumanNumber = 2;
let nextRobotNumber = 2;
let currentPlayerIndex = 0;

// Anti-Cheat & Turn States
let diceRolled = false;
let currentRollValue = null;
let expectedTargetSquare = null;
let activeMoverPlayerId = null;
let isAnimatingMove = false;
let tournamentOver = false;

// Finishing Rankings Order
let finishedRankings = []; // [{ player, rank, medal }]

// Autonomous Robot Timer reference
let robotTurnTimer = null;

/**
 * Calculates CSS Grid coordinates (1-based, top-left is 1,1)
 * for a square number (1 to 100) using boustrophedon order.
 */
function getSquareCoordinates(squareNum) {
  const rowFromBottom = Math.floor((squareNum - 1) / 10);
  const gridRow = 10 - rowFromBottom;
  const offsetInRow = (squareNum - 1) % 10;
  const isLeftToRight = (rowFromBottom % 2 === 0);
  const gridCol = isLeftToRight ? (offsetInRow + 1) : (10 - offsetInRow);
  return { gridRow, gridCol, rowFromBottom, isLeftToRight };
}

/**
 * Returns center coordinates of a square in the 1000x1000 SVG coordinate space.
 */
function getSquareCenter(squareNum) {
  const coords = getSquareCoordinates(squareNum);
  return {
    x: (coords.gridCol - 0.5) * 100,
    y: (coords.gridRow - 0.5) * 100,
  };
}

/**
 * Renders the 100 squares inside #board, adding anti-cheat drop zones.
 */
function renderBoard() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;

  boardEl.innerHTML = '';

  for (let s = 1; s <= 100; s++) {
    const coords = getSquareCoordinates(s);

    const squareDiv = document.createElement('div');
    squareDiv.className = `square color-${(s - 1) % 5}`;
    squareDiv.id = `square-${s}`;
    squareDiv.dataset.square = s;
    squareDiv.dataset.row = coords.gridRow;
    squareDiv.dataset.col = coords.gridCol;

    squareDiv.style.gridRow = String(coords.gridRow);
    squareDiv.style.gridColumn = String(coords.gridCol);
    squareDiv.style.position = 'relative';

    // Square number
    const numSpan = document.createElement('span');
    numSpan.className = 'square-number';
    numSpan.textContent = s;
    squareDiv.appendChild(numSpan);

    // Badges
    if (s === 1) {
      squareDiv.classList.add('square-start');
      const badge = document.createElement('span');
      badge.className = 'square-badge';
      badge.textContent = 'Start 🚩';
      squareDiv.appendChild(badge);
    } else if (s === 100) {
      squareDiv.classList.add('square-goal');
      const badge = document.createElement('span');
      badge.className = 'square-badge';
      badge.textContent = 'Goal 🏆';
      squareDiv.appendChild(badge);
    } else if (laddersByStart.has(s)) {
      squareDiv.classList.add('has-ladder-start');
      const icon = document.createElement('span');
      icon.className = 'tile-hint-icon';
      icon.textContent = '🪜';
      icon.title = `Ladder starts here, climbs to ${laddersByStart.get(s).end}`;
      squareDiv.appendChild(icon);
    } else if (snakesByStart.has(s)) {
      squareDiv.classList.add('has-snake-head');
      const icon = document.createElement('span');
      icon.className = 'tile-hint-icon';
      icon.textContent = '🐍';
      icon.title = `Snake head here, slides to ${snakesByStart.get(s).end}`;
      squareDiv.appendChild(icon);
    }

    // Pegs container
    const pegsContainer = document.createElement('div');
    pegsContainer.className = 'pegs-container';
    pegsContainer.id = `pegs-container-${s}`;
    squareDiv.appendChild(pegsContainer);

    // Square inspection & click fallback
    squareDiv.addEventListener('mouseenter', () => handleSquareHover(s));
    squareDiv.addEventListener('mouseleave', () => clearHighlight());
    squareDiv.addEventListener('click', () => {
      // Tap target fallback: if dice was rolled by a human and user taps on the highlighted target square, move there!
      const activePlayer = players[currentPlayerIndex];
      if (activePlayer && activePlayer.type === 'human' && diceRolled && expectedTargetSquare === s && !isAnimatingMove) {
        handleAntiCheatDrop(s);
      } else {
        handleSquareHover(s);
      }
    });

    // Drag & Drop event listeners
    squareDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      squareDiv.classList.add('drop-target-hover');
    });

    squareDiv.addEventListener('dragleave', () => {
      squareDiv.classList.remove('drop-target-hover');
    });

    squareDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      squareDiv.classList.remove('drop-target-hover');
      handleAntiCheatDrop(s);
    });

    boardEl.appendChild(squareDiv);
  }
}

/**
 * Renders all player pegs on their respective squares with turn indicators and medals.
 */
function renderPegs() {
  for (let s = 1; s <= 100; s++) {
    const container = document.getElementById(`pegs-container-${s}`);
    if (container) {
      container.innerHTML = '';
      container.classList.remove('pegs-few', 'pegs-many');
    }
  }

  // Group players by position
  const playersBySquare = new Map();
  players.forEach(p => {
    const pos = Math.max(1, Math.min(100, p.position || 1));
    if (!playersBySquare.has(pos)) {
      playersBySquare.set(pos, []);
    }
    playersBySquare.get(pos).push(p);
  });

  const activePlayer = players[currentPlayerIndex];

  playersBySquare.forEach((squarePlayers, squareNum) => {
    const container = document.getElementById(`pegs-container-${squareNum}`);
    if (!container) return;

    if (squarePlayers.length >= 5) {
      container.classList.add('pegs-many');
    } else if (squarePlayers.length >= 2) {
      container.classList.add('pegs-few');
    }

    squarePlayers.forEach(player => {
      const peg = document.createElement('div');
      peg.className = 'peg';
      peg.style.backgroundColor = player.color;
      peg.id = `peg-player-${player.id}`;
      peg.dataset.playerId = player.id;
      peg.dataset.square = squareNum;

      // Finished badge on peg
      if (player.isFinished) {
        peg.classList.add('is-finished-peg');
        peg.title = `${player.name} (${player.type === 'robot' ? '🤖' : '👤'}) — Finished (${getRankTitle(player.rank)})`;
        const medalTag = document.createElement('span');
        medalTag.className = 'peg-medal-tag';
        medalTag.textContent = getMedalIcon(player.rank);
        peg.appendChild(medalTag);
      } else {
        peg.title = `${player.name} (${player.type === 'robot' ? '🤖 Robot' : '👤 Human'}) — Square ${squareNum}`;
      }

      // Active player turn highlight
      if (!tournamentOver && activePlayer && player.id === activePlayer.id && !player.isFinished) {
        peg.classList.add('current-turn-peg');
        if (diceRolled) {
          peg.classList.add('peg-ready-to-move');
        }
      }

      // Drag attributes: ONLY human players drag their pegs manually
      const isDraggable = !player.isFinished && !tournamentOver && player.type === 'human';
      peg.draggable = isDraggable;

      const label = document.createElement('span');
      // Show robot icon or player ID number
      label.textContent = player.type === 'robot' ? '🤖' : player.id;
      peg.appendChild(label);

      // Desktop Drag & Drop events
      peg.addEventListener('dragstart', (e) => {
        if (player.isFinished || tournamentOver) {
          e.preventDefault();
          return;
        }

        // Robot pegs cannot be dragged
        if (player.type === 'robot') {
          e.preventDefault();
          setLog(`🤖 <strong>${player.name}</strong> is an autonomous robot! Robots move on their own.`);
          return;
        }

        // Validate: has the dice been rolled?
        if (!diceRolled) {
          e.preventDefault();
          setLog(`🎲 <strong>Please roll the dice first</strong> before moving your peg!`);
          return;
        }

        // Validate: is it this player's turn?
        if (player.id !== activePlayer.id) {
          e.preventDefault();
          setLog(`✋ It is <strong>${activePlayer.name}'s</strong> turn! Please drag <strong>${activePlayer.name}'s peg</strong>.`);
          return;
        }

        activeMoverPlayerId = player.id;
        peg.classList.add('dragging');
        e.dataTransfer.setData('text/plain', String(player.id));
        e.dataTransfer.effectAllowed = 'move';
      });

      peg.addEventListener('dragend', () => {
        peg.classList.remove('dragging');
        document.querySelectorAll('.square.drop-target-hover').forEach(el => el.classList.remove('drop-target-hover'));
      });

      // Mobile Touch Drag Support
      setupTouchDrag(peg, player);

      // Inspection
      peg.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        inspectPeg(player);
      });
      peg.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectPeg(player);
      });

      container.appendChild(peg);
    });
  });
}

/**
 * Mobile Touch-based drag & drop handler for human pegs with anti-cheat checks.
 */
function setupTouchDrag(pegEl, player) {
  let touchMoved = false;
  let activeDropSquare = null;

  pegEl.addEventListener('touchstart', (e) => {
    if (player.isFinished || tournamentOver || isAnimatingMove) return;

    if (player.type === 'robot') {
      setLog(`🤖 <strong>${player.name}</strong> is an autonomous robot! Robots move on their own.`);
      return;
    }

    if (!diceRolled) {
      setLog(`🎲 <strong>Please roll the dice first</strong> before moving your peg!`);
      return;
    }

    const activePlayer = players[currentPlayerIndex];
    if (player.id !== activePlayer.id) {
      setLog(`✋ It is <strong>${activePlayer.name}'s</strong> turn! Please drag <strong>${activePlayer.name}'s peg</strong>.`);
      return;
    }

    activeMoverPlayerId = player.id;
    touchMoved = false;
    pegEl.classList.add('dragging');
  }, { passive: true });

  pegEl.addEventListener('touchmove', (e) => {
    if (!activeMoverPlayerId) return;
    touchMoved = true;
    const touch = e.touches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetSquareEl = elemBelow ? elemBelow.closest('.square') : null;

    document.querySelectorAll('.square.drop-target-hover').forEach(el => el.classList.remove('drop-target-hover'));

    if (targetSquareEl) {
      targetSquareEl.classList.add('drop-target-hover');
      activeDropSquare = parseInt(targetSquareEl.dataset.square, 10);
    } else {
      activeDropSquare = null;
    }
  }, { passive: true });

  pegEl.addEventListener('touchend', () => {
    pegEl.classList.remove('dragging');
    document.querySelectorAll('.square.drop-target-hover').forEach(el => el.classList.remove('drop-target-hover'));

    if (touchMoved && activeDropSquare && activeMoverPlayerId) {
      handleAntiCheatDrop(activeDropSquare);
    }
    activeDropSquare = null;
  });
}

/**
 * ANTI-CHEAT GUIDED DROP VALIDATION
 * Validates that the peg is placed exactly on expectedTargetSquare.
 * Used for both human manual drops and robot auto-movement.
 */
function handleAntiCheatDrop(droppedSquare) {
  if (tournamentOver || isAnimatingMove) return;

  const activePlayer = players[currentPlayerIndex];
  if (!activePlayer) return;

  // 1. Must roll dice first
  if (!diceRolled || expectedTargetSquare == null) {
    setLog(`🎲 <strong>Please roll the dice first</strong> before moving your peg!`);
    return;
  }

  // 2. Validate Target Square (Anti-Cheat check for humans)
  if (droppedSquare !== expectedTargetSquare) {
    const wrongSquareEl = document.getElementById(`square-${droppedSquare}`);
    if (wrongSquareEl) {
      wrongSquareEl.classList.remove('shake-cheat');
      void wrongSquareEl.offsetWidth; // Trigger reflow
      wrongSquareEl.classList.add('shake-cheat');
      setTimeout(() => wrongSquareEl.classList.remove('shake-cheat'), 500);
    }

    setLog(`🚫 <strong>No cheating!</strong> You rolled a <strong>${currentRollValue}</strong>. You must drag your peg to <strong>Square ${expectedTargetSquare}</strong>! 😉`);
    return;
  }

  // 3. Valid Move Confirmed!
  clearTargetSquareHighlight();
  isAnimatingMove = true;

  const prevSquare = activePlayer.position;
  activePlayer.position = expectedTargetSquare;

  // Check if target square has a ladder or a snake
  if (laddersByStart.has(expectedTargetSquare)) {
    const ladder = laddersByStart.get(expectedTargetSquare);
    highlightLadder(ladder);
    setLog(`🪜 <strong>LADDER!</strong> ${activePlayer.name} reached Square ${expectedTargetSquare} and climbs UP to <strong>Square ${ladder.end}</strong>! (+${ladder.end - expectedTargetSquare})`);

    renderPegs();
    renderPlayersList();
    renderPlayersStatusTable();

    setTimeout(() => {
      activePlayer.position = ladder.end;
      renderPegs();
      renderPlayersList();
      renderPlayersStatusTable();
      finalizeTurnMove(activePlayer);
    }, 450);
  } else if (snakesByStart.has(expectedTargetSquare)) {
    const snake = snakesByStart.get(expectedTargetSquare);
    highlightSnake(snake);
    setLog(`🐍 <strong>SNAKE!</strong> Oh no, ${activePlayer.name} landed on Square ${expectedTargetSquare} and slides DOWN to <strong>Square ${snake.end}</strong>! (-${expectedTargetSquare - snake.end})`);

    renderPegs();
    renderPlayersList();
    renderPlayersStatusTable();

    setTimeout(() => {
      activePlayer.position = snake.end;
      renderPegs();
      renderPlayersList();
      renderPlayersStatusTable();
      finalizeTurnMove(activePlayer);
    }, 450);
  } else {
    setLog(`✅ <strong>${activePlayer.name}</strong> moved from Square ${prevSquare} ➔ <strong>Square ${expectedTargetSquare}</strong>.`);
    renderPegs();
    renderPlayersList();
    renderPlayersStatusTable();
    finalizeTurnMove(activePlayer);
  }
}

/**
 * Concludes a player's move, checks for finishing, and cycles turn.
 */
function finalizeTurnMove(player) {
  isAnimatingMove = false;

  // Check if player reached Square 100 (Overshoot-to-Win or exact landing)
  if (player.position === 100 && !player.isFinished) {
    handlePlayerFinish(player);
    return;
  }

  // Pass turn to next active player
  advanceTurn();
}

/**
 * Handles a player finishing (reaching Square 100).
 */
function handlePlayerFinish(player) {
  player.isFinished = true;
  const rank = finishedRankings.length + 1;
  player.rank = rank;

  finishedRankings.push({
    player,
    rank,
    medal: getRankTitle(rank),
  });

  const typeIcon = player.type === 'robot' ? '🤖' : '👤';
  setLog(`🎉 <strong>${getMedalIcon(rank)} ${getRankTitle(rank)}!</strong> ${typeIcon} ${player.name} has crossed the finish line at <strong>Square 100</strong>!`);

  renderPegs();
  renderPlayersList();
  renderLiveRankings();
  renderPlayersStatusTable();

  // Check remaining active players
  const remainingActive = players.filter(p => !p.isFinished);

  // Requirement: "The game should end if everyone except 1 player finishes the game"
  if (remainingActive.length <= 1) {
    if (remainingActive.length === 1) {
      // Award the final rank to the last standing player
      const lastPlayer = remainingActive[0];
      lastPlayer.isFinished = true;
      const finalRank = finishedRankings.length + 1;
      lastPlayer.rank = finalRank;
      finishedRankings.push({
        player: lastPlayer,
        rank: finalRank,
        medal: `${finalRank}th Place`,
      });
    }

    triggerTournamentComplete();
    return;
  }

  // Advance turn to the next non-finished player
  advanceTurn();
}

/**
 * Advances the active turn to the next player who has not finished yet.
 * If the next player is a Robot, automatically schedules its turn!
 */
function advanceTurn() {
  diceRolled = false;
  currentRollValue = null;
  expectedTargetSquare = null;
  activeMoverPlayerId = null;

  if (robotTurnTimer) {
    clearTimeout(robotTurnTimer);
    robotTurnTimer = null;
  }

  const remaining = players.filter(p => !p.isFinished);
  if (remaining.length <= 1) {
    triggerTournamentComplete();
    return;
  }

  // Cycle to next active player
  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  } while (players[currentPlayerIndex].isFinished);

  const activePlayer = players[currentPlayerIndex];

  updateTurnUI();
  renderPegs();
  saveGameState();

  const rollBtn = document.getElementById('btn-roll-dice');

  if (activePlayer.type === 'robot') {
    // Disable manual roll button for humans during robot turn
    if (rollBtn) rollBtn.disabled = true;

    // Show robot thinking state
    const pill = document.getElementById('turn-phase-pill');
    if (pill) {
      pill.textContent = '🤖 Thinking...';
      pill.className = 'turn-phase-pill robot-thinking';
    }
    setLog(`🤖 <strong>${activePlayer.name}</strong> is calculating its next move...`);

    // Short thinking delay (~750ms), then robot automatically rolls
    robotTurnTimer = setTimeout(() => {
      executeRobotTurn();
    }, 750);
  } else {
    // Human turn: enable roll button
    if (rollBtn) rollBtn.disabled = false;
    setLog(`🎲 It is <strong>${activePlayer.name}'s</strong> turn! Click <strong>Roll Dice</strong> or click the 3D cube.`);
  }
}

/**
 * Autonomous Robot Turn: auto-rolls the 3D dice, calculates target,
 * highlights it, and moves the peg automatically.
 */
function executeRobotTurn() {
  if (tournamentOver || isAnimatingMove) return;

  const activePlayer = players[currentPlayerIndex];
  if (!activePlayer || activePlayer.type !== 'robot' || activePlayer.isFinished) return;

  const diceCube = document.getElementById('dice-cube');
  if (!diceCube) return;

  // Generate roll 1-6
  currentRollValue = Math.floor(Math.random() * 6) + 1;
  const rot = DICE_ROTATIONS[currentRollValue];

  // Trigger 3D dice tumbling animation
  diceCube.style.setProperty('--dice-target-rot', `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`);
  diceCube.classList.remove('rolling');
  void diceCube.offsetWidth; // Reflow
  diceCube.classList.add('rolling');

  setLog(`🤖 <strong>${activePlayer.name}</strong> is rolling the dice...`);

  setTimeout(() => {
    diceCube.classList.remove('rolling');
    diceCube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;

    // Calculate legal target square with OVERSHOOT-TO-WIN rule!
    const startPos = activePlayer.position;
    let target = startPos + currentRollValue;
    const overshot = target > 100;

    if (target >= 100) {
      target = 100; // Overshoot reaches 100 and wins immediately!
    }

    expectedTargetSquare = target;
    diceRolled = true;
    activeMoverPlayerId = activePlayer.id;

    // Highlight target square
    highlightTargetSquare(expectedTargetSquare);

    // Update Turn Phase Pill
    const pill = document.getElementById('turn-phase-pill');
    if (pill) {
      pill.textContent = `🤖 Moving to Sq ${expectedTargetSquare}`;
      pill.className = 'turn-phase-pill ready-to-drag';
    }

    // Commentary
    if (overshot) {
      setLog(`🤖 <strong>${activePlayer.name}</strong> rolled a <strong>${currentRollValue}</strong> from Square ${startPos} (overshoots and reaches <strong>Square 100 🏆</strong>)! Moving peg...`);
    } else {
      setLog(`🤖 <strong>${activePlayer.name}</strong> rolled a <strong>${currentRollValue}</strong>! Auto-moving peg from Square ${startPos} ➔ <strong>Square ${expectedTargetSquare}</strong>...`);
    }

    renderPegs();

    // Brief delay (~450ms) for visual clarity, then auto-move to target square
    robotTurnTimer = setTimeout(() => {
      handleAntiCheatDrop(expectedTargetSquare);
    }, 450);

  }, 650);
}

/**
 * Rolls the dice with a 3D animation for Human players.
 * Implements the OVERSHOOT-TO-WIN rule and lights up the Anti-Cheat Guided Target.
 */
function rollDice() {
  if (tournamentOver || isAnimatingMove || diceRolled) return;

  const activePlayer = players[currentPlayerIndex];
  if (!activePlayer || activePlayer.isFinished) return;

  // Robots roll autonomously, don't allow manual trigger
  if (activePlayer.type === 'robot') {
    setLog(`🤖 <strong>${activePlayer.name}</strong> rolls autonomously! Please wait for your turn.`);
    return;
  }

  const rollBtn = document.getElementById('btn-roll-dice');
  const diceCube = document.getElementById('dice-cube');
  if (!rollBtn || !diceCube) return;

  rollBtn.disabled = true;

  currentRollValue = Math.floor(Math.random() * 6) + 1;
  const rot = DICE_ROTATIONS[currentRollValue];

  // Set rotation and trigger 3D tumble animation
  diceCube.style.setProperty('--dice-target-rot', `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`);
  diceCube.classList.remove('rolling');
  void diceCube.offsetWidth; // Reflow
  diceCube.classList.add('rolling');

  setLog(`🎲 <strong>${activePlayer.name}</strong> is rolling the dice...`);

  setTimeout(() => {
    diceCube.classList.remove('rolling');
    diceCube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;

    // Calculate legal target square with OVERSHOOT-TO-WIN rule!
    const startPos = activePlayer.position;
    let target = startPos + currentRollValue;
    const overshot = target > 100;

    if (target >= 100) {
      target = 100; // Overshoot reaches 100 and wins immediately!
    }

    expectedTargetSquare = target;
    diceRolled = true;
    activeMoverPlayerId = activePlayer.id;

    // Highlight the target square with guided target pulse
    highlightTargetSquare(expectedTargetSquare);

    // Update Turn Phase Pill
    const pill = document.getElementById('turn-phase-pill');
    if (pill) {
      pill.textContent = `🎯 Move to Sq ${expectedTargetSquare}`;
      pill.className = 'turn-phase-pill ready-to-drag';
    }

    // Update commentary
    if (overshot) {
      setLog(`🎲 <strong>${activePlayer.name}</strong> rolled a <strong>${currentRollValue}</strong> from Square ${startPos}! Overshoots 100 and reaches <strong>Square 100 🏆 (Goal)</strong>! Drag your peg to <strong>Square 100</strong> to finish!`);
    } else if (target === 100) {
      setLog(`🎲 <strong>${activePlayer.name}</strong> rolled a <strong>${currentRollValue}</strong>! Reaches <strong>Square 100 🏆 (Goal)</strong> exactly! Drag your peg to <strong>Square 100</strong> to win!`);
    } else {
      setLog(`🎲 <strong>${activePlayer.name}</strong> rolled a <strong>${currentRollValue}</strong>! Please drag your peg to <strong>Square ${expectedTargetSquare}</strong> (🎯 target highlighted).`);
    }

    renderPegs();
    saveGameState();
  }, 650);
}

/**
 * Highlights the guided target square on the board.
 */
function highlightTargetSquare(squareNum) {
  clearTargetSquareHighlight();
  const squareEl = document.getElementById(`square-${squareNum}`);
  if (squareEl) {
    squareEl.classList.add('guided-target-square');

    // Add target flag badge inside square
    const flag = document.createElement('span');
    flag.className = 'target-flag';
    flag.id = 'guided-target-flag';
    flag.textContent = '🎯 TARGET';
    squareEl.appendChild(flag);
  }
}

/**
 * Clears target square highlights.
 */
function clearTargetSquareHighlight() {
  document.querySelectorAll('.square.guided-target-square').forEach(el => {
    el.classList.remove('guided-target-square');
  });
  const flag = document.getElementById('guided-target-flag');
  if (flag) {
    if (typeof flag.remove === 'function') {
      flag.remove();
    } else if (flag.parentNode && typeof flag.parentNode.removeChild === 'function') {
      flag.parentNode.removeChild(flag);
    }
  }
}

/**
 * Updates Turn Banner UI.
 */
function updateTurnUI() {
  const activePlayer = players[currentPlayerIndex];
  const avatar = document.getElementById('turn-avatar');
  const nameEl = document.getElementById('turn-name');
  const pill = document.getElementById('turn-phase-pill');

  if (tournamentOver) {
    if (nameEl) nameEl.textContent = 'Tournament Complete!';
    if (pill) {
      pill.textContent = 'Game Finished';
      pill.className = 'turn-phase-pill';
    }
    renderPlayersStatusTable();
    return;
  }

  if (activePlayer) {
    if (avatar) {
      avatar.textContent = activePlayer.type === 'robot' ? '🤖' : activePlayer.id;
      avatar.style.backgroundColor = activePlayer.color;
    }
    if (nameEl) {
      const typeTag = activePlayer.type === 'robot' ? ' (Robot)' : '';
      nameEl.textContent = `${activePlayer.name}'s Turn${typeTag}`;
    }
    if (pill) {
      if (activePlayer.type === 'robot') {
        pill.textContent = '🤖 Thinking...';
        pill.className = 'turn-phase-pill robot-thinking';
      } else {
        pill.textContent = 'Ready to Roll';
        pill.className = 'turn-phase-pill';
      }
    }
  }

  renderPlayersStatusTable();
  focusActivePeg(true);
}

/**
 * Sets commentary message in the log box.
 */
function setLog(htmlContent) {
  const logEl = document.getElementById('log-text');
  if (logEl) {
    logEl.innerHTML = htmlContent;
  }
}

/**
 * Renders the tournament podium standings table and unhides the podium card.
 */
function renderPodiumStandings() {
  const podiumCard = document.getElementById('tournament-podium');
  const tableEl = document.getElementById('podium-standings-table');
  const rollBtn = document.getElementById('btn-roll-dice');

  if (rollBtn) rollBtn.disabled = true;

  if (tableEl) {
    tableEl.innerHTML = '';
    finishedRankings.forEach((entry) => {
      const typeBadge = entry.player.type === 'robot' ? '🤖' : '👤';
      const row = document.createElement('div');
      row.className = `podium-row rank-${entry.rank}`;
      row.innerHTML = `
        <span class="podium-medal">${getMedalIcon(entry.rank)} ${getRankTitle(entry.rank)}</span>
        <span class="podium-name" style="color: ${entry.player.color};">
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${entry.player.color};margin-right:6px;vertical-align:middle;"></span>
          ${typeBadge} ${entry.player.name}
        </span>
        <span class="podium-sq">${entry.player.position === 100 ? 'Square 100 🚩' : `Square ${entry.player.position}`}</span>
      `;
      tableEl.appendChild(row);
    });
  }

  if (podiumCard) podiumCard.style.display = 'block';
}

/**
 * Triggers Tournament Completion and displays the grand final podium.
 */
function triggerTournamentComplete() {
  tournamentOver = true;
  clearTargetSquareHighlight();

  if (robotTurnTimer) {
    clearTimeout(robotTurnTimer);
    robotTurnTimer = null;
  }

  renderPodiumStandings();
  updateTurnUI();
  setLog(`🏆 <strong>Tournament Complete!</strong> All podium positions decided! Check the final rankings above.`);
  saveGameState();
}

/**
 * Resets the tournament and all pegs back to Square 1.
 */
function resetGame(silent = false) {
  if (robotTurnTimer) {
    clearTimeout(robotTurnTimer);
    robotTurnTimer = null;
  }

  players.forEach(p => {
    p.position = 1;
    p.isFinished = false;
    p.rank = null;
  });

  finishedRankings = [];
  currentPlayerIndex = 0;
  diceRolled = false;
  currentRollValue = null;
  expectedTargetSquare = null;
  activeMoverPlayerId = null;
  isAnimatingMove = false;
  tournamentOver = false;

  clearTargetSquareHighlight();

  const podiumCard = document.getElementById('tournament-podium');
  if (podiumCard) podiumCard.style.display = 'none';

  const rollBtn = document.getElementById('btn-roll-dice');
  if (rollBtn) rollBtn.disabled = false;

  const diceCube = document.getElementById('dice-cube');
  if (diceCube) {
    diceCube.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }

  updateTurnUI();
  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  saveGameState();

  if (!silent) {
    setLog(`🎲 Tournament reset! All players are back on <strong>Square 1 (Start 🚩)</strong>.`);
  }

  // If Player 1 is a robot, initiate its turn!
  const firstPlayer = players[0];
  if (firstPlayer && firstPlayer.type === 'robot') {
    if (rollBtn) rollBtn.disabled = true;
    robotTurnTimer = setTimeout(() => {
      executeRobotTurn();
    }, 750);
  }
}

/**
 * ========================================================
 * PHASE 7: PROCEDURAL RANDOM LAYOUT GENERATOR (EQUAL COUNTS)
 * Generates N snakes and N ladders (N in 6..8) obeying all rules:
 * - Square 1 and 100 never used
 * - All squares strictly disjoint (no collisions)
 * - Ladders climb (end > start), snakes slide (start > end)
 * - Jump lengths between 12 and 55 squares
 * ========================================================
 */
function generateRandomLayout(count = 7) {
  const SNAKE_COLORS = [
    '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#06b6d4', '#ec4899', '#84cc16', '#dc2626',
  ];

  for (let attempt = 0; attempt < 250; attempt++) {
    const usedSquares = new Set([1, 100]);
    const ladders = [];
    const snakes = [];

    // Ladder start buckets distributed evenly across tiers
    const ladderStartBuckets = [];
    if (count === 6) {
      ladderStartBuckets.push([2, 28], [2, 28], [29, 55], [29, 55], [56, 78], [56, 78]);
    } else if (count === 7) {
      ladderStartBuckets.push([2, 25], [10, 32], [28, 48], [38, 58], [48, 68], [60, 75], [70, 80]);
    } else { // 8
      ladderStartBuckets.push([2, 22], [10, 30], [25, 42], [35, 52], [45, 62], [55, 72], [65, 78], [72, 82]);
    }

    let ladderSuccess = true;
    for (let i = 0; i < count; i++) {
      const [bMin, bMax] = ladderStartBuckets[i];
      let placed = false;
      for (let t = 0; t < 60; t++) {
        const start = Math.floor(Math.random() * (bMax - bMin + 1)) + bMin;
        if (usedSquares.has(start)) continue;
        const startRow = Math.floor((start - 1) / 10);

        const minSpan = Math.max(12, (startRow + 1) * 10 + 1 - start);
        const maxSpan = Math.min(55, 99 - start);
        if (minSpan > maxSpan) continue;

        const span = Math.floor(Math.random() * (maxSpan - minSpan + 1)) + minSpan;
        const end = start + span;
        if (end >= 100 || usedSquares.has(end)) continue;

        const endRow = Math.floor((end - 1) / 10);
        if (endRow <= startRow) continue; // Must climb at least one row

        usedSquares.add(start);
        usedSquares.add(end);
        ladders.push({ start, end });
        placed = true;
        break;
      }
      if (!placed) {
        ladderSuccess = false;
        break;
      }
    }
    if (!ladderSuccess) continue;

    // Snake head buckets distributed across upper/mid tiers
    const snakeHeadBuckets = [];
    if (count === 6) {
      snakeHeadBuckets.push([25, 45], [35, 58], [52, 75], [65, 85], [78, 95], [88, 99]);
    } else if (count === 7) {
      snakeHeadBuckets.push([24, 42], [35, 52], [45, 65], [58, 76], [68, 86], [78, 94], [88, 99]);
    } else { // 8
      snakeHeadBuckets.push([22, 38], [32, 48], [42, 58], [52, 68], [62, 78], [72, 86], [82, 94], [90, 99]);
    }

    let snakeSuccess = true;
    for (let i = 0; i < count; i++) {
      const [hMin, hMax] = snakeHeadBuckets[i];
      let placed = false;
      for (let t = 0; t < 60; t++) {
        const head = Math.floor(Math.random() * (hMax - hMin + 1)) + hMin;
        if (usedSquares.has(head)) continue;
        const headRow = Math.floor((head - 1) / 10);
        if (headRow === 0) continue; // Snake heads cannot be on row 1

        const maxTail = headRow * 10;
        const minDrop = Math.max(12, head - maxTail);
        const maxDrop = Math.min(55, head - 2);
        if (minDrop > maxDrop) continue;

        const drop = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
        const tail = head - drop;
        if (tail <= 1 || usedSquares.has(tail)) continue;

        const tailRow = Math.floor((tail - 1) / 10);
        if (tailRow >= headRow) continue; // Must slide down at least one row

        usedSquares.add(head);
        usedSquares.add(tail);
        snakes.push({
          start: head,
          end: tail,
          color: SNAKE_COLORS[i % SNAKE_COLORS.length],
        });
        placed = true;
        break;
      }
      if (!placed) {
        snakeSuccess = false;
        break;
      }
    }
    if (!snakeSuccess) continue;

    ladders.sort((a, b) => a.start - b.start);
    snakes.sort((a, b) => a.start - b.start);

    return { ladders, snakes };
  }

  // Fallback to classic preset
  return {
    ladders: [...CLASSIC_LAYOUTS[count].ladders],
    snakes: [...CLASSIC_LAYOUTS[count].snakes],
  };
}

/**
 * Applies a new board layout, updates lookups, redraws the board, SVG, pills, and pegs.
 */
function applyBoardLayout(ladders, snakes, isRandom = true) {
  activeLadders = ladders;
  activeSnakes = snakes;
  window.isCustomLayout = isRandom;
  updateLayoutMaps();

  // If a game was active, reset pegs to Square 1
  const gameActive = players.some(p => p.position > 1) || diceRolled;
  if (gameActive) {
    resetGame(true);
  }

  clearHighlight();
  clearTargetSquareHighlight();

  renderBoard();
  drawLaddersAndSnakes();
  renderSidebarPills();
  renderPegs();

  // Update layout status text in sidebar
  const statusEl = document.getElementById('layout-status-text');
  if (statusEl) {
    const layoutType = isRandom ? 'Randomized' : 'Classic';
    statusEl.innerHTML = `Layout: <strong>${activeLadders.length} Ladders</strong> &bull; <strong>${activeSnakes.length} Snakes</strong> (${layoutType}, Equal)`;
  }

  if (isRandom) {
    setLog(`🎲 <strong>Board Randomized!</strong> Generated <strong>${activeLadders.length} Ladders</strong> &bull; <strong>${activeSnakes.length} Snakes</strong> (Equal). Preview the board above!`);
  } else {
    setLog(`🔄 Restored <strong>Classic Board Layout</strong> (${activeLadders.length} Ladders &bull; ${activeSnakes.length} Snakes, Equal).`);
  }

  saveGameState();
}

/**
 * Generates a fresh random layout using the selected pair count.
 */
function randomizeBoard(count) {
  const targetCount = count || selectedPairCount;
  const layout = generateRandomLayout(targetCount);
  applyBoardLayout(layout.ladders, layout.snakes, true);
}

/**
 * Restores the classic handcrafted layout for the selected pair count.
 */
function resetToClassicLayout() {
  const layout = CLASSIC_LAYOUTS[selectedPairCount] || CLASSIC_LAYOUTS[7];
  applyBoardLayout([...layout.ladders], [...layout.snakes], false);
}

/**
 * Sets the equal pairs count (6, 7, or 8) and regenerates the board.
 */
function setPairCount(count) {
  if (count < 6 || count > 8) return;
  selectedPairCount = count;

  // Update UI active buttons
  [6, 7, 8].forEach(c => {
    const btn = document.getElementById(`btn-count-${c}`);
    if (btn) {
      if (c === count) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  randomizeBoard(selectedPairCount);
}

/**
 * Renders the live tournament standings in the sidebar.
 */
function renderLiveRankings() {
  const listEl = document.getElementById('live-rankings-list');
  const countEl = document.getElementById('active-players-count');
  if (!listEl) return;

  listEl.innerHTML = '';
  const remainingCount = players.filter(p => !p.isFinished).length;
  if (countEl) {
    countEl.textContent = `${remainingCount} in race &bull; ${finishedRankings.length} finished`;
  }

  // Render Finished Players first
  finishedRankings.forEach(entry => {
    const item = document.createElement('div');
    const medalClass = entry.rank === 1 ? 'finished-gold' : entry.rank === 2 ? 'finished-silver' : 'finished-bronze';
    const typeIcon = entry.player.type === 'robot' ? '🤖' : '👤';
    item.className = `ranking-item ${medalClass}`;
    item.innerHTML = `
      <span class="ranking-badge">${getMedalIcon(entry.rank)}</span>
      <span class="ranking-player-name" style="color: ${entry.player.color};"><strong>${typeIcon} ${entry.player.name}</strong></span>
      <span class="ranking-status">${getRankTitle(entry.rank)}</span>
    `;
    listEl.appendChild(item);
  });

  // Render Still Racing Players sorted by highest square
  const activeSorted = [...players.filter(p => !p.isFinished)].sort((a, b) => b.position - a.position);
  activeSorted.forEach(p => {
    const item = document.createElement('div');
    const typeIcon = p.type === 'robot' ? '🤖' : '👤';
    item.className = 'ranking-item';
    item.innerHTML = `
      <span class="ranking-badge" style="color: ${p.color};">#${p.id}</span>
      <span class="ranking-player-name">${typeIcon} ${p.name}</span>
      <span class="ranking-status">Square ${p.position}</span>
    `;
    listEl.appendChild(item);
  });
}

function getMedalIcon(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '🏅';
}

function getRankTitle(rank) {
  if (rank === 1) return '1st Place';
  if (rank === 2) return '2nd Place';
  if (rank === 3) return '3rd Place';
  return `${rank}th Place`;
}

/**
 * ========================================================
 * PHASE 9: PEG-FOCUSED VIEW & ZOOM CONTROLS
 * Enlarges and illuminates the active player's peg,
 * smoothly scrolls/centers the board, and manages zoom.
 * ========================================================
 */
let focusModeEnabled = true;
let boardZoomLevel = 1.0;

function focusActivePeg(smooth = true) {
  // Clear existing active square highlights
  document.querySelectorAll('.square.has-active-turn-peg').forEach(el => {
    el.classList.remove('has-active-turn-peg');
  });

  const activePlayer = players[currentPlayerIndex];
  if (!activePlayer) return;

  const squareEl = document.getElementById(`square-${activePlayer.position}`);
  if (squareEl) {
    squareEl.classList.add('has-active-turn-peg');
    squareEl.style.setProperty('--peg-active-color', activePlayer.color);

    // Update toolbar focus chip
    const chipText = document.getElementById('focus-chip-text');
    if (chipText) {
      const posText = activePlayer.position === 100 ? 'Goal 🏆' : `Square ${activePlayer.position}`;
      const typeIcon = activePlayer.type === 'robot' ? '🤖' : '👤';
      chipText.innerHTML = `Focus: <strong style="color:${activePlayer.color};">${typeIcon} ${activePlayer.name}</strong> (${posText})`;
    }

    // Auto-scroll / smooth pan to the active peg
    if (focusModeEnabled && typeof squareEl.scrollIntoView === 'function') {
      squareEl.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center',
        inline: 'center',
      });
    }
  }

  // Update mobile floating dock
  const dockAvatar = document.getElementById('mobile-dock-avatar');
  const dockName = document.getElementById('mobile-dock-name');
  const dockSq = document.getElementById('mobile-dock-sq');
  const mobileRollBtn = document.getElementById('btn-mobile-roll');
  const mainRollBtn = document.getElementById('btn-roll-dice');

  if (dockAvatar) {
    dockAvatar.textContent = activePlayer.type === 'robot' ? '🤖' : activePlayer.id;
    dockAvatar.style.backgroundColor = activePlayer.color;
  }
  if (dockName) {
    dockName.textContent = `${activePlayer.name}'s Turn`;
  }
  if (dockSq) {
    dockSq.textContent = activePlayer.position === 100 ? 'Goal 🏆' : `Square ${activePlayer.position}`;
  }
  if (mobileRollBtn) {
    if (mainRollBtn) {
      mobileRollBtn.disabled = mainRollBtn.disabled;
    } else {
      mobileRollBtn.disabled = tournamentOver || isAnimatingMove || activePlayer.type === 'robot';
    }
  }
}

function setBoardZoom(level) {
  const clamped = Math.max(1.0, Math.min(1.75, Math.round(level * 100) / 100));
  boardZoomLevel = clamped;

  const container = document.getElementById('board-zoom-container');
  const frame = document.getElementById('board-frame');
  const textEl = document.getElementById('zoom-text');

  if (container) {
    container.style.width = `${Math.round(clamped * 100)}%`;
    container.style.height = `${Math.round(clamped * 100)}%`;
  }

  if (frame) {
    if (clamped > 1.0) {
      frame.classList.add('is-zoomed');
    } else {
      frame.classList.remove('is-zoomed');
    }
  }

  if (textEl) {
    textEl.textContent = `${Math.round(clamped * 100)}%`;
  }

  focusActivePeg(true);
  saveGameState();
}

function togglePegFocus() {
  focusModeEnabled = !focusModeEnabled;
  const btn = document.getElementById('btn-toggle-focus');
  const label = document.getElementById('focus-btn-label');

  if (btn) {
    if (focusModeEnabled) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
  if (label) {
    label.textContent = focusModeEnabled ? 'Peg Focus: ON' : 'Peg Focus: OFF';
  }

  if (focusModeEnabled) {
    focusActivePeg(true);
    setLog(`🎯 <strong>Peg Focus Enabled:</strong> Board automatically tracks and centers on the current active player.`);
  } else {
    setLog(`🎯 <strong>Peg Focus Disabled:</strong> Manual board navigation.`);
  }

  saveGameState();
}

/**
 * Inspects a specific player's peg.
 */
function inspectPeg(player) {
  clearHighlight();
  const squareEl = document.getElementById(`square-${player.position}`);
  if (squareEl) squareEl.classList.add('highlight-source');

  const inspectorOutput = document.getElementById('inspector-output');
  if (inspectorOutput) {
    const typeDesc = player.type === 'robot' ? '🤖 Robot' : '👤 Human';
    const statusText = player.isFinished ? ` &bull; <strong>Finished (${getRankTitle(player.rank)})</strong>` : '';
    inspectorOutput.innerHTML = `<strong>Peg: ${player.name}</strong> (${typeDesc}, #${player.id}) — Square <strong>${player.position}</strong> &bull; Colour: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${player.color};vertical-align:middle;margin:0 2px;"></span> <code>${player.color}</code>${statusText}`;
  }
}

/**
 * ========================================================
 * PHASE 8: PLAYERS STATUS VIEW TABLE (SEPARATE TAB / PANEL)
 * A live table listing Player Name, Type (Human/Robot),
 * Colour, and Current Square Number. Updates after every move.
 * ========================================================
 */
let activeSidebarTab = 'panel-game';

function switchSidebarTab(targetPanelId) {
  activeSidebarTab = targetPanelId;

  // Update tab buttons
  document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
    const isTarget = btn.dataset.tab === targetPanelId;
    if (isTarget) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // Update tab panels
  const panels = ['panel-game', 'panel-players-view', 'panel-setup'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === targetPanelId) ? 'flex' : 'none';
    }
  });

  if (targetPanelId === 'panel-players-view') {
    renderPlayersStatusTable();
  }

  saveGameState();
}

function renderPlayersStatusTable() {
  const tbody = document.getElementById('players-table-body');
  const countBadge = document.getElementById('tab-players-count');
  const totalCountEl = document.getElementById('table-total-count');
  const leaderTextEl = document.getElementById('table-leader-text');
  const turnPlayerNameEl = document.getElementById('table-turn-player-name');
  const turnPlayerSqEl = document.getElementById('table-turn-player-sq');
  const tableRollBtn = document.getElementById('btn-table-roll');
  const mainRollBtn = document.getElementById('btn-roll-dice');

  if (countBadge) {
    countBadge.textContent = players.length;
  }

  const activePlayer = players[currentPlayerIndex];

  // Sync turn bar inside players table
  if (turnPlayerNameEl) {
    if (tournamentOver) {
      turnPlayerNameEl.textContent = 'Tournament Complete!';
    } else if (activePlayer) {
      const typeTag = activePlayer.type === 'robot' ? ' 🤖' : ' 👤';
      turnPlayerNameEl.textContent = `${activePlayer.name}${typeTag}`;
    }
  }

  if (turnPlayerSqEl) {
    if (tournamentOver) {
      turnPlayerSqEl.textContent = '';
    } else if (activePlayer) {
      turnPlayerSqEl.textContent = activePlayer.position === 100 ? '(Goal 🏆)' : `(Square ${activePlayer.position})`;
    }
  }

  if (tableRollBtn) {
    if (mainRollBtn) {
      tableRollBtn.disabled = mainRollBtn.disabled;
    } else {
      tableRollBtn.disabled = tournamentOver || isAnimatingMove || (activePlayer && activePlayer.type === 'robot');
    }
  }

  if (totalCountEl) {
    const activeCount = players.filter(p => !p.isFinished).length;
    totalCountEl.innerHTML = `Total: <strong>${players.length} Players</strong> (${activeCount} racing)`;
  }

  if (leaderTextEl && players.length > 0) {
    const maxSq = Math.max(...players.map(p => p.position));
    const leaders = players.filter(p => p.position === maxSq);
    const leaderNames = leaders.map(p => p.name).join(', ');
    leaderTextEl.innerHTML = `Race Leader: <strong>Square ${maxSq}</strong> (${leaderNames})`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  players.forEach((player) => {
    const tr = document.createElement('tr');
    tr.dataset.playerId = player.id;

    const isCurrent = (!tournamentOver && activePlayer && player.id === activePlayer.id && !player.isFinished);
    if (isCurrent) {
      tr.classList.add('active-turn-row');
    }
    if (player.isFinished) {
      tr.classList.add('finished-row');
    }

    // 1. Column: # Turn Marker / Avatar
    const tdMarker = document.createElement('td');
    tdMarker.style.textAlign = 'center';
    const marker = document.createElement('span');
    marker.className = 'tbl-turn-marker';
    marker.style.backgroundColor = player.color;
    marker.textContent = player.isFinished ? getMedalIcon(player.rank) : (player.type === 'robot' ? '🤖' : player.id);
    tdMarker.appendChild(marker);
    tr.appendChild(tdMarker);

    // 2. Column: Player Name
    const tdName = document.createElement('td');
    const nameCell = document.createElement('div');
    nameCell.className = 'tbl-player-cell';
    nameCell.innerHTML = `
      <span style="width:10px;height:10px;border-radius:50%;background:${player.color};display:inline-block;flex-shrink:0;"></span>
      <strong>${player.name}</strong>
      ${isCurrent ? '<span title="Currently active turn">🎲</span>' : ''}
    `;
    tdName.appendChild(nameCell);
    tr.appendChild(tdName);

    // 3. Column: Type (Human / Robot)
    const tdType = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = `tbl-type-badge ${player.type === 'robot' ? 'type-robot' : 'type-human'}`;
    typeBadge.textContent = player.type === 'robot' ? '🤖 Robot' : '👤 Human';
    tdType.appendChild(typeBadge);
    tr.appendChild(tdType);

    // 4. Column: Colour
    const tdColor = document.createElement('td');
    const colorCell = document.createElement('div');
    colorCell.className = 'tbl-color-cell';
    colorCell.innerHTML = `
      <span class="tbl-color-swatch" style="background:${player.color};"></span>
      <code>${player.color}</code>
    `;
    tdColor.appendChild(colorCell);
    tr.appendChild(tdColor);

    // 5. Column: Current Square & Progress
    const tdSquare = document.createElement('td');
    const squareCell = document.createElement('div');
    squareCell.className = 'tbl-square-cell';
    const sqDisplay = player.position === 100 ? '100 (Goal 🏆)' : `${player.position} / 100`;
    squareCell.innerHTML = `
      <span class="tbl-sq-num">Square ${sqDisplay}</span>
      <div class="tbl-progress-bar" title="${player.position}% towards goal">
        <div class="tbl-progress-fill" style="width: ${player.position}%; background: ${player.color};"></div>
      </div>
    `;
    tdSquare.appendChild(squareCell);
    tr.appendChild(tdSquare);

    // 6. Column: Status
    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    if (player.isFinished) {
      statusBadge.className = 'tbl-status-badge tbl-status-finished';
      statusBadge.textContent = `${getMedalIcon(player.rank)} ${getRankTitle(player.rank)}`;
    } else if (isCurrent) {
      statusBadge.className = 'tbl-status-badge tbl-status-turn';
      statusBadge.textContent = 'Active Turn 🎲';
    } else {
      statusBadge.className = 'tbl-status-badge tbl-status-racing';
      statusBadge.textContent = `Racing 🏃 (${100 - player.position} left)`;
    }
    tdStatus.appendChild(statusBadge);
    tr.appendChild(tdStatus);

    // Row click: inspect peg on board
    tr.addEventListener('click', () => {
      inspectPeg(player);
    });

    tbody.appendChild(tr);
  });
}

/**
 * Renders the player rows in the sidebar manager.
 * Includes player type toggle (👤 Human / 🤖 Bot).
 */
function renderPlayersList() {
  const listEl = document.getElementById('players-list');
  const countBadge = document.getElementById('players-count-badge');
  if (!listEl) return;

  listEl.innerHTML = '';
  if (countBadge) {
    countBadge.textContent = `${players.length} Player${players.length === 1 ? '' : 's'}`;
  }

  players.forEach(player => {
    const row = document.createElement('div');
    row.className = `player-row ${player.isFinished ? 'is-finished' : ''}`;
    row.dataset.playerId = player.id;

    // Avatar preview
    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.backgroundColor = player.color;
    avatar.textContent = player.type === 'robot' ? '🤖' : player.id;
    row.appendChild(avatar);

    // Player Type Toggle (Human / Robot)
    const typeBtn = document.createElement('button');
    typeBtn.type = 'button';
    typeBtn.className = `player-type-toggle ${player.type === 'robot' ? 'type-robot' : ''}`;
    typeBtn.innerHTML = player.type === 'robot' ? '🤖 Bot' : '👤 Human';
    typeBtn.title = `Switch between Human and Robot (currently ${player.type})`;
    typeBtn.disabled = player.isFinished;
    typeBtn.addEventListener('click', () => {
      togglePlayerType(player.id);
    });
    row.appendChild(typeBtn);

    // Name text input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'player-name-input';
    nameInput.value = player.name;
    nameInput.maxLength = 15;
    nameInput.title = 'Edit player name';
    nameInput.disabled = player.isFinished;
    nameInput.addEventListener('input', (e) => {
      player.name = e.target.value.trim() || `${player.type === 'robot' ? 'Robot' : 'Player'} ${player.id}`;
      updateTurnUI();
      renderPegs();
      renderLiveRankings();
      renderPlayersStatusTable();
      saveGameState();
    });
    row.appendChild(nameInput);

    // Color picker
    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'color-picker-wrapper';
    colorWrapper.title = 'Pick peg colour';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'player-color-input';
    colorInput.value = player.color;
    colorInput.disabled = player.isFinished;
    colorInput.addEventListener('input', (e) => {
      player.color = e.target.value;
      avatar.style.backgroundColor = player.color;
      updateTurnUI();
      renderPegs();
      renderLiveRankings();
      renderPlayersStatusTable();
      saveGameState();
    });
    colorWrapper.appendChild(colorInput);
    row.appendChild(colorWrapper);

    // Current square badge / Finished badge
    const sqBadge = document.createElement('span');
    if (player.isFinished) {
      sqBadge.className = 'player-sq-badge badge-finished';
      sqBadge.textContent = `${getMedalIcon(player.rank)} ${getRankTitle(player.rank)}`;
    } else {
      sqBadge.className = 'player-sq-badge';
      sqBadge.textContent = `Sq ${player.position}`;
    }
    row.appendChild(sqBadge);

    // Remove player button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-player';
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Remove player';
    removeBtn.disabled = (players.length <= 1 || player.isFinished);
    removeBtn.addEventListener('click', () => {
      removePlayer(player.id);
    });
    row.appendChild(removeBtn);

    listEl.appendChild(row);
  });
}

/**
 * Toggles a player between Human and Robot.
 */
function togglePlayerType(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player || player.isFinished) return;

  const wasRobot = player.type === 'robot';
  player.type = wasRobot ? 'human' : 'robot';

  // If name was a default name, update it neatly
  if (wasRobot && player.name.startsWith('Robot')) {
    player.name = `Player ${player.id}`;
  } else if (!wasRobot && player.name.startsWith('Player')) {
    player.name = `Robot ${player.id}`;
  }

  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  updateTurnUI();
  saveGameState();

  // If this player is currently the active player
  const activePlayer = players[currentPlayerIndex];
  if (activePlayer && activePlayer.id === player.id) {
    const rollBtn = document.getElementById('btn-roll-dice');

    if (player.type === 'robot') {
      if (rollBtn) rollBtn.disabled = true;
      if (!diceRolled && !isAnimatingMove) {
        setLog(`🤖 Switched <strong>${player.name}</strong> to Robot. Taking turn automatically...`);
        if (robotTurnTimer) clearTimeout(robotTurnTimer);
        robotTurnTimer = setTimeout(() => {
          executeRobotTurn();
        }, 750);
      }
    } else {
      if (robotTurnTimer) {
        clearTimeout(robotTurnTimer);
        robotTurnTimer = null;
      }
      if (!diceRolled) {
        if (rollBtn) rollBtn.disabled = false;
        setLog(`👤 Switched <strong>${player.name}</strong> to Human. Click <strong>Roll Dice</strong> to take your turn!`);
      }
    }
  }
}

/**
 * Adds a new player to the tournament (Human or Robot).
 */
function addPlayer(type = 'human') {
  const colorIndex = (nextPlayerId - 1) % PRESET_COLORS.length;
  const newColor = PRESET_COLORS[colorIndex];
  const isBot = type === 'robot';

  const defaultName = isBot ? `Robot ${nextRobotNumber++}` : `Player ${nextHumanNumber++}`;

  const newPlayer = {
    id: nextPlayerId,
    name: defaultName,
    type: type,
    color: newColor,
    position: 1,
    isFinished: false,
    rank: null,
  };
  nextPlayerId++;
  players.push(newPlayer);

  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  updateTurnUI();
  saveGameState();
  inspectPeg(newPlayer);

  setLog(`✨ Added ${isBot ? '🤖 Robot' : '👤 Human'} <strong>${newPlayer.name}</strong> to the tournament!`);
}

/**
 * Convenience helper to add a robot player.
 */
function addRobot() {
  addPlayer('robot');
}

/**
 * Removes a player by ID.
 */
function removePlayer(playerId) {
  if (players.length <= 1) return;

  if (robotTurnTimer) {
    clearTimeout(robotTurnTimer);
    robotTurnTimer = null;
  }

  players = players.filter(p => p.id !== playerId);
  finishedRankings = finishedRankings.filter(f => f.player.id !== playerId);

  if (currentPlayerIndex >= players.length) {
    currentPlayerIndex = 0;
  }

  updateTurnUI();
  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  saveGameState();
  clearHighlight();

  // If the new active player is a robot, trigger its turn
  const activePlayer = players[currentPlayerIndex];
  if (activePlayer && activePlayer.type === 'robot' && !tournamentOver) {
    const rollBtn = document.getElementById('btn-roll-dice');
    if (rollBtn) rollBtn.disabled = true;
    robotTurnTimer = setTimeout(() => {
      executeRobotTurn();
    }, 750);
  }
}

/**
 * Draws a ladder in SVG.
 */
function drawLadder(ladder) {
  const p1 = getSquareCenter(ladder.start);
  const p2 = getSquareCenter(ladder.end);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const hw = 12;

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'ladder-element');
  group.id = `ladder-elem-${ladder.start}-${ladder.end}`;
  group.setAttribute('data-start', ladder.start);
  group.setAttribute('data-end', ladder.end);
  if (group.dataset) {
    group.dataset.start = ladder.start;
    group.dataset.end = ladder.end;
  }

  const rungSpacing = 28;
  const rungCount = Math.max(2, Math.floor((len - 30) / rungSpacing));
  const step = (len - 36) / (rungCount + 1);

  for (let i = 1; i <= rungCount; i++) {
    const dist = 18 + i * step;
    const cx = p1.x + ux * dist;
    const cy = p1.y + uy * dist;

    const rShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rShadow.setAttribute('x1', (cx - nx * hw + 1.5).toFixed(1));
    rShadow.setAttribute('y1', (cy - ny * hw + 3).toFixed(1));
    rShadow.setAttribute('x2', (cx + nx * hw + 1.5).toFixed(1));
    rShadow.setAttribute('y2', (cy + ny * hw + 3).toFixed(1));
    rShadow.setAttribute('stroke', 'rgba(0, 0, 0, 0.22)');
    rShadow.setAttribute('stroke-width', '4');
    rShadow.setAttribute('stroke-linecap', 'round');
    group.appendChild(rShadow);

    const rLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rLine.setAttribute('x1', (cx - nx * hw).toFixed(1));
    rLine.setAttribute('y1', (cy - ny * hw).toFixed(1));
    rLine.setAttribute('x2', (cx + nx * hw).toFixed(1));
    rLine.setAttribute('y2', (cy + ny * hw).toFixed(1));
    rLine.setAttribute('stroke', '#d97706');
    rLine.setAttribute('stroke-width', '4');
    rLine.setAttribute('stroke-linecap', 'round');
    group.appendChild(rLine);
  }

  [-1, 1].forEach(side => {
    const railShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    railShadow.setAttribute('x1', (p1.x + side * nx * hw + 1.5).toFixed(1));
    railShadow.setAttribute('y1', (p1.y + side * ny * hw + 3).toFixed(1));
    railShadow.setAttribute('x2', (p2.x + side * nx * hw + 1.5).toFixed(1));
    railShadow.setAttribute('y2', (p2.y + side * ny * hw + 3).toFixed(1));
    railShadow.setAttribute('stroke', 'rgba(0, 0, 0, 0.25)');
    railShadow.setAttribute('stroke-width', '5.5');
    railShadow.setAttribute('stroke-linecap', 'round');
    group.appendChild(railShadow);

    const rail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rail.setAttribute('x1', (p1.x + side * nx * hw).toFixed(1));
    rail.setAttribute('y1', (p1.y + side * ny * hw).toFixed(1));
    rail.setAttribute('x2', (p2.x + side * nx * hw).toFixed(1));
    rail.setAttribute('y2', (p2.y + side * ny * hw).toFixed(1));
    rail.setAttribute('stroke', '#92400e');
    rail.setAttribute('stroke-width', '5.5');
    rail.setAttribute('stroke-linecap', 'round');
    group.appendChild(rail);

    const railInner = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    railInner.setAttribute('x1', (p1.x + side * nx * hw).toFixed(1));
    railInner.setAttribute('y1', (p1.y + side * ny * hw).toFixed(1));
    railInner.setAttribute('x2', (p2.x + side * nx * hw).toFixed(1));
    railInner.setAttribute('y2', (p2.y + side * ny * hw).toFixed(1));
    railInner.setAttribute('stroke', '#fef3c7');
    railInner.setAttribute('stroke-opacity', '0.45');
    railInner.setAttribute('stroke-width', '1.5');
    railInner.setAttribute('stroke-linecap', 'round');
    group.appendChild(railInner);
  });

  return group;
}

/**
 * Draws a snake in SVG.
 */
function drawSnake(snake) {
  const p1 = getSquareCenter(snake.start);
  const p2 = getSquareCenter(snake.end);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const steps = 18;
  const waves = Math.max(2, Math.round(len / 120));
  const maxAmp = Math.min(26, len * 0.16);
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const envelope = Math.sin(t * Math.PI);
    const wave = Math.sin(t * waves * 2 * Math.PI);
    const offset = envelope * wave * maxAmp;
    points.push({
      x: p1.x + ux * len * t + nx * offset,
      y: p1.y + uy * len * t + ny * offset,
    });
  }

  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1c = points[i];
    const p2c = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2c;

    const cp1x = p1c.x + (p2c.x - p0.x) / 6;
    const cp1y = p1c.y + (p2c.y - p0.y) / 6;
    const cp2x = p2c.x - (p3.x - p1c.x) / 6;
    const cp2y = p2c.y - (p3.y - p1c.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2c.x.toFixed(1)} ${p2c.y.toFixed(1)}`;
  }

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'snake-element');
  group.id = `snake-elem-${snake.start}-${snake.end}`;
  group.setAttribute('data-start', snake.start);
  group.setAttribute('data-end', snake.end);
  if (group.dataset) {
    group.dataset.start = snake.start;
    group.dataset.end = snake.end;
  }

  const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shadow.setAttribute('d', pathD);
  shadow.setAttribute('fill', 'none');
  shadow.setAttribute('stroke', 'rgba(0, 0, 0, 0.22)');
  shadow.setAttribute('stroke-width', '18');
  shadow.setAttribute('stroke-linecap', 'round');
  shadow.setAttribute('stroke-linejoin', 'round');
  shadow.setAttribute('transform', 'translate(2, 4)');
  group.appendChild(shadow);

  const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  body.setAttribute('d', pathD);
  body.setAttribute('fill', 'none');
  body.setAttribute('stroke', snake.color || '#10b981');
  body.setAttribute('stroke-width', '16');
  body.setAttribute('stroke-linecap', 'round');
  body.setAttribute('stroke-linejoin', 'round');
  group.appendChild(body);

  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pattern.setAttribute('d', pathD);
  pattern.setAttribute('fill', 'none');
  pattern.setAttribute('stroke', '#ffffff');
  pattern.setAttribute('stroke-opacity', '0.45');
  pattern.setAttribute('stroke-width', '5');
  pattern.setAttribute('stroke-linecap', 'round');
  pattern.setAttribute('stroke-dasharray', '8 10');
  group.appendChild(pattern);

  const vfx = points[0].x - points[1].x;
  const vfy = points[0].y - points[1].y;
  const vlen = Math.hypot(vfx, vfy) || 1;
  const hx = vfx / vlen;
  const hy = vfy / vlen;
  const hnx = -hy;
  const hny = hx;

  const headGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const tStartX = points[0].x + hx * 9;
  const tStartY = points[0].y + hy * 9;
  const tMidX = points[0].x + hx * 19;
  const tMidY = points[0].y + hy * 19;
  const tLeftX = tMidX + (hx * 5 + hnx * 4);
  const tLeftY = tMidY + (hy * 5 + hny * 4);
  const tRightX = tMidX + (hx * 5 - hnx * 4);
  const tRightY = tMidY + (hy * 5 - hny * 4);

  const tonguePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tonguePath.setAttribute('d', `M ${tStartX.toFixed(1)} ${tStartY.toFixed(1)} L ${tMidX.toFixed(1)} ${tMidY.toFixed(1)} M ${tMidX.toFixed(1)} ${tMidY.toFixed(1)} L ${tLeftX.toFixed(1)} ${tLeftY.toFixed(1)} M ${tMidX.toFixed(1)} ${tMidY.toFixed(1)} L ${tRightX.toFixed(1)} ${tRightY.toFixed(1)}`);
  tonguePath.setAttribute('stroke', '#ef4444');
  tonguePath.setAttribute('stroke-width', '2');
  tonguePath.setAttribute('stroke-linecap', 'round');
  headGroup.appendChild(tonguePath);

  const headCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  headCircle.setAttribute('cx', points[0].x.toFixed(1));
  headCircle.setAttribute('cy', points[0].y.toFixed(1));
  headCircle.setAttribute('r', '13');
  headCircle.setAttribute('fill', snake.color || '#10b981');
  headCircle.setAttribute('stroke', '#00000025');
  headCircle.setAttribute('stroke-width', '1.5');
  headGroup.appendChild(headCircle);

  [-1, 1].forEach(side => {
    const eyeX = points[0].x + hnx * (side * 5.2) + hx * 2.5;
    const eyeY = points[0].y + hny * (side * 5.2) + hy * 2.5;
    const pupilX = eyeX + hx * 1.2;
    const pupilY = eyeY + hy * 1.2;

    const eyeWhite = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eyeWhite.setAttribute('cx', eyeX.toFixed(1));
    eyeWhite.setAttribute('cy', eyeY.toFixed(1));
    eyeWhite.setAttribute('r', '3.8');
    eyeWhite.setAttribute('fill', '#ffffff');
    eyeWhite.setAttribute('stroke', '#00000033');
    eyeWhite.setAttribute('stroke-width', '0.8');
    headGroup.appendChild(eyeWhite);

    const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupil.setAttribute('cx', pupilX.toFixed(1));
    pupil.setAttribute('cy', pupilY.toFixed(1));
    pupil.setAttribute('r', '2');
    pupil.setAttribute('fill', '#0f172a');
    headGroup.appendChild(pupil);
  });

  group.appendChild(headGroup);

  const tailTip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  tailTip.setAttribute('cx', points[steps].x.toFixed(1));
  tailTip.setAttribute('cy', points[steps].y.toFixed(1));
  tailTip.setAttribute('r', '5.5');
  tailTip.setAttribute('fill', snake.color || '#10b981');
  tailTip.setAttribute('stroke', '#ffffff44');
  tailTip.setAttribute('stroke-width', '1.5');
  group.appendChild(tailTip);

  return group;
}

/**
 * Draws all ladders and snakes into the SVG overlay with smooth shuffle animation.
 */
function drawLaddersAndSnakes() {
  const laddersGroup = document.getElementById('ladders-group');
  const snakesGroup = document.getElementById('snakes-group');
  const boardSvg = document.getElementById('board-svg');
  if (!laddersGroup || !snakesGroup) return;

  if (boardSvg) {
    boardSvg.classList.remove('animating-shuffle');
    void boardSvg.offsetWidth; // Reflow
    boardSvg.classList.add('animating-shuffle');
  }

  laddersGroup.innerHTML = '';
  snakesGroup.innerHTML = '';

  activeLadders.forEach(ladder => {
    laddersGroup.appendChild(drawLadder(ladder));
  });

  activeSnakes.forEach(snake => {
    snakesGroup.appendChild(drawSnake(snake));
  });
}

/**
 * Inspects square and highlights connections.
 */
function handleSquareHover(squareNum) {
  const inspectorOutput = document.getElementById('inspector-output');
  const coords = getSquareCoordinates(squareNum);
  const direction = coords.isLeftToRight ? 'Left ➡️ Right' : 'Right ⬅️ Left';

  clearHighlight();

  const squareEl = document.getElementById(`square-${squareNum}`);
  if (squareEl) {
    squareEl.classList.add('highlight-source');
  }

  const playersHere = players.filter(p => p.position === squareNum);
  let pegInfo = '';
  if (playersHere.length > 0) {
    const names = playersHere.map(p => {
      const typeIcon = p.type === 'robot' ? '🤖' : '👤';
      const finishText = p.isFinished ? ` (${getMedalIcon(p.rank)})` : '';
      return `<strong style="color:${p.color};">${typeIcon} ${p.name}</strong>${finishText}`;
    }).join(', ');
    pegInfo = ` &bull; 👥 Pegs here: ${names}`;
  }

  if (laddersByStart.has(squareNum)) {
    const l = laddersByStart.get(squareNum);
    highlightLadder(l);
    if (inspectorOutput) {
      inspectorOutput.innerHTML = `<strong>🪜 Ladder Start (Square ${squareNum})</strong> ➔ Climbs UP to <strong>Square ${l.end}</strong> (+${l.end - squareNum})${pegInfo}`;
    }
    return;
  }

  if (laddersByEnd.has(squareNum)) {
    const l = laddersByEnd.get(squareNum);
    highlightLadder(l);
    if (inspectorOutput) {
      inspectorOutput.innerHTML = `<strong>🪜 Ladder Top (Square ${squareNum})</strong> ➔ Climbed from <strong>Square ${l.start}</strong> (+${squareNum - l.start})${pegInfo}`;
    }
    return;
  }

  if (snakesByStart.has(squareNum)) {
    const s = snakesByStart.get(squareNum);
    highlightSnake(s);
    if (inspectorOutput) {
      inspectorOutput.innerHTML = `<strong>🐍 Snake Head (Square ${squareNum})</strong> ➔ Slides DOWN to <strong>Square ${s.end}</strong> (-${squareNum - s.end})${pegInfo}`;
    }
    return;
  }

  if (snakesByEnd.has(squareNum)) {
    const s = snakesByEnd.get(squareNum);
    highlightSnake(s);
    if (inspectorOutput) {
      inspectorOutput.innerHTML = `<strong>🐍 Snake Tail (Square ${squareNum})</strong> ➔ Slid from <strong>Square ${s.start}</strong> (-${s.start - squareNum})${pegInfo}`;
    }
    return;
  }

  if (inspectorOutput) {
    if (squareNum === 1) {
      inspectorOutput.innerHTML = `<strong>Square 1 (Start 🚩)</strong> — Row 1 (${direction})${pegInfo}`;
    } else if (squareNum === 100) {
      inspectorOutput.innerHTML = `<strong>Square 100 (Goal 🏆)</strong> — Row 10 (${direction})${pegInfo}`;
    } else {
      inspectorOutput.innerHTML = `Square <strong>${squareNum}</strong> — Row ${coords.rowFromBottom + 1} (${direction})${pegInfo}`;
    }
  }
}

/**
 * Highlights a ladder.
 */
function highlightLadder(ladder) {
  const startEl = document.getElementById(`square-${ladder.start}`);
  const endEl = document.getElementById(`square-${ladder.end}`);
  if (startEl) startEl.classList.add('highlight-source');
  if (endEl) endEl.classList.add('highlight-target');

  const svgElem = document.getElementById(`ladder-elem-${ladder.start}-${ladder.end}`);
  if (svgElem) svgElem.classList.add('highlighted');

  const boardSvg = document.getElementById('board-svg');
  if (boardSvg) boardSvg.classList.add('has-active-item');

  const pill = document.querySelector(`.item-pill[data-type="ladder"][data-start="${ladder.start}"]`);
  if (pill) pill.classList.add('active');
}

/**
 * Highlights a snake.
 */
function highlightSnake(snake) {
  const startEl = document.getElementById(`square-${snake.start}`);
  const endEl = document.getElementById(`square-${snake.end}`);
  if (startEl) startEl.classList.add('highlight-source');
  if (endEl) endEl.classList.add('highlight-target');

  const svgElem = document.getElementById(`snake-elem-${snake.start}-${snake.end}`);
  if (svgElem) svgElem.classList.add('highlighted');

  const boardSvg = document.getElementById('board-svg');
  if (boardSvg) boardSvg.classList.add('has-active-item');

  const pill = document.querySelector(`.item-pill[data-type="snake"][data-start="${snake.start}"]`);
  if (pill) pill.classList.add('active');
}

/**
 * Clears highlights.
 */
function clearHighlight() {
  document.querySelectorAll('.square.highlight-source, .square.highlight-target').forEach(el => {
    el.classList.remove('highlight-source', 'highlight-target');
  });
  document.querySelectorAll('.ladder-element.highlighted, .snake-element.highlighted').forEach(el => {
    el.classList.remove('highlighted');
  });
  const boardSvg = document.getElementById('board-svg');
  if (boardSvg) boardSvg.classList.remove('has-active-item');

  document.querySelectorAll('.item-pill.active').forEach(el => {
    el.classList.remove('active');
  });
}

/**
 * Populates sidebar legend pills.
 */
function renderSidebarPills() {
  const laddersPillsEl = document.getElementById('ladders-pills');
  const snakesPillsEl = document.getElementById('snakes-pills');
  const laddersCountEl = document.getElementById('ladders-count');
  const snakesCountEl = document.getElementById('snakes-count');

  if (laddersCountEl) laddersCountEl.textContent = activeLadders.length;
  if (snakesCountEl) snakesCountEl.textContent = activeSnakes.length;

  if (laddersPillsEl) {
    laddersPillsEl.innerHTML = '';
    activeLadders.forEach(ladder => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'item-pill ladder-pill';
      pill.dataset.type = 'ladder';
      pill.dataset.start = ladder.start;
      pill.dataset.end = ladder.end;
      pill.innerHTML = `<span>🪜</span> ${ladder.start} ➔ ${ladder.end} <small>(+${ladder.end - ladder.start})</small>`;

      pill.addEventListener('mouseenter', () => {
        clearHighlight();
        highlightLadder(ladder);
        const inspectorOutput = document.getElementById('inspector-output');
        if (inspectorOutput) {
          inspectorOutput.innerHTML = `<strong>🪜 Ladder:</strong> Square <strong>${ladder.start}</strong> climbs UP to <strong>${ladder.end}</strong> (+${ladder.end - ladder.start})`;
        }
      });
      pill.addEventListener('mouseleave', () => clearHighlight());
      pill.addEventListener('click', () => {
        clearHighlight();
        highlightLadder(ladder);
      });

      laddersPillsEl.appendChild(pill);
    });
  }

  if (snakesPillsEl) {
    snakesPillsEl.innerHTML = '';
    activeSnakes.forEach(snake => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'item-pill snake-pill';
      pill.dataset.type = 'snake';
      pill.dataset.start = snake.start;
      pill.dataset.end = snake.end;
      pill.innerHTML = `<span>🐍</span> ${snake.start} ➔ ${snake.end} <small>(-${snake.start - snake.end})</small>`;

      pill.addEventListener('mouseenter', () => {
        clearHighlight();
        highlightSnake(snake);
        const inspectorOutput = document.getElementById('inspector-output');
        if (inspectorOutput) {
          inspectorOutput.innerHTML = `<strong>🐍 Snake:</strong> Square <strong>${snake.start}</strong> slides DOWN to <strong>${snake.end}</strong> (-${snake.start - snake.end})`;
        }
      });
      pill.addEventListener('mouseleave', () => clearHighlight());
      pill.addEventListener('click', () => {
        clearHighlight();
        highlightSnake(snake);
      });

      snakesPillsEl.appendChild(pill);
    });
  }
}

// ========================================================
// PHASE 10: PROGRESSIVE WEB APP (PWA) & LOCALSTORAGE PERSISTENCE
// Full offline support, service worker, GitHub Pages sub-path ready,
// and state persistence across page refreshes.
// ========================================================

const STORAGE_KEY = 'snakes_and_ladders_save_v10';
let deferredInstallPrompt = null;

/**
 * Initializes and registers the PWA Service Worker.
 * Compatible with localhost, root domains, and GitHub Pages sub-paths.
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        console.log('[SW] ServiceWorker registered with scope:', reg.scope);

        // Wait until service worker is active and ready
        await navigator.serviceWorker.ready;

        // Verify that the cache exists and has keys
        if ('caches' in window) {
          try {
            const cache = await caches.open('snakes-and-ladders-v12');
            const keys = await cache.keys();
            console.log('[SW] Cache keys verified:', keys.length);
          } catch (_) {}
        }

        updateOfflineBadge(navigator.onLine, true);
      } catch (err) {
        console.warn('[SW] Registration failed:', err);
        updateOfflineBadge(navigator.onLine, false);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  } else {
    updateOfflineBadge(navigator.onLine, false);
  }

  // Network connection monitoring
  window.addEventListener('online', () => {
    updateOfflineBadge(true, true);
    setLog('🌐 <strong>Back online.</strong> Connected to network.');
  });
  window.addEventListener('offline', () => {
    updateOfflineBadge(false, true);
    setLog('📡 <strong>Offline mode active.</strong> Running 100% smoothly from local Service Worker cache.');
  });

  // Capture install prompt for PWA installation
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.style.display = 'none';
    setLog('🎉 <strong>App installed successfully!</strong> You can launch Snakes & Ladders directly from your home screen or apps menu.');
  });
}

/**
 * Updates the header offline/online badge.
 */
function updateOfflineBadge(isOnline, isServiceWorkerReady = false) {
  const badgeText = document.getElementById('pwa-status-text');
  const badgeDot = document.getElementById('pwa-status-dot');
  if (!badgeDot || !badgeText) return;

  if (!isOnline) {
    badgeDot.className = 'pwa-status-dot offline';
    badgeText.textContent = '📡 Offline Mode (Cached)';
  } else if (isServiceWorkerReady) {
    badgeDot.className = 'pwa-status-dot ready';
    badgeText.textContent = '✅ 100% Offline Ready';
  } else {
    badgeDot.className = 'pwa-status-dot';
    badgeText.textContent = '⏳ Caching Game Files...';
  }
}

/**
 * Launches the browser's native PWA installation prompt.
 */
function triggerPWAInstall() {
  if (!deferredInstallPrompt) {
    alert('To install on your device:\n• On Chrome/Edge: Click the install icon in the address bar.\n• On iPhone/iPad (Safari): Tap Share and select "Add to Home Screen".\n• On Android: Tap menu (⋮) and select "Install app".');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then((choice) => {
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.style.display = 'none';
  });
}

/**
 * Serializes the full tournament and layout state into LocalStorage.
 */
function saveGameState() {
  try {
    const logEl = document.getElementById('log-text');
    const state = {
      version: 10,
      timestamp: Date.now(),
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        color: p.color,
        position: p.position,
        isFinished: p.isFinished,
        rank: p.rank
      })),
      nextPlayerId,
      nextHumanNumber,
      nextRobotNumber,
      currentPlayerIndex,
      finishedRankings: finishedRankings.map(r => ({
        player: {
          id: r.player.id,
          name: r.player.name,
          type: r.player.type,
          color: r.player.color,
          position: r.player.position,
          isFinished: r.player.isFinished,
          rank: r.player.rank
        },
        rank: r.rank,
        medal: r.medal
      })),
      tournamentOver,
      selectedPairCount,
      activeLadders: [...activeLadders],
      activeSnakes: [...activeSnakes],
      isCustomLayout: Boolean(window.isCustomLayout),
      focusModeEnabled,
      boardZoomLevel,
      activeSidebarTab,
      logHTML: logEl ? logEl.innerHTML : '',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateStorageStatusUI(true);
  } catch (err) {
    console.warn('[LocalStorage] Save failed:', err);
    updateStorageStatusUI(false);
  }
}

/**
 * Restores tournament and layout state from LocalStorage.
 * Returns true if state was successfully restored.
 */
function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.players) || state.players.length === 0) {
      return false;
    }

    // Restore players
    players = state.players.map(p => ({
      id: Number(p.id),
      name: String(p.name),
      type: p.type === 'robot' ? 'robot' : 'human',
      color: String(p.color),
      position: Math.max(1, Math.min(100, Number(p.position) || 1)),
      isFinished: Boolean(p.isFinished),
      rank: p.rank ? Number(p.rank) : null
    }));

    nextPlayerId = state.nextPlayerId || (Math.max(...players.map(p => p.id), 0) + 1);
    nextHumanNumber = state.nextHumanNumber || (players.filter(p => p.type === 'human').length + 1);
    nextRobotNumber = state.nextRobotNumber || (players.filter(p => p.type === 'robot').length + 1);

    currentPlayerIndex = (typeof state.currentPlayerIndex === 'number' && state.currentPlayerIndex >= 0 && state.currentPlayerIndex < players.length)
      ? state.currentPlayerIndex
      : 0;

    // Restore rankings
    finishedRankings = Array.isArray(state.finishedRankings) ? state.finishedRankings : [];
    tournamentOver = Boolean(state.tournamentOver);

    // Restore board layout
    if (state.selectedPairCount && CLASSIC_LAYOUTS[state.selectedPairCount]) {
      selectedPairCount = state.selectedPairCount;
    }
    if (Array.isArray(state.activeLadders) && Array.isArray(state.activeSnakes) && state.activeLadders.length > 0) {
      activeLadders = state.activeLadders;
      activeSnakes = state.activeSnakes;
      window.isCustomLayout = Boolean(state.isCustomLayout);
      updateLayoutMaps();
    }

    // Restore zoom & focus
    if (typeof state.focusModeEnabled === 'boolean') {
      focusModeEnabled = state.focusModeEnabled;
    }
    if (typeof state.boardZoomLevel === 'number') {
      boardZoomLevel = state.boardZoomLevel;
    }
    if (state.activeSidebarTab) {
      activeSidebarTab = state.activeSidebarTab;
    }

    // Restore log
    if (state.logHTML) {
      const logEl = document.getElementById('log-text');
      if (logEl) logEl.innerHTML = state.logHTML;
    }

    return true;
  } catch (err) {
    console.warn('[LocalStorage] Restore parse error:', err);
    return false;
  }
}

/**
 * Clears saved game from localStorage and resets tournament back to initial state.
 */
function clearSavedGameAndReset() {
  if (robotTurnTimer) {
    clearTimeout(robotTurnTimer);
    robotTurnTimer = null;
  }

  // Reset default players
  players = [
    { id: 1, name: 'Player 1', type: 'human', color: '#ef4444', position: 1, isFinished: false, rank: null },
    { id: 2, name: 'Robot 1', type: 'robot', color: '#3b82f6', position: 1, isFinished: false, rank: null },
  ];
  nextPlayerId = 3;
  nextHumanNumber = 2;
  nextRobotNumber = 2;
  currentPlayerIndex = 0;
  finishedRankings = [];
  tournamentOver = false;

  // Restore classic 7 pairs layout
  selectedPairCount = 7;
  activeLadders = [...CLASSIC_LAYOUTS[7].ladders];
  activeSnakes = [...CLASSIC_LAYOUTS[7].snakes];
  window.isCustomLayout = false;
  updateLayoutMaps();

  // Reset view preferences
  focusModeEnabled = true;
  boardZoomLevel = 1.0;
  activeSidebarTab = 'panel-game';

  hideSaveBanner();
  renderBoard();
  drawLaddersAndSnakes();
  renderSidebarPills();
  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  updateTurnUI();
  setBoardZoom(1.0);
  switchSidebarTab('panel-game');

  // Remove save item AFTER UI resets so it stays cleared
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[LocalStorage] Clear failed:', err);
  }

  updateStorageStatusUI(false);

  setLog('✨ Saved game cleared! Started a fresh tournament with default players on Square 1.');
}

/**
 * Shows the notification banner when a saved session was restored.
 */
function showRestoreBanner() {
  const banner = document.getElementById('save-banner');
  const bannerText = document.getElementById('save-banner-text');
  if (banner) {
    const activePlayer = players[currentPlayerIndex];
    let desc = `Tournament restored from previous session (${players.length} players). `;
    if (tournamentOver) {
      desc += 'Tournament is finished (podium standings available).';
    } else if (activePlayer) {
      const typeIcon = activePlayer.type === 'robot' ? '🤖' : '👤';
      desc += `Active turn: ${typeIcon} <strong>${activePlayer.name}</strong> on Square ${activePlayer.position}.`;
    }
    if (bannerText) bannerText.innerHTML = desc;
    banner.style.display = 'flex';
  }
}

function hideSaveBanner() {
  const banner = document.getElementById('save-banner');
  if (banner) banner.style.display = 'none';
}

/**
 * Updates the storage status pill in the Setup panel.
 */
function updateStorageStatusUI(isSaved) {
  const pill = document.getElementById('storage-status-pill');
  if (pill) {
    if (isSaved) {
      pill.textContent = 'Auto-Saved';
      pill.className = 'badge badge-success';
      pill.title = 'Current game state is safely preserved in LocalStorage';
    } else {
      pill.textContent = 'Fresh / Unsaved';
      pill.className = 'badge';
      pill.title = 'No active saved session stored';
    }
  }
}

/**
 * Initializes and manages Theme (Light / Dark mode).
 */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('snakes-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('snakes-theme', newTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const iconSpan = themeToggle.querySelector('.theme-icon');
    const textSpan = themeToggle.querySelector('.theme-text');
    if (theme === 'dark') {
      if (iconSpan) iconSpan.textContent = '☀️';
      if (textSpan) textSpan.textContent = 'Light Mode';
    } else {
      if (iconSpan) iconSpan.textContent = '🌙';
      if (textSpan) textSpan.textContent = 'Dark Mode';
    }
  }
}

/**
 * Initializes button listeners for Phase 7 controls.
 */
function initControls() {
  // Player Management
  const addHumanBtn = document.getElementById('btn-add-player');
  if (addHumanBtn) {
    addHumanBtn.addEventListener('click', () => addPlayer('human'));
  }

  const addRobotBtn = document.getElementById('btn-add-robot');
  if (addRobotBtn) {
    addRobotBtn.addEventListener('click', () => addRobot());
  }

  const resetPegsBtn = document.getElementById('btn-reset-pegs');
  if (resetPegsBtn) {
    resetPegsBtn.addEventListener('click', () => resetGame());
  }

  // Dice & Turns
  const rollBtn = document.getElementById('btn-roll-dice');
  if (rollBtn) {
    rollBtn.addEventListener('click', () => rollDice());
  }

  const diceScene = document.getElementById('dice-scene');
  if (diceScene) {
    diceScene.addEventListener('click', () => rollDice());
  }

  const restartTournamentBtn = document.getElementById('btn-restart-tournament');
  if (restartTournamentBtn) {
    restartTournamentBtn.addEventListener('click', () => resetGame());
  }

  // Phase 7: Board Layout & Randomizer
  const randomizeBtn = document.getElementById('btn-randomize-board');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', () => randomizeBoard());
  }

  const classicBtn = document.getElementById('btn-classic-board');
  if (classicBtn) {
    classicBtn.addEventListener('click', () => resetToClassicLayout());
  }

  // Equal Pairs Count Selectors (6, 7, 8)
  [6, 7, 8].forEach(count => {
    const btn = document.getElementById(`btn-count-${count}`);
    if (btn) {
      btn.addEventListener('click', () => setPairCount(count));
    }
  });

  // Phase 8: Tab Navigation
  document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (target) switchSidebarTab(target);
    });
  });

  // Shortcut from Live Game to Players Status Table
  const gotoTableBtn = document.getElementById('btn-goto-players-table');
  if (gotoTableBtn) {
    gotoTableBtn.addEventListener('click', () => switchSidebarTab('panel-players-view'));
  }

  // Roll dice button inside Players Status Table
  const tableRollBtn = document.getElementById('btn-table-roll');
  if (tableRollBtn) {
    tableRollBtn.addEventListener('click', () => rollDice());
  }

  // Phase 9: Peg Focus & Zoom Controls
  const toggleFocusBtn = document.getElementById('btn-toggle-focus');
  if (toggleFocusBtn) {
    toggleFocusBtn.addEventListener('click', () => togglePegFocus());
  }

  const centerPegBtn = document.getElementById('btn-center-peg');
  if (centerPegBtn) {
    centerPegBtn.addEventListener('click', () => focusActivePeg(true));
  }

  const zoomInBtn = document.getElementById('btn-zoom-in');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => setBoardZoom(boardZoomLevel + 0.25));
  }

  const zoomOutBtn = document.getElementById('btn-zoom-out');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => setBoardZoom(boardZoomLevel - 0.25));
  }

  const zoomResetBtn = document.getElementById('btn-zoom-reset');
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => setBoardZoom(1.0));
  }

  const mobileRollBtn = document.getElementById('btn-mobile-roll');
  if (mobileRollBtn) {
    mobileRollBtn.addEventListener('click', () => rollDice());
  }

  // Phase 10: PWA & LocalStorage Persistence Controls
  const installAppBtn = document.getElementById('btn-install-pwa');
  if (installAppBtn) {
    installAppBtn.addEventListener('click', () => triggerPWAInstall());
  }

  const manualSaveBtn = document.getElementById('btn-manual-save');
  if (manualSaveBtn) {
    manualSaveBtn.addEventListener('click', () => {
      saveGameState();
      setLog('💾 <strong>Game State Saved!</strong> Tournament progress preserved in your browser LocalStorage.');
    });
  }

  const clearSaveBtn = document.getElementById('btn-clear-save');
  if (clearSaveBtn) {
    clearSaveBtn.addEventListener('click', () => {
      if (confirm('Clear saved game from browser storage and reset all players to fresh state?')) {
        clearSavedGameAndReset();
      }
    });
  }

  const bannerClearBtn = document.getElementById('btn-banner-clear');
  if (bannerClearBtn) {
    bannerClearBtn.addEventListener('click', () => {
      clearSavedGameAndReset();
    });
  }

  const bannerCloseBtn = document.getElementById('btn-banner-close');
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener('click', () => {
      hideSaveBanner();
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initServiceWorker();

  const restored = loadGameState();

  renderBoard();
  drawLaddersAndSnakes();
  renderSidebarPills();
  renderPlayersList();
  renderPegs();
  renderLiveRankings();
  renderPlayersStatusTable();
  updateTurnUI();

  if (restored) {
    setBoardZoom(boardZoomLevel);
    if (activeSidebarTab && activeSidebarTab !== 'panel-game') {
      switchSidebarTab(activeSidebarTab);
    }
    if (tournamentOver) {
      renderPodiumStandings();
    } else {
      const activePlayer = players[currentPlayerIndex];
      if (activePlayer && activePlayer.type === 'robot') {
        const rollBtn = document.getElementById('btn-roll-dice');
        if (rollBtn) rollBtn.disabled = true;
        robotTurnTimer = setTimeout(() => {
          executeRobotTurn();
        }, 1000);
      }
    }
    showRestoreBanner();
    updateStorageStatusUI(true);
  } else {
    updateStorageStatusUI(false);
  }

  focusActivePeg(false);
  initControls();
});
