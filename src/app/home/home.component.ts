import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import Human from '@vladmandic/human/dist/human.esm';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
// import * as faceapi from '@vladmandic/face-api';
import { timer } from 'rxjs';
import { BiometricAuthService } from '../util/biometric-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  anim: AnimationOptions = {
    path: './assets/animations/lf30_editor_m7p8mca7.json',
  };

  workers: Worker[] = [];

  humanConfig = {
    modelBasePath: './models/',
  };


  options: AnimationOptions = {
    path: './assets/animations/lf30_editor_wy5zyka8.json',
    loop: false
  };
  progress = 0;
  isLoading = false;

  constructor(
    private router: Router,
    private bioAuthService: BiometricAuthService,

    private ngZone: NgZone
  ) { }

  async ngOnInit(): Promise<void> {
  }

  async ngAfterViewInit(): Promise<void> {
    this.isLoading = true;
    this.updateLoadingBar();
    await this.bioAuthService.initializeWorkers();
    console.log('init complete');
    this.isLoading = false;
    await timer(2500).toPromise();
    this.router.navigateByUrl('/set-reference');
  }

  animationCreated(animationItem: AnimationItem): void {
    animationItem.setSpeed(0.5);
    let direction = 1;
    animationItem.addEventListener('complete', () => {
      direction *= -1,
        animationItem.setDirection(direction as 1 | -1);
      animationItem.play();
    });
  }

  async updateLoadingBar() {
    this.progress = 0;
    let stepper = 0.5;
    while (this.isLoading && this.progress < 98) {
      await timer(50).toPromise();
      this.progress += stepper;
      stepper -= stepper / 260;
    }
    if (!this.isLoading) {
      this.progress = 100;
    }
  }

}
