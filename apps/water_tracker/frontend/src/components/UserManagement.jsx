import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    // Add User State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'Viewer',
        can_access_operations: false,
        can_access_master_data: false,
        can_access_reports: true,
        can_manage_users: false
    });

    // Edit User State
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState({ id: '', username: '', role: 'Viewer' });

    // Backup & Restore state
    const fileInputRef = useRef(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Auth context to prevent deleting self
    const { user: currentUser } = useAuth();

    const getDefaultPermissionsForRole = (role) => {
        switch (role) {
            case 'Admin':
                return {
                    can_access_operations: true,
                    can_access_master_data: true,
                    can_access_reports: true,
                    can_manage_users: true
                };
            case 'Data_Entry':
                return {
                    can_access_operations: true,
                    can_access_master_data: true,
                    can_access_reports: true,
                    can_manage_users: false
                };
            case 'Viewer':
            default:
                return {
                    can_access_operations: false,
                    can_access_master_data: false,
                    can_access_reports: true,
                    can_manage_users: false
                };
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // First fetch the reset requests
            const requestsResponse = await api.get('password-reset-requests/');
            const requestsData = requestsResponse.data.results || requestsResponse.data || [];
            if (Array.isArray(requestsData)) {
                setPendingRequests(requestsData.filter(req => req.status === 'Pending'));
            }

            // To Do: Fetch actual users. For now just resetting the password is the priority feature.
            const usersResponse = await api.get('users/');
            const usersData = usersResponse.data.results || usersResponse.data || [];
            setUsers(Array.isArray(usersData) ? usersData : []);

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveClick = (request) => {
        setSelectedRequest(request);
        setNewPassword('');
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword) return;

        setIsResolving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await api.post(`password-reset-requests/${selectedRequest.id}/resolve/`, {
                new_password: newPassword
            });

            setSuccessMessage(response.data.message || 'Password resolved successfully.');
            setSelectedRequest(null);
            fetchData(); // Refresh list automatically

            // Clear message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resolve password.');
        } finally {
            setIsResolving(false);
        }
    };

    const handleDirectResetClick = (user) => {
        setSelectedUserForReset(user);
        setNewPassword('');
    };

    const handleDirectResetSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword) return;

        setIsResolving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await api.post(`users/${selectedUserForReset.id}/reset_password/`, {
                new_password: newPassword
            });

            setSuccessMessage(response.data.message || `Password for ${selectedUserForReset.username} reset successfully.`);
            setSelectedUserForReset(null);
            fetchData(); // Refresh pending requests in case any were automatically resolved

            // Clear message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password.');
        } finally {
            setIsResolving(false);
        }
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setIsResolving(true);

        try {
            await api.post('users/', newUser);
            setSuccessMessage(`User ${newUser.username} created successfully.`);
            setIsAddUserOpen(false);
            setNewUser({
                username: '', password: '', role: 'Viewer',
                can_access_operations: false, can_access_master_data: false,
                can_access_reports: true, can_manage_users: false
            });
            fetchData();
        } catch (err) {
            const errorData = err.response?.data;
            let errorMsg = 'Failed to create user.';
            // DRF returns errors in a dict format e.g {"username": ["A user with that username already exists."]}
            if (errorData) {
                if (typeof errorData === 'object') {
                    errorMsg = Object.values(errorData).flat().join(' ');
                } else {
                    errorMsg = errorData;
                }
            }
            setError(errorMsg);
        } finally {
            setIsResolving(false);
        }
    };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setIsResolving(true);

        try {
            await api.patch(`users/${userToEdit.id}/`, {
                username: userToEdit.username,
                role: userToEdit.role,
                can_access_operations: userToEdit.can_access_operations,
                can_access_master_data: userToEdit.can_access_master_data,
                can_access_reports: userToEdit.can_access_reports,
                can_manage_users: userToEdit.can_manage_users
            });
            setSuccessMessage(`User details updated successfully.`);
            setIsEditUserOpen(false);
            fetchData();
        } catch (err) {
            const errorData = err.response?.data;
            let errorMsg = 'Failed to update user.';
            if (errorData) {
                if (typeof errorData === 'object') {
                    errorMsg = Object.values(errorData).flat().join(' ');
                } else {
                    errorMsg = errorData;
                }
            }
            setError(errorMsg);
        } finally {
            setIsResolving(false);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to permanently delete user '${username}'?`)) return;

        try {
            await api.delete(`users/${userId}/`);
            setSuccessMessage(`User ${username} deleted successfully.`);
            setUsers(users.filter(u => u.id !== userId));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete user.');
        }
    };

    const handlePermissionToggle = async (userId, field, currentValue) => {
        try {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, [field]: !currentValue } : u));

            await api.patch(`users/${userId}/`, {
                [field]: !currentValue
            });
            setSuccessMessage('Permissions updated successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update permissions');
            // Revert state on error
            setUsers(users.map(u => u.id === userId ? { ...u, [field]: currentValue } : u));
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        setError(null);
        try {
            const response = await api.get('system/backup/', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `water_tracker_db_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccessMessage('Backup downloaded successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Failed to download backup');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleRestoreFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm(`Are you sure you want to RESTORE the database from '${file.name}'? This will replace all current data. A temporary backup of the current database will be created on the server.`)) {
            event.target.value = '';
            return;
        }

        setIsRestoring(true);
        setError(null);
        setSuccessMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('system/restore/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccessMessage('Database restored successfully! The page will now reload.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to restore database');
            event.target.value = '';
        } finally {
            setIsRestoring(false);
        }
    };

    const handleResetDatabase = async () => {
        if (!window.confirm("Are you absolutely sure you want to RESET THE ENTIRE DATABASE? This will delete ALL data and restore the application to its initial state. A temporary backup will be created on the server before proceeding.")) {
            return;
        }

        setIsResetting(true);
        setError(null);
        setSuccessMessage('');

        try {
            await api.post('system/reset/');
            setSuccessMessage('Database reset successfully! The page will now reload.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset database.');
        } finally {
            setIsResetting(false);
        }
    };

    if (loading) return <div className="p-4">Loading active requests...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg mb-6">
                    {successMessage}
                </div>
            )}

            <div className="space-y-8">
                {/* Pending Requests Column */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Pending Password Resets
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {pendingRequests.length}
                            </span>
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {pendingRequests.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No pending password reset requests.
                            </div>
                        ) : (
                            pendingRequests.map(request => (
                                <div key={request.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{request.username}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{request.email}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                            Requested: {new Date(request.requested_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleResolveClick(request)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Users Column Placeholder */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            System Users & Access Control
                        </h2>
                        <button
                            onClick={() => setIsAddUserOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Operations</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Master Data</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Reports</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mng Users</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 group">
                                        <td className="px-6 py-4 whitespace-nowrap flex items-center justify-between">
                                            <div>
                                                <button
                                                    onClick={() => handleDirectResetClick(u)}
                                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:outline-none"
                                                    title={`Reset password for ${u.username}`}
                                                >
                                                    {u.username}
                                                </button>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{u.role}</div>
                                            </div>
                                            {currentUser?.id !== u.id && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex items-center space-x-3">
                                                    <button
                                                        onClick={() => { setUserToEdit(u); setIsEditUserOpen(true); }}
                                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title={`Edit user ${u.username}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                        title={`Delete user ${u.username}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <input type="checkbox" checked={u.can_access_operations} onChange={() => handlePermissionToggle(u.id, 'can_access_operations', u.can_access_operations)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <input type="checkbox" checked={u.can_access_master_data} onChange={() => handlePermissionToggle(u.id, 'can_access_master_data', u.can_access_master_data)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <input type="checkbox" checked={u.can_access_reports} onChange={() => handlePermissionToggle(u.id, 'can_access_reports', u.can_access_reports)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <input type="checkbox" checked={u.can_manage_users} onChange={() => handlePermissionToggle(u.id, 'can_manage_users', u.can_manage_users)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Database Management Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 4h16m-16 4h16" /></svg>
                            Database Management
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border border-blue-100 dark:border-blue-900/30 rounded-lg bg-blue-50/20 dark:bg-blue-900/10">
                                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wider">Backup Data</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                                    Download a complete JSON backup of the application database. Recommended to do regularly.
                                </p>
                                <button
                                    onClick={handleBackup}
                                    disabled={isBackingUp}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {isBackingUp ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
                                    ) : (
                                        <><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download JSON Backup</>
                                    )}
                                </button>
                            </div>

                            <div className="p-4 border border-red-100 dark:border-red-900/30 rounded-lg bg-red-50/20 dark:bg-red-900/10">
                                <h3 className="text-sm font-bold text-red-900 dark:text-red-300 mb-2 uppercase tracking-wider">Restore Data</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                                    Upload a previously backed-up JSON file to restore the database. <span className="font-bold text-red-600 dark:text-red-400">Warning: This overrides all current data.</span>
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleRestoreFileChange}
                                    className="hidden"
                                    accept=".json"
                                />
                                <button
                                    onClick={handleRestoreClick}
                                    disabled={isRestoring}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {isRestoring ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Restoring...</>
                                    ) : (
                                        <><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg> Restore from File</>
                                    )}
                                </button>
                            </div>

                            {/* Database Reset Section */}
                            <div className="p-4 border border-red-200 dark:border-red-900/40 rounded-lg bg-red-100/10 dark:bg-red-900/5 mt-4">
                                <h3 className="text-sm font-bold text-red-600 dark:text-red-500 mb-2 uppercase tracking-wider">Danger Zone: Reset Database</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">
                                    Permanently delete all data and reset to initial state. A server-side backup will be created first.
                                </p>
                                <button
                                    onClick={handleResetDatabase}
                                    disabled={isResetting}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 dark:border-red-900/50 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                >
                                    {isResetting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting...
                                        </>
                                    ) : 'Reset Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resolve Modal (For User Requests) */}
            {selectedRequest && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" onClick={() => setSelectedRequest(null)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200 dark:border-slate-700">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                        Resolve Password Reset
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Enter a new temporary password for <strong>{selectedRequest.username}</strong>. They should be advised to change this immediately upon logging in (feature pending).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleResolveSubmit} className="mt-5 sm:mt-6">
                                <div>
                                    <label htmlFor="newPasswordRequest" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                    <input
                                        type="text"
                                        name="newPassword"
                                        id="newPasswordRequest"
                                        required
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2"
                                        placeholder="Enter secure password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isResolving}
                                    />
                                </div>
                                <div className="mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={isResolving}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {isResolving ? 'Saving...' : 'Set New Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Reset Modal (For Admin Click) */}
            {selectedUserForReset && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title-direct" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" onClick={() => setSelectedUserForReset(null)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200 dark:border-slate-700">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title-direct">
                                        Force Password Reset
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Set a new password for <strong>{selectedUserForReset.username}</strong> immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleDirectResetSubmit} className="mt-5 sm:mt-6">
                                <div>
                                    <label htmlFor="newPasswordDirect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                    <input
                                        type="text"
                                        name="newPassword"
                                        id="newPasswordDirect"
                                        required
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2"
                                        placeholder="Enter secure password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isResolving}
                                    />
                                </div>
                                <div className="mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={isResolving}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {isResolving ? 'Saving...' : 'Set New Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserForReset(null)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" onClick={() => setIsAddUserOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6 border border-gray-200 dark:border-slate-700">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                        Add New User
                                    </h3>
                                    <div className="mt-4 text-left">
                                        <form id="addUserForm" onSubmit={handleAddUserSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Username</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoComplete="off"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={newUser.username}
                                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Temporary Password</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={newUser.password}
                                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
                                                <select
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    value={newUser.role}
                                                    onChange={(e) => {
                                                        const role = e.target.value;
                                                        setNewUser({ ...newUser, role, ...getDefaultPermissionsForRole(role) });
                                                    }}
                                                >
                                                    <option value="Viewer">Viewer</option>
                                                    <option value="Data_Entry">Data Entry</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </div>

                                            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Initial Access Permissions</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center">
                                                        <input type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                            checked={newUser.can_access_operations}
                                                            onChange={(e) => setNewUser({ ...newUser, can_access_operations: e.target.checked })}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Operations (Tracking, Entries)</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                            checked={newUser.can_access_master_data}
                                                            onChange={(e) => setNewUser({ ...newUser, can_access_master_data: e.target.checked })}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Master Data (Locations, Rates)</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                            checked={newUser.can_access_reports}
                                                            onChange={(e) => setNewUser({ ...newUser, can_access_reports: e.target.checked })}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Reports (Analytics, Dashboards)</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                            checked={newUser.can_manage_users}
                                                            onChange={(e) => setNewUser({ ...newUser, can_manage_users: e.target.checked })}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Manage Users (Add/Delete/Reset)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="submit"
                                    form="addUserForm"
                                    disabled={isResolving}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {isResolving ? 'Creating...' : 'Create User'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
                                    onClick={() => setIsAddUserOpen(false)}
                                    disabled={isResolving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditUserOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" onClick={() => setIsEditUserOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6 border border-gray-200 dark:border-slate-700">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                        Edit User
                                    </h3>
                                    <div className="mt-4 text-left">
                                        <form id="editUserForm" onSubmit={handleEditUserSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Username</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoComplete="off"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={userToEdit.username}
                                                        onChange={(e) => setUserToEdit({ ...userToEdit, username: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
                                                    <select
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={userToEdit.role}
                                                        onChange={(e) => {
                                                            const role = e.target.value;
                                                            setUserToEdit({ ...userToEdit, role, ...getDefaultPermissionsForRole(role) });
                                                        }}
                                                    >
                                                        <option value="Viewer">Viewer</option>
                                                        <option value="Data_Entry">Data Entry</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="submit"
                                    form="editUserForm"
                                    disabled={isResolving}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {isResolving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
                                    onClick={() => setIsEditUserOpen(false)}
                                    disabled={isResolving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
