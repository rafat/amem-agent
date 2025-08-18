import { MemoryManager } from "../manager";
import { SeiAgentKit } from "../../agent";
import {
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareStrategyOutcomeTool,
  MemoryAwareMarketObservationTool,
} from "./index";

async function testMemoryAwareTools() {
  // Initialize memory manager
  const memoryManager = await MemoryManager.create();

  // Initialize SeiAgentKit (you'll need to provide a valid private key)
  // const seiKit = new SeiAgentKit(process.env.SEI_PRIVATE_KEY!, 'openai');

  // For testing purposes, we'll create a mock SeiAgentKit
  const mockSeiKit = {
    swapTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    addAMMLiquidity: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    removeLiquidity: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    depositCollateral: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    borrowTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    repayBorrowedTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    withdrawCollateral: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    stakeTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    unstakeTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    claimStakingRewards: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    getTestnetPortfolio: async () => ({
      ammPositions: [],
      lendingPositions: [],
      stakingPositions: [],
    }),
  } as unknown as SeiAgentKit;

  const userId = "test-user-123";

  // Test AMM swap tool
  const swapTool = new MemoryAwareTestnetAMMSwapTool(
    mockSeiKit,
    memoryManager,
    userId,
  );
  try {
    const swapResult = await swapTool._call({
      tokenIn: "0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64", // METH
      tokenOut: "0xFF3260a3aab725b4BbBf9A94A57A5718196E5a73", // MBTC
      amountIn: "1000000000000000000", // 1 METH
    });
    console.log("Swap tool result:", swapResult);
  } catch (error) {
    console.error("Error testing swap tool:", error);
  }

  // Test strategy outcome tool
  const strategyTool = new MemoryAwareStrategyOutcomeTool(
    mockSeiKit,
    memoryManager,
    userId,
  );
  try {
    const strategyResult = await strategyTool._call({
      strategy: "AMM Arbitrage",
      outcome: "Successfully executed arbitrage strategy between pools A and B",
      profitability: 0.15,
    });
    console.log("Strategy outcome tool result:", strategyResult);
  } catch (error) {
    console.error("Error testing strategy outcome tool:", error);
  }

  // Test market observation tool
  const marketTool = new MemoryAwareMarketObservationTool(
    mockSeiKit,
    memoryManager,
    userId,
  );
  try {
    const marketResult = await marketTool._call({
      token: "0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64", // METH
      price: 1000,
      trend: "up",
    });
    console.log("Market observation tool result:", marketResult);
  } catch (error) {
    console.error("Error testing market observation tool:", error);
  }

  // Close memory manager
  await memoryManager.close();
}

// Run the test
testMemoryAwareTools().catch(console.error);
