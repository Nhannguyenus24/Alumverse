import { alpha, Box } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import "react-quill-new/dist/quill.snow.css";
import { IMAGE_ACCEPT, useUploadImage, validateImageFile } from "../utils/imageUtils";

const Delta = Quill.import("delta");

const normalizeEditorImageElement = (image) => {
  image.removeAttribute("width");
  image.removeAttribute("height");
  image.style.removeProperty("width");
  image.style.removeProperty("height");
  image.style.removeProperty("min-width");
  image.style.removeProperty("max-width");
  image.style.removeProperty("min-height");
  image.style.removeProperty("max-height");
  image.style.removeProperty("object-fit");
};

const WYSIWYG = ({
  value = "",
  onChange,
  placeholder = "Enter content...",
  readOnly = false,
  height = 300,
  allowImages = true,
  requireImageCaptions = false,
}) => {
  const { t } = useTranslation("article");
  const { enqueueSnackbar } = useSnackbar();
  const quillRef = useRef(null);

  const { uploadFile } = useUploadImage();
  // Keep the latest uploadFile in a ref so the Quill `modules` object stays
  // stable across renders (rebuilding it would reset the toolbar).
  const uploadRef = useRef(uploadFile);
  uploadRef.current = uploadFile;

  const getQuillEditor = useCallback(() => {
    try {
      return quillRef.current?.getEditor?.() ?? null;
    } catch {
      return null;
    }
  }, []);

  // Validate + upload a file through the image service and return a hosted URL
  // (never a base64 data URL), so editor content stored in the DB only holds links.
  const uploadImage = useCallback(
    async (file) => {
      const validation = validateImageFile(file, t);
      if (!validation.valid) {
        enqueueSnackbar(validation.message, { variant: "error" });
        return null;
      }
      try {
        const url = await uploadRef.current(file);
        if (!url) throw new Error("empty_url");
        return url;
      } catch (error) {
        enqueueSnackbar(
          error?.response?.data?.message ?? t("common:image_upload_error"),
          { variant: "error" }
        );
        return null;
      }
    },
    [enqueueSnackbar, t]
  );

  // Upload any base64/data-URL images that slipped into the editor (paste or
  // drag-and-drop) and swap them for the hosted URL in place.
  const replaceEmbeddedImages = useCallback(async () => {
    const quill = getQuillEditor();
    if (!quill) return;

    const dataImages = [];
    quill.getContents().ops?.forEach((op) => {
      const src = op?.insert?.image;
      if (typeof src === "string" && src.startsWith("data:")) {
        dataImages.push(src);
      }
    });
    if (dataImages.length === 0) return;

    for (const dataUrl of [...new Set(dataImages)]) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "pasted-image.png", { type: blob.type });
        const url = await uploadImage(file);
        if (!url) continue;
        // Re-scan the (possibly changed) document and replace every matching embed.
        let index = 0;
        quill.getContents().ops?.forEach((op) => {
          if (op?.insert?.image === dataUrl) {
            quill.deleteText(index, 1, "silent");
            quill.insertEmbed(index, "image", url, "silent");
          }
          index += typeof op.insert === "string" ? op.insert.length : 1;
        });
      } catch {
        // ignore a single failed image; others still get processed
      }
    }
  }, [getQuillEditor, uploadImage]);

  const normalizeEditorImages = useCallback(() => {
    const editorRoot = quillRef.current?.editor?.root;
    editorRoot?.querySelectorAll?.("img")?.forEach(normalizeEditorImageElement);
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ size: [] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          allowImages ? ["link", "image", "video"] : ["link", "video"],
          [{ color: [] }, { background: [] }, { align: [] }, "clean"],
        ],
        handlers: allowImages
          ? {
              image: () => {
                const quill = getQuillEditor();
                if (!quill) return;

                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", IMAGE_ACCEPT);
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;

                  const url = await uploadImage(file);
                  if (!url) return;

                  const range = quill.getSelection(true) ?? { index: quill.getLength(), length: 0 };
                  const imageIndex = range.index;

                  quill.insertEmbed(imageIndex, "image", url, "user");

                  if (requireImageCaptions) {
                    const captionPlaceholder = t("image_caption_inline_placeholder");
                    const captionIndex = imageIndex + 2;
                    quill.insertText(imageIndex + 1, "\n", "user");
                    quill.insertText(
                      captionIndex,
                      captionPlaceholder,
                      { size: "small", color: "#94a3b8", italic: true },
                      "user"
                    );
                    quill.insertText(captionIndex + captionPlaceholder.length, "\n", "user");
                    quill.formatLine(captionIndex, captionPlaceholder.length, "align", "center", "user");
                    quill.setSelection(captionIndex, captionPlaceholder.length, "silent");
                  } else {
                    quill.setSelection(imageIndex + 1, 0, "silent");
                  }
                };
                input.click();
              },
            }
          : {},
      },
      clipboard: {
        matchVisual: false,
        matchers: [
          [
            "IMG",
            (node, delta) => {
              const alt = node.getAttribute("alt");
              const src = node.getAttribute("src");
              if (src?.includes("fbcdn.net") && alt) {
                return new Delta().insert(alt);
              }
              return src ? new Delta().insert({ image: src }) : delta;
            },
          ],
        ],
      },
    }),
    [allowImages, getQuillEditor, requireImageCaptions, t, uploadImage]
  );

  // Catch images pasted or dropped into the editor (Quill embeds them as base64)
  // and rewrite them to hosted URLs so nothing base64 ever reaches the DB.
  useEffect(() => {
    if (!allowImages) return undefined;
    const quill = getQuillEditor();
    if (!quill) return undefined;

    const handler = (delta) => {
      const hasDataImage = delta?.ops?.some(
        (op) =>
          typeof op?.insert?.image === "string" &&
          op.insert.image.startsWith("data:")
      );
      if (hasDataImage) {
        // Defer so Quill finishes applying the change before we rewrite it.
        setTimeout(() => replaceEmbeddedImages(), 0);
      }
      setTimeout(() => normalizeEditorImages(), 0);
    };

    quill.on("text-change", handler);
    return () => {
      try {
        quill.off("text-change", handler);
      } catch {
        // Editor can be torn down during route/i18n remounts.
      }
    };
  }, [allowImages, getQuillEditor, normalizeEditorImages, replaceEmbeddedImages]);

  useEffect(() => {
    if (!allowImages) return;
    const timeoutId = setTimeout(() => normalizeEditorImages(), 0);
    return () => clearTimeout(timeoutId);
  }, [allowImages, normalizeEditorImages, value]);

  const formats = useMemo(
    () => [
      "header",
      //"font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "indent",
      "link",
      ...(allowImages ? ["image"] : []),
      "video",
      "color",
      "background",
      "align",
    ],
    [allowImages]
  );

  return (
    <Box
      sx={(theme) => ({
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        backgroundColor: "background.paper",
        "& .quill": {
          display: "flex",
          flexDirection: "column",
        },
        "& .ql-toolbar": {
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          flexShrink: 0,
        },
        "& .ql-toolbar .ql-picker-label, & .ql-toolbar .ql-picker-item": {
          color: theme.palette.text.primary,
        },
        "& .ql-toolbar .ql-stroke": {
          stroke: theme.palette.text.primary,
        },
        "& .ql-toolbar .ql-fill": {
          fill: theme.palette.text.primary,
        },
        "& .ql-toolbar button:hover .ql-stroke, & .ql-toolbar button.ql-active .ql-stroke, & .ql-toolbar .ql-picker-label:hover .ql-stroke, & .ql-toolbar .ql-picker-label.ql-active .ql-stroke": {
          stroke: theme.palette.primary.main,
        },
        "& .ql-toolbar button:hover .ql-fill, & .ql-toolbar button.ql-active .ql-fill, & .ql-toolbar .ql-picker-label:hover .ql-fill, & .ql-toolbar .ql-picker-label.ql-active .ql-fill": {
          fill: theme.palette.primary.main,
        },
        "& .ql-toolbar button:hover, & .ql-toolbar button.ql-active, & .ql-toolbar .ql-picker-label:hover, & .ql-toolbar .ql-picker-label.ql-active": {
          color: theme.palette.primary.main,
        },
        "& .ql-container": {
          height: `${height}px`,
          fontSize: "1rem",
          border: "none",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        "& .ql-editor": {
          height: "100%",
          fontFamily: "Nunito, 'sans-serif'",
          color: theme.palette.text.primary,
          overflowY: "auto",
          textAlign: "justify",
          overflowWrap: "normal",
          wordBreak: "normal",
          hyphens: "none",
        },
        "& .ql-editor p": {
          minHeight: "1.65em",
          margin: 0,
          textAlign: "inherit",
        },
        "& .ql-editor.ql-blank::before": {
          color: theme.palette.text.disabled,
          fontStyle: "normal",
        },
        "& .ql-editor:has(img)::before, & .ql-editor:has(p img)::before, & .ql-editor:has(.rich-content-image)::before": {
          display: "none !important",
        },
        "& .ql-editor *": {
          fontFamily: "Nunito, sans-serif !important",
          overflowWrap: "normal",
          wordBreak: "normal",
          hyphens: "none",
        },
        "& .ql-editor h1, & .ql-editor h2, & .ql-editor h3, & .ql-editor h4, & .ql-editor h5, & .ql-editor h6": {
          textAlign: "left",
        },
        "& .ql-editor .ql-align-left": {
          textAlign: "left !important",
        },
        "& .ql-editor .ql-align-center": {
          textAlign: "center !important",
        },
        "& .ql-editor .ql-align-right": {
          textAlign: "right !important",
        },
        "& .ql-editor .ql-align-justify": {
          textAlign: "justify !important",
        },
        "& .ql-editor a": {
          overflowWrap: "normal",
          wordBreak: "normal",
        },
        "& .ql-editor img": {
          display: "block",
          maxWidth: "min(100%, 560px) !important",
          width: "auto !important",
          height: "auto !important",
          maxHeight: "70vh",
          objectFit: "contain",
          margin: "12px auto",
        },
        "& .ql-tooltip": {
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
          boxShadow: theme.palette.mode === "dark"
            ? `0 12px 28px ${alpha(theme.palette.common.black, 0.42)}`
            : `0 10px 24px ${alpha(theme.palette.common.black, 0.14)}`,
          color: theme.palette.text.primary,
        },
        "& .ql-tooltip input[type=text]": {
          backgroundColor: theme.palette.background.default,
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
        },
        "& .ql-tooltip a": {
          color: theme.palette.primary.main,
        },
      })}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </Box>
  );
};

export default WYSIWYG;
