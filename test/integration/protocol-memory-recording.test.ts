import { MemoryManager } from "../../src/memory/manager";
import { Memory, MemoryType } from "../../src/memory/models";
import * as dotenv from "dotenv";

dotenv.config();

describe("Protocol-Specific Memory Recording Integration", () => {
  let memoryManager: MemoryManager;

  beforeAll(async () => {
    memoryManager = await MemoryManager.create();
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should record AMM-specific memories correctly", async () => {
    const ammMemory: Omit<Memory, "id" | "timestamp"> = {
      content: "Successfully swapped 1000 USDC for 0.5 WETH on AMM. Transaction was profitable with 2% gain.",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "USDC",
        toToken: "WETH",
        amountIn: "1000000000",
        amountOut: "500000000000000000",
        profit: "0.02",
        toolName: "memory_aware_testnet_amm_swap",
        action: "swap_tokens",
        transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      }
    };

    const memoryId = await memoryManager.addMemory(ammMemory);
    expect(memoryId).toBeDefined();

    // Retrieve and verify the memory
    const retrievedMemories = await memoryManager.retrieveMemories("swap WETH to USDC", 5);
    const ammMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    
    expect(ammMemoryFound).toBeDefined();
    expect(ammMemoryFound?.content).toContain("Successfully swapped 1000 USDC for 0.5 WETH");
    expect(ammMemoryFound?.type).toBe("transaction_record");
    expect(ammMemoryFound?.metadata.protocol).toBe("AMM");
    expect(ammMemoryFound?.metadata.fromToken).toBe("USDC");
    expect(ammMemoryFound?.metadata.toToken).toBe("WETH");
  });

  it("should record lending-specific memories correctly", async () => {
    const lendingMemory: Omit<Memory, "id" | "timestamp"> = {
      content: "Successfully deposited 1 WETH as collateral and borrowed 1000 USDC on lending protocol.",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        protocol: "Lending",
        collateralToken: "WETH",
        borrowToken: "USDC",
        collateralAmount: "1000000000000000000",
        borrowAmount: "1000000000",
        toolName: "memory_aware_testnet_lending_deposit_collateral",
        action: "deposit_collateral_and_borrow",
        transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      }
    };

    const memoryId = await memoryManager.addMemory(lendingMemory);
    expect(memoryId).toBeDefined();

    // Retrieve and verify the memory
    const retrievedMemories = await memoryManager.retrieveMemories("deposit WETH collateral", 5);
    const lendingMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    
    expect(lendingMemoryFound).toBeDefined();
    expect(lendingMemoryFound?.content).toContain("Successfully deposited 1 WETH as collateral");
    expect(lendingMemoryFound?.type).toBe("transaction_record");
    expect(lendingMemoryFound?.metadata.protocol).toBe("Lending");
    expect(lendingMemoryFound?.metadata.collateralToken).toBe("WETH");
    expect(lendingMemoryFound?.metadata.borrowToken).toBe("USDC");
  });

  it("should record staking-specific memories correctly", async () => {
    const stakingMemory: Omit<Memory, "id" | "timestamp"> = {
      content: "Successfully staked 100 TEST tokens. Estimated APY: 12%.",
      type: "transaction_record",
      importance: 0.6,
      metadata: {
        userId: "test_user_123",
        protocol: "Staking",
        stakingToken: "TEST",
        amount: "100000000000000000000",
        apy: "0.12",
        toolName: "memory_aware_testnet_staking_stake",
        action: "stake_tokens",
        transactionHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
      }
    };

    const memoryId = await memoryManager.addMemory(stakingMemory);
    expect(memoryId).toBeDefined();

    // Retrieve and verify the memory
    const retrievedMemories = await memoryManager.retrieveMemories("stake TEST tokens", 5);
    const stakingMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    
    expect(stakingMemoryFound).toBeDefined();
    expect(stakingMemoryFound?.content).toContain("Successfully staked 100 TEST tokens");
    expect(stakingMemoryFound?.type).toBe("transaction_record");
    expect(stakingMemoryFound?.metadata.protocol).toBe("Staking");
    expect(stakingMemoryFound?.metadata.stakingToken).toBe("TEST");
    expect(stakingMemoryFound?.metadata.apy).toBe("0.12");
  });

  it("should record strategy outcome memories correctly", async () => {
    const strategyMemory: Omit<Memory, "id" | "timestamp"> = {
      content: "Executed AMM arbitrage strategy between pools A and B. Net profit: 1.5% after gas fees.",
      type: "strategy_outcome",
      importance: 0.9,
      metadata: {
        userId: "test_user_123",
        strategy: "AMM Arbitrage",
        outcome: "Successful execution with positive returns",
        profitability: 0.015,
        gasUsed: "50000",
        netProfit: "15000000000000000", // 0.015 tokens
        toolName: "memory_aware_strategy_outcome",
        action: "record_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    };

    const memoryId = await memoryManager.addMemory(strategyMemory);
    expect(memoryId).toBeDefined();

    // Retrieve and verify the memory
    const retrievedMemories = await memoryManager.retrieveMemories("AMM arbitrage strategy", 5);
    const strategyMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    
    expect(strategyMemoryFound).toBeDefined();
    expect(strategyMemoryFound?.content).toContain("Executed AMM arbitrage strategy");
    expect(strategyMemoryFound?.type).toBe("strategy_outcome");
    expect(strategyMemoryFound?.metadata.strategy).toBe("AMM Arbitrage");
    expect(strategyMemoryFound?.metadata.profitability).toBe(0.015);
    expect(strategyMemoryFound?.importance).toBe(0.9);
  });

  it("should record market observation memories correctly", async () => {
    const marketMemory: Omit<Memory, "id" | "timestamp"> = {
      content: "Observed WETH/USDC pair price increased by 2.3% over the last hour. Trading volume: 1,250,000 USDC.",
      type: "market_observation",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        token: "WETH/USDC",
        priceChange: "0.023",
        volume: "1250000000000",
        timeframe: "1h",
        trend: "up",
        toolName: "memory_aware_market_observation",
        action: "record_market_observation",
        timestamp: new Date().toISOString()
      }
    };

    const memoryId = await memoryManager.addMemory(marketMemory);
    expect(memoryId).toBeDefined();

    // Retrieve and verify the memory
    const retrievedMemories = await memoryManager.retrieveMemories("WETH/USDC price movement", 5);
    const marketMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    
    expect(marketMemoryFound).toBeDefined();
    expect(marketMemoryFound?.content).toContain("Observed WETH/USDC pair price increased by 2.3%");
    expect(marketMemoryFound?.type).toBe("market_observation");
    expect(marketMemoryFound?.metadata.token).toBe("WETH/USDC");
    expect(marketMemoryFound?.metadata.priceChange).toBe("0.023");
    expect(marketMemoryFound?.metadata.trend).toBe("up");
  });
});