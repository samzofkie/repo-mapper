import { Tree, TreePathError, TreeRequestError } from './Tree';
import { Attempter } from './Attempter';
import { BlobGaggle } from './BlobGaggle';
import { FontSizer } from './FontSizer';
import { langMap } from './langMap';

export class Visualizer {
  constructor() {
    this.tree = null;

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
      this.tree = await Tree.loadTree();
    } catch (error) {
      if (
        error instanceof TreePathError ||
        error instanceof TreeRequestError
      ) {
        this.repoAttempter.showError(error.message);
        return;
      } else
        throw error;
    }
  }

  static getWindowSize() {
    return Math.min(
      window.innerHeight, 
      window.innerWidth
    );
  }

  drawRepo() {
    let dir = this.tree
      .entries.find(e => e.name === 'packages')
      .entries.find(e => e.name === 'react-client')
      .entries.find(e => e.name === 'src');
    console.log(dir.entries.filter(e => e.type === 'tree'));
    const bg = new BlobGaggle(dir);
    const diameter = Visualizer.getWindowSize();
    const [scalar, rows] = bg.calculateScalarAndRows(diameter);
    const blobs = bg.scaleBlobs(scalar);

    const ol = document.createElement('ol');
    ol.className = 'circular unstyled-list blob-gaggle';
    ol.style.width = `${diameter}px`;
    ol.style.height = `${diameter}px`;

    const rowDivs = rows.map(() => {
      const div = document.createElement('div');
      div.className = 'row';
      return div;
    });
    ol.append(...rowDivs);

    const lis = blobs.map(blob => {
      const li = document.createElement('li');
      li.className = `_2d-centered circular gaggle-blob`;

      const extension = blob.name.split('.').slice(-1)[0];
      if (langMap.has(extension))
        li.className += ` ${langMap.get(extension)}`;
      
      const fontWidth = FontSizer.getTextWidth(
        blob.name, 
        FontSizer.getCanvasFont(li),
      );
      if (fontWidth < blob.size)
        li.innerText = blob.name;
      
      li.style.width = `${blob.size}px`;
      li.style.height = `${blob.size}px`;
      return li;
    });

    let start = 0, i=0;
    for (let row of rows) {
      rowDivs[i].append(
        ...lis.slice(start, start + row)
      );
      start += row;
      i++;
    }

    this.main.append(ol);
    this.repoAttempter.showResult();
  }
}