import { Injectable } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { HumanModel } from '../models/human.model';
import { WorkerImageModel } from '../models/worker-image.model';

@Injectable({
  providedIn: 'root'
})
export class BiometricAuthService {

  // Results
  private humanResult: HumanModel = {
    gesture: [],
    body: [],
    face: [],
    object: [],
  };
  $result = new Subject<any>();
  private faceApiResult: any = {};

  private referenceUserFaceTemplate: any;

  // lock
  private processing = {
    face: false,
    faceApi: false,
    gesture: false,
    body: false,
    object: false,
  };

  // lock
  private readonly delay = {
    face: 150,
    faceApi: 130,
    gesture: 0,
    body: 70,
    object: 0,
  };

  // workers
  private humanWorkers: any = {};
  private faceApiWorker: Worker;

  private referenceImage!: HTMLImageElement;
  private webCamFeed!: HTMLVideoElement;

  isRunningDetection = false;

  private readonly authVericationInterval = 2_000;
  private readonly authDuration = 10_000;
  private readonly minumumIrisDistanceFromCamera = 15;

  private authFlags = {
    faceMatch: 0,
    faceMisMatch: 0,
    eyesClosed: 0,
    eyesOpen: 0,
    wristVisibleCount: 0,
    phoneVisibleCount: 0,
  }

  allowScanning = true;

  constructor() {
    this.faceApiWorker = new Worker('../workers/face-api.worker', { type: 'module' });
    this.humanWorkers.face = new Worker('../workers/human.worker', { type: 'module' });
    this.humanWorkers.body = new Worker('../workers/human.worker', { type: 'module' });
    this.humanWorkers.gesture = new Worker('../workers/human.worker', { type: 'module' });
    this.humanWorkers.object = new Worker('../workers/human.worker', { type: 'module' });
  }

  async initializeWorkers() {
    const initImg = await this.createImgElementFromSrc('./assets/images/fr-face.jpg');
    const workerImage = this.getWorkerImage(initImg, false);
    await Promise.all([this.initializeFaceApiWorker(workerImage), ...this.initializeHumanWorkers(workerImage)]);
  }

  async setReferenceImage(referenceImageSrc: string,) {
    this.resetFlags();
    this.referenceImage = await this.createImgElementFromSrc(referenceImageSrc);
    this.referenceUserFaceTemplate = await this.getTemplateDescriptors(this.getWorkerImage(this.referenceImage, false));
  }

  async authenticate(webCamFeed: HTMLVideoElement) {
    this.resetFlags();
    this.webCamFeed = webCamFeed;

    // run object, face, gesture and body detection
    this.isRunningDetection = true;
    this.humanWorkers.face.onmessage = this.processWorkerResults.bind(this);
    this.humanWorkers.body.onmessage = this.processWorkerResults.bind(this);
    this.humanWorkers.gesture.onmessage = this.processWorkerResults.bind(this);
    this.humanWorkers.object.onmessage = this.processWorkerResults.bind(this);
    this.faceApiWorker.onmessage = this.processWorkerResults.bind(this);
    this.runDetection();

  }

  async getUserDistanceValidity(webCamFeed: HTMLVideoElement) {
    const image = this.getWorkerImage(webCamFeed, true);
    const { face } = await new Promise<any>((resolve) => {
      this.humanWorkers.gesture.onmessage = ({ data }) => {
        resolve(data);
      };
      this.postWorkerMessage(image, 'gesture');
    })
    console.log(face[0]?.iris)
    this.getUserDistanceValidity(webCamFeed)
  }

  private validateResult() {
    // if (!this.authFlags.eyesClosed || (this.authFlags.eyesClosed / (this.authFlags.eyesClosed + this.authFlags.eyesOpen) > 0.3)) { return false; }

    if (this.authFlags.wristVisibleCount) { return false; }

    if (this.authFlags.phoneVisibleCount) { return false; }

    const percentageMatch = 100 * this.authFlags.faceMatch / (this.authFlags.faceMatch + this.authFlags.faceMisMatch);
    if (percentageMatch < 80 || this.authFlags.faceMatch < 5) { return false; }
    return true;
  }

