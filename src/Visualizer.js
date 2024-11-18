export class Visualizer {
  constructor() {
    this.main = document.querySelector('#visualizer');
    this.error = document.querySelector('#visualizer #error');

    this.hideError();

    try {
      const path = this.parsePath();
      this.owner = path[0];
      this.name = path[1];
    } catch (error) {
      this.showError(error.message);
    }

    this.getRepoDefaultBranch()
      .then(async (defaultBranch)=> {
        console.log(this.owner, this.name, defaultBranch);
      })
      .catch(error => {
        this.showError(error.message);
      });
  }

  show() {
    this.main.style.display = '';
    this.main.hidden = false;
  }

  hide() {
    this.main.style.display = 'none';
    this.main.hidden = true;
  }

  parsePath() {
    const path = window.location.pathname.split('/').slice(1);
    if (path.length !== 2)
      throw new Error('Pathname should be of the form /[owner]/[repo]!');
    return path;
  }

  showError(message) {
    this.error.style.display = 'block';
    this.error.innerText = message;
  }

  hideError() {
    this.error.style.display = 'none';
    this.error.innerText =  '';
  }

  async getRepoDefaultBranch() {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('defaultBranch')) {
      return searchParams.get('defaultBranch');
    } else {
      throw new Error('I haven\'t implemented looking up the default branch for an arbitrary repo yet!');
    }
  }

  async getGitHubRepo(owner, name, defaultBranch=null) {

  }

  async begin() {

  }
}