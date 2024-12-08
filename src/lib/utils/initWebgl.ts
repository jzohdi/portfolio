export default function initWebgl(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
    return;
  }

  // Set canvas size to take up the full screen
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
  const numCellsX = 100;
  const numCellsY = Math.round(numCellsX * (height / width));
  const cellWidth = 2 / numCellsX;
  const cellHeight = 2 / numCellsY;
  const cells = new Array(numCellsX * numCellsY).fill(0).map(() => Math.random() < 0.3 ? 1 : 0);

  
  // Vertex shader program
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
  `;

  // Fragment shader program
  const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  // Compile shaders
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the program
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  // Look up attribute and uniform locations
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorLocation = gl.getUniformLocation(program, 'u_color');

  // Create a buffer to store positions
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set up how to pull the data from the buffer
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Set the viewport to match the canvas dimensions
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  function draw() {
    if (!gl) {
      return console.error("gl is null")
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    cells.forEach((cell, index) => {
      if (cell === 1) {
        const x = (index % numCellsX) * cellWidth - 1;
        const y = (Math.floor(index / numCellsX)) * cellHeight - 1;

        const positions = [
          x, y,
          x + cellWidth, y,
          x, y + cellHeight,
          x, y + cellHeight,
          x + cellWidth, y,
          x + cellWidth, y + cellHeight
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.uniform4f(colorLocation, 0, 0, 0, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    });
    requestAnimationFrame(update);
  }

  function update() {
    const newCells = cells.slice();
    for (let x = 0; x < numCellsX; x++) {
      for (let y = 0; y < numCellsY; y++) {
        const index = x + y * numCellsX;
        const neighbors = getNeighbors(x, y);
        const aliveNeighbors = neighbors.reduce((acc, i) => acc + cells[i], 0);

        if (cells[index] === 1) {
          newCells[index] = (aliveNeighbors === 2 || aliveNeighbors === 3) ? 1 : 0;
        } else {
          newCells[index] = aliveNeighbors === 3 ? 1 : 0;
        }
      }
    }
    cells.splice(0, cells.length, ...newCells);
    draw();
  }

  function getNeighbors(x: number, y: number): number[] {
    const neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + numCellsX) % numCellsX;
        const ny = (y + dy + numCellsY) % numCellsY;
        neighbors.push(nx + ny * numCellsX);
      }
    }
    return neighbors;
  }

  function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed');
    }
    return shader;
  }

  function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Unable to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw new Error('Program linking failed');
    }
    return program;
  }

  gl.clearColor(0.1, 0.2, 0.4, 1.0);
  draw();
}