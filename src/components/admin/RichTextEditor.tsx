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
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      console.log('Rich text content updated:', editorRef.current.innerHTML);
      const content = editorRef.current.innerHTML;
      const cleanedHTML = cleanHTML(content);
      console.log('Cleaned HTML:', cleanedHTML);
      onChange(cleanedHTML);
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
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Force update after formatting
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);
      onChange(editorRef.current.innerHTML);
    }
  };


  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onKeyDown={handleKeyDown}
        className={`w-full h-full p-3 outline-none overflow-auto border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent rich-text-content ${className}`}
        style={{ minHeight: '120px' }}
        suppressContentEditableWarning={true}
      />

      <TextFormattingToolbar
        onFormat={applyFormat}
        position={toolbarPosition}
        visible={showToolbar}
      />
    </div>
  );
};