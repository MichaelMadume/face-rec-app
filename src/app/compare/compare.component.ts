import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { PhotoModalComponent } from '../photo-modal/photo-modal.component';
import Human from '@vladmandic/human/dist/human.esm';
import * as faceapi from '@vladmandic/face-api';
import { timer } from 'rxjs';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss']
})
export class CompareComponent implements OnInit {

  humanConfig = {
    modelBasePath: './models/',
    face: {
      detector: {
        rotation: true,
        skipFrames: 0,
        maxDetected: 1
      },
      description: {
        enabled: true,
        skipFrames: 0,
      },
      emotion: { enabled: false, },
      iris: { enabled: true },
    },
    body: { enabled: false },
    gesture: { enabled: false, },
    filter: { flip: false, },
    hand: { enabled: false },
    videoOptimized: false,
    backend: 'webgl',
  };

  workers: Worker[] = [];

  image1!: string;
  image2!: string;

  closeness = 0;
  @ViewChild('imageI') imageElement1: any;
  @ViewChild('imageII') imageElement2: any;


  human: Human = new Human(this.humanConfig);
  comparisonMessageCode!: number;
  comparisonMessages = [
    'No Match!',
    'Not Sure!',
    'Match!',
    'Loading'
  ]
  statuses: NbComponentStatus[] = [
    'danger',
    'warning',
    'success',
    'info'
  ]

  constructor(
    private dialogService: NbDialogService,
    private cd: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.workers.push(new Worker('../human.worker', { type: 'module' }));
    this.workers.push(new Worker('../human.worker', { type: 'module' }));
    this.workers.push(new Worker('../face-api.worker', { type: 'module' }));
    this.workers.push(new Worker('../face-api.worker', { type: 'module' }));
  }

  async setPhoto(id: number) {
    const photo = await this.dialogService.open(PhotoModalComponent)
      .onClose.toPromise();

    if (!photo) return;

    if (id === 1) {
      this.image1 = photo;
    }
    if (id === 2) {
      this.image2 = photo;
    }

    this.comparisonMessageCode = 3;

    this.cd.detectChanges();

    const result = (await this.checkSimilarity());
    this.closeness = result;
    if (result === 0 || result < 40) {
      this.comparisonMessageCode = 0;
    } else if (result > 40 && result <= 50) {
      this.comparisonMessageCode = 1;
    } else if (result > 50) {
      this.comparisonMessageCode = 2
    }

    this.cd.detectChanges();
  }

  async checkSimilarity() {
    if (!this.image1 || !this.image2) {
      return 0;
    }


    let similarity = 0, similarity2 = 0;

    const [firstResult, secondResult, firstResultFaceApi, secondResultFaceApi] = await this.workerDetections([this.imageElement1.nativeElement, this.imageElement2.nativeElement]);
    this.cd.detectChanges();

    // return;

    similarity = 100 * this.human.similarity(firstResult.face[0]?.embedding, secondResult.face[0]?.embedding);

    similarity2 = 100 * this.getSimilarityFaceApi(firstResultFaceApi, secondResultFaceApi) ?? 0;

    console.log(similarity, similarity2)
    return (similarity && similarity2) ? ((similarity + similarity2) / 2) : (similarity + similarity2);

  }

  getSimilarityFaceApi(first, second) {
    if (first?.descriptor && second?.descriptor) {
      return 1 - faceapi.euclideanDistance(Array.from(first.descriptor), Array.from(second.descriptor))
    } else {
      return 0;
    }
  }

  async imageDataInit(inputs: HTMLImageElement[]) {
    await timer(1).toPromise()

    const result = inputs.map((i) => {
      const canvas = new OffscreenCanvas(i.width, i.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(i, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return ({ imageData, canvas })
    })

    return result;
  }

  async workerDetections(inputs: HTMLImageElement[]) {

    const results = await this.imageDataInit(inputs);

    return Promise.all([...this.humanWorkerExec(results), ...this.faceApiExec(results)])
  }

  humanWorkerExec(results: {
    imageData: ImageData;
    canvas: OffscreenCanvas;
  }[]) {
    return results.map((r, i) => {
      return new Promise<any>((resolve) => {
        this.workers[i].onmessage = ({ data }) => {
          resolve(data);
        };
        this.workers[i].postMessage({
          image: r.imageData.data.buffer,
          width: r.canvas.width,
          height: r.canvas.height,
          config: this.humanConfig
        }, [r.imageData.data.buffer.slice(0)]);
      })
    })
  }

  faceApiExec(results: {
    imageData: ImageData;
    canvas: OffscreenCanvas;
  }[]) {
    return results.map((r, i) => {
      return new Promise<any>((resolve) => {
        this.workers[i + 2].onmessage = ({ data }) => {
          resolve(data);
        };
        this.workers[i + 2].postMessage({
          image: r.imageData.data.buffer,
          width: r.canvas.width,
          height: r.canvas.height,
          config: this.humanConfig
        }, [r.imageData.data.buffer.slice(0)]);
      })
    })
  }

}
