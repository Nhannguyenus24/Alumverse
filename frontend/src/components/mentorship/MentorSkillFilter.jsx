import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { useSkillSearch } from '../../hooks/mentorship/useSkillSearch';

/**
 * "Filter theo kỹ năng": multi-select over the skills catalog (skills table),
 * with a %LIKE% search box. Replaces the old separate "Lĩnh vực"/"Chủ đề"
 * dropdowns, which filtered on free-text category/topic values.
 *
 * value/onChange work with an array of { id, name } options so the caller can
 * derive skillIds for the API without a second lookup.
 */
const MentorSkillFilter = ({ value = [], onChange, sx }) => {
  const { t } = useTranslation(['mentorship']);
  const [inputValue, setInputValue] = useState('');

  const skillsQuery = useSkillSearch(inputValue);
  const options = useMemo(() => {
    const fetched = skillsQuery.data ?? [];
    const selectedNotInFetched = value.filter(
      (v) => !fetched.some((o) => o.id === v.id),
    );
    return [...selectedNotInFetched, ...fetched];
  }, [skillsQuery.data, value]);

  return (
    <Autocomplete
      multiple
      size="small"
      sx={{ minWidth: 260, ...sx }}
      options={options}
      value={value}
      loading={skillsQuery.isFetching}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      getOptionLabel={(opt) => opt.name}
      filterOptions={(opts) => opts}
      inputValue={inputValue}
      onInputChange={(_, newInput) => setInputValue(newInput)}
      onChange={(_, newValue) => onChange?.(newValue)}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip label={option.name} size="small" {...getTagProps({ index })} key={option.id} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length ? '' : t('mentorship:filter_skill')}
          label={t('mentorship:filter_skill')}
        />
      )}
    />
  );
};

export default MentorSkillFilter;
