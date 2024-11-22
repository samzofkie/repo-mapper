import { LandingPage } from './LandingPage';
import { Visualizer } from './Visualizer';


export class App {
  constructor() {
    this.landingPage = new LandingPage;
    this.visualizer = new Visualizer;
  }

  async init() {
    if (window.location.pathname === '/') {
      this.landingPage.show();
    } else {
      this.visualizer.show();
      await this.visualizer.loadRepo();
      this.visualizer.drawRepo();
    }
  }
}