  private async getTemplateDescriptors(image: WorkerImageModel) {
    const [human, { face }] = await Promise.all([
      new Promise<any>((resolve) => {
        this.faceApiWorker.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image);
      }),
      new Promise<any>((resolve) => {
        this.humanWorkers.face.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image, 'face');
      }),
    ]);
    const embedding = face[0]?.embedding;
    const descriptor = human.descriptor;
    return { descriptor, embedding };
  }

  private processWorkerResults(response) {
    const result = response.data as HumanModel;
    if (result.config) {
      this.humanResult[result.config as string] = result[result.config as string];
    }

    switch (result.config) {
      case 'face':
        this.checkFaceMatch();
        break;

      case 'body':
        this.checkWristVisible(this.humanResult[result.config as string]);
        break;

      case 'gesture':
        this.checkBlink(this.humanResult[result.config as string]);
        if(this.humanResult['face'].length && this.humanResult['face'][0]) {
          this.humanResult['face'][0].iris = result['face'][0]?.iris;
        }
        break;

      case 'object':
        this.checkPhoneVisible(this.humanResult[result.config as string]);
        break;

      default:
        this.faceApiResult = response.data;
        this.checkFaceMatch();
        break;
    }
    this.processing[result.config as string] = false;
    this.$result.next({ authFlags: this.authFlags, humanResult: this.humanResult })
    console.log(this.authFlags)
  }

  private checkFaceMatch() {
    const faceApiSimilarity = 1 - this.euclideanDistance(this.referenceUserFaceTemplate.descriptor, this.faceApiResult.descriptor ?? []);
    const humanSimilarity = this.similarity(this.referenceUserFaceTemplate?.embedding, this.humanResult.face[0]?.embedding);
    console.log(faceApiSimilarity, humanSimilarity);

    const result = ((faceApiSimilarity && humanSimilarity) ? ((faceApiSimilarity + humanSimilarity) / 2) : (faceApiSimilarity + humanSimilarity)) * 100;
    if (result === 0 || result < 40) {
      this.authFlags.faceMisMatch++;
    } else if (result > 50) {
      this.authFlags.faceMatch++;
    }
  }

  private checkBlink(gesture: any[]) {
    const blinked = gesture.map(g => g.gesture).filter((r: string) => r.toLowerCase().includes('blink')).length;
    if (blinked) {
      this.authFlags.eyesClosed++;
    } else {
      this.authFlags.eyesOpen++;
    }
  }

  private checkPhoneVisible(object: any[]) {
    const phoneVisible = object.map(o => o.label).includes('cell phone') || object.map(o => o.label).includes('remote');
    if (phoneVisible) {
      this.authFlags.phoneVisibleCount++;
    }
  }

  private checkWristVisible(body: any[]) {
    const wristVisible = !!body[0]?.keypoints.map(k => k.part).filter((p: string) => p.toLowerCase().includes('wrist')).length;
    if (wristVisible) {
      this.authFlags.wristVisibleCount++;
    }
  }

  private async runDetection() {
    if (!this.isRunningDetection) { return; }
    const image = this.getWorkerImage(this.webCamFeed);

    if (!this.processing.faceApi) {
      this.processing.faceApi = true;
      setTimeout(() => {
        this.postWorkerMessage(image);
      }, this.delay.faceApi);
    }
    if (!this.processing.face) {
      this.processing.face = true;
      setTimeout(() => {
        this.postWorkerMessage(image, 'face');
      }, this.delay.face);
    }
    if (!this.processing.body) {
      this.processing.body = true;
      setTimeout(() => {
        this.postWorkerMessage(image, 'body');
      }, this.delay.body);
    }
    if (!this.processing.gesture) {
      this.processing.gesture = true;
      setTimeout(() => {
        this.postWorkerMessage(image, 'gesture');
      }, this.delay.gesture);
    }
    if (!this.processing.object) {
      this.processing.object = true;
      setTimeout(() => {
        this.postWorkerMessage(image, 'object');
      }, this.delay.object);
    }
    requestAnimationFrame(this.runDetection.bind(this));
  }

  private initializeFaceApiWorker(image: WorkerImageModel) {
    return new Promise<any>((resolve) => {
      this.faceApiWorker.onmessage = ({ data }) => {
        resolve(data);
      };
      this.postWorkerMessage(image);
    });
  }

  private initializeHumanWorkers(image: WorkerImageModel) {
    return [
      new Promise<any>((resolve) => {
        this.humanWorkers.face.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image, 'face');
      }),
      new Promise<any>((resolve) => {
        this.humanWorkers.body.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image, 'body');

      }),
      new Promise<any>((resolve) => {
        this.humanWorkers.gesture.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image, 'gesture');

      }),
      new Promise<any>((resolve) => {
        this.humanWorkers.object.onmessage = ({ data }) => {
          resolve(data);
        };
        this.postWorkerMessage(image, 'object');
      }),
    ];
  }

  private createImgElementFromSrc(src: string) {
    const image = new Image();
    image.src = src;
    const imagePromise = new Promise<HTMLImageElement>(async (resolve) => {
      image.onload = () => {
        resolve(image);
      };
    });
    return imagePromise;
  }

  private postWorkerMessage(image: WorkerImageModel, config?: string) {
    const message = {
      image: image.imageData.data.buffer,
      width: image.canvas.width,
      height: image.canvas.height,
    };
    const transfer = [image.imageData.data.buffer.slice(0)]
    if (config) {
      this.humanWorkers[config].postMessage({
        ...message, config
      }, transfer);
    } else {
      this.faceApiWorker.postMessage({
        ...message
      }, transfer);
    }
  }

  private getWorkerImage(image: HTMLImageElement | HTMLVideoElement, isVideo = true): WorkerImageModel {
    const canvas = isVideo ? new OffscreenCanvas(environment.frameWidth, environment.frameHeight) : new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height) as ImageData;
    return ({ imageData, canvas });
  }

  private resetFlags() {
    this.isRunningDetection = false;
    // Results
    this.humanResult = {
      gesture: [],
      body: [],
      face: [],
      object: [],
    };
    this.faceApiResult = {};
    // lock
    this.processing = {
      face: false,
      faceApi: false,
      gesture: false,
      body: false,
      object: false,
    };

    this.authFlags = {
      faceMatch: 0,
      faceMisMatch: 0,
      eyesClosed: 0,
      eyesOpen: 0,
      wristVisibleCount: 0,
      phoneVisibleCount: 0,
    }
  }

  private similarity(embedding1: Array<number>, embedding2: Array<number>, order = 2): number {
    if (!embedding1 || !embedding2) return 0;
    if (embedding1?.length === 0 || embedding2?.length === 0) return 0;
    if (embedding1?.length !== embedding2?.length) return 0;
    // general minkowski distance, euclidean distance is limited case where order is 2
    const distance = 5.0 * embedding1
      .map((_val, i) => (Math.abs(embedding1[i] - embedding2[i]) ** order)) // distance squared
      .reduce((sum, now) => (sum + now), 0) // sum all distances
      ** (1 / order); // get root of
    const res = Math.max(0, 100 - distance) / 100.0;
    return res;
  }

  private euclideanDistance(arr1: number[] | Float32Array, arr2: number[] | Float32Array) {
    if (arr1?.length !== arr2?.length) return 1;
    const desc1 = Array.from(arr1);
    const desc2 = Array.from(arr2);
    return Math.sqrt(
      desc1
        .map((val, i) => val - desc2[i])
        .reduce((res, diff) => res + (diff ** 2), 0),
    );
  }

}
