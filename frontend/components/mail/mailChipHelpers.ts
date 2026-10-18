import React from "react";

export const parseInitialAddresses = (str: string) =>
  str
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/[,;]/g, ""))
    .filter((s) => s.length > 0);

export const addChipsFromString = (
  str: string,
  chips: string[],
  setChips: React.Dispatch<React.SetStateAction<string[]>>,
  setValue: (v: string) => void
) => {
  const parts = str
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/[,;]/g, ""))
    .filter((s) => s.length > 0);
  if (parts.length > 0) {
    const next = [...chips];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    setChips(next);
    setValue("");
  }
};

export const handleKeyDownChip = (
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  setValue: (v: string) => void,
  chips: string[],
  setChips: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (["Enter", ",", " ", ";"].includes(e.key)) {
    e.preventDefault();
    addChipsFromString(currentValue, chips, setChips, setValue);
  } else if (e.key === "Backspace" && !currentValue && chips.length > 0) {
    setChips(chips.slice(0, -1));
  }
};

export const handleBlurChip = (
  currentValue: string,
  setValue: (v: string) => void,
  chips: string[],
  setChips: React.Dispatch<React.SetStateAction<string[]>>
) => {
  addChipsFromString(currentValue, chips, setChips, setValue);
};

export const handlePasteChip = (
  e: React.ClipboardEvent<HTMLInputElement>,
  chips: string[],
  setChips: React.Dispatch<React.SetStateAction<string[]>>,
  setValue: (v: string) => void
) => {
  e.preventDefault();
  const pasteData = e.clipboardData.getData("text");
  if (pasteData) {
    addChipsFromString(pasteData, chips, setChips, setValue);
  }
};

export const parseFinalAddresses = (list: string[], inputVal: string) => {
  const res = [...list];
  if (inputVal.trim()) {
    const parts = inputVal
      .split(/[,;\s]+/)
      .map((s) => s.trim().replace(/[,;]/g, ""))
      .filter(Boolean);
    for (const p of parts) {
      if (!res.includes(p)) res.push(p);
    }
  }
  return res;
};
