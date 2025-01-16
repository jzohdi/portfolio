<script>
    export let size = '50px';
    export let color = '#3498db';
  </script>
  
  <style>
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--color);
      border-radius: 50%;
      width: var(--size);
      height: var(--size);
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
  
  <div
    class="spinner"
    style="--size: {size}; --color: {color};"
    aria-label="Loading"
  ></div>