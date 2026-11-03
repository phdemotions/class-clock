import { IconButton, Select, SelectItem } from "@carbon/react";
import {
  ListBulleted, ListNumbered, Redo, TextBold, TextClearFormat, TextItalic, TextUnderline, Undo,
} from "@carbon/icons-react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { FONT_OPTIONS } from "../lib/fonts";
import { sanitizeInstructions } from "../lib/sanitize";
import "./RichTextEditor.scss";

/**
 * Text colours. Stored as CSS variables, not fixed colours, so each one switches
 * to a readable Carbon shade in the dark and light themes (see styles/index.scss).
 */
const COLORS = [
  { label: "Default", value: "" },
  { label: "Yellow", value: "var(--erc-ink-yellow)" },
  { label: "Red", value: "var(--erc-ink-red)" },
  { label: "Green", value: "var(--erc-ink-green)" },
  { label: "Blue", value: "var(--erc-ink-blue)" },
  { label: "Purple", value: "var(--erc-ink-purple)" },
];

const SIZES = [
  { label: "Normal", value: "" },
  { label: "Large", value: "1.3em" },
  { label: "Extra large", value: "1.6em" },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  labelId: string;
}

export function RichTextEditor({ value, onChange, labelId }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: sanitizeInstructions(value),
    editorProps: {
      attributes: { class: "erc-rich erc-editor__content", "aria-labelledby": labelId, "aria-multiline": "true", role: "textbox" },
      // Pasted Word or web content keeps simple formatting only.
      transformPastedHTML: (html) => sanitizeInstructions(html),
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    immediatelyRender: true,
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const style = e.getAttributes("textStyle") as { fontFamily?: string; fontSize?: string; color?: string };
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : "p",
        font: FONT_OPTIONS.find((f) => f.stack === style.fontFamily)?.id ?? "",
        size: style.fontSize ?? "",
        color: style.color ?? "",
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;
  const chain = () => editor.chain().focus();

  return (
    <div className="erc-editor">
      <div className="erc-editor__toolbar" role="toolbar" aria-label="Text formatting" aria-controls={labelId}>
        <IconButton kind="ghost" size="sm" label="Undo" onClick={() => chain().undo().run()} disabled={!state.canUndo}><Undo /></IconButton>
        <IconButton kind="ghost" size="sm" label="Redo" onClick={() => chain().redo().run()} disabled={!state.canRedo}><Redo /></IconButton>
        <span className="erc-editor__sep" />
        <Select
          id="erc-block" labelText="Text style" hideLabel size="sm" inline value={state.block}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") chain().setParagraph().run();
            else chain().setHeading({ level: v === "h2" ? 2 : 3 }).run();
          }}
        >
          <SelectItem value="p" text="Normal text" />
          <SelectItem value="h2" text="Heading" />
          <SelectItem value="h3" text="Section label" />
        </Select>
        <Select
          id="erc-size" labelText="Text size" hideLabel size="sm" inline value={state.size}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
        >
          {SIZES.map((s) => <SelectItem key={s.label} value={s.value} text={s.label} />)}
        </Select>
        <Select
          id="erc-font" labelText="Font for selected text" hideLabel size="sm" inline value={state.font}
          onChange={(e) => {
            const font = FONT_OPTIONS.find((f) => f.id === e.target.value);
            if (font) chain().setFontFamily(font.stack).run();
            else chain().unsetFontFamily().run();
          }}
        >
          <SelectItem value="" text="Default font" />
          {FONT_OPTIONS.map((f) => <SelectItem key={f.id} value={f.id} text={f.label} />)}
        </Select>
        <span className="erc-editor__sep" />
        <IconButton kind="ghost" size="sm" label="Bold" isSelected={state.bold} onClick={() => chain().toggleBold().run()}><TextBold /></IconButton>
        <IconButton kind="ghost" size="sm" label="Italic" isSelected={state.italic} onClick={() => chain().toggleItalic().run()}><TextItalic /></IconButton>
        <IconButton kind="ghost" size="sm" label="Underline" isSelected={state.underline} onClick={() => chain().toggleUnderline().run()}><TextUnderline /></IconButton>
        <IconButton kind="ghost" size="sm" label="Bulleted list" isSelected={state.bullet} onClick={() => chain().toggleBulletList().run()}><ListBulleted /></IconButton>
        <IconButton kind="ghost" size="sm" label="Numbered list" isSelected={state.ordered} onClick={() => chain().toggleOrderedList().run()}><ListNumbered /></IconButton>
        <span className="erc-editor__sep" />
        <div className="erc-editor__colors" role="group" aria-label="Text colour">
          {COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              className={`erc-editor__swatch${state.color === c.value ? " is-selected" : ""}`}
              style={c.value ? { background: c.value } : undefined}
              aria-label={`${c.label} text`}
              aria-pressed={state.color === c.value}
              title={`${c.label} text`}
              onClick={() => (c.value ? chain().setColor(c.value).run() : chain().unsetColor().run())}
            />
          ))}
        </div>
        <span className="erc-editor__sep" />
        <IconButton kind="ghost" size="sm" label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}><TextClearFormat /></IconButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
