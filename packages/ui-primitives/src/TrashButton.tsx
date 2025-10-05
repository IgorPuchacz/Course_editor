import React from 'react'
import { Trash2 } from 'lucide-react'

interface TrashButtonProps {
    size: number;
    disabled: boolean
    onClick?: () => void
}

export const TrashButton: React.FC<TrashButtonProps> = ({
    size,
    disabled,
    onClick,
}) => {


    return (
        <button
            onClick = {onClick}
            disabled={disabled}
        >
        <Trash2/>
        </button>
    )
}



export default TrashButton;