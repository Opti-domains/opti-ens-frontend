import {useEffect, useRef} from "react";
import {useReadContract} from "wagmi";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";

export function useAddressInfo(activeTab: string, label: string|undefined, resolverAddress: `0x${string}`) {
  const args= useRef<`0x${string}`>("0x");

  useEffect(() => {
    if (!label) return;
    if (activeTab !== "address") {
      args.current = "0x";
      return;
    }
    args.current = dnsEncode(label);
  }, [label, activeTab]);

  const { data, isSuccess } = useReadContract({
    address: resolverAddress,
    abi: resolverABI,
    functionName: 'addr',
    args: [args.current],
    query: {
      enabled: args.current !== "0x",
    }
  });
  const addr = data?.toString() || "0x";

  return { addr, hasAddr: isSuccess&& addr !== "0x" };
}