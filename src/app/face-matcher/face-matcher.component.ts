import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { BiometricAuthService } from '../util/biometric-auth.service';
import { HumanModel } from '../models/human.model';

@Component({
  selector: 'app-face-matcher',
  templateUrl: './face-matcher.component.html',
  styleUrls: ['./face-matcher.component.scss'],
})
export class FaceMatcherComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('videoElement') videoElement: any;

  private readonly constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      width: environment.frameWidth,
      height: environment.frameHeight,
      frameRate: { ideal: 60 }
    }
  };
  video!: HTMLVideoElement;


  isReady = false;
  isLoading = false;

  isReading = false;

  useCamera = true;

  faceData: any;
  gestureData: any;
  authFlags: any;

  constructor(
    private bioAuthService: BiometricAuthService,
    protected location: Location,
  ) { }

  ngOnInit(): void {
    this.bioAuthService.$result.subscribe((result) => {
      console.log(result.humanResult)
      if(result.humanResult.face[0]) {
        result.humanResult.face[0].iris = result.humanResult.face[0].iris || this.faceData?.iris;
        this.faceData = {...this.faceData, ...result.humanResult.face[0]};
      }
      if(result.humanResult.gesture.length) {
        this.gestureData = result.humanResult.gesture;
      }
      console.log(result)
      this.authFlags = result.authFlags;
    })
  }


  async ngAfterViewInit(): Promise<void> {

    this.video = this.videoElement.nativeElement as HTMLVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (stream) {
      this.video.srcObject = stream;
      await this.video.play();
      this.isReady = true;
    }

  }

  goBack() {
    this.location.back();
  }

  toggleReading() {
    this.isReading = !this.isReading;
    if (this.isReading) {
      this.bioAuthService.authenticate(this.video);
    } else {
      this.bioAuthService.isRunningDetection = false;
    }
  }

  clearReadingResults() {

  }

  ngOnDestroy() {
    this.bioAuthService.isRunningDetection = false;
    this.video.pause();
    (this.video.srcObject as MediaStream).getTracks().forEach(s => s.stop());

  }

}
