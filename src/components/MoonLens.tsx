import { memo, useEffect, useRef } from "react";
import { moonLightDirection } from "../lib/lunar-disk";

let texturePromise: Promise<ImageData> | undefined;
function loadMoonTexture() {
  texturePromise ??= new Promise<ImageData>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) { reject(new Error("Canvas indisponible")); return; }
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error("Texture lunaire indisponible"));
    image.src = "/assets/planets/moon-lroc-2k.jpg";
  }).catch((error) => { texturePromise = undefined; throw error; });
  return texturePromise;
}

interface MoonLensProps {
  illuminatedFraction: number;
  brightLimbAngleDeg: number;
  northAngleDeg?: number;
  size?: number;
}

export const MoonLens = memo(function MoonLens({ illuminatedFraction, brightLimbAngleDeg, northAngleDeg = 0, size = 320 }: MoonLensProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    loadMoonTexture().then((texture) => {
      if (cancelled) return;
      const context = canvasRef.current?.getContext("2d");
      if (!context) return;
      const output = context.createImageData(size, size);
      const light = moonLightDirection(illuminatedFraction, brightLimbAngleDeg);
      const angle = northAngleDeg * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let row = 0; row < size; row++) {
        const y = 1 - (row + 0.5) * 2 / size;
        for (let col = 0; col < size; col++) {
          const x = (col + 0.5) * 2 / size - 1;
          const radiusSquared = x * x + y * y;
          if (radiusSquared > 1) continue;
          const z = Math.sqrt(1 - radiusSquared);
          // Orthographic projection of the NASA albedo map. Reference relief:
          // lunar libration and eclipses are not simulated by this view.
          const localX = cos * x - sin * y;
          const localY = sin * x + cos * y;
          const u = 0.5 + Math.atan2(localX, z) / (2 * Math.PI);
          const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, localY))) / Math.PI;
          const source = (Math.min(texture.height - 1, Math.floor(v * texture.height)) * texture.width + Math.min(texture.width - 1, Math.floor(u * texture.width))) * 4;
          const incidence = x * light.x + y * light.y + z * light.z;
          const brightness = incidence > 0 ? 0.55 + 0.45 * Math.sqrt(incidence) : 0.035;
          const target = (row * size + col) * 4;
          for (let channel = 0; channel < 3; channel++) output.data[target + channel] = texture.data[source + channel] * brightness;
          output.data[target + 3] = 255;
        }
      }
      context.putImageData(output, 0, 0);
    }).catch(() => { /* The phase name and numerical illumination remain available. */ });
    return () => { cancelled = true; };
  }, [illuminatedFraction, brightLimbAngleDeg, northAngleDeg, size]);
  return <canvas ref={canvasRef} className="moon-lens-canvas" width={size} height={size} aria-hidden="true" />;
});
