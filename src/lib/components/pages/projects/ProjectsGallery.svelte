<script lang="ts">
	import Text from "$lib/components/Text.svelte";
	// import { type ProjectResult } from "$lib/types/projects";
	import { type HomePageData } from "$lib/types/types";
	import { element } from "three/tsl";
	import ProjectPreview from "./ProjectPreview.svelte";

    const { projects } = $props();
    const colors = [
      'red-500',
      'green-500',
      'blue-500',
      'yellow-500',
      'purple-500',
      'pink-500',
      'cyan-500',
      'lime-500',
      'indigo-500',
    ];
    function randomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }
</script>

<section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10">
        <span></span>
        <Text element="h2" class="">Projects</Text>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each projects as project}
            <ProjectPreview {project}/>
        {/each}
    </div>
</section>