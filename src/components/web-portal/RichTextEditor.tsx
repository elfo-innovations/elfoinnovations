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
import { uploadBlogContentImage } from "@/lib/media-upload.functions";
import { fileToBase64 } from "@/lib/file-to-base64";
import { getErrorMessage } from "@/lib/utils";

const FORMAT_OPTIONS = [
  { label: "Paragraph", tag: "P" },
  { label: "Heading 1", tag: "H1" },
  { label: "Heading 2", tag: "H2" },
  { label: "Heading 3", tag: "H3" },
  { label: "Heading 4", tag: "H4" },
  { label: "Heading 5", tag: "H5" },
];

export function RichTextEditor({
  value,
  onChange,
  variant = "full",
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  /** "inline" gives a compact Bold/Italic/Link-only toolbar for short fields like an
   * excerpt or a FAQ answer, where headings/images/lists don't make sense. */
  variant?: "full" | "inline";
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  // Starts at a sentinel (not `value`) so the very first sync effect run always fires and
  // actually paints the editor's initial HTML — see the bug note in the effect below.
  const lastValue = useRef<string | null>(null);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  const selectImage = (img: HTMLImageElement | null) => {
    setSelectedImg((prev) => {
      if (prev && prev !== img) prev.style.outline = "";
      if (img) img.style.outline = "2px solid hsl(var(--primary))";
      return img;
    });
  };

  useEffect(() => {
    // BUG FIX: this used to initialize `lastValue.current` to `value` itself, so on first
    // mount `value !== lastValue.current` was already false and the effect below never ran —
    // the contentEditable div started (and stayed) empty even though `value` had content.
    // That's why clicking "Edit" on an existing post showed a blank editor. Using a sentinel
    // that can never equal a real value guarantees the first run always paints the content.
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
      selectImage(null); // old selection refers to a DOM node that's about to be discarded
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
        const file_base64 = await fileToBase64(file);
        const { publicUrl } = await uploadBlogContentImage({
          data: {
            file_base64,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          },
        });
        if (publicUrl) {
          const suggestedAlt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ");
          const altText =
            window.prompt("Alt text (describe the image for accessibility & SEO):", suggestedAlt) ??
            "";
          ref.current?.focus();
          document.execCommand("insertImage", false, publicUrl);
          // execCommand("insertImage") has no way to set alt directly — tag the element
          // we just inserted by matching its src (unique per upload, so this is safe).
          if (ref.current) {
            const imgs = ref.current.querySelectorAll(`img[src="${publicUrl}"]`);
            const inserted = imgs[imgs.length - 1] as HTMLImageElement | undefined;
            if (inserted) inserted.alt = altText;
          }
          emit();
        }
      } catch (e) {
        window.alert(getErrorMessage(e, "Image upload failed"));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const onContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    selectImage(target.tagName === "IMG" ? (target as HTMLImageElement) : null);
  };

  const resizeSelectedImage = (pct: number) => {
    if (!selectedImg) return;
    selectedImg.style.width = `${pct}%`;
    selectedImg.style.height = "auto";
    emit();
  };

  const editSelectedImageAlt = () => {
    if (!selectedImg) return;
    const alt = window.prompt(
      "Alt text (describe the image for accessibility & SEO):",
      selectedImg.alt || "",
    );
    if (alt === null) return;
    selectedImg.alt = alt;
    emit();
  };

  const removeSelectedImage = () => {
    if (!selectedImg) return;
    selectedImg.remove();
    selectImage(null);
    emit();
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        {variant === "full" && (
          <>
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
          </>
        )}
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
        {variant === "full" && (
          <>
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
          </>
        )}
        <ToolbarBtn title="Insert link" onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Remove link" onClick={() => exec("unlink")}>
          <Unlink className="h-4 w-4" />
        </ToolbarBtn>
        {variant === "full" && (
          <>
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
          </>
        )}
        {uploading && <span className="ml-2 text-xs text-muted-foreground">Uploading image…</span>}
      </div>

      {variant === "full" && selectedImg && (
        <div className="flex flex-wrap items-center gap-1.5 border-b bg-primary/5 px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">Image selected —</span>
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => resizeSelectedImage(pct)}
              className="rounded border bg-background px-2 py-0.5 text-xs hover:bg-accent"
            >
              {pct}%
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={editSelectedImageAlt}
            className="ml-1 rounded border bg-background px-2 py-0.5 text-xs hover:bg-accent"
          >
            Alt text
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeSelectedImage}
            className="rounded border bg-background px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Remove
          </button>
        </div>
      )}

      <div
        ref={ref}
        contentEditable
        onInput={emit}
        onBlur={emit}
        onClick={onContainerClick}
        data-placeholder={placeholder}
        className={`prose prose-sm max-w-none p-4 text-sm leading-relaxed focus:outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_h4]:text-lg [&_h4]:font-bold [&_h5]:text-base [&_h5]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:cursor-pointer ${
          variant === "inline" ? "min-h-[70px]" : "min-h-[280px]"
        }`}
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
