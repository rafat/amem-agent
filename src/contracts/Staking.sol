// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakingPool {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 rewardRate; // Rewards per second
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        uint256 totalSupply;
    }

    // Mapping from staking token address to staking pool
    mapping(address => StakingPool) public stakingPools;

    // Mapping from staking token address to user reward per token paid
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    
    // Mapping from staking token address to user rewards
    mapping(address => mapping(address => uint256)) public rewards;
    
    // Mapping from staking token address to user staked balances
    mapping(address => mapping(address => uint256)) public stakedBalances;

    event Staked(address indexed user, address indexed stakingToken, uint256 amount);
    event Unstaked(address indexed user, address indexed stakingToken, uint256 amount);
    event RewardClaimed(address indexed user, address indexed stakingToken, uint256 amount);
    event RewardRateUpdated(address indexed stakingToken, uint256 newRate);
    event StakingPoolAdded(address indexed stakingToken, address indexed rewardToken);

    constructor() Ownable(msg.sender) {}

    function addStakingPool(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) external onlyOwner {
        require(address(stakingPools[_stakingToken].stakingToken) == address(0), "Staking pool already exists");

        stakingPools[_stakingToken] = StakingPool({
            stakingToken: IERC20(_stakingToken),
            rewardToken: IERC20(_rewardToken),
            rewardRate: _rewardRate,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            totalSupply: 0
        });

        emit StakingPoolAdded(_stakingToken, _rewardToken);
    }

    function _updateReward(address _account, address _stakingToken) internal {
        StakingPool storage pool = stakingPools[_stakingToken];
        pool.rewardPerTokenStored = rewardPerToken(_stakingToken);
        pool.lastUpdateTime = block.timestamp;
        rewards[_stakingToken][_account] = earned(_account, _stakingToken);
        userRewardPerTokenPaid[_stakingToken][_account] = pool.rewardPerTokenStored;
    }

    modifier updateReward(address _account, address _stakingToken) {
        _updateReward(_account, _stakingToken);
        _;
    }

    function earned(address _account, address _stakingToken) public view returns (uint256) {
        StakingPool storage pool = stakingPools[_stakingToken];
        return stakedBalances[_stakingToken][_account] * (rewardPerToken(_stakingToken) - userRewardPerTokenPaid[_stakingToken][_account]) / 1e18 + rewards[_stakingToken][_account];
    }
    
    function rewardPerToken(address _stakingToken) public view returns (uint256) {
        StakingPool storage pool = stakingPools[_stakingToken];
        if (pool.totalSupply == 0) {
            return pool.rewardPerTokenStored;
        }
        return pool.rewardPerTokenStored + (block.timestamp - pool.lastUpdateTime) * pool.rewardRate * 1e18 / pool.totalSupply;
    }

    function stake(address _stakingToken, uint256 _amount) external nonReentrant updateReward(msg.sender, _stakingToken) {
        require(_amount > 0, "Cannot stake 0");
        require(address(stakingPools[_stakingToken].stakingToken) != address(0), "Staking pool not supported");
        
        StakingPool storage pool = stakingPools[_stakingToken];
        pool.totalSupply += _amount;
        stakedBalances[_stakingToken][msg.sender] += _amount;
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _stakingToken, _amount);
    }

    function unstake(address _stakingToken, uint256 _amount) external nonReentrant updateReward(msg.sender, _stakingToken) {
        require(_amount > 0, "Cannot unstake 0");
        require(stakedBalances[_stakingToken][msg.sender] >= _amount, "Insufficient staked balance");
        
        StakingPool storage pool = stakingPools[_stakingToken];
        pool.totalSupply -= _amount;
        stakedBalances[_stakingToken][msg.sender] -= _amount;
        pool.stakingToken.safeTransfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _stakingToken, _amount);
    }

    function claimReward(address _stakingToken) external nonReentrant updateReward(msg.sender, _stakingToken) {
        uint256 reward = rewards[_stakingToken][msg.sender];
        if (reward > 0) {
            rewards[_stakingToken][msg.sender] = 0;
            stakingPools[_stakingToken].rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, _stakingToken, reward);
        }
    }
    
    // Admin function to set reward rate and fund the contract
    function setRewardRate(address _stakingToken, uint256 _newRate) external onlyOwner updateReward(address(0), _stakingToken) {
        StakingPool storage pool = stakingPools[_stakingToken];
        require(address(pool.stakingToken) != address(0), "Staking pool not supported");
        pool.rewardRate = _newRate;
        emit RewardRateUpdated(_stakingToken, _newRate);
    }
    
    // View functions
    function getStakedBalance(address _user, address _stakingToken) external view returns (uint256) {
        return stakedBalances[_stakingToken][_user];
    }
    
    function getReward(address _user, address _stakingToken) external view returns (uint256) {
        return rewards[_stakingToken][_user];
    }
}