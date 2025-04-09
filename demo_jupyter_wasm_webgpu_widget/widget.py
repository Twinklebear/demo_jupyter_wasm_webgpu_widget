#!/usr/bin/env python
# coding: utf-8

import pathlib
import glob

import anywidget
import traitlets

static_path = (pathlib.Path(__file__).parent / "static")

def handle_custom_message(widget, msg, buffers):
    if msg == "load_wasm":
        # We don't know the name of the wasm file until build
        # since it comes from the npm package
        wasm_file = glob.glob("*.wasm", root_dir=static_path)
        print(wasm_file)
        if len(wasm_file) == 0:
            raise Exception("Failed to find expected packaged Wasm file")
        print(static_path / wasm_file[0])
        wasm =  (static_path / wasm_file[0]).read_bytes()
        widget.send("load_wasm", [wasm])


class WasmTestWidget(anywidget.AnyWidget):
    _esm = static_path / "widget.js"
    data = traitlets.Bytes().tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(handle_custom_message)
