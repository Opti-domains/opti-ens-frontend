// import {NextRequest, NextResponse} from "next/server";
//
// const DOMAIN_IMPL_ABI=[
//   {
//     "type": "function",
//     "name": "getNestedAddress",
//     "inputs": [
//       {
//         "name": "reverseDnsEncoded",
//         "type": "bytes",
//         "internalType": "bytes"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "address",
//         "internalType": "address"
//       }
//     ],
//     "stateMutability": "view"
//   },
//   {
//     "type": "function",
//     "name": "getSubdomainNames",
//     "inputs": [
//       {
//         "name": "start",
//         "type": "uint256",
//         "internalType": "uint256"
//       },
//       {
//         "name": "length",
//         "type": "uint256",
//         "internalType": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "string[]",
//         "internalType": "string[]"
//       }
//     ],
//     "stateMutability": "view"
//   },
//   {
//     "type": "function",
//     "name": "getSubdomainCount",
//     "inputs": [],
//     "outputs": [
//       {
//         "name": "",
//         "type": "uint256",
//         "internalType": "uint256"
//       }
//     ],
//     "stateMutability": "view"
//   }
// ]
//
// async function fetchSubNames(domain: string) {
//   const labels = domain.split(".")
//   labels.forEach()
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