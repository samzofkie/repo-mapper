import { LandingPage } from './LandingPage';
import { Visualizer } from './Visualizer';


export class App {
  constructor() {
    this.landingPage = new LandingPage;
    this.visualizer = new Visualizer;
  }

  init() {
    if (window.location.pathname === '/') {
      this.landingPage.show();
    } else {
      this.visualizer.show();
      this.visualizer.begin();
    }
  }
}