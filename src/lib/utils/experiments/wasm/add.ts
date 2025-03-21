// wasm-types.ts
export interface SimpleWasmExports {
	// C functions exported from your WASM
	add: (a: number, b: number) => number;
	sumArray: (arrayPtr: number, length: number) => number;

	// Memory may be exported from WASM
	memory?: WebAssembly.Memory;
}

// Ensure we can safely access exports with proper typing
export type SimpleWasmModule = WebAssembly.WebAssemblyInstantiatedSource['instance']['exports'] &
	SimpleWasmExports;

// Load and instantiate the WebAssembly module
async function loadWasm(): Promise<SimpleWasmModule> {
	// Fetch the WebAssembly file
	const response = await fetch('/wasm/add.wasm');
	const bytes = await response.arrayBuffer();

	// Create import object
	const importObject: WebAssembly.Imports = {
		env: {
			// You can add imported JavaScript functions here if needed
		}
	};

	// Compile and instantiate the module
	const { instance } = await WebAssembly.instantiate(bytes, importObject);

	// Cast with type assertion
	return instance.exports as unknown as SimpleWasmModule;
}

class WasmMemoryHelper {
	private wasmMemory: WebAssembly.Memory;
	private wasmInstance: SimpleWasmModule;

	constructor(wasmInstance: SimpleWasmModule) {
		this.wasmInstance = wasmInstance;
		this.wasmMemory = wasmInstance.memory || new WebAssembly.Memory({ initial: 1 });
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

	// Read an array of numbers from memory
	readInt32Array(ptr: number, length: number): number[] {
		const view = new Int32Array(this.wasmMemory.buffer);
		return Array.from(view.subarray(ptr / 4, ptr / 4 + length));
	}
}

// Use the WASM functions
export async function loadMain() {
	try {
		const wasm = await loadWasm();
		const memoryHelper = new WasmMemoryHelper(wasm);
		return {
			add: (a: number, b: number) => {
				const result = wasm.add(a, b);
				console.log(`wasm returned ${a} = ${b}`, result);
				return result;
			},
			sumArray: (arr: number[]) => {
				const ptr = memoryHelper.writeInt32Array(arr);

				// Call WASM function with pointer
				const sum = wasm.sumArray(ptr, arr.length);
				console.log('wasm sum:', sum);
				return sum;
			}
		};
	} catch (error) {
		console.error('Error:', error);
		return {
			add: (a: number, b: number) => {
				console.log('defaulted to js add');
				return a + b;
			},
			sumArray: (arr: number[]) => {
				console.log('defaulted to js reduce');
				return arr.reduce((prev, curr) => prev + curr, 0);
			}
		};
	}
}
