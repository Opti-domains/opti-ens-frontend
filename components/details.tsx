"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import SubNames from "@/components/subNames";
import {useAccount, useReadContract} from "wagmi";
import {domainAddress} from "@/components/domain-list";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

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
  const {address, isConnected} = useAccount();
  const route = useRouter();
  console.log(label);

  const { data: resolver } = useReadContract({
    address: domainAddress,
    abi: ROOT_DOMAIN_ABI,
    functionName: "resolver",
    args: [],
  });

  console.log(resolver);
  useEffect(() => {
    if (!isConnected) {
      route.push("/");
    }
  }, [isConnected]);
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <Tabs defaultValue="account" className="md:w-[700px]">
        <TabsList className="flex flex-row items-start justify-start mb-4 bg-white">
          <TabsTrigger value="account"
                       className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">Account</TabsTrigger>
          <TabsTrigger value="records"
                       className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">Records</TabsTrigger>
          <TabsTrigger value="subnames"
                       className="px-4 py-2 text-gray-500 text-xl font-bold data-[state=active]:text-blue-500 data-[state=active]:border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">Subnames</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Make changes to your account here. Click save when you're done.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Pedro Duarte"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="@peduarte"/>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. After saving, you'll be logged out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" type="password"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password"/>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="subnames">
          <SubNames
            parentDomain={label}
            owner={address as `0x${string}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}