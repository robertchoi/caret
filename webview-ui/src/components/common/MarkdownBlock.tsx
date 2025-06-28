import React, { memo, useEffect, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { useRemark } from "react-remark"
import rehypeHighlight, { Options } from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"
import styled from "styled-components"
import { visit } from "unist-util-visit"
import type { Node } from "unist"
import { useExtensionState } from "@/context/ExtensionStateContext"
import CodeBlock, { CODE_BLOCK_BG_COLOR } from "@/components/common/CodeBlock"
import MermaidBlock from "@/components/common/MermaidBlock"
import { WithCopyButton } from "./CopyButton"
import { StateServiceClient } from "@/services/grpc-client"
// CARET MODIFICATION: Chatbot/Agent 용어 통일 - PlanActMode 제거
import { ChatbotAgentMode, ToggleChatbotAgentModeRequest } from "@shared/proto/state"

// CARET MODIFICATION: Chatbot/Agent 일관성 있는 UI 구현
// Ask 모드 강조 컴포넌트 - 💬 Expert Consultation
const ChatBotModeHighlight: React.FC = () => (
	<span
		onClick={() => {
			StateServiceClient.toggleChatbotAgentMode(
				ToggleChatbotAgentModeRequest.create({
					chatSettings: {
						// CARET MODIFICATION: Chatbot/Agent 통일 - Chatbot 모드로 변경
						mode: ChatbotAgentMode.CHATBOT_MODE,
					},
				}),
			)
		}}
		title="Switch to Ask Mode - Expert Consultation"
		className="text-[var(--vscode-textLink-foreground)] hover:opacity-90 cursor-pointer inline-flex items-center gap-1">
		<div className="p-1 rounded-[12px] bg-[var(--vscode-editor-background)] flex items-center justify-start w-4 border-[1px] border-[var(--vscode-input-border)]">
			<div className="rounded-full bg-[var(--vscode-textLink-foreground)] w-2 h-2" />
		</div>
		💬 Ask Mode (⌘⇧P)
	</span>
)

// Agent 모드 강조 컴포넌트 - 🤖 Collaborative Development
const AgentModeHighlight: React.FC = () => (
	<span
		onClick={() => {
			StateServiceClient.toggleChatbotAgentMode(
				ToggleChatbotAgentModeRequest.create({
					chatSettings: {
						// CARET MODIFICATION: Chatbot/Agent 통일 - Agent 모드로 변경
						mode: ChatbotAgentMode.AGENT_MODE,
					},
				}),
			)
		}}
		title="Switch to Agent Mode - Collaborative Development"
		className="text-[var(--vscode-textLink-foreground)] hover:opacity-90 cursor-pointer inline-flex items-center gap-1">
		<div className="p-1 rounded-[12px] bg-[var(--vscode-editor-background)] flex items-center justify-end w-4 border-[1px] border-[var(--vscode-input-border)]">
			<div className="rounded-full bg-[var(--vscode-textLink-foreground)] w-2 h-2" />
		</div>
		🤖 Agent Mode (⌘⇧A)
	</span>
)

// CARET MODIFICATION: Chatbot/Agent 일관성 있는 텍스트 처리
const transformChatbotAgentText = (text: string, mode: "chatbot" | "agent"): string => {
	// Chatbot/Agent 용어로 통일된 텍스트 변환
	if (mode === "chatbot") {
		// Ask 모드 관련 텍스트 변환
		return text
			.replace(/PLAN MODE/gi, "ASK MODE")
			.replace(/Plan Mode/gi, "Ask Mode")
			.replace(/plan mode/gi, "ask mode")
			.replace(/switch.*to.*act.*mode/gi, "switch to Agent mode")
			.replace(/toggle.*to.*act.*mode/gi, "toggle to Agent mode")
	} else {
		// Agent 모드 관련 텍스트 변환
		return text
			.replace(/ACT MODE/gi, "AGENT MODE")
			.replace(/Act Mode/gi, "Agent Mode")
			.replace(/act mode/gi, "agent mode")
			.replace(/switch.*to.*plan.*mode/gi, "switch to Ask mode")
			.replace(/toggle.*to.*plan.*mode/gi, "toggle to Ask mode")
	}
}

/**
 * Custom remark plugin that converts plain URLs in text into clickable links
 *
 * The original bug: We were converting text nodes into paragraph nodes,
 * which broke the markdown structure because text nodes should remain as text nodes
 * within their parent elements (like paragraphs, list items, etc.).
 * This caused the entire content to disappear because the structure became invalid.
 */
const remarkUrlToLink = () => {
	return (tree: Node) => {
		// Visit all "text" nodes in the markdown AST (Abstract Syntax Tree)
		visit(tree, "text", (node: any, index, parent) => {
			const urlRegex = /https?:\/\/[^\s<>)"]+/g
			const matches = node.value.match(urlRegex)
			if (!matches) return

			const parts = node.value.split(urlRegex)
			const children: any[] = []

			parts.forEach((part: string, i: number) => {
				if (part) children.push({ type: "text", value: part })
				if (matches[i]) {
					children.push({
						type: "link",
						url: matches[i],
						children: [{ type: "text", value: matches[i] }],
					})
				}
			})

			// Fix: Instead of converting the node to a paragraph (which broke things),
			// we replace the original text node with our new nodes in the parent's children array.
			// This preserves the document structure while adding our links.
			if (parent) {
				parent.children.splice(index, 1, ...children)
			}
		})
	}
}

/**
 * Custom remark plugin that highlights "to Agent Mode" mentions and adds keyboard shortcut hint
 * CARET MODIFICATION: Updated from Act Mode to Agent Mode for Chatbot/Agent system
 */
const remarkHighlightAgentMode = () => {
	return (tree: Node) => {
		visit(tree, "text", (node: any, index, parent) => {
			// Case-insensitive regex to match "to Agent Mode" in various capitalizations
			// Using word boundaries to avoid matching within words
			// Added negative lookahead to avoid matching if already followed by the shortcut
			const agentModeRegex = /\bto\s+Agent\s+Mode\b(?!\s*\(⌘⇧A\))/i

			if (!node.value.match(agentModeRegex)) return

			// Split the text by the matches
			const parts = node.value.split(agentModeRegex)
			const matches = node.value.match(agentModeRegex)

			if (!matches || parts.length <= 1) return

			const children: any[] = []

			parts.forEach((part: string, i: number) => {
				// Add the text before the match
				if (part) children.push({ type: "text", value: part })

				// Add the match, but only make "Agent Mode" bold (not the "to" part)
				if (matches[i]) {
					// Extract "to" and "Agent Mode" parts
					const matchText = matches[i]
					const toIndex = matchText.toLowerCase().indexOf("to")
					const agentModeIndex = matchText.toLowerCase().indexOf("agent mode", toIndex + 2)

					if (toIndex !== -1 && agentModeIndex !== -1) {
						// Add "to" as regular text
						const toPart = matchText.substring(toIndex, agentModeIndex).trim()
						children.push({ type: "text", value: toPart + " " })

						// Add "Agent Mode" as bold with keyboard shortcut
						const agentModePart = matchText.substring(agentModeIndex)
						children.push({
							type: "strong",
							children: [{ type: "text", value: `${agentModePart} (⌘⇧A)` }],
						})
					} else {
						// Fallback if we can't parse it correctly
						children.push({ type: "text", value: matchText + " " })
						children.push({
							type: "strong",
							children: [{ type: "text", value: `(⌘⇧A)` }],
						})
					}
				}
			})

			// Replace the original text node with our new nodes
			if (parent) {
				parent.children.splice(index, 1, ...children)
			}
		})
	}
}

/**
 * Custom remark plugin that prevents filenames with extensions from being parsed as bold text
 * For example: __init__.py should not be rendered as bold "init" followed by ".py"
 * Solves https://github.com/cline/cline/issues/1028
 */
const remarkPreventBoldFilenames = () => {
	return (tree: any) => {
		visit(tree, "strong", (node: any, index: number | undefined, parent: any) => {
			// Only process if there's a next node (potential file extension)
			if (!parent || typeof index === "undefined" || index === parent.children.length - 1) return

			const nextNode = parent.children[index + 1]

			// Check if next node is text and starts with . followed by extension
			if (nextNode.type !== "text" || !nextNode.value.match(/^\.[a-zA-Z0-9]+/)) return

			// If the strong node has multiple children, something weird is happening
			if (node.children?.length !== 1) return

			// Get the text content from inside the strong node
			const strongContent = node.children?.[0]?.value
			if (!strongContent || typeof strongContent !== "string") return

			// Validate that the strong content is a valid filename
			if (!strongContent.match(/^[a-zA-Z0-9_-]+$/)) return

			// Combine into a single text node
			const newNode = {
				type: "text",
				value: `__${strongContent}__${nextNode.value}`,
			}

			// Replace both nodes with the combined text node
			parent.children.splice(index, 2, newNode)
		})
	}
}

const StyledMarkdown = styled.div`
	pre {
		background-color: ${CODE_BLOCK_BG_COLOR};
		border-radius: 3px;
		margin: 13px 0;
		padding: 10px 10px;
		max-width: calc(100vw - 20px);
		overflow-x: auto;
		overflow-y: hidden;
		padding-right: 70px;
	}

	pre > code {
		.hljs-deletion {
			background-color: var(--vscode-diffEditor-removedTextBackground);
			display: inline-block;
			width: 100%;
		}
		.hljs-addition {
			background-color: var(--vscode-diffEditor-insertedTextBackground);
			display: inline-block;
			width: 100%;
		}
	}

	code {
		span.line:empty {
			display: none;
		}
		word-wrap: break-word;
		border-radius: 3px;
		background-color: ${CODE_BLOCK_BG_COLOR};
		font-size: var(--vscode-editor-font-size, var(--vscode-font-size, 12px));
		font-family: var(--vscode-editor-font-family);
	}

	code:not(pre > code) {
		font-family: var(--vscode-editor-font-family, monospace);
		color: var(--vscode-textPreformat-foreground, #f78383);
		background-color: var(--vscode-textCodeBlock-background, #1e1e1e);
		padding: 0px 2px;
		border-radius: 3px;
		border: 1px solid var(--vscode-textSeparator-foreground, #424242);
		white-space: pre-line;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	/* KaTeX styling */
	.katex {
		font-size: 1.1em;
		color: var(--vscode-editor-foreground);
		font-family: KaTeX_Main, "Times New Roman", serif;
		line-height: 1.2;
		white-space: normal;
		text-indent: 0;
	}

	.katex-display {
		display: block;
		margin: 1em 0;
		text-align: center;
		padding: 0.5em;
		overflow-x: auto;
		overflow-y: hidden;
		background-color: var(--vscode-textCodeBlock-background);
		border-radius: 3px;
	}

	.katex-error {
		color: var(--vscode-errorForeground);
		border: 1px solid var(--vscode-inputValidation-errorBorder);
		padding: 8px;
		border-radius: 3px;
	}

	font-family:
		var(--vscode-font-family),
		system-ui,
		-apple-system,
		BlinkMacSystemFont,
		"Segoe UI",
		Roboto,
		Oxygen,
		Ubuntu,
		Cantarell,
		"Open Sans",
		"Helvetica Neue",
		sans-serif;
	font-size: var(--vscode-font-size, 13px);

	p,
	li,
	ol,
	ul {
		line-height: 1.25;
	}

	ol,
	ul {
		padding-left: 2.5em;
		margin-left: 0;
	}

	p {
		white-space: pre-wrap;
	}

	a {
		text-decoration: none;
	}
	a {
		&:hover {
			text-decoration: underline;
		}
	}

	// CARET MODIFICATION: Chatbot/Agent 모드 텍스트 스타일링
	.ask-mode-text {
		color: var(--vscode-textLink-foreground);
		font-weight: 500;
	}

	.agent-mode-text {
		color: var(--vscode-textLink-foreground);
		font-weight: 500;
	}
`

const StyledPre = styled.pre<{ theme: any }>`
	& .hljs {
		color: var(--vscode-editor-foreground, #fff);
	}

	${(props) =>
		Object.keys(props.theme)
			.map((key, index) => {
				return `
      & ${key} {
        color: ${props.theme[key]};
      }
    `
			})
			.join("")}
`

const PreWithCopyButton = ({
	children,
	theme,
	...preProps
}: { theme: Record<string, string> } & React.HTMLAttributes<HTMLPreElement>) => {
	const preRef = useRef<HTMLPreElement>(null)

	const handleCopy = () => {
		if (preRef.current) {
			const codeElement = preRef.current.querySelector("code")
			const textToCopy = codeElement ? codeElement.textContent : preRef.current.textContent

			if (!textToCopy) return
			return textToCopy
		}
		return null
	}

	const styledPreProps = theme ? { ...preProps, theme } : preProps

	return (
		<WithCopyButton onCopy={handleCopy} position="top-right" ariaLabel="Copy code">
			<StyledPre {...styledPreProps} ref={preRef}>
				{children}
			</StyledPre>
		</WithCopyButton>
	)
}

interface MarkdownBlockProps {
	markdown?: string
	highlightOptions?: any
	className?: string
}

const MarkdownBlock = memo(({ markdown, highlightOptions = {}, className }: MarkdownBlockProps) => {
	const { chatSettings } = useExtensionState()
	const [processedMarkdown, setProcessedMarkdown] = useState(markdown)

	useEffect(() => {
		// CARET MODIFICATION: Chatbot/Agent 일관성 있는 텍스트 변환
		const transformedText = transformChatbotAgentText(markdown || "", chatSettings.mode)
		setProcessedMarkdown(transformedText)
	}, [markdown, chatSettings.mode])

	// CARET MODIFICATION: Chatbot/Agent 모드별 동적 강조 표시
	const processMarkdownForChatbotAgent = (content: string): string => {
		const isInChatbotMode = chatSettings.mode === "chatbot"

		// Ask 모드에 있을 때 Agent 모드로 전환 안내
		if (isInChatbotMode) {
			content = content.replace(
				/(switch to|toggle to|change to)\s*(agent|act)\s*mode/gi,
				(match) => `<ChatBotModeHighlight>${match}</ChatBotModeHighlight>`,
			)
		} else {
			// Agent 모드에 있을 때 Ask 모드로 전환 안내
			content = content.replace(
				/(switch to|toggle to|change to)\s*(ask|plan)\s*mode/gi,
				(match) => `<AgentModeHighlight>${match}</AgentModeHighlight>`,
			)
		}

		return content
	}

	const { theme } = useExtensionState()

	const [reactContent, setMarkdown] = useRemark({
		remarkPlugins: [
			remarkPreventBoldFilenames,
			remarkUrlToLink,
			remarkHighlightAgentMode,
			remarkMath,
			() => {
				return (tree) => {
					visit(tree, "code", (node: any) => {
						if (!node.lang) {
							node.lang = "javascript"
						} else if (node.lang.includes(".")) {
							node.lang = node.lang.split(".").slice(-1)[0]
						}
					})
				}
			},
		],
		rehypePlugins: [
			rehypeHighlight as any,
			{
				// languages: {},
			} as Options,
			rehypeKatex,
		],
		rehypeReactOptions: {
			components: {
				pre: ({ children, ...preProps }: React.HTMLAttributes<HTMLPreElement>) => {
					if (Array.isArray(children) && children.length === 1 && React.isValidElement(children[0])) {
						const child = children[0] as React.ReactElement<{ className?: string }>
						if (child.props?.className?.includes("language-mermaid")) {
							return child
						}
					}
					return (
						<PreWithCopyButton {...preProps} theme={theme || {}}>
							{children}
						</PreWithCopyButton>
					)
				},
				code: (props: ComponentProps<"code">) => {
					const className = props.className || ""
					if (className.includes("language-mermaid")) {
						const codeText = String(props.children || "")
						return <MermaidBlock code={codeText} />
					}
					return <code {...props} />
				},
				strong: (props: ComponentProps<"strong">) => {
					// Check if this is an "Agent Mode" strong element by looking for the keyboard shortcut
					// Handle both string children and array of children cases
					const childrenText = React.Children.toArray(props.children)
						.map((child) => {
							if (typeof child === "string") return child
							if (typeof child === "object" && "props" in child && child.props.children)
								return String(child.props.children)
							return ""
						})
						.join("")

					// Case-insensitive check for "Agent Mode (⌘⇧A)" pattern
					// This ensures we only style the exact "Agent Mode" mentions with keyboard shortcut
					// Using case-insensitive flag to catch all capitalization variations
					if (/^agent mode\s*\(⌘⇧A\)$/i.test(childrenText)) {
						return <AgentModeHighlight />
					}

					return <strong {...props} />
				},
			},
		},
	})

	useEffect(() => {
		setMarkdown(processedMarkdown || "")
	}, [processedMarkdown, setMarkdown, theme])

	return (
		<StyledMarkdown
			className={`markdown-block ph-no-capture ${className || ""}`}
			data-chatbot-agent-mode={chatSettings.mode === "chatbot" ? "chatbot" : "agent"}>
			{reactContent}
		</StyledMarkdown>
	)
})

MarkdownBlock.displayName = "MarkdownBlock"

export default MarkdownBlock
