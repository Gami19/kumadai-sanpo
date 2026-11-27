/** 原画スタンプ1点。viewBox は width×height、重心はインクの視覚中心。 */
export type StampArtwork = {
  width: number;
  height: number;
  centroidX: number;
  centroidY: number;
  xml: string;
};
