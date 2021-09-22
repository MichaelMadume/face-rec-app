import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'face-rec-app';

  oldConsole: any;
  methods = ['log', 'debug', 'warn', 'info', 'error', 'assert', 'dir', 'profile'];

  constructor() {
    // this.disableConsole();
  }

  disableConsole() {
    this.oldConsole = { ...console };
    this.methods.forEach(val => console[val] = () => { });
  }

  enableConsole() {
    this.methods.forEach((val) => console[val] = this.oldConsole[val]);
  }
}
