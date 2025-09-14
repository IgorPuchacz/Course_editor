import React, { useRef, useEffect, useState } from 'react';
import { TextFormattingToolbar } from './TextFormattingToolbar';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const savedSelectionRef = useRef<Range | null>(null);
  const isFormattingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = content;
      setIsInitialized(true);
      
      // Set cursor to end of content after initialization
      setTimeout(() => {
        if (editorRef.current) {
          const range = document.createRange();
          const selection = window.getSelection();
          
          // Move cursor to the end of the content
          range.selectNodeContents(editorRef.current);
          range.collapse(false); // false = collapse to end
          
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [content, isInitialized]);

  // Save current selection
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      savedSelectionRef.current = range;
      return range;
    }
    return null;
  };

  // Restore saved selection
  const restoreSelection = () => {
    const selection = window.getSelection();
    const range = savedSelectionRef.current;
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }
    return false;
  };
  const handleInput = () => {
    if (editorRef.current) {
      console.log('Rich text content updated:', editorRef.current.innerHTML);
      const content = editorRef.current.innerHTML;
      const cleanedHTML = cleanHTML(content);
      console.log('Cleaned HTML:', cleanedHTML);
      onChange(cleanedHTML);
      
      // Preserve cursor position after content update
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  const cleanHTML = (html: string): string => {
    // Remove unnecessary attributes and clean up the HTML
    let cleaned = html
      .replace(/style="[^"]*"/g, (match) => {
        // Keep only color styles and other important formatting
        const colorMatch = match.match(/color:\s*([^;]+)/);
        const fontWeightMatch = match.match(/font-weight:\s*([^;]+)/);
        const fontStyleMatch = match.match(/font-style:\s*([^;]+)/);
        const textDecorationMatch = match.match(/text-decoration:\s*([^;]+)/);
        
        let styles = [];
        if (colorMatch) styles.push(`color: ${colorMatch[1]}`);
        if (fontWeightMatch) styles.push(`font-weight: ${fontWeightMatch[1]}`);
        if (fontStyleMatch) styles.push(`font-style: ${fontStyleMatch[1]}`);
        if (textDecorationMatch) styles.push(`text-decoration: ${textDecorationMatch[1]}`);
        
        return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
      })
      .replace(/\s+style=""/g, '') // Remove empty style attributes
      .replace(/<div>/g, '<p>') // Convert divs to paragraphs
      .replace(/<\/div>/g, '</p>');
    
    return cleaned;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold');
    }
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      applyFormat('italic');
    }
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      applyFormat('underline');
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    
    // Don't hide toolbar if we're in the middle of formatting
    if (isFormattingRef.current) {
      return;
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // Check if selection is within our editor
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setShowToolbar(false);
        return;
      }

      const rect = range.getBoundingClientRect();

      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100
      });
      setShowToolbar(true);
      saveSelection();
    } else {
      setShowToolbar(false);
      savedSelectionRef.current = null;
    }
  };

  // Handle clicks outside editor to hide toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideEditor = editorRef.current && !editorRef.current.contains(target);
      const isOutsideToolbar = toolbarRef.current && !toolbarRef.current.contains(target);
      
      if (isOutsideEditor && isOutsideToolbar) {
        setShowToolbar(false);
        savedSelectionRef.current = null;
        isFormattingRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const applyFormat = (command: string, value?: string) => {
    isFormattingRef.current = true;

    // ensure the editor keeps focus
    editorRef.current?.focus({ preventScroll: true });

    // restore previous selection so formatting applies to the same range
    restoreSelection();

    // apply command
    document.execCommand(command, false, value);

    // keep selection and toolbar
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();

      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setToolbarPosition({
          top: rect.top - 50,
          left: rect.left + (rect.width / 2) - 100,
        });
      }
    }

    // update content after formatting
    if (editorRef.current) {
      const cleaned = cleanHTML(editorRef.current.innerHTML);
      onChange(cleaned);
    }

    setShowToolbar(true);
    isFormattingRef.current = false;
  };

  // Handle focus events to maintain selection
  const handleFocus = () => {
    if (savedSelectionRef.current && !isFormattingRef.current) {
      setTimeout(() => {
        restoreSelection();
      }, 10);
    }
  };

  // Handle click to position cursor correctly
  const handleClick = (e: React.MouseEvent) => {
    // Allow normal cursor positioning on click
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        savedSelectionRef.current = range.cloneRange();
      }
    }, 0);
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={handleClick}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={`w-full h-full p-3 outline-none overflow-auto border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent rich-text-content ${className}`}
        style={{ minHeight: '120px' }}
        suppressContentEditableWarning={true}
      />

      <TextFormattingToolbar
        ref={toolbarRef}
        onFormat={applyFormat}
        position={toolbarPosition}
        visible={showToolbar}
        onToolbarInteraction={() => {
          isFormattingRef.current = true;
        }}
      />
    </div>
  );
};