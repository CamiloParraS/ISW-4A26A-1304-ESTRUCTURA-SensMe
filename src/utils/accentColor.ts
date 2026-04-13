/**
 * Samples a 1x1 downscaled version of the image. The browser interpolation
 * yields an averaged color in constant time for a lightweight accent pick.
 */
export function extractAccentColor(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve("#1db954");
        return;
      }

      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      resolve(`rgb(${r},${g},${b})`);
    };

    img.onerror = () => resolve("#1db954");
    img.src = imgUrl;
  });
}
