"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢",
      "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥",
      "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴",
      "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯",
      "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁",
      "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰",
      "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫",
      "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌",
      "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "🦾",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "📧", "📨", "📩", "📤", "📥", "📦", "📋", "📌", "📎", "🖇️",
      "📏", "📐", "✂️", "🖊️", "🖋️", "✒️", "📝", "✏️", "🔍", "🔎",
      "🔐", "🔒", "🔓", "🔑", "🗑️", "⚡", "🔥", "💫", "✨", "🎉",
      "🎊", "📌", "📍", "🔗", "📎", "💻", "🖥️", "📱", "📞", "☎️",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
    ],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const filteredCategories = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES;
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(() => true),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onEmojiSelect(emoji);
      setOpen(false);
      setSearch("");
    },
    [onEmojiSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
          title="Emoji"
        >
          <Smile className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[320px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <div className="border-b border-border p-2">
            <Input
              ref={searchRef}
              placeholder="Search emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex border-b border-border">
            {filteredCategories.map((cat, i) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-xs font-medium transition-colors",
                  "hover:bg-muted",
                  activeCategory === i && "border-b-2 border-primary text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid max-h-[200px] grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {filteredCategories[activeCategory]?.emojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-muted transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
