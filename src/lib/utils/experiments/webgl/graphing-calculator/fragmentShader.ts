import compileToGlslFormula from "glsl_math";

export default function makeFragmentShader(formula: string): string {
  const glslFormula = compileToGlslFormula(formula)

  // approximation of the slope for derivitave.
  const derivativeFormula = `(f(x + 0.0001) - f(x - 0.0001)) / 0.0002`;

  return `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec4 u_viewport;  // xMin, xMax, yMin, yMax
  uniform vec3 u_tangent;   // x, showTangent (0/1), tangentLength
  varying vec2 v_position;

  // GLSL ES may not have a built-in round
  float myRound(float a) {
      return floor(a + 0.5);
  }
  
  // Function to evaluate
  float f(float x) {
    return ${glslFormula};
  }
  
  // Numerical derivative
  float df(float x) {
    return ${derivativeFormula};
  }
  
  void main() {
    // clip space = [-1, 1] needs to be converted
    float x = mix(u_viewport.x, u_viewport.y, (v_position.x + 1.0) * 0.5);
    float y = mix(u_viewport.z, u_viewport.w, (v_position.y + 1.0) * 0.5);
    
    float fx = f(x);
    
    // thickness (in graph units, scaled by viewport size)
    float graphRange = u_viewport.w - u_viewport.z;
    float funcThickness = graphRange * 0.003;
    float axisThickness = graphRange * 0.002;
    float gridThickness = graphRange * 0.001;
    float tangentThickness = graphRange * 0.003;
    float pointRadius = graphRange * 0.01;
    
    float funcDistance = abs(y - fx);
    
    bool onXAxis = abs(y) < axisThickness;
    bool onYAxis = abs(x) < axisThickness;
    
    // grid line
    bool onGridX = abs(y - myRound(y)) < gridThickness && abs(y) > axisThickness;
    bool onGridY = abs(x - myRound(x)) < gridThickness && abs(x) > axisThickness;
    
    bool showTangent = u_tangent.y > 0.5 && abs(u_tangent.x) < 1000.0; // TODO: update this
    
    // Colors
    vec4 bgColor = vec4(0.0, 0.0, 0.0, 1.0);         // bg (black)
    vec4 funcColor = vec4(1.0, 1.0, 1.0, 1.0);       // function line
    vec4 axisColor = vec4(1.0, 1.0, 1.0, 0.75);       // white axis 
    vec4 gridColor = vec4(0.3, 0.3, 0.3, 0.5);       // gray grid
    vec4 tangentColor = vec4(0.2, 1.0, 0.2, 1.0);    // green tangent line
    vec4 pointColor = vec4(1.0, 0.0, 0.0, 1.0);      // red point
    
    // Start with background color
    vec4 outputColor = bgColor;
    
    if (onGridX || onGridY) {
      outputColor = gridColor;
    }
    
    if (onXAxis || onYAxis) {
      outputColor = axisColor;
    }
    
    if (funcDistance < funcThickness) {
      outputColor = funcColor;
    }

    if (showTangent) {
      float tx = u_tangent.x;
      float ty = f(tx);
      float slope = df(tx);
      
      // tanget line equation
      float tangentY = ty + slope * (x - tx);
    
      float tangentDist = abs(y - tangentY);
      
      float tangentLength = u_tangent.z;
      if (abs(x - tx) < tangentLength && tangentDist < tangentThickness) {
        outputColor = tangentColor;
      }
      
      // Draw point at tangent location
      float pointDist = distance(vec2(x, y), vec2(tx, ty));
      if (pointDist < pointRadius) {
        outputColor = pointColor;
      }
    }
    
    gl_FragColor = outputColor;
  }
`;
}