import Breadcrumbs from './Breadcrumbs';
import Table from './Table';
import Button from './Button';
import Card from './Card';
import Paper from './Paper';

export default function ComponentsOverrides(theme) {
  return Object.assign(
    Breadcrumbs(theme),
    Table(theme),
    Button(theme),
    Card(theme),
    Paper(theme)
  );
}