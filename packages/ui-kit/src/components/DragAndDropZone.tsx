import React, { useState, useRef } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export interface DragAndDropZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  prompt?: string;
  helperText?: string;
  icon?: React.ReactNode;
  onDropAccepted?: (items: string[]) => void;
  isOccupied?: boolean;
  occupiedContent?: React.ReactNode;
  className?: string;
}

export const DragAndDropZone: React.FC<DragAndDropZoneProps> = ({
  prompt = 'Drag and drop items here to verify',
  helperText = 'Or tap to select / calibrate',
  icon,
  onDropAccepted,
  isOccupied = false,
  occupiedContent,
  className = '',
  style,
  onClick,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [isDragOver, setIsDragOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const textData = e.dataTransfer.getData('text');
    if (textData) {
      onDropAccepted?.([textData]);
    }
  };

  const getBackground = () => {
    if (highContrast) return SKYLEARN_COLORS.background;
    if (isDragOver) return SKYLEARN_COLORS.skySoft;
    return SKYLEARN_COLORS.surfaceSunken;
  };

  const getBorder = () => {
    if (highContrast) {
      return isDragOver
        ? `3px solid ${SKYLEARN_COLORS.ink}`
        : `2px dashed ${SKYLEARN_COLORS.ink}`;
    }
    if (isDragOver) {
      return `2px solid ${SKYLEARN_COLORS.sky}`;
    }
    return `2px dashed ${SKYLEARN_COLORS.outlineStrong}`;
  };

  return (
    <div
      ref={zoneRef}
      role="region"
      aria-label="Drop target zone"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
      className={`skylearn-drop-zone ${isDragOver ? 'is-drag-over' : ''} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px',
        minWidth: '56px',
        padding: '24px',
        borderRadius: SKYLEARN_RADII.card,
        backgroundColor: getBackground(),
        border: getBorder(),
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        textAlign: 'center',
        transition: reducedMotion
          ? 'none'
          : 'background-color 180ms ease-out, border-color 180ms ease-out',
        ...style,
      }}
      {...rest}
    >
      {isOccupied && occupiedContent ? (
        occupiedContent
      ) : (
        <>
          {icon && (
            <div
              style={{
                marginBottom: '12px',
                color: isDragOver ? SKYLEARN_COLORS.sky : SKYLEARN_COLORS.inkMuted,
              }}
            >
              {icon}
            </div>
          )}
          <div
            style={{
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '17px',
              fontWeight: 600,
              color: isDragOver
                ? SKYLEARN_COLORS.skyDeep
                : highContrast
                ? SKYLEARN_COLORS.ink
                : SKYLEARN_COLORS.ink,
              marginBottom: '4px',
            }}
          >
            {prompt}
          </div>
          {helperText && (
            <div
              style={{
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                fontSize: '14px',
                color: isDragOver
                  ? SKYLEARN_COLORS.skyDeep
                  : highContrast
                  ? SKYLEARN_COLORS.inkMuted
                  : SKYLEARN_COLORS.inkSubtle,
              }}
            >
              {helperText}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DragAndDropZone;
