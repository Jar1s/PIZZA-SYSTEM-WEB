'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminContext } from '@/app/admin/admin-context';
import { getTenantSlug } from '@/lib/tenant-utils';
import { handleAdmin401Response } from '@/lib/api-helpers';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneVerified: boolean;
  isActive: boolean;
  orderCount: number;
  totalSpentCents: number;
  createdAt: string;
  updatedAt: string;
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { selectedTenant } = useAdminContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    customer: Customer | null;
  }>({ show: false, customer: null });
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      console.log('Fetching customers - API_URL:', API_URL, 'Has token:', !!token, 'User role:', user?.role);

      if (!token) {
        throw new Error('Not authenticated - Please log in again');
      }

      if (!user || user.role !== 'ADMIN') {
        throw new Error('Access denied - Only admins can view customers');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (selectedTenant && selectedTenant !== 'all') {
        params.append('tenantSlug', normalizeTenant(selectedTenant));
      }

      if (search) {
        params.append('search', search);
      }

      const res = await fetch(`${API_URL}/api/admin/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Session expired - redirect to login
          console.error('401 Unauthorized - Session expired, redirecting to login');
          handleAdmin401Response();
          return;
        }
        if (res.status === 404) {
          throw new Error('Endpoint not found. Please ensure backend is running and restarted after adding the customers endpoint.');
        }
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('Failed to fetch customers:', res.status, errorText);
        throw new Error(`Failed to fetch customers: ${res.status} ${errorText}`);
      }

      const data: CustomersResponse = await res.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTenant, user]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'OPERATOR')) {
      fetchCustomers();
    }
  }, [page, user, fetchCustomers]);

  // Refetch on tenant change
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'OPERATOR')) {
      setPage(1);
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  useEffect(() => {
    if ((user?.role === 'ADMIN' || user?.role === 'OPERATOR') && search !== '') {
      const timeoutId = setTimeout(() => {
        setPage(1);
        fetchCustomers();
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteConfirm({ show: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.customer) return;

    setDeleting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(
        `${API_URL}/api/admin/customers/${deleteConfirm.customer.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          // Session expired - redirect to login
          console.error('401 Unauthorized - Session expired, redirecting to login');
          handleAdmin401Response();
          return;
        }
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete customer' }));
        throw new Error(errorData.message || 'Failed to delete customer');
      }

      // Remove customer from list
      setCustomers(customers.filter((c) => c.id !== deleteConfirm.customer!.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      setDeleteConfirm({ show: false, customer: null });
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, customer: null });
  };

  const normalizeTenant = (slug: string) => {
    if (slug === 'p0rnopizza') return 'pornopizza';
    if (slug === 'pizzaparty') return 'partypizza';
    return slug;
  };

  // Show loading while checking user role
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">Only administrators can view the customer list.</p>
        <p className="text-sm text-red-500 mt-2">Your role: {user.role}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold">Customers</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} customers
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      )}

      {/* Customers - Mobile Card View */}
      {!loading && !error && (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {customers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No customers found
              </div>
            ) : (
              customers.map((customer) => (
                <div key={customer.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {customer.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name || 'No name'}
                        </div>
                        {customer.email && (
                          <div className="text-xs text-gray-500 mt-1">{customer.email}</div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">{customer.phone}</span>
                        {customer.phoneVerified && (
                          <span className="text-green-500" title="Phone verified">✓</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Orders:</span>
                      <span className="text-gray-900 font-semibold">{customer.orderCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="text-gray-900 font-semibold">€{(customer.totalSpentCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Registered:</span>
                      <span className="text-gray-900">
                        {new Date(customer.createdAt).toLocaleDateString('sk-SK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteClick(customer)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-orange-600 font-semibold">
                                {customer.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name || 'No name'}
                              </div>
                              {customer.email && (
                                <div className="text-sm text-gray-500">{customer.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.phone ? (
                              <div className="flex items-center gap-2">
                                <span>{customer.phone}</span>
                                {customer.phoneVerified && (
                                  <span className="text-green-500" title="Phone verified">
                                    ✓
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No phone</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">
                            {customer.orderCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            €{(customer.totalSpentCents / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString('sk-SK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteClick(customer)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-xs"
                            title="Delete customer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="hidden sm:block text-sm text-gray-700">
                Showing {((page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} customers
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 flex items-center">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.customer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete customer{' '}
              <span className="font-semibold">{deleteConfirm.customer.name}</span>?
            </p>
            {deleteConfirm.customer.email && (
              <p className="text-sm text-gray-500 mb-4">
                Email: {deleteConfirm.customer.email}
              </p>
            )}
            {deleteConfirm.customer.orderCount > 0 && (
              <p className="text-sm text-orange-600 mb-4">
                ⚠️ This customer has {deleteConfirm.customer.orderCount} order(s). 
                The customer will be deleted, but orders will remain for historical records.
              </p>
            )}
            <p className="text-sm text-red-600 mb-6 font-semibold">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
