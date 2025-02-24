import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { concat, toHex } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dnsEncode(name: string) {
  // Split into labels by dot
  const labels = name.split(".");

  // Encode each label and join with empty label at end
  const encodedLabels = labels.map((label) => {
    const length = label.length;
    if (length === 0) throw new Error("Empty label");

    // Convert length to single byte hex
    const lengthHex = toHex(length, { size: 1 });

    // Convert label text to hex
    const textHex = toHex(label);

    return concat([lengthHex, textHex]);
  });

  // Add empty label at end (0x00)
  const emptyLabel = toHex(0, { size: 1 });

  return concat([...encodedLabels, emptyLabel]);
}
