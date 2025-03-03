"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubNames from "@/components/subNames";
import {useAccount, useReadContract, useSwitchChain} from "wagmi";
import { rootDomainAddress } from "@/components/domain-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Socials from "@/components/socials";
import Addresses from "@/components/addresses";
import Profile from "@/components/profile";
import { useMigrateDomain } from "@/hooks/useMigrateDomain";
import Migration from "./migration";
import {optimismChain} from "@/config";

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
  const {switchChain} = useSwitchChain();
  const route = useRouter();
  console.log(label);

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
    if (isConnected &&
      (isResolverCorrect || isMigrationSkipped) &&
      chainId !== optimismChain.id) {
      switchChain({ chainId: optimismChain.id });
    }
  }, [isConnected, chainId, isMigrationSkipped]);

  if (!isResolverCorrect && !isMigrationSkipped) {
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
            className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="socials"
            className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Socials
          </TabsTrigger>
          <TabsTrigger
            value="subnames"
            className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
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
    </div>
  );
}
