<script lang="ts">
	import ProjectsPage from "$lib/components/pages/projects/ProjectsPage.svelte";

    const { data } = $props();
    const projects = data.projects;
</script>

<ProjectsPage {projects}/>