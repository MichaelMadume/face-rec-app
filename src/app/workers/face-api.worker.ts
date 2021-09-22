/// <reference lib="webworker" />

let oldConsole: any = {};
const methods = ['log', 'debug', 'warn', 'info', 'error', 'assert', 'dir', 'profile'];

function disableConsole() {
  oldConsole = { ...console };
  methods.forEach(val => console[val] = () => { });
}
disableConsole();
import './face-api.patch';
import * as tf from '@tensorflow/tfjs/dist/tf';
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm-nobundle.js';

let areModelsLoaded = false;

addEventListener('message', async ({ data }) => {

  if (!areModelsLoaded) {
    await loadModels();
    areModelsLoaded = true;
  }

  const imageData = new ImageData(new Uint8ClampedArray(data.image), data.width, data.height);
  const canvas = new OffscreenCanvas(data.width, data.height);
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  ctx?.putImageData(imageData, 0, 0);

  let result = await faceapi
    .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 192, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (result) {
    result.config = 'faceApi';
  } else {
    result = { config: 'faceApi' }
  }
  postMessage({ ...result });
});


async function loadModels() {
  const MODEL_URL = './face-models';
  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);
  await faceapi.loadFaceRecognitionModel(MODEL_URL);
}
