import type { AnyModel, RenderProps } from "@anywidget/types";
import { loadApp, WGPUApp } from "@twinklebear/webgpu_cpp_gltf";

interface WasmWidgetModel {
  data: DataView;
}

let wasmBinary: ArrayBuffer;
let next_canvas_id = 0;

async function render({ model, el }: RenderProps<WasmWidgetModel>) {
  // Called when the widget is displayed
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.id = `canvas-WasmWidgetModel-${next_canvas_id++}`;

  canvas.oncontextmenu = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  el.appendChild(canvas);

  let app: WGPUApp | null = null;

  const importGlb = () => {
    if (!app) {
      console.warn("Wasm isn't ready to load GLTF data yet");
      return;
    }
    const data = new Uint8Array((model.get("data") as DataView).buffer);
    if (data.byteLength === 0) {
      console.warn("No data to load");
      return;
    }

    app.loadGLTFBuffer(data);
  };

  model.on("change:data", importGlb);

  if (wasmBinary === undefined) {
    wasmBinary = await loadWasm(model);
  }

  app = await loadApp({
    wasmBinary,
  });

  // We need to wait for the canvas element to be added before
  // we can set up the canvas & context so wait for a frame now for it to mount
  requestAnimationFrame(async () => {
    try {
      app.callMain(`#${canvas.id}`, 1);
    } catch (e) {
      // @ts-expect-error - Assume we have a wasm error
      console.error(e.stack);
    }
  });
}

export default { render };

/**
 * Loads wasm binary using a custom message (rather than traits).
 *
 * Traitlets are more simple but the data is always saved within the notebook.
 * For large assets, this can make notebooks explode in size when widget state
 * is saved.
 *
 * Ideally this function would grab the wasm from a URL as a fallback when/if
 * a kernel is inactive.
 *
 */
function loadWasm(model: AnyModel<WasmWidgetModel>): Promise<ArrayBuffer> {
  let { promise, resolve, reject } = Promise.withResolvers<ArrayBuffer>();
  let handler = (msg: unknown, buffers: Array<DataView<ArrayBuffer>>) => {
    if (msg === "load_wasm") {
      resolve(buffers[0].buffer);
      model.off("msg:custom", handler);
    }
  };
  AbortSignal.timeout(2000).addEventListener("abort", () => {
    reject(new Error("Loading widget WASM timed out."));
  });
  model.on("msg:custom", handler);
  model.send("load_wasm");
  return promise;
}
