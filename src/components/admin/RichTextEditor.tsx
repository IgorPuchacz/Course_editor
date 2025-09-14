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
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [isFormattingActive, setIsFormattingActive] = useState(false);
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
      setSavedSelection(range);
      return range;
    }
    return null;
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        return true;
      }
    }
    return false;
  };
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const cleanedHTML = cleanHTML(content);
      onChange(cleanedHTML);

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setSavedSelection(range.cloneRange());
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
    if (isFormattingActive) {
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
      setSavedSelection(null);
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
        setSavedSelection(null);
        setIsFormattingActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;

    setIsFormattingActive(true);
    editorRef.current.focus({ preventScroll: true });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setIsFormattingActive(false);
      return;
    }

    const range = selection.getRangeAt(0);
    setSavedSelection(range.cloneRange());

    try {
      const executed = document.execCommand(command, false, value);

      // Safari may return false without throwing; apply fallback styling
      if (!executed && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
        const wrapper = document.createElement('span');
        switch (command) {
          case 'bold':
            wrapper.style.fontWeight = 'bold';
            break;
          case 'italic':
            wrapper.style.fontStyle = 'italic';
            break;
          case 'underline':
            wrapper.style.textDecoration = 'underline';
            break;
          case 'foreColor':
            if (value) wrapper.style.color = value;
            break;
        }
        range.surroundContents(wrapper);
      }
    } catch {
      // ignore errors to prevent Safari from crashing
    }

    // Restore selection and keep toolbar/focus
    requestAnimationFrame(() => {
      restoreSelection();
      editorRef.current?.focus({ preventScroll: true });
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setToolbarPosition({
            top: rect.top - 50,
            left: rect.left + rect.width / 2 - 100,
          });
        }
      }
      setShowToolbar(true);
      setIsFormattingActive(false);
    });
  };

  // Handle focus events to maintain selection
  const handleFocus = () => {
    if (savedSelection && !isFormattingActive) {
      setTimeout(() => {
        restoreSelection();
      }, 10);
    }
  };

  // Handle click to position cursor correctly
  const handleClick = () => {
    // Allow normal cursor positioning on click
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setSavedSelection(range.cloneRange());
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
        onToolbarInteraction={() => setIsFormattingActive(true)}
      />
    </div>
  );
};