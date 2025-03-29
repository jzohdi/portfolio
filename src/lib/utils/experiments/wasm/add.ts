import { loadWasm, WasmMemoryHelper } from "./load";

export type AddWasmExports = {
	// C functions exported from your WASM
	add: (a: number, b: number) => number;
	sumArray: (arrayPtr: number, length: number) => number;
}

// Use the WASM functions
export async function loadMain(path: string) {
	try {
		const wasm = await loadWasm<AddWasmExports>(path, 1);
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
