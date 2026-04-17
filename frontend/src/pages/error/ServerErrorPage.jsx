import { Box, Button, Container, Typography } from '@mui/material';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Page from '../../components/Page';

export default function ServerErrorPage() {
	const navigate = useOrgNavigate();

	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<Page
			title="500 Internal Server Error"
			meta={
				<meta
					name="description"
					content="Lỗi máy chủ - AlumVerse, Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM"
				/>
			}
		>
			<Container maxWidth="md">
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '100vh',
						textAlign: 'center',
						py: 5,
					}}
				>
					<ErrorOutlineIcon
						sx={{
							fontSize: 120,
							color: 'error.main',
							mb: 2,
						}}
					/>

					<Typography
						variant="h1"
						sx={{
							fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
							fontWeight: 700,
							color: 'error.main',
							mb: 2,
						}}
					>
						500
					</Typography>

					<Typography
						variant="h4"
						sx={{
							fontWeight: 600,
							mb: 2,
							color: 'text.primary',
						}}
					>
						Internal Server Error
					</Typography>

					<Typography
						variant="body1"
						sx={{
							color: 'text.secondary',
							mb: 4,
							maxWidth: 500,
						}}
					>
						Oops! Something went wrong on our end. We're working to fix the
						issue. Please try refreshing the page or come back later.
					</Typography>

					<Box
						sx={{
							display: 'flex',
							gap: 2,
							flexWrap: 'wrap',
							justifyContent: 'center',
						}}
					>
						<Button
							variant="contained"
							size="large"
							onClick={handleRefresh}
							sx={{
								px: 4,
								py: 1.5,
								textTransform: 'none',
								fontSize: '1rem',
							}}
						>
							Refresh Page
						</Button>
						<Button
							variant="outlined"
							size="large"
							onClick={() => navigate('/')}
							sx={{
								px: 4,
								py: 1.5,
								textTransform: 'none',
								fontSize: '1rem',
							}}
						>
							Go to Home
						</Button>
					</Box>
				</Box>
			</Container>
		</Page>
	);
}