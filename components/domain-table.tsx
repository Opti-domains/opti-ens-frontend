import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter, ArrowDownUp } from "lucide-react";
import {Label} from "@/components/ui/label";

const domains = [
  {
    name: "game",
    fullDomain: "game.ez42.eth",
    icon: "bg-gradient-to-r from-red-500 to-orange-500",
    action: "Manager",
  },
  {
    name: "blog",
    fullDomain: "blog.ez42.eth",
    icon: "bg-gradient-to-r from-blue-500 to-green-500",
    action: "Manager",
  },
  {
    name: "shop",
    fullDomain: "shop.ez42.eth",
    icon: "bg-gradient-to-r from-purple-500 to-pink-500",
    action: "Manager",
  },
  {
    name: "docs",
    fullDomain: "docs.ez42.eth",
    icon: "bg-gradient-to-r from-yellow-500 to-red-500",
    action: "Manager",
  },
  {
    name: "api",
    fullDomain: "api.ez42.eth",
    icon: "bg-gradient-to-r from-gray-500 to-black",
    action: "Manager",
  },
];

export default function DomainTable() {
  const [search, setSearch] = useState("");

  const filteredDomains = domains.filter((d) =>
    d.fullDomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Creation date <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Sort by Name</DropdownMenuItem>
            <DropdownMenuItem>Sort by Expiration</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <Button variant="ghost">
            <ArrowDownUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost">
            <Filter className="h-4 w-4 text-blue-500" />
          </Button>
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-[400px] bg-white"
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
              <TableRow key={domain.fullDomain} className="hover:bg-white">
                <TableCell className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full ${domain.icon}`} />
                  <span className="text-lg font-bold text-gray-600">{domain.name}</span>
                  <span className="text-gray-400">.{domain.fullDomain.split(".").slice(1).join(".")}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Label className="border rounded-full text-xs font-bold text-blue-600 bg-white p-1">{domain.action}</Label>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
