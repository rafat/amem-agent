import { SeiAgentKit } from "../src/agent";
import { MemoryManager } from "../src/memory/manager";
import { 
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareTestnetAMMAddLiquidityTool,
  MemoryAwareTestnetAMMRemoveLiquidityTool,
  MemoryAwareTestnetLendingDepositCollateralTool,
  MemoryAwareTestnetLendingBorrowTool,
  MemoryAwareTestnetLendingRepayTool,
  MemoryAwareTestnetLendingWithdrawCollateralTool,
  MemoryAwareTestnetStakingStakeTool,
  MemoryAwareTestnetStakingUnstakeTool,
  MemoryAwareTestnetStakingClaimRewardsTool,
  MemoryAwareTestnetPortfolioGetTool,
  MemoryAwareStrategyOutcomeTool,
  MemoryAwareMarketObservationTool,
  MemoryAwareSeiERC20TransferTool,
  MemoryAwareSeiERC20ApproveTool,
  SeiERC20BalanceTool
} from "../src/memory/wrapped-tools";
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
    
    // Create tools with memory support - ALL AVAILABLE TOOLS
    const agentTools = [
      // ERC20 Tools
      new SeiERC20BalanceTool(agentInstance),
      new MemoryAwareSeiERC20TransferTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareSeiERC20ApproveTool(agentInstance, memoryManager, "test_user_123"),
      
      // Testnet AMM Tools
      new MemoryAwareTestnetAMMSwapTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetAMMAddLiquidityTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetAMMRemoveLiquidityTool(agentInstance, memoryManager, "test_user_123"),
      
      // Testnet Lending Tools
      new MemoryAwareTestnetLendingDepositCollateralTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetLendingBorrowTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetLendingRepayTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetLendingWithdrawCollateralTool(agentInstance, memoryManager, "test_user_123"),
      
      // Testnet Staking Tools
      new MemoryAwareTestnetStakingStakeTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetStakingUnstakeTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareTestnetStakingClaimRewardsTool(agentInstance, memoryManager, "test_user_123"),
      
      // Testnet Portfolio Tools
      new MemoryAwareTestnetPortfolioGetTool(agentInstance, memoryManager, "test_user_123"),
      
      // Strategy and Market Tools
      new MemoryAwareStrategyOutcomeTool(agentInstance, memoryManager, "test_user_123"),
      new MemoryAwareMarketObservationTool(agentInstance, memoryManager, "test_user_123"),
    ];

    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "Sei Agent Kit with Full Memory Access!" } };

    const agent = createReactAgent({
      llm,
      tools: agentTools,
      checkpointSaver: memory,
      messageModifier: `
        You are a highly capable DeFi agent created by Cambrian AI, designed to interact with various DeFi protocols on the Sei blockchain. 
        You have access to a comprehensive set of tools for AMM trading, lending, staking, portfolio management, token balance checking, token transfers, and token approvals.
        You also have a sophisticated memory system that records your actions and helps you learn from past experiences.
        
        When a user asks you to perform a task, think carefully about which tools you need to use and in what order.
        You can check wallet balances, transfer tokens, and approve spenders for tokens including SEI, METH, MBTC, and USDT.
        Before performing operations like swapping tokens or adding liquidity, you may need to approve the relevant contracts to spend your tokens.
        
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
  console.log("\nStarting chat with the Cambrian Agent (with full tool access)... Type 'bye' to end.");
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