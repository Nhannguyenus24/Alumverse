import {
	Table as MuiTable,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TablePagination,
	Box,
} from '@mui/material';

const Table = ({
	columns = [],
	rows = [],
	page = 0,
	rowsPerPage = 10,
	onPageChange,
	onRowsPerPageChange,
	totalRows,
	loading = false,
}) => {
	const handleChangePage = (event, newPage) => {
		if (onPageChange) {
			onPageChange(newPage);
		}
	};

	const handleChangeRowsPerPage = (event) => {
		if (onRowsPerPageChange) {
			onRowsPerPageChange(parseInt(event.target.value, 10));
		}
	};

	return (
		<Paper>
			<TableContainer>
				<MuiTable>
					<TableHead>
						<TableRow>
							{columns.map((column) => (
								<TableCell
									key={column.id}
									align={column.align || 'left'}
									sx={{ fontWeight: 600 }}
								>
									{column.label}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={columns.length} align="center">
									Đang tải...
								</TableCell>
							</TableRow>
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={columns.length} align="center">
									Không có dữ liệu
								</TableCell>
							</TableRow>
						) : (
							rows.map((row, rowIndex) => (
								<TableRow key={rowIndex} hover>
									{columns.map((column) => (
										<TableCell key={column.id} align={column.align || 'left'}>
											{column.render
												? column.render(row[column.id], row)
												: row[column.id]}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</MuiTable>
			</TableContainer>
			{totalRows !== undefined && (
				<TablePagination
					component="div"
					count={totalRows}
					page={page}
					onPageChange={handleChangePage}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={[5, 10, 25, 50]}
					labelRowsPerPage="Số dòng mỗi trang:"
					labelDisplayedRows={({ from, to, count }) =>
						`${from}-${to} trong tổng ${count}`
					}
				/>
			)}
		</Paper>
	);
};

export default Table;