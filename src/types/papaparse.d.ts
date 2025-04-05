declare module 'papaparse' {
  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    encoding?: string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: ParseError) => void;
    dynamicTyping?: boolean;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    };
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export function parse<T = any>(input: string, config?: ParseConfig<T>): ParseResult<T>;
}
