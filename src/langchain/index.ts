export * from './sei-erc20';
export * from './sei-erc721';
export * from './dexscreener';
export * from './twitter';
export * from './testnet-amm';
export * from './testnet-lending';
export * from './testnet-staking';
export * from './testnet-portfolio';

import type { SeiAgentKit } from "../agent";
import {
  SeiERC20BalanceTool,
  SeiERC20TransferTool,
  SeiERC721BalanceTool,
  SeiERC721TransferTool,
  SeiERC721MintTool,
  SeiGetTokenAddressTool,
  SeiPostTweetTool,
  SeiGetAccountDetailsTool,
  SeiGetAccountMentionsTool,
  SeiPostTweetReplyTool,
} from './index';

// Testnet AMM Tools
import {
  TestnetAMMSwapTool,
  TestnetAMMAddLiquidityTool,
  TestnetAMMRemoveLiquidityTool,
} from './testnet-amm';

// Testnet Lending Tools
import {
  TestnetLendingDepositCollateralTool,
  TestnetLendingBorrowTool,
  TestnetLendingRepayTool,
  TestnetLendingWithdrawCollateralTool,
} from './testnet-lending';

// Testnet Staking Tools
import {
  TestnetStakingStakeTool,
  TestnetStakingUnstakeTool,
  TestnetStakingClaimRewardsTool,
} from './testnet-staking';

// Testnet Portfolio Tools
import {
  TestnetPortfolioGetTool,
} from './testnet-portfolio';

export function createSeiTools(seiKit: SeiAgentKit) {
  return [
    // Core Tools
    new SeiERC20BalanceTool(seiKit),
    new SeiERC20TransferTool(seiKit),
    new SeiERC721BalanceTool(seiKit),
    new SeiERC721TransferTool(seiKit),
    new SeiERC721MintTool(seiKit),
    new SeiGetTokenAddressTool(seiKit),
    new SeiPostTweetTool(seiKit),
    new SeiGetAccountDetailsTool(seiKit),
    new SeiGetAccountMentionsTool(seiKit),
    new SeiPostTweetReplyTool(seiKit),
    
    // Testnet AMM Tools
    new TestnetAMMSwapTool(seiKit),
    new TestnetAMMAddLiquidityTool(seiKit),
    new TestnetAMMRemoveLiquidityTool(seiKit),
    
    // Testnet Lending Tools
    new TestnetLendingDepositCollateralTool(seiKit),
    new TestnetLendingBorrowTool(seiKit),
    new TestnetLendingRepayTool(seiKit),
    new TestnetLendingWithdrawCollateralTool(seiKit),
    
    // Testnet Staking Tools
    new TestnetStakingStakeTool(seiKit),
    new TestnetStakingUnstakeTool(seiKit),
    new TestnetStakingClaimRewardsTool(seiKit),
    
    // Testnet Portfolio Tools
    new TestnetPortfolioGetTool(seiKit),
  ];
}
