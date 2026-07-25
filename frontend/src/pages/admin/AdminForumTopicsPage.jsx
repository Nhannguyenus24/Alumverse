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
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Grid,
  Stack,
} from "@mui/material";
import { useOutletContext, useParams } from "react-router";
import { useDebounce } from "../../hooks/useDebounce";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusChip from "../../components/admin/AdminStatusChip";
import AdminDashboardMetricTile from "../../components/admin/AdminDashboardMetricTile";
import AdminConfirmDeleteDialog from "../../components/admin/AdminConfirmDeleteDialog";
import { FORUM_TOPIC_STATUS_OPTIONS } from "../../constants/adminDefaultForumPosts";
import { useAdminForumContext, useAdminSystemContext } from "../../stores/AdminStore";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dateFormatter";

const AdminForumTopicsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("admin");
  const { stableOrgId, activeOrganization } = useAdminSystemContext();
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
    updateTopicStatus,
    topicsSearch,
    setTopicsSearch,
  } = useAdminForumContext();
  const { setBreadcrumbs } = useOutletContext();
  const { slug } = useParams();
  const orgSlug = slug || activeOrganization?.slug;

  useEffect(() => {
    setBreadcrumbs?.([{ label: t('forum_topics_breadcrumb'), active: true }]);
  }, [setBreadcrumbs, t]);

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState(topicsSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setTopicsSearch(debouncedSearch);
    setTopicsPage?.(0); // reset về trang đầu khi keyword thay đổi
  }, [debouncedSearch, setTopicsSearch]);

  const topicsList = useMemo(() => {
    if (!topicsPaginated) return [];
    return topicsPaginated.content ?? [];
  }, [topicsPaginated]);

  const totalElements = topicsPaginated?.totalElements ?? 0;
  const [detailTopic, setDetailTopic] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusMenu, setStatusMenu] = useState(null);
  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    topic: null,
  });
  const [form, setForm] = useState({ title: "", categoryId: "" });

  const statusLabel = (s) => {
    const k = String(s || "").toUpperCase();
    if (k === "ACTIVE") return t("forum_status_active");
    if (k === "INACTIVE") return t("forum_status_inactive");
    if (k === "PENDING") return t("forum_status_pending");
    return s || "-";
  };

  const handleChangeStatus = async (topicId, status) => {
    setStatusMenu(null);
    const ok = await updateTopicStatus?.(topicId, status);
    enqueueSnackbar(ok ? t("forum_status_updated") : t("forum_status_update_failed"), {
      variant: ok ? "success" : "error",
    });
  };

  const columns = [
    { id: "id", label: "ID", width: 60 },
    {
      id: "title",
      label: t('forum_col_title'),
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
      label: t('forum_col_created_by'),
      render: (val, row) => val || row.createdByMemberId || "-",
    },
    { id: "viewCount", label: t('forum_col_views'), align: "center" },
    {
      id: "status",
      label: t('forum_col_status'),
      render: (val, row) => (
        <Tooltip title={t('forum_status_change')}>
          <span>
            <AdminStatusChip
              status={row.status}
              category="forum"
              label={statusLabel(row.status)}
              onClick={(e) => {
                e.stopPropagation();
                setStatusMenu({ anchorEl: e.currentTarget, topic: row });
              }}
              sx={{ cursor: "pointer" }}
            />
          </span>
        </Tooltip>
      ),
    },
    { id: "createdAt", label: t('forum_col_created_at_date'), render: (val) => formatDate(val) },
    {
      id: "actions",
      label: t('actions'),
      align: "right",
      width: 130,
      render: (_, row) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={t('forum_action_detail')}>
            <IconButton size="small" color="primary" onClick={() => setDetailTopic(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {String(row.status || "").toUpperCase() === "PENDING" && (
            <Tooltip title={t('forum_action_approve', { defaultValue: 'Duyệt' })}>
              <IconButton
                size="small"
                color="success"
                onClick={() => handleChangeStatus(row.id, "ACTIVE")}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('forum_action_edit')}>
            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('forum_action_delete')}>
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
      enqueueSnackbar(t('forum_topic_title_required'), { variant: "warning" });
      return;
    }
    if (dialog.mode === "create") {
      const ok = await createTopic?.(
        stableOrgId,
        form.categoryId,
        form.title,
        Number(user?.id),
      );
      enqueueSnackbar(ok ? t('forum_topic_created') : t('forum_topic_create_failed'), {
        variant: ok ? "success" : "error",
      });
    } else {
      const ok = await updateTopic?.(
        dialog.topic.id,
        form.title,
        form.categoryId,
      );
      enqueueSnackbar(ok ? t('forum_topic_updated') : t('forum_topic_update_failed'), {
        variant: ok ? "success" : "error",
      });
    }
    setDialog({ open: false, mode: "create", topic: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTopic?.(deleteTarget.id);
    enqueueSnackbar(ok ? t('forum_topic_deleted') : t('forum_topic_delete_failed'), {
      variant: ok ? "success" : "error",
    });
    setDeleteTarget(null);
  };

  const stats = {
    total: totalElements,
    pending: topicsList.filter((tp) => String(tp.status || "").toUpperCase() === "PENDING").length,
    active: topicsList.filter((tp) => String(tp.status || "").toUpperCase() === "ACTIVE").length,
    mostViewed:
      topicsList.length > 0
        ? Math.max(...topicsList.map((tp) => tp.viewCount || 0))
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
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {t('forum_topics_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('forum_topics_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={openCreate}
        >
          {t('forum_topic_create_btn')}
        </Button>
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
          label={t('forum_stat_total_topics')}
          value={stats.total}
          icon={<ForumOutlinedIcon />}
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_discussing')}
          value={stats.active}
          icon={<ChatOutlinedIcon />}
          valueColor="success.main"
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_most_viewed')}
          value={stats.mostViewed}
          icon={<VisibilityIcon />}
          valueColor="info.main"
        />
        <AdminDashboardMetricTile
          label={t('forum_stat_pending')}
          value={stats.pending}
          icon={<HourglassEmptyOutlinedIcon />}
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
        onSearchChange={(v) => {
          setSearchTerm(v);
          setTopicsPage?.(0);
        }}
        searchValue={searchTerm}
        searchPlaceholder={t('forum_search_topic_placeholder')}
        loading={topicsLoading}
        onRowClick={(row) => window.open(orgSlug ? `/${orgSlug}/forum/topic/${row.id}` : `/forum/topic/${row.id}`, "_blank")}
      />

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailTopic)}
        onClose={() => setDetailTopic(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('forum_topic_detail_title')}</DialogTitle>
        {detailTopic && (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {detailTopic.id}
            </Typography>
            <Typography variant="body2">
              <strong>{t('forum_col_title')}:</strong> {detailTopic.title}
            </Typography>
            <Typography variant="body2">
              <strong>{t('forum_col_created_by')}:</strong>{" "}
              {detailTopic.createdByName ||
                detailTopic.createdByMemberId ||
                "-"}
            </Typography>
            <Typography variant="body2">
              <strong>{t('forum_col_views')}:</strong> {detailTopic.viewCount ?? 0}
            </Typography>
            <Typography variant="body2">
              <strong>{t('forum_col_status')}:</strong>{" "}
              {statusLabel(detailTopic.status)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('forum_col_created_at_date')}:</strong> {formatDate(detailTopic.createdAt)}
            </Typography>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDetailTopic(null)}
            variant="outlined"
            color="secondary"
          >
            {t('forum_btn_close')}
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
          {dialog.mode === "create" ? t('forum_topic_create_dialog_title') : t('forum_topic_edit_dialog_title')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, overflow: 'visible' }}>
          <TextField
            label={t('forum_col_title')}
            required
            fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label={t('forum_col_category')}
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
          <Button variant="outlined" color="secondary" onClick={() => setDialog((d) => ({ ...d, open: false }))}>
            {t('forum_btn_cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
          >
            {t('forum_btn_save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={statusMenu?.anchorEl}
        open={Boolean(statusMenu)}
        onClose={() => setStatusMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {FORUM_TOPIC_STATUS_OPTIONS.map((opt) => (
          <MenuItem
            key={opt}
            selected={String(statusMenu?.topic?.status || "").toUpperCase() === opt}
            onClick={() => handleChangeStatus(statusMenu.topic.id, opt)}
          >
            {statusLabel(opt)}
          </MenuItem>
        ))}
      </Menu>

      <AdminConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={t('forum_topic_delete_title')}
        description={
          deleteTarget
            ? t('forum_topic_delete_desc', { title: deleteTarget.title })
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default AdminForumTopicsPage;
