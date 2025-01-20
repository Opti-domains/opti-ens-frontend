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

/**
 * Sample data. In a real app, you might fetch this from a database or API.
 */
const domains = [
  { name: "example.com",       expiration: "2024-05-15", action: "Claim" },
  { name: "mywebsite.com",     expiration: "2025-02-28", action: "Manage" },
  { name: "coolapp.io",        expiration: "2024-09-01", action: "Claim" },
  { name: "bestshop.com",      expiration: "2025-11-30", action: "Manage" },
  { name: "techblog.net",      expiration: "2024-07-22", action: "Claim" },
]

export function DomainList() {
  return (
    <div className="mt-8 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">Domain List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DOMAIN NAME</TableHead>
            <TableHead>EXPIRATION DATE</TableHead>
            <TableHead className="text-right">ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((d) => (
            <TableRow key={d.name}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.expiration}</TableCell>
              <TableCell className="text-right">
                {d.action === "Claim" ? (
                  <Button variant="link">{d.action}</Button>
                ) : (
                  <Button variant="secondary">{d.action}</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}