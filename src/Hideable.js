export class Hideable {
  constructor(
    query, 
    displayValue='block',
    options={doHidden: false}
  ) {
    console.log(options);
    this.node = document.querySelector(query);
    this.displayValue = displayValue;
    this.visible = this.node.style.display === 'none';
    this.doHidden = options.doHidden;
  }

  show() {
    this.node.style.display = this.displayValue;
    this.visible = true;
    if (this.doHidden)
      this.node.hidden = false;
  }

  hide() {
    this.node.style.display = 'none';
    this.visible = false;
    if (this.doHidden)
      this.node.hidden = true;
  }
}