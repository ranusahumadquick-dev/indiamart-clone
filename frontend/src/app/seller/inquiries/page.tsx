"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerInquiriesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/seller/inbox"); }, [router]);
  return null;
}
