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

export class SeiAgentKit {
  public publicClient: ViemPublicClient;
  public walletClient: ViemWalletClient;
  public wallet_address: Address;
  public token: string | undefined;
  /**
   * Creates a new SeiAgentKit instance
   * @param private_key The private key for the wallet
   * @param provider The model provider to use
   */
  constructor(
    private_key: string,
    provider: any,
  ) {
    const account = privateKeyToAccount(private_key as Address);
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
  }

  /**
   * Gets the ERC20 token balance
   * @param contract_address Optional ERC-20 token contract address. If not provided, gets native SEI balance
   * @returns Promise with formatted balance as string
   */
  async getERC20Balance(contract_address?: Address): Promise<string> {
    return get_erc20_balance(this, contract_address);
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