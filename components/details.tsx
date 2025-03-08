"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubNames from "@/components/subNames";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { rootDomainAddress } from "@/components/domain-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Socials from "@/components/socials";
import Addresses from "@/components/addresses";
import Profile from "@/components/profile";
import { useMigrateDomain } from "@/hooks/useMigrateDomain";
import Migration from "./migration";
import { optimismChain } from "@/config";

const ROOT_DOMAIN_ABI = [
  {
    type: "function",
    name: "resolver",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
];

export default function DomainDetails({ label }: { label: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const route = useRouter();
  const isSubdomain = label.endsWith(".eth") && label.split(".").length > 2;

  const [isMigrationSkipped, setIsMigrationSkipped] = useState(false);

  const { data: resolver } = useReadContract({
    address: rootDomainAddress,
    abi: ROOT_DOMAIN_ABI,
    functionName: "resolver",
    args: [],
  });

  const { setL1Resolver, isResolverCorrect } = useMigrateDomain(label);

  useEffect(() => {
    if (!isConnected) {
      route.push("/");
    }
    if (
      isConnected &&
      (isResolverCorrect || isMigrationSkipped) &&
      chainId !== optimismChain.id
    ) {
      switchChain({ chainId: optimismChain.id });
    }
  }, [isConnected, chainId, isMigrationSkipped]);

  if (!isResolverCorrect && !isMigrationSkipped && !isSubdomain) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="md:w-[700px]">
          <Migration
            domain={label}
            setL1Resolver={setL1Resolver}
            skipMigration={() => setIsMigrationSkipped(true)}
          ></Migration>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <Tabs defaultValue="account" className="md:w-[700px]">
        <TabsList className="flex flex-row items-start justify-start mb-4 bg-white">
          <TabsTrigger
            value="account"
            className="px-4 py-2 text-gray-500 md:text-xl text-base font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="px-4 py-2 text-gray-500 md:text-xl text-base font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="socials"
            className="px-4 py-2 text-gray-500 md:text-xl text-base font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Socials
          </TabsTrigger>
          <TabsTrigger
            value="subnames"
            className="px-4 py-2 text-gray-500 md:text-xl text-base font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Subnames
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Profile
            parentDomain={label}
            resolverAddress={resolver as `0x${string}`}
          />
        </TabsContent>
        <TabsContent value="addresses">
          <Addresses
            parentDomain={label}
            resolverAddress={resolver as `0x${string}`}
          />
        </TabsContent>
        <TabsContent value="socials">
          <Socials
            parentDomain={label}
            resolverAddress={resolver as `0x${string}`}
          />
        </TabsContent>
        <TabsContent value="subnames">
          <SubNames parentDomain={label} owner={address as `0x${string}`} />
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-amber-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <div className="mt-1 text-sm text-amber-700">
              Any updates to domain records will be propagated to ENS mainnet
              after 1 hour.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
