/**
 * 絵本風の仮トークン。
 * UI/UXサンプルはまだリポジトリに無いので、紙色の仮の値にしている。
 * サンプルが正になったら、このファイルを差し替える。
 */
export const theme = {
  color: {
    paper: '#F4EBD8',
    card: '#FFF9F0',
    ink: '#2A241C',
    inkMuted: '#6E6254',
    moss: '#3F6B4E',
    clay: '#C46A45',
    line: '#E2D3BC',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  font: {
    title: 28,
    body: 16,
    caption: 13,
  },
  radius: {
    md: 16,
  },
  border: {
    hairline: 1,
  },
} as const;
