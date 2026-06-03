import { Avatar } from '@mui/material';
import CustomAccountCircleIcon from './CustomAccountCircleIcon';

const ChatAvatar = ({ avatarUrl, name, size = 44, iconColor = 'grey.500', sx} = {}) => {
    const trimmedSrc = avatarUrl?.trim();
    const src = trimmedSrc || undefined;

    return (
        <Avatar
            src={src}
            alt={name ||''}
            slotProps={{img: {referrerPolicy: 'no-referrer'}}}
            sx = {{
                width: size,
                height: size, 
                flexShrink: 0,
                ...sx,
            }}
        >
            {!src && <CustomAccountCircleIcon size={size} color={iconColor} />}
        </Avatar>
    )
}

export default ChatAvatar;