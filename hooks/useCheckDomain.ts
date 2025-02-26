"use client";

import useSWRMutation from "swr/mutation";
import { backendUrl } from "@/hooks/useSignDomain";
import { encodeFunctionData, PublicClient } from "viem";
import { domainAbi } from "@/lib/abi/domain";
import { usePublicClient } from "wagmi";
import { multicallABI } from "@/lib/abi/multical";

/**
 * Type for the payload we send to the API
 */
interface CheckDomainPayload {
  domains: string[];
}

interface CheckDomainPayloadWithClient extends CheckDomainPayload {
  client: PublicClient;
}

/**
 * The fetcher that actually calls the external API endpoint with POST.
 */
async function checkDomainFetcher(
  url: string,
  // `arg` is the second parameter from the SWR trigger function.
  { arg }: { arg: CheckDomainPayloadWithClient }
) {
  // Create an array of encoded function calls for multicall
  const calls = arg.domains.map((label) =>
    encodeFunctionData({
      abi: domainAbi,
      functionName: "subdomains",
      args: [label],
    })
  );

  const results = (await arg.client.readContract({
    address: process.env.NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS as `0x${string}`,
    abi: multicallABI,
    functionName: "multicall",
    args: [calls],
  })) as `0x${string}`[];

  return results.map((result, i) => ({
    label: arg.domains[i],
    status:
      result ==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? "unclaimed"
        : "claimed",
  }));
}

/**
 * A custom hook that calls the external endpoint (e.g. http://localhost:5100/api/domain/sign).
 * You can rename "your-api.com" to your actual domain or endpoint.
 */
export function useCheckDomain() {
  const publicClient = usePublicClient();

  const {
    trigger, // function to manually invoke the mutation
    data, // holds success response data
    error, // holds error object if the request fails
    isMutating, // boolean for loading state
  } = useSWRMutation(backendUrl + "/domain/check", checkDomainFetcher);

  /**
   * Wrap trigger() in a user-friendly function.
   */
  async function checkDomain(payload: CheckDomainPayload) {
    return trigger({ ...payload, client: publicClient as PublicClient });
  }

  return {
    checkDomain, // the function to call from your component
    data,
    error,
    isMutating,
  };
}
