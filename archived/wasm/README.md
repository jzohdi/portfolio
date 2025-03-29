## What is this?

This directory contains experiments of code being written to learn wasm.

### Notes

using clang to compile simple C programs to wasm
```shell
clang --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export-all -o simple.wasm simple.c
```
`error: unable to create target: 'No available targets are compatible with triple "wasm32"'`
This error indicates that your installed version of Clang doesn't have WebAssembly target support. Here's how to fix it:
```shell
brew install llvm
```
or
```shell
sudo apt-get install lld
sudo apt-get install clang
```

verify

```shell
clang --print-targets
```
#### WebAssembly Pages

```ts
new WebAssembly.Memory({ initial: 1 });
```

In new WebAssembly.Memory({ initial: 1 }), the initial: 1 parameter defines the starting size 
of the WebAssembly memory in units of WebAssembly pages.

Page Size: Each WebAssembly memory page is exactly 64 KiB (65,536 bytes)
Initial: 1: Allocates 1 page = 64 KiB of linear memory
Initial: 2: Would allocate 2 pages = 128 KiB of memory
And so on...

```ts
// 64 KiB (1 page)
const smallMemory = new WebAssembly.Memory({ initial: 1 });

// 1 MiB (16 pages)
const mediumMemory = new WebAssembly.Memory({ initial: 16 });

// 16 MiB (256 pages)
const largeMemory = new WebAssembly.Memory({ initial: 256 });
```

#### Dynamic Export discovery
```ts
// Dynamic export discovery
async function getWasmExports(wasmPath: string): Promise<Record<string, string>> {
  const response = await fetch(wasmPath);
  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.compile(bytes);
  
  // Get information about exports
  const exports = WebAssembly.Module.exports(module);
  
  // Build export information
  const exportInfo: Record<string, string> = {};
  for (const exp of exports) {
    exportInfo[exp.name] = exp.kind;
  }
  
  return exportInfo;
}

// Example usage
async function inspectWasm(): Promise<void> {
  const exports = await getWasmExports('simple.wasm');
  console.log('WASM exports:', exports);
  // Might output: { add: 'function', sumArray: 'function', memory: 'memory' }
}
```

### Compiling Sudoku
```
clang --target=wasm32 -O3 \          
  -Wl,--no-entry \
  -Wl,--export=solve \
  -Wl,--export=free \
  -o sudoku.wasm sudoku.c queue.c hashmaps.c
```
Error:
```shell
sudoku.c:2:10: fatal error: 'stdio.h' file not found
    2 | #include <stdio.h>
      |          ^~~~~~~~~
1 error generated.
queue.c:1:10: fatal error: 'stdlib.h' file not found
    1 | #include <stdlib.h>
      |          ^~~~~~~~~~
1 error generated.
hashmaps.c:2:10: fatal error: 'stdlib.h' file not found
    2 | #include <stdlib.h>
      |          ^~~~~~~~~~
1 error generated.
```

Download and install the wasi-sdk since we use stdlib functionality 
like malloc, free, etc. https://github.com/WebAssembly/wasi-sdk/releases

```shell
tar -xzf wasi-sdk-25.0-arm64-macos.tar.gz -C ~/wasi-sdk/
```
Creates
```shell
~/wasi-sdk/wasi-sdk-25.0-arm64-macos/share/wasi-sysroot/
```
Then can use 

```shelll
clang --target=wasm32-wasi -O3 \
  --sysroot=~/wasi-sdk/wasi-sdk-25.0-arm64-macos/share/wasi-sysroot \
  -Wl,--no-entry \
  -Wl,--export=solve \
  -Wl,--export=free \
  -o sudoku.wasm sudoku.c queue.c hashmaps.c
```

```shell
% ls ~/wasi-sdk/wasi-sdk-25.0-arm64-macos/share/wasi-sysroot/include
c++                     wasm32-wasi-threads     wasm32-wasip1-threads
wasm32-wasi             wasm32-wasip1           wasm32-wasip2
```

```shell
% ls ~/wasi-sdk/wasi-sdk-25.0-arm64-macos/share/wasi-sysroot/include/wasm32-wasi
``
You should see standard C headers (like stdio.h, stdlib.h, etc.) in one of these directories.

```shell
~/wasi-sdk/wasi-sdk-25.0-arm64-macos/bin/clang --target=wasm32-wasi -O3 \
  -Wl,--no-entry \
  -Wl,--export=solve \
  -Wl,--export=free \
  -Wl,--export=malloc \
  -o sudoku.wasm sudoku.c queue.c hashmaps.c
```
output sudoku.wasm