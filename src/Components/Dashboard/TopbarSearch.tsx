'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Home, Users, Briefcase, User as UserIcon, FileText, BookOpen, Calendar, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { searchDashboard } from '@/services/api';
import { useDebouncedCallback } from '@/lib/debounce';
import type { SearchResult } from '@/types';
import './TopbarSearch.css';

const PAGE_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: 'home', category: 'Pages' },
  { name: 'Manage Members', path: '/members/manage', icon: 'users', category: 'Pages' },
  { name: 'Add Member', path: '/members/add', icon: 'users', category: 'Pages' },
  { name: 'Home Groups', path: '/members/home-groups', icon: 'users', category: 'Pages' },
  { name: 'Manage Ministries', path: '/ministries/manage', icon: 'briefcase', category: 'Pages' },
  { name: 'Add Ministry', path: '/ministries/add', icon: 'briefcase', category: 'Pages' },
  { name: 'Bible Study', path: '/bible-study', icon: 'book', category: 'Pages' },
  { name: 'Schedule Management', path: '/schedule', icon: 'calendar', category: 'Pages' },
  { name: 'Settings', path: '/settings', icon: 'settings', category: 'Pages' },
  { name: 'Help Center', path: '/help', icon: 'help', category: 'Pages' },
  { name: 'Subscription', path: '/subscription', icon: 'file', category: 'Pages' },
];

function getPageIcon(iconName: string) {
  const size = 16;
  switch (iconName) {
    case 'home': return <Home size={size} />;
    case 'users': return <Users size={size} />;
    case 'briefcase': return <Briefcase size={size} />;
    case 'book': return <BookOpen size={size} />;
    case 'calendar': return <Calendar size={size} />;
    case 'settings': return <SettingsIcon size={size} />;
    case 'help': return <HelpCircle size={size} />;
    default: return <FileText size={size} />;
  }
}

function getCategoryIcon(category: string) {
  if (category === 'Members') return <Users size={16} />;
  if (category === 'Ministries') return <Briefcase size={16} />;
  if (category === 'Users') return <UserIcon size={16} />;
  return <FileText size={16} />;
}

export default function TopbarSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runServerSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) return [];
    try {
      setIsSearching(true);
      const results = await searchDashboard(query);
      return results.map((item) => ({
        id: `${item.category}-${item.id}`,
        label: item.label,
        sublabel: item.sublabel,
        category: item.category,
        icon: getCategoryIcon(item.category),
        action: () => router.push(item.path),
      }));
    } catch {
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [router]);

  const debouncedServerSearch = useDebouncedCallback(
    async (query: string, pageResults: SearchResult[]) => {
      const apiResults = await runServerSearch(query);
      setSearchResults([...pageResults, ...apiResults].slice(0, 15));
      setIsSearchOpen(pageResults.length + apiResults.length > 0);
    },
    300,
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const pageResults: SearchResult[] = PAGE_ITEMS
      .filter((page) => page.name.toLowerCase().includes(q))
      .map((page) => ({
        id: `page-${page.path}`,
        label: page.name,
        sublabel: page.path,
        category: 'Pages',
        icon: getPageIcon(page.icon),
        action: () => router.push(page.path),
      }));

    setSearchResults(pageResults);
    setIsSearchOpen(pageResults.length > 0);
    debouncedServerSearch(query, pageResults);
  }, [debouncedServerSearch, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && e.target instanceof Node && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      searchResults[selectedIndex].action();
      setSearchQuery('');
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    result.action();
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {});

  return (
    <div className="global-search-container" ref={searchRef}>
      <div className="search-wrapper">
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search pages, users, members..."
          aria-label="Search pages, users, and members"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim()) setIsSearchOpen(searchResults.length > 0);
          }}
          onKeyDown={handleSearchKeyDown}
        />
        <kbd className="search-shortcut">Ctrl+K</kbd>
      </div>

      {isSearchOpen && (
        <div className="search-results-dropdown">
          {isSearching && <div className="search-results-status">Searching...</div>}
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category} className="search-results-group">
              <div className="search-results-category">{category}</div>
              {items.map((result) => {
                const globalIdx = searchResults.indexOf(result);
                return (
                  <div
                    key={result.id}
                    className={`search-result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                  >
                    <span className="search-result-icon">{result.icon}</span>
                    <div className="search-result-text">
                      <span className="search-result-label">{result.label}</span>
                      <span className="search-result-sublabel">{result.sublabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
