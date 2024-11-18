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

    let path;
    try {
      path = this.parsePath();
    } catch (error) {
      if (error instanceof VisualizerPathError) {
        this.repoAttempter.showError(error.message);
        return;
      } else
        throw error;
    }

    this.owner = path[0];
    this.name = path[1];

    let defaultBranch;
    try {
      defaultBranch = await this.getRepoDefaultBranch();
    } catch (error) {
      if (error instanceof VisualizerRequestError) {
        this.repoAttempter.showError(error.message);
        return;
      } else
        throw error;
    }

    console.log(this.owner, this.name, defaultBranch);

  }

  parsePath() {
    const path = window.location.pathname.split('/').slice(1);
    if (path.length !== 2)
      throw new VisualizerPathError('URL endpoint should be of the form /[owner]/[repo]!');
    return path;
  }

  async getRepoDefaultBranch() {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('defaultBranch'))
      return searchParams.get('defaultBranch');

    const url = `https://api.github.com/repos/${this.owner}/${this.name}`;
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
  
}