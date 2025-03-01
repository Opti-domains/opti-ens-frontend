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
import { useCallback, useEffect, useState } from "react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type BaseError,
} from "wagmi";
import { registryAbi } from "@/lib/abi/registry";
import { padHex, toHex } from "viem";
import { useRouter } from "next/navigation";

export const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x";
export const rootDomainAddress = (process.env
  .NEXT_PUBLIC_PARENT_DOMAIN_ADDRESS || "0x") as `0x${string}`;

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
  const router = useRouter();
  const { signDomain, data, error: signErr, isMutating } = useSignDomain();
  const { data: hash, error, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = useCallback(
    async (domain: Domain) => {
      if (!domain.expiration || domain.expiration === "--") {
        toast.error("Claim failed", {
          description: `Domain ${domain.name} has no expiration date.`,
        });
        return;
      }

      try {
        await signDomain({
          domain: domain.name.split(".")[0],
          expiration: Date.parse(domain.expiration),
          owner: domain.owner,
        });
      } catch (err) {
        console.error("Error claiming domain:", err);
      }
    },
    [signDomain]
  );

  useEffect(() => {
    if (isMutating) {
      toast.loading("Claiming domain...");
      setIsClaiming(true);
    } else if (signErr) {
      toast.dismiss();
      toast.error("Claim failed", { description: signErr.message });
    } else if (data) {
      const byte32Value = padHex(toHex(Number(data.nonce)), { size: 32 });

      console.log([
        rootDomainAddress,
        data.domain,
        data.owner,
        BigInt(data.deadline).valueOf(),
        byte32Value,
        data.signature,
      ]);

      writeContract({
        address: registryAddress as `0x${string}`,
        abi: registryAbi,
        functionName: "register",
        args: [
          rootDomainAddress,
          data.domain,
          data.owner,
          BigInt(data.deadline).valueOf(),
          byte32Value,
          data.signature,
        ],
      });
    }
  }, [isMutating, signErr, data, writeContract]);

  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error("Claim failed", {
        description: (error as BaseError).shortMessage || error.message,
      });
      setIsClaiming(false);
    }
    if (isConfirming) {
      toast.loading("Confirming transaction...");
    }
    if (isConfirmed) {
      toast.dismiss();
      toast.success("Domain claimed successfully!");
      // fetchData();

      router.push(`/${data.domain}.eth`);
    }
  }, [error, isConfirming, isConfirmed, data, fetchData]);

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
                    <Button
                      variant="default"
                      onClick={() => handleClaim(d)}
                      disabled={isClaiming}
                      style={{
                        opacity: isClaiming ? 0.5 : 1,
                      }}
                    >
                      {d.action}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => router.push(`/${d.name}`)}
                      disabled={isClaiming}
                      style={{
                        opacity: isClaiming ? 0.5 : 1,
                      }}
                    >
                      {d.action || "Manage"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/*{open && selectedDomain && (*/}
      {/*  <ManageDialog*/}
      {/*    open={open}*/}
      {/*    setOpen={setOpen}*/}
      {/*    domain={selectedDomain}*/}
      {/*    resolverAddress={resolver as `0x${string}`}*/}
      {/*  />*/}
      {/*)}*/}
    </div>
  );
}
