import { Avatar } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CustomAccountCircleIcon from './CustomAccountCircleIcon';

const ChatAvatar = ({
    avatarUrl,
    name,
    size = 44,
    iconColor = 'grey.500',
    variant = 'user',
    sx,
} = {}) => {
    const trimmedSrc = avatarUrl?.trim();
    const src = trimmedSrc || undefined;

    const fallbackIcon =
        variant === 'group' ? (
            <GroupsIcon sx={{ width: size, height: size, color: iconColor }} />
        ) : (
            <CustomAccountCircleIcon size={size} color={iconColor} />
        );

    return (
        <Avatar
            src={src}
            alt={name || ''}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{
                width: size,
                height: size,
                flexShrink: 0,
                ...sx,
            }}
        >
            {!src && fallbackIcon}
        </Avatar>
    );
};

export default ChatAvatar;