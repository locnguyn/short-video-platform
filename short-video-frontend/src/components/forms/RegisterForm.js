import { gql, useMutation } from "@apollo/client";
import { Button, Typography, useTheme } from "@mui/material";
import StyledForm from "../styledComponents/StyledForm";
import StyledTextField from "../styledComponents/StyledTextField";

const REGISTER_USER = gql`
  mutation RegisterUser($username: String!, $email: String!, $password: String!, $avatarFile: Upload) {
    registerUser(username: $username, email: $email, password: $password, avatarFile: $avatarFile) {
      token
      user {
        id
        username
        email
        profilePicture
      }
    }
  }
`;

const RegisterForm = ({ onSuccess }) => {
    const theme = useTheme();
    const [registerUser, { loading, error }] = useMutation(REGISTER_USER);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            const { data } = await registerUser({
                variables: {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    avatarFile: formData.get('avatarFile'),
                },
            });
            onSuccess(data.registerUser);
        } catch (err) {
            console.error('Registration error:', err);
        }
    };

    return (
        <StyledForm onSubmit={handleSubmit}>
            <Typography variant="h4" align="center" gutterBottom>
                Register
            </Typography>
            <StyledTextField
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
            />
            <StyledTextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
            />
            <StyledTextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
            />
            <Button
                variant="contained"
                component="label"
                fullWidth
            >
                Upload Avatar
                <input
                    type="file"
                    hidden
                    name="avatarFile"
                    accept="image/*"
                />
            </Button>
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
            >
                Sign Up
            </Button>
            {error && (
                <Typography color="error" align="center">
                    {error.message}
                </Typography>
            )}
        </StyledForm>
    );
};

export default RegisterForm;
