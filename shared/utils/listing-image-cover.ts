/** Marketplace card media ratio — keep upload + cards + previews in sync. */
export const LISTING_COVER_RATIO = 3 / 2;
export const LISTING_COVER_WIDTH = 960;
export const LISTING_COVER_HEIGHT = Math.round(
  LISTING_COVER_WIDTH / LISTING_COVER_RATIO,
);

export type CoverCropRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/**
 * Center-crop source pixels into a 3:2 window (cover), matching card framing.
 */
export function coverCropRect(
  sourceWidth: number,
  sourceHeight: number,
  ratio = LISTING_COVER_RATIO,
): CoverCropRect {
  const width = Math.max(1, sourceWidth);
  const height = Math.max(1, sourceHeight);
  const sourceRatio = width / height;

  if (sourceRatio > ratio) {
    const sw = height * ratio;
    return {
      sx: (width - sw) / 2,
      sy: 0,
      sw,
      sh: height,
    };
  }

  const sh = width / ratio;
  return {
    sx: 0,
    sy: (height - sh) / 2,
    sw: width,
    sh,
  };
}
