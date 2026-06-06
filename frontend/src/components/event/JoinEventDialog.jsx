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
} from "@mui/material";
import { useState } from "react";

const JoinEventDialog = ({
  open,
  onClose,
  onConfirm,
  eventTitle,
  questions = [],
}) => {
  const [answers, setAnswers] = useState({});

  const handleShortText = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSingleChoice = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMultiChoice = (questionId, option) => {
    const current = answers[questionId] || [];

    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated,
    }));
  };

  const handleSubmit = () => {
    onConfirm?.(answers);
    onClose();
  };

  const hasQuestions = questions.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle fontWeight={700}>
        Xác nhận tham gia
      </DialogTitle>

      <DialogContent>
        {!hasQuestions ? (
          <Typography>
            Bạn có chắc chắn muốn tham gia sự kiện{" "}
            <strong>{eventTitle}</strong>?
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography>
              Vui lòng cung cấp một số thông tin trước khi tham gia sự kiện.
            </Typography>

            {questions.map((question) => (
              <Box key={question.id}>
                <Typography
                  fontWeight={600}
                  sx={{ mb: 1 }}
                >
                  {question.label}
                </Typography>

                {/* SHORT TEXT */}
                {question.type === "shortText" && (
                  <TextField
                    fullWidth
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleShortText(
                        question.id,
                        e.target.value
                      )
                    }
                  />
                )}

                {/* SINGLE OPTION */}
                {question.type === "singleChoice" && (
                  <FormControl>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleSingleChoice(
                          question.id,
                          e.target.value
                        )
                      }
                    >
                      {question.options.map((option) => (
                        <FormControlLabel
                          key={option}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* MULTI OPTION */}
                {question.type === "multiChoice" && (
                  <FormControl>
                    <FormLabel />
                    {question.options.map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={
                              answers[
                                question.id
                              ]?.includes(option) || false
                            }
                            onChange={() =>
                              handleMultiChoice(
                                question.id,
                                option
                              )
                            }
                          />
                        }
                        label={option}
                      />
                    ))}
                  </FormControl>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
        >
          Đóng
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Xác nhận tham gia
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinEventDialog;