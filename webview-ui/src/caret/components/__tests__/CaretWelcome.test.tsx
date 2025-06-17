import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom"
import CaretWelcome from "../CaretWelcome"

// Mock the ExtensionStateContext
vi.mock("../../../context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		caretBanner: "mock-banner-url",
	}),
}))

describe("CaretWelcome", () => {
	it("renders welcome message", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		// 인사말이 표시되는지 확인
		expect(screen.getByText("안녕하세요! AI 개발 파트너, ^Caret입니다.")).toBeInTheDocument()

		// 캐치프레이즈가 표시되는지 확인
		expect(screen.getByText(/AI를 단순한 코드 생성기를 넘어/)).toBeInTheDocument()
	})

	it("calls onGetStarted when button is clicked", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		const startButton = screen.getByText("시작하기")
		fireEvent.click(startButton)

		expect(mockOnGetStarted).toHaveBeenCalledTimes(1)
	})

	it("displays education program section", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		expect(screen.getByText(/지금 바로 시작! 무료 '바이브 코딩' 교육/)).toBeInTheDocument()
	})

	it("displays education and Gemini offer section", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		expect(screen.getByText(/교육 프로그램 자세히 보기/)).toBeInTheDocument()
	})

	it("displays footer component", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		// Footer의 일부 텍스트가 렌더링되는지 확인
		expect(screen.getByText(/Caret v1.0.0/)).toBeInTheDocument()
	})

	it("should render the main banner", () => {
		const mockOnGetStarted = vi.fn()
		render(<CaretWelcome onGetStarted={mockOnGetStarted} />)

		const bannerImage = screen.getByAltText("Caret 대표 이미지")
		expect(bannerImage).toBeInTheDocument()
	})
})
