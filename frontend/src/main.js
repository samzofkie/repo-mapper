const globalState = {
  GHSearchReqPending: false,
};


function showRepoSearchResultsDiv() {
  const repoSearchResults = document.getElementById('repo-search-results');
  repoSearchResults.style.display = 'flex';
}

function hideRepoSearchResultsDiv() {
  const repoSearchResults = document.getElementById('repo-search-results');
  repoSearchResults.style.display = 'none';
  repoSearchResults.replaceChildren();
}


// This function uses globalState.GHSearchReqPending to reduce the frequency of
// calls to getGHSearch
async function meterGetGHSearch() {
  if (!globalState.GHSearchReqPending) {
    globalState.GHSearchReqPending = true;
    showRepoSearchResultsDiv();
    setTimeout(getGHSearch, 1000);
  }
}

async function getGHSearch() {
  const repoSearchInput = document.getElementById('repo-search-input');
  const q = repoSearchInput.value;  
  
  if (!q.length) {
    hideRepoSearchResultsDiv();
  } else {

    const searchURL = 
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}`;
    const res = await fetch(searchURL);

    if (res.status === 200) {
      const repoSearchResultsAnchors = createRepoSearchResultsAnchors(await res.json());
      const repoSearchResults = document.getElementById('repo-search-results');
      repoSearchResults.replaceChildren(...repoSearchResultsAnchors);


    } else {
      console.error(`$GET {searchURL} returned HTTP ${res.status}`);
    }
  }
  
  globalState.GHSearchReqPending = false;
}


function createRepoSearchResultsAnchors(json) {
  return json.items.map(repoData => {
    const owner = repoData.owner.login;
    const name = repoData.name;
    const avatarUrl = repoData.owner.avatar_url;

    const repo = document.createElement('a');
    repo.className = 'gray-area repo';
    repo.tabIndex = 0;
    
    const avatarImg = document.createElement('img');
    avatarImg.src = avatarUrl + '&s=48';
    avatarImg.alt = `Avatar image for the repository ${owner} ${name}`;

    const repoText = document.createElement('div');
    repoText.className = 'repo-text';

    const ownerSpan = document.createElement('span');
    ownerSpan.innerText = owner;

    const nameB = document.createElement('b');
    nameB.innerText = name;

    repoText.append(ownerSpan, '/', nameB);
    repo.append(avatarImg, repoText);

    return repo;
  });
}


async function init() {
  const repoSearchInput = document.getElementById('repo-search-input');
  repoSearchInput.addEventListener('input', meterGetGHSearch);
}

init();