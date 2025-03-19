# Encke protocol

## Project Overview

Encke Protocol is a decentralized application (dApp) designed to bring secure, scalable, and 
interoperable **lending** to the blockchain ecosystem, leveraging the power of the Cosmos network. 

Inspired by the Encke comet, which symbolizes resilience and periodicity, Encke Protocol aims to 
provide a robust platform for users to lend and borrow asset across different chains. 

The live demo of Encke Protocol can be accessed at `encke-protocol.vercel.app`, and the source code
is available as open source (MIT License).

## Key Features

- Lending.
- Borrowing.
- Liquidation
- User-friendly interface.
- Modular design for future scalability and feature integration.

## Technical Architecture

Encke Protocol is built with a modular and layered architecture to ensure scalability, 
maintainability, and interoperability. 

Below is an overview of its technical stack:

### Frontend

- Framework: Next.js (React-based framework for server-side rendering and static site generation).
- Deployment: Hosted on Vercel for fast, reliable deployment and scaling.
- UI/UX: Responsive and intuitive interface for seamless user interaction with blockchain features.

### Backend

#### First iteration:
- Cosmos SDK: Custom-built modules using the Cosmos SDK to handle chain logic, consensus, and state management.
- Inter-Blockchain Communication (IBC): Facilitates cross-chain communication and asset transfers.

#### Second iteration:

- CosmWasm: Smart contract to handle chain logic written in Rust.

### Data Flow

- Users interact with the frontend (e.g., borrowing asset).
- The frontend communicates with the Encke Protocol (smart contract).
- Smart contracts (CosmWasm) execute logic.
- State changes are validated and committed.

## Leveraging Cosmos Technologies
Encke Protocol deeply integrates with Cosmos technologies to harness their strengths in 
interoperability, scalability, and developer flexibility:

1. CosmWasm

- Use Case: Powers the smart contract layer for features like automated governance and DeFi 
primitives (e.g., lending or staking).
Implementation: Contracts are written in Rust and deployed on Neutron, ensuring security and 
performance.

2. Inter-Blockchain Communication (IBC)

- Use Case: Enables secure and trustless asset transfers between Encke Protocol and other 
Cosmos-based chains.

3. Cosmos SDK

- Use Case: Forms the backbone of the Encke Protocol chain, handling custom logic, governance, and 
token management.
- Implementation: Custom modules built with the Cosmos SDK manage the protocol’s state and 
interactions.
- Benefit: Enables rapid development of a sovereign blockchain with built-in interoperability.

4. ATOM (Cosmos Hub Token)

- Use Case: Use bridged ATOM token as collateral. This reduce sell pressure on ATOM.

- Benefit: Ties Encke Protocol to the broader Cosmos Hub economy.

## Future Plans and Roadmap
Encke Protocol is designed with long-term growth in mind. Below is a roadmap outlining our vision:

### Short-Term (Post-Hackathon, Q2 2025)

- **Feature Expansion**: Add support for additional DeFi functionalities, such as decentralized lending and yield farming.
- **Testing and Auditing**: Conduct thorough testing of IBC integrations and CosmWasm contracts, followed by a security audit.
- **Community Governance**: Implement a basic governance module using CosmWasm to allow token holders to propose and vote on protocol upgrades.

### Medium-Term (Q3-Q4 2025)
- **Multi-Chain Support**: Extend IBC compatibility to non-Cosmos chains (e.g., Ethereum, Polkadot) via bridges or adapters.
- **Mobile Interface**: Develop a mobile-friendly version of the frontend for broader accessibility.
- **Token Launch**: Introduce a native Encke token to incentivize users.

### Long-Term (2026 and Beyond)
- **Ecosystem Growth**: Partner with other Cosmos projects to build a thriving DeFi ecosystem around Encke Protocol.
- **Advanced Features**: Explore Account Abstraction Extensions (AEZ) for improved user experience and security.
- **Scalability**: Optimize the chain for high transaction throughput and low fees as adoption grows.

## Getting Started
To explore or contribute to Encke Protocol, follow these steps:

### Clone the Repository:

```bash
git clone https://github.com/cenwadike/Encke-Protocol.git
cd Encke-Protocol
```

### Build contract

```bash
    cd encke-contract
    cargo wasm
```

### Test contract

```bash
    cd encke-contract
    cargo test
```

## Conclusion
Encke Protocol demonstrates the power of Cosmos technologies in building a scalable, 
interoperable, and user-centric blockchain solution. By combining IBC, CosmWasm, and the 
Cosmos SDK, we’ve created a foundation for a future-ready DeFi platform. We’re excited to 
continue developing this project and invite the Naija HackATOM community to collaborate with us!

For more details, visit our GitHub repository or try the live demo at `encke-protocol.vercel.app`.
