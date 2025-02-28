"use client";

import useSWRMutation from "swr/mutation";
import {PublicClient} from "viem";
import {domainAbi} from "@/lib/abi/domain";
import {usePublicClient} from "wagmi";

/**
 * Type for the payload we send to the API
 */
interface FetchSubNamePayload {
  domainAddr: `0x${string}`;
}

interface FetchSubNamePayloadWithClient extends FetchSubNamePayload {
  client: PublicClient;
}

/**
 * The fetcher that actually calls the external API endpoint with POST.
 */
async function subnameFetcher(
  url: string,
  // `arg` is the second parameter from the SWR trigger function.
  { arg }: { arg: FetchSubNamePayloadWithClient }
) {
  return (await arg.client.readContract({
    address: arg.domainAddr,
    abi: domainAbi,
    functionName: "getSubdomainNames",
    args: [],
  })) as string[];
}

/**
 * A custom hook that calls the external endpoint (e.g. http://localhost:5100/api/domain/sign).
 * You can rename "your-api.com" to your actual domain or endpoint.
 */
export function useFetcherSubNames() {
  const publicClient = usePublicClient();

  const {
    trigger, // function to manually invoke the mutation
    data, // holds success response data
    error, // holds error object if the request fails
    isMutating, // boolean for loading state
  } = useSWRMutation("/subnames/list", subnameFetcher);

  /**
   * Wrap trigger() in a user-friendly function.
   */
  async function fetchSubNames(payload: FetchSubNamePayload) {
    return trigger({ ...payload, client: publicClient as PublicClient });
  }

  return {
    fetchSubNames: fetchSubNames, // the function to call from your component
    data,
    error,
    isMutating,
  };
}
