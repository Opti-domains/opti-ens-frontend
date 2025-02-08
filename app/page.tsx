"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

import { DomainList } from "@/components/domain-list";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckDomain } from "@/hooks/useCheckDomain";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { checkDomain } = useCheckDomain();
  const [ensDomains, setEnsDomains] = useState<
    {
      name: string;
      owner: `0x${string}`;
      expiration?: string;
      action?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      // const res = await fetch(`/api/ens?owner=${address?.toLowerCase()}`)
      const res = await fetch(
        `/api/ens?owner=${"0xFc43582532E90Fa8726FE9cdb5FAd48f4e487d27".toLowerCase()}`
      );
      const data = await res.json();

      const fetchedDomains = data.domains || [];

      // Convert the data to the shape needed by DomainList
      const labels: string[] = [];
      const mapped = fetchedDomains.map(
        (d: { expiryDate: string; name: string }) => {
          // The subgraph's expiryDate is a Unix timestamp in *seconds*
          let expiration = "--";
          if (d.expiryDate) {
            const expirySec = parseInt(d.expiryDate, 10) * 1000;
            expiration = new Date(expirySec).toISOString().split("T")[0];
          }
          labels.push(d.name.split(".")[0]);

          return {
            name: d.name,
            owner: address,
            expiration,
            action: "Claim",
          };
        }
      );
      const listDomain = await checkDomain({ domains: labels });
      if (!listDomain || listDomain.length === 0) {
        setEnsDomains(mapped);
      } else {
        const updatedDomains = mapped.map(
          (d: { name: string; action: string }) => {
            const domain = listDomain.find(
              (ld: { label: string }) => ld.label === d.name.split(".")[0]
            );
            if (domain) {
              d.action = domain.status === "claimed" ? "Manage" : "Claim";
            }
            return d;
          }
        );
        setEnsDomains(updatedDomains);
      }
    } catch (err) {
      console.error("Error fetching ENS:", err);
      toast.error("Failed to fetch ENS domains.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    fetchData().catch((err) => {
      console.error("Error fetching ENS:", err);
      setLoading(false);
      toast.error("Failed to fetch ENS domains.");
    });
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="relative flex md:h-[600px] w-full flex-col items-center justify-center overflow-hidden rounded-lg  bg-background">
        <section className="z-10 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
            <p>Welcome to Singular Domain</p>
          </div>

          <div className="p-6">
            <p className="max-w-xl text-lg text-gray-700 leading-relaxed">
              <span className="font-extrabold text-black">
                Singular Domain{" "}
              </span>
              is a{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-bold">
                1:1 claim project{" "}
              </span>{" "}
              based on your
              <span className="text-indigo-500 font-semibold">
                {" "}
                ENS domains
              </span>
              . If you own <strong className="text-red-500">.eth</strong> names,
              you can claim a corresponding
              <span className="text-green-500 font-bold">
                {" "}
                “Singular Domain”
              </span>{" "}
              in our ecosystem.
              <span className="italic text-gray-500">
                Claiming preserves your brand, identity, and uniqueness in the
                Web3 space.
              </span>
            </p>

            <p className="mt-6 max-w-xl text-lg text-gray-700 leading-relaxed">
              <span className="text-blue-500 font-bold">
                Connect your wallet
              </span>{" "}
              to verify your
              <span className="text-indigo-500 font-semibold">
                {" "}
                ENS domains
              </span>
              , then
              <span className="text-purple-500 font-bold"> mint</span> your
              <span className="text-green-500 font-bold">
                {" "}
                1:1 Singular Domains
              </span>
              <span className="text-pink-500 font-bold"> absolutely free!</span>
            </p>
          </div>

          <div className="mt-8">
            <ConnectButton
              showBalance={false}
              accountStatus="avatar"
              chainStatus="icon"
              label="Connect"
            />
          </div>
        </section>
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
          )}
        />
      </div>
    );
  }

  return (
    <main className="px-4 py-8">
      {loading ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <Skeleton className="h-6 w-3/4 bg-gray-200 rounded-md" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 rounded-md" />
        </div>
      ) : (
        <div>
          <DomainList domains={ensDomains} fetchData={fetchData} />
        </div>
      )}
    </main>
  );
}
