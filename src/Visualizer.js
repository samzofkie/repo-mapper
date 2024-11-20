import { Tree, TreePathError, TreeRequestError } from './Tree';
import { Attempter } from './Attempter';


// The main *init* method is `loadRepo()`.
export class Visualizer {
  static ENTRY_SPACING = 5;
  static SCALAR_PRECISION = 3;

  constructor() {
    this.tree = new Tree;

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

  drawCircle() {
    const entries = Visualizer.getScaledEntries(this.tree);
    const diameter = Visualizer.calculateDiameterFromEntries(entries);
    const padding = Visualizer.getSizeOfLargestEntry(entries) / 2;

    const totalWidth = Visualizer.calculateTotalWidthFromEntries(entries);
    Visualizer.setNodeSize(this.result, totalWidth, totalWidth);

    const listItemNodes = Visualizer.createListItemNodes(
      entries, 
      diameter,
      padding,
    );
    this.result.append(...listItemNodes);
    this.repoAttempter.showResult();
  }

  static getWindowSize() {
    return Math.min(
      window.innerHeight, 
      window.innerWidth
    );
  }

  static logScale(size, scalar) {
    size = Math.log(size) * scalar;
    size = Math.max(10, size);
    size = Math.min(500, size);
    return size;
  }

  static scaleEntries(entries, scalar) {
    return entries.map(entry => ({
      ...entry,
      scaledSize: Visualizer.logScale(entry.size, scalar),
    }));
  }

  static calculateCircumferenceFromEntries(entries) {
    return entries.reduce(
      (acc, curr) => acc + curr.scaledSize,
      0
    ) + entries.length * Visualizer.ENTRY_SPACING;
  }

  static calculateDiameterFromEntries(entries) {
    return Visualizer.calculateCircumferenceFromEntries(entries) / Math.PI;
  }

  static getSizeOfLargestEntry(entries) {
    return entries.reduce(
      (acc, curr) => curr.scaledSize > acc.scaledSize ? curr : acc,
      entries[0]
    ).scaledSize;
  }

  static calculateTotalWidthFromEntries(entries) {
    return Visualizer.calculateDiameterFromEntries(entries) + 
      Visualizer.getSizeOfLargestEntry(entries);
  }

  static getScaledEntries(tree) {
    let entries = tree.entries.map(entry => ({
      name: entry.name,
      type: entry.type,
      size: entry.size,
      scaledSize: 0,
    }));
    const windowSize = Visualizer.getWindowSize();

    let scalar = 1;
    for (let i = 0; i < Visualizer.SCALAR_PRECISION; i++) {
      const increment = 10 ** -i;

      let width;
      do {
        entries = Visualizer.scaleEntries(entries, scalar);
        scalar += increment;
        width = Visualizer.calculateTotalWidthFromEntries(
          Visualizer.scaleEntries(entries, scalar + increment)
        );
      } while (width < windowSize)
    }

    // Get around JavaScript imprecision creating lots of trailing 9s (like 
    // 8.829999999 instead of 8.83)
    scalar = Math.round(
      scalar * 10 ** (Visualizer.SCALAR_PRECISION - 1)
    ) / 10 ** (Visualizer.SCALAR_PRECISION - 1);

    return entries;
  }

  static setNodeSize(node, size) {
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
  }

  static setNodePosition(node, x, y) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  }

  // This creates and sets the size and position of the list element nodes
  static createListItemNodes(entries, diameter, padding) {
    const listItemNodes = [];
    const circumference = Visualizer.calculateCircumferenceFromEntries(entries);
    const raidiansPerPixel = 2 * Math.PI / circumference;
    const radius = diameter / 2;
    const centerPoint = { 
      x: padding + radius,
      y: padding + radius
    };

    let angle = 0;
    for (let entry of entries) {
      const li = document.createElement('li');
      li.className = `_2d-centered circular repo-entry ${entry.type}`;
      li.innerText = entry.name;
      Visualizer.setNodeSize(li, entry.scaledSize);
      //li.style.fontSize = `${Visualizer.logScale(entry.size, 1)}px`;

      angle += raidiansPerPixel * (entry.scaledSize + Visualizer.ENTRY_SPACING) / 2;
      const point = {
        x: centerPoint.x + radius * Math.sin(angle) - entry.scaledSize / 2,
        y: centerPoint.y - radius * Math.cos(angle) - entry.scaledSize / 2,
      };
      Visualizer.setNodePosition(li, point.x, point.y);
      angle += raidiansPerPixel * (entry.scaledSize + Visualizer.ENTRY_SPACING) / 2;

      listItemNodes.push(li);
    }

    return listItemNodes;
  }
}