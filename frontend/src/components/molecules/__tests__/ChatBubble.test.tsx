import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ChatBubble from "../ChatBubble";
import type { ChatItem } from "../ChatBubble";

describe("ChatBubble", () => {
  const assistantItem: ChatItem = {
    id: "a1",
    role: "assistant",
    text: "Ringkasan akademik tersedia.",
    time: "10:10",
    message_kind: "assistant_chat",
    response_type: "chat",
    sources: [{ source: "KHS Semester 1.pdf", snippet: "IPK 3.62" }],
  };

  it("menampilkan panel rujukan saat tombol rujukan diklik", async () => {
    render(<ChatBubble item={assistantItem} />);
    await userEvent.click(screen.getByRole("button", { name: /rujukan/i }));
    expect(screen.getByText("Rujukan Dokumen")).toBeInTheDocument();
    expect(screen.getByText("KHS Semester 1.pdf")).toBeInTheDocument();
  });

  it("mode reduced motion mematikan animasi entry", () => {
    const { container } = render(<ChatBubble item={assistantItem} supportsReducedMotion />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("[animation:none!important]");
  });
});
