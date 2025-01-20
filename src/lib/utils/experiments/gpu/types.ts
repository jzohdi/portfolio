export type MainFunction = (
	device: GPUDevice,
	context: GPUCanvasContext,
	format: GPUTextureFormat
) => Promise<() => void>;
