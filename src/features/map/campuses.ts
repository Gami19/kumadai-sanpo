export type CampusId = 'kurokami-north' | 'kurokami-south' | 'honjo' | 'ooe';

export type CampusMap = {
  id: CampusId;
  /** 切り替えボタンに出す短い名前。 */
  label: string;
  /**
   * 画面に出す絵本風イラスト。
   * 下敷き（data/geo の確定版）は座標の基準で、ピンを載せる段まで画面には出さない。
   */
  illustration: number;
};

export const campuses: readonly CampusMap[] = [
  {
    id: 'kurokami-north',
    label: '黒髪北',
    illustration: require('../../../assets/illustrations/kurokami-north-illustrated.webp'),
  },
  {
    id: 'kurokami-south',
    label: '黒髪南',
    illustration: require('../../../assets/illustrations/kurokami-south-illustrated.webp'),
  },
  {
    id: 'honjo',
    label: '本荘',
    illustration: require('../../../assets/illustrations/honjo-illustrated.webp'),
  },
  {
    id: 'ooe',
    label: '大江',
    illustration: require('../../../assets/illustrations/ooe-illustrated.webp'),
  },
];
