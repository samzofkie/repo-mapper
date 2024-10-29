import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz', 21);

let globalState = {
  tree: null,
  stack: [],
  cards: [],
  symbols: {},
};


function createCard(name, subtree) {  
  const {size: sizeSym} = globalState.symbols;
  const size = subtree[sizeSym];
  const scaledSize = Math.log2(size) ** 1.9 / 6 + 6;

  const card = document.createElement('div');
  card.className = 'dirent-card'
  card.style.fontSize = `${scaledSize / 2}px`;
  card.style.height = `${scaledSize * 4}px`;
  card.style.width = `${scaledSize * 4}px`;

  const typeSym = globalState.symbols.type;
  if (subtree[typeSym] === 'tree') {
    card.style.color = 'hsl(219 100% 50%)';
    card.style.backgroundColor = 'hsl(250 90% 80%)';
    /*card.onclick = async () => {
  
      globalState.stack.push(globalState.current);
      globalState.current = dirEnt[1].entries;
      clearCards();
      drawRepo();
    };*/
  }

  card.innerText = name;
  return card;
}


function clearCards() {
  while (globalState.cards.length)
    globalState.cards.pop().remove();
}


async function drawCurrentState() {
  const main = document.body.children[0];

  const currentState = globalState.stack[globalState.stack.length-1];
  const entries = Object.entries(currentState);
  // TODO: sort entries properly

  globalState.cards = entries.map( ([k, v]) => createCard(k, v));
  globalState.cards.map(card => main.append(card));



  /*if (globalState.stack.length) {
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

  globalState.cards.forEach(card => main.append(card));*/


  // TODO: bin packin'
}

function calculateTreeSize(tree) {
  const {type: typeSym, size: sizeSym} = globalState.symbols;

  for (const [name, entry] of Object.entries(tree)) {
    if (name !== typeSym && name !== sizeSym) {
      if (entry[typeSym] === 'tree')
        calculateTreeSize(entry);
      
      tree[sizeSym] += entry[sizeSym];
    }
  }
}


// Expects globalState.symbols to be set.
function buildTree(flatTree) {
  const {type: typeSym, size: sizeSym} = globalState.symbols;
  const tree = {};
  for (let entry of flatTree) {
    const path = entry.path.split('/');

    // Navigate to parent
    let treeSpot = tree;
    for (let stop of path.slice(0, -1))
      treeSpot = treeSpot[stop];

    // Set child appropriately
    const newChildKey = path[path.length-1];
    treeSpot[newChildKey] = entry.type === 'tree' ? {} : entry;
    
    const newChild = treeSpot[newChildKey]
    newChild[typeSym] = entry.type;
    newChild[sizeSym] = entry.type === 'tree' ? 0 : entry.size;
  }
  
  // Recursively calculate size of subtrees
  for (let [_, entry] of Object.entries(tree)) {
    if (entry[typeSym] === 'tree')
      calculateTreeSize(entry)    
  }

  return tree;
}


function cacheGlobalState() {
  localStorage.setItem('globalState', JSON.stringify({
    symbols: globalState.symbols,
    tree: globalState.tree,
  }));
}


async function init() {
  const name = 'postgres';

  const cachedGlobalState = localStorage.getItem('globalState');
  if (!cachedGlobalState) {
    globalState.symbols = {
      type: nanoid(),
      size: nanoid(),
    }

    const cachedGHRes = localStorage.getItem('GHRes');
    let GHRes;
    if (!cachedGHRes) {
      const url = `https://api.github.com/repos/${name}/${name}/git/trees/master?recursive=true`
      const res = await fetch(url);
      GHRes = await res.json();
      localStorage.setItem('GHRes', JSON.stringify(GHRes));
    } else
      GHRes = JSON.parse(cachedGHRes);
    
    globalState.tree = buildTree(GHRes.tree);
    
    cacheGlobalState();
  
  } else
    globalState = {
      ...globalState,
      ...JSON.parse(cachedGlobalState),
    }
  
  globalState.stack.push(globalState.tree);
  drawCurrentState();
}


init();