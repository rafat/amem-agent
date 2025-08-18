import { SeiAgentKit } from "../src/agent";
import { MemoryManager } from "../src/memory/manager";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../src/types";

dotenv.config();

async function main() {
  console.log("🚀 A-MEM System Demonstration Started");

  try {
    // Initialize components
    console.log("1. Initializing Components...");
    const memoryManager = await MemoryManager.create();
    const privateKey =
      process.env.SEI_PRIVATE_KEY || "";
    const agent = new SeiAgentKit(
      privateKey,
      ModelProviderName.OPENAI,
      memoryManager
    );
    console.log("✅ Components initialized\n");

    // Add test memories
    console.log("2. Adding Test Memories...");
    await memoryManager.addMemory({
      content: "Successfully swapped WETH for USDC on AMM with 2.1% profit",
      type: "transaction_record",
      importance: 0.85,
      metadata: {
        userId: "demo_user",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        profit: "0.021",
      },
    });

    await memoryManager.addMemory({
      content:
        "Deposited WETH as collateral and borrowed USDC on lending protocol",
      type: "transaction_record",
      importance: 0.75,
      metadata: {
        userId: "demo_user",
        protocol: "Lending",
        collateralToken: "WETH",
        borrowToken: "USDC",
      },
    });
    console.log("✅ Test memories added\n");

    // Demonstrate memory retrieval
    console.log("3. Retrieving Relevant Memories...");
    const memories = await agent.getRelevantMemories("swap WETH to USDC", 3);
    console.log(`✅ Retrieved ${memories.length} memories:`);
    memories.forEach((mem, i) => {
      console.log(`   ${i + 1}. ${mem.content}`);
    });
    console.log();

    // Demonstrate memory-aware prompting
    console.log("4. Creating Memory-Aware Prompt...");
    const prompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with DeFi operations.",
      "swap WETH to USDC",
      300
    );
    console.log(`✅ Prompt created (${prompt.length} chars)`);
    console.log(`   Preview: ${prompt.substring(0, 100)}...\n`);

    // Demonstrate temporal weighting
    console.log("5. Demonstrating Temporal Weighting...");
    const recent = memoryManager.calculateTemporalWeight(
      new Date(Date.now() - 86400000)
    ); // 1 day
    const old = memoryManager.calculateTemporalWeight(
      new Date(Date.now() - 604800000)
    ); // 1 week
    console.log(`✅ Recent memory weight: ${recent.toFixed(3)}`);
    console.log(`✅ Old memory weight: ${old.toFixed(3)}`);
    console.log(`✅ Temporal weighting working: ${recent > old}\n`);

    // Clean up
    await memoryManager.close();

    console.log("🎉 A-MEM System Demonstration Completed Successfully!");
    console.log("\n📋 Key capabilities demonstrated:");
    console.log("   • Memory manager initialization");
    console.log("   • Agent with memory capabilities");
    console.log("   • Memory storage and retrieval");
    console.log("   • Context-aware prompting");
    console.log("   • Temporal weighting");
    console.log("   • Cross-component integration");
  } catch (error) {
    console.error("❌ Demonstration failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
