import { Box } from "@mui/material";
import { useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const Delta = Quill.import("delta");

const WYSIWYG = ({
  value = "",
  onChange,
  placeholder = "Enter content...",
  readOnly = false,
  height = 300,
  allowImages = true,
}) => {
  const quillRef = useRef(null);

  const modules = useMemo(
    () => ({
      toolbar: [
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
    [allowImages]
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
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        "& .quill": {
          display: "flex",
          flexDirection: "column",
        },
        "& .ql-toolbar": {
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          flexShrink: 0,
        },
        "& .ql-container": {
          height: `${height}px`,
          fontSize: "1rem",
          border: "none",
        },
        "& .ql-editor": {
          height: "100%",
          fontFamily: "Nunito, 'sans-serif'",
          overflowY: "auto",
          textAlign: "justify",
          overflowWrap: "normal",
          wordBreak: "normal",
          hyphens: "none",
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
      }}
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
