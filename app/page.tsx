'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Api from "./__api/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Ping the health endpoint in the background to spin up the server
    Api.health().catch(console.error);

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}