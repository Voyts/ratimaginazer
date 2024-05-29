import { Button } from "~/components/ui/button";
import { createSignal } from "solid-js";
import { Input } from "~/components/ui/input";
import { Toaster, showToast } from "./components/ui/toast";

function App() {
  let canvas: HTMLCanvasElement | null = null;
  let downloadLink: HTMLAnchorElement | null = null;
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
      setFileType(file.type); // Зберігаємо тип файлу
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
            if (originalWidth > originalHeight) {
              if (originalWidth > 300) {
                targetWidth = 300;
                targetHeight = (300 * originalHeight) / originalWidth;
              }
            } else {
              if (originalHeight > 300) {
                targetHeight = 300;
                targetWidth = (300 * originalWidth) / originalHeight;
              }
            }

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
      let pixelsChanged = 0;
      for (let i = 0; i < data.length; i += 4) {
        const rOriginal = data[i];
        const gOriginal = data[i + 1];
        const bOriginal = data[i + 2];

        const rNew = (rOriginal & 0xfe) | (Math.random() > 0.5 ? 1 : 0);
        const gNew = (gOriginal & 0xfe) | (Math.random() > 0.5 ? 1 : 0);
        const bNew = (bOriginal & 0xfe) | (Math.random() > 0.5 ? 1 : 0);

        if (rOriginal !== rNew || gOriginal !== gNew || bOriginal !== bNew) {
          pixelsChanged++;
        }

        data[i] = rNew; // R
        data[i + 1] = gNew; // G
        data[i + 2] = bNew; // B
        // Альфа-канал (data[i + 3]) не змінюється
      }
      ctx.putImageData(imgData, 0, 0);
      console.log("Pixels adjusted successfully");
      showToast({
        title: "Image modified",
        description: `Number of pixels changed: ${pixelsChanged}`,
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
      <div class="w-full mb-4 flex justify-center">
        <canvas
          ref={(el) => (canvas = el)}
          class="max-w-full max-h-72" // максимальна висота 300 пікселів
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
