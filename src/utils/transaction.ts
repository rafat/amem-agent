import { Address, encodeFunctionData } from "viem";
import { SeiAgentKit } from "../index";

interface SendTransactionParams {
  agent: SeiAgentKit;
  to: Address;
  data: `0x${string}`;
  value?: bigint;
}

/**
 * Sends a transaction using the agent's wallet client
 * @param params Transaction parameters
 * @returns Transaction hash
 */
export async function sendTransaction(params: SendTransactionParams): Promise<string> {
  const { agent, to, data, value = 0n } = params;

  if (!agent.walletClient) {
    throw new Error("Wallet client is not initialized");
  }

  const account = agent.walletClient.account;
  if (!account) {
    throw new Error("Wallet account is not initialized");
  }

  const chain = agent.walletClient.chain;

  const hash = await agent.walletClient.sendTransaction({
    account,
    chain,
    to,
    data,
    value,
  });

  if (!hash) {
    throw new Error("Transaction failed to send");
  }

  // Wait for transaction receipt
  if (agent.publicClient) {
    const transactionReceipt = await agent.publicClient.waitForTransactionReceipt({
      hash,
    });

    if (!transactionReceipt || transactionReceipt.status === "reverted") {
      const errorMsg = `Transaction failed: ${JSON.stringify(transactionReceipt)}`;
      throw new Error(errorMsg);
    }
  }

  return hash;
}