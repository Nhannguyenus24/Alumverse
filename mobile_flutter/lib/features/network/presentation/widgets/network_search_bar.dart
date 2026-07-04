import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../organization/data/models/organization.dart';

/// Reusable search bar for Network tabs. Fires [onSubmit] on text submit /
/// clear. Optionally shows extra filter fields (program, major) plus a
/// multi-select faculty (organization) filter when [organizations] is provided.
class NetworkSearchBar extends StatefulWidget {
  const NetworkSearchBar({
    super.key,
    required this.hintText,
    required this.onSubmit,
    this.initialValue = '',
    this.showFilters = false,
    this.programValue = '',
    this.majorValue = '',
    this.onProgramSubmit,
    this.onMajorSubmit,
    this.organizations = const [],
    this.selectedOrganizationIds = const [],
    this.onOrganizationsChanged,
  });

  final String hintText;
  final String initialValue;
  final ValueChanged<String> onSubmit;

  final bool showFilters;
  final String programValue;
  final String majorValue;
  final ValueChanged<String>? onProgramSubmit;
  final ValueChanged<String>? onMajorSubmit;

  /// Options for the faculty multi-select. When empty the faculty filter is
  /// hidden (e.g. the org list hasn't loaded yet).
  final List<Organization> organizations;
  final List<int> selectedOrganizationIds;
  final ValueChanged<List<int>>? onOrganizationsChanged;

  @override
  State<NetworkSearchBar> createState() => _NetworkSearchBarState();
}

class _NetworkSearchBarState extends State<NetworkSearchBar> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _programCtrl;
  late final TextEditingController _majorCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialValue);
    _programCtrl = TextEditingController(text: widget.programValue);
    _majorCtrl = TextEditingController(text: widget.majorValue);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _programCtrl.dispose();
    _majorCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showFaculty =
        widget.showFilters &&
        widget.organizations.isNotEmpty &&
        widget.onOrganizationsChanged != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Column(
        children: [
          _buildField(
            controller: _nameCtrl,
            hint: widget.hintText,
            prefixIcon: Icons.search,
            onSubmit: widget.onSubmit,
          ),
          if (widget.showFilters) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildField(
                    controller: _programCtrl,
                    hint: 'network.program_filter_hint'.tr(),
                    prefixIcon: Icons.school_outlined,
                    onSubmit: widget.onProgramSubmit ?? (_) {},
                    dense: true,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildField(
                    controller: _majorCtrl,
                    hint: 'network.major_filter_hint'.tr(),
                    prefixIcon: Icons.book_outlined,
                    onSubmit: widget.onMajorSubmit ?? (_) {},
                    dense: true,
                  ),
                ),
              ],
            ),
          ],
          if (showFaculty) ...[const SizedBox(height: 8), _buildFacultyField()],
        ],
      ),
    );
  }

  Widget _buildFacultyField() {
    final selected = widget.selectedOrganizationIds;
    final hasSelection = selected.isNotEmpty;

    String label;
    if (selected.isEmpty) {
      label = 'network.faculty_filter_label'.tr();
    } else if (selected.length == 1) {
      final match =
          widget.organizations.where((o) => o.id == selected.first).toList();
      label =
          match.isNotEmpty
              ? match.first.name
              : 'network.faculty_selected_count'.tr(namedArgs: {'count': '1'});
    } else {
      label = 'network.faculty_selected_count'.tr(
        namedArgs: {'count': selected.length.toString()},
      );
    }

    return InkWell(
      onTap: _openFacultySheet,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: hasSelection ? AppColors.primary : AppColors.divider,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.apartment_outlined,
              size: 20,
              color: hasSelection ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  color:
                      hasSelection
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                ),
              ),
            ),
            if (hasSelection)
              GestureDetector(
                onTap: () => widget.onOrganizationsChanged?.call(const []),
                child: const Icon(
                  Icons.clear,
                  size: 18,
                  color: AppColors.textSecondary,
                ),
              )
            else
              const Icon(
                Icons.arrow_drop_down,
                size: 22,
                color: AppColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _openFacultySheet() async {
    final result = await showModalBottomSheet<List<int>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder:
          (ctx) => _FacultyPickerSheet(
            organizations: widget.organizations,
            initialSelected: widget.selectedOrganizationIds,
          ),
    );
    if (result != null) {
      widget.onOrganizationsChanged?.call(result);
    }
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    required ValueChanged<String> onSubmit,
    bool dense = false,
  }) {
    return TextField(
      controller: controller,
      textInputAction: TextInputAction.search,
      style: TextStyle(fontSize: dense ? 13 : 14),
      onSubmitted: onSubmit,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        prefixIcon: Icon(
          prefixIcon,
          size: dense ? 18 : 20,
          color: AppColors.textSecondary,
        ),
        suffixIcon:
            controller.text.isNotEmpty
                ? IconButton(
                  icon: const Icon(
                    Icons.clear,
                    size: 18,
                    color: AppColors.textSecondary,
                  ),
                  onPressed: () {
                    controller.clear();
                    onSubmit('');
                  },
                )
                : null,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 12,
          vertical: dense ? 8 : 12,
        ),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
        isDense: dense,
      ),
    );
  }
}

/// Bottom sheet with a checkbox list of faculties. Selection is held locally
/// and only committed when the user taps "Apply" (returns the ids) — tapping
/// "Clear" returns an empty list. Dismissing without a button returns null.
class _FacultyPickerSheet extends StatefulWidget {
  const _FacultyPickerSheet({
    required this.organizations,
    required this.initialSelected,
  });

  final List<Organization> organizations;
  final List<int> initialSelected;

  @override
  State<_FacultyPickerSheet> createState() => _FacultyPickerSheetState();
}

class _FacultyPickerSheetState extends State<_FacultyPickerSheet> {
  late final Set<int> _selected;

  @override
  void initState() {
    super.initState();
    _selected = {...widget.initialSelected};
  }

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.of(context).size.height * 0.7;

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'network.faculty_sheet_title'.tr(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: widget.organizations.length,
                itemBuilder: (ctx, i) {
                  final org = widget.organizations[i];
                  final checked = _selected.contains(org.id);
                  return CheckboxListTile(
                    value: checked,
                    title: Text(org.name, style: const TextStyle(fontSize: 14)),
                    controlAffinity: ListTileControlAffinity.leading,
                    activeColor: AppColors.primary,
                    dense: true,
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _selected.add(org.id);
                        } else {
                          _selected.remove(org.id);
                        }
                      });
                    },
                  );
                },
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, <int>[]),
                      child: Text('network.faculty_clear'.tr()),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          () => Navigator.pop(context, _selected.toList()),
                      child: Text('network.faculty_apply'.tr()),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
