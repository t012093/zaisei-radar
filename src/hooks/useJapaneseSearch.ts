import { useState, useCallback, useEffect, useMemo } from 'react';
import { textMatch, generateReadingVariations } from '../utils/textUtils';
import { debounce } from 'lodash';
// Try running: npm i --save-dev @types/lodash

interface SearchOptions<T> {
  items: T[];
  searchKeys: (keyof T)[];
  maxResults?: number;
  minQueryLength?: number;
  debounceMs?: number;
}

interface SearchResult<T> {
  item: T;
  matchedKey: keyof T;
  score: number;
}

export function useJapaneseSearch<T>({
  items,
  searchKeys,
  maxResults = 10,
  minQueryLength = 1,
  debounceMs = 150
}: SearchOptions<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 検索スコアの計算
  const calculateScore = useCallback((text: string | undefined, searchQuery: string): number => {
    if (!text || !searchQuery) return 0;
    
    const variations = generateReadingVariations(text);
    const queryVariations = generateReadingVariations(searchQuery);
    
    let maxScore = 0;
    variations.forEach(variant => {
      queryVariations.forEach(queryVariant => {
        // 完全一致の場合は最高スコア
        if (variant === queryVariant) {
          maxScore = Math.max(maxScore, 1);
          return;
        }
        
        // 前方一致は次に高いスコア
        if (variant.startsWith(queryVariant)) {
          maxScore = Math.max(maxScore, 0.8);
          return;
        }
        
        // 部分一致は低めのスコア
        if (variant.includes(queryVariant)) {
          maxScore = Math.max(maxScore, 0.6);
          return;
        }

        // 読み仮名での部分一致は最低スコア
        if (textMatch(variant, queryVariant)) {
          maxScore = Math.max(maxScore, 0.4);
        }
      });
    });
    
    return maxScore;
  }, []);

  // 実際の検索処理
  const performSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const searchResults: SearchResult<T>[] = [];

      // 各アイテムについて検索を実行
      items.forEach(item => {
        let highestScore = 0;
        let matchedKey: keyof T | null = null;

        // 指定されたキーごとに検索
        searchKeys.forEach(key => {
          const value = String(item[key]);
          const score = calculateScore(value, searchQuery);
          if (score > highestScore) {
            highestScore = score;
            matchedKey = key;
          }
        });

        // スコアが0より大きい場合は結果に追加
        if (highestScore > 0 && matchedKey) {
          searchResults.push({
            item,
            matchedKey,
            score: highestScore
          });
        }
      });

      // スコアでソートし、重複を除去して上位N件を取得
      const uniqueResults = Array.from(
        new Map(
          searchResults
            .sort((a, b) => b.score - a.score)
            .map(result => [result.item, result.item])
        ).values()
      ).slice(0, maxResults);

      setResults(uniqueResults);
      setIsSearching(false);
    }, debounceMs),
    [items, searchKeys, calculateScore, maxResults, minQueryLength]
  );

  // クエリが変更されたら検索を実行
  useEffect(() => {
    performSearch(query);
    return () => {
      performSearch.cancel();
    };
  }, [query, performSearch]);

  // 検索をクリア
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);

  // メモ化された値を返す
  return useMemo(
    () => ({
      query,
      setQuery,
      results,
      isSearching,
      clearSearch
    }),
    [query, results, isSearching, clearSearch]
  );
}
