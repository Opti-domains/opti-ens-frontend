"use client";

import {decodeFunctionResult, encodeFunctionData, hexToString} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {useReadContract} from "wagmi";
import {useEffect, useRef} from "react";
import {multicallABI} from "@/lib/abi/multical";

export function useOtherInfo(activeTab: string, label: string|undefined, resolverAddress: `0x${string}`) {
  const calls = useRef<`0x${string}`[]>([]);

  useEffect(() => {
    if (!label) return;
    if (activeTab !== "other") {
      calls.current = [];
      return;
    }
    calls.current = ([
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
  }, [label, activeTab]);

  // Fetch data using Multicall
  const { data, isSuccess } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: 'multicall',
    args: [calls.current],
    query: {
      enabled: calls.current.length > 0,
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

  return { dataDecoded, isUpdate: dataDecoded.length > 0 };
}