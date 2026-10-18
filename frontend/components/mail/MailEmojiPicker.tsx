"use client";

interface MailEmojiPickerProps {
  isOpen: boolean;
  onSelectEmoji: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  "👍", "❤️", "😊", "🎉", "🔥", "🙏", "🚀", "👀",
  "💯", "👏", "💼", "✉️", "✅", "💡", "✨", "🤝",
  "🙂", "😀", "😄", "😉", "😍", "💪", "🎯", "🌟",
];

export function MailEmojiPicker({ isOpen, onSelectEmoji }: MailEmojiPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 bottom-full mb-2 p-2.5 bg-white rounded-2xl shadow-xl border border-neutral-200 grid grid-cols-6 gap-1 z-30 w-52 animate-in fade-in zoom-in-95 duration-100">
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelectEmoji(emoji)}
          className="p-1.5 hover:bg-neutral-100 rounded-lg text-base cursor-pointer transition-transform hover:scale-125 select-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
