/**
 * SearchableSelect Component
 * A reusable select component that combines dropdown selection with search functionality
 * 
 * Features:
 * - Initially loads items from a list API
 * - Filters using search API when user types
 * - Keyboard navigation support
 * - Loading and error states
 * - Generic typing for reusability
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import { useLocalSearch } from '../hooks/useLocalSearch';
import type { SearchResult } from '../types/search.types';

export interface SearchableSelectProps<T = any> {
    /** Type of entity (items, customers, warehouses, etc.) */
    entityType: string;

    /** Currently selected value ID */
    value?: string;

    /** Callback when selection changes */
    onValueChange: (value: string) => void;

    /** Function to fetch initial list of items */
    listFetcher: () => Promise<T[]>;

    /** Function to format item label for display */
    labelFormatter: (item: T) => string;

    /** Key to use for the value field (default: 'id') */
    valueKey?: keyof T;

    /** Placeholder text */
    placeholder?: string;

    /** Disabled state */
    disabled?: boolean;

    /** Required field */
    required?: boolean;

    /** Additional CSS classes */
    className?: string;

    /** Loading state for initial list */
    isLoading?: boolean;

    /** Initial items list */
    items?: T[];
}

/**
 * SearchableSelect component
 * 
 * @example
 * ```tsx
 * <SearchableSelect
 *   entityType="items"
 *   value={selectedItemId}
 *   onValueChange={setSelectedItemId}
 *   listFetcher={async () => await itemApi.list(token, 1, 100)}
 *   labelFormatter={(item) => `${item.item_name} (${item.item_sku})`}
 *   valueKey="id"
 *   placeholder="Select an item..."
 * />
 * ```
 */
export function SearchableSelect<T extends Record<string, any>>({
    entityType,
    value,
    onValueChange,
    listFetcher,
    labelFormatter,
    valueKey = 'id' as keyof T,
    placeholder = 'Select...',
    disabled = false,
    required = false,
    className = '',
    isLoading: externalLoading = false,
    items: externalItems,
}: SearchableSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<T[]>(externalItems || []);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listError, setListError] = useState<Error | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Use the search hook for filtering
    const { data: searchData, isLoading: isSearching } = useLocalSearch(
        entityType,
        searchQuery
    );

    // Load initial items
    useEffect(() => {
        if (externalItems) {
            setItems(externalItems);
            return;
        }

        if (!isOpen || items.length > 0) return;

        const loadItems = async () => {
            setIsLoadingList(true);
            setListError(null);
            try {
                const fetchedItems = await listFetcher();
                setItems(fetchedItems);
            } catch (error) {
                setListError(error as Error);
            } finally {
                setIsLoadingList(false);
            }
        };

        loadItems();
    }, [isOpen, listFetcher, items.length, externalItems]);

    // Filter items based on search results
    const filteredItems = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) {
            return items;
        }

        if (!searchData?.results || searchData.results.length === 0) {
            return [];
        }

        // Filter items based on search results
        const searchResultIds = searchData.results.map((r: SearchResult) => r.entity_id);
        return items.filter((item) => searchResultIds.includes(String(item[valueKey])));
    }, [items, searchData, searchQuery, valueKey]);

    // Get selected item label
    const selectedItem = items.find((item) => String(item[valueKey]) === value);
    const selectedLabel = selectedItem ? labelFormatter(selectedItem) : placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Handle item selection
    const handleSelect = (item: T) => {
        onValueChange(String(item[valueKey]));
        setIsOpen(false);
        setSearchQuery('');
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    const isLoading = externalLoading || isLoadingList;
    const showLoading = isLoading || isSearching;

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between px-3 py-2
          text-sm text-left
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          dark:focus:ring-blue-400 dark:focus:border-blue-400
          transition-colors duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}
          ${!selectedItem ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}
        `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-required={required}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown
                    className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden"
                    role="listbox"
                >
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Search ${entityType}...`}
                                className="w-full pl-10 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            {searchQuery.length > 0 && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <X className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="overflow-y-auto max-h-60">
                        {showLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                            </div>
                        ) : listError ? (
                            <div className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">
                                Error loading items: {listError.message}
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery.length >= 2 ? 'No items found' : 'Start typing to search...'}
                            </div>
                        ) : (
                            <ul role="listbox">
                                {filteredItems.map((item) => {
                                    const itemValue = String(item[valueKey]);
                                    const isSelected = itemValue === value;

                                    return (
                                        <li
                                            key={itemValue}
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelect(item)}
                                            className={`
                        px-3 py-2 cursor-pointer flex items-center justify-between
                        transition-colors duration-150
                        ${isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                }
                      `}
                                        >
                                            <span className="text-sm truncate">{labelFormatter(item)}</span>
                                            {isSelected && (
                                                <Check className="w-4 h-4 ml-2 flex-shrink-0" aria-hidden="true" />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchableSelect;
