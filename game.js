const tiles = document.querySelectorAll(".tile");
let currentTileIndex = 0;

tiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    if (currentTileIndex < tiles.length - 1) {
      swapTiles(currentTileIndex, currentTileIndex + 1);
    }
  });
});

function swapTiles(srcIndex, destIndex) {
  const src = tiles[srcIndex];
  const dest = tiles[destIndex];

  // Swap content (numbers for demonstration)
  [src.textContent, dest.textContent] = [dest.textContent, src.textContent];

  // Adjust indices for next possible swap
  if (destIndex < tiles.length - 1 && srcIndex !== destIndex + 1) {
    currentTileIndex = destIndex;
  } else {
    checkWin();
  }
}

function checkWin() {
  const sorted = Array.from(tiles)
    .slice(1)
    .map((tile) => parseInt(tile.textContent));

  if (sorted.every(Number.isSafeInteger)) {
    alert("Congratulations! You won!");
    location.reload();
  }
}
