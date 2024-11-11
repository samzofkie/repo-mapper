export class Hideable {
  constructor(displayValue, id) {
    this.node = document.getElementById(id);
    this.visible = this.node.style.display === 'none';

    this.show = () => {
      this.node.style.display = displayValue;
      this.visible = true;
    };
  }

  hide() {
    this.node.style.display = 'none';
    this.visible = false;
  }
}