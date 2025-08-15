import { SeiAgentKit } from "./src/agent";
import { MemoryManager } from "./src/memory/manager";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { ModelProviderName } from "./src/types";

dotenv.config();

function checkRequiredEnvVars(): void {
  const missingVars: string[] = [];
  const requiredVars = ["OPENAI_API_KEY", "SEI_PRIVATE_KEY", "RPC_URL"];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

async function setupAgentWithRAG() {
  try {
    checkRequiredEnvVars();
    
    const llm = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
    });
  
    const agentInstance = new SeiAgentKit(
      process.env.SEI_PRIVATE_KEY!,
      ModelProviderName.OPENAI,
    );
    
    // Create memory manager
    const memoryManager = await MemoryManager.create();
    
    // Create tools with memory support
    const agentTools = [
      // Testnet tools can be added here if needed
      // TODO: Add other wrapped tools here
    ];

    // Create a prompt template that includes memory context
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a lively and witty agent created by Cambrian AI, designed to interact onchain using the Sei Agent Kit. 
        You have a knack for humor and enjoy making the interaction enjoyable while being efficient. 
        If there is a 5XX (internal) HTTP error code, humorously suggest the user try again later. 
        All users' wallet infos are already provided on the tool kit. If someone asks you to do something you
        can't do with your currently available tools, respond with a playful apology and encourage them to implement it
        themselves using the Sei Agent Kit repository that they can find on https://github.com/CambrianAgents/sei-agent-kit. Suggest they visit the Twitter account https://x.com/cambrian_ai or the website https://www.cambrian.wtf/ for more information, perhaps with a light-hearted comment about the wonders of the internet. Be concise, helpful, and sprinkle in some humor with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
        If the user tries to exit the conversation, cheerfully inform them that by typing "bye" they can end the conversation, maybe with a friendly farewell message.
        
        You also have access to a memory system that records your actions and can provide context from past experiences.
        
        Use the following context from your long-term memory to inform your answer:
        --- MEMORY CONTEXT ---
        {memory}
        --- END MEMORY CONTEXT ---
        `,
      ],
      ["placeholder", "{chat_history}"],
      ["user", "{input}"],
    ]);

    // Create a chain that retrieves memories and includes them in the prompt
    const ragChain = RunnableSequence.from([
      {
        input: new RunnablePassthrough(),
        memory: async (input: { input: string }) => {
          const memoryManager = await MemoryManager.create();
          const memories = await memoryManager.retrieveMemories(input.input);
          return memories.map(m => `[${m.type}]: ${m.content}`).join('\n');
        },
      },
      promptTemplate,
      llm,
    ]);

    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "Sei Agent Kit with RAG!" } };

    // For now, we'll create a simpler agent that uses our RAG chain
    // A full implementation would integrate this more deeply with the LangGraph agent
    return { ragChain, agentTools, memoryManager };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function startInteractiveSession(ragChain: any, memoryManager: MemoryManager) {
  console.log("\nStarting chat with the Cambrian Agent (with RAG)... Type 'bye' to end.");
  console.log("Type 'remember' to see recent memories.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nYou: ");

      if (userInput.toLowerCase() === "bye") {
        break;
      }
      
      if (userInput.toLowerCase() === "remember") {
        // Retrieve and display recent memories
        const memories = await memoryManager.retrieveMemories("recent transactions", 5);
        console.log("\nRecent memories:");
        memories.forEach((memory, index) => {
          console.log(`${index + 1}. ${memory.content} (Type: ${memory.type}, Importance: ${memory.importance})`);
        });
        continue;
      }

      // Use the RAG chain to generate a response
      const response = await ragChain.invoke({ input: userInput });
      console.log("\nCambrian Agent:", response.content);
      console.log("\n-----------------------------------\n");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function main() {
  try {
    console.log('\x1b[38;2;201;235;52m%s\x1b[0m', `
  ███████╗███████╗██╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗    ██╗  ██╗██╗████████╗
  ██╔════╝██╔════╝██║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██║ ██╔╝██║╚══██╔══╝
  ███████╗█████╗  ██║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       █████╔╝ ██║   ██║   
  ╚════██║██╔══╝  ██║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██╔═██╗ ██║   ██║   
  ███████║███████╗██║     ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ██║  ██╗██║   ██║   
  ╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═╝   ╚═╝   
`);
    const { ragChain, memoryManager } = await setupAgentWithRAG();
    await startInteractiveSession(ragChain, memoryManager);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

main();