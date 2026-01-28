import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    AppBar,
    Toolbar,
    Container,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { parsePhoneNumberFromString } from "libphonenumber-js";
import logo2 from "./logo2.png";


const Subscribe = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [adminMobile, setAdminMobile] = useState('');
    const [groupId, setGroupId] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [errors, setErrors] = useState({ adminMobile: '', groupId: '' });
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

    
    useEffect(() => {
        const user = localStorage.getItem("user");
        if (!user) window.location.href = '/';
        console.log("Subscribe mounted, isAuth:", user);
    }, []);

    useEffect(() => {
        // Prefer location state, then firebase auth currentUser
        const statePhone = location?.state?.phone;
        const authPhone = auth?.currentUser?.phoneNumber;
        setPhone(statePhone || authPhone || '');
    }, [location]);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("user").then(() => {
            window.location.href = '/';
        });
    };

    function getLocalPhoneNumber(fullNumber) {
        const phoneNumber = parsePhoneNumberFromString(fullNumber);
        if (phoneNumber) {
            return phoneNumber.nationalNumber; // ✅ local (without country code)
        }
        return "";
    }

    const checkGroupStatus = async (groupId, adminNumber) => {
        try {
            const groupsRef = collection(db, "Mobiles", adminNumber, "Groups");

            // Create a query to find documents where groupId equals targetGroupId
            const q = query(groupsRef, where("groupId", "==", groupId));

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("No matching document found.");
                return null;
            }

            // Since groupId should be unique, get the first matching document
            const doc = querySnapshot.docs[0];

            // Group found → check status
            const docData = doc.data();
            const status = docData.status;
            console.log(docData);
            if (!status) {
                return "Group status not found.";
            }

            switch (status) {
                case "deleted":
                    return {
                        msg: "Group doesn’t exist."
                    };
                case "inactive":
                    return {
                        msg: "Group is currently inactive."
                    };
                case "active":
                    return {
                        msg: "Group is active.",
                        id: doc.id
                    };
                default:
                    return {
                        msg: `Unknown status: ${status}`
                    };
            }
        } catch (error) {
            console.error("Error checking group:", error);
            return "An error occurred while checking the group.";
        }
    }

    const isSubmitDisabled =
        !groupId ||
        String(groupId).trim() === '' ||
        String(groupId).trim().length < 7 ||
        String(groupId).trim().length > 13 ||
        !adminMobile ||
        String(adminMobile).replace(/\D/g, '').length !== 10 ||
        loadingSubmit;

    const handleSubmit = (e) => {
        e.preventDefault();
        // client-side validation
        let ok = true;
        const newErrors = { adminMobile: '', groupId: '' };
        const adminDigits = String(adminMobile).replace(/\D/g, '');
        if (!adminMobile || adminDigits.length !== 10) {
            newErrors.adminMobile = 'Enter a valid 10-digit admin mobile';
            ok = false;
        }
        if (!groupId || String(groupId).trim() === '') {
            newErrors.groupId = 'Group ID is required';
            ok = false;
        } else if (
            String(groupId).trim().length < 7 ||
            String(groupId).trim().length > 13
        ) {
            newErrors.groupId = 'Group ID must be 7-13 characters';
            ok = false;
        }
        setErrors(newErrors);
        if (!ok) return;

        setLoadingSubmit(true);
        checkGroupStatus(String(groupId).trim(), adminDigits)
            .then(async (result) => {
                console.log(result);
                if (result.msg === "Group is active.") {
                    console.log(getLocalPhoneNumber(phone), groupId);
                    const userGroupRef = doc(db, "Mobiles", getLocalPhoneNumber(phone), "Groups", result.id);
                    const userGroupSnap = await getDoc(userGroupRef);

                    if (!userGroupSnap.exists()) {
                        setSnackbar({ open: true, message: "You are not a member of above group.", severity: 'error' });
                        setLoadingSubmit(false);
                    }

                    const joiningData = userGroupSnap.data();
                    console.log("JoiningData **********************", joiningData);

                    if (joiningData.joiningStatus !== "active") {
                        console.log("joiningStatus is not active");
                        setSnackbar({ open: true, message: "You are not an active member of above group.", severity: 'error' });
                        setLoadingSubmit(false);
                        return;
                    }

                    // Step 4️⃣ — Success (Active member)
                    setSnackbar({ open: true, message: "Welcome to the group.", severity: 'success' });
                    setLoadingSubmit(false);
                    navigate('/group-subscribe', { state: { phone: getLocalPhoneNumber(phone), adminMobile: adminDigits, groupId, documentId: result.id } });
                } else {
                    setSnackbar({ open: true, message: result.msg, severity: 'error' });
                    setLoadingSubmit(false);
                }
            })
            .catch((error) => {
                console.error("Error checking group:", error);
                setSnackbar({ open: true, message: "An error occurred while checking the group.", severity: 'error' });
                setLoadingSubmit(false);
            });
    };

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" sx={{ bgcolor: '#000', width: '100%' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* <Box sx={{ width: 36, height: 36, bgcolor: '#fff', borderRadius: 1 }} /> */}
                        <img src={logo2} style={{ width: "36px", height: "36px" }} />
                        <Typography variant="h6">M7EE</Typography>
                    </Box>
                    <Button variant="outlined" sx={{ borderColor: '#00DCC1', color: '#00DCC1' }} onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container
                maxWidth={false}
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2, sm: 4 }
                }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ width: { xs: '100%', sm: '75%', md: '50%', lg: '25%' }, bgcolor: '#fff', borderRadius: 2, p: 3, boxShadow: 3 }}>
                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                        Subscribe to a group
                    </Typography>

                    <TextField
                        fullWidth
                        variant="outlined"
                        value={phone}
                        disabled
                        sx={{ mb: 2 }}
                    // InputProps={{ startAdornment: <span style={{ padding: '0 12px' }}>+91</span> }}
                    />

                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Group admin mobile number"
                        value={adminMobile}
                        onChange={(e) => setAdminMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                        sx={{ mb: 2 }}
                        InputProps={{ startAdornment: <span style={{ padding: '0 12px' }}>+91</span> }}
                        error={Boolean(errors.adminMobile)}
                        helperText={errors.adminMobile}
                        disabled={loadingSubmit}
                    />

                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Group ID"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        sx={{ mb: 2 }}
                        error={Boolean(errors.groupId)}
                        helperText={errors.groupId}
                        disabled={loadingSubmit}
                    />

                    <Button type="submit" disabled={isSubmitDisabled || loadingSubmit} fullWidth variant="contained" sx={{ py: 1.5, bgcolor: '#008F7E', '&:hover': { bgcolor: '#007A6B' } }}>
                        {loadingSubmit ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
                    </Button>
                </Box>
            </Container>

            <Box sx={{ bgcolor: '#000', color: '#00DCC1', py: 1, textAlign: 'center' }}>
                {
                    auth.currentUser === null ? (
                        <Typography variant="caption">YOU HAVE BEEN LOGGED OUT.</Typography>
                    ) : (
                        <Typography variant="caption">YOU ARE LOGGED IN AS {phone}.</Typography>
                    )
                }
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Subscribe;
