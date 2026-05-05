import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { PageConfig } from '@jupyterlab/coreutils';
import { MenuSvg } from '@jupyterlab/ui-components';
import { PARSERS, PARSER_LABELS, PARSER_EXTENSIONS, SERIALIZERS } from './parsers';
import {
  ParserName,
  IPlainTextNotebookConfig,
  IKernelspec
} from './parsers';
import { convertFile, autoConvert } from './convert';
import {
  NotebookPanel,
  NotebookWidgetFactory
} from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { PlainTextNotebookModelFactory } from './model';

export const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ptjnb:plugin',
  autoStart: true,
  requires: [
    IFileBrowserFactory,
    IRenderMimeRegistry,
    NotebookPanel.IContentFactory,
    IEditorServices
  ],
  activate: async (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    rendermime: IRenderMimeRegistry,
    contentFactory: NotebookPanel.IContentFactory,
    editorServices: IEditorServices
  ) => {
    console.log('ptjnb extension activated!');
    const { commands, contextMenu } = app;

    const cfgStr = PageConfig.getOption('plainTextNotebookConfig');
    let cfg: IPlainTextNotebookConfig = {};
    try {
      cfg = cfgStr ? JSON.parse(cfgStr) : {};
    } catch {
      console.error('ptjnb: invalid plainTextNotebookConfig JSON');
    }
    const defaultKernelspec: IKernelspec | undefined = cfg.defaultKernelspec;

    const getCurrentBrowser = () => browserFactory.tracker.currentWidget;

    (Object.keys(PARSERS) as ParserName[]).forEach(parserName => {
      const commandId = `ptjnb:convert-${parserName}`;
      const parser = PARSERS[parserName];
      const exts = PARSER_EXTENSIONS[parserName];
      const serializer = SERIALIZERS[parserName];
      const fileTypes = exts.includes('.py') ? ['python'] : ['markdown'];
      const modelName = `ptjnb-${parserName}`;
      const mimeTypeService = editorServices.mimeTypeService;

      const modelFactory = new PlainTextNotebookModelFactory({
        name: modelName,
        parser,
        serializer
      });
      app.docRegistry.addModelFactory(modelFactory);

      const widgetFactory = new NotebookWidgetFactory({
        name: PARSER_LABELS[parserName],
        modelName: modelName,
        fileTypes: fileTypes,
        rendermime,
        contentFactory,
        mimeTypeService,
        defaultFor: []
      });
      app.docRegistry.addWidgetFactory(widgetFactory);

      // Inherit the toolbar and other widget extensions from the standard Notebook widget
      for (const ext of app.docRegistry.widgetExtensions('Notebook')) {
        app.docRegistry.addWidgetExtension(widgetFactory.name, ext);
      }

      commands.addCommand(commandId, {
        label: PARSER_LABELS[parserName],
        isVisible: () => {
          const browser = getCurrentBrowser();
          if (!browser) {
            return false;
          }
          const selection = browser.selectedItems();
          const first = selection.next();
          if (first.done || !first.value) {
            return false;
          }
          return exts.some(ext => first.value.path.endsWith(ext));
        },
        execute: async () => {
          const browser = getCurrentBrowser();
          if (!browser) {
            return;
          }
          const selection = browser.selectedItems();
          const first = selection.next();
          if (first.done || !first.value) {
            return;
          }
          const filePath = first.value.path;
          const notebookPath = filePath.replace(/\.(py|md)$/, '.ipynb');
          const contents = app.serviceManager.contents;
          try {
            let fileExists = false;
            try {
              await contents.get(notebookPath, { content: false });
              fileExists = true;
            } catch {
              /* empty */
            }
            if (fileExists) {
              const result = await showDialog({
                title: 'Overwrite notebook?',
                body: `"${notebookPath}" already exists. Overwrite it?`,
                buttons: [
                  Dialog.cancelButton(),
                  Dialog.warnButton({ label: 'Overwrite' })
                ]
              });
              if (!result.button.accept) {
                return;
              }
            }
            await convertFile(contents, filePath, parser, defaultKernelspec);
          } catch (e) {
            console.error('ptjnb: conversion failed', e);
          }
        }
      });
    });

    const submenu = new MenuSvg({ commands });
    submenu.title.label = 'Convert to Notebook';
    submenu.addItem({ command: 'ptjnb:convert-parsePy' });
    submenu.addItem({ command: 'ptjnb:convert-parseSphinxGallery' });
    submenu.addItem({ command: 'ptjnb:convert-parseClassicMd' });
    submenu.addItem({ command: 'ptjnb:convert-parseMystMd' });

    contextMenu.addItem({
      type: 'submenu',
      submenu,
      selector: '.jp-DirListing-item[data-isdir="false"]',
      rank: 10
    });

    if (cfg.rules?.length) {
      await autoConvert(
        app.serviceManager.contents,
        cfg.rules,
        defaultKernelspec
      );
    }
  }
};
