"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {toast} from "sonner";
import {useSignDomain} from "@/hooks/useSignDomain";
import {useEffect} from "react";

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
export function DomainList({ domains }: { domains: Domain[] }) {
  const { signDomain, data, error, isMutating } = useSignDomain();
  const handleClaim = async (domain: Domain) => {
    if (!domain.expiration || domain.expiration === "--") {
      toast.error("Claim domain failed", {
        description: "Domain " + domain.name + " has no expiration date",
      })
      return
    }
    await signDomain({ domain: domain.name, expiration: Date.parse(domain.expiration), owner: domain.owner })
  }
  const handleManage = (domain: Domain) => {
    toast.success("Managing domain " + domain.name)
  }

  useEffect(() => {
    if (isMutating) {
      toast.loading("Claiming domain...")
    } else if (error) {
      toast.dismiss();
      toast.error("Claim domain failed", {
        description: error.message,
      })
    } else if (data) {
      toast.dismiss();
      toast.success("Claimed domain signature: " + data.signature)
    }
  }, [isMutating, error, data]);

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
