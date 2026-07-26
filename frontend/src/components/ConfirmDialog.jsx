import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const ConfirmDialog = ({
	open = false,
	title,
	message,
	confirmText,
	cancelText,
	onConfirm,
	onCancel,
	confirmColor = "primary",
	titleColor,
	loading = false,
	reasonLabel,
	reasonValue,
	onReasonChange,
}) => {
	const { t } = useTranslation(["common"]);

	const displayTitle = title || t("common:confirm");
	const displayMessage = message || t("common:confirm_message");
	const displayConfirmText = confirmText || t("common:confirm");
	const displayCancelText = cancelText || t("common:cancel");

	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm();
		}
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};

	const reasonRequired = Boolean(reasonLabel);
	const reasonBlank = reasonRequired && !reasonValue?.trim();

	return (
		<Dialog
			open={open}
			onClose={handleCancel}
			aria-labelledby="confirm-dialog-title"
			aria-describedby="confirm-dialog-description"
		>
			<DialogTitle id="confirm-dialog-title" sx={{ color: titleColor }}>
				{displayTitle}
			</DialogTitle>
			<DialogContent>
				<DialogContentText id="confirm-dialog-description">
					{displayMessage}
				</DialogContentText>
				{reasonRequired && (
					<TextField
						autoFocus
						required
						fullWidth
						multiline
						minRows={2}
						margin="dense"
						label={reasonLabel}
						value={reasonValue ?? ""}
						onChange={(e) => onReasonChange?.(e.target.value)}
						error={reasonBlank}
						disabled={loading}
					/>
				)}
			</DialogContent>
			<DialogActions>
				<Button variant="outlined"
						color="secondary"
						onClick={handleCancel}
						disabled={loading}>
					{displayCancelText}
				</Button>
				<Button
					onClick={handleConfirm}
					color={confirmColor}
					variant="contained"
					disabled={loading || reasonBlank}
				>
					{displayConfirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmDialog;
