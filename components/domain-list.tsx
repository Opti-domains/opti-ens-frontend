"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {Button} from "@/components/ui/button"
import {toast} from "sonner";
import {useSignDomain} from "@/hooks/useSignDomain";
import {useEffect, useState} from "react";
import {useWaitForTransactionReceipt, useWriteContract, type BaseError} from 'wagmi';
import {registryAbi} from "@/lib/abi/registry";
import {padHex, toHex} from "viem";


const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x';
const domainAddress = process.env.NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS || '0x';

/**
 * Type definition for domain items
 * Adjust fields as needed (e.g., string, Date, etc.)
 */
interface Domain {
  name: string
  owner: `0x${string}`
  expiration?: string
  action?: string
}

/**
 * DomainList component
 * - Takes in an array of Domain objects
 * - Shows "No domain" if the array is empty
 */
export function DomainList({domains}: { domains: Domain[] }) {
  const {signDomain, data, error: signErr, isMutating} = useSignDomain();
  const {data: hash, error, writeContract} = useWriteContract();
  const [label, setLabel] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const handleClaim = async (domain: Domain) => {
    try {
      if (!domain.expiration || domain.expiration === "--") {
        toast.error("Claim domain failed", {
          description: "Domain " + domain.name + " has no expiration date",
        })
        return
      }
      const name = domain.name.split(".")[0]
      setLabel(name);
      setOwner(domain.owner);
      await signDomain({domain: name, expiration: Date.parse(domain.expiration), owner: domain.owner})
    } catch (err) {
      console.error("Error claiming domain:", err);
    }
  }
  const handleManage = (domain: Domain) => {
    toast.success("Managing domain " + domain.name)
  }

  useEffect(() => {
    try {
      if (isMutating) {
        toast.loading("Claiming domain...")
      } else if (signErr) {
        toast.dismiss();
        toast.error("Claim domain failed", {
          description: signErr.message,
        })
      } else if (data) {
        console.log(data);
        const hexValue = toHex(Number(data.nonce));
        const byte32Value = padHex(hexValue, {size: 32});
        writeContract({
          address: registryAddress as `0x${string}`,
          abi: registryAbi,
          functionName: "register",
          args: [domainAddress as `0x${string}`, label, owner, BigInt(data.deadline).valueOf(), byte32Value, data.signature],
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
    }
  }, [error, isConfirming, isConfirmed]);

  return (
    <div className="mt-8 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">Domain List</h2>
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
                    <Button variant="default" onClick={() => handleClaim(d)}>{d.action}</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => handleManage(d)}>{d.action || "Manage"}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
