import { FC, ReactNode } from "react";
import { Button as MuiButton, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton, { label: 'StyledButton'})({
    // backgroundColor: '#23dbb6',

    // ':hover': {
    //     backgroundColor: '#20c8a8',
    // }
});

interface IProps extends ButtonProps {  // Extend the interface with ButtonProps
    children: ReactNode;
}

export const Button: FC<IProps> = ({ children, ...props }) => {
    return (
        <StyledButton {...props}>
            {children}
        </StyledButton>
    );
};
