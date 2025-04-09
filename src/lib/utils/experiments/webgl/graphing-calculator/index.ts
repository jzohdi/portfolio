import { parse, derivative } from "mathjs";

// Vertex shader program
const vsSource = `
    attribute vec2 a_position;
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_projectionMatrix;
    varying float v_x;

    void main() {
    v_x = a_position.x;
    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 0.0, 1.0);
    gl_PointSize = 2.0;
    }
`;

// Updated fragment shader
const fsSource = `
    precision highp float;
    uniform vec4 u_color;
    uniform float u_lineWidth;
    varying float v_x;
    
    void main() {
        // Falloff for anti-aliasing
        float dist = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
        gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
    }
`;

const numPoints = 1000;
const xMin = -10;
const xMax = 10;
const yMin = -10;
const yMax = 10;

// Create a model view matrix (identity for now)
const modelViewMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];


type ProgramInfo = ReturnType<typeof makeProgramInfo>;

function makeProgramInfo(program: WebGLProgram, gl: WebGLRenderingContext) {
    return {
        program,
        attribLocations: {
            position: gl.getAttribLocation(program, 'a_position'),
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
            color: gl.getUniformLocation(program, 'u_color'),
        },
    }
}

export default class WebGlGraphingCalculator {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private formula: string | null = null;
    private mathExpression: math.EvalFunction | null = null;
    private derivativeExpression: math.EvalFunction | null = null;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Handle high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * pixelRatio;
        canvas.height = rect.height * pixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const gl = canvas.getContext("webgl");;
        if (!gl) {
            throw new Error("WebGL not supported in your browser!");
        }
        // Set viewport to match canvas dimensions
        gl.viewport(0, 0, canvas.width, canvas.height);

