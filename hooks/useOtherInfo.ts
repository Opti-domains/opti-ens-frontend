"use client";

import {decodeFunctionResult, encodeFunctionData, hexToString} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {useReadContract} from "wagmi";
import {useEffect, useState} from "react";
import {multicallABI} from "@/lib/abi/multical";

export function useOtherInfo(label: string|undefined, resolverAddress: `0x${string}`) {
  const [calls, setCalls] = useState<`0x${string}`[]>([]);

  useEffect(() => {
    if (!label) return;
    setCalls([
      encodeFunctionData({
        abi: resolverABI,
        functionName: 'contenthash',
        args: [dnsEncode(label)],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: 'getData',
        args: [dnsEncode(label), "abi"],
      }),
    ]);
  }, [label]);

  // Fetch data using Multicall
  const { data, isLoading, isSuccess } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: 'multicall',
    args: [calls],
    query: {
      enabled: calls.length > 0,
    }
  });

  // Decode results
  let decodedResults: `0x${string}`[] = [];
  if (isSuccess && data) {
    const results = data as `0x${string}`[];
    decodedResults = results.map((result, i) =>
      decodeFunctionResult({
        abi: resolverABI,
        functionName: i === 0 ? 'contenthash' : 'getData',
        data: result,
      })
    ) as `0x${string}`[];
  }

  const dataDecoded = decodedResults.map((result) => {
    return hexToString(result);
  });

  return { dataDecoded, isLoading };
}