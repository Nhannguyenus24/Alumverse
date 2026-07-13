import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const CustomAccountCircleIcon = ({size = 44, color = 'grey.500', sx} = {}) => {
  return <AccountCircleIcon sx={[{width: size, height: size, color}, sx]}/>;
};

export default CustomAccountCircleIcon;