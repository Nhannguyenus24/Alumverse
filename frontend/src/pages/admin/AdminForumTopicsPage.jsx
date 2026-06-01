import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Grid,
  Stack,
} from "@mui/material";
import { useOutletContext } from "react-router";
import { adminOrganizationApi } from "../../api/adminOrganizationApi";
import { useEffect } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import { useAdminForumContext } from "../../contexts/AdminForumContext";
import { useAdminSystemContext } from "../../contexts/AdminSystemContext";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dateFormatter";

const AdminForumTopicsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { activeOrgId } = useAdminSystemContext();
  const {
    topics: topicsPaginated,
    topicsPage,
    setTopicsPage,
    topicsSize,
    setTopicsSize,
    topicsLoading,
    categories,
    createTopic,
    updateTopic,
    deleteTopic,
    updateTopicLock,
  } = useAdminForumContext();
  const { setBreadcrumbs } = useOutletContext();
  const { setActiveOrgId } = useAdminSystemContext();
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    setBreadcrumbs?.([{ label: 'Chủ đề', active: true }]);

    const fetchOrgs = async () => {
      try {
        const data = await adminOrganizationApi.getOrganizations({ page: 0, size: 200 });
        setOrganizations(data || []);
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };
    fetchOrgs();
  }, [setBreadcrumbs]);

  const { user } = useAuth();

  const topicsList = useMemo(() => {
    if (!topicsPaginated) return [];
    if (Array.isArray(topicsPaginated)) return topicsPaginated;
    return topicsPaginated.content ?? [];
  }, [topicsPaginated]);

  const totalElements = topicsPaginated?.totalElements ?? topicsList.length;

  const [search, setSearch] = useState("");
  const [detailTopic, setDetailTopic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    topic: null,
  });
  const [form, setForm] = useState({ title: "", categoryId: "" });

  const columns = [
    { id: "id", label: "ID", width: 60 },
    {
      id: "title",
      label: "Tiêu đề",
      render: (val, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {val}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {categories?.find((c) => c.id === row.categoryId)?.name ||
              `Category #${row.categoryId}`}
          </Typography>
        </Box>
      ),
    },
    {
      id: "createdByName",
      label: "Người tạo",
      render: (val, row) => val || row.createdByMemberId || "-",
    },
    { id: "viewCount", label: "Lượt xem", align: "center" },
    {
      id: "isLocked",
      label: "Trạng thái",
      render: (val, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {val ? (
            <Tooltip title="Mở khóa">
              <IconButton
                size="small"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTopicLock?.(row.id, false, Number(user?.id));
                }}
              >
                <LockOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Khóa">
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTopicLock?.(row.id, true, Number(user?.id));
                }}
              >
                <LockOpenOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {val ? "Đã khóa" : "Mở"}
          </Typography>
        </Box>
      ),
    },
    { id: "createdAt", label: "Ngày tạo", render: (val) => formatDate(val) },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Chi tiết">
            <IconButton size="small" onClick={() => setDetailTopic(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(row)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const openCreate = () => {
    setForm({ title: "", categoryId: categories?.[0]?.id || "" });
    setDialog({ open: true, mode: "create", topic: null });
  };

  const openEdit = (topic) => {
    setForm({ title: topic.title || "", categoryId: topic.categoryId || "" });
    setDialog({ open: true, mode: "edit", topic });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      enqueueSnackbar("Vui lòng nhập tiêu đề.", { variant: "warning" });
      return;
    }
    if (dialog.mode === "create") {
      const ok = await createTopic?.(
        activeOrgId,
        form.categoryId,
        form.title,
        Number(user?.id),
      );
      enqueueSnackbar(ok ? "Đã tạo chủ đề." : "Lỗi tạo chủ đề.", {
        variant: ok ? "success" : "error",
      });
    } else {
      const ok = await updateTopic?.(
        dialog.topic.id,
        form.title,
        form.categoryId,
      );
      enqueueSnackbar(ok ? "Đã cập nhật chủ đề." : "Lỗi cập nhật.", {
        variant: ok ? "success" : "error",
      });
    }
    setDialog({ open: false, mode: "create", topic: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTopic?.(deleteTarget.id);
    enqueueSnackbar(ok ? "Đã xóa chủ đề." : "Lỗi xóa.", {
      variant: ok ? "success" : "error",
    });
    setDeleteTarget(null);
  };

  const stats = {
    total: totalElements,
    locked: topicsList.filter((t) => t.isLocked).length,
    mostViewed:
      topicsList.length > 0
        ? Math.max(...topicsList.map((t) => t.viewCount || 0))
        : 0,
    categoriesCount: categories?.length || 0,
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Chủ đề diễn đàn
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Quản lý các cuộc thảo luận, khóa chủ đề không phù hợp và phân loại
            nội dung.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Tổ chức"
            value={activeOrgId || ""}
            onChange={(e) => setActiveOrgId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreate}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
          >
            Tạo chủ đề
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 4,
          "& > *": {
            flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 12px)", md: "1 1 0" },
          },
        }}
      >
        <AdminDashboardMetricTile
          label="Tổng chủ đề"
          value={stats.total}
          icon={<ForumOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label="Đang thảo luận"
          value={stats.total - stats.locked}
          icon={<ChatOutlinedIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label="Lượt xem cao nhất"
          value={stats.mostViewed}
          icon={<VisibilityIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label="Chủ đề bị khóa"
          value={stats.locked}
          icon={<LockOutlinedIcon />}
          valueColor="warning.main"
        />
      </Box>

      <AdminDataTable
        columns={columns}
        rows={topicsList}
        totalCount={totalElements}
        page={topicsPage}
        rowsPerPage={topicsSize}
        onPageChange={(_, p) => setTopicsPage?.(p)}
        onRowsPerPageChange={(e) => {
          setTopicsSize?.(Number(e.target.value));
          setTopicsPage?.(0);
        }}
        onSearchChange={(v) => setSearch(v)}
        searchValue={search}
        searchPlaceholder="Tìm kiếm tiêu đề..."
        loading={topicsLoading}
      />

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailTopic)}
        onClose={() => setDetailTopic(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Chi tiết chủ đề</DialogTitle>
        {detailTopic && (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailTopic.id}
            </Typography>
            <Typography variant="body2">
              <strong>Tiêu đề:</strong> {detailTopic.title}
            </Typography>
            <Typography variant="body2">
              <strong>Người tạo:</strong>{" "}
              {detailTopic.createdByName ||
                detailTopic.createdByMemberId ||
                "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Lượt xem:</strong> {detailTopic.viewCount ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>Trạng thái:</strong>{" "}
              {detailTopic.isLocked ? "Đã khóa" : "Đang mở"}
            </Typography>
            <Typography variant="body2">
              <strong>Ngày tạo:</strong> {formatDate(detailTopic.createdAt)}
            </Typography>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDetailTopic(null)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.mode === "create" ? "Tạo chủ đề mới" : "Chỉnh sửa chủ đề"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="Tiêu đề"
            required
            fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Danh mục"
            fullWidth
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialog((d) => ({ ...d, open: false }))}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ borderRadius: 2 }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Xóa chủ đề"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa chủ đề "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminForumTopicsPage;
