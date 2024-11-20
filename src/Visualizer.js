import { Attempter } from './Attempter';
import { ErrorLogger } from './ErrorLogger';

class VisualizerPathError extends Error {}
class VisualizerRequestError extends Error {}

// The main *init* method is `loadRepo()`.
export class Visualizer {
  static ENTRY_SPACING = 5;
  static SCALAR_PRECISION = 3;

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
      this.tree = Visualizer.buildTreeFromFlat(flatTree);
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

  drawCircle() {
    const entries = Visualizer.getScaledEntries(this.tree);
    const diameter = Visualizer.calculateDiameterFromEntries(entries);
    const padding = Visualizer.getSizeOfLargestEntry(entries) / 2;

    const totalWidth = Visualizer.calculateTotalWidthFromEntries(entries);
    Visualizer.setNodeSize(this.result, totalWidth, totalWidth);

    const listItemNodes = Visualizer.createListItemNodes(
      entries, 
      diameter,
      padding,
    );
    this.result.append(...listItemNodes);
    this.repoAttempter.showResult();
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

  static scaleEntries(entries, scalar) {
    return entries.map(entry => ({
      ...entry,
      scaledSize: Visualizer.logScale(entry.size, scalar),
    }));
  }

  static calculateCircumferenceFromEntries(entries) {
    return entries.reduce(
      (acc, curr) => acc + curr.scaledSize,
      0
    ) + entries.length * Visualizer.ENTRY_SPACING;
  }

  static calculateDiameterFromEntries(entries) {
    return Visualizer.calculateCircumferenceFromEntries(entries) / Math.PI;
  }

  static getSizeOfLargestEntry(entries) {
    return entries.reduce(
      (acc, curr) => curr.scaledSize > acc.scaledSize ? curr : acc,
      entries[0]
    ).scaledSize;
  }

  static calculateTotalWidthFromEntries(entries) {
    return Visualizer.calculateDiameterFromEntries(entries) + 
      Visualizer.getSizeOfLargestEntry(entries);
  }

  static getScaledEntries(tree) {
    let entries = tree.entries.map(entry => ({
      name: entry.name,
      type: entry.type,
      size: entry.size,
      scaledSize: 0,
    }));
    const windowSize = Visualizer.getWindowSize();

    let scalar = 1;
    for (let i = 0; i < Visualizer.SCALAR_PRECISION; i++) {
      const increment = 10 ** -i;

      let width;
      do {
        entries = Visualizer.scaleEntries(entries, scalar);
        scalar += increment;
        width = Visualizer.calculateTotalWidthFromEntries(
          Visualizer.scaleEntries(entries, scalar + increment)
        );
      } while (width < windowSize)
    }

    // Get around JavaScript imprecision creating lots of trailing 9s (like 
    // 8.829999999 instead of 8.83)
    scalar = Math.round(
      scalar * 10 ** (Visualizer.SCALAR_PRECISION - 1)
    ) / 10 ** (Visualizer.SCALAR_PRECISION - 1);

    return entries;
  }

  static setNodeSize(node, size) {
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
  }

  static setNodePosition(node, x, y) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  }

  // This creates and sets the size and position of the list element nodes
  static createListItemNodes(entries, diameter, padding) {
    const listItemNodes = [];
    const circumference = Visualizer.calculateCircumferenceFromEntries(entries);
    const raidiansPerPixel = 2 * Math.PI / circumference;
    const radius = diameter / 2;
    const centerPoint = { 
      x: padding + radius,
      y: padding + radius
    };

    let angle = 0;
    for (let entry of entries) {
      const li = document.createElement('li');
      li.className = `_2d-centered circular repo-entry ${entry.type}`;
      li.innerText = entry.name;
      Visualizer.setNodeSize(li, entry.scaledSize);
      //li.style.fontSize = `${Visualizer.logScale(entry.size, 1)}px`;

      angle += raidiansPerPixel * (entry.scaledSize + Visualizer.ENTRY_SPACING) / 2;
      const point = {
        x: centerPoint.x + radius * Math.sin(angle) - entry.scaledSize / 2,
        y: centerPoint.y - radius * Math.cos(angle) - entry.scaledSize / 2,
      };
      Visualizer.setNodePosition(li, point.x, point.y);
      angle += raidiansPerPixel * (entry.scaledSize + Visualizer.ENTRY_SPACING) / 2;

      listItemNodes.push(li);
    }

    return listItemNodes;
  }
}