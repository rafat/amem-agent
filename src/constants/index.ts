import { IToken } from "../types";

export const SEI_RPC_URL = "https://evm-rpc-testnet.sei-apis.com";
export const MAX_BLOCK_AGE = 2000; // past this many blocks, the SDK won't attempt to catch up by processing events and instead call the contracts for strategy info.

export const TOKENS: { [key: `0x${string}`]: IToken } = {
  "0x0": {
    id: "sei_native_sei",
    attributes: {
      address: "0x0",
      name: "sei",
      symbol: "sei",
      decimals: 18,
      initialSupply: "",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/Sei.png",
    },
  },
  // Testnet tokens
  "0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64": {
    id: "sei_0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64",
    attributes: {
      address: "0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64",
      name: "testnet meth",
      symbol: "METH",
      decimals: 18,
      initialSupply: "1000000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/METH.png",
    },
  },
  "0xFF3260a3aab725b4BbBf9A94A57A5718196E5a73": {
    id: "sei_0xFF3260a3aab725b4BbBf9A94A57A5718196E5a73",
    attributes: {
      address: "0xFF3260a3aab725b4BbBf9A94A57A5718196E5a73",
      name: "testnet mbtc",
      symbol: "MBTC",
      decimals: 8,
      initialSupply: "1000000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/MBTC.png",
    },
  },
  "0x0fD55d06B382C72d8b95f5Bf9Ae1682D079B79bB": {
    id: "sei_0x0fD55d06B382C72d8b95f5Bf9Ae1682D079B79bB",
    attributes: {
      address: "0x0fD55d06B382C72d8b95f5Bf9Ae1682D079B79bB",
      name: "testnet usdt",
      symbol: "USDT",
      decimals: 6,
      initialSupply: "1000000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/USDT.png",
    },
  },
} as const;
