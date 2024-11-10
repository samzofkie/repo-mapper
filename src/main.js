function createRepoSearchResultsAnchors(json) {
  return json.items.slice(0, 10).map(repoData => {
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

async function repoSearchInputHandler() {
  const div = document.getElementById('repo-search-results');
  const input = document.getElementById('repo-search-input');
  const spinner = document.getElementById('repo-search-results-spinner');
  const value = input.value;

  const clearDiv = () => {
    for (let child of [...div.children])
      if (child.id !== 'repo-search-results-spinner') 
        child.remove();
  }

  clearDiv();


  if (value.length) {
    spinner.style.display = 'block';
    div.style.display = 'flex';

    const searchURL = 
      `https://api.github.com/search/repositories?q=${encodeURIComponent(value)}`;
    console.log('requesting ' + searchURL);
    const res = await fetch(searchURL);

    spinner.style.display = 'none';

    if (res.status === 200) {
      const json = await res.json();
      const anchors = createRepoSearchResultsAnchors(json);

      // We call clearDiv here just to avoid multiple calls to 
      // repoSearchInputHandler appending their search results after the first
      // call to clearDiv above
      clearDiv();
      div.append(...anchors);

    } else {
      clearDiv();
      div.innerText = 'The request to the /search endpoint in GitHub\'s API failed for some reason!'
    }

  } else {
    div.style.display = 'none';
  }

}


async function init() {
  const repoSearchInput = document.getElementById('repo-search-input');
  repoSearchInput.addEventListener('input', repoSearchInputHandler);
}

init();