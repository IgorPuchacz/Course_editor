import { useReducer } from 'react';
import { editorReducer, initialEditorState, EditorAction } from '../state/editorReducer';
import { EditorState } from '../types/lessonEditor';

export const useLessonEditor = () => {
  const [state, dispatch] = useReducer<React.Reducer<EditorState, EditorAction>>(editorReducer, initialEditorState);
  return { editorState: state, dispatch };
};
