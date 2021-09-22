let oldConsole: any = {};
const methods = ['log', 'debug', 'warn', 'info', 'error', 'assert', 'dir', 'profile'];

function disableConsole() {
  oldConsole = { ...console };
  methods.forEach(val => console[val] = () => { });
}
disableConsole();
/// <reference lib="webworker" />

import * as tf from '@tensorflow/tfjs/dist/tf';
// import * as tf from '@tensorflow/tfjs';
import Human from '@vladmandic/human/dist/human.esm';


let human;

const config = {
  face: {
    modelBasePath: './models/',
    face: {
      enabled: true,
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
      iris: { enabled: false },
    },
    body: { enabled: false },
    gesture: { enabled: false, },
    filter: { flip: false, },
    object: { enabled: false },
    hand: { enabled: false },
    videoOptimized: false,
    backend: 'webgl',
  },
  body: {
    modelBasePath: './models/',
    body: { enabled: true },
    face: { enabled: false },
    gesture: { enabled: false, },
    filter: { flip: false, },
    object: { enabled: false },
    hand: { enabled: false },
    videoOptimized: false,
    backend: 'webgl',
  },
  gesture: {
    modelBasePath: './models/',
    face: {
      enabled: true,
      detector: {
        rotation: true,
        skipFrames: 0,
        maxDetected: 1
      },
      description: { enabled: false },
      emotion: { enabled: false, },
      iris: { enabled: true },
    },
    gesture: { enabled: true, },
    body: { enabled: false },
    filter: { flip: false, },
    object: { enabled: false },
    hand: { enabled: false },
    videoOptimized: false,
    backend: 'webgl',
  },
  object: {
    modelBasePath: './models/',
    body: { enabled: false },
    face: { enabled: false },
    gesture: { enabled: false, },
    filter: { flip: false, },
    object: { enabled: true },
    hand: { enabled: false },
    videoOptimized: false,
    backend: 'webgl',
  },
};

addEventListener('message', async ({ data }) => {
  if (!human) {
    human = new Human(config[data.config]);
  }
  const image = new ImageData(new Uint8ClampedArray(data.image), data.width, data.height);
  const result = await human.detect(image, data.config);
  result.config = data.config;
  if (result.canvas) { // convert canvas to imageData and send it by reference
    const canvas = new OffscreenCanvas(result.canvas.width, result.canvas.height);
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.drawImage(result.canvas, 0, 0); }
    const img = ctx ? ctx.getImageData(0, 0, result.canvas.width, result.canvas.height) : null;
    result.canvas = null; // must strip original canvas from return value as it cannot be transfered from worker thread
    // @ts-ignore tslint wrong type matching for worker
    if (img) { postMessage({ ...result, image: img.data.buffer, width: data.width, height: data.height }, [img.data.buffer]); }
    // @ts-ignore tslint wrong type matching for worker
    else { postMessage({ ...result }); }
  } else {
    // @ts-ignore tslint wrong type matching for worker
    postMessage({ ...result });
  }
});
