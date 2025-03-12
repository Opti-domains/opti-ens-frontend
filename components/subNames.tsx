"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useFetcherSubNames } from "@/hooks/useFetchSubNames";
import { toast } from "sonner";
import { toHex } from "viem";
import {
  type BaseError,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { domainAbi } from "@/lib/abi/domain";
import { encodeDns } from "@/lib/utils";
import DomainTable, { DomainTableType } from "@/components/domain-table";

type Props = {
  parentDomain: string;
  owner: `0x${string}`;
};

export default function SubNames({ parentDomain, owner }: Props) {
  const [label, setLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [domains, setDomains] = useState<DomainTableType[]>([]);
  const domainAddr = useRef<`0x${string}`>("0x");
  const publicClient = usePublicClient();
  const { fetchSubNames } = useFetcherSubNames();
  const { data: hash, error: walletError, writeContract } = useWriteContract();
  const {
    isError,
    error: execError,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const gradientColors = [
    "bg-gradient-to-r from-red-500 to-orange-500",
    "bg-gradient-to-r from-blue-500 to-green-500",
    "bg-gradient-to-r from-purple-500 to-pink-500",
    "bg-gradient-to-r from-yellow-500 to-red-500",
  ];
  const getRandomIcon = (label: string) => {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = (hash * 31 + label.charCodeAt(i)) % gradientColors.length;
    }
    return gradientColors[hash];
  };

  const fetchData = async () => {
    const labels = await fetchSubNames({ domainAddr: domainAddr.current });
    const newDomains: DomainTableType[] = labels.map((label) => ({
      name: label,
      fullDomain: `${label}.${parentDomain}`,
      icon: getRandomIcon(label),
      action: "Manage",
    }));
    setDomains(newDomains);
  };

  const getDomainAddress = async (parentDomain: string) => {
    if (!publicClient) return;
    const labels = parentDomain.split(".");
    const reversedLabels = labels.filter((label) => label !== "eth").reverse();
    const encodedDns = encodeDns(reversedLabels);
    domainAddr.current = (await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS as `0x${string}`,
      abi: domainAbi,
      functionName: "getNestedAddress",
      args: [toHex(encodedDns)],
    })) as `0x${string}`;
  };

  const handleSave = async () => {
    if (!label || label === "" || !owner || owner === "0x") {
      toast.error("Label and Owner Address is required");
      return;
    }
    if (label.includes(".") || label.includes(" ")) {
      toast.error("Label must not contain spaces or dots");
      return;
    }
    if (domainAddr.current === "0x") {
      toast.error("Domain address not found");
      return;
    }

    console.log([label.trim(), owner, domainAddr.current]);

    try {
      writeContract({
        address: domainAddr.current,
        abi: domainAbi,
        functionName: "registerSubdomain",
        args: [label.trim(), owner],
      });
    } catch (err) {
      console.error("Error sign create sub name:", err);
    }
  };

  useEffect(() => {
    if (parentDomain) {
      getDomainAddress(parentDomain)
        .then(() => fetchData())
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (walletError) {
      toast.dismiss();
      toast.error("Create SubName failed", {
        description:
          (walletError as BaseError).shortMessage || walletError.message,
      });
    }
    if (isError) {
      toast.dismiss();
      toast.error("Create SubName failed", {
        description: (execError as BaseError).shortMessage || execError.message,
      });
    }
    if (isConfirmed) {
      toast.dismiss();
      toast.success("Create SubName successfully!");
      fetchData().catch(console.error);
      setIsOpen(false);
      setLabel("");
    }
  }, [walletError, isError, isConfirming, isConfirmed]);
  return (
    <div>
      <Card className="bg-gray-50 mb-6">
        <div className="flex flex-row items-center justify-between md:p-4 p-2">
          <span className="font-light italic md:text-base text-xs">
            Subnames let you create additional names from your existing name.
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="md:p-6 p-3 font-bold">
                <PlusIcon className="w-6 h-6 mr-1" />
                New subname
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-center md:text-2xl">
                  Create Subname
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="name"
                  className="text-left font-bold text-xl text-gray-500"
                >
                  Label
                </Label>
                <div className="relative w-full">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="rounded-lg"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 bg-gray-100 rounded-r-lg">
                    .{parentDomain}
                  </span>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  className="w-full md:p-5 p-3"
                  onClick={handleSave}
                  disabled={isConfirming}
                  type={"button"}
                >
                  {isConfirming ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
      <Card className="bg-gray-50 py-2">
        <DomainTable domains={domains} />
      </Card>
    </div>
  );
}
