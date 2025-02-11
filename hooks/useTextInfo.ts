"use client";

import {decodeFunctionResult, encodeFunctionData} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {useReadContract} from "wagmi";
import {useEffect, useRef} from "react";
import {multicallABI} from "@/lib/abi/multical";
import {initialRecords} from "@/components/manage-dialog";

export function useTextInfo(activeTab: string, label: string, resolverAddress: `0x${string}`) {
  const callTexts = useRef<`0x${string}`[]>([]);

  useEffect(() => {
    if (activeTab !== "text") {
      callTexts.current = [];
      return;
    }
    console.log("initialRecords--", initialRecords.length);
    initialRecords.forEach((record) => {
      callTexts.current.push(encodeFunctionData({
        abi: resolverABI,
        functionName: 'text',
        args: [dnsEncode(label), record.label],
      }));
    });
  }, [activeTab]);

  console.log("callTexts--", callTexts.current);

  // Fetch data using Multicall
  const { data, isSuccess } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: 'multicall',
    args: [callTexts.current],
    query: {
      enabled: callTexts.current.length > 0,
    }
  });

  let dataDecoded: string[] = [];
  if (isSuccess && data) {
    const results = data as `0x${string}`[];
    dataDecoded = results.map((result) =>
      decodeFunctionResult({
        abi: resolverABI,
        functionName: 'text',
        data: result,
      })
    ) as string[];
  }
  console.log("dataDecoded--", dataDecoded);
  const textDecoded = initialRecords.map((record, i) => {
    return { label: record.label, value: dataDecoded[i] };
  });

  return { textDecoded, isUpdate: textDecoded.length > 0 };
}