/** 開発用の模擬位置。本番の画面はこの型だけを参照し、座標は持たない。 */
export type DevMapFix = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  accuracyMeters: number;
};

export type DevLocationToggleProps = {
  selectedId: string | null;
  onChange: (fix: DevMapFix | null) => void;
};
