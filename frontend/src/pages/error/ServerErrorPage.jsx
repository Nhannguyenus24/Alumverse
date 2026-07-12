import { useTranslation } from 'react-i18next';
import { useErrorPageActions } from '../../hooks/useErrorPageActions';



export default function ServerErrorPage() {
	const { goHome, retry } = useErrorPageActions();
	const { t } = useTranslation('common');

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
			<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
				<Container maxWidth="md">
					<ScrollRevealGroup
						stagger={0.09}
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
					<ScrollRevealItem><ErrorOutlineIcon
						sx={{
							fontSize: 120,
							color: 'error.main',
							mb: 2,
						}}
					/></ScrollRevealItem>

					<ScrollRevealItem><Typography
						variant="h1"
						sx={{
							fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
							fontWeight: 700,
							color: 'error.main',
							mb: 2,
						}}
					>
						500
					</Typography></ScrollRevealItem>

					<ScrollRevealItem><Typography
						variant="h4"
						sx={{
							fontWeight: 600,
							mb: 2,
							color: 'text.primary',
						}}
					>
						{t('server_error_heading')}
					</Typography></ScrollRevealItem>

					<ScrollRevealItem><Typography
						variant="body1"
						sx={{
							color: 'text.secondary',
							mb: 4,
							maxWidth: 500,
						}}
					>
						{t('server_error_desc')}
					</Typography></ScrollRevealItem>

					<ScrollRevealItem><Box
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
							onClick={retry}
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
							onClick={goHome}
							sx={{
								px: 4,
								py: 1.5,
								textTransform: 'none',
								fontSize: '1rem',
							}}
						>
							{t('not_found_go_home')}
						</Button>
					</Box></ScrollRevealItem>
					</ScrollRevealGroup>
				</Container>
			</Box>
		</Page>
	);
}
