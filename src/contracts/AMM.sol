// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AMM is ReentrancyGuard, ERC20 {
    using SafeERC20 for IERC20;

    /* -------------------------------------------------------------------------- */
    /*                               CONSTANTS                                    */
    /* -------------------------------------------------------------------------- */
    address private constant NATIVE = 0x0000000000000000000000000000000000000000;

    /* -------------------------------------------------------------------------- */
    /*                               DATA TYPES                                   */
    /* -------------------------------------------------------------------------- */
    struct Pair {
        uint112 reserve0;
        uint112 reserve1;
        uint256 totalSupply;        // LP shares
    }

    /* -------------------------------------------------------------------------- */
    /*                               STATE                                        */
    /* -------------------------------------------------------------------------- */
    mapping(bytes32 => Pair)            public pairs;
    mapping(bytes32 => mapping(address => uint256)) public lpBalance;

    // Constructor
    constructor() ERC20("AMM LP Token", "AMM-LP") {}

    /* -------------------------------------------------------------------------- */
    /*                               EVENTS                                       */
    /* -------------------------------------------------------------------------- */
    event Swap(
        bytes32 indexed pair,
        address indexed sender,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(bytes32 indexed pair, address indexed provider,
        uint256 amount0, uint256 amount1, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed pair, address indexed provider,
        uint256 amount0, uint256 amount1, uint256 liquidity);

    /* -------------------------------------------------------------------------- */
    /*                        INTERNAL UTILS                                      */
    /* -------------------------------------------------------------------------- */
    function _sortTokens(address a, address b)
        private pure returns (address token0, address token1)
    {
        require(a != b, "Same token");
        (token0, token1) = (a < b) ? (a, b) : (b, a);
    }

    function _pairKey(address a, address b) private pure returns (bytes32) {
        (address token0, address token1) = _sortTokens(a, b);
        return keccak256(abi.encodePacked(token0, token1));
    }

    function _sqrt(uint y) private pure returns (uint z) {
        if (y > 3) {
            z = y; uint x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) { z = 1; }
    }

    /* -------------------------------------------------------------------------- */
    /*                    INTERNAL BALANCE HELPERS                                */
    /* -------------------------------------------------------------------------- */
    function _pull(address token, uint256 amount) private {
        if (token == NATIVE) {
            require(msg.value >= amount, "Insufficient SEI sent");
            // refund dust
            if (msg.value > amount) {
                (bool s,) = payable(msg.sender).call{value: msg.value - amount}("");
                require(s, "Refund failed");
            }
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    function _push(address token, address to, uint256 amount) private {
        if (token == NATIVE) {
            (bool s,) = payable(to).call{value: amount}("");
            require(s, "Native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _balanceOfThis(address token) private view returns (uint256) {
        return token == NATIVE
            ? address(this).balance
            : IERC20(token).balanceOf(address(this));
    }

    /* -------------------------------------------------------------------------- */
    /*                    LIQUIDITY PROVISION                                     */
    /* -------------------------------------------------------------------------- */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external payable nonReentrant returns (uint256 liquidity) {
        bytes32 key = _pairKey(tokenA, tokenB);
        Pair storage p = pairs[key];
        (address token0, address token1) = _sortTokens(tokenA, tokenB);

        (uint256 amount0Desired, uint256 amount1Desired) =
            (tokenA == token0) ? (amountADesired, amountBDesired)
                               : (amountBDesired, amountADesired);

        uint256 _totalSupply = p.totalSupply;
        uint256 amount0;
        uint256 amount1;

        if (_totalSupply == 0) {
            amount0 = amount0Desired;
            amount1 = amount1Desired;
            liquidity = _sqrt(amount0 * amount1);
        } else {
            uint256 amount1Optimal = (amount0Desired * p.reserve1) / p.reserve0;
            if (amount1Optimal <= amount1Desired) {
                require(amount1Optimal >= amountBMin, "B below min");
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
                liquidity = (amount0 * _totalSupply) / p.reserve0;
            } else {
                uint256 amount0Optimal = (amount1Desired * p.reserve0) / p.reserve1;
                require(amount0Optimal >= amountAMin, "A below min");
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
                liquidity = (amount1 * _totalSupply) / p.reserve1;
            }
        }

        // pull tokens
        _pull(token0, amount0);
        _pull(token1, amount1);

        // mint LP shares
        lpBalance[key][to] += liquidity;
        p.totalSupply += liquidity;

        // update reserves
        p.reserve0 = uint112(_balanceOfThis(token0));
        p.reserve1 = uint112(_balanceOfThis(token1));

        emit LiquidityAdded(key, to, amount0, amount1, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 key = _pairKey(tokenA, tokenB);
        Pair storage p = pairs[key];
        require(liquidity > 0, "Zero liquidity");
        require(lpBalance[key][msg.sender] >= liquidity, "Insufficient LP");

        uint256 _totalSupply = p.totalSupply;
        uint256 balance0 = _balanceOfThis(tokenA);
        uint256 balance1 = _balanceOfThis(tokenB);
        (address token0, address token1) = _sortTokens(tokenA, tokenB);

        uint256 amount0 = (liquidity * balance0) / _totalSupply;
        uint256 amount1 = (liquidity * balance1) / _totalSupply;

        (amountA, amountB) = (tokenA == token0) ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin && amountB >= amountBMin, "Slippage");

        lpBalance[key][msg.sender] -= liquidity;
        p.totalSupply -= liquidity;

        _push(token0, to, amount0);
        _push(token1, to, amount1);

        p.reserve0 = uint112(_balanceOfThis(token0));
        p.reserve1 = uint112(_balanceOfThis(token1));

        emit LiquidityRemoved(key, to, amountA, amountB, liquidity);
    }

    /* -------------------------------------------------------------------------- */
    /*                           SWAP                                             */
    /* -------------------------------------------------------------------------- */
    function swap(
        address tokenA,
        address tokenB,
        uint256 amountA
    ) external payable nonReentrant returns (uint256 amountBOut) {
        require(amountA > 0, "Zero amount");
        bytes32 key = _pairKey(tokenA, tokenB);
        Pair storage p = pairs[key];

        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        (uint256 reserveIn, uint256 reserveOut) =
            (tokenA == token0) ? (p.reserve0, p.reserve1)
                               : (p.reserve1, p.reserve0);
        require(reserveIn > 0 && reserveOut > 0, "No liquidity");

        // 0.3 % fee
        uint256 amountInWithFee = amountA * 997;
        amountBOut = (amountInWithFee * reserveOut) /
                     (reserveIn * 1000 + amountInWithFee);
        require(amountBOut > 0, "Insufficient output");

        (address tokenIn, address tokenOut) = (tokenA, tokenB);

        _pull(tokenIn, amountA);
        _push(tokenOut, msg.sender, amountBOut);

        p.reserve0 = uint112(_balanceOfThis(token0));
        p.reserve1 = uint112(_balanceOfThis(token1));

        emit Swap(key, msg.sender, tokenIn, tokenOut, amountA, amountBOut);
    }

    /* -------------------------------------------------------------------------- */
    /*                          VIEW HELPERS                                      */
    /* -------------------------------------------------------------------------- */
    function getReserves(address tokenA, address tokenB)
        external
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        bytes32 key = _pairKey(tokenA, tokenB);
        Pair memory p = pairs[key];
        (address token0, ) = _sortTokens(tokenA, tokenB);
        (reserveA, reserveB) = (tokenA == token0) ? (p.reserve0, p.reserve1)
                                                  : (p.reserve1, p.reserve0);
    }

    function getLPBalance(address user, address tokenA, address tokenB)
        external
        view
        returns (uint256)
    {
        bytes32 key = _pairKey(tokenA, tokenB);
        return lpBalance[key][user];
    }

    function getPairKey(address tokenA, address tokenB)
        external
        pure
        returns (bytes32)
    {
        return _pairKey(tokenA, tokenB);
    }

    // allow contract to receive native SEI
    receive() external payable {}
}