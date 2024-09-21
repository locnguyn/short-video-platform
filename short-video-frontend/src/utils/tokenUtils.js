export const saveToken = (token) => {
    localStorage.setItem('authToken', token);
};

export const getToken = () => {
    return localStorage.getItem('authToken');
};

const removeToken = () => {
    localStorage.removeItem('authToken');
};
