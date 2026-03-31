import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { getProfile } from '../features/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (!user && isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, user, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isAdmin: user?.isAdmin || false
  };
};