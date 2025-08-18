import {
  WalletClient as ViemWalletClient,
  createPublicClient,
  http,
  PublicClient as ViemPublicClient,
  Address,
  createWalletClient,
} from "viem";
import { seiTestnet as sei } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  get_erc20_balance, erc20_transfer, get_erc721_balance, erc721Transfer, erc721Mint, getTokenAddressFromTicker,
  postTweet, TwitterPostTweetSchema, getAccountDetails, getAccountMentions, TwitterAccountMentionsSchema, postTweetReply, TwitterPostTweetReplySchema,
  // Testnet staking tools
  stakeTokens,
  unstakeTokens,
  claimStakingRewards,
  // Testnet lending tools
  depositCollateral,
  borrowTokens,
  repayBorrowedTokens,
  withdrawCollateral,
  // Testnet AMM tools
  addAMMLiquidity,
  removeLiquidity,
  swapTokens,
  // Testnet portfolio tools
  getTestnetPortfolio
} from '../tools';
import { getTokenForProvider } from './modelProvider';
import { ModelProviderName } from '../types';
import { z } from 'zod';
import { MemoryManager } from '../memory/manager';
import { Memory } from '../memory/models';

export class SeiAgentKit {
  public publicClient: ViemPublicClient;
  public walletClient: ViemWalletClient;
  public wallet_address: Address;
  public token: string | undefined;
  public memoryManager: MemoryManager | null = null;
  
  /**
   * Creates a new SeiAgentKit instance
   * @param private_key The private key for the wallet
   * @param provider The model provider to use
   * @param memoryManager Optional memory manager for enhanced decision making
   */
  constructor(
    private_key: string,
    provider: any,
    memoryManager?: MemoryManager,
  ) {
    // Ensure private key has 0x prefix
    const formattedPrivateKey = private_key.startsWith('0x') ? private_key : `0x${private_key}`;
    
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    this.publicClient = createPublicClient({
      chain: sei,
      transport: http()
    });
    this.wallet_address = account.address;
    this.walletClient = createWalletClient({
      account,
      chain: sei,
      transport: http()
    });

    this.token = getTokenForProvider(provider);
    
    // Set memory manager if provided
    if (memoryManager) {
      this.memoryManager = memoryManager;
    }
  }

  /**
   * Retrieves relevant memories for a given context
   * @param context The context to search for relevant memories
   * @param k The number of memories to retrieve
   * @returns Array of relevant memories
   */
  async getRelevantMemories(context: string, k: number = 5): Promise<Memory[]> {
    if (!this.memoryManager) {
      return [];
    }
    
    try {
      return await this.memoryManager.retrieveMemories(context, k);
    } catch (error) {
      console.error("Failed to retrieve relevant memories:", error);
      return [];
    }
  }

  /**
   * Calculates relevance score between a query and a memory
   * @param query The query text
   * @param memory The memory to score
   * @returns Relevance score between 0 and 1
   */
  async calculateRelevanceScore(query: string, memory: Memory): Promise<number> {
    // For now, we'll use a simple approach based on semantic similarity
    // In a more advanced implementation, we could use embeddings to calculate cosine similarity
    
    // Base score from memory importance
    let score = memory.importance;
    
    // Temporal weighting - more recent memories are more relevant
    const now = new Date();
    const memoryAge = (now.getTime() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24); // Age in days
    
    // Apply time decay (exponential decay with half-life of 7 days)
    const timeWeight = Math.pow(0.5, memoryAge / 7);
    score *= timeWeight;
    
    // Content similarity boost (simple keyword matching for now)
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = memory.content.toLowerCase().split(/\s+/);
    
    // Count matching words
    const matches = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
    ).length;
    
    // Boost score based on matches
    const similarityBoost = Math.min(1, matches / queryWords.length);
    score = Math.min(1, score + similarityBoost * 0.3);
    
