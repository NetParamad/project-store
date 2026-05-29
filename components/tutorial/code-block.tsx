"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";

export function CodeBlock({ code }: { code: string }) {
  const [icon, setIcon] = useState<"copy" | "check">("copy");

  const copy = async () => {
    await navigator?.clipboard?.writeText(code);
    setIcon("check");
    setTimeout(() => setIcon("copy"), 2000);
  };

  return (
    <pre className="bg-muted rounded-md p-6 my-6 relative">
      <Button
        size="icon"
        onClick={copy}
        variant={"outline"}
        className="absolute right-2 top-2"
      >
        {icon === "copy" ? <Copy size={20} /> : <Check size={20} />}
      </Button>
      <code className="text-xs p-3">{code}</code>
    </pre>
  );
}
