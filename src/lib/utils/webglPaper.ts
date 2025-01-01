// Vertex shader program
const VERTEX_SHADER = `
	attribute vec4 a_position;
	attribute vec2 a_texCoord;
	varying vec2 v_texCoord;
	void main() {
		gl_Position = a_position;
		v_texCoord = a_texCoord;
	}
`;

// Fragment shader program
const FRAGEMENT_SHADER = `
	precision mediump float;
	varying vec2 v_texCoord;
	uniform sampler2D u_texture;
	void main() {
		gl_FragColor = texture2D(u_texture, v_texCoord);
	}
`;

export function webglPaper(
	canvas: HTMLCanvasElement,
	gl: WebGLRenderingContext,
	program: WebGLProgram
) {
	const texture = canvasToTexture(gl, canvas);
	renderTexture(gl, program, texture);
	return gl;
}

export function setupGl(canvas: HTMLCanvasElement) {
	const gl = canvas.getContext('webgl');
	if (gl === null) {
		throw new Error('Webgl not supported.');
	}
	return gl;
}

export function setupWebglProgram(gl: WebGLRenderingContext): WebGLProgram {
	// Compile shaders
	const vertexShader = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
	const fragmentShader = compileShader(gl, FRAGEMENT_SHADER, gl.FRAGMENT_SHADER);

	// Link program
	const program = createProgram(gl, vertexShader, fragmentShader);
	return program;
}

function canvasToTexture(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
	return improveTextureQuality(gl, canvas);
	// const texture = gl.createTexture();
	// gl.bindTexture(gl.TEXTURE_2D, texture);
	// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	// return texture;
}

function improveTextureQuality(gl: WebGLRenderingContext, sourceCanvas: HTMLCanvasElement) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Flip the texture vertically
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	const resizedCanvas = resizeToPowerOfTwo(sourceCanvas); // Resize for better compatibility
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resizedCanvas);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	const ext = gl.getExtension('EXT_texture_filter_anisotropic');
	if (ext) {
		const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
	}

	return texture;
}

function resizeToPowerOfTwo(canvas: HTMLCanvasElement) {
	const width = Math.pow(2, Math.ceil(Math.log2(canvas.width)));
	const height = Math.pow(2, Math.ceil(Math.log2(canvas.height)));

	const offscreen = document.createElement('canvas');
	offscreen.width = width;
	offscreen.height = height;

	const ctx = offscreen.getContext('2d');
	if (ctx === null) {
		throw new Error('could not get canvas 2d');
	}
	ctx.drawImage(canvas, 0, 0, width, height);

	return offscreen;
}

function renderTexture(gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture) {
	gl.useProgram(program);

	// Vertex positions (two triangles forming a rectangle)
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
		-1,
		-1, // Bottom-left
		1,
		-1, // Bottom-right
		-1,
		1, // Top-left
		1,
		1 // Top-right
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const positionLocation = gl.getAttribLocation(program, 'a_position');
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	// Texture coordinates
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	const texCoords = [
		0,
		0, // Bottom-left
		1,
		0, // Bottom-right
		0,
		1, // Top-left
		1,
		1 // Top-right
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

	const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	// Set the texture
	const textureLocation = gl.getUniformLocation(program, 'u_texture');
	gl.uniform1i(textureLocation, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Draw
	gl.clearColor(0, 0, 0, 1); // Clear to black
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function compileShader(gl: WebGLRenderingContext, source: string, type: number) {
	const shader = gl.createShader(type);
	if (shader === null) {
		throw new Error('shader is null');
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		throw new Error('Shader compile failed');
	}

	return shader;
}

function createProgram(
	gl: WebGLRenderingContext,
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader
) {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Program link failed:', gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		throw new Error('Program link failed');
	}

	return program;
}
