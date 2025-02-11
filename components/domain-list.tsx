"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSignDomain } from "@/hooks/useSignDomain";
import {useEffect, useRef, useState} from "react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type BaseError, useReadContract,
} from "wagmi";
import { registryAbi } from "@/lib/abi/registry";
import { padHex, toHex } from "viem";
import {ManageDialog} from "@/components/manage-dialog";

const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x";
const domainAddress = (process.env.NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS || "0x") as `0x${string}`;

/**
 * Type definition for domain items
 * Adjust fields as needed (e.g., string, Date, etc.)
 */
export interface Domain {
  name: string;
  owner: `0x${string}`;
  expiration?: string;
  action?: string;
}

const ROOT_DOMAIN_ABI = [
  {
    "type": "function",
    "name": "resolver",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  }
];

/**
 * DomainList component
 * - Takes in an array of Domain objects
 * - Shows "No domain" if the array is empty
 */
export function DomainList({
  domains,
  fetchData,
}: {
  domains: Domain[];
  fetchData: () => void;
}) {
  const { signDomain, data, error: signErr, isMutating } = useSignDomain();
  const { data: hash, error, writeContract } = useWriteContract();
  const label = useRef<string>("");
  const owner = useRef<string>("");
  const selectedDomain = useRef<Domain | null>(null);
  const [open, setOpen] = useState(false);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const {data: resolver} = useReadContract({
    address: domainAddress,
    abi: ROOT_DOMAIN_ABI,
    functionName: 'resolver',
    args: [],
  });


  const handleClaim = async (domain: Domain) => {
    try {
      if (!domain.expiration || domain.expiration === "--") {
        toast.error("Claim domain failed", {
          description: "Domain " + domain.name + " has no expiration date",
        });
        return;
      }
      const name = domain.name.split(".")[0];
      label.current = name;
      owner.current = domain.owner;
      await signDomain({
        domain: name,
        expiration: Date.parse(domain.expiration),
        owner: domain.owner,
      });
    } catch (err) {
      console.error("Error claiming domain:", err);
    }
  };
  const handleManage = (domain: Domain) => {
    // fetch the resolver
    selectedDomain.current = domain;
    setOpen(!open);
    console.log("handle domain:", domain);
    console.log("handle resolver:", resolver);
  };

  useEffect(() => {
    try {
      if (isMutating) {
        toast.loading("Claiming domain...");
      } else if (signErr) {
        toast.dismiss();
        toast.error("Claim domain failed", {
          description: signErr.message,
        });
      } else if (data) {
        console.log(data);
        const hexValue = toHex(Number(data.nonce));
        const byte32Value = padHex(hexValue, { size: 32 });
        writeContract({
          address: registryAddress as `0x${string}`,
          abi: registryAbi,
          functionName: "register",
          args: [
            domainAddress,
            label.current,
            owner.current,
            BigInt(data.deadline).valueOf(),
            byte32Value,
            data.signature,
          ],
        });
      }
    } catch (err) {
      console.error("Error claiming domain:", err);
    }
  }, [isMutating, signErr, data]);

  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error("Claimed domain failed", {
        description: (error as BaseError).shortMessage || error.message,
      });
    }
    if (isConfirming) {
      toast.dismiss();
      toast.loading("Confirming domain claim: " + hash);
    }
    if (isConfirmed) {
      toast.dismiss();
      toast.success("Claimed domain success with hash: " + hash);
      fetchData();
    }
  }, [error, isConfirming, isConfirmed, hash]);

  useEffect(() => {
    if(!open){
      selectedDomain.current = null;
    }
  }, [open]);

  return (
    <div className="mt-8 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">Domain Lists</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Domain Name</TableHead>
            <TableHead className="font-bold">Expiration Date</TableHead>
            <TableHead className="font-bold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {domains.length === 0 ? (
            // Show a single row indicating no domain
            <TableRow>
              <TableCell colSpan={3} className="text-center text-2xl">
                No domain
              </TableCell>
            </TableRow>
          ) : (
            // Map through the domains if we do have data
            domains.map((d) => (
              <TableRow key={d.name}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.expiration || "--"}</TableCell>
                <TableCell className="text-right">
                  {d.action === "Claim" ? (
                    <Button variant="default" onClick={() => handleClaim(d)}>
                      {d.action}
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => handleManage(d)}>
                      {d.action || "Manage"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {open ? (
      <ManageDialog open={open} setOpen={setOpen} domain={selectedDomain.current} resolverAddress={resolver as `0x${string}`}/>
      ): null}
    </div>
  );
}
