import { Attempter } from './Attempter';
import { ErrorLogger } from './ErrorLogger';

class VisualizerPathError extends Error {}
class VisualizerRequestError extends Error {}

// The main *init* method is `loadRepo()`.
export class Visualizer {
  constructor() {
    this.main = document.querySelector('#visualizer');

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

    let owner, name, defaultBranch, flatTree, tree;
    try {
      [owner, name] = Visualizer.parsePath();
      defaultBranch = await Visualizer.getRepoDefaultBranch(owner, name);

      owner = encodeURIComponent(owner);
      name = encodeURIComponent(name);
      defaultBranch = encodeURIComponent(defaultBranch);

      flatTree = await Visualizer.getGitTree(owner, name, defaultBranch);
      tree = Visualizer.buildTreeFromFlat(flatTree);
      console.log(tree);

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

}