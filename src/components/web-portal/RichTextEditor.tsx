import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FORMAT_OPTIONS = [
  { label: "Paragraph", tag: "P" },
  { label: "Heading 1", tag: "H1" },
  { label: "Heading 2", tag: "H2" },
  { label: "Heading 3", tag: "H3" },
  { label: "Heading 4", tag: "H4" },
  { label: "Heading 5", tag: "H5" },
];

/** Strips <script> tags and inline event handlers before content ever hits the page. */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
      if (
        attr.name.toLowerCase() === "href" &&
        attr.value.trim().toLowerCase().startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastValue.current = html;
    onChange(html);
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const setFormat = (tag: string) => exec("formatBlock", tag);

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    exec("createLink", url);
  };

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const path = `blog-content/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("website-media")
          .upload(path, file, { upsert: false });
        if (error) throw error;
        const { data: signed } = await supabase.storage
          .from("website-media")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signed?.signedUrl) exec("insertImage", signed.signedUrl);
      } catch (e: any) {
        window.alert(e?.message || "Image upload failed");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <select
          onChange={(e) => setFormat(e.target.value)}
          defaultValue="P"
          className="h-8 rounded-md border bg-background px-2 text-xs"
          title="Paragraph / Heading style"
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.tag} value={f.tag}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn title="Bold" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => exec("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Quote" onClick={() => setFormat("BLOCKQUOTE")}>
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Horizontal rule" onClick={() => exec("insertHorizontalRule")}>
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn title="Align left" onClick={() => exec("justifyLeft")}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Align center" onClick={() => exec("justifyCenter")}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Align right" onClick={() => exec("justifyRight")}>
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn title="Insert link" onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Remove link" onClick={() => exec("unlink")}>
          <Unlink className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert image" onClick={addImage} disabled={uploading}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn title="Undo" onClick={() => exec("undo")}>
          <Undo className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => exec("redo")}>
          <Redo className="h-4 w-4" />
        </ToolbarBtn>
        {uploading && <span className="ml-2 text-xs text-muted-foreground">Uploading image…</span>}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={emit}
        onBlur={emit}
        className="prose prose-sm max-w-none min-h-[280px] p-4 text-sm leading-relaxed focus:outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_h4]:text-lg [&_h4]:font-bold [&_h5]:text-base [&_h5]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
        suppressContentEditableWarning
      />
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
