<script>
    export let title = 'Welcome to My Portfolio';
    export let subtitle = 'A Backend Developer Exploring Frontend Magic';
  </script>
  
  <section class="hero">
    <div class="content">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  </section>
  
  <style>
    .hero {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: white;
      text-align: center;
      background-color: rgba(255, 255, 255, 0.8);
    }
  
    .content h1 {
      font-size: 3rem;
      font-weight: bold;
    }
  
    .content p {
      font-size: 1.5rem;
    }
  </style>
  