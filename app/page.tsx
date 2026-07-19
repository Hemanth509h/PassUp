'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LodingCard from "./components/loding";
import Api from "./__api/api";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let intervalId: any;

    const checkHealth = async () => {
      try {
        const res = await Api.health();

        if (res.status === "OK") {
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
          }
          router.push('/login');
        }
      } catch (error) {
        console.log(error);
      }
    };

    checkHealth();
    intervalId = setInterval(checkHealth, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [router]);

  return (
    <>
      {loading ? <LodingCard /> : null}
    </>
  );
}