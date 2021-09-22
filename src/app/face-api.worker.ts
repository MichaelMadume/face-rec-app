/// <reference lib="webworker" />
import './face-api.patch';
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm';

let areModelsLoaded = false;


addEventListener('message', async ({ data }) => {

  if (!areModelsLoaded) {
    console.log('here')
    await loadModels();
    areModelsLoaded = true;
  }

  const imageData = new ImageData(new Uint8ClampedArray(data.image), data.width, data.height);
  const canvas =  new OffscreenCanvas(data.width, data.height);
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);

  const result = await faceapi
    .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 192, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
    console.log(result)
  postMessage({ ...result });
});


async function loadModels() {
  const MODEL_URL = './face-models';
  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);
  await faceapi.loadFaceRecognitionModel(MODEL_URL);
}