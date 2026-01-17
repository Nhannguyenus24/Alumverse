import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
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
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel} disabled={loading}>
					{cancelText}
				</Button>
				<Button
					onClick={handleConfirm}
					color={confirmColor}
					variant="contained"
					disabled={loading}
				>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmDialog;