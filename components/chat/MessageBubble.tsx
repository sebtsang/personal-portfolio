import { cn } from "@/lib/utils";

export function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "bubble whitespace-pre-wrap",
        isUser ? "bubble-user" : "bubble-assistant",
        "max-w-[88%]"
      )}
    >
      {content}
    </div>
  );
}