        this.gl = gl;
        this.program = initShaderProgram(gl);
    }

    setFormula(formula: string) {
        this.formula = formula;
        try {
            const parsed = parse(formula);
            this.mathExpression = parsed.compile();

            // Also compute the derivative
            const d = derivative(parsed, 'x');
            const derivativeString = d.toString();
            this.derivativeExpression = d.compile();
            return {
                derivativeString
            }
        } catch (e) {
            console.error('Error parsing formula:', e);
        }
        return null;
    }

    // Replace your evaluateFormula function
    evaluateFormula(x: number): number {
        if (!this.mathExpression) return NaN;

        try {
            return this.mathExpression.evaluate({ x });
        } catch (e) {
            return NaN;
        }
    }

    // Add a method to evaluate the derivative
    evaluateDerivative(x: number): number {
        if (!this.derivativeExpression) return NaN;

        try {
            return this.derivativeExpression.evaluate({ x });
        } catch (e) {
            return NaN;
        }
    }

    graphFormula(tangentPoint: number) {
        if (!this.formula) {
            return;
        }

        const gl = this.gl;
        const program = this.program;
        const programInfo = {
            program: this.program,
            attribLocations: {
                position: gl.getAttribLocation(program, 'a_position'),
            },
            uniformLocations: {
                modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
                projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
                color: gl.getUniformLocation(program, 'u_color'),
            },
        } as const;
        const points = this.makePoints(this.formula);

        // Create a buffer for the points
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        // Clear the canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use our shader program
        gl.useProgram(programInfo.program);

        // Set up the projection matrix (map our coordinate space to clip space)
        const projectionMatrix = createProjectionMatrix(xMin, xMax, yMin, yMax, -1, 1);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Set color for the graph line
        gl.uniform4fv(programInfo.uniformLocations.color, [1.0, 1.0, 1.0, 1.0]);

        // Tell WebGL how to pull out the positions from the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.position,
            2,          // size: 2 components per iteration
            gl.FLOAT,   // type
            false,      // normalize
            0,          // stride
            0           // offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.position);

        // Group points into segments for LINE_STRIP rendering
        let startIdx = 0;
        for (let i = 0; i < points.length / 2; i++) {
            if (isNaN(points[i * 2]) || isNaN(points[i * 2 + 1])) {
                // If we have points to draw before this break
                if (i > startIdx) {
                    const count = i - startIdx;
                    gl.drawArrays(gl.LINE_STRIP, startIdx, count);
                }
                startIdx = i + 1; // Start after the break
            }
        }

        // Draw the last segment if needed
        if (startIdx < points.length / 2) {
            gl.drawArrays(gl.LINE_STRIP, startIdx, points.length / 2 - startIdx);
        }

        // Draw axes
        drawAxes(gl, programInfo);
    }

    makePoints(formula: string) {
        // Increase the number of points for higher resolution
        const numPoints = 4000; // 4x more points
        const points = [];
        const step = (xMax - xMin) / numPoints;

        // Track the previous point for adaptive sampling
        let prevY = this.evaluateFormula(xMin);
        let prevInBounds = prevY >= yMin && prevY <= yMax;

        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * step;
            const y = this.evaluateFormula(x);
            const inBounds = !isNaN(y) && isFinite(y) && y >= yMin && y <= yMax;

            // Add more points in regions with high curvature
            if (i > 0 && Math.abs(y - prevY) > 0.5) {
                // Add intermediate points
                const subSteps = 5;
                const subStep = step / subSteps;
                const prevX = xMin + (i - 1) * step;

                for (let j = 1; j < subSteps; j++) {
                    const interpX = prevX + j * subStep;
                    const interpY = this.evaluateFormula(interpX);
                    const interpInBounds = !isNaN(interpY) && isFinite(interpY) &&
                        interpY >= yMin && interpY <= yMax;

                    if (interpInBounds) {
                        points.push(interpX, interpY);
                    } else if (points.length > 0 && (j > 1 || prevInBounds)) {
                        // Add a break in the line if we transition out of bounds
                        points.push(NaN, NaN);
                    }
                }
            }

            if (inBounds) {
                // Add point if it's in bounds
                points.push(x, y);
            } else if (points.length > 0 && (i > 0 && prevInBounds)) {
                // Add a break in the line if we transition from in-bounds to out-of-bounds
                points.push(NaN, NaN);
            }

            prevY = y;
            prevInBounds = inBounds;
        }
        return points;
    }


    // Add this method to your class
    handleResize(width: number, height: number, tangentPoint: number) {
        const pixelRatio = window.devicePixelRatio || 1;

        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Re-render the graph
        if (this.formula) {
            this.graphFormula(tangentPoint);
        }
    }

    // New method to draw tangent line
    private drawTangentLine(gl: WebGLRenderingContext, programInfo: ProgramInfo, x: number) {
        if (!this.mathExpression || !this.derivativeExpression) return;

        try {
            // Calculate the point on the curve
            const y = this.evaluateFormula(x);

            // Calculate the slope (derivative) at this point
            const slope = this.evaluateDerivative(x);

            // If point is out of bounds or derivative is invalid, don't draw
            if (isNaN(y) || !isFinite(y) || isNaN(slope) || !isFinite(slope)) {
                return;
            }

            // Create tangent line points: extend in both directions from the point
            // y = y0 + m(x - x0)
            const extendFactor = 5; // How far to extend the tangent line
            const x1 = Math.max(xMin, x - extendFactor);
            const x2 = Math.min(xMax, x + extendFactor);

            const y1 = y + slope * (x1 - x);
            const y2 = y + slope * (x2 - x);

            // Check if tangent line points are within bounds
            if ((y1 < yMin && y2 < yMin) || (y1 > yMax && y2 > yMax)) {
                return; // Skip if completely out of bounds
            }

            const tangentPoints = [x1, y1, x2, y2];

            // Create a buffer for the tangent line
            const tangentBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangentPoints), gl.STATIC_DRAW);

            // Set a different color for the tangent line (bright green)
            gl.uniform4fv(programInfo.uniformLocations.color, [0.2, 1.0, 0.2, 1.0]);

            // Tell WebGL how to pull out positions
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
            gl.vertexAttribPointer(
                programInfo.attribLocations.position,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            // Draw the tangent line
            gl.drawArrays(gl.LINES, 0, 2);

            // Draw a point at the tangent location
            this.drawTangentPoint(gl, programInfo, x, y);
        } catch (e) {
            console.error('Error drawing tangent line:', e);
        }
    }

    // Method to draw a point marker at the tangent location
    private drawTangentPoint(gl: WebGLRenderingContext, programInfo: ProgramInfo, x: number, y: number) {
        // Create a small square/point at the tangent position
        const pointSize = 0.1; // Size of the point marker
        const pointVertices = [
            x - pointSize, y - pointSize,
            x + pointSize, y - pointSize,
            x + pointSize, y + pointSize,
            x - pointSize, y + pointSize
        ];

        const pointBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointVertices), gl.STATIC_DRAW);

        // Set a vibrant color for the point (bright yellow)
        gl.uniform4fv(programInfo.uniformLocations.color, [1.0, 1.0, 0.0, 1.0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.position,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        // Draw the point as a filled shape
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

// Initialize shaders
function initShaderProgram(gl: WebGLRenderingContext) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (vertexShader == null || fragmentShader == null) {
        throw new Error("")
    }
    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
    }

    return shaderProgram;
}

// Create a shader
function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('An error occurred creating shader.');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errorMessage = 'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(errorMessage);
    }

    return shader;
}

// Create projection matrix (orthographic for 2D graphing)
function createProjectionMatrix(left: number, right: number,
    bottom: number, top: number, near: number, far: number) {
    return [
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, 2 / (near - far), 0,
        (left + right) / (left - right), (bottom + top) / (bottom - top), (near + far) / (near - far), 1
    ];
}

function drawAxes(gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    // Create axes points
    const axesPoints = [
        // X-axis
        xMin, 0, xMax, 0,
        // Y-axis
        0, yMin, 0, yMax
    ];

    // Create a buffer for axes
    const axesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axesPoints), gl.STATIC_DRAW);

    // Set color for axes
    gl.uniform4fv(programInfo.uniformLocations.color, [1.0, 1.0, 1.0, 0.7]);

    // Tell WebGL how to pull out the positions from the position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.position,
        2,        // size: 2 components per iteration
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    );

    // Draw the axes
    gl.drawArrays(gl.LINES, 0, 4);
}