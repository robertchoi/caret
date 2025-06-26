import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { vi } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { PersonaTemplateSelector } from "../PersonaTemplateSelector"
import enCommon from "../../locale/en/common.json"
import koCommon from "../../locale/ko/common.json"
import enPersona from "../../locale/en/persona.json"
import koPersona from "../../locale/ko/persona.json"

// 테스트용 i18n 설정
i18n.use(initReactI18next).init({
	resources: {
		en: {
			common: enCommon,
			persona: enPersona,
		},
		ko: {
			common: koCommon,
			persona: koPersona,
		},
	},
	lng: "en",
	fallbackLng: "en",
	debug: false,
	interpolation: {
		escapeValue: false,
	},
	ns: ["common", "persona"],
	defaultNS: "common",
})
import { vscode } from "@/utils/vscode"

// Mock the vscode utility
vi.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

const mockOnClose = vi.fn()
const mockOnSelectPersona = vi.fn()

const mockCharacters = [
	{
		character: "sarang",
		avatarUri: "asset:/sarang.png",
		en: {
			name: "Sarang",
			description: "AI assistant",
			customInstruction: {
				persona: {
					name: "Sarang",
					nickname: "Sarang",
					type: "AI Assistant",
					inspiration: ["Test"],
				},
				language: {
					style: "Friendly",
					endings: ["!"],
					expressions: ["😊"],
				},
				emotion_style: {
					tone: "Warm",
					attitude: "Helpful",
					phrasing: "Clear",
					exclamations: ["Great!"],
				},
				behavior: {
					loyalty: "High",
					communication_focus: "Clarity",
					thought_process: ["Think first"],
				},
				signature_phrase: "Hello!",
			},
		},
		ko: {
			name: "사랑",
			description: "AI 비서",
			customInstruction: {
				persona: {
					name: "사랑",
					nickname: "사랑이",
					type: "AI 어시스턴트",
					inspiration: ["테스트"],
				},
				language: {
					style: "친근한",
					endings: ["~요"],
					expressions: ["😊"],
				},
				emotion_style: {
					tone: "따뜻한",
					attitude: "도움이 되는",
					phrasing: "명확한",
					exclamations: ["좋아요!"],
				},
				behavior: {
					loyalty: "높음",
					communication_focus: "명확성",
					thought_process: ["먼저 생각하기"],
				},
				signature_phrase: "안녕하세요!",
			},
		},
		introIllustrationUri: "",
		thinkingAvatarUri: "",
		isDefault: true,
	},
	{
		character: "ichika",
		avatarUri: "asset:/ichika.png",
		en: {
			name: "Ichika",
			description: "Code helper",
			customInstruction: {
				persona: {
					name: "Ichika",
					nickname: "Ichika",
					type: "Code Assistant",
					inspiration: ["Test"],
				},
				language: {
					style: "Technical",
					endings: ["."],
					expressions: ["💻"],
				},
				emotion_style: {
					tone: "Professional",
					attitude: "Precise",
					phrasing: "Technical",
					exclamations: ["Done!"],
				},
				behavior: {
					loyalty: "High",
					communication_focus: "Accuracy",
					thought_process: ["Analyze first"],
				},
				signature_phrase: "Let me help!",
			},
		},
		ko: {
			name: "이치카",
			description: "코드 도우미",
			customInstruction: {
				persona: {
					name: "이치카",
					nickname: "이치카",
					type: "코드 어시스턴트",
					inspiration: ["테스트"],
				},
				language: {
					style: "기술적인",
					endings: ["입니다"],
					expressions: ["💻"],
				},
				emotion_style: {
					tone: "전문적인",
					attitude: "정확한",
					phrasing: "기술적인",
					exclamations: ["완료!"],
				},
				behavior: {
					loyalty: "높음",
					communication_focus: "정확성",
					thought_process: ["먼저 분석하기"],
				},
				signature_phrase: "도와드릴게요!",
			},
		},
		introIllustrationUri: "",
		thinkingAvatarUri: "",
		isDefault: false,
	},
]

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe("PersonaTemplateSelector", () => {
	beforeEach(async () => {
		vi.clearAllMocks()
		await i18n.changeLanguage("en")

		// Mock window message listener
		window.postMessage = vi.fn()
		window.addEventListener = vi.fn((event, handler) => {
			if (event === "message") {
				const messageEvent = event as any
				if (messageEvent.data?.type === "RESPONSE_TEMPLATE_CHARACTERS") {
					;(handler as EventListener)(messageEvent)
				}
			}
		})
	})

	it("should render the selector and request characters on mount", async () => {
		const { container } = renderWithProviders(
			<PersonaTemplateSelector
				isOpen={true}
				onClose={mockOnClose}
				onSelectPersona={mockOnSelectPersona}
				currentLocale="en"
				testCharacters={mockCharacters}
			/>,
		)

		// When testCharacters are provided, it should NOT request characters
		// Only REQUEST_RULE_FILE_CONTENT should be called
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "REQUEST_RULE_FILE_CONTENT",
			payload: { ruleName: "custom_instructions.md", isGlobal: true },
		})

		// Should NOT call REQUEST_TEMPLATE_CHARACTERS when testCharacters are provided
		expect(vscode.postMessage).not.toHaveBeenCalledWith({
			type: "REQUEST_TEMPLATE_CHARACTERS",
		})

		// Wait for the component to render - check for the actual rendered text
		await waitFor(() => {
			expect(screen.getByText("AI Agent Template Character Settings")).toBeInTheDocument()
		})

		// Now characters should be rendered immediately since we passed them as props

		// Check if the default character (Sarang) is rendered
		await waitFor(
			() => {
				expect(screen.getByText("Sarang")).toBeInTheDocument()
			},
			{ timeout: 3000 },
		)

		// Check if character tabs are rendered
		expect(screen.getByLabelText("sarang tab")).toBeInTheDocument()
		expect(screen.getByLabelText("ichika tab")).toBeInTheDocument()

		// Click on ichika tab to see if it switches
		const ichikaTab = screen.getByLabelText("ichika tab")
		fireEvent.click(ichikaTab)

		// Now Ichika should be displayed
		await waitFor(() => {
			expect(screen.getByText("Ichika")).toBeInTheDocument()
		})
	})

	it("should call onSelectPersona with correct instruction when a character is selected", async () => {
		renderWithProviders(
			<PersonaTemplateSelector
				isOpen={true}
				onClose={mockOnClose}
				onSelectPersona={mockOnSelectPersona}
				currentLocale="en"
				testCharacters={mockCharacters}
			/>,
		)

		// Wait for the component to render - check for the actual rendered text
		await waitFor(() => {
			expect(screen.getByText("AI Agent Template Character Settings")).toBeInTheDocument()
		})

		// Wait for characters to render and find the button
		await waitFor(() => {
			expect(screen.getByText("Sarang")).toBeInTheDocument()
		})

		const selectButtons = screen.getAllByText("Select")

		fireEvent.click(selectButtons[0])

		// Check if onSelectPersona was called with the correct data
		expect(mockOnSelectPersona).toHaveBeenCalledWith({
			persona: {
				name: "Sarang",
				nickname: "Sarang",
				type: "AI Assistant",
				inspiration: ["Test"],
			},
			language: {
				style: "Friendly",
				endings: ["!"],
				expressions: ["😊"],
			},
			emotion_style: {
				tone: "Warm",
				attitude: "Helpful",
				phrasing: "Clear",
				exclamations: ["Great!"],
			},
			behavior: {
				loyalty: "High",
				communication_focus: "Clarity",
				thought_process: ["Think first"],
			},
			signature_phrase: "Hello!",
		})
		expect(mockOnClose).toHaveBeenCalled()
	})

	it("should call onClose when the close button is clicked", () => {
		renderWithProviders(
			<PersonaTemplateSelector
				isOpen={true}
				onClose={mockOnClose}
				onSelectPersona={mockOnSelectPersona}
				currentLocale="en"
			/>,
		)

		// Find the close button and click it
		const closeButton = screen.getByLabelText("Close")
		fireEvent.click(closeButton)
		expect(mockOnClose).toHaveBeenCalled()
	})
})
