# Testnet Protocol Tools

This directory contains tools for interacting with the testnet versions of various DeFi protocols. These tools are designed to work with the smart contracts located in the `src/contracts` directory.

## Tools Overview

### Testnet Staking
Tools for interacting with the Staking contract:
- `stakeTokens` - Stake tokens in the staking pool
- `unstakeTokens` - Unstake tokens from the staking pool
- `claimStakingRewards` - Claim rewards from the staking pool

### Testnet Lending
Tools for interacting with the LendingPool contract:
- `depositCollateral` - Deposit collateral tokens
- `borrowTokens` - Borrow tokens using deposited collateral
- `repayBorrowedTokens` - Repay borrowed tokens
- `withdrawCollateral` - Withdraw deposited collateral

### Testnet AMM
Tools for interacting with the AMM contract:
- `addAMMLiquidity` - Add liquidity to token pairs
- `removeLiquidity` - Remove liquidity from token pairs
- `swapTokens` - Swap tokens using the AMM

### Testnet Portfolio
Tools for tracking portfolio positions:
- `getTestnetPortfolio` - Get a user's complete portfolio across all protocols

## Usage

These tools are available through the SeiAgentKit class and can be used in the same way as other tools in the agent.

## Note

The current implementations use placeholder contract addresses and ABIs. These will need to be updated with the actual deployed contract addresses and ABIs when they become available.