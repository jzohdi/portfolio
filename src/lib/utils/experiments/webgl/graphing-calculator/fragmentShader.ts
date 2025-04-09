export default function makeFragmentShader() {
    return `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec4 u_viewport;  // xMin, xMax, yMin, yMax
      varying vec2 v_position;
      
      // Function to evaluate: example sin(x)
      float f(float x) {
        // Replace this with any function you want to graph
        return sin(x);
      }
      
      void main() {
        // Convert from clip space [-1,1] to graph coordinates
        float x = mix(u_viewport.x, u_viewport.y, (v_position.x + 1.0) * 0.5);
        float y = mix(u_viewport.z, u_viewport.w, (v_position.y + 1.0) * 0.5);
        
        // Evaluate function at this x
        float fx = f(x);
        
        // Calculate distance to function curve
        float thickness = 0.02;  // Line thickness in graph units
        float distance = abs(y - fx);
        
        // Graph axes
        float axisThickness = 0.01;
        bool onXAxis = abs(y) < axisThickness;
        bool onYAxis = abs(x) < axisThickness;
        
        if (distance < thickness) {
          // Point is on function graph - white color
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        } else if (onXAxis || onYAxis) {
          // Point is on an axis - gray color
          gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0);
        } else {
          // Background
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
      }
    `;
}