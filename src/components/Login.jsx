import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    CircularProgress,
    Snackbar,
    Alert,
    InputAdornment,
    Modal,
    Paper,
} from '@mui/material';
import { auth, db, functions } from '../firebase';
import { RecaptchaVerifier, signInAnonymously } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import googlePlayImg from '../assets/google_play.png';
import logo from './logo1.png';
import { httpsCallable } from "firebase/functions";
import { doc, getDoc } from 'firebase/firestore';
import trans_logo from '../assets/logo_text.png';

let recaptchaVerifier;

const Login = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [sentOtp, setSentOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const initRecaptcha = () => {
        if (!recaptchaVerifier) {
            recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('Verified:', response);
                },
            });

            recaptchaVerifier.render().then(widgetId => {
                console.log('reCAPTCHA rendered with ID:', widgetId);
                window.recaptchaWidgetId = widgetId;
            });
        } else {
            console.log('reCAPTCHA already initialized');
        }
    }

    useEffect(() => {
        const signInAsGuest = async () => {
            try {
                await signInAnonymously(auth);
                console.log("Anonymous user:", auth.currentUser.uid);
            } catch (error) {
                console.error("Anonymous sign-in error:", error);
            }
        }
        signInAsGuest();
        initRecaptcha();
    }, []);

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const checkUserExists = async (phoneNo) => {
        if (!phoneNo) return false;

        try {
            const userRef = doc(db, "Mobiles", phoneNo);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                console.log("User exists:", userSnap.data());
                return true;
            } else {
                console.log("User does not exist");
                return false;
            }
        } catch (error) {
            console.error("Firestore error checking user:", error);
            return false;
        }
    }

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!phoneNumber || phoneNumber.length !== 10) {
            setSnackbar({
                open: true,
                message: 'Please enter a valid 10-digit phone number',
                severity: 'error'
            });
            return;
        }

        try {
            setLoading(true);
            // const formattedPhone = `+91${phoneNumber}`;
            // const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
            // setVerificationId(confirmationResult);

            if (!await checkUserExists(phoneNumber)) {
                setSnackbar({
                    open: true,
                    message: 'No user account found.',
                    severity: 'error'
                });
                return;
            }

            const sendOtpFn = httpsCallable(functions, "sendOtp");
            console.log(phoneNumber);
            const res = await sendOtpFn({ phone: phoneNumber });
            const data = res.data;
            setSentOtp(data.otp);

            setShowOTP(true);
            setSnackbar({
                open: true,
                message: 'Verification code sent successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error sending code:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Error sending verification code',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            setSnackbar({
                open: true,
                message: 'Please enter a valid 6-digit verification code',
                severity: 'error'
            });
            return;
        }

        try {
            setLoading(true);
            // await verificationId.confirm(verificationCode);
            // const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
            // const user = auth.currentUser;

            // const linkedUser = await linkWithCredential(user, credential);

            const verifyOtpFn = httpsCallable(functions, "verifyOtp");
            const res = await verifyOtpFn({ inputOtp: verificationCode, sentOtp });
            const data = res.data;

            if (data.status === "verified") {
                setSnackbar({
                    open: true,
                    message: 'Successfully logged in!',
                    severity: 'success'
                });
                // Navigate to Subscribe page with phone number
                recaptchaVerifier.clear();
                grecaptcha.reset(window.recaptchaWidgetId);
                initRecaptcha();
                localStorage.setItem("user", auth.currentUser.uid);
                navigate('/subscribe', { state: { phone: `+91${phoneNumber}` } });
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            setSnackbar({
                open: true,
                message: 'Invalid verification code',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Top black bar with centered mark image (outside the form) */}
            <Box component="header" sx={{ bgcolor: '#000', width: '100%', py: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={trans_logo} alt="M7EE" style={{ width: 140, height: 'auto' }} />
            </Box>

            {/* Main area with teal background and centered form */}
            <Box sx={{ width: '100%', minHeight: 'calc(100vh - 120px)', bgcolor: '#00DCC1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', px: 2 }}>
                {/* small square logo above the form (outside the form) */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <img src={logo} alt="logo" style={{ width: 140, height: 140, objectFit: 'contain' }} />
                </Box>

                <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                        component="form"
                        onSubmit={handleSendCode}
                        sx={{
                            width: '100%',
                            bgcolor: '#fff',
                            borderRadius: 2,
                            p: 3,
                            boxShadow: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        {/* Phone Input */}
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Mobile number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                            }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                maxLength: 10
                            }}
                            disabled={loading}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                bgcolor: '#008F7E',
                                '&:hover': { bgcolor: '#007A6B' }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                showOTP ? 'Verify' : 'Submit'
                            )}
                        </Button>
                    </Box>
                </Container>

                {/* Google Play button below the form */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={googlePlayImg}
                        alt="Get it on Google Play"
                        style={{ height: '40px', cursor: 'pointer' }}
                        onClick={() => window.open('https://google.com/', '_blank')}
                    />
                </Box>
            </Box>

            {/* Bottom black bar */}
            <Box component="footer" sx={{ bgcolor: '#000', width: '100%', py: 1.25, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography sx={{ color: '#fff', fontSize: 12 }}>LOGIN TO SUBSCRIBE TO A GROUP</Typography>
            </Box>

            {/* OTP Modal */}
            <Modal
                open={showOTP}
                onClose={() => setShowOTP(false)}
                aria-labelledby="otp-modal-title"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Paper
                    component="form"
                    onSubmit={handleVerifyCode}
                    sx={{
                        width: { xs: '90%', sm: '400px' },
                        p: 4,
                        outline: 'none',
                        borderRadius: 2
                    }}
                >
                    <Typography
                        id="otp-modal-title"
                        variant="h6"
                        component="h2"
                        align="center"
                        sx={{ mb: 3 }}
                    >
                        Enter Verification Code
                    </Typography>

                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Enter OTP"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                        inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 6
                        }}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            bgcolor: '#008F7E',
                            '&:hover': { bgcolor: '#007A6B' }
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Verify'
                        )}
                    </Button>
                </Paper>
            </Modal>

            <div id="recaptcha-container"></div>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Login;