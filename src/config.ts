import { Contents } from '@jupyterlab/services';
import * as toml from 'smol-toml';
import * as yaml from 'yaml';

export interface IPlainbConfig {
  notebookMetadataFilter?: string;
  cellMetadataFilter?: string;
}

const CONFIG_FILENAMES = [
  'plainb.toml',
  '.plainb.toml',
  'plainb.yaml',
  'plainb.yml',
  'plainb.json',
  '.plainb',
  'jupytext.toml',
  '.jupytext.toml',
  'jupytext.yaml',
  'jupytext.yml',
  'jupytext.json',
  '.jupytext',
  'pyproject.toml'
];

/**
 * Searches directories upwards from `filePath` to the workspace root `""`
 * to find and parse plainb/jupytext configuration.
 */
export async function findPlainbConfig(
  contents: Contents.IManager,
  filePath: string
): Promise<IPlainbConfig | null> {
  const parts = filePath.split('/');
  let dir = parts.slice(0, -1).join('/');

  while (true) {
    try {
      const dirModel = await contents.get(dir, { content: true });
      if (dirModel.type === 'directory' && Array.isArray(dirModel.content)) {
        const children = dirModel.content as Contents.IModel[];

        let foundFilename: string | null = null;
        for (const target of CONFIG_FILENAMES) {
          if (
            children.some(
              child => child.name === target && child.type === 'file'
            )
          ) {
            foundFilename = target;
            break;
          }
        }

        if (foundFilename) {
          const configPath = dir ? `${dir}/${foundFilename}` : foundFilename;
          const fileModel = await contents.get(configPath, { content: true });
          const text = fileModel.content;
          if (typeof text === 'string') {
            const parsed = parseConfigContent(foundFilename, text);
            if (parsed) {
              return parsed;
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        `ptjnb: failed to check or read directory/config at "${dir}":`,
        err
      );
    }

    if (dir === '') {
      break;
    }
    const dirParts = dir.split('/');
    dirParts.pop();
    dir = dirParts.join('/');
  }

  return null;
}

function parseConfigContent(
  filename: string,
  content: string
): IPlainbConfig | null {
  try {
    let result: IPlainbConfig | null = null;
    if (filename === 'pyproject.toml') {
      const data = toml.parse(content) as any;
      const plainbSection = data?.tool?.plainb;
      const jupytextSection = data?.tool?.jupytext;
      const section =
        plainbSection && typeof plainbSection === 'object'
          ? plainbSection
          : jupytextSection && typeof jupytextSection === 'object'
            ? jupytextSection
            : null;

      if (section) {
        result = {
          notebookMetadataFilter:
            typeof section.notebookMetadataFilter === 'string'
              ? section.notebookMetadataFilter
              : typeof section.notebook_metadata_filter === 'string'
                ? section.notebook_metadata_filter
                : undefined,
          cellMetadataFilter:
            typeof section.cellMetadataFilter === 'string'
              ? section.cellMetadataFilter
              : typeof section.cell_metadata_filter === 'string'
                ? section.cell_metadata_filter
                : undefined
        };
      }
    } else if (filename.endsWith('.toml')) {
      const data = toml.parse(content) as any;
      if (data && typeof data === 'object') {
        result = {
          notebookMetadataFilter:
            typeof data.notebookMetadataFilter === 'string'
              ? data.notebookMetadataFilter
              : typeof data.notebook_metadata_filter === 'string'
                ? data.notebook_metadata_filter
                : undefined,
          cellMetadataFilter:
            typeof data.cellMetadataFilter === 'string'
              ? data.cellMetadataFilter
              : typeof data.cell_metadata_filter === 'string'
                ? data.cell_metadata_filter
                : undefined
        };
      }
    } else if (
      filename.endsWith('.yaml') ||
      filename.endsWith('.yml') ||
      filename === '.plainb' ||
      filename === '.jupytext'
    ) {
      const data = yaml.parse(content) as any;
      if (data && typeof data === 'object') {
        result = {
          notebookMetadataFilter:
            typeof data.notebookMetadataFilter === 'string'
              ? data.notebookMetadataFilter
              : typeof data.notebook_metadata_filter === 'string'
                ? data.notebook_metadata_filter
                : undefined,
          cellMetadataFilter:
            typeof data.cellMetadataFilter === 'string'
              ? data.cellMetadataFilter
              : typeof data.cell_metadata_filter === 'string'
                ? data.cell_metadata_filter
                : undefined
        };
      }
    } else if (filename.endsWith('.json')) {
      const data = JSON.parse(content);
      if (data && typeof data === 'object') {
        result = {
          notebookMetadataFilter:
            typeof data.notebookMetadataFilter === 'string'
              ? data.notebookMetadataFilter
              : typeof data.notebook_metadata_filter === 'string'
                ? data.notebook_metadata_filter
                : undefined,
          cellMetadataFilter:
            typeof data.cellMetadataFilter === 'string'
              ? data.cellMetadataFilter
              : typeof data.cell_metadata_filter === 'string'
                ? data.cell_metadata_filter
                : undefined
        };
      }
    }

    return result;
  } catch (err) {
    console.error(`ptjnb: failed to parse config file "${filename}":`, err);
  }
  return null;
}
