type RgbColor = {
  b: number;
  g: number;
  r: number;
};

const thumbnailColorCache = new Map<string, RgbColor>();

export async function getThumbnailColor(
  thumbnailUrl: string | null,
  videoId: string,
): Promise<RgbColor> {
  const cachedColor = thumbnailColorCache.get(videoId);

  if (cachedColor) {
    return cachedColor;
  }

  if (!thumbnailUrl) {
    const fallbackColor = hashToColor(videoId);
    thumbnailColorCache.set(videoId, fallbackColor);
    return fallbackColor;
  }

  try {
    const sampledColor = await sampleImageColor(thumbnailUrl);
    thumbnailColorCache.set(videoId, sampledColor);
    return sampledColor;
  } catch {
    const fallbackColor = hashToColor(videoId);
    thumbnailColorCache.set(videoId, fallbackColor);
    return fallbackColor;
  }
}

export function getColorHue(color: RgbColor) {
  const red = color.r / 255;
  const green = color.g / 255;
  const blue = color.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;

  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  hue = Math.round(hue * 60);

  if (hue < 0) {
    hue += 360;
  }

  return hue;
}

export function getColorLightness(color: RgbColor) {
  const red = color.r / 255;
  const green = color.g / 255;
  const blue = color.b / 255;

  return (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
}

function sampleImageColor(url: string): Promise<RgbColor> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas is unavailable."));
        return;
      }

      context.drawImage(image, 0, 0, 16, 16);

      try {
        const pixels = context.getImageData(0, 0, 16, 16).data;
        let redTotal = 0;
        let greenTotal = 0;
        let blueTotal = 0;
        let sampleCount = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];

          if (alpha < 16) {
            continue;
          }

          redTotal += pixels[index];
          greenTotal += pixels[index + 1];
          blueTotal += pixels[index + 2];
          sampleCount += 1;
        }

        if (sampleCount === 0) {
          reject(new Error("Thumbnail had no readable pixels."));
          return;
        }

        resolve({
          r: Math.round(redTotal / sampleCount),
          g: Math.round(greenTotal / sampleCount),
          b: Math.round(blueTotal / sampleCount),
        });
      } catch {
        reject(new Error("Thumbnail pixels are not readable."));
      }
    };

    image.onerror = () => {
      reject(new Error("Thumbnail failed to load."));
    };

    image.src = url;
  });
}

function hashToColor(videoId: string): RgbColor {
  let hash = 0;

  for (let index = 0; index < videoId.length; index += 1) {
    hash = videoId.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;

  return hslToRgb(hue, 0.55, 0.5);
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = hue / 60;
  const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = secondary;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = secondary;
    green = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    green = chroma;
    blue = secondary;
  } else if (huePrime >= 3 && huePrime < 4) {
    green = secondary;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const match = lightness - chroma / 2;

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}
