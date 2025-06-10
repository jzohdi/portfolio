const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform vec2 u_zoomCenter;
  uniform float u_scale;
  varying vec2 v_texCoord;

  void main() {
    vec2 zoomedPosition = (a_position - u_zoomCenter) * u_scale + u_zoomCenter;
    gl_Position = vec4(zoomedPosition, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

export type ZoomEventParams = Pick<WheelEvent, 'clientX' | 'clientY' | 'preventDefault' | 'deltaY'>;

function denormalizeGlCoords([normX, normY]: [number, number], rect: DOMRect): [number, number] {
	const maxCanvasX = rect.width / 2;
	const minCanvasX = -maxCanvasX;
	const maxCanvasY = rect.height / 2;
	const minCanvasY = -maxCanvasY;

	return [
		((normX + 1) / 2) * (maxCanvasX - minCanvasX) + minCanvasX,
		((normY + 1) / 2) * (maxCanvasY - minCanvasY) + minCanvasY
	];
}

function normalizeGlCoords(
	[denormX, denormY]: [number, number],
	rect: DOMRect,
	scalar?: number
): [number, number] {
	const maxCanvasX = (rect.width / 2) * (scalar ?? 1);
	const minCanvasX = -maxCanvasX;
	const maxCanvasY = (rect.height / 2) * (scalar ?? 1);
	const minCanvasY = -maxCanvasY;
	return [
		((denormX - minCanvasX) / (maxCanvasX - minCanvasX)) * 2 - 1,
		((denormY - minCanvasY) / (maxCanvasY - minCanvasY)) * 2 - 1
	];
}

function scaleVec([x, y]: [number, number], scalar: number): [number, number] {
	return [x * scalar, y * scalar];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

class ZoomState {
	private scale: number = 1.0;
	private zoomCenter: [number, number] = [0, 0];
	private panPosition: [number, number] = [0, 0];
	private lastZoomTime: number = 0;

	constructor() {}

	private calculateDynamicScaleFactor(deltaY: number, currentTime: number): number {
		const timeSinceLastZoom = currentTime - this.lastZoomTime;
		const baseScaleFactor = deltaY > 0 ? 0.95 : 1.05;
		
		// If zoom events are very frequent (less than 50ms apart), scale factor approaches 1
		if (timeSinceLastZoom < 50) {
			const frequencyFactor = timeSinceLastZoom / 50; // 0 to 1
			return 1 + (baseScaleFactor - 1) * frequencyFactor;
		}
		
		// For less frequent zooms, use the full scale factor
		return baseScaleFactor;
	}

	handleZoom(e: ZoomEventParams, canvas: HTMLCanvasElement) {
		const currentTime = performance.now();
		const scaleFactor = this.calculateDynamicScaleFactor(e.deltaY, currentTime);
		this.lastZoomTime = currentTime;

		// const [mouseX, mouseY] = this.getMousePos(e, canvas);
		const rect = canvas.getBoundingClientRect();
		const maxCanvasX = rect.width / 2;
		const maxCanvasY = rect.height / 2;
		// this gives you denormalized user mouse vector relative to center of canvas
		const relativeCenterX = e.clientX - (rect.left + maxCanvasX);
		const relativeCenterY = -(e.clientY - (rect.top + maxCanvasY));

		// this gives you the current zoom center as denormalized vector relative to center of canvas.
		const denormalizedLastZoom = denormalizeGlCoords(this.zoomCenter, rect);

		// this gives you denormalized vector of user mouse relative to previous zoom center.
		const changeInCenter: [number, number] = [
			relativeCenterX - denormalizedLastZoom[0],
			relativeCenterY - denormalizedLastZoom[1]
		];
		// gets the denormalized change in center scaled down to fit the zoom
		// const scaledChangeInCenter = [changeInCenter[0] / this.scale, changeInCenter[1] / this.scale];

		// gets the normalized change vector (user mouse relative to prev center between [-1, 1])
		const normalizedChange = normalizeGlCoords(changeInCenter, rect);
		const scaledNormChange = scaleVec(normalizedChange, 1 / Math.max(1, this.scale) ** 2);

		const prevZooom = this.zoomCenter;
		// const clampChangeFactor = 0.001;
		const finalChangeX = scaledNormChange[0]; // / this.scale; //clamp(scaledNormChange[0], -clampChangeFactor, clampChangeFactor);
		const finalChangeY = scaledNormChange[1]; // / this.scale; // clamp(scaledNormChange[1], -clampChangeFactor, clampChangeFactor);
		this.zoomCenter = [this.zoomCenter[0] + finalChangeX, this.zoomCenter[1] + finalChangeY];

		const prevScale = this.scale;
		this.scale *= scaleFactor;
		this.scale = clamp(this.scale, 0.5, 5.0);
		if (this.scale === prevScale) {
			this.zoomCenter = prevZooom;
		}
	}

	panTo(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) {
		// const [x, y] = this.getMousePos(e, canvas);

		// Scale the movement based on current zoom level
		const dX = e.clientX - this.panPosition[0]; // / (this.scale > 1 ? this.scale : 1 / this.scale);
		const dY = this.panPosition[1] - e.clientY; /// (this.scale > 1 ? this.scale : 1 / this.scale);

		let [deltaX, deltaY] = normalizeGlCoords([dX, dY], canvas.getBoundingClientRect());
		if (this.scale < 1) {
			deltaX *= -1;
			deltaY *= -1;
		}
		// const scaleFactor = this.scale > 1 ? this.scale : 1 / this.scale ** 2;
		const scaleFactor = 1 / this.scale;
		this.zoomCenter[0] -= deltaX * scaleFactor;
		this.zoomCenter[1] -= deltaY * scaleFactor;

		this.panPosition = [e.clientX, e.clientY];
	}

	startPan(e: { clientX: number; clientY: number }) {
		this.panPosition = [e.clientX, e.clientY];
	}

	setPanPosition(pos: [number, number]) {
		this.panPosition = pos;
	}

	getCenter(): [number, number] {
		return this.zoomCenter;
	}

	getScale(): number {
		return this.scale;
	}

	getMousePos(e: MouseEvent, canvas: HTMLCanvasElement): [number, number] {
		const rect = canvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
		return [x, y];
	}
}

export class WebGLCanvasRenderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	private positionLocation: number;
	private texCoordLocation: number;
	private zoomCenterLocation: WebGLUniformLocation;
	private scaleLocation: WebGLUniformLocation;
	private positionBuffer: WebGLBuffer;
	private texCoordBuffer: WebGLBuffer;
	private texture: WebGLTexture;
	private zoomState = new ZoomState();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl', {
			alpha: true,
			premultipliedAlpha: false
		})!;
		if (!this.gl) {
			throw new Error('WebGL not supported');
		}

		const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
		this.program = this.createProgram(vertexShader, fragmentShader);

		this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
		this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
		this.zoomCenterLocation = this.gl.getUniformLocation(this.program, 'u_zoomCenter')!;
		this.scaleLocation = this.gl.getUniformLocation(this.program, 'u_scale')!;

		this.positionBuffer = this.gl.createBuffer()!;
		this.updateBuffers();

		this.texCoordBuffer = this.gl.createBuffer()!;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
			this.gl.STATIC_DRAW
		);

		this.texture = this.gl.createTexture()!;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		// mipmap requires power of 2 canvas
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MIN_FILTER,
			this.gl.LINEAR // this.gl.LINEAR_MIPMAP_LINEAR
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	}

	private updateBuffers() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
			this.gl.STATIC_DRAW
		);
	}

	private createShader(type: number, source: string): WebGLShader {
		const shader = this.gl.createShader(type)!;
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			throw new Error(this.gl.getShaderInfoLog(shader)!);
		}
		return shader;
	}

	private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
		const program = this.gl.createProgram()!;
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			throw new Error(this.gl.getProgramInfoLog(program)!);
		}
		return program;
	}

	render(sourceCanvas: HTMLCanvasElement) {
		const gl = this.gl;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.useProgram(this.program);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		gl.uniform2fv(this.zoomCenterLocation, this.zoomState.getCenter());
		gl.uniform1f(this.scaleLocation, this.zoomState.getScale());

		gl.enableVertexAttribArray(this.positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(this.texCoordLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
		// mipmap requires power of 2 canvas
		// gl.generateMipmap(gl.TEXTURE_2D);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	handleZoom(e: ZoomEventParams) {
		this.zoomState.handleZoom(e, this.canvas);
	}

	panTo(e: { clientX: number; clientY: number }) {
		this.zoomState.panTo(e, this.canvas);
	}

	startPan(e: { clientX: number; clientY: number }) {
		this.zoomState.startPan(e);
	}
}
