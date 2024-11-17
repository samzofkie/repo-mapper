export class Hideable {
  constructor(query, displayValue='block') {
    this.node = document.querySelector(query);
    this.displayValue = displayValue;
    this.visible = this.node.style.display === 'none';
  }

  show() {
    this.node.style.display = this.displayValue;
    this.visible = true;
  }

  hide() {
    this.node.style.display = 'none';
    this.visible = false;
  }
}

export class HideableMain extends Hideable {
  constructor(displayValue, query) {
    super(displayValue, query);
  }

  show() {
    super.show();
    this.node.hidden = false;
  }

  hide() {
    super.hide();
    this.node.hidden = true;
  }
}