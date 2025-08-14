import { Address, createPublicClient, http, parseUnits, parseAbi, isAddress, encodeFunctionData } from "viem";
import { seiTestnet as sei } from 'viem/chains';
import { SeiAgentKit } from "../../index";
import { isContract } from "../../utils/isContract";
import { Account } from "viem";

const erc721Abi = parseAbi([
  'function safeTransferFrom(address from, address to, uint256 tokenId)'
]);

/**
 * Transfers an ERC721 token from the agent's wallet to a recipient
 * @param agent The SeiAgentKit instance
 * @param amount Deprecated parameter (kept for compatibility)
 * @param recipient The recipient address
 * @param tokenAddress The ERC721 token contract address
 * @param tokenId The token ID to transfer
 * @returns Transaction details as string or error message
 */
export async function erc721Transfer(
  agent: SeiAgentKit,
  amount: bigint,
  recipient: Address,
  tokenAddress: Address,
  tokenId: bigint,
): Promise<string> {
  console.log(`Transferring NFT #${tokenId} from ${tokenAddress} to ${recipient}...`);
  try {
    // Validate input parameters
    if (!agent) {
      throw new Error("Agent instance is required");
    }

    if (!agent.walletClient) {
      throw new Error("Agent walletClient is not configured");
    }

    if (!agent.publicClient) {
      throw new Error("Agent publicClient is not configured");
    }

    if (!agent.wallet_address) {
      throw new Error("Agent wallet_address is not configured");
    }

    if (!recipient) {
      throw new Error("Recipient address is required");
    }

    if (!isAddress(recipient)) {
      throw new Error(`Invalid recipient address: ${recipient}`);
    }

    if (!tokenAddress) {
      throw new Error("Token address is required");
    }

    if (!isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }

    if (tokenId === undefined || tokenId === null) {
      throw new Error("Token ID is required");
    }

    // Verify this is a contract
    try {
      const isValidContract = await isContract(agent, tokenAddress);
      if (!isValidContract) {
        throw new Error(`Address ${tokenAddress} is not a valid contract`);
      }
    } catch (error) {
      throw new Error(`Failed to verify contract: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get wallet account
    const account = agent.walletClient.account as Account;
    if (!account) {
      throw new Error("Wallet account is not properly configured");
    }

    // Encode the function call
    try {
      const data = encodeFunctionData({
        abi: erc721Abi,
        functionName: 'safeTransferFrom',
        args: [agent.wallet_address, recipient, tokenId],
      });

      if (!data) {
        throw new Error("Failed to encode transaction data");
      }

      // Send transaction
      const hash = await agent.walletClient.sendTransaction({
        to: tokenAddress,
        data: data,
        account,
        chain: sei,
      });

      if (!hash) {
        throw new Error("Transaction hash is undefined");
      }

      // Wait for receipt
      const transactionReceipt = await agent.publicClient.waitForTransactionReceipt({
        hash,
      });

      if (!transactionReceipt) {
        throw new Error("Transaction receipt is undefined");
      }

      if (transactionReceipt.status === "reverted") {
        throw new Error(`Transaction reverted: ${hash}`);
      }

      return `Successfully transferred NFT with token ID ${tokenId} to ${recipient}.\nTransaction hash: ${hash}`;
    } catch (error) {
      throw new Error(`Transaction execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
