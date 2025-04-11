// Fake document.currentScript for some Jupyter envs where
// document.currentScript is null. This file is concatenated
// before the esbuild bundled JS for the widget to override
// currentScript
Object.defineProperty(document, "currentScript", {
  get: function () {
    return {
      src: "widget.js",
      tagName: "script",
    }
  }
});

