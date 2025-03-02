"use client";

import { ethChain, optimismChain } from "@/config";
import { multicallABI } from "@/lib/abi/multical";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import {
  decodeFunctionResult,
  encodeFunctionData,
  hexToString,
  namehash,
} from "viem";
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
];

const REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

// Initial records to fetch
const initialSocials = [
  { label: "Twitter", key: "com.twitter", value: "" },
  { label: "Github", key: "com.github", value: "" },
  { label: "Telegram", key: "org.telegram", value: "" },
  { label: "Discord", key: "com.discord", value: "" },
  { label: "Farcaster", key: "xyz.farcaster", value: "" },
];

const initialAddresses = [
  { icon: "ETH", coinType: 60, address: "" },
  { icon: "BTC", coinType: 0, address: "" },
  { icon: "SOL", coinType: 501, address: "" },
];

const initialProfile = {
  contenthash: "0x",
  display: "",
  description: "",
  avatar: "",
  email: "",
};

/**
 * A custom hook that fetches records from L1 resolver and allows migrating them to L2
 */
export function useMigrateRecords(domain: string) {
  const [isFetching, setIsFetching] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [l1ResolverAddress, setL1ResolverAddress] = useState<
    `0x${string}` | null
  >(null);
  const [textRecords, setTextRecords] = useState(initialSocials);
  const [addressRecords, setAddressRecords] = useState(initialAddresses);
  const [profileRecords, setProfileRecords] = useState(initialProfile);

  const l1PublicClient = usePublicClient({ chainId: ethChain.id });
  const l2PublicClient = usePublicClient({ chainId: optimismChain.id });
  const { writeContractAsync } = useWriteContract();

  // Fetch the resolver address from L1
  const { data: resolverData, refetch: refetchResolver } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ensRegistryABI,
    functionName: "resolver",
    args: [namehash(domain)],
    chainId: ethChain.id,
  });

  useEffect(() => {
    if (resolverData) {
      setL1ResolverAddress(resolverData as `0x${string}`);
    }
  }, [resolverData]);

  // Fetch all records from L1 resolver
  const fetchRecords = useCallback(async () => {
    if (!l1ResolverAddress) return;

    setIsFetching(true);
    setError(null);

    try {
      // Build calls for text records
      const textCalls = initialSocials.map((record) =>
        encodeFunctionData({
          abi: resolverABI,
          functionName: "text",
          args: [dnsEncode(domain), record.key],
        })
      );

      // Build calls for address records
      const addressCalls = initialAddresses.map((record) =>
        encodeFunctionData({
          abi: resolverABI,
          functionName: "addr",
          args: [dnsEncode(domain), BigInt(record.coinType)],
        })
      );

      // Build calls for profile records
      const profileCalls = [
        encodeFunctionData({
          abi: resolverABI,
          functionName: "contenthash",
          args: [dnsEncode(domain)],
        }),
        encodeFunctionData({
          abi: resolverABI,
          functionName: "text",
          args: [dnsEncode(domain), "display"],
        }),
        encodeFunctionData({
          abi: resolverABI,
          functionName: "text",
          args: [dnsEncode(domain), "description"],
        }),
        encodeFunctionData({
          abi: resolverABI,
          functionName: "text",
          args: [dnsEncode(domain), "avatar"],
        }),
        encodeFunctionData({
          abi: resolverABI,
          functionName: "text",
          args: [dnsEncode(domain), "email"],
        }),
      ];

      // Combine all calls
      const allCalls = [...textCalls, ...addressCalls, ...profileCalls];

      // Execute multicall
      const results = (await l1PublicClient?.readContract({
        address: l1ResolverAddress,
        abi: multicallABI,
        functionName: "multicall",
        args: [allCalls],
      })) as `0x${string}`[];

      if (results) {
        // Process text records
        const textResults = results.slice(0, textCalls.length);
        const decodedTexts = textResults.map((res, i) => {
          const value = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: res,
          }) as string;

          return {
            label: initialSocials[i].label,
            key: initialSocials[i].key,
            value: value || "",
          };
        });
        setTextRecords(decodedTexts);

        // Process address records
        const addressResults = results.slice(
          textCalls.length,
          textCalls.length + addressCalls.length
        );
        const decodedAddresses = addressResults.map((res, i) => {
          let address = decodeFunctionResult({
            abi: resolverABI,
            functionName: "addr",
            args: [dnsEncode(domain), BigInt(initialAddresses[i].coinType)],
            data: res,
          }) as string;

          if (initialAddresses[i].coinType !== 60) {
            address = hexToString(address as `0x${string}`);
          }

          return {
            icon: initialAddresses[i].icon,
            coinType: initialAddresses[i].coinType,
            address: address || "",
          };
        });
        setAddressRecords(decodedAddresses);

        // Process profile records
        const profileResults = results.slice(
          textCalls.length + addressCalls.length
        );

        if (profileResults.length >= 5) {
          const hexContentHash = decodeFunctionResult({
            abi: resolverABI,
            functionName: "contenthash",
            data: profileResults[0],
          }) as `0x${string}`;
          const contentHash = hexToString(hexContentHash);

          const display = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: profileResults[1],
          }) as string;

          const description = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: profileResults[2],
          }) as string;

          const avatar = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: profileResults[3],
          }) as string;

          const email = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: profileResults[4],
          }) as string;

          setProfileRecords({
            contenthash: contentHash || "",
            display: display || "",
            description: description || "",
            avatar: avatar || "",
            email: email || "",
          });
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsFetching(false);
    }
  }, [l1PublicClient, l1ResolverAddress, domain]);

  // Migrate records to L2
  const migrateRecords = useCallback(async () => {
    if (!l1ResolverAddress) return;

    setIsMigrating(true);
    setError(null);

    try {
      const l2ResolverAddress = process.env
        .NEXT_PUBLIC_L1_RESOLVER_ADDRESS as `0x${string}`;
      const nodeHash = namehash(domain);

      // Build calls to set text records
      const textCalls = textRecords
        .filter((record) => record.value && record.value !== "https://")
        .map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [nodeHash, record.key, record.value],
          })
        );

      // Build calls to set address records
      const addressCalls = addressRecords
        .filter((record) => record.address && record.address !== "")
        .map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setAddr",
            args: [
              nodeHash,
              BigInt(record.coinType),
              record.address as `0x${string}`,
            ],
          })
        );

      // Build calls to set profile records
      const profileCalls = [];

      if (profileRecords.contenthash) {
        profileCalls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setContenthash",
            args: [nodeHash, profileRecords.contenthash as `0x${string}`],
          })
        );
      }

      if (profileRecords.display) {
        profileCalls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [nodeHash, "display", profileRecords.display],
          })
        );
      }

      if (profileRecords.description) {
        profileCalls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [nodeHash, "description", profileRecords.description],
          })
        );
      }

      if (profileRecords.avatar) {
        profileCalls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [nodeHash, "avatar", profileRecords.avatar],
          })
        );
      }

      if (profileRecords.email) {
        profileCalls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [nodeHash, "email", profileRecords.email],
          })
        );
      }

      // Combine all calls
      const allCalls = [...textCalls, ...addressCalls, ...profileCalls];

      if (allCalls.length > 0) {
        // Execute multicall to set all records at once
        const hash = await writeContractAsync({
          address: l2ResolverAddress,
          abi: multicallABI,
          functionName: "multicall",
          args: [allCalls],
          chainId: optimismChain.id,
        });

        await l2PublicClient?.waitForTransactionReceipt({ hash });
        return hash;
      }

      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsMigrating(false);
    }
  }, [
    l1ResolverAddress,
    domain,
    textRecords,
    addressRecords,
    profileRecords,
    writeContractAsync,
    l2PublicClient,
  ]);

  // Fetch records when resolver address is available
  useEffect(() => {
    if (l1ResolverAddress) {
      fetchRecords();
    }
  }, [l1ResolverAddress, fetchRecords]);

  return {
    l1ResolverAddress,
    textRecords,
    addressRecords,
    profileRecords,
    isFetching,
    isMigrating,
    error,
    fetchRecords,
    migrateRecords,
    refetchResolver,
  };
}
