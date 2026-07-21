import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	TextField,
} from "@mui/material";

const ConfirmDialog = ({
	open = false,
	title = "Confirm",
	message = "Are you sure you want to perform this action?",
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
	confirmColor = "primary",
	loading = false,
	reasonLabel,
	reasonValue,
	onReasonChange,
}) => {
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
			<DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
			<DialogContent>
				<DialogContentText id="confirm-dialog-description">
					{message}
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
					{cancelText}
				</Button>
				<Button
					onClick={handleConfirm}
					color={confirmColor}
					variant="contained"
					disabled={loading || reasonBlank}
				>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmDialog;
