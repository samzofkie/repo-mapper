//import { Hideable, HideableMain } from "./Hideable";
//import { debounce } from './debounce';
import { LandingPage } from "./LandingPage";


export class App {
  constructor() {
    this.landingPage = new LandingPage;
  }

  init() {
    if (window.location.pathname === '/') {
      this.landingPage.show();
    }
  }
}