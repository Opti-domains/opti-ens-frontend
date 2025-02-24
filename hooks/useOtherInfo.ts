"use client";

import { decodeFunctionResult, encodeFunctionData, hexToString } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { multicallABI } from "@/lib/abi/multical";

export function useOtherInfo(
  activeTab: string,
  label: string,
  resolverAddress: `0x${string}`
) {
  const [dataDecoded, setDataDecoded] = useState({
    contenthash: "",
    display: "",
    description: "",
    avatar: "",
    email: "",
    url: "",
  });
  const [callOther, setCallOther] = useState<`0x${string}`[]>([]);

  useEffect(() => {
    if (activeTab !== "general") {
      setCallOther([]);
      return;
    }

    setCallOther([
      encodeFunctionData({
        abi: resolverABI,
        functionName: "contenthash",
        args: [dnsEncode(label)],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), "display"],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), "description"],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), "avatar"],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), "email"],
      }),
      encodeFunctionData({
        abi: resolverABI,
        functionName: "text",
        args: [dnsEncode(label), "url"],
      }),
    ]);
  }, [activeTab, label]);

  const { data, isSuccess, refetch } = useReadContract({
    address: resolverAddress,
    abi: multicallABI,
    functionName: "multicall",
    args: [callOther],
    query: { enabled: callOther.length > 0 },
  });

  useEffect(() => {
    if (isSuccess && data) {
      const results = data as `0x${string}`[];
      if (results.length >= 6) {
        const hexContentHash = decodeFunctionResult({
          abi: resolverABI,
          functionName: "contenthash",
          data: results[0],
        }) as `0x${string}`;
        const contentHash = hexToString(hexContentHash);

        const display = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[1],
        }) as `0x${string}`;

        const description = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[2],
        }) as `0x${string}`;

        const avatar = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[3],
        }) as `0x${string}`;

        const email = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[4],
        }) as `0x${string}`;

        const url = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[5],
        }) as `0x${string}`;

        setDataDecoded({
          contenthash: contentHash,
          display: hexToString(display),
          description: hexToString(description),
          avatar: hexToString(avatar),
          email: hexToString(email),
          url: hexToString(url),
        });
      }
    }
  }, [isSuccess, data]);

  return { dataDecoded, isUpdate: isSuccess, refetchOther: refetch };
}
