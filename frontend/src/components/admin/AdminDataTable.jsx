import React, { useState } from 'react';
import {
  alpha,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const AdminDataTable = ({
  columns,
  rows,
  totalCount,
  total,
  page,
  rowsPerPage,
  pageSize,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onSearchKeyDown,
  searchValue,
  searchPlaceholder,
  actions,
  filters,
  onExport,
  addButton,
  emptyMessage,
  onRowClick,
  renderExpandableRow,
  getRowId,
  loading = false,
}) => {
  const { t } = useTranslation(['common', 'admin']);
  const theme = useTheme();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common:search_placeholder');
  const resolvedEmptyMessage = emptyMessage ?? t('common:no_data_found');
  const resolvedRows = rows ?? [];
  const resolvedTotalCount = totalCount ?? total ?? resolvedRows.length;
  const resolvedRowsPerPage = rowsPerPage ?? pageSize ?? 10;
  const [expandedRow, setExpandedRow] = useState(null);
  const tableHeadBg = theme.palette.mode === 'dark'
    ? theme.palette.primary.dark
    : theme.palette.primary.main;
  const tableHeadColor = theme.palette.mode === 'dark'
    ? theme.palette.text.primary
    : theme.palette.primary.contrastText;

  const handlePageChange = (event, nextPage) => {
    if (!onPageChange) return;
    if (onPageChange.length <= 1) {
      onPageChange(nextPage);
      return;
    }
    onPageChange(event, nextPage);
  };

  const handleRowsPerPageChange = (event) => {
    onRowsPerPageChange?.(event);
  };

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
          {onSearchChange ? (
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              onKeyDown={onSearchKeyDown}
              placeholder={resolvedSearchPlaceholder}
              sx={{
                maxWidth: { md: 400 },
              }}
            />
          ) : (
            <Box sx={{ flex: 1 }} />
          )}

          {/* Actions & Filters */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {filters}
            {onExport && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={onExport}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  color: 'primary.main',
                  height: 40,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2
                }}
              >
                {t('admin:export_excel', { defaultValue: 'Xuất Excel' })}
              </Button>
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
        <Table
          stickyHeader
          size="medium"
          sx={{
            borderSpacing: 0,
            '& .MuiTableCell-stickyHeader': {
              borderLeft: '0 !important',
              borderRight: '0 !important',
              backgroundClip: 'border-box',
              boxShadow: 'none',
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: tableHeadBg }}>
              {renderExpandableRow && (
                <TableCell
                  sx={{
                    width: 48,
                    bgcolor: tableHeadBg,
                    color: tableHeadColor,
                    borderLeft: 0,
                    borderRight: 0,
                  }}
                />
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth || column.width,
                    bgcolor: tableHeadBg,
                    fontWeight: 700,
                    color: tableHeadColor,
                    fontSize: 13,
                    py: 2,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderLeft: 0,
                    borderRight: 0,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderExpandableRow ? 1 : 0)} sx={{ py: 10, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common:loading')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : resolvedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderExpandableRow ? 1 : 0)} sx={{ py: 10, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    {resolvedEmptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              resolvedRows.map((row, idx) => {
                const rowId = getRowId ? getRowId(row, idx) : (row.id ?? idx);
                const isExpanded = expandedRow === rowId;
                
                return (
                  <Fragment key={rowId}>
                    <TableRow
                      hover
                      onClick={() => onRowClick?.(row)}
                      sx={{ 
                        cursor: onRowClick ? 'pointer' : 'default',
                        borderBottom: isExpanded ? 'none' : undefined,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.02) }
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
                          <TableCell
                            key={column.id}
                            align={column.align || 'left'}
                            sx={{
                              py: 2,
                              fontSize: 14,
                              width: column.width,
                              minWidth: column.minWidth || column.width,
                            }}
                          >
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
        count={resolvedTotalCount}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={resolvedRowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20, 25, 50]}
        labelRowsPerPage={t('common:rows_per_page')}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />
    </Paper>
  );
};

export default React.memo(AdminDataTable);
