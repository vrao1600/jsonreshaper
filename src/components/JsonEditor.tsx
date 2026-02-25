import React, { useMemo } from "react";
import Editor from "@monaco-editor/react";

type Props = {
  title: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string | null;
  onFormat?: () => void;
  readOnly?: boolean;
  statusText?: string;
};

export default function JsonEditor(props: Props) {
  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      lineHeight: 20,
      scrollBeyondLastLine: false,
      wordWrap: "on" as const,
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
      automaticLayout: true,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: "on" as const,
      renderLineHighlight: "all" as const,
      readOnly: props.readOnly ?? false
    }),
    [props.readOnly]
  );

  const status =
    props.statusText ??
    (props.error ? `JSON error: ${props.error}` : "JSON valid");

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{props.title}</div>

        <div className="panelHeaderRight">
          {props.onFormat && (
            <button className="btnGhost" onClick={props.onFormat} disabled={props.readOnly}>
              Format
            </button>
          )}
        </div>
      </div>

      <div className="panelBody editorWrap">
        <div className={`statusLine ${props.error ? "statusError" : "statusOk"}`}>
          {status}
        </div>

        <div className="editorBox">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={props.value}
            options={options}
            onChange={(v) => props.onChange?.(v ?? "")}
          />
        </div>
      </div>
    </section>
  );
}