// 日本語文字のUnicodeレンジ
const JAPANESE_RANGES = {
  hiragana: { start: 0x3041, end: 0x3096 },
  katakana: { start: 0x30A1, end: 0x30FA },
  prolongedSound: { single: 0x30FC }, // 長音記号「ー」
  kanji: [
    { start: 0x4E00, end: 0x9FFF },  // CJK統合漢字
    { start: 0x3400, end: 0x4DBF }   // CJK統合漢字拡張A
  ]
} as const;

// カタカナをひらがなに変換
const katakanaToHiragana = (str: string): string => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= JAPANESE_RANGES.katakana.start && code <= JAPANESE_RANGES.katakana.end) {
      return String.fromCharCode(code - (JAPANESE_RANGES.katakana.start - JAPANESE_RANGES.hiragana.start));
    }
    // 長音記号はそのまま保持
    if (code === JAPANESE_RANGES.prolongedSound.single) {
      return char;
    }
    return char;
  }).join('');
};

// ひらがなをカタカナに変換
const hiraganaToKatakana = (str: string): string => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= JAPANESE_RANGES.hiragana.start && code <= JAPANESE_RANGES.hiragana.end) {
      return String.fromCharCode(code + (JAPANESE_RANGES.katakana.start - JAPANESE_RANGES.hiragana.start));
    }
    return char;
  }).join('');
};

// 文字種の判定
const isHiragana = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code >= JAPANESE_RANGES.hiragana.start && code <= JAPANESE_RANGES.hiragana.end;
};

const isKatakana = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= JAPANESE_RANGES.katakana.start && code <= JAPANESE_RANGES.katakana.end) ||
         code === JAPANESE_RANGES.prolongedSound.single;
};

const isKanji = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return JAPANESE_RANGES.kanji.some(range => 
    code >= range.start && code <= range.end
  );
};

// 文字種の判定（詳細）
const getCharType = (char: string): 'hiragana' | 'katakana' | 'kanji' | 'other' => {
  if (isHiragana(char)) return 'hiragana';
  if (isKatakana(char)) return 'katakana';
  if (isKanji(char)) return 'kanji';
  return 'other';
};

// 全角英数字を半角に変換
const convertFullWidthToHalf = (str: string): string => {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

// テキストの正規化
export const normalizeJapaneseText = (text: string | undefined): string => {
  if (!text) return '';
  
  // 全角・半角の正規化（NFC: 標準形式、NFKC: 互換等価性を考慮した標準形式）
  text = text.normalize('NFKC');
  text = convertFullWidthToHalf(text);
  text = text.toLowerCase();
  
  // ひらがな・カタカナ変換
  const asHiragana = katakanaToHiragana(text);
  
  // 検索用のテキストを生成
  return asHiragana
    .replace(/[\s　・,，.．。、々〇〒※#\-ーａ-ｚＡ-Ｚ]/g, ''); // 記号等を削除
};

// よみがなの候補を生成
export const generateReadingVariations = (text: string): string[] => {
  if (!text) return [''];
  
  const normalized = normalizeJapaneseText(text);
  const variations = new Set<string>();
  
  variations.add(normalized);
  variations.add(hiraganaToKatakana(normalized));
  
  return Array.from(variations);
};

export interface MatchPosition {
  start: number;
  end: number;
  exact: boolean;
}

// テキストのマッチング位置を取得
export const findMatchPosition = (text: string | undefined, query: string): MatchPosition | null => {
  if (!text || !query) return null;

  const normalizedText = normalizeJapaneseText(text);
  const normalizedQuery = normalizeJapaneseText(query);
  
  // 完全一致を優先
  if (normalizedText === normalizedQuery) {
    return {
      start: 0,
      end: text.length,
      exact: true
    };
  }

  // 部分一致
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return null;

  // 文字列の長さを正確に計算（記号等を除外）
  const charCount = (str: string): number => 
    str.split('').filter(char => getCharType(char) !== 'other').length;

  // 元のテキストでの位置を特定
  let start = 0;
  let currentIndex = 0;
  const textChars = text.split('');
  
  for (let i = 0; currentIndex < index && i < textChars.length; i++) {
    if (getCharType(textChars[i]) !== 'other') {
      currentIndex++;
    }
    if (currentIndex <= index) {
      start = i + 1;
    }
  }

  // マッチした長さを計算
  let matchLength = 0;
  let end = start;
  const targetLength = charCount(query);
  
  while (matchLength < targetLength && end < textChars.length) {
    if (getCharType(textChars[end]) !== 'other') {
      matchLength++;
    }
    end++;
  }

  return {
    start,
    end,
    exact: false
  };
};

// テキストのマッチング（部分一致）
export const textMatch = (text: string | undefined, query: string): boolean => {
  if (!text || !query) return false;
  
  const normalizedText = normalizeJapaneseText(text);
  const normalizedQuery = normalizeJapaneseText(query);
  
  return normalizedText.includes(normalizedQuery);
};
