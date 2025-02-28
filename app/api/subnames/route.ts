// import {NextRequest, NextResponse} from "next/server";
// import {toBytes, concat} from "viem";
//
// function encodeDns(labels: string[]): Uint8Array {
//   const encodedLabels = labels.map(label => {
//     const labelBytes = toBytes(label);
//     return concat([Uint8Array.of(labelBytes.length), labelBytes]);
//   });
//
//   return concat([...encodedLabels, Uint8Array.of(0)]); // Append null byte at the end
// }
//
// async function fetchSubNames(domain: string) {
//   const labels = domain.split(".")
//   const encodedDns = encodeDns(labels)
//
//   // Fetch the subdomains from the ENS registry
//
// }
//
// export async function GET(request: NextRequest) {
//   try {
//     // Extract "owner" from query params
//     const { searchParams } = new URL(request.url)
//     const domainParam = searchParams.get("domain")
//
//     if (!domainParam) {
//       return NextResponse.json({ error: "Missing 'domain' parameter" }, { status: 400 })
//     }
//
//     const data = await fetchDomainsByOwner(ownerParam)
//     return NextResponse.json(data)
//   } catch (err) {
//     console.error("Error in GET /api/ens:", err)
//     return NextResponse.json({ error: err }, { status: 500 })
//   }
// }