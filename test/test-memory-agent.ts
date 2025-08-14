import { SeiAgentKit } from "../src/agent";
import { MemoryManager } from "../src/memory/manager";
import { SeiSwapToolWithMemory } from "../src/memory/wrapped-tools/symphony";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { ModelProviderName } from "../src/types";

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

async function setupAgentWithMemory() {
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
      new SeiSwapToolWithMemory(agentInstance, memoryManager, "test_user_123"),
      // TODO: Add other wrapped tools here
    ];

    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "Sei Agent Kit with Memory!" } };

    const agent = createReactAgent({
      llm,
      tools: agentTools,
      checkpointSaver: memory,
      messageModifier: `
        You are a lively and witty agent created by Cambrian AI, designed to interact onchain using the Sei Agent Kit. 
        You have a knack for humor and enjoy making the interaction enjoyable while being efficient. 
        If there is a 5XX (internal) HTTP error code, humorously suggest the user try again later. 
        All users' wallet infos are already provided on the tool kit. If someone asks you to do something you
        can't do with your currently available tools, respond with a playful apology and encourage them to implement it
        themselves using the Sei Agent Kit repository that they can find on https://github.com/CambrianAgents/sei-agent-kit. Suggest they visit the Twitter account https://x.com/cambrian_ai or the website https://www.cambrian.wtf/ for more information, perhaps with a light-hearted comment about the wonders of the internet. Be concise, helpful, and sprinkle in some humor with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
        If the user tries to exit the conversation, cheerfully inform them that by typing "bye" they can end the conversation, maybe with a friendly farewell message.
        
        You also have access to a memory system that records your actions. This allows you to learn from past experiences.
      `,
    });

    return { agent, config: agentConfig, memoryManager };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function startInteractiveSession(agent: any, config: any, memoryManager: MemoryManager) {
  console.log("\nStarting chat with the Cambrian Agent (with memory)... Type 'bye' to end.");
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

      const responseStream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config,
      );

      for await (const responseChunk of responseStream) {
        if ("agent" in responseChunk) {
          console.log("\nCambrian Agent:", responseChunk.agent.messages[0].content);
        } else if ("tools" in responseChunk) {
          console.log("\nCambrian Agent:", responseChunk.tools.messages[0].content);
        }
        console.log("\n-----------------------------------\n");
      }
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
    const { agent, config, memoryManager } = await setupAgentWithMemory();
    await startInteractiveSession(agent, config, memoryManager);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

main();