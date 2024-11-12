import { Hideable } from './Hideable';

export class RepoSearchResults extends Hideable {
  constructor() {
    super('flex', 'repo-search-results');
  }

  clear() {
    for (let child of [...this.node.children])
      if (child.id !== 'repo-search-results-spinner') 
        child.remove();
  }
}


export class RepoSearchResultAnchor {
  constructor(data) {
    this.owner = data.owner.login;
    this.name = data.name;
    this.avatarUrl = data.owner.avatar_url;
    this.defaultBranch = data.default_branch;
    console.log(data.default_branch);

    this.root = document.createElement('a');
    this.image = document.createElement('img');
    this.textDiv = document.createElement('div');
    this.ownerSpan = document.createElement('span');
    this.nameText = document.createElement('b');
    
    this.root.className = 'gray-area repo';
    this.root.tabIndex = 0;
    this.root.href = `${this.owner}/${this.name}?defaultBranch=${this.defaultBranch}`;

    this.image.src = this.avatarUrl + '&s=48';
    this.image.alt = `Avatar image for the repository ${this.owner} ${this.name}`;

    this.textDiv.className = 'repo-text';
    this.ownerSpan.innerText = this.owner;
    this.nameText.innerText = this.name;

    this.textDiv.append(this.ownerSpan, '/', this.nameText);
    this.root.append(this.image, this.textDiv);
  }
}