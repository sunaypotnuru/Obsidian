import AdminRoute from './AdminRoute';
import AdminLayout from '../pages/admin/AdminLayout';

export default function AdminLayoutWrapper() {
    return (
        <AdminRoute>
            <AdminLayout />
        </AdminRoute>
    );
}
