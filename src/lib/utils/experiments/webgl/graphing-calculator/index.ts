import { parse, derivative } from "mathjs";
import makeFragmentShader from "./fragmentShader";
import { mapRange, type CanvasSize, type Point } from "../../utils/coordinates";
import vShader from "./vertexShader";

export default class WebGlGraphingCalculator {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram | null = null;
    private quadBuffer: WebGLBuffer | null = null;
    private formula: string | null = null;
    private tangentPoint: number | null = null;

    // TODO: make zoom/pan
    private xMin = -10;
    private xMax = 10;
    private yMin = -10;
    private yMax = 10;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // high-dpi display handling
        const pixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * pixelRatio;
        canvas.height = rect.height * pixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const gl = canvas.getContext("webgl", { antialias: true });
        if (!gl) {
            throw new Error("WebGL not supported in your browser!");
        }
        this.gl = gl;

        gl.viewport(0, 0, canvas.width, canvas.height);
        this.setupQuad();
    }

    private setupQuad() {
        const gl = this.gl;

        const vertices = [
            -1.0, -1.0,  // bottom left
            1.0, -1.0,  // bottom right
            -1.0, 1.0,  // top left
            1.0, 1.0,  // top right
        ];

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    setFormula(formula: string) {
        this.formula = formula;
        try {
            this.regenerateShaderProgram();
            this.graphFormula();

            return {
                derivativeString: this.getFormula()?.derivativeString
            };
        } catch (e) {
            console.error("Error setting formula:", e);
            return null;
        }
    }

    getFormula() {
        if (!this.formula) {
            return null;
        }
        const form = parse(this.formula)
        const dx = derivative(form, 'x');
        return { 
            formula: form.compile(),
            formulaString: form.toString(),
            derivative: dx.compile(),
            derivativeString: dx.toString()
        }
    }

    setTangentPoint(x: number | null) {
        this.tangentPoint = x;
        if (this.formula) {
            this.graphFormula();
        }
    }

    setViewport(xMin: number, xMax: number, yMin: number, yMax: number) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;

        if (this.formula) {
            this.graphFormula();
        }
    }

    private regenerateShaderProgram() {
        if (!this.formula) return;

        // Release existing program if it exists
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }

        const gl = this.gl;

        // Create fragment shader with the function embedded
        const fsSource = makeFragmentShader(this.formula);

        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vShader);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) {
            throw new Error("Failed to compile shaders");
        }

        // Create and link shader program
        const program = gl.createProgram();
        if (!program) {
            throw new Error("Failed to create shader program");
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Failed to link shader program: " + info);
        }

        this.program = program;
    }

    private compileShader(type: number, source: string): WebGLShader | null {
        const gl = this.gl;
        const shader = gl.createShader(type);

        if (!shader) {
            console.error("Failed to create shader");
            return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            console.error("Shader compilation error:", info);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    graphFormula() {
        if (!this.formula || !this.program) {
            return;
        }

        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        const positionAttribLocation = gl.getAttribLocation(this.program, "a_position");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

        const viewportLocation = gl.getUniformLocation(this.program, "u_viewport");
        gl.uniform4f(viewportLocation, this.xMin, this.xMax, this.yMin, this.yMax);

        const tangentLocation = gl.getUniformLocation(this.program, "u_tangent");
        // x-coordinate, show flag (0 or 1), tangent length
        const showTangent = this.tangentPoint !== null ? 1.0 : 0.0;
        const tangentX = this.tangentPoint !== null ? this.tangentPoint : 0.0;
        const tangentLength = (this.xMax - this.xMin) + (this.yMax - this.yMin); // the max length of the line could be from one corner to the other
        gl.uniform3f(tangentLocation, tangentX, showTangent, tangentLength);

        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    mapToRelativeCoordinate({ x, y }: Point, canvas: CanvasSize) {
        return {
            x: mapRange(x, canvas.minX, canvas.maxX, this.xMin, this.xMax),
            y: mapRange(y, canvas.minY, canvas.maxY, this.yMin, this.yMax)
        }
    }

    handleResize(width: number, height: number) {
        const pixelRatio = window.devicePixelRatio || 1;

        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        if (this.formula) {
            this.graphFormula();
        }
    }
}
