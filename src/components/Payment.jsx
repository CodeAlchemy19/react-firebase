import { Box, Paper, Typography, Button, Container } from '@mui/material';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    const option = state.option;
    const groupId = state.groupId;
    const adminMobile = state.adminMobile;

    const user = localStorage.getItem("user");

    useEffect(() => {
        if (!user) navigate('/');
        console.log("Payment mounted, isAuth:", user);
    }, []);

    if (!option) {
        return (
            <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6">No payment option selected</Typography>
                    <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>Go back</Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6">Payment</Typography>
                    <Typography sx={{ mt: 2 }}>Group ID: {groupId}</Typography>
                    <Typography>Admin: {adminMobile}</Typography>

                    <Typography sx={{ mt: 2 }} variant="subtitle1">You will pay</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>INR {option.amount}</Typography>
                    <Typography color="textSecondary">{option.label}</Typography>

                    <Button sx={{ mt: 3 }} variant="contained" onClick={() => {
                        // This is a stub. Integrate actual payment flow here.
                        navigate('/');
                    }}>Complete payment (stub)</Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default Payment;
