"use client";

import { ethChain } from "@/config";
import { useCallback, useState } from "react";
import { namehash } from "viem";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";

// ENS Registry ABI for resolver function
const ensRegistryABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "resolver",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

// Resolver ABI for setResolver function
const resolverABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "address", name: "resolver", type: "address" },
    ],
    name: "setResolver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// NameWrapper ABI for setResolver function
const nameWrapperABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "address", name: "resolver", type: "address" },
    ],
    name: "setResolver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const NAME_WRAPPER_ADDRESS = process.env
  .NEXT_PUBLIC_NAME_WRAPPER_ADDRESS as `0x${string}`;

/**
 * A custom hook that checks if a domain's L1 resolver is set correctly
 * and provides a function to set it to the correct address
 */
export function useMigrateDomain(domain: string) {
  const publicClient = usePublicClient({ chainId: ethChain.id });
  const [error, setError] = useState<Error | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Read the resolver for a domain from the ENS Registry
  const {
    data: resolverData,
    isFetching,
    refetch,
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ensRegistryABI,
    functionName: "resolver",
    args: [namehash(domain)],
    chainId: ethChain.id,
  });

  // Read the owner of the domain from the ENS Registry
  const { data: ownerData } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ensRegistryABI,
    functionName: "owner",
    args: [namehash(domain)],
    chainId: ethChain.id,
  });

  // Check if the resolver is set to the correct address
  const isResolverCorrect =
    resolverData === process.env.NEXT_PUBLIC_L1_RESOLVER_ADDRESS;

  // Check if the domain is owned by the NameWrapper
  const isNameWrapped = ownerData === NAME_WRAPPER_ADDRESS;

  /**
   * Set the L1 resolver to the correct address
   */
  const setL1Resolver = useCallback(async () => {
    setIsMigrating(true);
    setError(null);

    try {
      const nodeHash = namehash(domain);
      const resolverAddress = process.env
        .NEXT_PUBLIC_L1_RESOLVER_ADDRESS as `0x${string}`;
      let hash;

      if (isNameWrapped) {
        // If domain is owned by NameWrapper, call setResolver on NameWrapper
        hash = await writeContractAsync({
          address: NAME_WRAPPER_ADDRESS,
          abi: nameWrapperABI,
          functionName: "setResolver",
          args: [nodeHash, resolverAddress],
          chainId: ethChain.id,
        });
      } else {
        // If domain is owned by user, call setResolver on Registry
        hash = await writeContractAsync({
          address: REGISTRY_ADDRESS,
          abi: resolverABI,
          functionName: "setResolver",
          args: [nodeHash, resolverAddress],
          chainId: ethChain.id,
        });
      }

      await publicClient?.waitForTransactionReceipt({ hash });

      refetch();

      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsMigrating(false);
    }
  }, [writeContractAsync, publicClient, domain, isNameWrapped]);

  return {
    setL1Resolver,
    isResolverCorrect,
    isFetching,
    resolverData,
    ownerData,
    isNameWrapped,
    refetchResolver: refetch,
    error,
    isMigrating,
  };
}
