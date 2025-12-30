export const config = {
  networks: {
    mainnet: {
      id: "mainnet",
      name: "Mainnet",
      registryUrl:
        process.env.NEXT_PUBLIC_MAINNET_REGISTRY_URL ||
        "https://registry.maikers.com",
    },
    devnet: {
      id: "devnet",
      name: "Devnet",
      registryUrl:
        process.env.NEXT_PUBLIC_DEVNET_REGISTRY_URL ||
        "https://registry-devnet.maikers.com",
    },
  },
  defaultNetwork: "devnet" as const,
} as const;

export type NetworkId = keyof typeof config.networks;
