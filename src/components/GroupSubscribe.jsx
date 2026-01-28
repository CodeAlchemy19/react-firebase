import { useEffect, useState, useRef } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
    IconButton,
    Divider
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import logo2 from './logo2.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';


const GroupSubscribe = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    const adminMobile = state.adminMobile;
    const documentId = state.documentId;
    const groupId = state.groupId;
    const phone = state.phone;
    console.log(state);

    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState(null);
    const [pricingOptions, setPricingOptions] = useState([]);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const paperRef = useRef(null);
    const payButtonRef = useRef(null);

    const user = localStorage.getItem("user");

    useEffect(() => {
        if (!user) window.location.href = '/';
        console.log("GroupSubscribe mounted, isAuth:", user);
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("user");
        window.location.href = '/subscribe';
    };

    // helper to convert period codes to readable labels
    const formatPeriodLabel = (amount, periodCode) => {
        if (!periodCode) return `INR ${amount}`;
        const p = String(periodCode).trim();
        // examples: 5d -> 5 days, 6m -> 6 months, 10D, 1y
        const match = p.match(/^(\d+)\s*([dDwWmMyY])$/);
        if (match) {
            const n = match[1];
            const unit = match[2].toLowerCase();
            const unitLabel = unit === 'd' ? 'day' : unit === 'w' ? 'week' : unit === 'm' ? 'month' : unit === 'y' ? 'year' : '';
            const plural = Number(n) > 1 ? 's' : '';
            return `INR ${amount} for ${n} ${unitLabel}${plural}`;
        }
        // fallback: use raw periodCode
        return `INR ${amount} ${periodCode}`;
    };

    useEffect(() => {
        if (!adminMobile || !documentId) {
            setLoading(false);
            return;
        }

        const fetchGroup = async () => {
            setLoading(true);
            try {
                const groupRef = doc(db, `Mobiles/${adminMobile}/Groups/${documentId}`);
                const snap = await getDoc(groupRef);
                if (!snap.exists()) {
                    setGroup(null);
                    setPricingOptions([]);
                } else {
                    const data = snap.data();
                    setGroup(data.name);

                    // Normalize pricing structure — try common fields, map-style objects, then fall back
                    let pricing = [];

                    pricing = Object.entries(data.map1).map(([amountKey, period], idx) => {
                        const amount = Number(amountKey) || 0;
                        const readable = formatPeriodLabel(amount, period);
                        return { id: `m${idx}`, label: readable, amount, desc: '' };
                    });

                    setPricingOptions(pricing);
                }
            } catch (err) {
                console.error('Error loading group:', err);
                setGroup(null);
                setPricingOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGroup();
    }, [location]);

    const handleSelect = (ev) => {
        setSelectedOptionId(ev.target.value);
        // give React a moment to render the button, then scroll it into view
        setTimeout(() => {
            if (payButtonRef.current) {
                payButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else if (paperRef.current) {
                // fallback: scroll paper to bottom
                paperRef.current.scrollTop = paperRef.current.scrollHeight;
            }
        }, 120);
    };

    const selectedOption = pricingOptions.find((p) => p.id === selectedOptionId);

    const handlePay = () => {
        // Navigate to a payment page (stub) with chosen details
        navigate('/payment', { state: { adminMobile, groupId: documentId, phone, option: selectedOption } });
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!adminMobile || !documentId) {
        return (
            <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6">Missing group parameters</Typography>
                    <Typography sx={{ mt: 2 }}>Please go back and enter Group admin mobile and Group ID.</Typography>
                    <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>Go back</Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#00DCC1', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ bgcolor: '#000', color: '#fff', py: 1 }}>
                <Container maxWidth={false} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img src={logo2} alt="logo" style={{ width: 36, height: 36 }} />
                        <Typography variant="h6">M7EE</Typography>
                    </Box>
                    <Button variant="outlined" sx={{ borderColor: '#00DCC1', color: '#00DCC1' }} onClick={handleLogout}>
                        Logout
                    </Button>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper ref={paperRef} sx={{ width: 360, borderRadius: 3, p: 3, maxHeight: '70vh', overflow: 'auto' }} elevation={4}>
                    {/* Back button + title at top of the form */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton onClick={() => navigate(-1)} size="small">
                            <ArrowBackIosNewIcon sx={{ color: '#000' }} />
                        </IconButton>
                        <Typography variant="h6" sx={{ ml: 1, fontWeight: 700 }}>Subscribe to group</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" color="textSecondary">Group name</Typography>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>{group}</Typography>

                    <Typography variant="h6" color="textSecondary">Group admin mobile number</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{adminMobile}</Typography>

                    <Typography variant="h6" color="textSecondary">Group ID</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{groupId}</Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" sx={{ mb: 1 }}>Pricing</Typography>

                    <RadioGroup value={selectedOptionId || ''} onChange={handleSelect}>
                        {pricingOptions
                            .filter((opt) => Number(opt.amount) !== 0)
                            .map((opt) => (
                                <Box key={opt.id} sx={{ mb: 1 }}>
                                    <FormControlLabel
                                        value={opt.id}
                                        control={<Radio />}
                                        label={<Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>{opt.label}</Typography>
                                            {opt.desc ? <Typography variant="body2" color="textSecondary">{opt.desc}</Typography> : null}
                                        </Box>}
                                    />
                                </Box>
                            ))}
                    </RadioGroup>

                    {selectedOption ? (
                        <Button ref={payButtonRef} fullWidth variant="contained" sx={{ mt: 1, bgcolor: '#008F7E', py: 1.25 }} onClick={handlePay} disabled={!adminMobile}>
                            Pay INR {selectedOption.amount}
                        </Button>
                    ) : (
                        // <Box sx={{ height: 52 }} />
                        <></>
                    )}
                </Paper>
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
        </Box>
    );
};

export default GroupSubscribe;
