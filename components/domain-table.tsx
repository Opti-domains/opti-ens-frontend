import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowDownUp } from "lucide-react";
import {Label} from "@/components/ui/label";
import {useRouter} from "next/navigation";

export type DomainTableType = {
  name: string;
  fullDomain: string;
  icon: string;
  action: string;
}

export default function DomainTable({ domains }: { domains: DomainTableType[] }) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const router = useRouter();

  // Sort domains by name in ascending or descending order
  const sortedDomains = [...domains].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  const filteredDomains = sortedDomains.filter((d) =>
    d.fullDomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Sort by Name <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Sort by Name</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setSortAsc(!sortAsc)}>
            <ArrowDownUp className={`h-4 w-4 ${sortAsc ? "rotate-180" : ""}`} />
          </Button>
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-[450px] bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <Table className="mt-4">
        <TableBody>
          {filteredDomains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-gray-500">
                No domains found
              </TableCell>
            </TableRow>
          ) : (
            filteredDomains.map((domain) => (
              <TableRow key={domain.fullDomain} className="hover:bg-white" onClick={() => router.push(`/${domain.fullDomain}`)}>
                <TableCell className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full ${domain.icon}`} />
                  <span className="text-lg font-bold text-gray-600">{domain.name}</span>
                  <span className="text-gray-400">.{domain.fullDomain.split(".").slice(1).join(".")}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Label
                    className="border rounded-full border-white text-xs font-bold p-2 bg-red-500 text-white hover:bg-primary/90"
                  >
                    {domain.action}
                  </Label>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
