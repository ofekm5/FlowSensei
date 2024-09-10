import { FC } from "react";
import { TextField as MuiTextField, TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(MuiTextField, { label: 'StyledTextField'})({
    // backgroundColor: '#1BB29C',

    // '& label.Mui-focused': {
    //     color: '#23dbb6',
    //     },
    //     '& .MuiInput-underline:after': {
    //     borderBottomColor: '#B2BAC2',
    //     },
    //     '& .MuiOutlinedInput-root': {
    //     '& fieldset': {
    //         borderColor: 'white',
    //     },
    //     '&:hover fieldset': {
    //         borderColor: '#23dbb6',
    //     },
    //     '&.Mui-focused fieldset': {
    //         borderColor: '#23dbb6',
    //     },
    // },
});

export const TextField: FC<TextFieldProps> = (props) => {
    return (
        <StyledTextField {...props}/>
    );
};