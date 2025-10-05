import React from 'react';

export type TileInstructionVerticalAlign = 'top' | 'center' | 'bottom';

export interface TileInstructionContentProps {
  html: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  verticalAlign?: TileInstructionVerticalAlign;
  className?: string;
  style?: React.CSSProperties;
}

const resolveJustifyContent = (verticalAlign?: TileInstructionVerticalAlign) => {
  switch (verticalAlign) {
    case 'center':
      return 'center';
    case 'bottom':
      return 'flex-end';
    case 'top':
    default:
      return 'flex-start';
  }
};

export const TileInstructionContent: React.FC<TileInstructionContentProps> = ({
  html,
  textColor,
  fontFamily,
  fontSize,
  verticalAlign = 'top',
  className = '',
  style
}) => {
  const sanitizedHtml = html?.trim().length ? html : '<p style="margin: 0;"></p>';

  return (
    <div
      className={`w-full h-full tile-text-content ${className}`.trim()}
      style={{
        color: textColor,
        fontFamily,
        fontSize: fontSize ? `${fontSize}px` : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: resolveJustifyContent(verticalAlign),
        ...style
      }}
    >
      <div
        className="w-full rich-text-content tile-formatted-text text-base"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default TileInstructionContent;
