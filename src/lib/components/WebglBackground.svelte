<script lang="ts">
    import { onMount } from 'svelte';
    import initWebgl from '../utils/initWebgl';
  
    let canvas: HTMLCanvasElement;
  
    onMount(() => {
    if (canvas) {
      initWebgl(canvas);
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function handleScroll() {
    const scrollHeight = document.documentElement.scrollTop + window.innerHeight;
    if (canvas.height < scrollHeight) {
      canvas.height = scrollHeight;
      canvas.style.height = `${scrollHeight}px`;
    }
  }
  </script>
  
  <canvas bind:this={canvas} class="webgl-canvas"></canvas>
  
  <style>
    .webgl-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }
  </style>