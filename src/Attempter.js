class Hider {
  static hide(...nodes) {
    nodes.forEach(node => node.style.display = 'none');
  }

  static show(...nodes) {
    nodes.forEach(node => node.style.display = '');
  }
}

// Attemptor attempts to capture a repeated logic between 4 elements:
//   - a <u>container</u> holds the others
//   - a <u>loader</u> is displayed whenever the action is taking place
//   - an <u>error</u> displays an error message when the action fails 
//     (the default implementation of showError() sets error's `.innerText`)
//   - a <u>result</u> that displays the results
export class Attempter {
  constructor(elems) {
    if (
      (this.container = elems.container) === undefined ||
      (this.loader = elems.loader) === undefined ||
      (this.error = elems.error) === undefined ||
      (this.result = elems.result) === undefined
    ) {
      throw new Error('Attemptor needs to be initialzed with an object with four properties: `.container`, `.loader`, `.error`, and `.result`!');
    }
  }

  hide() {
    Hider.hide(this.container);
  }

  showLoading() {
    Hider.hide(this.error, this.result);
    Hider.show(this.container, this.loader);
  }

  showError(message) {
    this.error.innerText = message;
    Hider.hide(this.loader, this.result);
    Hider.show(this.container, this.error);
  }

  showResult() {
    Hider.hide(this.loader, this.error);
    Hider.show(this.container, this.result);
  }
}