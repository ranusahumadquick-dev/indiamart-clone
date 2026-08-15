"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PriceAlertsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/buyer/alerts");
  }, [router]);
  return null;
}
