import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";

const JoinEventDialog = ({
  open,
  onClose,
  onConfirm,
  eventTitle,
  questions = [],
  loading = false,
}) => {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setAnswers({});
      setErrors({});
    }
  }, [open, questions]);

  const handleShortText = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) setErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const handleSingleChoice = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) setErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const handleMultiChoice = (questionId, option) => {
    const current = answers[questionId] || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));
    if (errors[questionId]) setErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const validate = () => {
    const next = {};
    questions.forEach((q) => {
      if (!q.required) return;
      const val = answers[q.id];
      const empty = val == null
        || (typeof val === 'string' && !val.trim())
        || (Array.isArray(val) && val.length === 0);
      if (empty) next[q.id] = 'Vui lòng trả lời câu hỏi này';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onConfirm?.(answers);
  };

  const hasQuestions = questions.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Xác nhận tham gia</DialogTitle>

      <DialogContent>
        {!hasQuestions ? (
          <Typography>
            Bạn có chắc chắn muốn tham gia sự kiện <strong>{eventTitle}</strong>?
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography>
              Vui lòng cung cấp một số thông tin trước khi tham gia sự kiện.
            </Typography>

            {questions.map((question) => (
              <Box key={question.id}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  {question.label}
                  {question.required && <Typography component="span" color="error.main"> *</Typography>}
                </Typography>

                {question.type === "shortText" && (
                  <TextField
                    fullWidth
                    error={Boolean(errors[question.id])}
                    helperText={errors[question.id]}
                    value={answers[question.id] || ""}
                    onChange={(e) => handleShortText(question.id, e.target.value)}
                  />
                )}

                {question.type === "singleChoice" && (
                  <FormControl error={Boolean(errors[question.id])}>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onChange={(e) => handleSingleChoice(question.id, e.target.value)}
                    >
                      {(question.options || []).map((option) => (
                        <FormControlLabel
                          key={option}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                    {errors[question.id] && (
                      <Typography variant="caption" color="error">{errors[question.id]}</Typography>
                    )}
                  </FormControl>
                )}

                {question.type === "multiChoice" && (
                  <FormControl error={Boolean(errors[question.id])}>
                    <FormLabel />
                    {(question.options || []).map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={answers[question.id]?.includes(option) || false}
                            onChange={() => handleMultiChoice(question.id, option)}
                          />
                        }
                        label={option}
                      />
                    ))}
                    {errors[question.id] && (
                      <Typography variant="caption" color="error">{errors[question.id]}</Typography>
                    )}
                  </FormControl>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={loading}>
          Đóng
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Xác nhận tham gia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinEventDialog;
