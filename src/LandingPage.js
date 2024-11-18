import { Attempter } from "./Attempter";
import { debounce } from "./debounce";
import { ErrorLogger } from "./ErrorLogger";

export class LandingPage {
  constructor() {
    this.main = document.querySelector('#landing-page');
    this.input = document.querySelector('#repo-search input');
    
    this.resultsList = document.querySelector('#repo-search ol');

    this.resultsAttempter = new Attempter({
      container: document.querySelector('#repo-search div'),
      loader: document.querySelector('#repo-search .spinner'),
      error: document.querySelector('#repo-search #error'),
      result: document.querySelector('#repo-search ol'),
    });
    this.resultsAttempter.hide();

    this.debouncedMakeSearchRequest = debounce(
      () => this.makeSearchRequest.call(this),
      1000
    );

    this.input.addEventListener(
      'input', 
      event => this.inputHandler.call(this, event)
    );
  }

  show() {
    this.main.style.display = '';
    this.main.hidden = false;
    this.input.focus();
  }

  hide() {
    this.main.style.display = 'none';
    this.main.hidden = true;
  }

  clearResults() {
    this.resultsList.replaceChildren();
  }

  // This method also has side effects in the UI-- either showing the 
  // #repo-search #results or the #repo-search #error
  async makeSearchRequest() {
    const term = encodeURIComponent(this.input.value);
    
    if (!term.length)
      return;

    const url = `https://api.github.com/search/repositories?q=${term}`;
    console.log(`GET ${url}`);
    const res = await fetch(url);

    if (res.status !== 200) {
      this.resultsAttempter.showError(
        ErrorLogger.httpsError(res.url, res.status)
      );

    } else {
      const { items } = await res.json();
      this.resultsList.append(
        ...items.map(this.createSearchResultsListItem)
      );
      this.resultsAttempter.showResult();
    }
  }

  createSearchResultsListItem(item) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const img = document.createElement('img');
    const span = document.createElement('span');
    const b = document.createElement('b');

    li.append(a);
    a.append(img, span);

    const owner = item.owner.login;
    const name = item.name;
    
    a.href = `/${owner}/${name}?defaultBranch=${item.default_branch}`;
    a.className = 'rounded centered tabable gray repo-card';

    img.src = `${item.owner.avatar_url}&s=48`;
    img.alt = `Avatar image for ${owner}/${name}`;

    span.append(`${owner} / `, b);

    b.innerText = name;

    return li;
  }

  async inputHandler(event) {
    this.clearResults();

    if (event.target.value === '') {
      this.resultsAttempter.hide();

    } else {
      this.resultsAttempter.showLoading();
      this.debouncedMakeSearchRequest();
    }
  }
}