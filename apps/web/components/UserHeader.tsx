'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserHeader() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-medium">{user.username}</p>         
        </div>
        <svg 
          className={`w-4 h-4 text-gray-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-20">
            <div className="py-2">          
              
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
