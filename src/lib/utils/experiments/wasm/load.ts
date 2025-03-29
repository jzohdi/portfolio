// Ensure we can safely access exports with proper typing
export type SimpleWasmModule<T> = WebAssembly.WebAssemblyInstantiatedSource['instance']['exports'] &
    T & { 	// Memory may be exported from WASM
        memory?: WebAssembly.Memory;
    };

// Load and instantiate the WebAssembly module
export async function loadWasm<T>(path: string, space: number): Promise<SimpleWasmModule<T>> {
    // Fetch the WebAssembly file
    const response = await fetch(path);
    const bytes = await response.arrayBuffer();

    // Create import object
    const importObject: WebAssembly.Imports = {
        wasi_snapshot_preview1: {
            // Provide stubs for required functions.
            // For example, if your module calls fd_write, you can implement a simple stub:
            fd_write: () => {
                console.log("fd_write called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            args_get: () => {
                console.log("args_get called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            args_sizes_get: () => {
                console.log("args_sizes_get called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            fd_close: () => {
                console.log("fd_close called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            fd_fdstat_get: () => {
                console.log("fd_fdstat_get called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            fd_seek: () => {
                console.log("fd_seek called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            },
            proc_exit: () => {
                console.log("proc_exit called");
                // Optionally, implement logic to read from iovs and log output.
                // For now, just return a success code.
            }
            // Include any other WASI functions your module may call.
        },
        env: {
            memory: new WebAssembly.Memory({ initial: space, maximum: space * 2 })
            // You can add imported JavaScript functions here if needed
        }
    };

    // Compile and instantiate the module
    const { instance } = await WebAssembly.instantiate(bytes, importObject);

    // Cast with type assertion
    return instance.exports as unknown as SimpleWasmModule<T>;
}

export class WasmMemoryHelper<T> {
    private wasmMemory: WebAssembly.Memory;

    constructor(wasmInstance: SimpleWasmModule<T>) {
        this.wasmMemory = wasmInstance.memory ?? new WebAssembly.Memory({ initial: 256, maximum: 512 });
    }

    // Get the memory
    get memory(): WebAssembly.Memory {
        return this.wasmMemory;
    }

    // Write an array of numbers to memory and return the pointer
    writeInt32Array(array: number[]): number {
        const ptr = 0; // In a real app, use malloc if available in WASM
        const view = new Int32Array(this.wasmMemory.buffer);

        for (let i = 0; i < array.length; i++) {
            view[ptr / 4 + i] = array[i];
        }

        return ptr;
    }

    readString(ptr: number, length: number) {
        const afterView = new Uint8Array(this.wasmMemory.buffer, ptr, length);
        // Read the result string from memory (assuming it's null-terminated)
        let resultStr = "";
        for (let i = 0; i < length; i++) {
            if (afterView[i] !== 0) {
                resultStr += String.fromCharCode(afterView[i]);
            }
        }
        return resultStr
    }

    /**
     * Expects pointer to be given here. The pointer is normally
     * retrieved via the exported malloc code from wasm:
     *   const inputPtr = wasm.malloc(lengthOfString + 1);
     */
    writeString(inputPtr: number, data: string) {
        if (!inputPtr) {
            throw new Error("Failed to allocate memory for input string.");
        }
        // Encode the input string with a null terminator
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data + "\0");
        // Get a view of the module's memory buffer
        const memoryBuffer = new Uint8Array(this.wasmMemory.buffer, inputPtr, encoded.length);
        // memoryBuffer.set(encoded);
        // Copy the encoded string into WASM memory at the allocated pointer
        memoryBuffer.set(encoded);
        // console.log("set input pointer", inputPtr, "memory view: ", memoryBuffer);
        return inputPtr;
    }

    // Read an array of numbers from memory
    readInt32Array(ptr: number, length: number): number[] {
        const view = new Int32Array(this.wasmMemory.buffer);
        return Array.from(view.subarray(ptr / 4, ptr / 4 + length));
    }
}