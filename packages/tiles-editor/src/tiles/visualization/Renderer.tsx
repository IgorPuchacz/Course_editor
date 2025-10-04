import React from 'react';
import { VisualizationTile } from 'tiles-core';
import { VisualizationInteractive } from 'tiles-runtime/visualization';
import { BaseTileRendererProps } from '../../components/shared';

export const VisualizationTileRenderer: React.FC<BaseTileRendererProps<VisualizationTile>> = ({
  tile,
  onDoubleClick,
}) => {
  return (
    <VisualizationInteractive
      tile={tile}
      mode="preview"
      onRequestContentEditing={onDoubleClick}
    />
  );
};

export default VisualizationTileRenderer;
