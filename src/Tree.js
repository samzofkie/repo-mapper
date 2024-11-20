import { ErrorLogger } from './ErrorLogger';

export class TreePathError extends Error {}
export class TreeRequestError extends Error {}

export class Tree {
  static async loadTree() {
    let [owner, name] = Tree.parsePath();
    let defaultBranch = await Tree.getRepoDefaultBranch(owner, name);

    owner = encodeURIComponent(owner);
    name = encodeURIComponent(name);
    defaultBranch = encodeURIComponent(defaultBranch);

    let flatTree = await Tree.getGitTree(owner, name, defaultBranch);
    return Tree.buildTreeFromFlat(flatTree);
  }

  static parsePath() {
    const path = window.location.pathname.split('/').slice(1);
    if (path.length !== 2)
      throw new TreePathError('URL endpoint should be of the form /[owner]/[repo]!');
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
      throw new TreeRequestError(
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
      throw new TreeRequestError(
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
        Tree.calculateTreeSizes(entry);
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
          path: '/' + entry.path,
          type: 'tree',
          size: 0,
          entries: [],
        });
      } else if (entry.type === 'blob') {
        spot.entries.push({
          name: name,
          path: '/' + entry.path,
          type: 'blob',
          size: entry.size,
        });
      } else {
        //throw new Error(`Tree.buildTreeFromFlat() encountered unexpected entry type: "${entry.type}"`);
      }
    }

    // Do a DFS to calculate cumulative sizes of trees based on blobs (modifies
    // tree in-place)
    Tree.calculateTreeSizes(tree);

    return tree;
  }

  // "Mass" here is maybe misleading (?) What it means is the directory where
  // the sum of it's direct (not in a subdirectory) blob children is greatest.
  static calculateMassOfDirectory(entry) {
    return entry.entries.reduce(
      (acc, curr) => acc + (curr.type === 'blob' ? curr.size : 0),
      0
    );
  }

  static findDirectoryWithLargestMass(tree) {
    let largestMass = tree;

    for (let entry of tree.entries) {
      if (entry.type === 'tree') {
        let challenger = 
          Tree.findDirectoryWithLargestMass(entry);
        
        if (
          Tree.calculateMassOfDirectory(challenger) >
          Tree.calculateMassOfDirectory(largestMass)
        )
          largestMass = challenger;
      }
    }

    return largestMass;
  }
}