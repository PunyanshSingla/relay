"use client";

import type { Editor } from "@tiptap/react";
import React, { useState, useEffect, use } from "react";

export interface ToolbarContextProps {
	editor: Editor;
}

const ToolbarContext = React.createContext<ToolbarContextProps | null>(
	null,
);

interface ToolbarProviderProps {
	editor: Editor;
	children: React.ReactNode;
}

export const ToolbarProvider = ({ editor, children }: ToolbarProviderProps) => {
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		const handler = () => forceUpdate((n) => n + 1);
		editor.on("transaction", handler);
		return () => {
			editor.off("transaction", handler);
		};
	}, [editor]);

	return (
		<ToolbarContext.Provider value={{ editor }}>
			{children}
		</ToolbarContext.Provider>
	);
};

export const useToolbar = () => {
	const context = use(ToolbarContext);

	if (!context) {
		throw new Error("useToolbar must be used within a ToolbarProvider");
	}

	return context;
};
