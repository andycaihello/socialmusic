import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ConfigProvider } from 'antd';
import store from './store';
import { getCurrentUser } from './store/authSlice';
import PrivateRoute from './routes/PrivateRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SongDetail from './pages/SongDetail';
import Profile from './pages/Profile';
import UserDetail from './pages/UserDetail';
import Messages from './pages/Messages';

// App content component that uses hooks
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Try to get current user if token exists
    const token = localStorage.getItem('access_token');
    if (token && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Register />
          }
        />

        {/* Private routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout>
                <Home />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/songs/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <SongDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/user/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <UserDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <MainLayout>
                <Messages />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <PrivateRoute>
              <MainLayout>
                <Messages />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
}

export default App
