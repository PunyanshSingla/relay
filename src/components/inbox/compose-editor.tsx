"use client";

import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { useEditor, EditorContent, type Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { ImageExtension } from "@/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/tiptap/extensions/image-placeholder";
import SearchAndReplace from "@/components/tiptap/extensions/search-and-replace";
import { AiSuggestion } from "@/components/tiptap/extensions/ai-suggestion";
import { SpellChecker } from "@/components/tiptap/extensions/spell-checker";
import { EditorToolbar } from "@/components/tiptap/toolbars/editor-toolbar";
import { AiToolbar } from "@/components/tiptap/toolbars/ai-toolbar";
import "@/components/tiptap/tiptap.css";

const baseExtensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: { class: "list-decimal" },
    },
    bulletList: {
      HTMLAttributes: { class: "list-disc" },
    },
    heading: { levels: [1, 2, 3] },
  }),
  Placeholder.configure({
    emptyNodeClass: "is-editor-empty",
    placeholder: "Write your message...",
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "text-primary underline cursor-pointer" },
  }),
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  SearchAndReplace,
];

export interface ComposeEditorRef {
  getHTML: () => string;
  setContent: (html: string) => void;
  focus: () => void;
  clear: () => void;
}

interface ComposeEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  emailContext?: {
    subject?: string;
    to?: string;
    thread?: string;
  };
}

export const ComposeEditor = forwardRef<ComposeEditorRef, ComposeEditorProps>(
  function ComposeEditor({ content = "", onChange, emailContext }, ref) {
    const isRemoteUpdate = useRef(false);
    const contextRef = useRef(emailContext);
    contextRef.current = emailContext;

    const extensions = useMemo(
      () =>
        [
          ...baseExtensions,
          AiSuggestion.configure({
            debounceMs: 300,
            getContext: () => contextRef.current ?? {},
          }),
          SpellChecker.configure({
            dictionaryDebounceMs: 100,
            aiRankDebounceMs: 500,
          }),
        ] as Extension[],
      [],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions,
      content,
      editorProps: {
        attributes: {
          class: "max-w-full focus:outline-none min-h-[200px] px-4 py-3",
        },
      },
      onUpdate: ({ editor }) => {
        if (!isRemoteUpdate.current) {
          onChange?.(editor.getHTML());
        }
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      setContent: (html: string) => {
        if (editor) {
          isRemoteUpdate.current = true;
          editor.commands.setContent(html);
          isRemoteUpdate.current = false;
        }
      },
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
    }));

    if (!editor) return null;

    return (
      <div className="compose-editor flex flex-col rounded-md border border-border overflow-hidden">
        <EditorToolbar editor={editor}>
          <AiToolbar editor={editor} context={emailContext} />
        </EditorToolbar>
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>
    );
  }
);
