"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReservationPaymentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messages/reservations/payments/list");
  }, [router]);

  return null;
}