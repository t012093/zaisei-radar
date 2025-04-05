import React, { useRef, useEffect, Fragment } from 'react';
import { Municipality } from '../types';
import { findMatchPosition } from '../utils/textUtils';
import { useJapaneseSearch } from '../hooks/useJapaneseSearch';

interface MunicipalitySearchProps {
  municipalities: Municipality[];
  onSelect: (municipality: Municipality) => void;
}

interface HighlightedTextPart {
  text: string;
  isHighlight: boolean;
  key: string;
}

const MunicipalitySearch: React.FC<MunicipalitySearchProps> = ({
  municipalities,
  onSelect
}) => {
  const {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch
  } = useJapaneseSearch({
    items: municipalities,
    searchKeys: ['name', 'prefecture'],
    maxResults: 10,
    minQueryLength: 1,
    debounceMs: 150
  });

  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isOpen = results.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        clearSearch();
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSearch]);

  const scrollSelectedIntoView = React.useCallback((index: number) => {
    if (listRef.current && index >= 0) {
      const element = listRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev < results.length - 1 ? prev + 1 : prev;
          scrollSelectedIntoView(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev > 0 ? prev - 1 : 0;
          scrollSelectedIntoView(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        clearSearch();
        setSelectedIndex(-1);
        break;
    }
  }, [results, isOpen, selectedIndex, clearSearch, scrollSelectedIntoView]);

  const handleSelect = (municipality: Municipality) => {
    onSelect(municipality);
    clearSearch();
    setSelectedIndex(-1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prefecture':
        return '都道府県';
      case 'designated_city':
        return '政令指定都市';
      case 'capital_city':
        return '県庁所在地';
      default:
        return '市町村';
    }
  };

  const highlightMatch = (text: string | undefined, searchQuery: string): HighlightedTextPart[] => {
    if (!text || !searchQuery) return [{ text: text ?? '', isHighlight: false, key: 'default' }];
    
    const matchPosition = findMatchPosition(text, searchQuery);
    if (!matchPosition) return [{ text, isHighlight: false, key: 'default' }];
    
    const { start, end } = matchPosition;
    return [
      { text: text.slice(0, start), isHighlight: false, key: 'prefix' },
      { text: text.slice(start, end), isHighlight: true, key: 'highlight' },
      { text: text.slice(end), isHighlight: false, key: 'suffix' }
    ].filter(part => part.text.length > 0);
  };

  const renderHighlightedText = (text: string | undefined, searchQuery: string) => {
    const parts = highlightMatch(text, searchQuery);
    return (
      <Fragment>
        {parts.map(part => (
          <Fragment key={`${part.key}-${part.text}`}>
            {part.isHighlight ? (
              <span className="bg-yellow-200">{part.text}</span>
            ) : (
              part.text
            )}
          </Fragment>
        ))}
      </Fragment>
    );
  };

  return (
    <div 
      ref={wrapperRef}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">自治体検索</h2>
        <p className="text-sm text-gray-600">
          自治体名を入力して財政状況を確認できます
        </p>
      </div>

      <div 
        className="relative"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="municipality-list"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="自治体名を入力（例：富山市）"
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              placeholder-gray-400 text-base
              ${isSearching ? 'pr-10' : ''}
            `}
            autoComplete="off"
            aria-label="自治体検索"
            aria-autocomplete="list"
            aria-controls="municipality-list"
            aria-activedescendant={selectedIndex >= 0 ? `municipality-${results[selectedIndex]?.id}` : undefined}
          />

          {isSearching ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : query && (
            <button
              onClick={() => {
                clearSearch();
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="検索をクリア"
            >
              ×
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
            <ul 
              ref={listRef}
              className="py-1"
              role="listbox"
              id="municipality-list"
            >
              {results.map((municipality, index) => (
                <li
                  id={`municipality-${municipality.id}`}
                  key={`${municipality.id}-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`px-4 py-2 cursor-pointer ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(municipality)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {renderHighlightedText(municipality.name, query)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {renderHighlightedText(municipality.prefecture, query)}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      municipality.type === 'prefecture' ? 'bg-purple-100 text-purple-800' :
                      municipality.type === 'designated_city' ? 'bg-blue-100 text-blue-800' :
                      municipality.type === 'capital_city' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getTypeLabel(municipality.type)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MunicipalitySearch;
