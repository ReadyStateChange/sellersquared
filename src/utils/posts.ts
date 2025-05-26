import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  return await getCollection("posts", ({ data }) => {
    console.log(data);
    return data.published === true;
  });
}
