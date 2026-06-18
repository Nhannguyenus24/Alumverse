import 'package:flutter/material.dart';

/// A text field that validates **on blur**, not while typing. Error only shows
/// after the user leaves the field (and it's invalid); a valid field stays
/// clean. Once it has been blurred, further edits re-validate live so fixing an
/// error gives instant feedback.
///
/// Use inside a [Form] whose `autovalidateMode` is left at the default
/// (disabled) so the field controls its own validation timing.
class BlurValidatedField extends StatefulWidget {
  const BlurValidatedField({
    super.key,
    required this.controller,
    required this.validator,
    this.decoration = const InputDecoration(),
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  final TextEditingController controller;
  final FormFieldValidator<String> validator;
  final InputDecoration decoration;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;

  @override
  State<BlurValidatedField> createState() => _BlurValidatedFieldState();
}

class _BlurValidatedFieldState extends State<BlurValidatedField> {
  final _focus = FocusNode();
  // Don't validate until the field has been blurred at least once.
  AutovalidateMode _mode = AutovalidateMode.disabled;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      if (!_focus.hasFocus && _mode == AutovalidateMode.disabled) {
        setState(() => _mode = AutovalidateMode.onUserInteraction);
      }
    });
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      focusNode: _focus,
      validator: widget.validator,
      autovalidateMode: _mode,
      obscureText: widget.obscureText,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      onFieldSubmitted: widget.onFieldSubmitted,
      decoration: widget.decoration,
    );
  }
}
