import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Shuffle,
  ArrowLeftRight,
  GripVertical,
  PenSquare,
  PlayCircle
} from 'lucide-react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { LessonTile, SequencingTile } from '../../types/lessonEditor';
import { FontSize } from '../../extensions/FontSize';

interface SequencingInteractiveProps {
  tile: SequencingTile;
  isPreview?: boolean;
  isSelected?: boolean;
  isEditingText?: boolean;
  onUpdateTile?: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  onRequestEditMode?: () => void;
}

interface DraggedItem {
  id: string;
  text: string;
  originalIndex: number;
}

type DragSource = 'pool' | 'sequence';

interface DragState {
  id: string;
  source: DragSource;
  index?: number;
}

interface SequencingQuestionEditorProps {
  tile: SequencingTile;
  onUpdateTile?: (tileId: string, updates: Partial<LessonTile>) => void;
  onFinishTextEditing?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  textColor: string;
}

const createGradientLayers = (color: string) => {
  const hexMatch = color?.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!hexMatch) {
    return {
      base: color || 'rgba(2, 6, 23, 0.86)',
      from: undefined,
      to: undefined,
      textColor: 'rgba(248, 250, 252, 0.95)'
    };
  }

  const hex = hexMatch[0].replace('#', '');
  const normalized = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const toRgba = (red: number, green: number, blue: number, alpha: number) =>
    `rgba(${Math.min(255, Math.max(0, Math.round(red)))}, ${Math.min(255, Math.max(0, Math.round(green)))}, ${Math.min(255, Math.max(0, Math.round(blue)))}, ${alpha})`;

  const lighten = (channel: number, amount: number) => channel + (255 - channel) * amount;
  const darken = (channel: number, amount: number) => channel * (1 - amount);

  const from = toRgba(lighten(r, 0.08), lighten(g, 0.08), lighten(b, 0.08), 0.98);
  const to = toRgba(darken(r, 0.12), darken(g, 0.12), darken(b, 0.12), 0.92);
  const base = toRgba(r, g, b, 0.96);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const textColor = luminance > 180 ? 'rgba(15, 23, 42, 0.92)' : 'rgba(248, 250, 252, 0.95)';

  return { base, from, to, textColor };
};

