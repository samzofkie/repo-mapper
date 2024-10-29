import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz', 21);

let globalState = {
  tree: null,
  stack: [],
  cards: [],
  symbols: {},
};


function clearCards() {
  while (globalState.cards.length)
    globalState.cards.pop().remove();
}


function createCard(name, subtree) {  
  const {size: sizeSym, type: typeSym} = globalState.symbols;
  const size = subtree[sizeSym];
  const scaledSize = Math.log2(size) ** 1.9 / 6 + 6;
  const card = document.createElement('div');

  card.style.fontSize = `${scaledSize / 2}px`;
  card.style.height = `${scaledSize * 4}px`;
  card.style.width = `${scaledSize * 4}px`;
  card.innerText = name;

  if (subtree[typeSym] === 'tree') {
    card.className = 'subtree-card';
    card.onclick = () => {
      globalState.stack.push(subtree);
      clearCards();
      drawCurrentState();
    }
  } else if (subtree[typeSym] === 'blob') {
    card.className = 'file-card';
    card.onclick = async () => {
      const url = subtree.url;
      const res = await fetch(url);
      
      globalState.stack.push({
        ...(await res.json()),
        [typeSym]: 'blob'
      });
      clearCards();
      drawCurrentState();
    }
  }

  return card;
}


function leaveDir() {
  globalState.stack.pop();
  clearCards();
  drawCurrentState();
}


async function drawCurrentState() {
  const {type: typeSym, size: sizeSym} = globalState.symbols;
  const main = document.body.children[0];
  const currentState = globalState.stack[globalState.stack.length-1];
  const currentStateType = currentState[typeSym];

  // Draw dot dot card
  if (globalState.stack.length > 1) {
    let dotdot = document.createElement('div');
    dotdot.className = 'dotdot';
    dotdot.innerText = '..';
    dotdot.onclick = leaveDir;
    globalState.cards.push(dotdot);
  }
  
  if (currentStateType === 'tree') {
    main.className = 'main-tree';

    const cards = Object.entries(currentState)
      .filter(([name, _]) => name !== typeSym && name !== sizeSym )
      // TODO: sort entries properly
      .map(([k, v]) => createCard(k, v));
  
    globalState.cards.push(...cards);

  } else if (currentStateType === 'blob') {
    main.className = 'main-blob';

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    pre.append(code);

    const sourceCodeString = atob(currentState.content);
    const lines = sourceCodeString.split('\n')
      .map((line, i) => {
        const span = document.createElement('span');
        span.className = 'line-number';
        // TODO fix line number whitespace
        span.innerText = `${i+1}  `;
        return [span, line + '\n'];
      })
      .flat();

    code.append(...lines);

    //code.append(atob(currentState.content));

    globalState.cards.push(pre);
  }

  globalState.cards.map(card => main.append(card));

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
  const tree = {
    [typeSym]: 'tree',
  };

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
  calculateTreeSize(tree);

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