import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

const aiSuggestionPluginKey = new PluginKey<{
  text: string;
  deco: Decoration;
} | null>("aiSuggestion");

export interface AiSuggestionOptions {
  debounceMs: number;
  getContext: () => {
    subject?: string;
    to?: string;
    thread?: string;
  };
  onSuggestionStart?: () => void;
  onSuggestionEnd?: () => void;
}

export const AiSuggestion = Extension.create<AiSuggestionOptions>({
  name: "aiSuggestion",

  addOptions() {
    return {
      debounceMs: 300,
      getContext: () => ({}),
      onSuggestionStart: undefined,
      onSuggestionEnd: undefined,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;
    let lastFetchText = "";

    function clearPending() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    }

    function currentSuggestion(
      state: any,
    ) {
      return aiSuggestionPluginKey.getState(state) as { text: string; deco: Decoration } | null;
    }

    function removeSuggestion(view: EditorView) {
      const current = currentSuggestion(view.state);
      if (current) {
        view.dispatch(
          view.state.tr.setMeta(aiSuggestionPluginKey, null),
        );
      }
      clearPending();
    }

    async function fetchSuggestion(view: EditorView, text: string) {
      if (!text.trim() || text === lastFetchText) return;
      lastFetchText = text;

      clearPending();
      abortController = new AbortController();

      extension.options.onSuggestionStart?.();

      let shouldCleanup = true;
      try {
        const ctx = extension.options.getContext();
        const res = await fetch("/api/ai/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "suggest",
            text: text.slice(-200),
            subject: ctx.subject,
            to: ctx.to,
            thread: ctx.thread,
          }),
          signal: abortController.signal,
        });

        if (res.ok && res.body) {
          const state = view.state;
          const cursorPos = state.selection.$head.pos;
          let accumulated = "";
          const spanRef: { current: HTMLSpanElement | null } = { current: null };

          const deco = Decoration.widget(
            cursorPos,
            (widgetView) => {
              const span = document.createElement("span");
              span.className = "ai-suggestion-ghost";
              span.title = "Tab to accept, Esc to dismiss";
              spanRef.current = span;
              return span;
            },
            { side: 1 },
          );

          view.dispatch(
            state.tr.setMeta(aiSuggestionPluginKey, {
              text: "",
              deco,
            }),
          );

          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            accumulated += decoder.decode(value, { stream: true });

            if (spanRef.current) {
              spanRef.current.textContent = accumulated;
            }
          }

          if (accumulated.trim()) {
            const finalText = accumulated;
            if (spanRef.current) {
              spanRef.current.textContent = finalText;
              spanRef.current.addEventListener("click", () => {
                const tr = view.state.tr.insertText(finalText, cursorPos);
                view.dispatch(tr);
              });
            }

            view.dispatch(
              view.state.tr.setMeta(aiSuggestionPluginKey, {
                text: finalText,
                deco,
              }),
            );
          } else {
            removeSuggestion(view);
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          shouldCleanup = false;
          extension.options.onSuggestionEnd?.();
          abortController = null;
          return;
        }
        console.error("[ai-suggestion] fetch failed:", err);
      }
      if (shouldCleanup) {
        extension.options.onSuggestionEnd?.();
        abortController = null;
      }
    }

    return [
      new Plugin({
        key: aiSuggestionPluginKey,

        state: {
          init: () => null,
          apply(tr, old) {
            const meta = tr.getMeta(aiSuggestionPluginKey);
            if (meta !== undefined) return meta;
            if (tr.docChanged) return null;
            return old;
          },
        },

        props: {
          decorations(state) {
            const current = currentSuggestion(state);
            if (!current) return DecorationSet.empty;
            const { deco } = current;
            return DecorationSet.create(state.doc, [deco]);
          },

          handleKeyDown(view, event) {
            const state = currentSuggestion(view.state);

            if (event.key === "Tab" && state) {
              event.preventDefault();
              const cursorPos = view.state.selection.$head.pos;
              view.dispatch(
                view.state.tr
                  .insertText(state.text, cursorPos)
                  .setMeta(aiSuggestionPluginKey, null),
              );
              clearPending();
              lastFetchText = "";
              return true;
            }

            if (event.key === "Escape" && state) {
              event.preventDefault();
              removeSuggestion(view);
              lastFetchText = "";
              return true;
            }

            return false;
          },
        },

        view(editorView) {
          const handleDocChange = () => {
            if (debounceTimer) clearTimeout(debounceTimer);

            const text = editorView.state.doc.textContent;
            if (text.length < 10) return;
            debounceTimer = setTimeout(() => {
              fetchSuggestion(editorView, text);
            }, extension.options.debounceMs);
          };

          editorView.dom.addEventListener("input", handleDocChange);

          return {
            destroy() {
              editorView.dom.removeEventListener("input", handleDocChange);
              clearPending();
            },
          };
        },
      }),
    ];
  },
});
