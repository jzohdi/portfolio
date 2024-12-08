<script lang="ts">
    export let projects = [
      {
        title: 'Project One',
        description: 'A web application that helps users manage tasks efficiently.',
        technologies: ['SvelteKit', 'TypeScript', 'TailwindCSS'],
        link: 'https://github.com/example/project-one'
      },
      {
        title: 'Project Two',
        description: 'An API service for real-time data processing.',
        technologies: ['Node.js', 'Express', 'MongoDB'],
        link: 'https://github.com/example/project-two'
      }
    ];
  </script>
  
  <section class="projects">
    <div class="content">
      <h2>Projects</h2>
      {#each projects as project}
        <div class="project">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p><strong>Technologies:</strong> {project.technologies.join(', ')}</p>
          <a href={project.link} target="_blank">View Project</a>
        </div>
      {/each}
    </div>
  </section>
  
  <style>
    .projects {
      padding: 4rem 2rem;
      background-color: #f0f0f0;
      color: #333;
      background-color: rgba(255, 255, 255, 0.8);
    }
  
    .content h2 {
      font-size: 2.5rem;
      margin-bottom: 2rem;
      text-align: center;
    }
  
    .project {
      margin-bottom: 2rem;
      text-align: left;
    }
  
    .project h3 {
      font-size: 2rem;
    }
  
    .project p {
      font-size: 1.25rem;
    }
  
    .project a {
      color: #1e90ff;
      text-decoration: none;
    }
  </style>