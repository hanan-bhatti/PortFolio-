import { unstable_cache } from "next/cache";

export const getGithubRepoData = unstable_cache(
  async (repoPath: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
        headers: process.env.GITHUB_TOKEN ? {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        } : {},
        next: { revalidate: 3600 }
      });
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }
      const data = await response.json();
      return {
        name: data.name,
        owner: data.owner.login,
        description: data.description || "No description provided.",
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language || null,
        url: data.html_url,
      };
    } catch (error) {
      console.error(`Error fetching github repo ${repoPath}:`, error);
      return null;
    }
  },
  ["github-repo-details"],
  { revalidate: 3600 } // 1 hour revalidation cache
);
