export type Size = {
  width: number;
  height: number;
};

export function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/** 縦横比を保ったまま、コンテナに収まるサイズ。 */
export function containSize(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): Size {
  'worklet';
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const factor = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  return {
    width: imageWidth * factor,
    height: imageHeight * factor,
  };
}

/**
 * 拡大後の画像が画面外へ流れすぎない平行移動の上限。
 * 収まる倍率では 0 になり、端の余白を越えてドラッグできない。
 */
export function translationBounds(
  containerWidth: number,
  containerHeight: number,
  fittedWidth: number,
  fittedHeight: number,
  scale: number,
) {
  'worklet';
  return {
    maxX: Math.max(0, (fittedWidth * scale - containerWidth) / 2),
    maxY: Math.max(0, (fittedHeight * scale - containerHeight) / 2),
  };
}

/**
 * 画面の中央へイラスト上の点を置く平行移動。
 * 拡大の原点は画像の中心で、平行移動は拡大したあとの画面上の距離。
 * 端の点は余白が出ない範囲までしか寄らない。
 */
export function focusTranslation(
  containerWidth: number,
  containerHeight: number,
  fittedWidth: number,
  fittedHeight: number,
  imageWidth: number,
  imageHeight: number,
  pixelX: number,
  pixelY: number,
  scale: number,
) {
  'worklet';
  if (imageWidth <= 0 || imageHeight <= 0 || fittedWidth <= 0 || fittedHeight <= 0) {
    return { x: 0, y: 0 };
  }
  const offsetX = (pixelX / imageWidth) * fittedWidth - fittedWidth / 2;
  const offsetY = (pixelY / imageHeight) * fittedHeight - fittedHeight / 2;
  const { maxX, maxY } = translationBounds(
    containerWidth,
    containerHeight,
    fittedWidth,
    fittedHeight,
    scale,
  );
  return {
    x: clamp(-offsetX * scale, -maxX, maxX),
    y: clamp(-offsetY * scale, -maxY, maxY),
  };
}
