<div align="center">
  <br>
  <img src="assets/CAMBRIAN_DESIGN_4-52 (2).jpg">
  <br>
</div>

<h4 align="center">The Complete Development Toolkit for Building AI AGENTS on <a href="https://www.sei.io/" target="_blank">SEI</a> </h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-supported-protocols">Protocols</a> •
  <a href="#-quickstart">Quickstart</a> •
  <a href="#-links">Links</a>
</p>

<hr>

## 🪲 Introduction

**Cambrian Agent Kit** is a comprehensive SDK designed to simplify the development of AI Agents on the SEI blockchain. It provides a unified interface for interacting with various DeFi protocols, token standards, and AI services, allowing developers to build powerful blockchain agents with minimal code.

This toolkit bridges the gap between AI and blockchain interaction, enabling the creation of autonomous agents and agentic chatbots that can perform operations on the SEI network.

## ✨ Features

- **Token Operations**: Complete SEI ERC-20 and ERC-721 token management
- **DeFi Protocol Integration**: Seamless interaction with SEI's DeFi ecosystem
- **Swap Functionality**: Token swapping through Symphony aggregator
- **Lending & Borrowing**: Interact with Takara protocol for lending operations
- **Staking Operations**: Stake and unstake SEI tokens with Silo
- **Perpetual Trading**: Trade perpetual contracts on Citrex protocol
- **LangChain Integration**: Build AI agents with LangChain and LangGraph

## 📋 Supported Protocols

The Cambrian Agent Kit integrates with a variety of protocols and services:

### DeFi Protocols
- **Symphony**: Token swapping and routing
- **Takara**: Lending and borrowing platform
- **Silo**: Staking and yield farming
- **Citrex**: Perpetual trading platform

### Token Standards
- **SEI ERC-20**: Complete token operations
- **SEI ERC-721**: NFT token management

## 🔧 Quickstart

#### Prerequisites

- Docker and Docker Compose installed and running
- Node.js 18+ (for local development)

#### Configuration

Create a `.env` file with your API keys and configurations:

```bash
cp .env.example .env
```

Required environment variables:
```
OPENAI_API_KEY=your_openai_api_key
SEI_PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://evm-rpc-testnet.sei-apis.com
```

#### Install dependencies

```bash
npm install
```

#### Run the sample agent

```bash
npm run test
```

## 🐳 Docker Setup (Recommended)

For an easier setup with all databases pre-configured, you can use Docker:

#### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd amem-agent
```

2. Create a `.env` file with your configuration:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Build and start all services:
```bash
npm run setup
```

4. View logs:
```bash
npm run docker:logs
```

5. Run the agent:
```bash
docker-compose exec agent-kit npm run test
```

That's it! All databases and services are now running in Docker containers.

#### Docker Management Commands

- `npm run docker:build` - Build all services
- `npm run docker:start` - Start all services in background
- `npm run docker:stop` - Stop all services
- `npm run docker:reset` - Reset all services and data
- `npm run docker:logs` - View logs from all services
- `npm run docker:backup` - Create backups of all databases
- `npm run docker:health` - Run health checks on all services

## 🔗 Links

- [Twitter](https://x.com/cambrian_ai)
- [Website](https://cambrian.wtf)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Check out our [Tool Creation Guide](CreateTool.md) for instructions on how to create and add new tools to the toolkit.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---
