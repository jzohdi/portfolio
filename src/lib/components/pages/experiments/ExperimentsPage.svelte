<script lang="ts">
	import Spacer from "$lib/components/Spacer.svelte";
    import Text from "$lib/components/Text.svelte";
    import type { Projects } from "$lib/notion/helper";

    interface ProjectsPageProps {
        projects: Projects
    }
    const { projects }: ProjectsPageProps = $props();
</script>

<Spacer height="20px"></Spacer>
<Text element="h1">Projects</Text>
<Spacer height="40px"></Spacer>
<div class="grid grid-cols-3">
    <div class="col-span-1">

    </div>
    <ul class="col-span-2">
        {#each projects as project}
            <!-- <div>{JSON.stringify(project, null, 4)}</div> -->
            <Text element="li">
                <Text element="h2">{project.title}</Text>
            </Text>
        {/each}
    </ul>
</div>
