<script lang="ts">
	import Text from "$lib/components/Text.svelte";
import type { RecentPost } from "$lib/types/types";

   interface PostPreviewProps {
        post: RecentPost
   }
   const { post }: PostPreviewProps = $props();
</script>

<a href={`/posts/${post.slug}`} aria-label={post.title} class="group">
   <div class="rounded-md overflow-hidden border-solid light:border-slate-100 border-2 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-900">
      <div class="overflow-hidden">
         <div class="relative h-28 md:h-32 lg:h-52 overflow-hidden flex w-full">
            <img
               src={post.previewImage}
               width="300"
               height="192"
               alt="post preview"
               class="w-full object-cover"
         />
         </div>
      </div>
      <div class="p-4">
         <Text element="h3" class="group-hover:text-secondary font-bold duration-400">{post.title}</Text>
         <Text element="p" class="text-muted-foreground text-sm">{post.description}</Text>
         <Text element="p" class="duration-400 group-hover:text-secondary flex items-center">Read more<svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="duration-400 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
          </svg></Text>
      </div>
   </div>
</a>