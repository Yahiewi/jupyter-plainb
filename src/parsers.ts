import {
  parsePy,
  parseSphinxGallery,
  parseClassicMd,
  parseMystMd,
  toPy,
  toSphinxGallery,
  toClassicMd,
  toMystMd,
  Notebook
} from 'plainb';

export type ParserName =
  | 'parsePy'
  | 'parseSphinxGallery'
  | 'parseClassicMd'
  | 'parseMystMd';

export interface IRule {
  dir: string;
  parser: ParserName;
}

export interface IKernelspec {
  name: string;
  display_name: string;
  language: string;
}

export interface IPlainTextNotebookConfig {
  rules?: IRule[];
  defaultKernelspec?: IKernelspec;
}

export const PARSERS: Record<ParserName, (text: string) => object> = {
  parsePy,
  parseSphinxGallery,
  parseClassicMd,
  parseMystMd
};

export const SERIALIZERS: Record<ParserName, (notebook: Notebook) => string> = {
  parsePy: toPy,
  parseSphinxGallery: toSphinxGallery,
  parseClassicMd: (nb) => toClassicMd(nb), // classic markdown doesn't have a default language, though plainb might fallback to python. Wait, toClassicMd takes (notebook: Notebook, language?: string). If we just pass `nb`, it uses default python.
  parseMystMd: toMystMd
};

export const PARSER_LABELS: Record<ParserName, string> = {
  parsePy: 'Percent format (.py)',
  parseSphinxGallery: 'Sphinx Gallery (.py)',
  parseClassicMd: 'Classic Markdown (.md)',
  parseMystMd: 'MyST Notebook (.md)'
};

export const PARSER_EXTENSIONS: Record<ParserName, string[]> = {
  parsePy: ['.py'],
  parseSphinxGallery: ['.py'],
  parseClassicMd: ['.md'],
  parseMystMd: ['.md']
};
