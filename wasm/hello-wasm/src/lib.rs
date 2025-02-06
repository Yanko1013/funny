// lib.rs
extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn fib_wasm(value: u32) -> u32 {
    if value <= 1 {
        return value;
    }

    fib_wasm(value - 1) + fib_wasm(value - 2)
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}", name));
}
