# Opti.Domains ENS L2 on Optimism

User interface for migrating ENS records from L1 to L2 on Superchain.

## Install Dependencies

```bash
pnpm install
```

## Environment Setup

First, copy the `.env.example` file to `.env` and set the following environment variables:

- `NEXT_PUBLIC_PROJECT_ID`: Your WalletConnect project ID for wallet connections
- `NEXT_PUBLIC_BACKEND_URL`: URL for the backend API service (e.g., https://ens-backend-sepolia.opti.domains/api)
- `NEXT_PUBLIC_REGISTRY_ADDRESS`: The ENS registry contract address on Optimism
- `NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS`: The parent domain contract address
- `NEXT_PUBLIC_L1_RESOLVER_ADDRESS`: The L1 superchain CCIP resolver contract address
- `NEXT_PUBLIC_NAME_WRAPPER_ADDRESS`: The name wrapper contract address (See https://docs.ens.domains/wrapper/contracts)
- `SECRET_SUBGRAPH_URL`: URL for The Graph API to query ENS data (See https://docs.ens.domains/web/subgraph)
- `NEXT_PUBLIC_TESTNET`: Set to "true" when using testnet environments

## Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
