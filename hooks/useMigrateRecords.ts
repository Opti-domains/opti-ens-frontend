"use client";

import { ethChain, optimismChain } from "@/config";
import { multicallABI } from "@/lib/abi/multical";
import { l1ResolverABI } from "@/lib/abi/l1resolver";
import { dnsEncode } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decodeFunctionResult,
  encodeFunctionData,
  hexToString,
  namehash,
  createPublicClient,
  http,
  toHex,
} from "viem";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { resolverABI } from "@/lib/abi/resolver";

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

  // Create a viem public client for L1 with CCIP-Read support
  const l1PublicClient = useMemo(
    () =>
      createPublicClient({
        chain: ethChain,
        transport: http(),
        batch: {
          multicall: true,
        },
      }),
    [ethChain.id]
  );

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
    if (!l1ResolverAddress || !l1PublicClient) return;

    setIsFetching(true);
    setError(null);

    try {
      const nodeHash = namehash(domain);

      // Fetch text records
      const textPromises = initialSocials.map((record) =>
        l1PublicClient.readContract({
          address: l1ResolverAddress,
          abi: l1ResolverABI,
          functionName: "text",
          args: [nodeHash, record.key],
        })
      );

      // Fetch address records
      const addressPromises = initialAddresses.map((record) =>
        l1PublicClient.readContract({
          address: l1ResolverAddress,
          abi: l1ResolverABI,
          functionName: "addr",
          args: [nodeHash, BigInt(record.coinType)],
        })
      );

      // Fetch profile records
      const contentHashPromise = l1PublicClient.readContract({
        address: l1ResolverAddress,
        abi: l1ResolverABI,
        functionName: "contenthash",
        args: [nodeHash],
      });

      const displayPromise = l1PublicClient.readContract({
        address: l1ResolverAddress,
        abi: l1ResolverABI,
        functionName: "text",
        args: [nodeHash, "display"],
      });

      const descriptionPromise = l1PublicClient.readContract({
        address: l1ResolverAddress,
        abi: l1ResolverABI,
        functionName: "text",
        args: [nodeHash, "description"],
      });

      const avatarPromise = l1PublicClient.readContract({
        address: l1ResolverAddress,
        abi: l1ResolverABI,
        functionName: "text",
        args: [nodeHash, "avatar"],
      });

      const emailPromise = l1PublicClient.readContract({
        address: l1ResolverAddress,
        abi: l1ResolverABI,
        functionName: "text",
        args: [nodeHash, "email"],
      });

      // Wait for all promises to resolve
      const [
        textResults,
        addressResults,
        contentHashResult,
        displayResult,
        descriptionResult,
        avatarResult,
        emailResult,
      ] = await Promise.all([
        Promise.all(textPromises),
        Promise.all(addressPromises),
        contentHashPromise,
        displayPromise,
        descriptionPromise,
        avatarPromise,
        emailPromise,
      ]);

      // console.log([
      //   textResults,
      //   addressResults,
      //   contentHashResult,
      //   displayResult,
      //   descriptionResult,
      //   avatarResult,
      //   emailResult,
      // ]);

      // Process text records
      const decodedTexts = textResults.map((result, i) => {
        return {
          label: initialSocials[i].label,
          key: initialSocials[i].key,
          value: (result as string) || "",
        };
      });
      setTextRecords(decodedTexts);

      // Process address records
      const decodedAddresses = addressResults.map((result, i) => {
        let address = result as string;

        if (initialAddresses[i].coinType !== 60 && address) {
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
      const hexContentHash = contentHashResult as `0x${string}`;
      const contentHash = hexContentHash ? hexToString(hexContentHash) : "";

      const display = (displayResult as string) || "";
      const description = (descriptionResult as string) || "";
      const avatar = (avatarResult as string) || "";
      const email = (emailResult as string) || "";

      setProfileRecords({
        contenthash: contentHash,
        display,
        description,
        avatar,
        email,
      });
    } catch (err) {
      console.log("Error fetching records", err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsFetching(false);
    }
  }, [l1PublicClient, l1ResolverAddress, domain]);

  // Migrate records to L2
  const migrateRecords = useCallback(async () => {
    if (!l1ResolverAddress || !l2PublicClient) return;

    setIsMigrating(true);
    setError(null);

    try {
      const l2ResolverAddress = (await l2PublicClient.readContract({
        address: process.env.NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "resolver",
            inputs: [],
            outputs: [
              {
                name: "",
                type: "address",
                internalType: "address",
              },
            ],
            stateMutability: "view",
          },
        ],
        functionName: "resolver",
        args: [],
      })) as `0x${string}`;
      const nodeHash = dnsEncode(domain);

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
              record.coinType === 60
                ? (record.address as `0x${string}`)
                : toHex(record.address),
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
      console.log("Error migrating records", err);
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
  }, [l1ResolverAddress, domain, fetchRecords]);

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
