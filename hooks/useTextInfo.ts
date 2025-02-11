"use client";

import { decodeFunctionResult, encodeFunctionData } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useEffect, useRef } from "react";
import { multicallABI } from "@/lib/abi/multical";

const initialRecords = [
  { label: "avatar", value: "" },
  { label: "url", value: "" },
  { label: "twitter", value: "" },
  { label: "github", value: "" },
  { label: "description", value: "" },
];

export function useTextInfo(activeTab: string, label: string, resolverAddress: `0x${string}`) {
  const callTexts = useRef<`0x${string}`[]>([]);

  useEffect(() => {
    if (activeTab !== "text") {
      callTexts.current = [];
      return;
    }

    callTexts.current = initialRecords.map((record) =>
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), record.label],
      })
    );
  }, [activeTab, label]);

  const { data, isSuccess } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: "multicall",
    args: [callTexts.current],
    query: { enabled: callTexts.current.length > 0 },
  });

  const textDecoded = isSuccess && data
    ? (data as `0x${string}`[]).map((result, i) => ({
      label: initialRecords[i].label,
      value: decodeFunctionResult({
        abi: resolverABI,
        functionName: "text",
        data: result,
      }) as string,
    }))
    : initialRecords;

  return { textDecoded, isUpdate: isSuccess };
}