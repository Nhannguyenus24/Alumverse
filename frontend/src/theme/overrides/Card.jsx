export default function Card(theme) {
	return {
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: theme.shape.borderRadius * 1.5,
				},
			},
		},
	};
}