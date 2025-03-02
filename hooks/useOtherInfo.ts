"use client";

import { decodeFunctionResult, encodeFunctionData, hexToString } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { multicallABI } from "@/lib/abi/multical";

export function useOtherInfo(
  label: string,
  resolverAddress: `0x${string}`
) {
  const [profileDecoded, setProfileDecoded] = useState({
    contenthash: "",
    display: "",
    description: "",
    avatar: "",
    email: "",
  });
  const [callOther, setCallOther] = useState<`0x${string}`[]>([]);

  useEffect(() => {
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
    ]);
  }, [label]);

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
      if (results.length >= 5) {
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
        }) as string;

        const description = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[2],
        }) as string;

        const avatar = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[3],
        }) as string;

        const email = decodeFunctionResult({
          abi: resolverABI,
          functionName: "text",
          data: results[4],
        }) as string;

        setProfileDecoded({
          contenthash: contentHash,
          display: display,
          description: description,
          avatar: avatar,
          email: email,
        });
      }
    }
  }, [isSuccess, data]);

  return { profileDecoded, isUpdate: isSuccess, refetchProfile: refetch };
}
