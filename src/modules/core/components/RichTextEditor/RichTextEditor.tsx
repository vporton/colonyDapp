import React, { useEffect } from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import classnames from 'classnames';
import { useField } from 'formik';

import { InputStatus } from '~core/Fields';
import Toolbar from './Toolbar';

import styles from './RichTextEditor.css';

const displayName = 'RichTextEditor';

interface Props {
  editor: Editor;
  isSubmitting: boolean;
  limit: number;
  name: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor = ({
  editor,
  isSubmitting,
  limit,
  name,
  className,
  disabled = false,
}: Props) => {
  const [
    ,
    { error: contentError, touched: contentTouched },
    { setValue: setContentValue, setTouched: setContentTouched },
  ] = useField(name);

  useEffect(() => {
    /* Manually update form state on change to Editor component */
    const handleUpdate = ({ editor: editorContent }) =>
      setContentValue(editorContent.getHTML());

    editor.on('update', handleUpdate);
    editor.setEditable(!disabled);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [disabled, editor, setContentValue]);

  return (
    <div
      className={classnames(styles.main, className, {
        [styles.disabled]: isSubmitting || disabled,
      })}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={classnames(styles.editorContainer, {
          [styles.error]: contentError && contentTouched,
        })}
        name={name}
        onBlur={() => {
          if (!disabled) setContentTouched(true);
        }}
      />
      <span className={styles.characterCount}>
        {editor.storage.characterCount.characters()} / {limit}
      </span>
      {contentTouched && contentError && (
        <InputStatus error={contentError && 'Please enter a description'} />
      )}
    </div>
  );
};

RichTextEditor.displayName = displayName;

export default RichTextEditor;
