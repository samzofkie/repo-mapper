import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz', 21);

import { Hideable } from './Hideable';
import { RepoSearchResults, RepoSearchResultAnchor } from "./RepoSearch";


function cacheGlobalState() {
  localStorage.setItem('globalState', JSON.stringify({
    symbols: globalState.symbols,
  }));
}

const globalState = {
  symbols: {},
  repoSearch: {
    spinner: new Hideable('block', 'repo-search-results-spinner'),
    results: new RepoSearchResults,
    input: document.getElementById('repo-search-input'),
  },
  repoRoot: {
    spinner: new Hideable('block', 'repo-root-spinner'),
  }
};


// https://stackoverflow.com/a/75988895/13387094
function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}


async function makeSearchRequest() {
  const searchTerm = globalState.repoSearch.input.value;

  if (searchTerm === '')
    return;

  const searchURL = 
    `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerm)}`;
  console.log(`GET ${searchURL}`);
  const res = await fetch(searchURL);

  const spinner = globalState.repoSearch.spinner;
  const results = globalState.repoSearch.results;

  results.clear();
  
  if (res.status !== 200) {
    results.node.innerText = 'The request to the /search endpoint in GitHub\'s API failed for some reason!';
  } else {
    spinner.hide();
    results.node.append(
      ...(await res.json()).items
        //.slice(0, 10)
        .map(data => new RepoSearchResultAnchor(data).root)
    );
  }
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


function buildTree(flatTree) {
  globalState.symbols.size = nanoid();
  globalState.symbols.type = nanoid();
  const {size: sizeSym, type: typeSym} = globalState.symbols;
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


//https://stackoverflow.com/a/21015393/13387094
function getCanvasMetrics(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text);
}

function getTextWidth(text, font) {
  return getCanvasMetrics(text, font).width;
}

function getTextHeight(text, font) {
  const metrics = getCanvasMetrics(text, font);
  return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}


async function drawRepoRoot(owner, name) {
  const main = document.getElementById('repo-root');
  main.style.display = 'flex';
  main.hidden = false;

  // temporary
  /*const p = document.createElement('p');
  p.append('repo root');
  main.append(p);*/

  const searchParams = new URLSearchParams(window.location.search);
  let defaultBranch = '';
  if (searchParams.has('defaultBranch')) {
    defaultBranch = searchParams.get('defaultBranch');
  } else {
    // TODO make req to figure out repo default branch
  }  

  const url = encodeURI(`https://api.github.com/repos/${owner}/${name}/git/trees/${defaultBranch}?recursive=true`);
  console.log(`requesting ${url}`);
  const res = await fetch(url);
  const spinner = globalState.repoRoot.spinner;
  spinner.hide();

  if (res.status !== 200) {
    const p = document.createElement('p');
    p.append(`GET ${url} returned ${res.status}! :(`);
    main.append(p);
  } else {
    const json = await res.json();
    const tree = buildTree(json.tree);

    const {size: sizeSym, type: typeSym} = globalState.symbols;

    const sizes = Object.entries(tree)
      .map(([_, entry]) => Math.floor(Math.log2(entry[sizeSym]) ** 2.5 / 20 + 20));
    
    const totalSize = sizes.reduce((acc, curr) => acc + curr, 0) 
      //+ (sizes.length * 0.25); // padding

    const sizeOfLargestElement = Math.max(...sizes);
    const diameter = Math.ceil(totalSize / Math.PI) + sizeOfLargestElement;
    const radius = diameter / 2;
    const radiansPerPoint = 2 * Math.PI / totalSize;

    let currAngle = 0;
    const centerPoint = {
      x: radius, 
      y: radius,
    };
    const container = document.getElementById('repo-root-entries');
    container.style.width = `${diameter}px`;
    container.style.height = `${diameter}px`;
    for (let [name, data] of Object.entries(tree)) {

      const scaledSize = Math.floor(Math.log2(data[sizeSym]) ** 2.5 / 20 + 20);

      currAngle += radiansPerPoint * (scaledSize / 2 /*+ 0.125*/);
      
      const entry = document.createElement('li');
      entry.className = `repo-${data[typeSym]}`;
      entry.style.width = `${scaledSize}px`;
      entry.style.height = `${scaledSize}px`;
      entry.style.fontSize = `${Math.max(scaledSize / 8, 8)}px`;

      const font = getCanvasFont(entry);
      const textWidth = getTextWidth(name, font);
      
      let caption = false;
      if (textWidth < scaledSize) {
        entry.append(name);
      } else {
        caption = document.createElement('span');
        caption.className = 'repo-caption';
        caption.append(name);
      }
      
      const spot = {
        x: centerPoint.x + Math.sin(currAngle) * radius - scaledSize / 2,
        y: centerPoint.y - Math.cos(currAngle) * radius - scaledSize / 2,
      };
      entry.style.left = `${spot.x}px`;
      entry.style.top = `${spot.y}px`;

      currAngle += radiansPerPoint * (scaledSize / 2 /*+ 0.125*/);
      
      container.append(entry);
      
      if (caption) {
        const captionFont = getCanvasFont(caption);
        const captionHeight = getTextHeight(name, captionFont);
        caption.style.left = `${spot.x + scaledSize + 10}px`;
        caption.style.top = `${spot.y + scaledSize / 2 - captionHeight / 2}px`;
        
        if (currAngle % Math.PI < Math.PI / 4 || currAngle > 3 * Math.PI / 4) {
          const line = document.createElement('div');
          line.className = 'repo-caption-line';
          line.style.top = `${spot.y + scaledSize / 2}px`;
          line.style.left = `${spot.x + scaledSize + 10}px`;
          line.style.transform = `rotate(${Math.PI - currAngle}rad)`;
          container.append(line);
        } else
        
        container.append(caption);
      }
    }
  }
}


async function drawLandingPage() {
  const main = document.getElementById('landing-page');
  main.style.display = 'flex';
  main.hidden = false;


  const searchRequestDebounceTime = 500;
  const debouncedMakeSearchRequest = debounce(makeSearchRequest, searchRequestDebounceTime);

  globalState.repoSearch.input.addEventListener('input', event => {
    const spinner = globalState.repoSearch.spinner;
    const results = globalState.repoSearch.results;

    results.clear();
    
    if (event.target.value === '') {
      spinner.hide();
      results.hide();
    } else {
      spinner.show();
      results.show();
      debouncedMakeSearchRequest();
    }
  });
}



async function init() {
  if (window.location.pathname === '/') {
    drawLandingPage();
  } else {
    const [owner, name] = window.location.pathname
      .split('/').filter(s => s);
    
    if (owner === undefined || name === undefined) {
      window.location.href = '/';
    }
    
    drawRepoRoot(owner, name);
  }
}

init();