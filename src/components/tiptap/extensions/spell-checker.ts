import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";
import { getSpellchecker, isKnownWord, getSuggestions } from "@/lib/dictionary";

interface SpellError {
  offset: number;
  length: number;
  word: string;
  message: string;
  source: "dictionary" | "ai";
  pendingRanking: boolean;
  bestFit: string;
  reason: string;
  alternatives: string[];
}

const spellCheckPluginKey = new PluginKey<{
  errors: SpellError[];
  deco: DecorationSet;
}>("spellCheck");

export interface SpellCheckerOptions {
  dictionaryDebounceMs: number;
  aiRankDebounceMs: number;
  onErrorsFound?: (errors: SpellError[]) => void;
}

export const SpellChecker = Extension.create<SpellCheckerOptions>({
  name: "spellChecker",

  addOptions() {
    return {
      dictionaryDebounceMs: 100,
      aiRankDebounceMs: 500,
      onErrorsFound: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { options } = this;
    let dictTimer: ReturnType<typeof setTimeout> | null = null;
    let aiRankTimer: ReturnType<typeof setTimeout> | null = null;
    let aiRankAbort: AbortController | null = null;
    let tooltipEl: HTMLDivElement | null = null;
    const ignoredWords = new Set<string>();
    let dictionaryReady = false;
    let currentHoveredError: SpellError | null = null;

    getSpellchecker()
      .then(() => {
        dictionaryReady = true;
      })
      .catch((err) => {
        console.error("[spell-checker] Failed to load dictionary:", err);
      });

    function hideTooltip() {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
      currentHoveredError = null;
    }

    function showTooltip(
      view: EditorView,
      error: SpellError,
      targetEl: HTMLElement,
    ) {
      hideTooltip();
      currentHoveredError = error;

      const rect = targetEl.getBoundingClientRect();
      const tooltip = document.createElement("div");
      tooltip.className = "spell-tooltip";

      if (error.pendingRanking) {
        tooltip.innerHTML = `
          <div class="spell-tooltip-message">${error.word}</div>
          <div class="spell-tooltip-checking">Checking...</div>
        `;
      } else {
        const hasAlternatives = error.alternatives.length > 0;
        tooltip.innerHTML = `
          <div class="spell-tooltip-message">${error.message}</div>
          ${
            error.bestFit
              ? `<div class="spell-tooltip-fix">✅ <strong>${error.bestFit}</strong>${error.reason ? ` — ${error.reason}` : ""}</div>`
              : ""
          }
          ${
            hasAlternatives
              ? `<div class="spell-tooltip-alternatives">
                  Also: ${error.alternatives.map((a) => `<button class="spell-alt-btn" data-fix="${a}" data-offset="${error.offset}" data-length="${error.length}">${a}</button>`).join(" ")}
                </div>`
              : ""
          }
          <div class="spell-tooltip-actions">
            ${
              error.bestFit
                ? `<button class="spell-tooltip-btn spell-fix-btn" data-fix="${error.bestFit}" data-offset="${error.offset}" data-length="${error.length}">Fix</button>`
                : ""
            }
            <button class="spell-tooltip-btn spell-ignore-btn" data-word="${error.word}" data-offset="${error.offset}">Ignore</button>
          </div>
        `;
      }

      tooltip.style.position = "fixed";
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 4}px`;
      tooltip.style.zIndex = "9999";

      tooltip.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;

        if (
          target.classList.contains("spell-fix-btn") ||
          target.classList.contains("spell-alt-btn")
        ) {
          const fix = target.getAttribute("data-fix") ?? "";
          const textOffset = parseInt(target.getAttribute("data-offset") ?? "0", 10);
          const textLength = parseInt(target.getAttribute("data-length") ?? "0", 10);

          const from = textOffsetToPMPosition(view.state.doc, textOffset);
          const to = textOffsetToPMPosition(view.state.doc, textOffset + textLength);

          const tr = view.state.tr;
          tr.delete(from, to);
          tr.insertText(fix, from);
          view.dispatch(tr);

          const currentState = spellCheckPluginKey.getState(view.state);
          if (currentState) {
            const newErrors = currentState.errors.filter((e) => e.offset !== textOffset);
            view.dispatch(
              view.state.tr.setMeta(spellCheckPluginKey, {
                errors: newErrors,
                deco: buildDecorations(view.state.doc, newErrors),
              }),
            );
          }

          hideTooltip();
        }

        if (target.classList.contains("spell-ignore-btn")) {
          const word = target.getAttribute("data-word") ?? "";
          if (word) ignoredWords.add(word.toLowerCase());
          hideTooltip();

          const state = spellCheckPluginKey.getState(view.state);
          if (state) {
            const offset = parseInt(target.getAttribute("data-offset") ?? "0", 10);
            const newErrors = state.errors.filter((e) => e.offset !== offset);
            view.dispatch(
              view.state.tr.setMeta(spellCheckPluginKey, {
                errors: newErrors,
                deco: buildDecorations(view.state.doc, newErrors),
              }),
            );
          }
        }
      });

      document.body.appendChild(tooltip);
      tooltipEl = tooltip;
    }

    function refreshTooltipIfVisible(view: EditorView) {
      if (!currentHoveredError) return;
      const state = spellCheckPluginKey.getState(view.state);
      if (!state) return;
      const updated = state.errors.find((e) => e.offset === currentHoveredError!.offset);
      if (!updated || updated.pendingRanking === currentHoveredError!.pendingRanking) return;
      const spellSpan = view.dom.querySelector(
        `.spell-error[data-spell-offset="${updated.offset}"]`,
      );
      if (spellSpan) {
        showTooltip(view, updated, spellSpan as HTMLElement);
      }
    }

    function textOffsetToPMPosition(doc: Node, textOffset: number): number {
      let currentTextOffset = 0;
      let result = doc.content.size;

      doc.descendants((node, pos) => {
        if (node.isText) {
          const textLen = node.text?.length ?? 0;
          if (currentTextOffset + textLen >= textOffset) {
            result = pos + (textOffset - currentTextOffset);
            return false;
          }
          currentTextOffset += textLen;
        }
        return true;
      });

      return result;
    }

    function buildDecorations(
      doc: Node,
      errors: SpellError[],
    ): DecorationSet {
      const decos: Decoration[] = [];
      for (const err of errors) {
        try {
          const from = textOffsetToPMPosition(doc, err.offset);
          const to = textOffsetToPMPosition(doc, err.offset + err.length);
          if (from < to && from < doc.content.size) {
            decos.push(
              Decoration.inline(from, Math.min(to, doc.content.size), {
                class: "spell-error",
                "data-spell-offset": String(err.offset),
                "data-spell-length": String(err.length),
              }),
            );
          }
        } catch {
          continue;
        }
      }
      return DecorationSet.create(doc, decos);
    }

    async function runDictionaryCheck(view: EditorView) {
      if (!dictionaryReady) return;

      const text = view.state.doc.textContent;
      if (!text.trim()) return;

      const existingState = spellCheckPluginKey.getState(view.state);
      const existingErrors = existingState?.errors ?? [];

      const errors: SpellError[] = [];
      const words = text.match(/[''\u2019a-zA-Z\u00C0-\u024F]+/g) ?? [];

      let offset = 0;
      for (const word of words) {
        const wordStart = text.indexOf(word, offset);
        if (wordStart === -1) {
          offset = (offset || 0) + word.length;
          continue;
        }

        const cleanWord = word.replace(/^[''\u2019]+|[''\u2019]+$/g, "");

        if (
          cleanWord.length >= 2 &&
          !ignoredWords.has(cleanWord.toLowerCase())
        ) {
          const known = await isKnownWord(cleanWord);
          if (!known) {
            const suggestions = await getSuggestions(cleanWord);
            const existing = existingErrors.find(
              (e) => e.offset === wordStart && !e.pendingRanking,
            );

            if (existing) {
              errors.push(existing);
            } else {
              errors.push({
                offset: wordStart,
                length: word.length,
                word: cleanWord,
                message: `Spelling: "${cleanWord}"`,
                source: "dictionary",
                pendingRanking: true,
                bestFit: suggestions[0] ?? "",
                reason: "",
                alternatives: suggestions.slice(1, 5),
              });
            }
          }
        }

        offset = wordStart + word.length;
      }

      view.dispatch(
        view.state.tr.setMeta(spellCheckPluginKey, {
          errors,
          deco: buildDecorations(view.state.doc, errors),
        }),
      );

      options.onErrorsFound?.(errors);
      scheduleAiRanking(view);
    }

    async function runAiRanking(view: EditorView) {
      const state = spellCheckPluginKey.getState(view.state);
      if (!state) return;

      const pending = state.errors.filter((e) => e.pendingRanking);
      if (!pending.length) return;

      aiRankAbort?.abort();
      aiRankAbort = new AbortController();

      const text = view.state.doc.textContent;

      try {
        const res = await fetch("/api/ai/spell-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sentence: text,
            misspellings: pending.map((e) => ({
              word: e.word,
              offset: e.offset,
              length: e.length,
              suggestions: [e.bestFit, ...e.alternatives],
            })),
          }),
          signal: aiRankAbort.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        const fixes: Array<{
          word: string;
          bestFit: string;
          reason: string;
          alternatives: string[];
        }> = data.fixes ?? [];

        const fixMap = new Map(fixes.map((f) => [f.word, f]));

        const updatedErrors = state.errors.map((e) => {
          if (!e.pendingRanking) return e;
          const fix = fixMap.get(e.word);
          if (fix) {
            return {
              ...e,
              pendingRanking: false,
              bestFit: fix.bestFit,
              reason: fix.reason,
              alternatives: fix.alternatives,
            };
          }
          return { ...e, pendingRanking: false };
        });

        view.dispatch(
          view.state.tr.setMeta(spellCheckPluginKey, {
            errors: updatedErrors,
            deco: buildDecorations(view.state.doc, updatedErrors),
          }),
        );

        refreshTooltipIfVisible(view);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("[spell-checker] AI ranking failed:", err);

        const fallbackErrors = state.errors.map((e) =>
          e.pendingRanking ? { ...e, pendingRanking: false } : e,
        );
        view.dispatch(
          view.state.tr.setMeta(spellCheckPluginKey, {
            errors: fallbackErrors,
            deco: buildDecorations(view.state.doc, fallbackErrors),
          }),
        );
      }
    }

    function scheduleAiRanking(view: EditorView) {
      if (aiRankTimer) clearTimeout(aiRankTimer);
      aiRankTimer = setTimeout(
        () => runAiRanking(view),
        options.aiRankDebounceMs,
      );
    }

    function hasSentenceEnding(text: string): boolean {
      return /[.!?]\s*$/.test(text);
    }

    function scheduleDictCheck(view: EditorView) {
      if (dictTimer) clearTimeout(dictTimer);
      dictTimer = setTimeout(
        () => runDictionaryCheck(view),
        options.dictionaryDebounceMs,
      );
    }

    return [
      new Plugin({
        key: spellCheckPluginKey,

        state: {
          init: () => ({ errors: [], deco: DecorationSet.empty }),
          apply(tr, old) {
            const meta = tr.getMeta(spellCheckPluginKey);
            if (meta) return meta;
            return old;
          },
        },

        props: {
          decorations(state) {
            const current = spellCheckPluginKey.getState(state);
            return current?.deco ?? DecorationSet.empty;
          },

          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              const spellSpan = target.closest?.(".spell-error");

              if (spellSpan) {
                const state = spellCheckPluginKey.getState(view.state);
                if (!state) return false;

                const offset = parseInt(
                  spellSpan.getAttribute("data-spell-offset") ?? "0",
                  10,
                );
                const error = state.errors.find((e) => e.offset === offset);
                if (error) {
                  showTooltip(view, error, spellSpan as HTMLElement);
                }
                return false;
              }

              if (
                tooltipEl &&
                !(event.target as HTMLElement).closest?.(".spell-tooltip")
              ) {
                hideTooltip();
              }
              return false;
            },

            blur(_view) {
              if (aiRankTimer) clearTimeout(aiRankTimer);
              runAiRanking(_view);
              return false;
            },
          },
        },

        view(editorView) {
          const handleDocChange = () => {
            scheduleDictCheck(editorView);
          };

          const handleKeyDown = (e: KeyboardEvent) => {
            if (aiRankTimer) clearTimeout(aiRankTimer);

            const text = editorView.state.doc.textContent;
            if (hasSentenceEnding(text)) {
              runAiRanking(editorView);
            } else {
              aiRankTimer = setTimeout(
                () => runAiRanking(editorView),
                options.aiRankDebounceMs,
              );
            }
          };

          const handleBlur = () => {
            if (aiRankTimer) clearTimeout(aiRankTimer);
            runAiRanking(editorView);
          };

          editorView.dom.addEventListener("input", handleDocChange);
          editorView.dom.addEventListener("keydown", handleKeyDown);
          editorView.dom.addEventListener("blur", handleBlur);

          return {
            destroy() {
              editorView.dom.removeEventListener("input", handleDocChange);
              editorView.dom.removeEventListener("keydown", handleKeyDown);
              editorView.dom.removeEventListener("blur", handleBlur);
              if (dictTimer) clearTimeout(dictTimer);
              if (aiRankTimer) clearTimeout(aiRankTimer);
              aiRankAbort?.abort();
              hideTooltip();
            },
          };
        },
      }),
    ];
  },
});
