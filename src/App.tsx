import { Button } from "~/components/ui/button";
import { createSignal } from "solid-js";
import { Input } from "~/components/ui/input";
import { Toaster, showToast } from "./components/ui/toast";

function App() {
  let canvas: HTMLCanvasElement | null = null;
  let downloadLink: HTMLAnchorElement | null = null;
  let compareCanvas: HTMLCanvasElement | null = null;
  const [context, setContext] = createSignal<CanvasRenderingContext2D | null>(
    null,
  );
  const [imageData, setImageData] = createSignal<ImageData | null>(null);
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [fileType, setFileType] = createSignal<string>("image/png");

  const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      setFileType(file.type);
      reader.onload = (e) => {
        const result = e.target?.result as string;

        const image = new Image();
        image.src = result;
        image.onload = () => {
          if (canvas && image) {
            const originalWidth = image.width;
            const originalHeight = image.height;

            let targetWidth = originalWidth;
            let targetHeight = originalHeight;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              setContext(ctx);
              ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
              const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
              setImageData(imgData);
              setImageLoaded(true);
              console.log("Image loaded successfully");

              if (!compareCanvas) {
                compareCanvas = document.createElement("canvas");
                compareCanvas.width = targetWidth;
                compareCanvas.height = targetHeight;
                compareCanvas.style.marginLeft = "20px";
                document
                  .getElementById("canvas-container")
                  ?.appendChild(compareCanvas);
              }
              const compareCtx = compareCanvas.getContext("2d");
              if (compareCtx) {
                compareCanvas.width = originalWidth;
                compareCanvas.height = originalHeight;
                compareCtx.drawImage(
                  image,
                  0,
                  0,
                  originalWidth,
                  originalHeight,
                );
              } else {
                console.log(
                  "Error: Unable to get 2d context for compareCanvas",
                );
              }
            }
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustPixelsLSB = () => {
    const ctx = context();
    const imgData = imageData();
    if (ctx && imgData) {
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = (data[i] & 0xfe) | (Math.random() > 0.5 ? 1 : 0); // R
        data[i + 1] = (data[i + 1] & 0xfe) | (Math.random() > 0.5 ? 1 : 0); // G
        data[i + 2] = (data[i + 2] & 0xfe) | (Math.random() > 0.5 ? 1 : 0); // B
      }
      ctx.putImageData(imgData, 0, 0);
      console.log("Pixels adjusted successfully");
      showToast({
        title: "image modified.",
        description: "done",
        variant: "success",
      });
    } else {
      console.log("Error: Unable to adjust pixels");
      showToast({
        title: "Unable to adjust pixels",
        variant: "error",
      });
    }
  };

  const compareImages = () => {
    if (!compareCanvas) {
      console.log("Error: compareCanvas is not initialized");
      return;
    }

    const ctx = context();
    const imgData = imageData();
    if (ctx && imgData) {
      const compareCtx = compareCanvas.getContext("2d");
      if (compareCtx) {
        const originalData = compareCtx.getImageData(
          0,
          0,
          compareCanvas.width,
          compareCanvas.height,
        );
        const data = imgData.data;
        const original = originalData.data;
        const diff = compareCtx.createImageData(
          compareCanvas.width,
          compareCanvas.height,
        );
        const diffData = diff.data;

        for (let i = 0; i < data.length; i += 4) {
          if (
            data[i] !== original[i] ||
            data[i + 1] !== original[i + 1] ||
            data[i + 2] !== original[i + 2]
          ) {
            diffData[i] = 255; // Red
            diffData[i + 1] = 0; // Green
            diffData[i + 2] = 0; // Blue
            diffData[i + 3] = 255; // Alpha
          } else {
            diffData[i] = original[i];
            diffData[i + 1] = original[i + 1];
            diffData[i + 2] = original[i + 2];
            diffData[i + 3] = original[i + 3];
          }
        }
        compareCtx.putImageData(diff, 0, 0);
        showToast({
          title: "Images compared successfully",
          description: "done",
          variant: "success",
        });
        console.log("Images compared successfully");
      } else {
        console.log("Error: Unable to get 2d context for compareCanvas");
      }
    }
  };

  const downloadImage = () => {
    if (canvas && downloadLink) {
      const image = canvas.toDataURL(fileType());
      downloadLink.href = image;
      downloadLink.download = `modified-image.${fileType().split("/")[1]}`;
      downloadLink.click();
      console.log("Image downloaded successfully");
    } else {
      console.log("Error: Unable to download image");
    }
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 class="text-xl font-bold mb-4">Upload and Modify Image</h1>
      <Input
        type="file"
        accept="image/jpeg, image/jpg, image/png"
        onChange={handleFileUpload}
        class="w-full max-w-xs mb-4"
      />

      <div id="canvas-container" class="w-full mb-4 flex justify-center">
        <canvas
          ref={(el) => (canvas = el)}
          class="max-w-full max-h-72" // максимальна висота 300 пікселів
          style={{
            display: imageLoaded() ? "block" : "none",
          }}
        />
        <canvas
          ref={(el) => (compareCanvas = el)}
          class="max-w-full max-h-72 ml-4" // максимальна висота 300 пікселів
          style={{
            display: imageLoaded() ? "block" : "none",
          }}
        />
      </div>
      <div class="flex space-x-4">
        <Button
          class="nes-btn is-primary"
          onClick={adjustPixelsLSB}
          disabled={!imageLoaded()}
        >
          Adjust Pixels
        </Button>
        <Button onClick={compareImages} disabled={!imageLoaded()}>
          Compare Image
        </Button>
        <Button onClick={downloadImage} disabled={!imageLoaded()}>
          Download Image
        </Button>
      </div>
      <a ref={(el) => (downloadLink = el)} style={{ display: "none" }}>
        Download
      </a>
      <Toaster />
    </div>
  );
}

export default App;
