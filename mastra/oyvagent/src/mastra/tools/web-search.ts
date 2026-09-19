import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const webSearchTool = createTool({
  id: "web-search",
  description: "Busca información actualizada en internet",
  inputSchema: z.object({
    query: z.string().describe("La consulta de búsqueda"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const response = await client.search(context.query, {
      max_results: 5,
    });
    return {
      results: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  },
});
