import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { Utils } from '@iobroker/adapter-react-v5';

import cls from './style.module.scss';

const CustomButton = ({ fullWidth, active, size, onClick, style, className, startIcon, square, children }) => {
    return <Button
        variant="outlined"
        color="primary"
        onClick={onClick}
        fullWidth={fullWidth}
        style={style}
        className={Utils.clsx(cls.root, active && cls.active, className, square ? cls.square : '')}
        margin="normal"
        size={size}
        startIcon={startIcon}
    >
        {children}
    </Button>;
}

CustomButton.defaultProps = {
    className: null,
    variant: 'standard',
    size: 'medium',
    fullWidth: false,
    square: false,
    active: false,
    startIcon: null
};

CustomButton.propTypes = {
    type: PropTypes.string,
    style: PropTypes.object,
};

export default CustomButton;