    return score;
  }

  /**
   * Retrieves and scores relevant memories for a given context
   * @param context The context to search for relevant memories
   * @param k The number of memories to retrieve
   * @returns Array of scored memories
   */
  async getScoredMemories(context: string, k: number = 5): Promise<Array<{memory: Memory, score: number}>> {
    if (!this.memoryManager) {
      return [];
    }
    
    try {
      const memories = await this.memoryManager.retrieveMemories(context, k * 2); // Get more memories to score
      
      // Score each memory
      const scoredMemories = await Promise.all(
        memories.map(async (memory) => ({
          memory,
          score: await this.calculateRelevanceScore(context, memory)
        }))
      );
      
      // Sort by score and return top k
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    } catch (error) {
      console.error("Failed to retrieve and score memories:", error);
      return [];
    }
  }

  /**
   * Creates a memory-aware prompt by incorporating relevant memories
   * @param basePrompt The base prompt
   * @param context The context for retrieving relevant memories
   * @param maxTokens Maximum number of tokens to include in the memory context
   * @returns Memory-enhanced prompt
   */
  async createMemoryAwarePrompt(basePrompt: string, context: string, maxTokens: number = 1000): Promise<string> {
    if (!this.memoryManager) {
      return basePrompt;
    }
    
    try {
      // Get scored memories
      const scoredMemories = await this.getScoredMemories(context, 10);
      
      // Filter out low-scoring memories
      const relevantMemories = scoredMemories.filter(item => item.score > 0.3);
      
      if (relevantMemories.length === 0) {
        return basePrompt;
      }
      
      // Create memory context section
      let memoryContext = "\n\n## Relevant Past Experiences:\n";
      
      // Implement context compression to stay within token limits
      let currentTokens = 0;
      for (const item of relevantMemories) {
        const memoryText = `[${item.memory.type}] ${item.memory.content} (Relevance: ${(item.score * 100).toFixed(1)}%)`;
        
        // Rough estimate of tokens (4 characters per token is a rough approximation)
        const estimatedTokens = memoryText.length / 4;
        
        if (currentTokens + estimatedTokens > maxTokens) {
          break;
        }
        
        memoryContext += `\n- ${memoryText}`;
        currentTokens += estimatedTokens;
      }
      
      // Append memory context to the base prompt
      return `${basePrompt}${memoryContext}\n\nPlease consider these past experiences when making your decision.`;
    } catch (error) {
      console.error("Failed to create memory-aware prompt:", error);
      return basePrompt;
    }
  }

  /**
   * Transfers SEI tokens or ERC-20 tokens
   * @param amount Amount to transfer as a string (e.g., "1.5" for 1.5 tokens)
   * @param recipient Recipient address
   * @param ticker Optional token ticker (if not provided, transfers native SEI)
   * @returns Promise with transaction result
   */
  async ERC20Transfer(
    amount: string,
    recipient: Address,
    ticker?: string,
  ): Promise<string> {
    return erc20_transfer(this, amount, recipient, ticker);
  }

  /**
   * Gets the ERC721 token balance
   * @param tokenAddress The ERC-721 token contract address
   * @returns Promise with balance as string
   */
  async getERC721Balance(tokenAddress: Address): Promise<string> {
    return get_erc721_balance(this, tokenAddress);
  }

  /**
   * Transfers an ERC721 token
   * @param amount Deprecated parameter (kept for compatibility)
   * @param recipient The recipient address
   * @param tokenAddress The ERC-721 token contract address
   * @param tokenId The token ID to transfer
   * @returns Promise with transaction details or error message
   */
  async ERC721Transfer(
    amount: string,
    recipient: Address,
    tokenAddress: Address,
    tokenId: string,
  ): Promise<string> {
    return erc721Transfer(this, BigInt(amount), recipient, tokenAddress, BigInt(tokenId));
  }

  /**
   * Mints an ERC721 token
   * @param recipient The recipient address that will receive the minted token
   * @param tokenAddress The ERC-721 token contract address
   * @param tokenId The token ID to mint
   * @returns Promise with transaction details or error message
   */
  async ERC721Mint(
    recipient: Address,
    tokenAddress: Address,
    tokenId: bigint,
  ): Promise<string> {
    return erc721Mint(this, recipient, tokenAddress, tokenId);
  }

  /**
   * Gets a token address from its ticker symbol
   * @param ticker The token ticker symbol (e.g., "SEI", "USDC")
   * @returns Promise with token address or null if not found
   */
  async getTokenAddressFromTicker(
    ticker: string,
  ): Promise<Address | null> {
    return getTokenAddressFromTicker(ticker);
  }

  // Takara Protocol methods removed for testnet version
  // Takara Protocol methods removed for testnet version

  // Carbon SDK Methods removed for testnet version

  /**
   * Posts a tweet to Twitter
   * @param tweet The tweet to post
   * @returns Transaction hash and tweet details
   */
  async postTweet(tweet: z.infer<typeof TwitterPostTweetSchema>) {
    return postTweet(tweet);
  }

  /**
   * Retrieves details about the authenticated user's Twitter account
   * @returns Account details as a string
   */
  async getAccountDetails() {
    return getAccountDetails();
  }

  /**
   * Retrieves mentions for the authenticated user's Twitter account
   * @returns Mentions as a string
   */
  async getAccountMentions(args: z.infer<typeof TwitterAccountMentionsSchema>) {
    return getAccountMentions(args);
  }

  /**
   * Posts a reply to a tweet on Twitter
   * @param args The arguments for posting a reply
   * @returns Transaction hash and reply details
   */
  async postTweetReply(args: z.infer<typeof TwitterPostTweetReplySchema>) {
    return postTweetReply(args);
  }

  // Citrex Protocol methods removed for testnet version
   // Citrex Protocol methods removed for testnet version

  // Carbon SDK Methods removed for testnet version

  // Testnet Staking Methods
  /**
   * Stakes tokens in the testnet staking contract
   * @param stakingToken Address of the token to stake
   * @param amount Amount of tokens to stake (in wei)
   * @returns Transaction hash
   */
  async stakeTokens(stakingToken: Address, amount: bigint): Promise<string> {
    return stakeTokens(this, stakingToken, amount);
  }

  /**
   * Unstakes tokens from the testnet staking contract
   * @param stakingToken Address of the token to unstake
   * @param amount Amount of tokens to unstake (in wei)
   * @returns Transaction hash
   */
  async unstakeTokens(stakingToken: Address, amount: bigint): Promise<string> {
    return unstakeTokens(this, stakingToken, amount);
  }

  /**
   * Claims rewards from the testnet staking contract
   * @param stakingToken Address of the staking token
   * @returns Transaction hash
   */
  async claimStakingRewards(stakingToken: Address): Promise<string> {
    return claimStakingRewards(this, stakingToken);
  }

  // Testnet Lending Methods
  /**
   * Deposits collateral in the testnet lending pool
   * @param collateralToken Address of the collateral token
   * @param amount Amount of collateral to deposit (in wei)
   * @returns Transaction hash
   */
  async depositCollateral(collateralToken: Address, amount: bigint): Promise<string> {
    return depositCollateral(this, collateralToken, amount);
  }

  /**
   * Borrows tokens from the testnet lending pool
   * @param collateralToken Address of the collateral token
   * @param borrowToken Address of the token to borrow
   * @param amount Amount of tokens to borrow (in wei)
   * @returns Transaction hash
   */
  async borrowTokens(collateralToken: Address, borrowToken: Address, amount: bigint): Promise<string> {
    return borrowTokens(this, collateralToken, borrowToken, amount);
  }

  /**
   * Repays borrowed tokens to the testnet lending pool
   * @param collateralToken Address of the collateral token
   * @param borrowToken Address of the borrowed token
   * @param amount Amount of tokens to repay (in wei)
   * @returns Transaction hash
   */
  async repayBorrowedTokens(collateralToken: Address, borrowToken: Address, amount: bigint): Promise<string> {
    return repayBorrowedTokens(this, collateralToken, borrowToken, amount);
  }

  /**
   * Withdraws collateral from the testnet lending pool
   * @param collateralToken Address of the collateral token
   * @param amount Amount of collateral to withdraw (in wei)
   * @returns Transaction hash
   */
  async withdrawCollateral(collateralToken: Address, amount: bigint): Promise<string> {
    return withdrawCollateral(this, collateralToken, amount);
  }

  // Testnet AMM Methods
  /**
   * Adds liquidity to the testnet AMM
   * @param tokenA Address of the first token
   * @param tokenB Address of the second token
   * @param amountA Amount of tokenA to add (in wei)
   * @param amountB Amount of tokenB to add (in wei)
   * @returns Transaction hash
   */
  async addAMMLiquidity(tokenA: Address, tokenB: Address, amountA: bigint, amountB: bigint): Promise<string> {
    return addAMMLiquidity(this, tokenA, tokenB, amountA, amountB);
  }

  /**
   * Removes liquidity from the testnet AMM
   * @param tokenA Address of the first token
   * @param tokenB Address of the second token
   * @param liquidity Amount of liquidity to remove (in wei)
   * @returns Transaction hash
   */
  async removeLiquidity(tokenA: Address, tokenB: Address, liquidity: bigint): Promise<string> {
    return removeLiquidity(this, tokenA, tokenB, liquidity);
  }

  /**
   * Swaps tokens in the testnet AMM
   * @param tokenIn Address of the input token
   * @param tokenOut Address of the output token
   * @param amountIn Amount of input tokens to swap (in wei)
   * @returns Transaction hash
   */
  async swapTokens(tokenIn: Address, tokenOut: Address, amountIn: bigint): Promise<string> {
    return swapTokens(this, tokenIn, tokenOut, amountIn);
  }

  // Testnet Portfolio Methods
  /**
   * Gets the user's portfolio from the testnet contracts
   * @returns Portfolio information
   */
  async getTestnetPortfolio(): Promise<any> {
    return getTestnetPortfolio(this, this.wallet_address);
  }

}