const SequencingQuestionEditor: React.FC<SequencingQuestionEditorProps> = ({
  tile,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  textColor
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false
      }),
      BulletList.configure({ keepAttributes: true, keepMarks: true }),
      OrderedList.configure({ keepAttributes: true, keepMarks: true }),
      ListItem,
      Underline,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      TextAlign.configure({ types: ['paragraph'] })
    ],
    content:
      tile.content.richQuestion ||
      `<p style="margin: 0;">${tile.content.question || ''}</p>`,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plain = editor.getText();
      onUpdateTile?.(tile.id, {
        content: {
          ...tile.content,
          question: plain,
          richQuestion: html
        }
      });
    },
    autofocus: true
  });

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  if (!editor) return null;

  const handleBlur = (e: React.FocusEvent) => {
    const toolbar = document.querySelector('.top-toolbar');
    if (toolbar && e.relatedTarget && toolbar.contains(e.relatedTarget as Node)) {
      e.preventDefault();
      editor.commands.focus();
      return;
    }
    onFinishTextEditing?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (editor.isActive('listItem')) {
        if (e.shiftKey) {
          editor.chain().focus().liftListItem('listItem').run();
        } else {
          editor.chain().focus().sinkListItem('listItem').run();
        }
      } else {
        editor.chain().focus().insertContent('\t').run();
      }
    }
  };

  return (
    <div
      className="tiptap-editor w-full"
      style={{
        fontFamily: tile.content.fontFamily,
        fontSize: `${tile.content.fontSize}px`,
        color: textColor
      }}
    >
      <EditorContent
        editor={editor}
        className="w-full focus:outline-none break-words rich-text-content tile-formatted-text"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

const createRandomizedPool = (tile: SequencingTile): DraggedItem[] => {
  const orderedItems = [...tile.content.items]
    .sort((a, b) => a.correctPosition - b.correctPosition)
    .map((item, index) => ({
      id: item.id,
      text: item.text,
      originalIndex: index
    }));

  if (orderedItems.length <= 1) {
    return orderedItems;
  }

  const isCorrectOrder = (items: DraggedItem[]) =>
    items.every((item, index) => item.id === orderedItems[index].id);

  const shuffleOnce = () => {
    const shuffled = [...orderedItems];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const shuffled = shuffleOnce();
    if (!isCorrectOrder(shuffled)) {
      return shuffled;
    }
  }

  const fallback = [...orderedItems];
  [fallback[0], fallback[1]] = [fallback[1], fallback[0]];
  return fallback;
};

export const SequencingInteractive: React.FC<SequencingInteractiveProps> = ({
  tile,
  isPreview = false,
  isSelected = false,
  isEditingText = false,
  onUpdateTile,
  onFinishTextEditing,
  onEditorReady,
  onRequestEditMode
}) => {
  const [availableItems, setAvailableItems] = useState<DraggedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<(DraggedItem | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPoolHighlighted, setIsPoolHighlighted] = useState(false);
  const [experienceMode, setExperienceMode] = useState<'preview' | 'edit'>('preview');
  const [showModePrompt, setShowModePrompt] = useState(false);
  const hasPromptBeenShown = useRef(false);

  const gradientLayers = useMemo(
    () => createGradientLayers(tile.content.backgroundColor || '#0f172a'),
    [tile.content.backgroundColor]
  );

  const containerStyle: React.CSSProperties = {
    backgroundColor: gradientLayers.base,
    ...(gradientLayers.from && gradientLayers.to
      ? { backgroundImage: `linear-gradient(160deg, ${gradientLayers.from}, ${gradientLayers.to})` }
      : {})
  };

  const isLightBackground = gradientLayers.textColor.startsWith('rgba(15');
  const baseTextClass = isLightBackground ? 'text-slate-900' : 'text-slate-100';
  const mutedTextClass = isLightBackground ? 'text-slate-600' : 'text-slate-200/80';
  const subtleTextClass = isLightBackground ? 'text-slate-500' : 'text-slate-400';
  const borderClass = showBorder
    ? isLightBackground
      ? 'border border-slate-200'
      : 'border border-white/10'
    : '';
  const poolBaseClasses = isLightBackground
    ? 'border-slate-200 bg-white/80 shadow-sm shadow-slate-300/30'
    : 'border-white/10 bg-slate-950/30';
  const poolHandleClasses = isLightBackground
    ? 'border-slate-300 bg-white text-slate-500'
    : 'border-white/5 bg-slate-900/70 text-slate-400';
  const poolItemTextClass = isLightBackground ? 'text-slate-800' : 'text-slate-100';

  const canInteract = !isPreview && experienceMode === 'preview' && !showModePrompt;
  const sequenceComplete = placedItems.length > 0 && placedItems.every(item => item !== null);

  const showBorder = tile.content.showBorder !== false;

  // Initialize with randomized order whenever the items change
  useEffect(() => {
    const shuffledItems = createRandomizedPool(tile);
    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
    setAttempts(0);
  }, [tile.id, tile.content.items]);

  useEffect(() => {
    if (isEditingText && isSelected) {
      setExperienceMode('edit');
      if (!hasPromptBeenShown.current) {
        setShowModePrompt(true);
        hasPromptBeenShown.current = true;
      }
    } else {
      setExperienceMode('preview');
      setShowModePrompt(false);
      hasPromptBeenShown.current = false;
    }
  }, [isEditingText, isSelected]);

  const resetCheckState = () => {
    if (isChecked) {
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string, source: DragSource, index?: number) => {
    if (!canInteract) return;

    setDragState({
      id: itemId,
      source,
      index
    });
    try {
      e.dataTransfer.setData('text/plain', itemId);
    } catch {
      // Some browsers may throw when setting data with unsupported formats; ignore.
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    if (!canInteract) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(index);
  };

  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  const handlePoolDragOver = (e: React.DragEvent) => {
    if (!canInteract || !dragState || dragState.source !== 'sequence') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsPoolHighlighted(true);
  };

  const handlePoolDragLeave = () => {
    setIsPoolHighlighted(false);
  };

  const handleDropToSlot = (e: React.DragEvent, targetIndex: number) => {
    if (!canInteract) return;

    e.preventDefault();
    setDragOverSlot(null);

    if (!dragState) return;

    if (dragState.source === 'pool') {
      const itemToPlace = availableItems.find(item => item.id === dragState.id);
      if (!itemToPlace) {
        setDragState(null);
        return;
      }

      const newPlaced = [...placedItems];
      const replacedItem = newPlaced[targetIndex];
      newPlaced[targetIndex] = itemToPlace;

      const newAvailable = availableItems.filter(item => item.id !== dragState.id);
      if (replacedItem) {
        newAvailable.push(replacedItem);
      }

      setPlacedItems(newPlaced);
      setAvailableItems(newAvailable);
      resetCheckState();
    } else if (dragState.source === 'sequence') {
      const originIndex = dragState.index ?? placedItems.findIndex(item => item?.id === dragState.id);
      if (originIndex === -1 || originIndex === targetIndex) {
        setDragState(null);
        return;
      }

      const newPlaced = [...placedItems];
      const movingItem = newPlaced[originIndex];
      if (!movingItem) {
        setDragState(null);
        return;
      }

      const targetItem = newPlaced[targetIndex];
      newPlaced[targetIndex] = movingItem;
      newPlaced[originIndex] = targetItem ?? null;

      setPlacedItems(newPlaced);
      resetCheckState();
    }

    setDragState(null);
  };

  const handleDropToPool = (e: React.DragEvent) => {
    if (!canInteract) return;

    e.preventDefault();
    setIsPoolHighlighted(false);

    if (!dragState || dragState.source !== 'sequence') {
      setDragState(null);
      return;
    }

    const originIndex = dragState.index ?? placedItems.findIndex(item => item?.id === dragState.id);
    if (originIndex === -1) {
      setDragState(null);
      return;
    }

    const newPlaced = [...placedItems];
    const itemToReturn = newPlaced[originIndex];
    if (!itemToReturn) {
      setDragState(null);
      return;
    }

    newPlaced[originIndex] = null;
    setPlacedItems(newPlaced);
    setAvailableItems(prev => [...prev, itemToReturn]);
    setDragState(null);
    resetCheckState();
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverSlot(null);
    setIsPoolHighlighted(false);
  };

  const checkSequence = () => {
    const isSequenceCorrect = placedItems.every((item, index) => {
      if (!item) return false;
      const originalItem = tile.content.items.find(original => original.id === item.id);
      return originalItem && originalItem.correctPosition === index;
    }) && placedItems.length === tile.content.items.length;

    setIsCorrect(isSequenceCorrect);
    setIsChecked(true);
    setAttempts(prev => prev + 1);
  };

  const resetSequence = () => {
    const shuffledItems = createRandomizedPool(tile);
    setAvailableItems(shuffledItems);
    setPlacedItems(new Array(shuffledItems.length).fill(null));
    setIsChecked(false);
    setIsCorrect(null);
  };

  const getItemClasses = (itemId: string) => {
    let baseClasses = 'flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-800/70 bg-slate-800/60 text-slate-100 shadow-sm shadow-slate-900/30 transition-transform duration-200 select-none cursor-grab active:cursor-grabbing';

    if (dragState?.id === itemId) {
      baseClasses += ' opacity-60 scale-[0.98]';
    }

    return baseClasses;
  };

  const getSlotClasses = (index: number, hasItem: boolean) => {
    let baseClasses = 'relative flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]';

    if (dragOverSlot === index) {
      baseClasses += ' border-emerald-400/70 bg-emerald-400/10 shadow-lg shadow-emerald-500/10';
    } else if (isChecked && isCorrect !== null) {
      const placedItem = placedItems[index];
      const originalItem = placedItem
        ? tile.content.items.find(item => item.id === placedItem.id)
        : null;
      const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

      if (isInCorrectPosition) {
        baseClasses += ' border-emerald-400/60 bg-emerald-400/5';
      } else {
        baseClasses += ' border-rose-400/60 bg-rose-400/5';
      }
    } else if (hasItem) {
      baseClasses += ' border-slate-700/80 bg-slate-800/40';
    } else {
      baseClasses += ' border-dashed border-slate-700/80 bg-slate-900/30 hover:border-emerald-400/60 hover:bg-emerald-400/5';
    }

    return baseClasses;
  };

  const questionHtml = tile.content.richQuestion || `<p style="margin: 0;">${tile.content.question || 'Ułóż elementy w prawidłowej kolejności'}</p>`;

  const handleChooseEditMode = () => {
    setShowModePrompt(false);
    setExperienceMode('edit');
  };

  const handleChoosePreviewMode = () => {
    setShowModePrompt(false);
    setExperienceMode('preview');
    onFinishTextEditing?.();
    resetSequence();
    setAttempts(0);
  };

  return (
    <div className="relative w-full h-full">
      {showModePrompt && isEditingText && isSelected && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 text-slate-900 shadow-2xl shadow-slate-900/40 p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
              <Sparkles className="w-4 h-4" />
              <span>Tryb pracy kafelka</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Co chcesz teraz zrobić?</h3>
              <p className="text-sm text-slate-600">
                Wybierz, czy chcesz edytować treść polecenia, czy przetestować zadanie w trybie ucznia.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleChooseEditMode}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-medium py-3 px-4 shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span>Edytuj treść</span>
              </button>
              <button
                onClick={handleChoosePreviewMode}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-emerald-950 font-semibold py-3 px-4 shadow-lg shadow-emerald-400/30 hover:bg-emerald-400 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Testuj kafelek</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full">
        <div
          className={`relative w-full h-full rounded-3xl ${borderClass} ${baseTextClass} shadow-2xl shadow-slate-950/40 flex flex-col gap-6 p-6 overflow-hidden backdrop-blur-sm`}
          style={containerStyle}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-h-[2.5rem]">
              {experienceMode === 'edit' && isEditingText && isSelected ? (
                <SequencingQuestionEditor
                  tile={tile}
                  onUpdateTile={onUpdateTile}
                  onFinishTextEditing={onFinishTextEditing}
                  onEditorReady={onEditorReady}
                  textColor={gradientLayers.textColor}
                />
              ) : (
                <div
                  style={{
                    fontFamily: tile.content.fontFamily,
                    fontSize: `${tile.content.fontSize}px`,
                    color: gradientLayers.textColor
                  }}
                  dangerouslySetInnerHTML={{ __html: questionHtml }}
                />
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className={`flex items-center gap-2 text-xs font-medium ${mutedTextClass}`}>
                <Sparkles className="w-4 h-4" />
                <span>Ćwiczenie sekwencyjne</span>
              </div>

              {isSelected && (
                <div className="flex items-center gap-2">
                  {experienceMode === 'edit' && isEditingText ? (
                    <button
                      onClick={handleChoosePreviewMode}
                      className="flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 text-emerald-100 px-3 py-2 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Tryb testu</span>
                    </button>
                  ) : (
                    <button
                      onClick={onRequestEditMode}
                      className="flex items-center gap-2 rounded-xl border border-blue-400/60 bg-blue-500/20 text-blue-100 px-3 py-2 text-xs font-semibold hover:bg-blue-500/30 transition-colors"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span>Edytuj treść</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {attempts > 0 && (
            <div className={`text-xs uppercase tracking-[0.32em] ${subtleTextClass}`}>
              Próba #{attempts}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <div
              className={`flex flex-col rounded-2xl border transition-all duration-200 ${
                isPoolHighlighted
                  ? 'border-emerald-400/70 bg-emerald-400/10 shadow-lg shadow-emerald-500/10'
                  : poolBaseClasses
              }`}
              onDragOver={handlePoolDragOver}
              onDragLeave={handlePoolDragLeave}
              onDrop={handleDropToPool}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className={`flex items-center gap-2 text-sm font-semibold ${poolItemTextClass}`}>
                  <Shuffle className="w-4 h-4" />
                  <span>Pula elementów</span>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
                {availableItems.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center gap-2 text-center text-sm ${subtleTextClass} py-10`}>
                    <ArrowLeftRight className="w-5 h-5" />
                    <span>Przeciągnij elementy na prawą stronę</span>
                  </div>
                ) : (
                  availableItems.map((item) => (
                    <div
                      key={item.id}
                      draggable={canInteract}
                      onDragStart={(e) => handleDragStart(e, item.id, 'pool')}
                      onDragEnd={handleDragEnd}
                      className={getItemClasses(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${poolHandleClasses}`}>
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-medium ${poolItemTextClass}`}>{item.text}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/20">
                <div className={`flex items-center gap-2 text-sm font-semibold ${isLightBackground ? 'text-emerald-700' : 'text-emerald-100'}`}>
                  <CheckCircle className="w-4 h-4" />
                  <span>Twoja sekwencja</span>
                </div>
                <span className={`text-xs ${isLightBackground ? 'text-emerald-700/70' : 'text-emerald-100/70'}`}>{placedItems.filter(Boolean).length} / {tile.content.items.length}</span>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
                {placedItems.map((item, index) => (
                  <div
                    key={index}
                    className={getSlotClasses(index, Boolean(item))}
                    onDragOver={(e) => handleSlotDragOver(e, index)}
                    onDragLeave={handleSlotDragLeave}
                    onDrop={(e) => handleDropToSlot(e, index)}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 ${isLightBackground ? 'text-emerald-700' : 'text-emerald-100'} text-sm font-semibold border border-emerald-500/30`}>
                      {index + 1}
                    </div>
                    {item ? (
                      <div
                        className={`flex-1 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing ${
                          dragState?.id === item.id ? 'opacity-60 scale-[0.98]' : ''
                        }`}
                        draggable={canInteract}
                        onDragStart={(e) => handleDragStart(e, item.id, 'sequence', index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${poolHandleClasses}`}>
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-medium ${poolItemTextClass} text-left break-words`}>{item.text}</span>
                        </div>
                      </div>
                    ) : (
                      <span className={`flex-1 text-sm ${subtleTextClass} italic`}>
                        Upuść element w tym miejscu
                      </span>
                    )}

                    {isChecked && isCorrect !== null && item && (
                      (() => {
                        const originalItem = tile.content.items.find(original => original.id === item.id);
                        const isInCorrectPosition = originalItem && originalItem.correctPosition === index;

                        return isInCorrectPosition ? (
                          <CheckCircle className="w-5 h-5 text-emerald-300" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-300" />
                        );
                      })()
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isChecked && isCorrect !== null && (
            <div className={`rounded-2xl border px-6 py-4 flex items-center justify-between ${
              isCorrect
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
            }`}>
              <div className="flex items-center gap-3 text-sm font-medium">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-300" />
                )}
                <span>
                  {isCorrect ? tile.content.correctFeedback : tile.content.incorrectFeedback}
                </span>
              </div>

              {!isCorrect && (
                <div className="text-xs text-slate-200/70">
                  Spróbuj ponownie, przenosząc elementy.
                </div>
              )}
            </div>
          )}

          {!isPreview && experienceMode === 'preview' && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={checkSequence}
                  disabled={!sequenceComplete || (isChecked && isCorrect)}
                  className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/30 transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {isChecked && isCorrect ? 'Sekwencja sprawdzona' : 'Sprawdź kolejność'}
                </button>

                {(isChecked && !isCorrect) && (
                  <button
                    onClick={resetSequence}
                    className="px-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 font-medium border border-slate-600/60 hover:bg-slate-900/60 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Wymieszaj ponownie</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
