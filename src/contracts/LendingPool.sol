// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMultiTokenPriceOracle.sol";

contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IMultiTokenPriceOracle public priceOracle;

    struct TokenPairConfig {
        IERC20 collateralToken;
        IERC20 borrowToken;
        uint256 fixedBorrowRatePerSecond; // e.g., 1e10 for ~3% APY
        uint256 collateralizationRatio; // e.g., 150 for 150%
        uint256 liquidationThreshold; // e.g., 120
        uint256 liquidationBonus; // e.g., 5 = 5%
    }

    struct UserPosition {
        uint256 collateralDeposits;
        uint256 borrowBalances;
        uint256 lastAccumulatedInterestTime;
    }

    // Mapping from token pair key to token pair configuration
    mapping(bytes32 => TokenPairConfig) public tokenPairConfigs;
    // Mapping from token pair key to user position
    mapping(bytes32 => mapping(address => UserPosition)) public userPositions;

    event CollateralDeposited(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount);
    event CollateralWithdrawn(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount);
    event Borrowed(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount);
    event Repaid(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, address indexed collateralToken, address borrowToken, uint256 repayAmount, uint256 collateralSeized);
    event TokenPairAdded(address indexed collateralToken, address indexed borrowToken);

    constructor(
        address _oracle
    ) Ownable(msg.sender) {
        priceOracle = IMultiTokenPriceOracle(_oracle);
    }

    function addTokenPair(
        address _collateralToken,
        address _borrowToken,
        uint256 _borrowRate,
        uint256 _collateralRatio,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus
    ) external onlyOwner {
        bytes32 pairKey = keccak256(abi.encode(_collateralToken, _borrowToken));
        require(address(tokenPairConfigs[pairKey].collateralToken) == address(0), "Token pair already exists");

        tokenPairConfigs[pairKey] = TokenPairConfig({
            collateralToken: IERC20(_collateralToken),
            borrowToken: IERC20(_borrowToken),
            fixedBorrowRatePerSecond: (_borrowRate * 1e18) / (365 days * 100),
            collateralizationRatio: _collateralRatio,
            liquidationThreshold: _liquidationThreshold,
            liquidationBonus: _liquidationBonus
        });

        emit TokenPairAdded(_collateralToken, _borrowToken);
    }

    function _getTokenPairKey(address _collateralToken, address _borrowToken) internal pure returns (bytes32) {
        return keccak256(abi.encode(_collateralToken, _borrowToken));
    }

    function getUserPosition(address _user, address _collateralToken, address _borrowToken)
        public
        view
        returns (UserPosition memory)
    {
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][_user];
        return UserPosition({
            collateralDeposits: position.collateralDeposits,
            borrowBalances: position.borrowBalances,
            lastAccumulatedInterestTime: position.lastAccumulatedInterestTime
        });
    }

    function getTokenPairConfig(address _collateralToken, address _borrowToken)
        public
        view
        returns (TokenPairConfig memory)
    {
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        return TokenPairConfig({
            collateralToken: config.collateralToken,
            borrowToken: config.borrowToken,
            fixedBorrowRatePerSecond: config.fixedBorrowRatePerSecond,
            collateralizationRatio: config.collateralizationRatio,
            liquidationThreshold: config.liquidationThreshold,
            liquidationBonus: config.liquidationBonus
        });
    }

    function _getAccountHealthInUSD(address user, address _collateralToken, address _borrowToken)
        internal
        view
        returns (uint256 collateralValueUSD, uint256 borrowValueUSD)
    {
        TokenPairConfig memory config = getTokenPairConfig(_collateralToken, _borrowToken);
        UserPosition memory position = getUserPosition(user, _collateralToken, _borrowToken);

        uint256 collateralPrice = priceOracle.getPrice(_collateralToken);
        uint256 borrowPrice = priceOracle.getPrice(_borrowToken);

        uint256 collateralAmount = position.collateralDeposits;
        uint256 borrowAmount = _getBorrowBalance(user, _collateralToken, _borrowToken);

        // Normalize values to 18 decimals to get their USD-equivalent value
        // Won't work if the token is not of 18 decimals
        collateralValueUSD = (collateralAmount * collateralPrice) / 1e18;
        borrowValueUSD = (borrowAmount * borrowPrice) / 1e18;
    }

    function _getBorrowBalance(address _user, address _collateralToken, address _borrowToken) public view returns (uint256) {
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][_user];
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        uint256 balance = position.borrowBalances;
        if (position.lastAccumulatedInterestTime > 0) {
            uint256 timeElapsed = block.timestamp - position.lastAccumulatedInterestTime;
            uint256 interest = (balance * config.fixedBorrowRatePerSecond * timeElapsed) / 1e18;
            return balance + interest;
        }
        return balance;
    }

    function _accumulateInterest(address _user, address _collateralToken, address _borrowToken) internal {
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][_user];
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        if (position.lastAccumulatedInterestTime > 0) {
            uint256 timeElapsed = block.timestamp - position.lastAccumulatedInterestTime;
            uint256 interest = (position.borrowBalances * config.fixedBorrowRatePerSecond * timeElapsed) / 1e18;
            position.borrowBalances += interest;
        }
        position.lastAccumulatedInterestTime = block.timestamp;
    }

    function depositCollateral(address _collateralToken, address _borrowToken, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero deposit");
        
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        require(address(tokenPairConfigs[pairKey].collateralToken) != address(0), "Token pair not supported");
        
        userPositions[pairKey][msg.sender].collateralDeposits += _amount;
        tokenPairConfigs[pairKey].collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(msg.sender, _collateralToken, _borrowToken, _amount);
    }

    function withdrawCollateral(address _collateralToken, address _borrowToken, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero withdraw");
        
        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][msg.sender];
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        require(position.collateralDeposits >= _amount, "Insufficient collateral");
        _accumulateInterest(msg.sender, _collateralToken, _borrowToken);

        // Get the current total value of the user's debt in USD.
        (, uint256 borrowValueUSD) = _getAccountHealthInUSD(msg.sender, _collateralToken, _borrowToken);

        // Calculate the NEW value of the collateral *after* the withdrawal.
        uint256 remainingCollateralAmount = position.collateralDeposits - _amount;
        uint256 newCollateralValueUSD = (remainingCollateralAmount * priceOracle.getPrice(_collateralToken)) / 1e18;

        // Calculate the maximum allowed debt value with this new, lower collateral value.
        uint256 maxBorrowValueUSD = (newCollateralValueUSD * 100) / config.collateralizationRatio;

        require(borrowValueUSD <= maxBorrowValueUSD, "Withdrawal would undercollateralize");

        position.collateralDeposits -= _amount;
        config.collateralToken.safeTransfer(msg.sender, _amount);
        emit CollateralWithdrawn(msg.sender, _collateralToken, _borrowToken, _amount);
    }

    function borrow(address _collateralToken, address _borrowToken, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero borrow amount");
        _accumulateInterest(msg.sender, _collateralToken, _borrowToken);

        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        (uint256 collateralValueUSD, uint256 borrowValueUSD) = _getAccountHealthInUSD(msg.sender, _collateralToken, _borrowToken);

        // Calculate the maximum allowed total debt value in USD.
        uint256 maxBorrowValueUSD = (collateralValueUSD * 100) / config.collateralizationRatio;

        // Calculate the USD value of the NEW amount being borrowed.
        uint256 newBorrowValueUSD = (_amount * priceOracle.getPrice(_borrowToken)) / 1e18;

        require(borrowValueUSD + newBorrowValueUSD <= maxBorrowValueUSD, "Borrow would exceed collateral limit");

        userPositions[pairKey][msg.sender].borrowBalances += _amount;
        config.borrowToken.safeTransfer(msg.sender, _amount);
        emit Borrowed(msg.sender, _collateralToken, _borrowToken, _amount);
    }

    function repay(address _collateralToken, address _borrowToken, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Zero repay amount");
        _accumulateInterest(msg.sender, _collateralToken, _borrowToken);

        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][msg.sender];
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        uint256 owed = _getBorrowBalance(msg.sender, _collateralToken, _borrowToken);
        uint256 repayAmount = _amount > owed ? owed : _amount;

        position.borrowBalances -= repayAmount;
        config.borrowToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        emit Repaid(msg.sender, _collateralToken, _borrowToken, repayAmount);
    }

    // The definitively correct liquidate function for LendingPool.sol
    function liquidate(address user, address _collateralToken, address _borrowToken, uint256 repayAmount) external nonReentrant {
        require(repayAmount > 0, "Zero repay amount");
        
        // Step 1: Update user's debt with the latest interest.
        _accumulateInterest(user, _collateralToken, _borrowToken);

        bytes32 pairKey = _getTokenPairKey(_collateralToken, _borrowToken);
        UserPosition storage position = userPositions[pairKey][user];
        TokenPairConfig storage config = tokenPairConfigs[pairKey];
        
        // Step 2: Read current state into memory to ensure consistency.
        uint256 currentDebtAmount = _getBorrowBalance(user, _collateralToken, _borrowToken);
        uint256 currentCollateralAmount = position.collateralDeposits;
        require(currentDebtAmount > 0, "User has no debt");

        // Step 3: Fetch current USD prices for both assets.
        uint256 collateralPriceUSD = priceOracle.getPrice(_collateralToken);
        uint256 borrowPriceUSD = priceOracle.getPrice(_borrowToken);
        require(collateralPriceUSD > 0, "Collateral price cannot be zero");

        // Step 4: Calculate total values in USD.
        uint256 collateralValueUSD = (currentCollateralAmount * collateralPriceUSD) / 1e18;
        uint256 borrowValueUSD = (currentDebtAmount * borrowPriceUSD) / 1e18;

        // Step 5: Check if the position is liquidatable.
        // Health Factor = (Collateral Value) / (Borrow Value)
        require(borrowValueUSD > 0, "Cannot liquidate zero debt");
        uint256 healthFactor = (collateralValueUSD * 1e18) / borrowValueUSD;
        uint256 scaledLiquidationThreshold = (config.liquidationThreshold * 1e18) / 100;
        require(healthFactor < scaledLiquidationThreshold, "Position healthy");

        // Step 6: Determine the actual amount of debt to be repaid.
        uint256 actualRepayAmount = repayAmount > currentDebtAmount ? currentDebtAmount : repayAmount;

        // Step 7: Calculate the value of collateral to seize.
        // This is the core logic: find the USD value of the repaid debt, add the bonus,
        // then convert that final USD value back into an *amount* of collateral tokens.
        uint256 repayValueUSD = (actualRepayAmount * borrowPriceUSD) / 1e18;
        uint256 seizeValueUSD = (repayValueUSD * (100 + config.liquidationBonus)) / 100;
        uint256 collateralToSeizeAmount = (seizeValueUSD * 1e18) / collateralPriceUSD;

        require(currentCollateralAmount >= collateralToSeizeAmount, "Not enough collateral for seizure");

        // Step 8: Update state and transfer funds.
        position.borrowBalances -= actualRepayAmount;
        position.collateralDeposits -= collateralToSeizeAmount;

        config.borrowToken.safeTransferFrom(msg.sender, address(this), actualRepayAmount);
        config.collateralToken.safeTransfer(msg.sender, collateralToSeizeAmount);

        emit Liquidated(user, msg.sender, _collateralToken, _borrowToken, actualRepayAmount, collateralToSeizeAmount);
    }
}