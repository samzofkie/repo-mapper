import { Attempter } from './Attempter';
import { ErrorLogger } from './ErrorLogger';

class VisualizerPathError extends Error {}
class VisualizerRequestError extends Error {}

// The main *init* method is `loadRepo()`.
export class Visualizer {
  constructor() {
    this.main = document.querySelector('#visualizer');
    this.result = document.querySelector('#visualizer #repo');

    this.repoAttempter = new Attempter({
      container: this.main,
      loader: document.querySelector('#visualizer .spinner'),
      error: document.querySelector('#visualizer #error'),
      result: document.querySelector('#visualizer #repo'),
    });
    
    this.hide();
  }

  show() {
    this.main.style.display = '';
    this.main.hidden = false;
  }

  hide() {
    this.main.style.display = 'none';
    this.main.hidden = true;
  }

  async loadRepo() {
    this.repoAttempter.showLoading();

    try {
      let [owner, name] = Visualizer.parsePath();
      let defaultBranch = await Visualizer.getRepoDefaultBranch(owner, name);

      owner = encodeURIComponent(owner);
      name = encodeURIComponent(name);
      defaultBranch = encodeURIComponent(defaultBranch);

      let flatTree = await Visualizer.getGitTree(owner, name, defaultBranch);
      let tree = Visualizer.buildTreeFromFlat(flatTree);

      const scalar = Visualizer.calculateSizeScalarFromTree(tree);
      const diameter = Visualizer.getWindowSize();

      Visualizer.setNodeSize(this.result, diameter);

      const listItems = Visualizer.createRepoListItems(tree, scalar);
      this.result.append(...listItems);

      // TODO arrange in circle
      this.result.append(
        Visualizer.createDot(200, 200),
      );

      this.repoAttempter.showResult();
    } catch (error) {
      if (
        error instanceof VisualizerPathError ||
        error instanceof VisualizerRequestError
      ) {
        this.repoAttempter.showError(error.message);
        return;
      } else
        throw error;
    }
  }

  static parsePath() {
    const path = window.location.pathname.split('/').slice(1);
    if (path.length !== 2)
      throw new VisualizerPathError('URL endpoint should be of the form /[owner]/[repo]!');
    return path;
  }

  static async getRepoDefaultBranch(owner, name) {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('defaultBranch'))
      return searchParams.get('defaultBranch');

    const url = `https://api.github.com/repos/${owner}/${name}`;
    console.log(`GET ${url}`);
    const res = await fetch(url);

    if (res.status !== 200) {
      throw new VisualizerRequestError(
        ErrorLogger.httpsError(res.url, res.status)
      );
      
    } else {
      const json = await res.json();
      return json.default_branch;
    }
  }

  static async getGitTree(owner, name, defaultBranch) {
    const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${defaultBranch}?recursive=true`;
    console.log(`GET ${url}`);
    const res = await fetch(url);

    if (res.status !== 200) {
      throw new VisualizerRequestError(
        ErrorLogger.httpsError(res.url, res.status)
      );

    } else {
      const json = await res.json();
      return json.tree;
    }
  }

  static calculateTreeSizes(tree) {
    for (let entry of tree.entries) {
      if (entry.type === 'tree')
        Visualizer.calculateTreeSizes(entry);
      tree.size += entry.size;
    }
  }

  static buildTreeFromFlat(flatTree) {
    const tree = {
      type: 'tree',
      size: 0,
      entries: [],
    };

    for (const entry of flatTree) {
      const path = entry.path.split('/').slice(0, -1);
      const [name] = entry.path.split('/').slice(-1);

      // Navigate to spot in path
      let spot = tree;
      for (let stop of path)
        spot = spot.entries.find(entry => entry.name === stop);
      
      // Insert info at spot
      if (entry.type === 'tree') {
        spot.entries.push({
          name: name,
          type: 'tree',
          size: 0,
          entries: [],
        });
      } else if (entry.type === 'blob') {
        spot.entries.push({
          name: name,
          type: 'blob',
          size: entry.size,
        });
      } else {
        throw new Error(`Visualizer.buildTreeFromFlat() encountered unexpected entry type: "${entry.type}"`);
      }
    }

    // Do a DFS to calculate cumulative sizes of trees based on blobs (modifies
    // tree in-place)
    Visualizer.calculateTreeSizes(tree);

    return tree;
  }

  static getWindowSize() {
    return Math.min(
      window.innerHeight, 
      window.innerWidth
    );
  }

  static logScale(size, scalar) {
    size = Math.log(size) * scalar;
    size = Math.max(10, size);
    size = Math.min(500, size);
    return size;
  }

  static calculateDiameterFromScalar(tree, scalar) {
    const sizes = tree.entries.map(
      entry => Visualizer.logScale(entry.size, scalar)
    );
    const biggestEntrySize = Math.max(...sizes);
    const circumference = sizes.reduce((acc, curr) => acc + curr, 0);
    const diameter = circumference / Math.PI;
    return diameter + biggestEntrySize;
  }

  static calculateSizeScalarFromTree(tree) {
    const windowSize = Visualizer.getWindowSize();

    let scalar = 1;
    const PRECISION = 3;

    for (let i=0; i<PRECISION; i++) {
      const increment = 10 ** -i;
      while (
        Visualizer.calculateDiameterFromScalar(tree, scalar + increment) < windowSize
      ) {
        scalar += increment;
      }
    }
    // Get around JavaScript imprecision creating lots of trailing 9s (like 
    // 8.829999999 instead of 8.83)
    scalar = Math.round(scalar * 10 ** (PRECISION - 1)) / 10 ** (PRECISION - 1);

    return scalar;
  }

  static setNodeSize(node, size) {
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
  }

  static createRepoListItems(tree, scalar) {
    return tree.entries.map(entry => {
      const li = document.createElement('li');
      li.className = `_2d-centered circular repo-entry ${entry.type}`;
      li.innerText = entry.name;
      Visualizer.setNodeSize(
        li,
        Visualizer.logScale(entry.size, scalar),
      );

      return li;
    });      
  }

  static createDot(x, y, size=10) {
    const dot = document.createElement('div');
    dot.className = 'circular';
    dot.style.position = 'absolute';
    dot.style.backgroundColor = 'red';
    Visualizer.setNodeSize(dot, size);
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    return dot;
  }
}