/// <reference lib="webworker" />
import Human from '@vladmandic/human/dist/human.esm';

let human;

addEventListener('message', async ({ data }) => {
  if (!human) {
    human = new Human(data.config);
  }
  const image = new ImageData(new Uint8ClampedArray(data.image), data.width, data.height);
  let result = await human.detect(image, data.config);
  console.log(result)
  if (result.canvas) { // convert canvas to imageData and send it by reference
    const canvas = new OffscreenCanvas(result.canvas.width, result.canvas.height);
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(result.canvas, 0, 0);
    const img = ctx ? ctx.getImageData(0, 0, result.canvas.width, result.canvas.height) : null;
    result.canvas = null; // must strip original canvas from return value as it cannot be transfered from worker thread
    // @ts-ignore tslint wrong type matching for worker
    if (img) postMessage({ ...result, image: img.data.buffer, width: data.width, height: data.height }, [img.data.buffer]);
    // @ts-ignore tslint wrong type matching for worker
    else postMessage({ ...result });
  } else {
    // @ts-ignore tslint wrong type matching for worker
    postMessage({ ...result });
  }

});
