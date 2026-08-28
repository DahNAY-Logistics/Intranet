import { disableTypes, imageSize } from 'image-size';

import { bannerImageConstraints } from 'core/constants.ts';

disableTypes(['icns', 'jxl', 'heif']);

export interface ImageDimensions {
  width: number;
  height: number;
}

export function getImageDimensions(buffer: Buffer): ImageDimensions | null {
  try {
    const { width, height } = imageSize(buffer);
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

export function hasMinimumWidth({ width }: { width: number }): boolean {
  return width >= bannerImageConstraints.minWidthPx;
}

export function isLandscape({ width, height }: ImageDimensions): boolean {
  return width / height >= bannerImageConstraints.minAspectRatio;
}
