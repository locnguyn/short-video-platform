import { Facebook, Google } from "@mui/icons-material"
import { Button } from "@mui/material"


const OAuth2 = ({ handleLoginWithOAuth2Succes }) => {
    return (
        <>
            <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                // onClick={handleGoogleLogin}
                sx={{ mb: 1 }}
            >
                Tiếp tục với Google
            </Button>
            <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                // onClick={handleFacebookLogin}
                sx={{ mb: 1 }}
            >
                Tiếp tục với Facebook
            </Button>
        </>
    );
};


export default OAuth2;
