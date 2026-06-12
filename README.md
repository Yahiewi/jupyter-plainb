# jupyter-plainb

[![Github Actions Status](https://github.com/notebook-link/jupyter-plainb/workflows/Build/badge.svg)](https://github.com/notebook-link/jupyter-plainb/actions/workflows/build.yml)

A JupyterLab extension to convert plaintext files to Jupyter notebooks

## Installation

```bash
pip install jupyter-plainb
```

## Requirements

- JupyterLab >= 4.0.0

## Usage

### 1. Convert to Notebook
Select a `.py` or `.md` file in the file browser → right-click → **Convert to Notebook** submenu → pick a parser.
* If a `.ipynb` with the same base name already exists, a confirmation dialog asks before overwriting.

### 2. Open With (Direct notebook editor)
You can open and edit `.py` or `.md` files directly in the JupyterLab Notebook editor without generating a `.ipynb` file.
* Right-click a `.py` or `.md` file in the file browser → hover over **Open With** → select **Notebook**.
* Edits and cell runs save directly back to the original plaintext file format.

### 3. Convert to Plain Text (Reverse conversion)
Convert an existing `.ipynb` notebook back to one of the supported plaintext formats.
* Right-click a `.ipynb` file → hover over **Convert to Plain Text** submenu → select a target format.

### 4. Auto-convert on startup

Add `plainTextNotebookConfig` to `jupyter_config.json` (or JupyterLite's `jupyter-lite.json`):

```json
{
  "jupyter-config-data": {
    "plainTextNotebookConfig": {
      "rules": [
        { "dir": "percent", "parser": "parsePy" },
        { "dir": "sphinx_gallery", "parser": "parseSphinxGallery" },
        { "dir": "markdown", "parser": "parseClassicMd" },
        { "dir": "myst", "parser": "parseMystMd" }
      ]
    }
  }
}
```

Each rule watches a directory and converts matching files on JupyterLab startup (skips files that already have a `.ipynb` sibling).

## Supported formats

| Parser               | Menu label             | File type | Format                                                                             |
| -------------------- | ---------------------- | --------- | ---------------------------------------------------------------------------------- |
| `parsePy`            | Percent format (.py)   | `.py`     | [Jupytext percent](https://jupytext.readthedocs.io/en/latest/formats-scripts.html) |
| `parseSphinxGallery` | Sphinx Gallery (.py)   | `.py`     | [Sphinx-Gallery](https://sphinx-gallery.github.io/stable/syntax.html)              |
| `parseClassicMd`     | Classic Markdown (.md) | `.md`     | Standard markdown — fenced code blocks become code cells                           |
| `parseMystMd`        | MyST Notebook (.md)    | `.md`     | [MyST-NB](https://myst-nb.readthedocs.io/) `{code-cell}` directives                |

## Uninstall

```bash
pip uninstall jupyter-plainb
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
