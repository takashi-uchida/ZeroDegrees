import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchInput from '../SearchInput';

describe('SearchInput', () => {
  const mockOnChange = jest.fn();
  const mockOnTargetTypeChange = jest.fn();
  const mockOnSearch = jest.fn();

  const defaultProps = {
    value: '',
    targetType: 'any' as const,
    isSearching: false,
    onChange: mockOnChange,
    onTargetTypeChange: mockOnTargetTypeChange,
    onSearch: mockOnSearch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input validation', () => {
    it('shows error when submitting with whitespace only', () => {
      render(<SearchInput {...defaultProps} value="   " />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(screen.getByText('Please describe your challenge')).toBeInTheDocument();
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('shows error when input is too short', () => {
      render(<SearchInput {...defaultProps} value="short" />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(screen.getByText('Please provide more detail (at least 10 characters)')).toBeInTheDocument();
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('shows error when input is too long', () => {
      const longText = 'a'.repeat(501);
      render(<SearchInput {...defaultProps} value={longText} />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(screen.getByText('Please keep it under 500 characters')).toBeInTheDocument();
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('allows submission with valid input', () => {
      const validText = 'I want to start an AI company';
      render(<SearchInput {...defaultProps} value={validText} />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(mockOnSearch).toHaveBeenCalled();
    });

    it('clears validation error when user types', () => {
      render(<SearchInput {...defaultProps} value="short" />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(screen.getByText('Please provide more detail (at least 10 characters)')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Describe the challenge/);
      fireEvent.change(textarea, { target: { value: 'New text that is long enough' } });
      expect(screen.queryByText('Please provide more detail (at least 10 characters)')).not.toBeInTheDocument();
    });
  });

  describe('Refinement suggestions', () => {
    it('shows refinement suggestions for short input', () => {
      render(<SearchInput {...defaultProps} value="I need help" />);
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/Add more context/)).toBeInTheDocument();
    });

    it('suggests adding industry when not mentioned', () => {
      render(<SearchInput {...defaultProps} value="I want to start a company" />);
      expect(screen.getByText(/Consider adding your industry/)).toBeInTheDocument();
    });

    it('does not suggest industry when variations are mentioned', () => {
      render(<SearchInput {...defaultProps} value="I work in the tech industry and want to grow" />);
      expect(screen.queryByText(/Consider adding your industry/)).not.toBeInTheDocument();
    });

    it('suggests adding stage when not mentioned', () => {
      render(<SearchInput {...defaultProps} value="I want to grow my business" />);
      expect(screen.getByText(/Mention your current stage/)).toBeInTheDocument();
    });

    it('does not suggest stage when variations are mentioned', () => {
      render(<SearchInput {...defaultProps} value="I am at early-stage and need help" />);
      expect(screen.queryByText(/Mention your current stage/)).not.toBeInTheDocument();
    });

    it('does not show refinements when input is empty', () => {
      render(<SearchInput {...defaultProps} value="" />);
      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('Target type selection', () => {
    it('renders all target type options', () => {
      render(<SearchInput {...defaultProps} />);
      expect(screen.getByText('Future Self')).toBeInTheDocument();
      expect(screen.getByText('Comrade')).toBeInTheDocument();
      expect(screen.getByText('Guide')).toBeInTheDocument();
      expect(screen.getByText('Any path')).toBeInTheDocument();
    });

    it('highlights selected target type', () => {
      render(<SearchInput {...defaultProps} targetType="future_self" />);
      const futureSelButton = screen.getByText('Future Self').closest('button');
      expect(futureSelButton).toHaveClass('border-sky-300/40');
    });

    it('calls onTargetTypeChange when option is clicked', () => {
      render(<SearchInput {...defaultProps} />);
      const comradeButton = screen.getByText('Comrade').closest('button');
      fireEvent.click(comradeButton!);
      expect(mockOnTargetTypeChange).toHaveBeenCalledWith('comrade');
    });
  });

  describe('Example prompts', () => {
    it('renders example prompts', () => {
      render(<SearchInput {...defaultProps} />);
      expect(screen.getByText('AI SaaS founder')).toBeInTheDocument();
      expect(screen.getByText('Operator to founder')).toBeInTheDocument();
      expect(screen.getByText('Japan to global')).toBeInTheDocument();
    });

    it('fills input when example is clicked', () => {
      render(<SearchInput {...defaultProps} />);
      const exampleButton = screen.getByText('AI SaaS founder').closest('button');
      fireEvent.click(exampleButton!);
      expect(mockOnChange).toHaveBeenCalledWith(
        'I want to start an AI SaaS company but I still do not have a technical co-founder.'
      );
    });
  });

  describe('Loading state', () => {
    it('shows loading animation when searching', () => {
      render(<SearchInput {...defaultProps} isSearching={true} />);
      expect(screen.getByText(/Calculating your path/)).toBeInTheDocument();
      expect(screen.getByText('This may take a moment')).toBeInTheDocument();
    });

    it('hides form when searching', () => {
      render(<SearchInput {...defaultProps} isSearching={true} />);
      expect(screen.queryByText('Describe the gap you are trying to cross.')).not.toBeInTheDocument();
    });

    it('cycles through destiny messages', async () => {
      jest.useFakeTimers();
      render(<SearchInput {...defaultProps} isSearching={true} />);
      
      expect(screen.getByText(/Calculating your path/)).toBeInTheDocument();
      
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(screen.getByText(/Mapping the constellation|Tracing the threads|Discovering hidden bridges|Aligning the stars/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Form submission', () => {
    it('shows validation error when clicking button with empty input', () => {
      render(<SearchInput {...defaultProps} value="" />);
      const button = screen.getByText('Calculate your destiny');
      fireEvent.click(button);
      expect(screen.getByText('Please describe your challenge')).toBeInTheDocument();
    });

    it('allows submission when input has valid value', () => {
      render(<SearchInput {...defaultProps} value="I need help with something" />);
      const button = screen.getByText('Calculate your destiny');
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(mockOnSearch).toHaveBeenCalled();
    });

    it('calls onChange when textarea value changes', () => {
      render(<SearchInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Describe the challenge/);
      fireEvent.change(textarea, { target: { value: 'New challenge' } });
      expect(mockOnChange).toHaveBeenCalledWith('New challenge');
    });
  });
});
