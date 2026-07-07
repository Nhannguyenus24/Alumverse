import Breadcrumbs from './Breadcrumbs';
import Table from './Table';
import Button from './Button';
import Card from './Card';
import Paper from './Paper';
import TextField from './TextField';
import LayoutStability from './LayoutStability';
import Alert from './Alert';
import Dialog from './Dialog';
import DatePicker from './DatePicker';

const ComponentsOverrides = (theme) => {
  return Object.assign(
    LayoutStability(),
    Breadcrumbs(theme),
    Table(theme),
    Button(theme),
    Card(theme),
    Paper(theme),
    TextField(theme),
    Alert(theme),
    Dialog(theme),
    DatePicker(theme)
  );
};

export default ComponentsOverrides;
