import { alpha, Box } from "@mui/material";
import { useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import { useTranslation } from "react-i18next";
import "react-quill-new/dist/quill.snow.css";

const Delta = Quill.import("delta");

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
  const quillRef = useRef(null);

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
        handlers: allowImages && requireImageCaptions
          ? {
              image: () => {
                const quill = quillRef.current?.getEditor?.();
                if (!quill) return;

                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/*");
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = () => {
                    const captionPlaceholder = t("image_caption_inline_placeholder");
                    const range = quill.getSelection(true) ?? { index: quill.getLength(), length: 0 };
                    const imageIndex = range.index;
                    const captionIndex = imageIndex + 2;

                    quill.insertEmbed(imageIndex, "image", reader.result, "user");
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
                  };
                  reader.readAsDataURL(file);
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
            "img[src*='fbcdn.net']",
            (node, delta) => {
              const alt = node.getAttribute("alt");
              return alt ? new Delta().insert(alt) : delta;
            },
          ],
        ],
      },
    }),
    [allowImages, requireImageCaptions, t]
  );

  const formats = [
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
  ];

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
        "& .ql-editor.ql-blank::before": {
          color: theme.palette.text.disabled,
          fontStyle: "normal",
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
        "& .ql-editor a": {
          overflowWrap: "normal",
          wordBreak: "normal",
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
