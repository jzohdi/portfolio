<script lang="ts">
    export let detailedBiography: string = "Hi, I'm a software engineer specializing in backend development. This is my journey into frontend technologies like SvelteKit.";
    export let professionalBackground: string = "I have a degree in Computer Science and have worked in the finance industry for over 5 years, building scalable backend systems.";
    // export let skillsOverview: string = "Backend Development, Frontend Technologies, Cloud Infrastructure.";
    export let certifications: string[] = ["AWS Certified Developer", "Certified Java Programmer"];
  </script>
  
  <section class="about-me">
    <div class="content">
      <h2>About Me</h2>
      <p>{detailedBiography}</p>
      <p>{professionalBackground}</p>
      <ul>
        {#each certifications as cert}
          <li>{cert}</li>
        {/each}
      </ul>
    </div>
  </section>
  
  <style>
    .about-me {
      padding: 4rem 2rem;
      background-color: rgba(255, 255, 255, 0.9);
      color: #333;
      text-align: center;
      background-color: rgba(255, 255, 255, 0.8);
    }
  
    .content h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
  
    .content h3 {
      font-size: 2rem;
      margin-top: 1.5rem;
    }
  
    .content p, .content ul {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  </style>