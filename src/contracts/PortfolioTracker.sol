// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AMM.sol";
import "./LendingPool.sol";
import "./Staking.sol";

contract PortfolioTracker {

    struct AMMPosition {
        address ammPair;
        uint256 lpBalance;
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
    }

    struct LendingPosition {
        address lendingPool;
        address collateralToken;
        uint256 collateralAmount;
        address borrowToken;
        uint256 borrowedAmount;
        uint256 collateralizationRatio;
        uint256 liquidationThreshold;
    }

    struct StakingPosition {
        address stakingPool;
        address stakingToken;
        uint256 stakedAmount;
        address rewardToken;
        uint256 pendingRewards;
        uint256 rewardRate;
    }

    struct FullPortfolio {
        AMMPosition[] ammPositions;
        LendingPosition[] lendingPositions;
        StakingPosition[] stakingPositions;
    }

    // Updated struct to include token pair information for AMM positions
    struct AMMPairInfo {
        address token0;
        address token1;
    }

    // Struct to hold token pair information for lending positions
    struct LendingPairInfo {
        address collateralToken;
        address borrowToken;
    }

    // Struct to hold staking token information
    struct StakingTokenInfo {
        address stakingToken;
    }

    function getFullPortfolio(
        address _user,
        address[] calldata _ammPairs,
        AMMPairInfo[] calldata _ammPairInfos,
        address[] calldata _lendingPools,
        LendingPairInfo[] calldata _lendingPairInfos,
        address[] calldata _stakingPools,
        StakingTokenInfo[] calldata _stakingTokenInfos
    ) external view returns (FullPortfolio memory) {
        
        AMMPosition[] memory amms = new AMMPosition[](_ammPairs.length);
        for(uint i = 0; i < _ammPairs.length; i++) {
            amms[i] = getAMMPosition(_user, _ammPairs[i], _ammPairInfos[i].token0, _ammPairInfos[i].token1);
        }
        
        LendingPosition[] memory lendings = new LendingPosition[](_lendingPools.length);
        for(uint i = 0; i < _lendingPools.length; i++) {
            lendings[i] = getLendingPosition(_user, _lendingPools[i], _lendingPairInfos[i].collateralToken, _lendingPairInfos[i].borrowToken);
        }

        StakingPosition[] memory stakings = new StakingPosition[](_stakingPools.length);
        for(uint i = 0; i < _stakingPools.length; i++) {
            stakings[i] = getStakingPosition(_user, _stakingPools[i], _stakingTokenInfos[i].stakingToken);
        }
        
        return FullPortfolio(amms, lendings, stakings);
    }

    function getAMMPosition(address _user, address _ammPair, address _token0, address _token1) public view returns (AMMPosition memory) {
        AMM amm = AMM(payable(_ammPair));
        
        // Get reserves for the specific token pair
        (uint256 reserve0, uint256 reserve1) = amm.getReserves(_token0, _token1);
        
        // Get LP balance for the user
        uint256 lpBalance = amm.getLPBalance(_user, _token0, _token1);
        
        return AMMPosition({
            ammPair: _ammPair,
            lpBalance: lpBalance,
            token0: _token0,
            token1: _token1,
            reserve0: reserve0,
            reserve1: reserve1
        });
    }

    function getLendingPosition(address _user, address _lendingPool, address _collateralToken, address _borrowToken) public view returns (LendingPosition memory) {
        LendingPool lending = LendingPool(payable(_lendingPool));
        
        // Get user position
        LendingPool.UserPosition memory position = lending.getUserPosition(_user, _collateralToken, _borrowToken);
        
        // Get borrow balance with interest
        uint256 borrowBalance = lending._getBorrowBalance(_user, _collateralToken, _borrowToken);
        
        // Get token pair configuration for additional info
        LendingPool.TokenPairConfig memory config = lending.getTokenPairConfig(_collateralToken, _borrowToken);
        
        return LendingPosition({
            lendingPool: _lendingPool,
            collateralToken: _collateralToken,
            collateralAmount: position.collateralDeposits,
            borrowToken: _borrowToken,
            borrowedAmount: borrowBalance,
            collateralizationRatio: config.collateralizationRatio,
            liquidationThreshold: config.liquidationThreshold
        });
    }

    function getStakingPosition(address _user, address _stakingPool, address _stakingToken) public view returns (StakingPosition memory) {
        Staking staking = Staking(payable(_stakingPool));
        
        // Get staking pool configuration using the auto-generated getter
        (
            IERC20 stakingToken,
            IERC20 rewardToken,
            uint256 rewardRate,
            uint256 lastUpdateTime,
            uint256 rewardPerTokenStored,
            uint256 totalSupply
        ) = staking.stakingPools(_stakingToken);
        
        return StakingPosition({
            stakingPool: _stakingPool,
            stakingToken: _stakingToken,
            stakedAmount: staking.getStakedBalance(_user, _stakingToken),
            rewardToken: address(rewardToken),
            pendingRewards: staking.earned(_user, _stakingToken),
            rewardRate: rewardRate
        });
    }
    
    // Helper function to get a single AMM position
    function getSingleAMMPosition(address _user, address _ammPair, address _token0, address _token1) 
        external view returns (AMMPosition memory) {
        return getAMMPosition(_user, _ammPair, _token0, _token1);
    }
    
    // Helper function to get a single lending position
    function getSingleLendingPosition(address _user, address _lendingPool, address _collateralToken, address _borrowToken) 
        external view returns (LendingPosition memory) {
        return getLendingPosition(_user, _lendingPool, _collateralToken, _borrowToken);
    }
    
    // Helper function to get a single staking position
    function getSingleStakingPosition(address _user, address _stakingPool, address _stakingToken) 
        external view returns (StakingPosition memory) {
        return getStakingPosition(_user, _stakingPool, _stakingToken);
    }
}