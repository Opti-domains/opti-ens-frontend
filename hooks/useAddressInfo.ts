"use client";

import {decodeFunctionResult, encodeFunctionData, hexToString} from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import {multicallABI} from "@/lib/abi/multical";

export const initialAddress = [
  { icon: "ETH", coinType: 60, address: "" },
  { icon: "BTC", coinType: 0, address: "" },
  { icon: "SOL", coinType: 501, address: "" },
];

export function useAddressInfo(label: string, resolverAddress: `0x${string}`) {
  // Local state to store final decoded text data
  const [addressDecoded, setAddressDecoded] = useState(initialAddress);

  // Build the array of calls for multicall
  const [callAddr, setCallAddr] = useState<`0x${string}`[]>([]);

  useEffect(() => {
    // For each record label, encode resolver's text(...) call
    const calls = initialAddress.map((record) =>
      encodeFunctionData({
        abi: resolverABI,
        functionName: "addr",
        args: [dnsEncode(label), BigInt(record.coinType)],
      })
    );
    setCallAddr(calls);
  }, [label]);

  const { data, isSuccess, refetch } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: "multicall",
    args: [callAddr],
    query: { enabled: callAddr.length > 0 }, // only run if we have calls
  });

  // Once we get 'data', decode each text result and update local state
  useEffect(() => {
    if (isSuccess && data) {
      const results = data as `0x${string}`[];
      if (results.length === initialAddress.length) {
        const decoded = results.map((res, i) => {
          let address = decodeFunctionResult({
            abi: resolverABI,
            functionName: "addr",
            args: [dnsEncode(label), BigInt(initialAddress[i].coinType)],
            data: res,
          }) as string;

          if (initialAddress[i].coinType !== 60) {
            address = hexToString(address as `0x${string}`);
          }

          return {
            icon: initialAddress[i].icon,
            coinType: initialAddress[i].coinType,
            address: address,
          };
        });
        setAddressDecoded(decoded);
      }
    }
  }, [isSuccess, data]);

  return {
    addressDecoded: addressDecoded, // your array of { label, value }
    isUpdate: isSuccess,
    refetchAddress: refetch,
  };
}