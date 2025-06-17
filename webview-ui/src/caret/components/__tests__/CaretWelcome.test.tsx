import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import CaretWelcome from '../CaretWelcome'

describe('CaretWelcome', () => {
  test('renders welcome message', () => {
    render(<CaretWelcome />)
    
    // Caret 타이틀이 표시되는지 확인 (정확한 텍스트 매칭)
    expect(screen.getByText('^ Caret')).toBeInTheDocument()
    
    // 시작하기 버튼이 표시되는지 확인
    expect(screen.getByText('시작하기')).toBeInTheDocument()
  })

  test('calls onGetStarted when button is clicked', () => {
    const mockOnGetStarted = vi.fn()
    render(<CaretWelcome onGetStarted={mockOnGetStarted} />)
    
    const startButton = screen.getByText('시작하기')
    fireEvent.click(startButton)
    
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1)
  })

  test('displays education program section', () => {
    render(<CaretWelcome />)
    
    // 교육 프로그램 섹션이 표시되는지 확인 (첫 번째 매칭 요소만 확인)
    const educationElements = screen.getAllByText(/바이브 코딩/)
    expect(educationElements.length).toBeGreaterThan(0)
    expect(educationElements[0]).toBeInTheDocument()
  })

  test('displays Google Gemini offer section', () => {
    render(<CaretWelcome />)
    
    // Google Gemini 제안 섹션이 표시되는지 확인 (특정 헤더 텍스트로 정확히 매칭)
    expect(screen.getByText('✨ Google Gemini 시작 특별 제안!')).toBeInTheDocument()
  })
}) 