import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import Human from '@vladmandic/human/dist/human.esm';
import { timer } from 'rxjs';

@Component({
  selector: 'app-photo-modal',
  templateUrl: './photo-modal.component.html',
  styleUrls: ['./photo-modal.component.scss']
})
export class PhotoModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('videoElement') videoElement: any;
  @ViewChild('canvas') canvas: any;

  useCamera = false;
  allowCapture = false;
  private readonly constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      width: 500,
      height: 500
    }
  };
  video!: HTMLVideoElement;
  drawOptions = {
    bufferedOutput: false,
    drawBoxes: false,
    drawGaze: false,
    drawLabels: false,
    drawPolygons: true,
    drawPoints: false,
  };

  photo: string = '';
  fileData: File;

  human: Human = new Human({
    modelBasePath: './models/',
    face: {
      enabled: true,
      detector: {
        rotation: false,
        skipFrames: 1,
        maxDetected: 1
      },
      description: { enabled: false },
      emotion: { enabled: false, },
      iris: { enabled: true },
    },
    body: { enabled: false },
    gesture: { enabled: false, },
    filter: { flip: true, },
    object: { enabled: false },
    hand: { enabled: false },
    videoOptimized: true,
    backend: 'webgl',
  });

  isLive = true;


  constructor(
    public dialogRef: NbDialogRef<PhotoModalComponent>,
    public cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    this.video = this.videoElement.nativeElement as HTMLVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (stream) {
      this.video.srcObject = stream;
      await this.video.play();
      this.allowCapture = true;
      this.cd.detectChanges();
    }

  }

  async detectHuman() {
    while (this.isLive) {
      const result = await this.human.detect(this.video);
      if (result.error) {
        await timer(1000).toPromise();
        this.close();
      }
      this.drawMesh(result)
    }
  }

  initCameraAI() {
    this.detectHuman();
    this.useCamera = true;
  }

  drawMesh(result) {
    // draw image from video
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const input = this.video;
    const ctx = canvas.getContext('2d');

    if (result.canvas) {
      if (result.canvas.width !== canvas.width) canvas.width = result.canvas.width;
      if (result.canvas.height !== canvas.height) canvas.height = result.canvas.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.human.draw.face(canvas, result.face, this.drawOptions);
  }

  async capturePhoto(): Promise<void> {
    navigator.vibrate(200);
    this.video = this.videoElement.nativeElement as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 1);

    this.dialogRef.close(image);
  }

  async extractImage(event: Event) {
    const files = (event.target as (EventTarget & HTMLInputElement)).files as FileList;
    console.log(files.item(0));
    this.fileData = files.item(0);
    const image = await new Promise<string>((r, e) => {
      const reader = new FileReader();
      reader.readAsDataURL(this.fileData);
      reader.onload = () => r(reader.result as string);
      reader.onerror = error => e(error)
    });
    this.dialogRef.close(image);
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.isLive = false;
    this.video.pause();
    (this.video.srcObject as MediaStream).getTracks().forEach(s => s.stop());
  }

}
