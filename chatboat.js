import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";

dotenv.config();

const tvly = tavily({
  apiKey: process.env.TAVILY_API,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API,
});




// -----------------------------
// Tool Definition
// -----------------------------

const tools = [
  {
    type: "function",
    function: {
      name: "webSearch",
      description:
        "Search the latest information from the web. Use this when the user asks for current or real-time information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
];

// -----------------------------
// Web Search Function
// -----------------------------

async function webSearch({ query }) {
//   console.log("\n🔎 Searching the web...\n");

  const response = await tvly.search(query, {
    maxResults: 5,
  });

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  return finalResult;
}

// -----------------------------
// Main Chat Function
// -----------------------------

export async function generate(userMessage) {
  const messages = [
    {
      role: "system",
      content: `
You are an AI assistant named Kali Das.

Your job is to answer the user's questions clearly and simply.

You have access to this tool:

1. webSearch({query:string})
   - Use this tool when the user asks for latest, current,
     real-time, recent, or web-based information.

IMPORTANT TERMINAL FORMATTING RULES:

- Do NOT use Markdown.
- Do NOT use **bold**.
- Do NOT use ## headings.
- Do NOT use markdown bullet points like "-".
- Do NOT use tables.
- Do NOT use code blocks unless the user specifically asks for code.
- Use simple plain text.
- Use numbered lists when needed.
- Keep answers concise and easy to read.
- Use blank lines between sections.
- Avoid very long explanations.

Example:

Instead of:

**RAG (Retrieval-Augmented Generation)** is...

### Why use RAG?

- Accurate answers
- Latest information

Write:

RAG stands for Retrieval-Augmented Generation.

It is a technique where an AI model first retrieves
relevant information from external data and then uses
that information to generate an answer.

Why is RAG useful?

1. It can use updated information.
2. It can reduce hallucinations.
3. It can work with private documents.
4. It is useful for chatbots and document Q&A.

Answer the user's question directly.

`,
    },
  ];



  // =================================
  // OUTER WHILE LOOP
  // User conversation loop
  // =================================

  while (true) {
  
 
    // Add user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // =================================
    // INNER WHILE LOOP
    // Tool calling loop
    // =================================

    while (true) {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "openai/gpt-oss-120b",
        temperature: 0.5,
        max_completion_tokens: 3000,
        tools,
        tool_choice: "auto",
      });

      const assistantMessage = chatCompletion.choices[0].message;

      // Add assistant response to conversation
      messages.push(assistantMessage);

      // ---------------------------------
      // Check if LLM wants to call a tool
      // ---------------------------------

      const toolCalls = assistantMessage.tool_calls;

      // No tool call
      if (!toolCalls || toolCalls.length === 0){
        return assistantMessage.content
    
      }

      // ---------------------------------
      // Execute all tool calls
      // ---------------------------------

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;

        const toolArguments = JSON.parse(toolCall.function.arguments);

        // console.log(`🛠️ Tool: ${toolName}`);

        if (toolName === "webSearch") {
          const toolResult = await webSearch(toolArguments);

          // Send tool result back to LLM
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: toolResult,
          });
        }
      }

      // Inner while continues
      // LLM will now receive tool result
      // and generate final answer
    }

    // Outer while continues
    // and asks user another question
  }


}


