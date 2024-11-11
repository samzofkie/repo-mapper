import { Hideable } from './Hideable';
import { RepoSearchResults, RepoSearchResultAnchor } from "./RepoSearch";


const globalState = {
  repoSearch: {
    spinner: new Hideable('block', 'repo-search-results-spinner'),
    results: new RepoSearchResults,
    input: document.getElementById('repo-search-input'),
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


async function init() {
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

init();