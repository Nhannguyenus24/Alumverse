import { useState } from 'react';

/** IconButton (default ⋯) + Menu. `children={({ close }) => ...}` renders menu body (MenuItem, etc.). */
const IconButtonMenu = ({
  buttonAriaLabel,
  menuId,
  icon = <MoreHorizIcon />,
  children,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  transformOrigin = { vertical: 'top', horizontal: 'right' },
  IconButtonProps = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { sx: iconButtonSx, onClick: iconOnClick, ...restIconButtonProps } = IconButtonProps;

  const handleOpen = (event) => {
    iconOnClick?.(event);
    if (event.defaultPrevented) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        {...restIconButtonProps}
        size="small"
        aria-label={buttonAriaLabel}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
        sx={{ flexShrink: 0, ...iconButtonSx }}
      >
        {icon}
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableScrollLock
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              borderRadius: 2,
            },
          },
        }}
      >
        {typeof children === 'function' ? children({ close: handleClose }) : null}
      </Menu>
    </>
  );
};

export default IconButtonMenu;
