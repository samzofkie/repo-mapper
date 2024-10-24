const globalState = {
  cards: [],
  stack: [],
};

async function getData() {
  const res = await fetch('/data');
  return await res.json();
}

function createCard(dirEnt) {
  const size = dirEnt[1].size;
  const scaledSize = Math.log2(size) ** 1.88 / 6 + 5;

  const card = document.createElement('div');
  card.className = 'dirent-card'
  card.style.fontSize = `${scaledSize / 2}px`;
  card.style.height = `${scaledSize * 4}px`;
  card.style.width = `${scaledSize * 4}px`;
  if (dirEnt[1].entries !== undefined) {
    card.style.color = 'hsl(219 100% 50%)';
    card.style.backgroundColor = 'hsl(250 90% 80%)';
    card.onclick = async () => {
  
      globalState.stack.push(globalState.current);
      globalState.current = dirEnt[1].entries;
      clearCards();
      drawRepo();
    };
  }
  card.innerText = dirEnt[0];
  return card;
}

function clearCards() {
  while (globalState.cards.length) {
    globalState.cards.pop().remove();
  }
  console.log(globalState.cards.length);
}

async function drawRepo() {
  const repo = globalState.current;
  const main = document.body.children[0];
  
  /*const sortedDirEnts = Object.entries(repoData)
    .toSorted(([_, aData], [__, bData]) => aData.size - bData.size);*/


  globalState.cards = Object.entries(repo).map(createCard);

  if (globalState.stack.length) {
    let dotdot = document.createElement('div');
    dotdot.className = 'dotdot';
    dotdot.innerText = '..';
    dotdot.onclick = () => {
      globalState.current = globalState.stack.pop();
      clearCards();
      drawRepo();
    };
    globalState.cards = [dotdot, ...globalState.cards];
  }

  globalState.cards.forEach(card => main.append(card));


  // Bin packin'
  
  /*
  const cardSizes = cards.map(card => Number(card.style.height.split('px')[0]));
  const total = cardSizes.reduce((acc, curr) => acc + curr, 0);

  */
}


(async () => {
  globalState.repoData = await getData();
  globalState.current = globalState.repoData;
  drawRepo();
})();