import { useState, useEffect, useMemo } from 'react';
import adminApiClient from '../services/adminApiClient';

// Custom hook for API data fetching with loading and error states
export const useAdminAPI = (apiMethod, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiMethod();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// Custom hook for table filtering
export const useTableFilter = (data, filters) => {
  return useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.filter((item) => {
      // Tab filter
      if (filters.tab && filters.tab !== 'All') {
        const itemStatus = (item.status || '').toUpperCase();
        const filterTab = filters.tab.toUpperCase();
        if (itemStatus !== filterTab) return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = filters.searchFields || ['name', 'email'];
        
        const matchesSearch = searchableFields.some((field) => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
        
        if (!matchesSearch) return false;
      }

      // Custom filters
      if (filters.custom) {
        for (const [key, value] of Object.entries(filters.custom)) {
          if (value && value !== 'All' && !value.startsWith('All ')) {
            const itemValue = (item[key] || '').toString().toLowerCase();
            const filterValue = value.toString().toLowerCase();
            if (itemValue !== filterValue) return false;
          }
        }
      }

      // Date range filter
      if (filters.dateRange && filters.dateField) {
        const itemDate = new Date(item[filters.dateField]);
        const now = new Date();

        switch (filters.dateRange) {
          case 'Today':
            if (
              itemDate.getDate() !== now.getDate() ||
              itemDate.getMonth() !== now.getMonth() ||
              itemDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
            break;

          case 'This Week': {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            if (itemDate < weekStart || itemDate >= weekEnd) return false;
            break;
          }

          case 'This Month':
            if (
              itemDate.getMonth() !== now.getMonth() ||
              itemDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
            break;

          case 'This Year':
            if (itemDate.getFullYear() !== now.getFullYear()) return false;
            break;

          default:
            break;
        }
      }

      return true;
    });
  }, [data, filters]);
};

// Custom hook for debouncing values
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for pagination
export const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

// Custom hook for sorting
export const useSort = (data, initialSortKey = null, initialSortOrder = 'asc') => {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Convert to comparable values
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return { sortedData, sortKey, sortOrder, toggleSort };
};

// Custom hook for toast notifications
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    remove: removeToast,
  };
};
