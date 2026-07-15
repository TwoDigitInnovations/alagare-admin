import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    router.replace(auth ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
