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
      console.log('Rich text content updated:', editorRef.current.innerHTML);
      const content = editorRef.current.innerHTML;
      const cleanedHTML = cleanHTML(content);
      console.log('Cleaned HTML:', cleanedHTML);
      onChange(cleanedHTML);
      
      // Preserve cursor position after content update
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
    console.log('Applying format:', command, value);
    
    // Prevent menu from hiding during formatting
    setIsFormattingActive(true);

    // Critical: Ensure editor has focus FIRST
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Verify focus was actually set
      if (document.activeElement !== editorRef.current) {
        console.warn('Failed to focus editor');
        setIsFormattingActive(false);
        return;
      }
    }

    // Restore selection with validation
    if (savedSelection && savedSelection.startContainer && savedSelection.endContainer) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          const clonedRange = savedSelection.cloneRange();
          selection.addRange(clonedRange);
          console.log('Selection restored for formatting');
          
          // Verify selection was restored
          if (selection.isCollapsed) {
            console.warn('Selection collapsed after restoration');
          }
        } catch (error) {
          console.error('Failed to restore selection:', error);
          setIsFormattingActive(false);
          return;
        }
      }
    } else {
      console.warn('No valid saved selection to restore');
      setIsFormattingActive(false);
      return;
    }

    // Execute formatting with proper error handling
    const executeFormatting = () => {
      try {
        // Ensure we still have focus
        if (document.activeElement !== editorRef.current) {
          editorRef.current?.focus();
        }
        
        // Apply the formatting command
        const success = document.execCommand(command, false, value);
        console.log('Format command executed:', command, 'success:', success);
        
        if (!success) {
          console.error('execCommand failed for:', command);
        }
        
        if (editorRef.current) {
          // Force content update
          const content = editorRef.current.innerHTML;
          console.log('Content after formatting:', content);
          
          // Trigger change event
          const event = new Event('input', { bubbles: true });
          editorRef.current.dispatchEvent(event);
          onChange(content);
          
          // Save or restore the selection after formatting
          const newSelection = window.getSelection();
          if (newSelection && newSelection.rangeCount > 0 && !newSelection.isCollapsed) {
            const newRange = newSelection.getRangeAt(0);
            setSavedSelection(newRange.cloneRange());

            // Update toolbar position if selection has dimensions
            const rect = newRange.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setToolbarPosition({
                top: rect.top - 50,
                left: rect.left + (rect.width / 2) - 100,
              });
            }
          } else if (savedSelection) {
            // Restore previous selection if it was lost
            console.log('No selection after formatting, restoring saved selection');
            restoreSelection();
            const restored = window.getSelection();
            if (restored && restored.rangeCount > 0) {
              const range = restored.getRangeAt(0);
              setSavedSelection(range.cloneRange());
              const rect = range.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setToolbarPosition({
                  top: rect.top - 50,
                  left: rect.left + (rect.width / 2) - 100,
                });
              }
            }
          }
          // Keep toolbar visible and maintain focus
          setShowToolbar(true);
          editorRef.current.focus();
        }
        
      } catch (error) {
        console.error('Error applying format:', error);
      } finally {
        // Always reset formatting state after a delay
        setTimeout(() => {
          setIsFormattingActive(false);
        }, 100);
      }
    };

    // Execute immediately if we have focus, otherwise with small delay
    if (document.activeElement === editorRef.current) {
      executeFormatting();
    } else {
      setTimeout(executeFormatting, 10);
    }
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
  const handleClick = (e: React.MouseEvent) => {
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