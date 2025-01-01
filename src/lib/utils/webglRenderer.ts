// WebGL shader for rendering 2D textures
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
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

export class WebGLCanvasRenderer {
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	private positionLocation: number;
	private texCoordLocation: number;
	private positionBuffer: WebGLBuffer;
	private texCoordBuffer: WebGLBuffer;
	private texture: WebGLTexture;
	private scale: number = 1.0;

	constructor(canvas: HTMLCanvasElement) {
		this.gl = canvas.getContext('webgl', {
			alpha: true,
			premultipliedAlpha: false
		})!;
		if (!this.gl) {
			throw new Error('WebGL not supported');
		}

		// Create shaders and program
		const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
		this.program = this.createProgram(vertexShader, fragmentShader);

		// Get locations
		this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
		this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');

		// Create buffers
		this.positionBuffer = this.gl.createBuffer()!;
		this.updateBuffers();

		this.texCoordBuffer = this.gl.createBuffer()!;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
			this.gl.STATIC_DRAW
		);

		// Create texture
		this.texture = this.gl.createTexture()!;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		// this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		// this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MIN_FILTER,
			this.gl.LINEAR_MIPMAP_LINEAR
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	}

	private updateBuffers() {
		const scale = this.scale;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([-scale, -scale, scale, -scale, -scale, scale, scale, scale]),
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

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	handleZoom(e: WheelEvent) {
		this.scale *= e.deltaY > 0 ? 0.9 : 1.1;
		this.scale = Math.max(0.1, Math.min(5.0, this.scale));
		this.updateBuffers();
	}

	render(sourceCanvas: HTMLCanvasElement) {
		const gl = this.gl;

		// Set viewport and program
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.useProgram(this.program);

		// Flip the texture vertically
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Set up position attribute
		gl.enableVertexAttribArray(this.positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

		// Set up texture coordinate attribute
		gl.enableVertexAttribArray(this.texCoordLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		// Update texture with source canvas content
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
		gl.generateMipmap(gl.TEXTURE_2D);

		// Draw
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
}
