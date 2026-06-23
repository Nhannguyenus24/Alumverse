import { Box, Button, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

export default function ServerErrorPage() {
	const navigate = useOrgNavigate();
	const { t } = useTranslation('common');

	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<Page
			title={t('server_error_title')}
			meta={
				<meta
					name="description"
					content={t('server_error_meta_desc')}
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
						{t('server_error_heading')}
					</Typography>

					<Typography
						variant="body1"
						sx={{
							color: 'text.secondary',
							mb: 4,
							maxWidth: 500,
						}}
					>
						{t('server_error_desc')}
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
							{t('server_error_refresh')}
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
							{t('not_found_go_home')}
						</Button>
					</Box>
				</Box>
			</Container>
		</Page>
	);
}
