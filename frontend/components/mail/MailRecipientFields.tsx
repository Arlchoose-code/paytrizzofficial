"use client";

import { X } from "lucide-react";

interface MailRecipientFieldsProps {
  toChips: string[];
  setToChips: React.Dispatch<React.SetStateAction<string[]>>;
  toInput: string;
  setToInput: (v: string) => void;
  toInputRef: React.RefObject<HTMLInputElement | null>;

  ccChips: string[];
  setCcChips: React.Dispatch<React.SetStateAction<string[]>>;
  ccInput: string;
  setCcInput: (v: string) => void;
  ccInputRef: React.RefObject<HTMLInputElement | null>;
  showCc: boolean;
  setShowCc: (v: boolean) => void;

  bccChips: string[];
  setBccChips: React.Dispatch<React.SetStateAction<string[]>>;
  bccInput: string;
  setBccInput: (v: string) => void;
  bccInputRef: React.RefObject<HTMLInputElement | null>;
  showBcc: boolean;
  setShowBcc: (v: boolean) => void;

  onKeyDownChip: (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    setValue: (v: string) => void,
    chips: string[],
    setChips: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  onBlurChip: (
    currentValue: string,
    setValue: (v: string) => void,
    chips: string[],
    setChips: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  onPasteChip: (
    e: React.ClipboardEvent<HTMLInputElement>,
    chips: string[],
    setChips: React.Dispatch<React.SetStateAction<string[]>>,
    setValue: (v: string) => void
  ) => void;
}

export function MailRecipientFields({
  toChips,
  setToChips,
  toInput,
  setToInput,
  toInputRef,
  ccChips,
  setCcChips,
  ccInput,
  setCcInput,
  ccInputRef,
  showCc,
  setShowCc,
  bccChips,
  setBccChips,
  bccInput,
  setBccInput,
  bccInputRef,
  showBcc,
  setShowBcc,
  onKeyDownChip,
  onBlurChip,
  onPasteChip,
}: MailRecipientFieldsProps) {
  return (
    <>
      {/* To (Kepada) with Cc and Bcc toggle buttons */}
      <div className="flex items-center flex-wrap gap-1.5 px-4 py-2 border-b border-neutral-100 min-h-[42px] text-xs">
        <span
          className="text-neutral-500 w-16 font-medium cursor-pointer select-none"
          onClick={() => toInputRef.current?.focus()}
        >
          Kepada
        </span>
        <div className="flex-1 flex items-center flex-wrap gap-1.5 min-w-[140px]">
          {toChips.map((addr) => (
            <span
              key={addr}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium"
            >
              <span>{addr}</span>
              <button
                type="button"
                onClick={() => setToChips(toChips.filter((c) => c !== addr))}
                className="hover:text-red-600 text-neutral-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={toInputRef}
            type="text"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            onKeyDown={(e) =>
              onKeyDownChip(e, toInput, setToInput, toChips, setToChips)
            }
            onBlur={() => onBlurChip(toInput, setToInput, toChips, setToChips)}
            onPaste={(e) => onPasteChip(e, toChips, setToChips, setToInput)}
            placeholder={toChips.length === 0 ? "Penerima" : ""}
            className="flex-1 min-w-[100px] text-xs text-neutral-900 outline-none bg-transparent py-0.5"
          />
        </div>
        <div className="flex items-center gap-2 text-neutral-500 shrink-0 font-medium select-none ml-auto">
          {!showCc && (
            <button
              type="button"
              onClick={() => {
                setShowCc(true);
                setTimeout(() => ccInputRef.current?.focus(), 50);
              }}
              className="hover:text-neutral-900 hover:underline px-1 text-xs cursor-pointer"
            >
              Cc
            </button>
          )}
          {!showBcc && (
            <button
              type="button"
              onClick={() => {
                setShowBcc(true);
                setTimeout(() => bccInputRef.current?.focus(), 50);
              }}
              className="hover:text-neutral-900 hover:underline px-1 text-xs cursor-pointer"
            >
              Bcc
            </button>
          )}
        </div>
      </div>

      {/* Cc Field */}
      {showCc && (
        <div className="flex items-center flex-wrap gap-1.5 px-4 py-2 border-b border-neutral-100 min-h-[42px] text-xs animate-in fade-in duration-150">
          <span
            className="text-neutral-500 w-16 font-medium cursor-pointer select-none"
            onClick={() => ccInputRef.current?.focus()}
          >
            Cc
          </span>
          <div className="flex-1 flex items-center flex-wrap gap-1.5 min-w-[140px]">
            {ccChips.map((addr) => (
              <span
                key={addr}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium"
              >
                <span>{addr}</span>
                <button
                  type="button"
                  onClick={() => setCcChips(ccChips.filter((c) => c !== addr))}
                  className="hover:text-red-600 text-neutral-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={ccInputRef}
              type="text"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) =>
                onKeyDownChip(e, ccInput, setCcInput, ccChips, setCcChips)
              }
              onBlur={() => onBlurChip(ccInput, setCcInput, ccChips, setCcChips)}
              onPaste={(e) => onPasteChip(e, ccChips, setCcChips, setCcInput)}
              placeholder={ccChips.length === 0 ? "Penerima salinan (Cc)" : ""}
              className="flex-1 min-w-[100px] text-xs text-neutral-900 outline-none bg-transparent py-0.5"
            />
          </div>
        </div>
      )}

      {/* Bcc Field */}
      {showBcc && (
        <div className="flex items-center flex-wrap gap-1.5 px-4 py-2 border-b border-neutral-100 min-h-[42px] text-xs animate-in fade-in duration-150">
          <span
            className="text-neutral-500 w-16 font-medium cursor-pointer select-none"
            onClick={() => bccInputRef.current?.focus()}
          >
            Bcc
          </span>
          <div className="flex-1 flex items-center flex-wrap gap-1.5 min-w-[140px]">
            {bccChips.map((addr) => (
              <span
                key={addr}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium"
              >
                <span>{addr}</span>
                <button
                  type="button"
                  onClick={() => setBccChips(bccChips.filter((c) => c !== addr))}
                  className="hover:text-red-600 text-neutral-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={bccInputRef}
              type="text"
              value={bccInput}
              onChange={(e) => setBccInput(e.target.value)}
              onKeyDown={(e) =>
                onKeyDownChip(e, bccInput, setBccInput, bccChips, setBccChips)
              }
              onBlur={() => onBlurChip(bccInput, setBccInput, bccChips, setBccChips)}
              onPaste={(e) => onPasteChip(e, bccChips, setBccChips, setBccInput)}
              placeholder={bccChips.length === 0 ? "Penerima salinan tersembunyi (Bcc)" : ""}
              className="flex-1 min-w-[100px] text-xs text-neutral-900 outline-none bg-transparent py-0.5"
            />
          </div>
        </div>
      )}
    </>
  );
}
