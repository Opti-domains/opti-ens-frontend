"use client";

import { decodeFunctionResult, encodeFunctionData } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { multicallABI } from "@/lib/abi/multical";
import { dnsEncode } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useState, useEffect } from "react";

export const initialSocials = [
  { label: "Twitter", key: "com.twitter", value: "" },
  { label: "Github", key: "com.github", value: "" },
  { label: "Telegram", key: "org.telegram", value: "" },
  { label: "Discord", key: "com.discord", value: "" },
  { label: "Farcaster", key: "xyz.farcaster", value: "" },
];

export function useTextInfo(
  label: string,
  resolverAddress: `0x${string}`
) {
  // Local state to store final decoded text data
  const [textDecoded, setTextDecoded] = useState(initialSocials);

  // Build the array of calls for multicall
  const [callTexts, setCallTexts] = useState<`0x${string}`[]>([]);

  useEffect(() => {
    // For each record label, encode resolver's text(...) call
    const calls = initialSocials.map((record) =>
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), record.key],
      })
    );
    setCallTexts(calls);
  }, [label]);

  // Perform the multicall on the array of "text(...)" calls
  const { data, isSuccess, refetch } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: "multicall",
    args: [callTexts],
    query: { enabled: callTexts.length > 0 }, // only run if we have calls
  });

  // Once we get 'data', decode each text result and update local state
  useEffect(() => {
    if (isSuccess && data) {
      const results = data as `0x${string}`[];
      if (results.length === initialSocials.length) {
        const decoded = results.map((res, i) => {
          const value = decodeFunctionResult({
            abi: resolverABI,
            functionName: "text",
            data: res,
          }) as string;

          return {
            label: initialSocials[i].label,
            key: initialSocials[i].key,
            value: value !== "" ? value : initialSocials[i].value,
          };
        });
        setTextDecoded(decoded);
      }
    }
  }, [isSuccess, data]);

  return {
    textDecoded, // your array of { label, value }
    isUpdate: isSuccess,
    refetchText: refetch,
  };
}
