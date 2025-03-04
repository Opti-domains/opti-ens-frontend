"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";

import { DomainList } from "@/components/domain-list";
import { toast } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckDomain } from "@/hooks/useCheckDomain";
import { optimismChain } from "@/config";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/domain/list/${address}`
      );
      const data = await res.json();

      const fetchedDomains = data || [];

      // Convert the data to the shape needed by DomainList
      const labels: string[] = [];
      const mapped = fetchedDomains.map(
        (d: { expiration: string; name: string }) => {
          // The subgraph's expiryDate is a Unix timestamp in *seconds*
          let expiration = "--";
          if (d.expiration) {
            const expirySec = parseInt(d.expiration, 10) * 1000;
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
      console.log("mapped", mapped);
      if (labels.length > 0) {
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

  if (!isConnected || chainId !== optimismChain.id) {
    return (
      <div className="relative flex md:h-[600px] w-full flex-col items-center justify-center overflow-hidden rounded-lg  bg-background">
        <section className="z-10 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
            <p>Opti.Domains ENS L2</p>
          </div>

          <div className="p-6">
            <p className="max-w-xl text-lg text-gray-700 leading-relaxed hidden">
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
              <span className="text-blue-500 font-bold">Connect wallet</span>{" "}
              and migrate your
              <span className="text-indigo-500 font-semibold">
                {" "}
                ENS domains
              </span>
              <span className="text-red-500 font-bold"> to Optimism</span>
            </p>
          </div>

          <div className="mt-8">
            {!isConnected ? (
              <ConnectButton
                showBalance={false}
                accountStatus="avatar"
                chainStatus="icon"
                label="Connect"
              />
            ) : (
              <Button
                onClick={() => switchChain({ chainId: optimismChain.id })}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Switch to Optimism
              </Button>
            )}
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
    <main className="px-4 py-8 grid place-items-center">
      {loading ? (
        <div className="flex flex-col items-center space-y-4 md:w-[700px]">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <Skeleton className="h-6 w-full bg-gray-200 rounded-md" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 rounded-md" />
        </div>
      ) : (
        <div className="space-y-4 md:w-[700px]">
          {!ensDomains || ensDomains.length === 0 ? (
              <div className="bg-blue-100 border-l-4 border-blue-400 p-6 rounded-md shadow-sm md:w-[700px]">
                <h2 className="text-xl font-bold text-gray-800">🌐 ENS Domain Not Found</h2>
                <p className="text-gray-600 mt-2">
                  We couldn’t find an ENS domain associated with your wallet. If you recently registered or updated a
                  domain, please check back later as updates may take some time to propagate.
                </p>
                <p className="text-gray-600 mt-2">
                  If you don’t have an ENS domain yet, you can register one easily on the official ENS dApp.
                </p>
                <div className="mt-4">
                  <a
                    href="https://app.ens.domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                  >
                    Register ENS Domain
                  </a>
                </div>
              </div>
            ) :
            <DomainList domains={ensDomains} fetchData={fetchData}/>
          }
        </div>
      )}
    </main>
  );
}
