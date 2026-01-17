import useAuthStore from '../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  const login = async (credentials) => {
    try {
      store.setIsLoading(true);
      const token = 'mock-token';
      const user = { id: 1, name: 'User', email: credentials.email };
      
      store.setToken(token);
      store.setAuthenticated(true);
      store.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      store.setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      store.setIsLoading(true);
      store.reset();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      store.setIsLoading(false);
    }
  };

  return {
    // State
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    user: store.user,
    
    // Actions
    login,
    logout,
  };
};