import { useState, Fragment } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Typography,
  alpha,
  useTheme,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import SearchBar from '../SearchBar';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const AdminDataTable = ({
  columns,
  rows,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  searchValue,
  searchPlaceholder = 'Tìm kiếm...',
  actions,
  filters,
  onExport,
  addButton,
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp.',
  onRowClick,
  renderExpandableRow,
}) => {
  const theme = useTheme();
  const [expandedRow, setExpandedRow] = useState(null);

  const handleRowExpand = (id, e) => {
    e.stopPropagation();
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      {/* Table Toolbar */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Search */}
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            sx={{
              maxWidth: { md: 400 },
            }}
          />

          {/* Actions & Filters */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {filters}
            {onExport && (
              <Tooltip title="Xuất dữ liệu">
                <IconButton
                  size="small"
                  onClick={onExport}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    color: 'primary.main',
                    height: 40,
                    width: 40
                  }}
                >
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {actions}
            {addButton && (
              <Box sx={{ ml: 0.5 }}>
                {addButton}
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Table Content */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              {renderExpandableRow && <TableCell sx={{ width: 48, bgcolor: (t) => t.palette.mode === 'light' ? '#F4F6F8' : t.palette.background.default }} />}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    bgcolor: (t) => t.palette.mode === 'light' ? 'primary.main' : 'primary.dark',
                    fontWeight: 700,
                    color: 'primary.contrastText',
                    fontSize: 13,
                    py: 2,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderExpandableRow ? 1 : 0)} sx={{ py: 10, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const rowId = row.id || idx;
                const isExpanded = expandedRow === rowId;
                
                return (
                  <Fragment key={rowId}>
                    <TableRow
                      hover
                      onClick={() => onRowClick?.(row)}
                      sx={{ 
                        cursor: onRowClick ? 'pointer' : 'default',
                        borderBottom: isExpanded ? 'none' : undefined,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                      }}
                    >
                      {renderExpandableRow && (
                        <TableCell sx={{ py: 2 }}>
                          <IconButton size="small" onClick={(e) => handleRowExpand(rowId, e)}>
                            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align || 'left'} sx={{ py: 2, fontSize: 14 }}>
                            {column.render ? column.render(value, row) : (value || '—')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {renderExpandableRow && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1 }}>
                              {renderExpandableRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Số dòng mỗi trang:"
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />
    </Paper>
  );
};

export default AdminDataTable;
