UPDATE public.email_templates
SET content = NULL
WHERE template_code = 'eventInvitation'
  AND updated_by IS NULL;
