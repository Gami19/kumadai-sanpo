/**
 * 人物データの画面表示用ヘルパー。
 * 欠けた項目（空・「未確認」）は項目ごと出さない。「？」や「未確認」の表記は使わない。
 * データ側の「未確認」はそのまま残し、見せ方だけここで揃える。
 */

const UNCONFIRMED = '未確認';

/** 値があるときだけ true。「未確認」と空は欠け扱い。 */
export function isKnownPersonField(value: string | null | undefined): boolean {
  if (value == null) {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== UNCONFIRMED;
}

/**
 * 生没年の短いラベル。
 * - 両方あり: 「1867–1916」
 * - 生年だけ: 「1867年生」
 * - 没年だけ: 「〜1916年」
 * - どちらも欠け: null（呼び出し側で項目ごと出さない）
 */
export function lifeSpanLabel(birthYear: string, deathYear: string): string | null {
  const birth = isKnownPersonField(birthYear) ? birthYear.trim() : null;
  const death = isKnownPersonField(deathYear) ? deathYear.trim() : null;
  if (birth != null && death != null) {
    return `${birth}–${death}`;
  }
  if (birth != null) {
    return `${birth}年生`;
  }
  if (death != null) {
    return `〜${death}年`;
  }
  return null;
}

/** VoiceOver 用。ラベルが無いときは null。 */
export function lifeSpanAccessibilityLabel(birthYear: string, deathYear: string): string | null {
  const birth = isKnownPersonField(birthYear) ? birthYear.trim() : null;
  const death = isKnownPersonField(deathYear) ? deathYear.trim() : null;
  if (birth != null && death != null) {
    return `生年${birth}、没年${death}`;
  }
  if (birth != null) {
    return `生年${birth}`;
  }
  if (death != null) {
    return `没年${death}`;
  }
  return null;
}
